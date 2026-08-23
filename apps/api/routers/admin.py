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


class GrantPlacementAccessRequest(BaseModel):
    email: str
    user_id: Optional[str] = None
    role: Optional[str] = "authorized_user"  # "authorized_user" | "admin"
    notes: Optional[str] = "Granted via Admin Console"


class RevokePlacementAccessRequest(BaseModel):
    email: str
    user_id: Optional[str] = None


class CreatePlacementInviteRequest(BaseModel):
    code_name: Optional[str] = None


class DeletePlacementInviteRequest(BaseModel):
    code_name: str


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
    limit: int = Query(100, le=500),
    offset: int = 0,
    admin: AuthUser = Depends(require_admin)
):
    """
    Lists users with their active plan, expiry, IITB status, usage metrics,
    and Placement Analysis access whitelist status.
    """
    from routers.placement_analysis import get_access_store, ADMIN_EMAILS
    access_store = get_access_store()
    whitelisted_map = {
        u.get("email", "").lower().strip(): u 
        for u in access_store.get("whitelisted_emails", [])
        if u.get("email")
    }

    supabase = get_supabase()
    users_list = []
    seen_emails = set()

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
                email = str(prof.get("email") or "").strip()
                if email:
                    seen_emails.add(email.lower())
                ent = EntitlementService.get_active_entitlement(user_id=uid, user_email=email)
                usage = UsageService.get_user_usage_summary(user_id=uid, plan_key=ent.get("plan_key", "free"))
                
                # Check placement analysis access
                is_admin_user = ent.get("is_admin", False) or email.lower() in ADMIN_EMAILS
                is_whitelisted = email.lower() in whitelisted_map or is_admin_user
                placement_details = whitelisted_map.get(email.lower(), {
                    "role": "admin" if is_admin_user else "authorized_user",
                    "notes": "System Administrator" if is_admin_user else None,
                    "granted_at": prof.get("created_at")
                } if is_admin_user else None)

                # Filter by plan if requested
                if plan:
                    if plan == "placement_whitelisted" and not is_whitelisted:
                        continue
                    elif plan != "placement_whitelisted" and plan != "all" and ent.get("plan_key") != plan:
                        continue

                users_list.append({
                    "id": uid,
                    "email": email,
                    "full_name": prof.get("full_name"),
                    "college": prof.get("college"),
                    "created_at": prof.get("created_at"),
                    "entitlement": ent,
                    "usage": usage,
                    "has_placement_access": is_whitelisted,
                    "placement_details": placement_details
                })
        except Exception as e:
            print(f"Error listing users: {e}")

    # Also include any whitelisted emails that may not be in profiles table yet
    for w_email, w_info in whitelisted_map.items():
        if w_email not in seen_emails:
            if query and query.lower() not in w_email.lower():
                continue
            is_admin_user = w_email.lower() in ADMIN_EMAILS or w_info.get("role") == "admin"
            ent = EntitlementService.get_active_entitlement(user_id=w_email, user_email=w_email)
            usage = UsageService.get_user_usage_summary(user_id=w_email, plan_key=ent.get("plan_key", "free"))
            
            if plan and plan not in ["placement_whitelisted", "all"]:
                continue

            users_list.append({
                "id": f"whitelisted_{w_email}",
                "email": w_email,
                "full_name": w_info.get("notes") or "Whitelisted User",
                "college": "IIT Bombay" if w_email.endswith("@iitb.ac.in") else "Authorized Candidate",
                "created_at": w_info.get("granted_at"),
                "entitlement": ent,
                "usage": usage,
                "has_placement_access": True,
                "placement_details": w_info
            })

    # If no users found, return admin
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
            "usage": usage,
            "has_placement_access": True,
            "placement_details": {"role": "admin", "notes": "Platform Owner"}
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
    Accepts either user_id UUID or user email.
    """
    supabase = get_supabase()
    target_user_id = body.user_id
    target_email = body.user_email or (body.user_id if "@" in body.user_id else "")

    # If user passed email as user_id, resolve UUID from profiles
    if "@" in body.user_id and supabase:
        try:
            p_res = supabase.table("profiles").select("id, email").eq("email", body.user_id.lower().strip()).limit(1).execute()
            if p_res.data and len(p_res.data) > 0:
                target_user_id = p_res.data[0]["id"]
                target_email = p_res.data[0]["email"]
        except Exception:
            pass

    plan = DEFAULT_PLANS.get(body.plan_key)
    duration_days = body.custom_days or (plan.get("duration_days") if plan else 30)

    success = EntitlementService.grant_entitlement(
        user_id=target_user_id,
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
        target_user_id=target_user_id,
        details={
            "plan_key": body.plan_key,
            "duration_days": duration_days,
            "target_email": target_email,
            "reason": body.reason
        }
    )

    updated_entitlement = EntitlementService.get_active_entitlement(user_id=target_user_id, user_email=target_email)
    return {
        "status": "success",
        "message": f"Successfully granted {body.plan_key} to user {target_email or target_user_id}",
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


# ---------------------------------------------------------------------------
# PLACEMENT ANALYSIS ACCESS MANAGEMENT
# ---------------------------------------------------------------------------

@router.get("/placement/overview")
async def get_placement_access_overview(
    admin: AuthUser = Depends(require_admin)
):
    """
    Returns full placement access data: whitelisted users, active invite codes, and recent session logs.
    """
    from routers.placement_analysis import get_access_store, ADMIN_EMAILS
    store = get_access_store()
    whitelisted = store.get("whitelisted_emails", [])
    invite_codes = store.get("invite_codes", [])
    recent_sessions = store.get("verified_log", [])[-50:]

    return {
        "total_whitelisted": len(whitelisted),
        "total_invite_codes": len(invite_codes),
        "whitelisted_users": whitelisted,
        "invite_codes": invite_codes,
        "recent_sessions": recent_sessions,
        "admin_emails": list(ADMIN_EMAILS)
    }


@router.post("/placement/grant")
async def grant_placement_access(
    body: GrantPlacementAccessRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Grants Placement Analysis access to a candidate/user email.
    """
    from routers.placement_analysis import get_access_store, save_access_store
    email_clean = body.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    store = get_access_store()
    users = store.get("whitelisted_emails", [])
    
    existing = next((u for u in users if u.get("email", "").lower() == email_clean), None)
    if existing:
        existing["role"] = body.role or "authorized_user"
        existing["notes"] = body.notes or "Granted by Admin"
        existing["updated_at"] = datetime.now(timezone.utc).isoformat()
    else:
        users.append({
            "email": email_clean,
            "role": body.role or "authorized_user",
            "notes": body.notes or "Granted by Admin",
            "granted_at": datetime.now(timezone.utc).isoformat(),
            "granted_by": admin.email
        })
        
    store["whitelisted_emails"] = users
    save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="GRANT_PLACEMENT_ACCESS",
        target_user_id=body.user_id or email_clean,
        details={"email": email_clean, "role": body.role, "notes": body.notes}
    )

    return {
        "status": "success",
        "message": f"Placement Analysis access successfully granted to {email_clean}",
        "user": next((u for u in users if u.get("email", "").lower() == email_clean), None)
    }


@router.post("/placement/revoke")
async def revoke_placement_access(
    body: RevokePlacementAccessRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Revokes Placement Analysis access from a user email.
    """
    from routers.placement_analysis import get_access_store, save_access_store, ADMIN_EMAILS
    email_clean = body.email.strip().lower()

    if email_clean in ADMIN_EMAILS:
        raise HTTPException(status_code=400, detail="Cannot revoke placement access for system administrators.")

    store = get_access_store()
    users = store.get("whitelisted_emails", [])
    
    updated_users = [u for u in users if u.get("email", "").lower() != email_clean]
    store["whitelisted_emails"] = updated_users
    save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="REVOKE_PLACEMENT_ACCESS",
        target_user_id=body.user_id or email_clean,
        details={"email": email_clean}
    )

    return {
        "status": "success",
        "message": f"Placement Analysis access revoked for {email_clean}"
    }


@router.post("/placement/invite-code")
async def create_placement_invite_code(
    body: CreatePlacementInviteRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Creates a new invite passcode for Placement Analysis.
    """
    from routers.placement_analysis import get_access_store, save_access_store
    import random
    import string

    code = body.code_name.strip().upper() if body.code_name else f"IITB-VIP-{''.join(random.choices(string.ascii_uppercase + string.digits, k=4))}"
    
    store = get_access_store()
    codes = store.get("invite_codes", [])
    if code not in codes:
        codes.append(code)
        store["invite_codes"] = codes
        save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="CREATE_PLACEMENT_INVITE_CODE",
        target_user_id=code,
        details={"code": code}
    )

    return {
        "status": "success",
        "message": f"Invite code '{code}' created successfully.",
        "code": code,
        "invite_codes": codes
    }


@router.delete("/placement/invite-code")
async def delete_placement_invite_code(
    code: str = Query(...),
    admin: AuthUser = Depends(require_admin)
):
    """
    Deletes an invite passcode for Placement Analysis.
    """
    from routers.placement_analysis import get_access_store, save_access_store
    code_clean = code.strip().upper()

    store = get_access_store()
    codes = store.get("invite_codes", [])
    if code_clean in codes:
        codes.remove(code_clean)
        store["invite_codes"] = codes
        save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="DELETE_PLACEMENT_INVITE_CODE",
        target_user_id=code_clean,
        details={"code": code_clean}
    )

    return {
        "status": "success",
        "message": f"Invite code '{code_clean}' removed.",
        "invite_codes": codes
    }
