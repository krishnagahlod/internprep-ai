import os
import sys
import time
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

def backfill():
    print(f"Starting backfill using model: {EMBEDDING_MODEL}")
    
    # Fetch all records without embeddings (which should be all of them now since we ALTER COLUMN USING NULL)
    res = supabase.table("golden_resume_bullets").select("id, bullet_text").is_("embedding", "null").execute()
    
    records = res.data
    print(f"Found {len(records)} records needing embeddings.")
    
    if not records:
        print("Nothing to do!")
        return
        
    # We will process in batches to be efficient
    batch_size = 20
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        print(f"Processing batch {i // batch_size + 1}/{(len(records) + batch_size - 1) // batch_size}...")
        
        texts_to_embed = [r['bullet_text'] for r in batch]
        
        try:
            embeddings = gemini_client.embed_batch(texts_to_embed, model_name=EMBEDDING_MODEL, task_type="retrieval_document")
            
            # Update database
            for j, record in enumerate(batch):
                supabase.table("golden_resume_bullets").update({"embedding": embeddings[j]}).eq("id", record['id']).execute()
                
            print(f"  -> Successfully embedded and updated {len(batch)} records.")
            time.sleep(1) # Small pause to avoid rate limits
            
        except Exception as e:
            print(f"  -> Failed to embed batch: {e}")
            # Try individually if batch fails
            for record in batch:
                try:
                    emb = gemini_client.embed_text(record['bullet_text'], model_name=EMBEDDING_MODEL, task_type="retrieval_document")
                    supabase.table("golden_resume_bullets").update({"embedding": emb}).eq("id", record['id']).execute()
                    time.sleep(0.5)
                except Exception as ex:
                    print(f"    -> Failed single record {record['id']}: {ex}")

    print("Backfill complete!")

if __name__ == "__main__":
    backfill()
