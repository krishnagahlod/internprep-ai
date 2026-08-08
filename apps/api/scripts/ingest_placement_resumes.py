import sys
import os
import json
import time

# Add the 'apps/api' directory to sys.path so we can import services
api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, api_dir)

from dotenv import load_dotenv
from supabase import create_client, Client

sys.stdout.reconfigure(encoding='utf-8')

# Load environments
load_dotenv(os.path.join(api_dir, ".env"))

# Import gemini_client which has 4 API keys and handles load balancing / rate limits!
from services.gemini_client import gemini_client
import google.generativeai as genai

# Supabase setup
supabase_url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not supabase_url or not supabase_key:
    print("Missing Supabase credentials.")
    sys.exit(1)
    
supabase: Client = create_client(supabase_url, supabase_key)

# Configuration
PLACEMENT_RESUMES_DIR = os.path.abspath(os.path.join(api_dir, "..", "..", "data", "Placement Resumes"))

def extract_bullets_from_pdf(pdf_path: str, target_role: str, company_name: str) -> list:
    """Uses Gemini Multimodal to extract strictly structured bullets from a PDF."""
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
            
        system_prompt = """
        You are an expert resume parser for IIT Bombay placement resumes.
        Extract every single bullet point from the provided PDF resume.
        Return ONLY a JSON array of objects.
        Each object must match this exact schema:
        {
          "bullet_text": "The exact bullet point text",
          "section_type": "experience" | "project" | "por" | "scholastic" | "extracurricular",
          "action_verb": "The primary action verb used to start the bullet (e.g., Spearheaded, Engineered)",
          "structural_skeleton": "A structural pattern of the bullet (e.g., Action + Impact + Context + Tool)",
          "competency_tags": ["array of 1-3 tags from the list below"]
        }
        
        Valid competency_tags:
        - strategic_problem_solving
        - product_technical_execution
        - sustainability_impact
        - financial_quantitative_rigor
        - leadership_stakeholder_mgmt
        - entrepreneurial_ownership
        
        CRITICAL INSTRUCTIONS:
        - Extract ALL bullets from the resume. Do not skip any.
        - Ensure valid JSON.
        """
        
        # We use the internal gemini_client to leverage its key rotation (rate limit safety)
        response = gemini_client.generate_content(
            model_name="gemini-1.5-flash",
            prompt=system_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1),
            pdf_bytes=pdf_bytes
        )
        
        text = response.text
        data = json.loads(text)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to extract bullets from {pdf_path}: {e}")
        return []

def process_file(file_path: str, target_role: str, company: str):
    print(f"\nProcessing {os.path.basename(file_path)} (Role: {target_role}, Company: {company})")
    
    bullets = extract_bullets_from_pdf(file_path, target_role, company)
    if not bullets:
        print(f"  No bullets extracted.")
        return
        
    print(f"  Extracted {len(bullets)} bullets. Generating embeddings and uploading...")
    
    # 1. Extract texts for batch embedding
    bullet_texts = [ub.get('bullet_text', '') for ub in bullets]
    
    # 2. Fetch all embeddings using the same embedding logic as the rest of the platform
    # This ensures exact matching of vector spaces.
    try:
        embeddings = gemini_client.embed_batch(bullet_texts)
    except Exception as e:
        print(f"  Batch embedding failed: {e}")
        return
    
    db_records = []
    for i, bullet in enumerate(bullets):
        text = bullet.get('bullet_text', '')
        if len(text) < 15: continue
        
        emb = embeddings[i] if i < len(embeddings) else None
        if not emb:
            continue
            
        db_records.append({
            "bullet_text": text,
            "section_type": bullet.get('section_type', 'experience'),
            "target_role": target_role,
            "structural_skeleton": bullet.get('structural_skeleton', ''),
            "action_verb": bullet.get('action_verb', ''),
            "tier": "placement",
            "company": company,
            "competency_tags": bullet.get('competency_tags', []),
            "resume_source": os.path.basename(file_path),
            "embedding": emb
        })
        
    # Process DB insertion in small batches
    batch_size = 50
    success_count = 0
    
    for i in range(0, len(db_records), batch_size):
        batch = db_records[i:i+batch_size]
        try:
            response = supabase.table('golden_resume_bullets').insert(batch).execute()
            success_count += len(response.data)
        except Exception as e:
            print(f"  Failed to insert batch: {e}")
            
    print(f"  Successfully inserted {success_count} bullets.")
    
    # Sleep to avoid overwhelming the APIs even with key rotation
    time.sleep(4)

def main():
    if not os.path.exists(PLACEMENT_RESUMES_DIR):
        print(f"Directory not found: {PLACEMENT_RESUMES_DIR}")
        return
        
    for domain in os.listdir(PLACEMENT_RESUMES_DIR):
        domain_path = os.path.join(PLACEMENT_RESUMES_DIR, domain)
        if not os.path.isdir(domain_path):
            continue
            
        target_role = domain.lower() 
        
        for root, dirs, files in os.walk(domain_path):
            for file in files:
                if file.lower().endswith(".pdf"):
                    file_path = os.path.join(root, file)
                    
                    rel_path = os.path.relpath(root, domain_path)
                    company = None
                    if rel_path != ".":
                        company = rel_path
                        
                    process_file(file_path, target_role, company)

if __name__ == "__main__":
    main()
