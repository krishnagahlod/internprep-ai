import os
import glob
import json
import time
import fitz  # PyMuPDF
import google.generativeai as genai
from groq import Groq
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

genai.configure(api_key=GEMINI_API_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes"))

def clean_json(text: str) -> str:
    """Strips markdown code block formatting (```json ... ```) from Gemini responses."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def extract_bullets_from_resume(pdf_path):
    print(f"  -> Attempting local text extraction...")
    
    # Attempt local text extraction
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text("text") + "\n"
    except Exception as e:
        print(f"  -> PyMuPDF extraction failed: {e}")
        
    prompt = f"""
    You are an expert resume parser analyzing a verified Day 1 resume.
    Your task is to extract every single achievement bullet point from the resume.
    Ignore headers, contact info, skills lists, and dates.
    
    For each bullet, analyze its structure:
    - Identify the section type: 'experience', 'project', 'por', 'scholastic', or 'extracurricular'
    - Identify the structural skeleton: e.g., "Action Verb + Context + Quantified Impact"
    - Identify the leading action verb.
    - Determine if it has quantified metrics (has_metrics: true/false).
    - If yes, identify the metric_type: 'percentage', 'currency', 'team_size', 'count', 'time', or null.
    
    Return a JSON object exactly like this:
    {{
        "bullets": [
            {{
                "bullet_text": "string",
                "section_type": "string",
                "structural_skeleton": "string",
                "action_verb": "string",
                "has_metrics": boolean,
                "metric_type": "string"
            }}
        ]
    }}
    """
    
    # If text is rich (Word resumes), use Groq to save Gemini limits
    if len(text.strip()) > 100:
        print("  -> Text found. Using Groq (Llama 3) for extraction...")
        full_prompt = prompt + f"\n\nResume Text:\n{text}"
        
        for attempt in range(5):
            try:
                response = groq_client.chat.completions.create(
                    model="gpt-oss-120b",
                    messages=[{"role": "user", "content": full_prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                data = json.loads(clean_json(response.choices[0].message.content))
                return data.get("bullets", [])
            except Exception as e:
                print(f"  -> Groq Error: {e}. Retrying in 10s...")
                time.sleep(10)
        return []
        
    # If text is empty (LaTeX / Image resumes), fallback to Gemini Vision OCR
    print("  -> No text found. Falling back to Gemini Vision API for OCR...")
    try:
        myfile = genai.upload_file(pdf_path)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        for attempt in range(10):
            try:
                response = model.generate_content(
                    [prompt, myfile],
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                data = json.loads(clean_json(response.text))
                
                try:
                    myfile.delete()
                except:
                    pass
                    
                return data.get("bullets", [])
            except Exception as api_err:
                if "429" in str(api_err) or "RESOURCE_EXHAUSTED" in str(api_err) or "503" in str(api_err):
                    print(f"  -> Gemini Rate limit or 503 hit. Waiting 60s... (Attempt {attempt+1}/10)")
                    time.sleep(60)
                else:
                    print(f"  -> Gemini API Error: {api_err}")
                    break
                    
        try:
            myfile.delete()
        except:
            pass
        return []
    except Exception as e:
        print(f"  -> Gemini Upload Error: {e}")
        return []

def embed_text(text):
    max_retries = 10
    for attempt in range(max_retries):
        try:
            response = genai.embed_content(
                model='models/gemini-embedding-001',
                content=text
            )
            return response['embedding']
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "503" in str(e):
                print(f"  -> Embedding Rate limit or 503 hit. Waiting 60 seconds... (Attempt {attempt+1}/{max_retries})")
                time.sleep(60)
            else:
                print(f"  -> Embedding Error: {e}")
                break
    return None

def process_resumes():
    # Fetch already processed resumes from Supabase
    try:
        res = supabase.table("golden_resume_bullets").select("resume_source").execute()
        processed_sources = {row["resume_source"] for row in res.data}
        print(f"Found {len(processed_sources)} already processed resumes in Supabase.")
    except Exception as e:
        print(f"Error fetching existing resumes: {e}")
        processed_sources = set()

    pdf_files = glob.glob(os.path.join(DATA_DIR, "*/*.pdf"))
    print(f"Found {len(pdf_files)} total resumes to process across all roles.\n")
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        
        if filename in processed_sources:
            print(f"--- Skipping Resume (Already Processed): {filename} ---")
            continue
            
        role_folder = os.path.basename(os.path.dirname(pdf_path)).lower()
        
        # Map folder name to role
        target_role = "consulting"
        if role_folder == "finance": target_role = "finance"
        elif role_folder == "pm": target_role = "product"
        elif role_folder == "fmcg": target_role = "fmcg"
        elif role_folder == "analytics": target_role = "analytics"

        print(f"--- Processing Resume: {filename} (Role: {target_role}) ---")
        
        company_placed = "Unknown"
        lower_filename = filename.lower()
        for comp in ["mckinsey", "bain", "bcg", "accenture", "lek", "nri", "pwc"]:
            if comp in lower_filename:
                company_placed = comp.capitalize()
                if comp == "lek": company_placed = "L.E.K."
                if comp == "nri": company_placed = "NRI"
                if comp == "bcg": company_placed = "BCG"
                break
                
        bullets = extract_bullets_from_resume(pdf_path)
        print(f"  -> Found {len(bullets)} bullets.")
        
        for bullet in bullets:
            bullet_text = bullet.get("bullet_text", "")
            if len(bullet_text.strip()) < 15:
                continue
                
            embedding = embed_text(bullet_text)
            if not embedding:
                continue
                
            try:
                supabase.table("golden_resume_bullets").insert({
                    "bullet_text": bullet_text,
                    "resume_source": filename,
                    "company_placed": company_placed,
                    "target_role": target_role,
                    "section_type": bullet.get("section_type", "experience"),
                    "structural_skeleton": bullet.get("structural_skeleton", ""),
                    "action_verb": bullet.get("action_verb", ""),
                    "has_metrics": bullet.get("has_metrics", False),
                    "metric_type": bullet.get("metric_type", ""),
                    "quality_tier": "gold",
                    "embedding": embedding
                }).execute()
            except Exception as e:
                print(f"  -> Supabase Insert Error: {e}")
                
        print("  -> Success!")
        time.sleep(3)

if __name__ == "__main__":
    process_resumes()
