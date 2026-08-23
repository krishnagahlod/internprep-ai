import os
import unittest
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

from services.entitlement_service import EntitlementService, is_iitb_email, is_admin_email, DEFAULT_PLANS
from services.usage_service import UsageService, _IN_MEMORY_USAGE_CACHE, _IN_MEMORY_TOPUP_CREDITS
from services.session_service import SessionService
from services.payment_service import PaymentService, PRICING_PLANS
from services.bullet_cache_service import BulletCacheService

class TestSaasEntitlementsAndMonetization(unittest.TestCase):
    def setUp(self):
        # Reset in-memory test caches
        _IN_MEMORY_USAGE_CACHE.clear()
        _IN_MEMORY_TOPUP_CREDITS.clear()

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

    def test_iitb_calibrated_entitlement_resolution(self):
        """Ensures IITB emails automatically resolve to iitb_free tier with calibrated quotas (10 reviews, 10 mocks)."""
        ent = EntitlementService.get_active_entitlement(user_id="test_iitb_123", user_email="student@iitb.ac.in")
        self.assertEqual(ent["plan_key"], "iitb_free")
        self.assertTrue(ent["is_iitb"])
        self.assertEqual(ent["limits"]["resume_analysis"], 10)
        self.assertEqual(ent["limits"]["mock_interview"], 10)
        self.assertEqual(ent["limits"]["bullet_refine"], 100)

    def test_free_user_entitlement_resolution(self):
        """Ensures non-IITB regular users resolve to free tier."""
        ent = EntitlementService.get_active_entitlement(user_id="test_free_123", user_email="external@gmail.com")
        self.assertEqual(ent["plan_key"], "free")
        self.assertFalse(ent["is_iitb"])
        self.assertEqual(ent["limits"]["resume_analysis"], 2)
        self.assertEqual(ent["limits"]["mock_interview"], 1)
        self.assertEqual(ent["limits"]["bullet_refine"], 10)

    def test_topup_credit_priority_and_consumption(self):
        """Tests that top-up credits seamlessly extend base quota and are consumed in correct order."""
        user_id = "test_topup_user_888"
        plan_key = "free"
        feature_key = "resume_analysis"

        # 1. Initially 2 free base reviews
        quota0 = UsageService.check_quota(user_id, plan_key, feature_key)
        self.assertEqual(quota0["base_remaining"], 2)
        self.assertEqual(quota0["topup_credits"], 0)
        self.assertEqual(quota0["remaining"], 2)

        # 2. Add 1 top-up review credit (e.g. ₹49 pass)
        UsageService.add_topup_credits(user_id, feature_key, 1)
        quota1 = UsageService.check_quota(user_id, plan_key, feature_key)
        self.assertEqual(quota1["base_remaining"], 2)
        self.assertEqual(quota1["topup_credits"], 1)
        self.assertEqual(quota1["remaining"], 3)

        # 3. Consume 1st unit (should consume from base quota)
        r1 = UsageService.consume_quota(user_id, plan_key, feature_key, units=1)
        self.assertEqual(r1["base_remaining"], 1)
        self.assertEqual(r1["topup_credits"], 1)
        self.assertEqual(r1["remaining"], 2)

        # 4. Consume 2nd unit (should exhaust base quota)
        r2 = UsageService.consume_quota(user_id, plan_key, feature_key, units=1)
        self.assertEqual(r2["base_remaining"], 0)
        self.assertEqual(r2["topup_credits"], 1)
        self.assertEqual(r2["remaining"], 1)

        # 5. Consume 3rd unit (should consume top-up credit)
        r3 = UsageService.consume_quota(user_id, plan_key, feature_key, units=1)
        self.assertEqual(r3["base_remaining"], 0)
        self.assertEqual(r3["topup_credits"], 0)
        self.assertEqual(r3["remaining"], 0)

        # 6. 4th attempt must be blocked
        with self.assertRaises(HTTPException) as ctx:
            UsageService.consume_quota(user_id, plan_key, feature_key, units=1)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_bullet_cache_hashing_and_partitioning(self):
        """Tests deterministic SHA-256 bullet normalization and partition caching."""
        bullet_a = "  - Led a team of 5 engineers to build a high-throughput API in Python, decreasing latency by 35%. "
        bullet_b = "Managed cross-functional product roadmap for Q3 enterprise release."

        hash_a = BulletCacheService.get_bullet_hash(bullet_a)
        self.assertTrue(len(hash_a) == 64)

        # Cache critique for bullet A
        BulletCacheService.cache_bullet_critique(
            raw_bullet=bullet_a,
            score=88,
            critique={"strengths": ["Strong metrics"], "weaknesses": []},
            suggested_rewrites=["Architected scalable Python API service..."]
        )

        # Retrieve cached bullet
        cached = BulletCacheService.get_cached_bullet(bullet_a)
        self.assertIsNotNone(cached)
        self.assertEqual(cached["score"], 88)
        self.assertTrue(cached["is_cached"])

        # Partition bullets: bullet A is cached, bullet B is uncached
        cached_map, uncached_list = BulletCacheService.partition_bullets_by_cache([bullet_a, bullet_b])
        self.assertIn(bullet_a, cached_map)
        self.assertIn(bullet_b, uncached_list)
        self.assertEqual(len(uncached_list), 1)

    def test_payment_order_creation_and_simulation(self):
        """Tests order creation and payment verification for Pro pass."""
        import unittest.mock as mock
        with mock.patch("services.payment_service.PaymentService.create_order", return_value={
            "order_id": "order_test_mock_123",
            "amount": 299,
            "amount_paise": 29900,
            "currency": "INR",
            "key_id": "rzp_test_mock",
            "plan_title": "InternPrep Pro (1 Month)",
            "duration_days": 30,
            "user_email": "buyer@gmail.com"
        }):
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
        """Tests device recording, strict single-device concurrency revocation, and remote logout."""
        user_id = "test_multi_device_user"
        
        # User logs in on laptop -> active
        SessionService.record_session(user_id=user_id, session_id="sess_laptop", user_agent="Mozilla/5.0 Mac", client_ip="192.168.1.1")
        self.assertFalse(SessionService.is_session_revoked("sess_laptop"))

        # User logs in on phone -> laptop is auto-revoked, phone is active
        SessionService.record_session(user_id=user_id, session_id="sess_phone", user_agent="Mozilla/5.0 iPhone", client_ip="192.168.1.2")
        self.assertTrue(SessionService.is_session_revoked("sess_laptop"))
        self.assertFalse(SessionService.is_session_revoked("sess_phone"))

        # User logs in on tablet -> phone is auto-revoked, tablet is active
        SessionService.record_session(user_id=user_id, session_id="sess_tablet", user_agent="Mozilla/5.0 iPad", client_ip="192.168.1.3")
        self.assertTrue(SessionService.is_session_revoked("sess_laptop"))
        self.assertTrue(SessionService.is_session_revoked("sess_phone"))
        self.assertFalse(SessionService.is_session_revoked("sess_tablet"))

        # Manual revoke on tablet
        SessionService.revoke_session(user_id=user_id, session_id="sess_tablet")
        self.assertTrue(SessionService.is_session_revoked("sess_tablet"))

if __name__ == "__main__":
    unittest.main()
