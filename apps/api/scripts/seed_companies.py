import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or not key:
    print("Error: Supabase credentials not found. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
    sys.exit(1)

supabase: Client = create_client(url, key)

companies = [
    # Consulting
    {"name": "McKinsey & Company", "slug": "mckinsey", "category": "consulting"},
    {"name": "Bain & Company", "slug": "bain", "category": "consulting"},
    {"name": "Boston Consulting Group (BCG)", "slug": "bcg", "category": "consulting"},
    {"name": "L.E.K. Consulting", "slug": "lek", "category": "consulting"},
    {"name": "Strategy&", "slug": "strategy-and", "category": "consulting"},
    {"name": "Nomura Research Institute (NRI)", "slug": "nri", "category": "consulting"},
    {"name": "Accenture Strategy", "slug": "accenture-strategy", "category": "consulting"},
    
    # Finance
    {"name": "Morgan Stanley", "slug": "morgan-stanley", "category": "finance"},
    {"name": "AllianceBernstein", "slug": "bernstein", "category": "finance"},
    {"name": "Apollo Global Management", "slug": "apollo", "category": "finance"},
    {"name": "Deutsche Bank", "slug": "deutsche-bank", "category": "finance"},
    
    # FMCG
    {"name": "Procter & Gamble (P&G)", "slug": "pandg", "category": "fmcg"},
    {"name": "ITC Limited", "slug": "itc", "category": "fmcg"},
    {"name": "Hindustan Unilever Limited (HUL)", "slug": "hul", "category": "fmcg"},
    
    # Analytics
    {"name": "American Express (Amex)", "slug": "amex", "category": "analytics"},
    {"name": "Finmechanics", "slug": "finmechanics", "category": "analytics"},
    {"name": "Fractal.ai", "slug": "fractal-ai", "category": "analytics"},
]

def seed_companies():
    print("Seeding companies into Supabase...")
    for company in companies:
        try:
            # Check if exists
            result = supabase.table("companies").select("*").eq("slug", company["slug"]).execute()
            if not result.data:
                # Insert
                supabase.table("companies").insert(company).execute()
                print(f"[OK] Inserted {company['name']}")
            else:
                print(f"[-] Skipped {company['name']} (already exists)")
        except Exception as e:
            print(f"[ERROR] Error inserting {company['name']}: {str(e)}")
            
    print("\nDone seeding companies!")

if __name__ == "__main__":
    seed_companies()
