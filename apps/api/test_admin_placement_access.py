import os
import unittest
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from routers.placement_analysis import get_access_store, save_access_store
from routers.admin import (
    GrantPlacementAccessRequest,
    RevokePlacementAccessRequest,
    CreatePlacementInviteRequest,
    grant_placement_access,
    revoke_placement_access,
    get_placement_access_overview,
    create_placement_invite_code,
    delete_placement_invite_code,
    list_users
)
from dependencies import AuthUser

class TestAdminPlacementAccess(unittest.TestCase):
    def setUp(self):
        self.admin = AuthUser(id="admin_1", email="krishnagahlod@gmail.com")

    def test_placement_access_lifecycle(self):
        test_email = "test_candidate_unit@iitb.ac.in"

        # 1. Grant Placement Access
        req = GrantPlacementAccessRequest(
            email=test_email,
            role="authorized_user",
            notes="Unit Test Mechanical 2026"
        )
        res = asyncio.run(grant_placement_access(body=req, admin=self.admin))
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["user"]["email"], test_email)

        # 2. Get Overview
        overview = asyncio.run(get_placement_access_overview(admin=self.admin))
        emails = [u["email"] for u in overview["whitelisted_users"]]
        self.assertIn(test_email, emails)

        # 3. List users with placement whitelist info
        users_res = asyncio.run(list_users(query=test_email, admin=self.admin))
        matching = next((u for u in users_res["users"] if u["email"] == test_email), None)
        self.assertIsNotNone(matching)
        self.assertTrue(matching["has_placement_access"])

        # 4. Create Invite Code
        code_req = CreatePlacementInviteRequest(code_name="IITB-TEST-AUTO")
        code_res = asyncio.run(create_placement_invite_code(body=code_req, admin=self.admin))
        self.assertEqual(code_res["status"], "success")
        self.assertIn("IITB-TEST-AUTO", code_res["invite_codes"])

        # 5. Delete Invite Code
        del_res = asyncio.run(delete_placement_invite_code(code="IITB-TEST-AUTO", admin=self.admin))
        self.assertEqual(del_res["status"], "success")
        self.assertNotIn("IITB-TEST-AUTO", del_res["invite_codes"])

        # 6. Revoke Placement Access
        rev_req = RevokePlacementAccessRequest(email=test_email)
        rev_res = asyncio.run(revoke_placement_access(body=rev_req, admin=self.admin))
        self.assertEqual(rev_res["status"], "success")

        # Verify removal
        post_overview = asyncio.run(get_placement_access_overview(admin=self.admin))
        post_emails = [u["email"] for u in post_overview["whitelisted_users"]]
        self.assertNotIn(test_email, post_emails)

if __name__ == "__main__":
    unittest.main()
