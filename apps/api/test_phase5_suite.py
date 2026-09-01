import pytest
import json
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded

from services.error_handler import (
    ErrorDetail,
    ErrorResponse,
    create_error_response,
)
from services.cerebras_client import cerebras_client

def test_create_error_response():
    """Verify standardized error envelope schema and headers."""
    response = create_error_response(
        status_code=400,
        code="INVALID_PAYLOAD",
        message="The provided PDF payload was malformed.",
        details={"field": "file"},
        correlation_id="test-cid-12345"
    )
    
    assert response.status_code == 400
    assert response.headers["X-Correlation-ID"] == "test-cid-12345"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    
    body = json.loads(response.body.decode("utf-8"))
    assert "error" in body
    assert body["error"]["code"] == "INVALID_PAYLOAD"
    assert body["error"]["message"] == "The provided PDF payload was malformed."
    assert body["error"]["details"] == {"field": "file"}
    assert body["error"]["correlation_id"] == "test-cid-12345"

def test_cerebras_client_stream_generator():
    """Verify stream_chat_completion yields text chunks."""
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say 'ready to practice' in three words."}
    ]
    
    chunks = []
    for chunk in cerebras_client.stream_chat_completion(messages=messages, max_tokens=50):
        chunks.append(chunk)
        if len(chunks) > 5:
            break
            
    assert len(chunks) > 0
    full_output = "".join(chunks)
    assert len(full_output) > 0

import asyncio
from main import health_check

def test_health_endpoint():
    """Verify health endpoint returns diagnostic telemetry."""
    res = asyncio.run(health_check())
    assert "status" in res
    assert "uptime_seconds" in res
    assert "database" in res
    assert "llm_gateway" in res
    assert res["version"] == "1.0.0"

if __name__ == "__main__":
    test_create_error_response()
    test_cerebras_client_stream_generator()
    test_health_endpoint()
    print("SUCCESS: All backend tests (including /health) passed!")
