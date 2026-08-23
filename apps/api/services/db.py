import os
from typing import Optional
from supabase import create_client, Client

_supabase_client: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    """
    Returns a cached Supabase client or initializes one from environment variables.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        return None

    try:
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")
        return None
