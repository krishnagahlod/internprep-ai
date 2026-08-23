import os
import unittest
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

from services.entitlement_service import EntitlementService, is_iitb_email, is_admin_email, DEFAULT_PLANS
from services.usage_service import UsageService, _IN_MEMORY_USAGE_CACHE
from services.session_service import SessionService
from services.payment_service import PaymentService, PRICING_PLANS

class TestSaasEntitlementsAndMonetization(unittest.TestCase):
    def setUp(self):
        # Reset in-memory test caches
        _IN_MEMORY_USAGE_CACHE.clear()

    def test_iitb_email_recognition(self):
        """Validates that @iitb.ac.in emails are recognized and free users are not."""
        self.assertTrue(is_iitb_email("student@iitb.ac.in"))
        self.assertTrue(is_iitb_email("krishna.gahlod@iitb.ac.in"))
        self.assertTrue(is_iitb_email("SUBDOMAIN.USER@ME.IITB.AC.IN"))
        
        self.assertFalse(is_iitb_email("student@gmail.com"))
        self.assertFalse(is_iitb_email("user@iitd.ac.in"))
        self.assertFalse(is_iitb_email("fake_iitb.ac.in@yahoo.com"))

    def test_admin_email_recognition(self):
        """Validates admin email recognition."""
        self.assertTrue(is_admin_email("krishnagahlod@gmail.com"))
        self.assertFalse(is_admin_email("random_user@gmail.com"))

    def test_iitb_entitlement_resolution(self):
        """Ensures IITB emails automatically resolve to iitb_free tier with correct quotas."""
        ent = EntitlementService.get_active_entitlement(user_id="test_iitb_123", user_email="student@iitb.ac.in")
        self.assertEqual(ent["plan_key"], "iitb_free")
        self.assertTrue(ent["is_iitb"])
        self.assertEqual(ent["limits"]["resume_analysis"], 30)
        self.assertEqual(ent["limits"]["mock_interview"], 15)
        self.assertEqual(ent["limits"]["bullet_refine"], 200)

    def test_free_user_entitlement_resolution(self):
        """Ensures non-IITB regular users resolve to free tier."""
        ent = EntitlementService.get_active_entitlement(user_id="test_free_123", user_email="external@gmail.com")
        self.assertEqual(ent["plan_key"], "free")
        self.assertFalse(ent["is_iitb"])
        self.assertEqual(ent["limits"]["resume_analysis"], 2)
        self.assertEqual(ent["limits"]["mock_interview"], 1)
        self.assertEqual(ent["limits"]["bullet_refine"], 10)

    def test_quota_consumption_and_exhaustion(self):
        """Tests that quota consumption tracks usage and blocks when limit is exceeded."""
        user_id = "test_quota_user_999"
        plan_key = "free"
        
        # Free allows 2 resume analyses
        res1 = UsageService.consume_quota(user_id=user_id, plan_key=plan_key, feature_key="resume_analysis", units=1)
        self.assertEqual(res1["used_count"], 1)
        self.assertEqual(res1["remaining_count"], 1)

        res2 = UsageService.consume_quota(user_id=user_id, plan_key=plan_key, feature_key="resume_analysis", units=1)
        self.assertEqual(res2["used_count"], 2)
        self.assertEqual(res2["remaining_count"], 0)

        # 3rd attempt must raise 403 HTTPException with upgrade details
        with self.assertRaises(HTTPException) as ctx:
            UsageService.consume_quota(user_id=user_id, plan_key=plan_key, feature_key="resume_analysis", units=1)
        
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("reached your", ctx.exception.detail["message"].lower())
        self.assertTrue(ctx.exception.detail["upgrade_required"])

    def test_payment_order_creation_and_simulation(self):
        """Tests order creation and sandbox payment verification for Pro pass."""
        order = PaymentService.create_order(
            user_id="test_buyer_456",
            user_email="buyer@gmail.com",
            plan_key="pro_1m"
        )
        self.assertIn("order_id", order)
        self.assertEqual(order["amount"], 299)
        self.assertEqual(order["currency"], "INR")

        # Compute HMAC signature for test
        import hmac, hashlib
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        test_payment_id = "pay_simulated_test_123"
        test_sig = hmac.new(
            key_secret.encode("utf-8"),
            f"{order['order_id']}|{test_payment_id}".encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # Verify payment
        verification = PaymentService.verify_payment(
            user_id="test_buyer_456",
            user_email="buyer@gmail.com",
            razorpay_order_id=order["order_id"],
            razorpay_payment_id=test_payment_id,
            razorpay_signature=test_sig,
            plan_key="pro_1m"
        )
        self.assertEqual(verification["status"], "success")

        # Check active entitlement is now Pro
        active_ent = EntitlementService.get_active_entitlement(user_id="test_buyer_456", user_email="buyer@gmail.com")
        self.assertTrue(active_ent["plan_key"].startswith("pro"))
        self.assertEqual(active_ent["limits"]["resume_analysis"], 30)
        self.assertEqual(active_ent["limits"]["mock_interview"], 15)

    def test_session_management_and_remote_signout(self):
        """Tests device recording, active session tracking, and remote logout."""
        user_id = "test_multi_device_user"
        
        SessionService.record_session(user_id=user_id, session_id="sess_laptop", user_agent="Mozilla/5.0 Mac", client_ip="192.168.1.1")
        SessionService.record_session(user_id=user_id, session_id="sess_phone", user_agent="Mozilla/5.0 iPhone", client_ip="192.168.1.2")
        SessionService.record_session(user_id=user_id, session_id="sess_tablet", user_agent="Mozilla/5.0 iPad", client_ip="192.168.1.3")

        self.assertFalse(SessionService.is_session_revoked("sess_phone"))

        # User clicks "Sign out all other devices" from laptop
        revoked_count = SessionService.revoke_all_other_sessions(user_id=user_id, current_session_id="sess_laptop")
        self.assertGreaterEqual(revoked_count, 2)

        # Phone and tablet should now be revoked; laptop must remain valid
        self.assertTrue(SessionService.is_session_revoked("sess_phone"))
        self.assertTrue(SessionService.is_session_revoked("sess_tablet"))
        self.assertFalse(SessionService.is_session_revoked("sess_laptop"))

if __name__ == "__main__":
    unittest.main()
