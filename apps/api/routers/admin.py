import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel

from dependencies import (
    AuthUser,
    require_admin,
    limiter,
    get_supabase
)
from services.entitlement_service import EntitlementService, DEFAULT_PLANS
from services.usage_service import UsageService
from services.payment_service import PaymentService
from services.session_service import SessionService

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Request Models ---
class GrantEntitlementRequest(BaseModel):
    user_id: str
    user_email: Optional[str] = None
    plan_key: str  # 'pro_1m', 'pro_3m', 'pro_1y', 'lifetime', 'iitb_free', 'admin', 'free'
    custom_days: Optional[int] = None
    reason: Optional[str] = "Admin manual grant"


class RevokeEntitlementRequest(BaseModel):
    user_id: str
    reason: Optional[str] = "Admin manual revocation"


class ExtendEntitlementRequest(BaseModel):
    user_id: str
    additional_days: int
    reason: Optional[str] = "Admin extension"


class ResetUsageRequest(BaseModel):
    user_id: str
    feature_key: Optional[str] = None  # None resets all features for current month


class SuspendUserRequest(BaseModel):
    user_id: str
    reason: Optional[str] = "Administrative suspension"


# --- In-Memory Audit Log Fallback ---
_ADMIN_AUDIT_LOGS: List[Dict[str, Any]] = []


def _record_audit_log(admin_email: str, action: str, target_user_id: str, details: Dict[str, Any]):
    log_entry = {
        "id": f"audit_{len(_ADMIN_AUDIT_LOGS) + 1}",
        "admin_email": admin_email,
        "action": action,
        "target_user_id": target_user_id,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    _ADMIN_AUDIT_LOGS.insert(0, log_entry)

    # Attempt to persist to Supabase if table exists
    try:
        supabase = get_supabase()
        if supabase:
            supabase.table("admin_audit_logs").insert({
                "admin_email": admin_email,
                "action": action,
                "target_user_id": target_user_id,
                "details": details
            }).execute()
    except Exception:
        pass


# --- Admin Routes ---

@router.get("/stats")
async def get_admin_stats(admin: AuthUser = Depends(require_admin)):
    """
    Returns platform-wide business intelligence metrics (subscribers, tier distribution, MRR, usage).
    """
    supabase = get_supabase()
    total_users = 0
    active_subscriptions = 0
    tier_distribution = {"free": 0, "iitb_free": 0, "pro_1m": 0, "pro_3m": 0, "pro_1y": 0, "lifetime": 0, "admin": 0}
    total_revenue_inr = 0
    total_analyses = 0

    if supabase:
        try:
            # Users count
            users_res = supabase.table("profiles").select("id", count="exact").execute()
            total_users = users_res.count or len(users_res.data or [])
        except Exception:
            pass

        try:
            # Entitlements
            ent_res = supabase.table("entitlements").select("plan_key, status, expires_at").execute()
            if ent_res.data:
                for row in ent_res.data:
                    pk = row.get("plan_key", "free")
                    tier_distribution[pk] = tier_distribution.get(pk, 0) + 1
                    if pk.startswith("pro_") or pk == "lifetime":
                        active_subscriptions += 1
        except Exception:
            pass

        try:
            # Payment transactions
            tx_res = supabase.table("payment_transactions").select("amount_inr, status").eq("status", "captured").execute()
            if tx_res.data:
                total_revenue_inr = sum(r.get("amount_inr", 0) for r in tx_res.data)
        except Exception:
            pass

        try:
            # Resume analyses count
            res_count = supabase.table("resume_analyses").select("id", count="exact").execute()
            total_analyses = res_count.count or len(res_count.data or [])
        except Exception:
            pass

    return {
        "total_users": max(total_users, 1),
        "active_subscriptions": active_subscriptions,
        "tier_distribution": tier_distribution,
        "total_revenue_inr": total_revenue_inr,
        "total_analyses": total_analyses,
        "plans": DEFAULT_PLANS
    }


@router.get("/users")
async def list_users(
    query: Optional[str] = None,
    plan: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    admin: AuthUser = Depends(require_admin)
):
    """
    Lists users with their active plan, expiry, IITB status, and usage metrics.
    """
    supabase = get_supabase()
    users_list = []

    if supabase:
        try:
            # Query profiles table
            req = supabase.table("profiles").select("id, email, full_name, college, created_at")
            if query:
                req = req.ilike("email", f"%{query}%")
            
            res = req.limit(limit).offset(offset).execute()
            profiles = res.data or []

            for prof in profiles:
                uid = str(prof.get("id"))
                email = str(prof.get("email") or "")
                ent = EntitlementService.get_active_entitlement(user_id=uid, user_email=email)
                usage = UsageService.get_user_usage_summary(user_id=uid, plan_key=ent.get("plan_key", "free"))
                
                # Filter by plan if requested
                if plan and ent.get("plan_key") != plan:
                    continue

                users_list.append({
                    "id": uid,
                    "email": email,
                    "full_name": prof.get("full_name"),
                    "college": prof.get("college"),
                    "created_at": prof.get("created_at"),
                    "entitlement": ent,
                    "usage": usage
                })
        except Exception as e:
            print(f"Error listing users: {e}")

    # If no DB users found, return current admin user representation
    if not users_list:
        ent = EntitlementService.get_active_entitlement(user_id=admin.id, user_email=admin.email)
        usage = UsageService.get_user_usage_summary(user_id=admin.id, plan_key="admin")
        users_list.append({
            "id": admin.id,
            "email": admin.email,
            "full_name": "Admin User",
            "college": "IIT Bombay",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "entitlement": ent,
            "usage": usage
        })

    return {
        "count": len(users_list),
        "users": users_list
    }


@router.post("/users/grant")
async def grant_user_entitlement(
    body: GrantEntitlementRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin grants a subscription tier to a user (with optional custom duration).
    """
    plan = DEFAULT_PLANS.get(body.plan_key)
    duration_days = body.custom_days or (plan.get("duration_days") if plan else 30)

    success = EntitlementService.grant_entitlement(
        user_id=body.user_id,
        plan_key=body.plan_key,
        duration_days=duration_days,
        source="admin_grant",
        notes=f"{body.reason} (Granted by {admin.email})"
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to grant entitlement")

    _record_audit_log(
        admin_email=admin.email,
        action="GRANT_ENTITLEMENT",
        target_user_id=body.user_id,
        details={
            "plan_key": body.plan_key,
            "duration_days": duration_days,
            "reason": body.reason
        }
    )

    updated_entitlement = EntitlementService.get_active_entitlement(user_id=body.user_id, user_email=body.user_email)
    return {
        "status": "success",
        "message": f"Successfully granted {body.plan_key} to user {body.user_id}",
        "entitlement": updated_entitlement
    }


@router.post("/users/revoke")
async def revoke_user_entitlement(
    body: RevokeEntitlementRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin revokes paid/special access and downgrades user to Free tier.
    """
    success = EntitlementService.revoke_entitlement(
        user_id=body.user_id,
        reason=f"{body.reason} (Revoked by {admin.email})"
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to revoke entitlement")

    _record_audit_log(
        admin_email=admin.email,
        action="REVOKE_ENTITLEMENT",
        target_user_id=body.user_id,
        details={"reason": body.reason}
    )

    return {
        "status": "success",
        "message": f"Successfully revoked access for user {body.user_id}"
    }


@router.post("/users/extend")
async def extend_user_entitlement(
    body: ExtendEntitlementRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin extends active subscription period by N days.
    """
    ent = EntitlementService.get_active_entitlement(user_id=body.user_id)
    current_expires = ent.get("expires_at")
    
    if current_expires:
        try:
            curr_dt = datetime.fromisoformat(current_expires.replace("Z", "+00:00"))
            base_dt = max(curr_dt, datetime.now(timezone.utc))
        except Exception:
            base_dt = datetime.now(timezone.utc)
    else:
        base_dt = datetime.now(timezone.utc)

    new_expires_dt = base_dt + timedelta(days=body.additional_days)
    new_expires_iso = new_expires_dt.isoformat()

    # Re-grant with updated expiry
    EntitlementService.grant_entitlement(
        user_id=body.user_id,
        plan_key=ent.get("plan_key", "pro_1m"),
        duration_days=int((new_expires_dt - datetime.now(timezone.utc)).total_seconds() // 86400),
        source="admin_extension",
        notes=f"{body.reason} (+{body.additional_days}d by {admin.email})"
    )

    _record_audit_log(
        admin_email=admin.email,
        action="EXTEND_ENTITLEMENT",
        target_user_id=body.user_id,
        details={
            "additional_days": body.additional_days,
            "new_expires_at": new_expires_iso,
            "reason": body.reason
        }
    )

    return {
        "status": "success",
        "message": f"Extended subscription by {body.additional_days} days until {new_expires_iso}",
        "new_expires_at": new_expires_iso
    }


@router.post("/users/reset-usage")
async def reset_user_usage(
    body: ResetUsageRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin resets feature usage counts for a user (e.g. for customer support).
    """
    current_period = UsageService.get_current_period_key()
    supabase = get_supabase()
    
    if supabase:
        try:
            req = supabase.table("usage_events").delete().eq("user_id", body.user_id).eq("period_key", current_period)
            if body.feature_key:
                req = req.eq("feature_key", body.feature_key)
            req.execute()
        except Exception:
            pass

    # Clear in-memory usage cache
    from services.usage_service import _IN_MEMORY_USAGE_CACHE
    keys_to_del = [k for k in _IN_MEMORY_USAGE_CACHE if k.startswith(f"{body.user_id}:")]
    for k in keys_to_del:
        if not body.feature_key or f":{body.feature_key}:" in k:
            _IN_MEMORY_USAGE_CACHE.pop(k, None)

    _record_audit_log(
        admin_email=admin.email,
        action="RESET_USAGE",
        target_user_id=body.user_id,
        details={"feature_key": body.feature_key or "all"}
    )

    return {
        "status": "success",
        "message": f"Usage counter reset for user {body.user_id}"
    }


@router.post("/users/suspend")
async def suspend_user(
    body: SuspendUserRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin signs out and revokes all active device sessions for a user.
    """
    revoked = SessionService.revoke_all_other_sessions(user_id=body.user_id, current_session_id="none")
    
    _record_audit_log(
        admin_email=admin.email,
        action="SUSPEND_USER_SESSIONS",
        target_user_id=body.user_id,
        details={"reason": body.reason, "revoked_sessions": revoked}
    )

    return {
        "status": "success",
        "message": f"Suspended and revoked {revoked} active session(s) for user {body.user_id}"
    }


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    admin: AuthUser = Depends(require_admin)
):
    """
    Returns recent administrative audit logs and transactions.
    """
    supabase = get_supabase()
    db_logs = []

    if supabase:
        try:
            res = supabase.table("admin_audit_logs").select("*").order("created_at", desc=True).limit(limit).execute()
            if res.data:
                db_logs = res.data
        except Exception:
            pass

    combined_logs = db_logs if db_logs else _ADMIN_AUDIT_LOGS[:limit]
    return {
        "count": len(combined_logs),
        "audit_logs": combined_logs
    }
