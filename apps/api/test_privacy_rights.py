import os
import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from dependencies import limiter, get_current_user, AuthUser
from services.error_handler import http_exception_handler, rate_limit_handler
from routers import user_privacy

# Create an isolated test harness app to test user_privacy and payload security
test_app = FastAPI()
test_app.state.limiter = limiter
test_app.add_middleware(SlowAPIMiddleware)

# Apply the same payload size limiter middleware as in production main.py
MAX_UPLOAD_SIZE = 5 * 1024 * 1024
MAX_JSON_SIZE = 2 * 1024 * 1024

@test_app.middleware("http")
async def payload_size_limiter_middleware(request: Request, call_next):
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        content_type = request.headers.get("content-type", "").lower()
        
        is_upload = "multipart/form-data" in content_type or "/upload" in request.url.path or "/extract" in request.url.path
        limit = MAX_UPLOAD_SIZE if is_upload else MAX_JSON_SIZE

        if content_length:
            try:
                length = int(content_length)
                if length > limit:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "code": "PAYLOAD_TOO_LARGE",
                                "message": f"Request payload exceeds allowed limit of {limit // (1024 * 1024)}MB."
                            }
                        }
                    )
            except ValueError:
                pass
    return await call_next(request)

test_app.add_exception_handler(HTTPException, http_exception_handler)
test_app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
test_app.include_router(user_privacy.router)

@test_app.post("/test-post")
def dummy_post():
    return {"status": "ok"}


class TestPrivacyRightsAndSecurity(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(test_app, raise_server_exceptions=False)

    def test_export_data_unauthenticated_rejected(self):
        """Verifies that unauthenticated callers cannot access data export (401)."""
        response = self.client.get("/privacy/export-data")
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("error", data)

    def test_delete_account_unauthenticated_rejected(self):
        """Verifies that unauthenticated callers cannot delete accounts (401)."""
        response = self.client.delete("/privacy/delete-account")
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("error", data)

    @patch("services.usage_service.UsageService.get_topup_balance", return_value=5)
    @patch("services.entitlement_service.EntitlementService.get_active_entitlement", return_value={"plan_key": "iitb_free", "is_iitb": True})
    @patch("routers.user_privacy.get_supabase")
    @patch("routers.user_privacy.safe_execute")
    def test_export_data_authenticated_success(self, mock_safe_execute, mock_get_supabase, mock_ent, mock_usage):
        """Verifies that an authenticated user receives their portable DPDP data export."""
        mock_client = MagicMock()
        mock_get_supabase.return_value = mock_client
        mock_safe_execute.side_effect = lambda fn: MagicMock(data=[{"id": "item-1", "title": "Mock Record"}])

        mock_user = AuthUser(
            id="dpdp-test-user-1234",
            email="candidate@iitb.ac.in",
            is_iitb=True
        )
        test_app.dependency_overrides[get_current_user] = lambda: mock_user
        try:
            response = self.client.get("/privacy/export-data")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Check statutory DPDP Act 2023 metadata
            self.assertIn("metadata", data)
            self.assertEqual(data["metadata"]["platform"], "InternPrep AI")
            self.assertEqual(data["metadata"]["data_fiduciary"], "InternPrep AI Technologies Pvt. Ltd.")
            self.assertEqual(data["metadata"]["user_id"], "dpdp-test-user-1234")
            self.assertEqual(data["metadata"]["email"], "candidate@iitb.ac.in")
            
            # Check data categories
            self.assertIn("profile", data)
            self.assertIn("resumes", data)
            self.assertIn("achievements", data)
            self.assertIn("saved_bullets", data)
            self.assertIn("interview_sessions", data)
            self.assertIn("credits_and_entitlements", data)
            
            # Check content-disposition header
            self.assertIn("content-disposition", response.headers)
            self.assertIn("internprep_data_export_dpdp-tes.json", response.headers["content-disposition"])
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)

    @patch("routers.user_privacy.get_supabase")
    @patch("routers.user_privacy.safe_execute")
    def test_delete_account_authenticated_success(self, mock_safe_execute, mock_get_supabase):
        """Verifies that an authenticated user can trigger DPDP account erasure."""
        mock_client = MagicMock()
        mock_get_supabase.return_value = mock_client
        mock_safe_execute.return_value = MagicMock(data=[])

        mock_user = AuthUser(
            id="dpdp-delete-user-5678",
            email="delete-me@gmail.com",
            is_iitb=False
        )
        test_app.dependency_overrides[get_current_user] = lambda: mock_user
        try:
            response = self.client.delete("/privacy/delete-account")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "success")
            self.assertIn("DPDP Act 2023", data["message"])
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)

    def test_payload_size_limiter_rejects_oversized_json(self):
        """Verifies that DoW payload size limiter middleware returns 413 for oversized requests."""
        # 3MB exceeds the 2MB JSON limit
        oversized_headers = {
            "Content-Length": str(3 * 1024 * 1024),
            "Content-Type": "application/json"
        }
        response = self.client.post("/test-post", headers=oversized_headers)
        self.assertEqual(response.status_code, 413)
        data = response.json()
        self.assertEqual(data["error"]["code"], "PAYLOAD_TOO_LARGE")

    def test_payload_size_limiter_allows_normal_size(self):
        """Verifies that normal requests are not rejected by the 413 guard."""
        normal_headers = {
            "Content-Length": "16",
            "Content-Type": "application/json"
        }
        response = self.client.post("/test-post", headers=normal_headers, json={"key": "val"})
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
