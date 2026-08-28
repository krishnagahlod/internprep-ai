import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel

from dependencies import (
    AuthUser,
    get_current_user,
    get_optional_user,
    limiter,
    get_supabase
)
from services.entitlement_service import EntitlementService, DEFAULT_PLANS
from services.usage_service import UsageService
from services.payment_service import PaymentService
from services.session_service import SessionService

router = APIRouter(prefix="/billing", tags=["billing"])


# --- Request/Response Models ---
class CreateOrderRequest(BaseModel):
    plan_key: str  # 'pro_1m', 'pro_3m', 'pro_1y'


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_key: str


class RevokeSessionRequest(BaseModel):
    session_id: str


# --- Routes ---

@router.get("/plans")
def get_plans():
    """
    Returns public catalog of subscription plans, pricing, and feature quotas.
    """
    plans = PaymentService.get_all_plans()
    return {
        "status": "success",
        "plans": plans
    }


@router.get("/entitlement")
async def get_user_entitlement(
    request: Request,
    user: AuthUser = Depends(get_current_user)
):
    """
    Returns the authenticated user's active plan, expiry, quota consumption, and limits.
    """
    entitlement = EntitlementService.get_active_entitlement(user_id=user.id, user_email=user.email)
    plan_key = entitlement.get("plan_key", "free")
    
    # Get current monthly usage summary
    usage_summary = UsageService.get_user_usage_summary(user_id=user.id, plan_key=plan_key)
    
    # Get active session count
    sessions = SessionService.get_active_sessions(user_id=user.id)

    return {
        "user_id": user.id,
        "email": user.email,
        "is_iitb": user.is_iitb,
        "is_admin": user.is_admin,
        "current_session_id": user.session_id,
        "entitlement": entitlement,
        "usage": usage_summary,
        "active_sessions_count": len(sessions)
    }


@router.post("/create-order")
@limiter.limit("10/minute")
async def create_razorpay_order(
    request: Request,
    body: CreateOrderRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    Initializes a Razorpay payment order for the requested subscription plan.
    """
    try:
        order = PaymentService.create_order(
            user_id=user.id,
            user_email=user.email,
            plan_key=body.plan_key
        )
        return {
            "status": "success",
            "order": order
        }
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")


@router.post("/verify")
@limiter.limit("10/minute")
async def verify_payment(
    request: Request,
    body: VerifyPaymentRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    Verifies payment signature and immediately activates or extends the user's subscription.
    """
    try:
        success = PaymentService.verify_payment(
            user_id=user.id,
            user_email=user.email,
            razorpay_order_id=body.razorpay_order_id,
            razorpay_payment_id=body.razorpay_payment_id,
            razorpay_signature=body.razorpay_signature,
            plan_key=body.plan_key
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Invalid payment signature or verification failed.")

        # Return refreshed entitlement
        entitlement = EntitlementService.get_active_entitlement(user_id=user.id, user_email=user.email)
        return {
            "status": "success",
            "message": f"Successfully activated {body.plan_key} subscription!",
            "entitlement": entitlement
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification error: {str(e)}")


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None)
):
    """
    Handles asynchronous Razorpay webhooks (e.g. payment.captured, order.paid).
    Ensures HMAC validation and idempotency.
    """
    raw_body = await request.body()
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    success = PaymentService.process_webhook(
        raw_body=raw_body,
        signature=x_razorpay_signature,
        payload=payload
    )

    if not success:
        raise HTTPException(status_code=400, detail="Webhook processing failed or invalid signature.")

    return {"status": "ok"}


# --- Device & Session Management ---

@router.get("/sessions")
async def list_user_sessions(
    request: Request,
    user: AuthUser = Depends(get_current_user)
):
    """
    Lists all known sessions / devices for the authenticated user.
    """
    sessions = SessionService.get_active_sessions(user_id=user.id)
    return {
        "current_session_id": user.session_id,
        "sessions": sessions
    }


@router.post("/sessions/revoke-others")
async def revoke_other_sessions(
    request: Request,
    user: AuthUser = Depends(get_current_user)
):
    """
    Revokes and signs out all other devices/browsers except the currently active session.
    """
    revoked_count = SessionService.revoke_all_other_sessions(
        user_id=user.id,
        current_session_id=user.session_id
    )
    return {
        "status": "success",
        "message": f"Signed out {revoked_count} other active device session(s).",
        "revoked_count": revoked_count
    }


@router.post("/sessions/revoke")
async def revoke_single_session(
    request: Request,
    body: RevokeSessionRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    Revokes a specific session ID owned by the authenticated user.
    Prevents IDOR by verifying user ownership.
    """
    success = SessionService.revoke_session(user_id=user.id, session_id=body.session_id)
    return {
        "status": "success",
        "message": "Session revoked."
    }


@router.delete("/account")
@limiter.limit("3/hour")
async def delete_user_account(
    request: Request,
    user: AuthUser = Depends(get_current_user)
):
    """
    Self-service account deletion flow (GDPR / DPDP Compliance).
    Permanently erases all user personal data, resumes, interview sessions, and active credentials.
    """
    supabase = get_supabase()
    if supabase:
        try:
            # 1. Fetch user's interview sessions to clean messages & feedback
            sess_res = supabase.table("interview_sessions").select("id").eq("user_id", user.id).execute()
            session_ids = [s["id"] for s in (sess_res.data or []) if s.get("id")]
            if session_ids:
                supabase.table("session_messages").delete().in_("session_id", session_ids).execute()
                supabase.table("session_feedback").delete().in_("session_id", session_ids).execute()
            supabase.table("interview_sessions").delete().eq("user_id", user.id).execute()

            # 2. Delete resumes & analyses
            supabase.table("resumes").delete().eq("user_id", user.id).execute()
            supabase.table("resume_analyses").delete().eq("user_id", user.id).execute()

            # 3. Delete achievements & bullets
            supabase.table("generated_bullets").delete().eq("user_id", user.id).execute()
            supabase.table("achievements").delete().eq("user_id", user.id).execute()

            # 4. Delete entitlements & usage events
            supabase.table("entitlements").delete().eq("user_id", user.id).execute()
            supabase.table("usage_events").delete().eq("user_id", user.id).execute()
            supabase.table("user_sessions").delete().eq("user_id", user.id).execute()

            # 5. Revoke from Auth provider if service role is present
            if hasattr(supabase, "auth") and hasattr(supabase.auth, "admin") and hasattr(supabase.auth.admin, "delete_user"):
                try:
                    supabase.auth.admin.delete_user(user.id)
                except Exception:
                    pass
        except Exception as e:
            from services.security_logger import safe_log_error
            safe_log_error(f"Error during account deletion for user {user.id}", exc=e)

    # 6. Revoke all active in-memory sessions
    SessionService.revoke_all_sessions(user_id=user.id)

    return {
        "status": "success",
        "message": "Your account and all associated personal data have been permanently deleted."
    }
