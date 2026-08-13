from slowapi import Limiter
from slowapi.util import get_remote_address
import os
from posthog import Posthog

# We use get_remote_address which will use request.client.host
# Uvicorn MUST be run with proxy_headers=True and forwarded_allow_ips="*"
limiter = Limiter(key_func=get_remote_address)

posthog_client = None
if os.environ.get("POSTHOG_PROJECT_API_KEY"):
    posthog_client = Posthog(
        os.environ.get("POSTHOG_PROJECT_API_KEY"),
        host=os.environ.get("POSTHOG_HOST", "https://us.i.posthog.com")
    )

from supabase import create_client, Client
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    return create_client(url, key)
