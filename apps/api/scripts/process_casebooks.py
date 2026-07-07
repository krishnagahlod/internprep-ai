import sys
import os
import json
import time
import argparse
from dotenv import load_dotenv
from supabase import create_client, Client
import fitz
import openai
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import random

sys.stdout.reconfigure(encoding='utf-8')

# Load environments
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Supabase setup
supabase_url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key)

# API Keys
CEREBRAS_KEYS = [k for k in [
    os.environ.get("CEREBRAS_API_KEY_1"), 
    os.environ.get("CEREBRAS_API_KEY_2"),
    os.environ.get("CEREBRAS_API_KEY_3")
] if k]
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Rotate keys
cerebras_idx = 0

# Embedding Model (Local for kb_chunks)
embedder = SentenceTransformer('all-mpnet-base-v2')

# Configuration
CASEBOOKS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "casebooks")
CHUNK_SIZE = 8000
CHUNK_OVERLAP = 500
SKIP_FILES = ["2. Case in Point.pdf"]

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_llm_response(prompt: str, json_mode: bool = True) -> dict:
    global cerebras_idx
    """Waterfall LLM extraction: Cerebras (multi-key) -> Groq -> Gemini"""
    system_prompt = """You are an elite consulting case extraction AI. 
    Analyze the text chunk and extract structured information.
    Return ONLY a JSON array of objects.
    Each object must match this schema:
    {
      "type": "case_transcript" | "guesstimate" | "framework" | "best_practice" | "industry_primer",
      "title": "Clear descriptive title",
      "industry": "Industry name (if applicable, else General)",
      "case_type": "Profitability/Market Entry/etc (if applicable, else General)",
      "difficulty": "easy/medium/hard",
      "problem_statement": "The initial prompt/question given to the candidate",
      "solution_transcript": "The detailed dialogue/solution. Must be highly detailed. If dialogue, use Interviewer: and Candidate:. If just text, provide the full solution.",
      "page_reference": "Approximate page number if visible, or null"
    }
    If a case is cut off, extract what you can, ensuring 'solution_transcript' captures the text. DO NOT truncate the dialogue to less than 100 characters if more text exists.
    If no relevant consulting content is found, return an empty array [].
    """
    
    # Provider 1: Cerebras
    cerebras_success = False
    content = None
    if CEREBRAS_KEYS:
        for _ in range(len(CEREBRAS_KEYS)):
            key = CEREBRAS_KEYS[cerebras_idx % len(CEREBRAS_KEYS)]
            cerebras_idx += 1
            try:
                client = openai.OpenAI(base_url="https://api.cerebras.ai/v1", api_key=key)
                response = client.chat.completions.create(
                    model="gpt-oss-120b", 
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"} if json_mode else None,
                    temperature=0.1
                )
                content = response.choices[0].message.content
                cerebras_success = True
                break
            except Exception as e:
                pass # Try next key
                
        if not cerebras_success:
            print(f"    All Cerebras keys failed/exhausted. Falling back to Groq...")
            
    if cerebras_success and content:
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, list): return v
                return [data]
            return data if isinstance(data, list) else []
        except:
            pass

    # Provider 2: Groq
    if GROQ_API_KEY:
        try:
            client = openai.OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY)
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"} if json_mode else None,
                temperature=0.1
            )
            content = response.choices[0].message.content
            if content:
                try:
                    data = json.loads(content)
                    if isinstance(data, dict):
                        for k, v in data.items():
                            if isinstance(v, list): return v
                        return [data]
                    return data if isinstance(data, list) else []
                except:
                    pass
        except Exception as e:
            print(f"    Groq failed: {e}. Falling back to Gemini...")

    # Provider 3: Gemini
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            response = model.generate_content(prompt)
            if response.text:
                try:
                    data = json.loads(response.text)
                    if isinstance(data, dict):
                        for k, v in data.items():
                            if isinstance(v, list): return v
                        return [data]
                    return data if isinstance(data, list) else []
                except:
                    pass
        except Exception as e:
            print(f"    Gemini failed: {e}. All providers exhausted.")
    
    return []

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text("text") + "\n\n"
        doc.close()
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

def process_file(file_path: str):
    filename = os.path.basename(file_path)
    print(f"\nProcessing {filename}...")
    
    # Idempotency: clear prior runs for this exact book
    # This prevents duplicate kb_chunks/cases if script is rerun
    try:
        supabase.table("kb_chunks").delete().eq("source", filename).execute()
        supabase.table("cases").delete().eq("pdf_source", filename).execute()
        print(f"  Cleared old data for {filename}")
    except Exception as e:
        print(f"  Could not clear old data for {filename}: {e}")
    
    text = extract_text_from_pdf(file_path)
    if not text.strip():
        print(f"  No text extracted from {filename}")
        return
        
    chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
    print(f"  Split into {len(chunks)} chunks.")
    
    for i, chunk in enumerate(chunks):
        print(f"  Processing chunk {i+1}/{len(chunks)}...")
        
        extracted_items = get_llm_response(chunk)
        
        if not extracted_items or not isinstance(extracted_items, list):
            continue
            
        for item in extracted_items:
            if not isinstance(item, dict):
                continue
                
            ctype = item.get("type", "").lower()
            title = item.get("title", "Untitled")
            
            if not title or title == "Untitled":
                continue
                
            try:
                if ctype in ["case_transcript", "guesstimate"]:
                    if len(item.get("solution_transcript", "")) < 100:
                        continue
                        
                    supabase.table("cases").insert({
                        "title": title,
                        "case_type": item.get("case_type", "Guesstimate" if ctype == "guesstimate" else "General"),
                        "problem_statement": item.get("problem_statement", ""),
                        "solution_transcript": item.get("solution_transcript", ""),
                        "pdf_source": filename,
                        "book_name": filename.replace(".pdf", "").replace("-", " "),
                        # Supabase expects integer for page_number or null
                        "page_number": int(''.join(filter(str.isdigit, str(item.get("page_reference", ""))))) if any(c.isdigit() for c in str(item.get("page_reference", ""))) else None
                    }).execute()
                    print(f"    Inserted Case: {title}")
                    
                elif ctype in ["framework", "best_practice", "industry_primer"]:
                    content = f"{title}\n{item.get('problem_statement', '')}\n{item.get('solution_transcript', '')}"
                    if len(content) < 50:
                        continue
                        
                    embedding = embedder.encode(content).tolist()
                    supabase.table("kb_chunks").insert({
                        "content": content,
                        "embedding": embedding,
                        "source": filename,
                        "round_type": ctype
                    }).execute()
                    print(f"    Inserted KB Chunk: {title} ({ctype})")
            except Exception as e:
                err_msg = str(e).encode('ascii', 'ignore').decode('ascii')
                print(f"    Supabase Insert Error: {err_msg}")
        
        # Slight delay to respect RPM limits on providers
        time.sleep(2)

def main():
    for fname in sorted(os.listdir(CASEBOOKS_DIR)):
        if not fname.endswith(".pdf"): continue
        if fname in SKIP_FILES:
            print(f"Skipping {fname} (configured in SKIP_FILES)")
            continue
            
        file_path = os.path.join(CASEBOOKS_DIR, fname)
        process_file(file_path)

if __name__ == "__main__":
    main()
