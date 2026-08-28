import os
import hmac
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from services.db import get_supabase
from services.entitlement_service import EntitlementService

from services.usage_service import UsageService

# Standard SaaS Tier Offerings & Micro-Transactions
PRICING_PLANS = {
    # Full Subscriptions
    "pro_1m": {
        "slug": "pro",
        "plan_code": "pro_1m",
        "type": "subscription",
        "title": "1-Month Sprint Pass",
        "duration_days": 30,
        "amount_inr": 299,
        "amount_paise": 29900,
        "description": "30-day full access with 30 resume reviews, 15 mock interviews, and 200 bullet variants"
    },
    "pro_3m": {
        "slug": "pro",
        "plan_code": "pro_3m",
        "type": "subscription",
        "title": "Placement Season Pass (3 Months)",
        "duration_days": 90,
        "amount_inr": 699,
        "amount_paise": 69900,
        "description": "90-day comprehensive access covering Phase 1 & Phase 2 campus placement drives"
    },
    "pro_season": {
        "slug": "pro",
        "plan_code": "pro_season",
        "type": "subscription",
        "title": "Placement Season Pass",
        "duration_days": 90,
        "amount_inr": 699,
        "amount_paise": 69900,
        "description": "90-day comprehensive access covering Phase 1 & Phase 2 campus placement drives"
    },
    "pro_1y": {
        "slug": "pro",
        "plan_code": "pro_1y",
        "type": "subscription",
        "title": "Comprehensive Master Pass (1 Year)",
        "duration_days": 365,
        "amount_inr": 1499,
        "amount_paise": 149900,
        "description": "365-day year-round career preparation with unlimited company dossiers"
    },
    "pro_master": {
        "slug": "pro",
        "plan_code": "pro_master",
        "type": "subscription",
        "title": "Comprehensive Master Pass",
        "duration_days": 365,
        "amount_inr": 1499,
        "amount_paise": 149900,
        "description": "365-day year-round career preparation with unlimited company dossiers"
    },
    # Micro-Transactions & Top-Ups
    "topup_resume_1": {
        "slug": "topup",
        "plan_code": "topup_resume_1",
        "type": "topup",
        "feature_key": "resume_analysis",
        "credits": 1,
        "title": "Single Deep Resume Scan",
        "duration_days": 0,
        "amount_inr": 49,
        "amount_paise": 4900,
        "description": "1 Instant deep ATS scan with full line-by-line AI reconstruct & unblurred feedback"
    },
    "topup_mock_1": {
        "slug": "topup",
        "plan_code": "topup_mock_1",
        "type": "topup",
        "feature_key": "mock_interview",
        "credits": 1,
        "title": "Single Full Mock Interview",
        "duration_days": 0,
        "amount_inr": 79,
        "amount_paise": 7900,
        "description": "1 Full 45-minute AI case/domain interview session with comprehensive scorecard"
    },
    "topup_resume_5": {
        "slug": "topup",
        "plan_code": "topup_resume_5",
        "type": "topup",
        "feature_key": "resume_analysis",
        "credits": 5,
        "title": "5-Pack Resume Reviews",
        "duration_days": 0,
        "amount_inr": 199,
        "amount_paise": 19900,
        "description": "5 Full deep resume critiques with ATS optimization (Never expires)"
    },
    "topup_mock_3": {
        "slug": "topup",
        "plan_code": "topup_mock_3",
        "type": "topup",
        "feature_key": "mock_interview",
        "credits": 3,
        "title": "3-Pack Mock Interviews",
        "duration_days": 0,
        "amount_inr": 199,
        "amount_paise": 19900,
        "description": "3 Complete technical/consulting case mock interviews with rubrics (Never expires)"
    }
}

class PaymentService:
    @staticmethod
    def get_available_plans() -> List[Dict[str, Any]]:
        return list(PRICING_PLANS.values())

    @staticmethod
    def get_all_plans() -> List[Dict[str, Any]]:
        return list(PRICING_PLANS.values())

    @classmethod
    def create_order(
        cls,
        user_id: str,
        user_email: str,
        plan_key: Optional[str] = None,
        plan_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a payment order via Razorpay or sandbox test simulator."""
        target_plan_key = plan_key or plan_code
        plan = PRICING_PLANS.get(target_plan_key)
        if not plan:
            raise HTTPException(status_code=400, detail=f"Invalid plan key: {target_plan_key}")

        key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_internprep")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        amount_paise = plan["amount_paise"]

        order_id = f"order_{uuid.uuid4().hex[:14]}"
        is_simulated = False
        
        # Live/Test Razorpay API order creation
        if key_secret and not key_id.startswith("rzp_test_internprep"):
            try:
                import razorpay
                client = razorpay.Client(auth=(key_id, key_secret))
                rzp_order = client.order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{user_id[:8]}_{int(datetime.now().timestamp())}",
                    "notes": {
                        "user_id": user_id,
                        "user_email": user_email,
                        "plan_code": target_plan_key,
                        "product_type": plan.get("type", "subscription"),
                        "duration_days": str(plan.get("duration_days", 0))
                    }
                })
                order_id = rzp_order["id"]
            except Exception as e:
                err_msg = str(e)
                print(f"Razorpay API order creation failed: {err_msg}")
                if "Authentication failed" in err_msg or "401" in err_msg:
                    raise HTTPException(
                        status_code=502,
                        detail="Razorpay Authentication Failed: Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is invalid, expired, or was regenerated in Razorpay Dashboard. Please copy the latest Key ID and Secret from Razorpay Dashboard -> API Keys."
                    )
                raise HTTPException(status_code=502, detail=f"Razorpay gateway order creation failed: {err_msg}")
        elif not key_secret and os.getenv("ALLOW_PAYMENT_SIMULATION", "false").lower() == "true":
            is_simulated = True
        elif not key_secret:
            raise HTTPException(
                status_code=500,
                detail="RAZORPAY_KEY_SECRET is not configured on backend server. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables."
            )

        # Persist transaction in created state
        supabase = get_supabase()
        try:
            if supabase:
                supabase.table("payment_transactions").insert({
                    "user_id": user_id,
                    "product": "internprep_ai",
                    "plan_slug": plan["slug"],
                    "duration_days": plan.get("duration_days", 0),
                    "amount_inr": plan["amount_inr"],
                    "currency": "INR",
                    "provider": "razorpay",
                    "provider_order_id": order_id,
                    "status": "created",
                    "raw_payload": {"plan_code": target_plan_key, "user_email": user_email, "is_simulated": is_simulated}
                }).execute()
        except Exception as e:
            print(f"Warning: Failed to record payment transaction: {e}")

        return {
            "order_id": order_id,
            "amount": plan["amount_inr"],
            "amount_paise": amount_paise,
            "currency": "INR",
            "key_id": key_id,
            "is_simulated": is_simulated,
            "plan_title": plan["title"],
            "duration_days": plan.get("duration_days", 0),
            "user_email": user_email,
            "product_type": plan.get("type", "subscription")
        }

    @classmethod
    def verify_payment(
        cls,
        user_id: str,
        user_email: str,
        razorpay_order_id: Optional[str] = None,
        razorpay_payment_id: Optional[str] = None,
        razorpay_signature: Optional[str] = None,
        plan_key: Optional[str] = None,
        order_id: Optional[str] = None,
        payment_id: Optional[str] = None,
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verifies payment authenticity, enforces idempotency, and activates Pro entitlement or adds top-up credits.
        """
        effective_order_id = razorpay_order_id or order_id or ""
        effective_payment_id = razorpay_payment_id or payment_id or ""
        effective_signature = razorpay_signature or signature or ""

        key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_internprep")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        is_live = bool(key_secret and not key_id.startswith("rzp_test_internprep"))
        
        # In production/live mode, require strict HMAC-SHA256 signature verification
        if is_live:
            if not effective_signature or effective_signature == "sandbox_valid_signature" or not effective_order_id or not effective_payment_id:
                raise HTTPException(status_code=400, detail="Invalid payment verification request. Cryptographic signature required.")
            
            generated_signature = hmac.new(
                key_secret.encode("utf-8"),
                f"{effective_order_id}|{effective_payment_id}".encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(generated_signature, effective_signature):
                raise HTTPException(status_code=400, detail="Invalid Razorpay signature verification failed.")
        else:
            # Sandbox / local simulation mode
            if key_secret and effective_signature and effective_signature != "sandbox_valid_signature":
                generated_signature = hmac.new(
                    key_secret.encode("utf-8"),
                    f"{effective_order_id}|{effective_payment_id}".encode("utf-8"),
                    hashlib.sha256
                ).hexdigest()
                if not hmac.compare_digest(generated_signature, effective_signature):
                    raise HTTPException(status_code=400, detail="Invalid Razorpay signature verification failed.")

        # Idempotency check: verify if payment was already captured
        supabase = get_supabase()
        item_plan = PRICING_PLANS.get(plan_key, PRICING_PLANS["pro_1m"])
        duration_days = item_plan.get("duration_days", 30)
        plan_slug = item_plan.get("slug", "pro")
        product_type = item_plan.get("type", "subscription")

        if supabase:
            try:
                res = supabase.table("payment_transactions") \
                    .select("*") \
                    .eq("provider_order_id", effective_order_id) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    tx = res.data[0]
                    duration_days = tx.get("duration_days", duration_days)
                    plan_slug = tx.get("plan_slug", plan_slug)
                    
                    if tx.get("status") == "captured":
                        # Already processed -> return existing active entitlement
                        ent = EntitlementService.get_active_entitlement(user_id, user_email)
                        return {"status": "success", "message": "Payment already verified", "entitlement": ent}

                # Update transaction status to captured
                supabase.table("payment_transactions").update({
                    "provider_payment_id": effective_payment_id,
                    "provider_signature": effective_signature or "simulated",
                    "status": "captured",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("provider_order_id", effective_order_id).execute()
            except Exception as e:
                print(f"Transaction update error: {e}")

        # Handle Micro-Transactions / Top-Ups
        if product_type == "topup":
            feature_key = item_plan.get("feature_key", "resume_analysis")
            credits = item_plan.get("credits", 1)
            new_bal = UsageService.add_topup_credits(user_id=user_id, feature_key=feature_key, credits=credits)
            entitlement = EntitlementService.get_active_entitlement(user_id=user_id, user_email=user_email)
            return {
                "status": "success",
                "message": f"🎉 Successfully added {credits} {item_plan['title']} credits! New balance: {new_bal}",
                "entitlement": entitlement,
                "topup": item_plan,
                "credits_added": credits,
                "payment_id": effective_payment_id,
                "order_id": effective_order_id
            }

        # Handle Subscription Pass Grant
        entitlement = EntitlementService.grant_entitlement(
            user_id=user_id,
            plan_key=plan_key or plan_slug,
            duration_days=duration_days,
            source="razorpay",
            external_reference=effective_payment_id,
            metadata={"order_id": effective_order_id, "payment_id": effective_payment_id, "email": user_email}
        )

        return {
            "status": "success",
            "message": f"🎉 Successfully activated {item_plan['title']} for {duration_days} days!",
            "entitlement": entitlement,
            "payment_id": effective_payment_id,
            "order_id": effective_order_id
        }

    @classmethod
    def process_webhook(
        cls,
        raw_body: bytes,
        signature: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Processes server-to-server Razorpay webhooks with cryptographic HMAC validation and idempotency."""
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
        
        if webhook_secret and signature:
            generated_sig = hmac.new(
                webhook_secret.encode("utf-8"),
                raw_body,
                hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(generated_sig, signature):
                from services.security_logger import safe_log_error
                safe_log_error("Invalid Razorpay webhook HMAC signature.")
                return False

        try:
            event_data = payload or json.loads(raw_body.decode("utf-8"))
            event = event_data.get("event")
            
            if event in ["payment.captured", "order.paid"]:
                p_data = event_data.get("payload", {})
                payment = p_data.get("payment", {}).get("entity", {})
                order_id = payment.get("order_id")
                payment_id = payment.get("id")
                notes = payment.get("notes", {})
                user_id = notes.get("user_id")
                user_email = notes.get("user_email", "")

                if user_id and order_id and payment_id:
                    cls.verify_payment(
                        user_id=user_id,
                        user_email=user_email,
                        order_id=order_id,
                        payment_id=payment_id
                    )
            return True
        except Exception as e:
            from services.security_logger import safe_log_error
            safe_log_error("Webhook processing error", exc=e)
            return False
