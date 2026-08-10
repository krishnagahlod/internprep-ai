import os, sys
sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')
from supabase import create_client, Client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if url and key:
    supabase = create_client(url, key)
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]
    print("Existing buckets:", bucket_names)
    if "resume_pdfs" not in bucket_names:
        print("Creating bucket resume_pdfs...")
        try:
            supabase.storage.create_bucket("resume_pdfs", {"public": True})
            print("Bucket created.")
        except Exception as e:
            print("Failed to create bucket:", e)
    else:
        print("Bucket already exists. Ensuring it is public...")
        try:
            supabase.storage.update_bucket("resume_pdfs", {"public": True})
            print("Bucket updated to public.")
        except Exception as e:
            print("Failed to update bucket:", e)
else:
    print("Missing Supabase env vars")
