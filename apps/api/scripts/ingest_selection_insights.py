import os
import sys
import time
import pandas as pd
import json
import re
from supabase import create_client

# Add the apps/api directory to path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from services.gemini_client import gemini_client
from services.embeddings import EMBEDDING_MODEL

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing Supabase credentials!")
    sys.exit(1)

supabase = create_client(url, key)
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/selection insights"))

def get_or_create_company(name, category):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    res = supabase.table("companies").select("id").eq("slug", slug).execute()
    if res.data:
        return res.data[0]['id']
    
    # Create company
    try:
        new_company = supabase.table("companies").insert({
            "name": name,
            "slug": slug,
            "category": category.lower(),
        }).execute()
        if new_company.data:
            return new_company.data[0]['id']
    except Exception as e:
        print(f"Failed to create company {name}: {e}")
        # Try to fetch again in case it was created concurrently
        res = supabase.table("companies").select("id").eq("slug", slug).execute()
        if res.data:
            return res.data[0]['id']
    return None

def process_excel(filepath):
    filename = os.path.basename(filepath)
    print(f"Processing {filename}...")
    
    # Extract domain from filename e.g. "Selection Insights Quant.xlsx" -> "Quant"
    domain = filename.replace("Selection Insights", "").replace(".xlsx", "").strip()
    if not domain:
        domain = "General"
        
    try:
        df = pd.read_excel(filepath)
    except Exception as e:
        print(f"Failed to read {filename}: {e}")
        return

    # Find the company name column and questions asked column
    # They might be slightly different in each file
    col_company = None
    col_questions = None
    
    for col in df.columns:
        col_str = str(col).lower()
        if "company" in col_str:
            col_company = col
        elif "question" in col_str:
            col_questions = col
            
    if not col_company or not col_questions:
        print(f"Could not find required columns in {filename}. Found: {df.columns}")
        return

    questions_to_embed = []
    
    for _, row in df.iterrows():
        company_name = str(row[col_company]).strip()
        questions_raw = str(row[col_questions]).strip()
        
        if pd.isna(row[col_company]) or company_name == 'nan' or not company_name:
            continue
            
        if pd.isna(row[col_questions]) or questions_raw == 'nan' or not questions_raw or questions_raw.lower().startswith('na'):
            continue
            
        company_id = get_or_create_company(company_name, domain)
        
        # Split questions
        # Some are separated by '\n', some by unicode characters like replacement char
        cleaned = re.sub(r'[\uFFFD•]', '\n', questions_raw)
        # Split by newline
        lines = [line.strip() for line in cleaned.split('\n')]
        
        for line in lines:
            # Clean leading dashes or numbers
            line = re.sub(r'^[\-\*]\s*', '', line)
            line = re.sub(r'^\d+\.\s*', '', line)
            line = line.strip()
            
            if len(line) > 5: # Ignore very short artifacts
                questions_to_embed.append({
                    "content": line,
                    "company_id": company_id,
                    "company_name": company_name,
                    "domain": domain,
                    "source": filename
                })
                
    print(f"  -> Extracted {len(questions_to_embed)} distinct questions for {domain}")
    
    # Batch embed and insert
    batch_size = 20
    for i in range(0, len(questions_to_embed), batch_size):
        batch = questions_to_embed[i:i+batch_size]
        texts = [item['content'] for item in batch]
        
        try:
            embeddings = gemini_client.embed_batch(texts, model_name=EMBEDDING_MODEL, task_type="retrieval_document")
            
            records_to_insert = []
            for j, item in enumerate(batch):
                records_to_insert.append({
                    "content": item['content'],
                    "embedding": embeddings[j],
                    "company_id": item['company_id'],
                    "round_type": "technical",
                    "interview_type": "domain",
                    "source": item['source'],
                    "tags": [item['domain'].lower(), item['company_name']]
                })
                
            supabase.table("kb_chunks").insert(records_to_insert).execute()
            print(f"  -> Inserted batch {i // batch_size + 1} ({len(batch)} records)")
            time.sleep(1)
            
        except Exception as e:
            print(f"  -> Failed to process batch starting at index {i}: {e}")

def main():
    print(f"Scanning {DATA_DIR} for Excel files...")
    if not os.path.exists(DATA_DIR):
        print(f"Data directory not found: {DATA_DIR}")
        return
        
    for file in os.listdir(DATA_DIR):
        if file.endswith('.xlsx') and not file.startswith('~'):
            process_excel(os.path.join(DATA_DIR, file))
            
    print("Ingestion complete!")

if __name__ == "__main__":
    main()
