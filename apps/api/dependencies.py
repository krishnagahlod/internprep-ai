from slowapi import Limiter
from slowapi.util import get_remote_address

# We use get_remote_address which will use request.client.host
# Uvicorn MUST be run with proxy_headers=True and forwarded_allow_ips="*"
limiter = Limiter(key_func=get_remote_address)
