import os
import time
from typing import Optional, Callable, Any
from supabase import create_client, Client

_supabase_client: Optional[Client] = None

def get_supabase(force_reconnect: bool = False) -> Optional[Client]:
    """
    Returns a cached Supabase client or initializes one from environment variables.
    If force_reconnect is True, discards the stale client and instantiates a new one.
    """
    global _supabase_client
    if _supabase_client is not None and not force_reconnect:
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

def reset_supabase():
    """Resets the cached client to force re-connection on next call."""
    global _supabase_client
    _supabase_client = None

def safe_execute(query_builder_fn: Callable[[Client], Any], retries: int = 3) -> Any:
    """
    Executes a Supabase query with automatic retry and fresh client instantiation
    if a transient HTTP/2 stream termination, broken pipe, or connection error occurs.
    """
    last_exc = None
    for attempt in range(retries):
        try:
            client = get_supabase(force_reconnect=(attempt > 0))
            if not client:
                raise Exception("Supabase client is not configured")
            
            # Execute the query builder function
            builder = query_builder_fn(client)
            return builder.execute()
        except Exception as e:
            last_exc = e
            err_str = str(e).lower()
            is_connection_error = any(term in err_str for term in [
                "connectionterminated", "remoteprotocolerror", "broken pipe",
                "last_stream_id", "connection closed", "connection reset", 
                "transport", "timeout", "network", "eof"
            ])
            if is_connection_error and attempt < retries - 1:
                print(f"[Supabase SafeExecute] Transient connection error ({e}). Reconnecting and retrying ({attempt + 1}/{retries})...")
                reset_supabase()
                time.sleep(0.15 * (attempt + 1))
                continue
            raise
    raise last_exc
