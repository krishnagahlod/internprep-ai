import os
import uuid
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sentry_sdk
from services.security_logger import safe_log_error, safe_log_info

# --- Environment & Security Startup Validation ---
def validate_environment():
    """Validates presence of critical environment variables on startup."""
    is_prod = os.getenv("ENVIRONMENT") == "production"
    required_vars = ["SUPABASE_URL"]
    if is_prod:
        required_vars.extend(["SUPABASE_SERVICE_ROLE_KEY"])
    
    missing = [v for v in required_vars if not os.getenv(v) and not os.getenv(f"NEXT_PUBLIC_{v}")]
    if missing:
        msg = f"CRITICAL SECURITY CONFIGURATION ERROR: Missing required environment variable(s): {', '.join(missing)}"
        if is_prod:
            raise RuntimeError(msg)
        else:
            safe_log_error(f"[SECURITY WARNING] {msg}")

validate_environment()

# --- Sentry Observability with PII Scrubber ---
def sentry_before_send(event, hint):
    """Strips sensitive headers, auth tokens, cookies, and passwords before sending to Sentry."""
    if "request" in event:
        req = event["request"]
        if "headers" in req:
            for sensitive_header in ["authorization", "cookie", "x-razorpay-signature", "x-api-key"]:
                if sensitive_header in req["headers"]:
                    req["headers"][sensitive_header] = "[REDACTED]"
        if "data" in req and isinstance(req["data"], dict):
            for k in list(req["data"].keys()):
                if any(s in k.lower() for s in ["password", "token", "secret", "cvv", "key"]):
                    req["data"][k] = "[REDACTED]"
    return event

if os.environ.get("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        traces_sample_rate=0.2 if os.getenv("ENVIRONMENT") == "production" else 1.0,
        profiles_sample_rate=0.2 if os.getenv("ENVIRONMENT") == "production" else 1.0,
        before_send=sentry_before_send,
    )

# --- FastAPI App Definition (Hiding Swagger/OpenAPI in Production) ---
is_production = os.getenv("ENVIRONMENT") == "production"
app = FastAPI(
    title="AI Interview Coach API",
    version="1.0.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

# --- Casebooks Static File Handler ---
class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Content-Disposition"] = "inline"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

casebooks_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "data/casebooks"))
os.makedirs(casebooks_dir, exist_ok=True)
app.mount("/casebooks", CORSStaticFiles(directory=casebooks_dir), name="casebooks")

# --- Security Headers & Correlation ID Middleware ---
@app.middleware("http")
async def security_headers_and_correlation_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id") or request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    try:
        response = await call_next(request)
    except Exception as exc:
        safe_log_error(f"Unhandled exception on {request.method} {request.url.path} [Correlation-ID: {correlation_id}]", exc=exc)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "An internal server error occurred. Please contact support with this correlation ID.",
                "correlation_id": correlation_id
            },
            headers={
                "X-Correlation-ID": correlation_id,
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            }
        )

    # Attach Comprehensive Security Headers
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
    return response

# --- CORS Whitelist Configuration ---
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://internprep.ai,https://internprep-ai.vercel.app"
)
allowed_origins = [orig.strip() for orig in allowed_origins_raw.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID"],
)

# --- Routers ---
from routers import resume, interview, feedback, gratitude, resume_builder, placement_analysis, billing, admin

app.include_router(resume.router)
app.include_router(resume_builder.router)
app.include_router(interview.router)
app.include_router(feedback.router)
app.include_router(gratitude.router)
app.include_router(placement_analysis.router)
app.include_router(billing.router)
app.include_router(admin.router)

# --- Rate Limiter & Unified Error Handlers Setup ---
from dependencies import limiter
from slowapi.errors import RateLimitExceeded
from fastapi.exceptions import RequestValidationError
from services.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    rate_limit_handler,
    unhandled_exception_handler,
)

app.state.limiter = limiter
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

import time
STARTUP_TIME = time.time()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Interview Coach API is running"}

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """
    Comprehensive operational health and telemetry diagnostics endpoint.
    Reports DB connectivity latency, LLM pool readiness, and memory cache stats.
    """
    db_status = "unconfigured"
    db_latency_ms = None
    
    # Check Database Connection
    from services.db import get_supabase
    client = get_supabase()
    if client:
        try:
            t0 = time.time()
            client.from_("profiles").select("id").limit(1).execute()
            db_latency_ms = round((time.time() - t0) * 1000, 2)
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)[:100]}"

    # LLM Gateway Status
    from services.cerebras_client import cerebras_client
    llm_info = {
        "groq_keys_count": len(cerebras_client.groq_keys),
        "openrouter_keys_count": len(cerebras_client.openrouter_keys),
        "cerebras_keys_count": len(cerebras_client.cerebras_keys),
        "in_memory_cache_entries": len(cerebras_client._cache),
        "gemini_active": True,
    }

    is_healthy = db_status in ["connected", "unconfigured"]

    return {
        "status": "healthy" if is_healthy else "degraded",
        "uptime_seconds": round(time.time() - STARTUP_TIME, 1),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "1.0.0",
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
        },
        "llm_gateway": llm_info,
    }

@app.get("/debug-sentry")
async def sentry_debug():
    if os.getenv("ENVIRONMENT") == "production":
        raise HTTPException(status_code=404, detail="Not Found")
    raise Exception("Test error to verify Sentry integration from backend!")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")
