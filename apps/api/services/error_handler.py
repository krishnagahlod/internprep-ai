import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from services.security_logger import safe_log_error

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail

def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    correlation_id: Optional[str] = None
) -> JSONResponse:
    """Builds a standardized API error response envelope with security headers."""
    cid = correlation_id or str(uuid.uuid4())
    content = {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "correlation_id": cid
        }
    }
    return JSONResponse(
        status_code=status_code,
        content=content,
        headers={
            "X-Correlation-ID": cid,
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handles standard FastAPI HTTPExceptions into uniform envelopes."""
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    
    # Map common status codes to standard error codes
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        402: "PAYMENT_REQUIRED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }
    code = code_map.get(exc.status_code, "API_ERROR")
    message = str(exc.detail) if exc.detail else "An error occurred."
    
    return create_error_response(
        status_code=exc.status_code,
        code=code,
        message=message,
        correlation_id=cid
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handles Pydantic request validation errors into clean structured envelopes."""
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    errors_summary = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors_summary.append({"field": loc, "message": msg})
        
    return create_error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="Request validation failed. Please check your inputs.",
        details={"validation_errors": errors_summary},
        correlation_id=cid
    )

async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Handles SlowAPI rate limits into friendly envelopes."""
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    return create_error_response(
        status_code=429,
        code="RATE_LIMIT_EXCEEDED",
        message=f"Rate limit exceeded: {exc.detail or 'Too many requests. Please slow down and try again shortly.'}",
        details={"retry_after_seconds": 60},
        correlation_id=cid
    )

async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches any unhandled 500 exceptions with safe logging and correlation ID tracking."""
    cid = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    safe_log_error(f"Unhandled Exception on {request.method} {request.url.path} [CID: {cid}]", exc=exc)
    
    return create_error_response(
        status_code=500,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred. Please contact support with this correlation ID if the issue persists.",
        correlation_id=cid
    )
