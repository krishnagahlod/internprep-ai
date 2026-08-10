import os
import sys
import json
from supabase import create_client

sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

res = supabase.table("golden_resume_bullets").select("embedding").limit(1).execute()
if res.data and res.data[0].get("embedding"):
    emb = res.data[0]['embedding']
    if isinstance(emb, str):
        emb = json.loads(emb)
    print(f"golden_resume_bullets dimension: {len(emb)}")
else:
    print("golden_resume_bullets empty")

res2 = supabase.table("kb_chunks").select("embedding").limit(1).execute()
if res2.data and res2.data[0].get("embedding"):
    emb = res2.data[0]['embedding']
    if isinstance(emb, str):
        emb = json.loads(emb)
    print(f"kb_chunks dimension: {len(emb)}")
else:
    print("kb_chunks empty")
