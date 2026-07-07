import os
import glob
import fitz  # PyMuPDF
import json
import time
import re
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Clients
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase init error: {e}")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/casebooks"))

def extract_toc(pdf_path, max_pages=25):
    """Extracts first max_pages and asks Groq to find the Table of Contents for actual cases."""
    print("  -> Extracting TOC pages...")
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for i in range(min(max_pages, len(doc))):
            text += doc[i].get_text("text") + f"\n\n--- PAGE {i} ---\n\n"
        
        prompt = f"""
        You are an expert parsing a consulting casebook. 
        Analyze the following text (the first {max_pages} pages) and find the Table of Contents.
        Extract ONLY the actual practice cases and guesstimates. 
        IGNORE strategy chapters, preparation tips, frameworks, and author bios.
        
        Return ONLY a JSON object in this exact format:
        {{
            "cases": [
                {{
                    "title": "Case Name",
                    "printed_page_num": 12,
                    "case_type": "Profitability" # Categorize as Profitability, Market Entry, Guesstimate, Pricing, M&A, etc.
                }}
            ]
        }}
        
        Raw Text:
        {text[:12000]}
        """
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.post(url, json=payload)
            response_json = response.json()
            if 'error' in response_json and response_json['error'].get('code') == 503:
                print(f"  -> API overloaded (503). Retrying in {2 ** attempt} seconds...")
                time.sleep(2 ** attempt)
                continue
            break
            
        if 'candidates' not in response_json:
            print(f"  -> Gemini API Error: {response_json}")
            return []
            
        response_text = response_json['candidates'][0]['content']['parts'][0]['text']
        data = json.loads(response_text)
        
        return data.get("cases", [])
    except Exception as e:
        print(f"  -> TOC Extraction Error: {e}")
        return []

def calibrate_page_offset(pdf_path, first_case_title, expected_printed_page):
    """Searches the PDF around the expected page to find the actual absolute page index."""
    try:
        doc = fitz.open(pdf_path)
        # We search between index 0 and expected+30
        search_range = min(expected_printed_page + 30, len(doc))
        
        # Clean title for searching
        clean_title = re.sub(r'[^a-zA-Z0-9]', '', first_case_title.lower())
        
        for i in range(search_range):
            page_text = doc[i].get_text("text").lower()
            clean_page_text = re.sub(r'[^a-zA-Z0-9]', '', page_text)
            
            # If the title is substantial and found on this page
            if len(clean_title) > 5 and clean_title in clean_page_text:
                offset = i - expected_printed_page
                print(f"  -> Calibration Success: Found '{first_case_title}' on absolute page {i}. Offset is {offset}.")
                return offset
                
        print(f"  -> Calibration Failed: Could not find '{first_case_title}'. Assuming offset = 0.")
        return 0
    except Exception as e:
        print(f"  -> Calibration Error: {e}")
        return 0

def synthesize_case(raw_text):
    """Uses Groq to synthesize a structured case transcript from the raw text slice."""
    prompt = f"""
    You are an expert MBB case interviewer. Below is raw text extracted from a specific case in a casebook.
    
    Your task:
    1. Extract the "problem_statement" (the initial prompt given to the candidate).
    2. Rewrite the rest of the case into a clean, strictly multi-turn "solution_transcript" between an 'interviewer' and 'candidate'.
    3. Remove any metadata, interviewer notes, or formatting artifacts. Just pure Socratic dialogue.
    
    Return ONLY a valid JSON object:
    {{
        "problem_statement": "The client is a...",
        "solution_transcript": "Interviewer: ...\\nCandidate: ..."
    }}
    
    Raw Text:
    {raw_text[:15000]}
    """
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        
        response = requests.post(url, json=payload).json()
        response_text = response['candidates'][0]['content']['parts'][0]['text']
        return json.loads(response_text)
    except Exception as e:
        print(f"  -> Synthesis Error: {e}")
        return None

def process_casebooks():
    pdf_files = glob.glob(os.path.join(DATA_DIR, "*.pdf"))
    print(f"Found {len(pdf_files)} casebooks to process.\n")
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        book_name = filename.replace(".pdf", "").replace("-", " ")
        print(f"--- Processing Book: {book_name} ---")
        
        # 1. Parse TOC
        cases = extract_toc(pdf_path)
        if not cases:
            print("  -> No cases found in TOC. Skipping book.\n")
            continue
            
        print(f"  -> Found {len(cases)} cases in TOC.")
        
        # 2. Calibrate Offset
        first_case = cases[0]
        offset = calibrate_page_offset(pdf_path, first_case["title"], first_case["printed_page_num"])
        
        # 3. Extract and Synthesize
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        
        for i, case in enumerate(cases):
            title = case.get("title", "Unknown Case")
            printed_page = case.get("printed_page_num", 0)
            case_type = case.get("case_type", "General")
            
            abs_start = printed_page + offset
            if abs_start < 0 or abs_start >= total_pages:
                continue
                
            # Determine end page
            if i + 1 < len(cases):
                next_printed = cases[i+1].get("printed_page_num", printed_page)
                abs_end = next_printed + offset
            else:
                abs_end = abs_start + 8 # Assume max 8 pages for the last case
                
            # Ensure logical bounds
            abs_end = min(abs_end, total_pages)
            if abs_end <= abs_start:
                abs_end = abs_start + 4
                
            print(f"  -> Extracting '{title}' (Pages {abs_start} to {abs_end-1})")
            
            raw_text = ""
            for p in range(abs_start, abs_end):
                raw_text += doc[p].get_text("text") + "\n"
                
            if len(raw_text.strip()) < 200:
                print("     - Text too short, skipping.")
                continue
                
            print("     - Synthesizing transcript via LLM...")
            structured_case = synthesize_case(raw_text)
            
            if not structured_case:
                print("     - Synthesis failed, skipping.")
                continue
                
            print("     - Inserting into Supabase...")
            if supabase:
                try:
                    supabase.table("cases").insert({
                        "title": title,
                        "problem_statement": structured_case.get("problem_statement", ""),
                        "solution_transcript": structured_case.get("solution_transcript", ""),
                        "case_type": case_type,
                        "pdf_source": filename,
                        "book_name": book_name,
                        "page_number": abs_start
                    }).execute()
                    print("     - Success!")
                except Exception as e:
                    print(f"     - Supabase Insert Error: {e}")
            
            time.sleep(3) # Rate limit protection

if __name__ == "__main__":
    process_casebooks()
