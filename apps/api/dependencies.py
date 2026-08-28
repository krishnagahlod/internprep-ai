import os
import jwt
from typing import Dict, Any, Optional
from fastapi import Request, Header, HTTPException, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from posthog import Posthog
from supabase import create_client, Client

from services.db import get_supabase, safe_execute, reset_supabase
from services.entitlement_service import EntitlementService, is_iitb_email, is_admin_email
from services.usage_service import UsageService
from services.session_service import SessionService

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# PostHog Observability
posthog_client = None
if os.environ.get("POSTHOG_PROJECT_API_KEY"):
    posthog_client = Posthog(
        os.environ.get("POSTHOG_PROJECT_API_KEY"),
        host=os.environ.get("POSTHOG_HOST", "https://us.i.posthog.com")
    )

class AuthUser:
    def __init__(self, id: str, email: str, is_iitb: bool = False, is_admin: bool = False, session_id: Optional[str] = None):
        self.id = id
        self.email = email
        self.is_iitb = is_iitb
        self.is_admin = is_admin
        self.session_id = session_id or id

def extract_token_from_header(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return authorization

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> AuthUser:
    """
    Validates Supabase Bearer token and returns authenticated AuthUser.
    Enforces session revocation and records device metadata.
    """
    token = extract_token_from_header(authorization)
    
    if not token:
        # Check custom client-token or fallback for guest mode / local development
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in to access this feature."
        )

    user_id = None
    email = None
    session_id = None
    is_verified_auth = False

    # 1. Primary: Verify token cryptographically via Supabase Auth API
    try:
        supabase = get_supabase()
        if supabase:
            user_res = supabase.auth.get_user(token)
            if user_res and user_res.user:
                user = user_res.user
                user_id = str(user.id)
                email = str(user.email) if user.email else ""
                is_verified_auth = True
    except Exception:
        # Auth API error or invalid token
        pass

    # 2. Secondary: Cryptographic HMAC-SHA256 verification using SUPABASE_JWT_SECRET
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if not is_verified_auth and jwt_secret:
        try:
            # Cryptographically verify the signature, algorithm, and audience
            verified_claims = jwt.decode(
                token,
                key=jwt_secret,
                algorithms=["HS256"],
                options={"verify_signature": True, "verify_exp": True},
                audience="authenticated"
            )
            user_id = verified_claims.get("sub")
            email = verified_claims.get("email") or ""
            session_id = verified_claims.get("session_id") or verified_claims.get("jti")
            is_verified_auth = True
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Your session token has expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid authentication token signature.")

    # 3. Reject any token that cannot be cryptographically verified (No unverified decode fallback!)
    if not is_verified_auth or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed: Invalid or unverifiable authentication credentials."
        )

    session_id = session_id or user_id

    # 4. Check Session Revocation
    if SessionService.is_session_revoked(session_id):
        raise HTTPException(status_code=401, detail="Your session has been signed out. Please log in again.")

    # 5. Record/update active session telemetry
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    SessionService.record_session(user_id=user_id, session_id=session_id, user_agent=user_agent, client_ip=client_ip)

    # 6. Privilege evaluation: Strictly requires cryptographically verified identity
    is_iitb = is_iitb_email(email) if is_verified_auth else False
    is_admin = is_admin_email(email) if is_verified_auth else False

    return AuthUser(id=user_id, email=email or "", is_iitb=is_iitb, is_admin=is_admin, session_id=session_id)

async def get_optional_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Optional[AuthUser]:
    """Returns AuthUser if valid authorization header provided, else None."""
    try:
        return await get_current_user(request=request, authorization=authorization)
    except Exception:
        return None

async def require_admin(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """Enforces that the current authenticated user has administrative privileges."""
    if not user.is_admin and not is_admin_email(user.email):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative privileges required."
        )
    return user

def require_feature_access(feature_key: str, units: int = 1):
    """
    Reusable FastAPI route dependency for server-side feature gating and quota consumption.
    Usage:
      @router.post("/analyze")
      async def analyze_resume(user: AuthUser = Depends(require_feature_access("resume_analysis"))):
    """
    async def _dependency(request: Request, user: AuthUser = Depends(get_current_user)) -> AuthUser:
        entitlement = EntitlementService.get_active_entitlement(user_id=user.id, user_email=user.email)
        plan_key = entitlement.get("plan_key", "free")

        # Admin bypasses quotas
        if user.is_admin or plan_key == "admin":
            return user

        # Check and atomically consume quota
        UsageService.consume_quota(
            user_id=user.id,
            plan_key=plan_key,
            feature_key=feature_key,
            units=units,
            request_id=request.headers.get("x-request-id")
        )

        return user

    return _dependency
