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
