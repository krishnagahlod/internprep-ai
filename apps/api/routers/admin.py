import os
import csv
import io
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import StreamingResponse
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


class GrantTopupCreditsRequest(BaseModel):
    user_id: str
    user_email: Optional[str] = None
    feature_key: str  # 'resume_analysis' or 'mock_interview'
    credits: int
    reason: Optional[str] = "Admin topup grant"


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


class BroadcastAnnouncementRequest(BaseModel):
    message: str
    level: Optional[str] = "info"  # "info", "warning", "success"
    is_active: bool = True
    link_url: Optional[str] = None
    link_text: Optional[str] = None


# --- In-Memory State & Audit Log Fallback ---
_ADMIN_AUDIT_LOGS: List[Dict[str, Any]] = []
_SYSTEM_BROADCAST: Dict[str, Any] = {
    "is_active": False,
    "message": "",
    "level": "info",
    "link_url": None,
    "link_text": None,
    "updated_at": None,
    "updated_by": None
}


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
    iitb_users = 0
    active_subscriptions = 0
    tier_distribution = {"free": 0, "iitb_free": 0, "pro_1m": 0, "pro_3m": 0, "pro_1y": 0, "lifetime": 0, "admin": 0}
    total_revenue_inr = 0
    total_analyses = 0
    total_interviews = 0
    total_resumes = 0

    if supabase:
        try:
            # Query auth.users directly with service role
            auth_users_resp = supabase.auth.admin.list_users()
            auth_users = auth_users_resp if isinstance(auth_users_resp, list) else getattr(auth_users_resp, 'users', [])
            total_users = len(auth_users)

            for u in auth_users:
                u_email = str(getattr(u, 'email', '') or '').lower().strip()
                if u_email.endswith('@iitb.ac.in'):
                    iitb_users += 1
                
                ent = EntitlementService.get_active_entitlement(user_id=u.id, user_email=u_email)
                pk = ent.get("plan_key", "free")
                tier_distribution[pk] = tier_distribution.get(pk, 0) + 1
                if pk.startswith("pro_") or pk == "lifetime" or pk == "pro":
                    active_subscriptions += 1
        except Exception as e:
            print(f"Stats auth.users query notice: {e}")

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

        try:
            # Interview sessions count
            int_count = supabase.table("interview_sessions").select("id", count="exact").execute()
            total_interviews = int_count.count or len(int_count.data or [])
        except Exception:
            pass

        try:
            # Resumes count
            resumes_res = supabase.table("resumes").select("id", count="exact").execute()
            total_resumes = resumes_res.count or len(resumes_res.data or [])
        except Exception:
            pass

    return {
        "total_users": max(total_users, 1),
        "iitb_users": iitb_users,
        "active_subscriptions": active_subscriptions,
        "tier_distribution": tier_distribution,
        "total_revenue_inr": total_revenue_inr,
        "total_analyses": total_analyses,
        "total_interviews": total_interviews,
        "total_resumes": total_resumes,
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
    and Placement Analysis access whitelist status directly from Supabase Auth & DB.
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
            # 1. Fetch all users from Supabase Auth (Service Role)
            auth_users_resp = supabase.auth.admin.list_users()
            auth_users = auth_users_resp if isinstance(auth_users_resp, list) else getattr(auth_users_resp, 'users', [])

            # 2. Pre-fetch counts for fast join
            resumes_by_user = {}
            interviews_by_user = {}
            analyses_by_user = {}
            spent_by_user = {}
            profiles_by_user = {}

            try:
                r_data = supabase.table("resumes").select("id, user_id").execute().data or []
                for r in r_data:
                    uid = r.get("user_id")
                    resumes_by_user[uid] = resumes_by_user.get(uid, 0) + 1
            except Exception:
                pass

            try:
                i_data = supabase.table("interview_sessions").select("id, user_id").execute().data or []
                for i in i_data:
                    uid = i.get("user_id")
                    interviews_by_user[uid] = interviews_by_user.get(uid, 0) + 1
            except Exception:
                pass

            try:
                a_data = supabase.table("resume_analyses").select("id, user_id").execute().data or []
                for a in a_data:
                    uid = a.get("user_id")
                    analyses_by_user[uid] = analyses_by_user.get(uid, 0) + 1
            except Exception:
                pass

            try:
                tx_data = supabase.table("payment_transactions").select("user_id, amount_inr, status").execute().data or []
                for t in tx_data:
                    if t.get("status") == "captured":
                        uid = t.get("user_id")
                        spent_by_user[uid] = spent_by_user.get(uid, 0) + t.get("amount_inr", 0)
            except Exception:
                pass

            try:
                prof_data = supabase.table("profiles").select("*").execute().data or []
                for p in prof_data:
                    uid = p.get("id")
                    profiles_by_user[uid] = p
            except Exception:
                pass

            # 3. Build comprehensive user records
            for u in auth_users:
                uid = str(getattr(u, "id", ""))
                email = str(getattr(u, "email", "") or "").strip()
                if not email:
                    continue

                seen_emails.add(email.lower())

                # Metadata extraction
                meta = getattr(u, "user_metadata", {}) or {}
                app_meta = getattr(u, "app_metadata", {}) or {}
                full_name = meta.get("full_name") or meta.get("name") or meta.get("given_name") or ""
                avatar_url = meta.get("avatar_url") or meta.get("picture") or None
                created_at = str(getattr(u, "created_at", "") or "")
                last_sign_in_at = str(getattr(u, "last_sign_in_at", "") or "")
                provider = app_meta.get("provider") or meta.get("iss") or "email"

                # Filter by search query
                if query:
                    q_lower = query.lower()
                    if q_lower not in email.lower() and q_lower not in full_name.lower() and q_lower not in uid.lower():
                        continue

                # Entitlements and Usage
                ent = EntitlementService.get_active_entitlement(user_id=uid, user_email=email)
                usage = UsageService.get_user_usage_summary(user_id=uid, plan_key=ent.get("plan_key", "free"))
                topup_credits = {
                    "resume_analysis": UsageService.get_topup_balance(user_id=uid, feature_key="resume_analysis"),
                    "mock_interview": UsageService.get_topup_balance(user_id=uid, feature_key="mock_interview")
                }

                # Placement Whitelist Check
                is_admin_user = ent.get("is_admin", False) or email.lower() in ADMIN_EMAILS
                is_whitelisted = email.lower() in whitelisted_map or is_admin_user
                placement_details = whitelisted_map.get(email.lower(), {
                    "role": "admin" if is_admin_user else "authorized_user",
                    "notes": "System SuperAdmin" if is_admin_user else None,
                    "granted_at": created_at
                } if is_admin_user else None)

                # Filter by Plan Tab
                if plan:
                    if plan == "placement_whitelisted" and not is_whitelisted:
                        continue
                    elif plan == "iitb_free" and not (ent.get("plan_key") == "iitb_free" or ent.get("is_iitb")):
                        continue
                    elif plan == "pro" and not (ent.get("plan_key", "").startswith("pro") or ent.get("plan_key") == "pro"):
                        continue
                    elif plan == "lifetime" and ent.get("plan_key") != "lifetime":
                        continue
                    elif plan == "free" and (ent.get("plan_key") != "free" or ent.get("is_iitb")):
                        continue
                    elif plan == "admin" and not (ent.get("is_admin") or ent.get("plan_key") == "admin"):
                        continue

                # College Tag
                college = "IIT Bombay" if email.lower().endswith("@iitb.ac.in") else "Candidate"

                user_record = {
                    "id": uid,
                    "email": email,
                    "full_name": full_name,
                    "avatar_url": avatar_url,
                    "college": college,
                    "created_at": created_at,
                    "last_sign_in_at": last_sign_in_at,
                    "provider": provider,
                    "entitlement": ent,
                    "usage": usage,
                    "topup_credits": topup_credits,
                    "activity": {
                        "resumes_count": resumes_by_user.get(uid, 0),
                        "interviews_count": interviews_by_user.get(uid, 0),
                        "analyses_count": analyses_by_user.get(uid, 0),
                        "total_spent_inr": spent_by_user.get(uid, 0)
                    },
                    "profile_details": profiles_by_user.get(uid, {}),
                    "has_placement_access": is_whitelisted,
                    "placement_details": placement_details
                }
                users_list.append(user_record)

        except Exception as e:
            print(f"Error compiling auth users list: {e}")

    # Also include any whitelisted emails that may not have registered on Supabase yet
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
                "full_name": w_info.get("notes") or "Whitelisted Candidate",
                "avatar_url": None,
                "college": "IIT Bombay" if w_email.endswith("@iitb.ac.in") else "Authorized Candidate",
                "created_at": w_info.get("granted_at"),
                "last_sign_in_at": None,
                "provider": "invitation",
                "entitlement": ent,
                "usage": usage,
                "topup_credits": {"resume_analysis": 0, "mock_interview": 0},
                "activity": {
                    "resumes_count": 0,
                    "interviews_count": 0,
                    "analyses_count": 0,
                    "total_spent_inr": 0
                },
                "profile_details": {},
                "has_placement_access": True,
                "placement_details": w_info
            })

    # Sort users: Admins first, then by created_at descending
    users_list.sort(
        key=lambda x: (
            1 if x.get("entitlement", {}).get("is_admin") else 0,
            x.get("created_at") or ""
        ),
        reverse=True
    )

    # Slice pagination
    paginated_users = users_list[offset : offset + limit]

    return {
        "count": len(users_list),
        "total": len(users_list),
        "limit": limit,
        "offset": offset,
        "users": paginated_users
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin: AuthUser = Depends(require_admin)
):
    """
    Returns deep detailed inspection data for a specific user:
    their profile, full entitlement, uploaded resumes, past interviews, payments, and audit logs.
    """
    supabase = get_supabase()
    user_info = None

    if supabase:
        try:
            # Look up auth user
            auth_user = supabase.auth.admin.get_user_by_id(user_id)
            if auth_user and getattr(auth_user, "user", None):
                u = auth_user.user
                email = getattr(u, "email", "")
                meta = getattr(u, "user_metadata", {}) or {}
                user_info = {
                    "id": u.id,
                    "email": email,
                    "full_name": meta.get("full_name") or meta.get("name") or "",
                    "avatar_url": meta.get("avatar_url") or meta.get("picture"),
                    "created_at": getattr(u, "created_at", None),
                    "last_sign_in_at": getattr(u, "last_sign_in_at", None),
                    "provider": getattr(u, "app_metadata", {}).get("provider", "email")
                }
        except Exception:
            pass

    if not user_info:
        user_info = {"id": user_id, "email": user_id}

    topup = {
        "resume_analysis": UsageService.get_topup_balance(user_id=user_id, feature_key="resume_analysis"),
        "mock_interview": UsageService.get_topup_balance(user_id=user_id, feature_key="mock_interview")
    }

    # Fetch user resumes, interview sessions, and transactions
    resumes = []
    interview_sessions = []
    payments = []

    if supabase:
        try:
            res_res = supabase.table("resumes").select("id, file_name, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
            resumes = res_res.data or []
        except Exception:
            pass

        try:
            int_res = supabase.table("interview_sessions").select("id, role, domain, status, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
            interview_sessions = int_res.data or []
        except Exception:
            pass

        try:
            pay_res = supabase.table("payment_transactions").select("id, plan_slug, amount_inr, status, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
            payments = pay_res.data or []
        except Exception:
            pass

    return {
        "user": user_info,
        "entitlement": ent,
        "usage": usage,
        "topup_credits": topup,
        "resumes": resumes,
        "interview_sessions": interview_sessions,
        "payment_transactions": payments
    }


@router.post("/users/topup-credits")
async def grant_user_topup_credits(
    body: GrantTopupCreditsRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin manually adds top-up credits (e.g. +5 Resume Scans or +3 Mock Interviews) to a user.
    """
    supabase = get_supabase()
    target_user_id = body.user_id
    target_email = body.user_email or ""

    if "@" in body.user_id and supabase:
        try:
            auth_resp = supabase.auth.admin.list_users()
            users = auth_resp if isinstance(auth_resp, list) else getattr(auth_resp, 'users', [])
            for u in users:
                if getattr(u, 'email', '').lower() == body.user_id.lower().strip():
                    target_user_id = u.id
                    target_email = u.email
                    break
        except Exception:
            pass

    success = UsageService.add_topup_credits(
        user_id=target_user_id,
        feature_key=body.feature_key,
        credits=body.credits
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to grant topup credits")

    _record_audit_log(
        admin_email=admin.email,
        action="GRANT_TOPUP_CREDITS",
        target_user_id=target_user_id,
        details={
            "feature_key": body.feature_key,
            "credits": body.credits,
            "reason": body.reason,
            "target_email": target_email
        }
    )

    new_balance = UsageService.get_topup_balance(user_id=target_user_id)
    return {
        "status": "success",
        "message": f"Successfully added {body.credits} {body.feature_key} credits to user {target_email or target_user_id}",
        "topup_balance": new_balance
    }


@router.get("/users/export")
async def export_users_csv(admin: AuthUser = Depends(require_admin)):
    """
    Generates and downloads a complete CSV of all candidates, entitlements, usage, and placement whitelist.
    """
    users_data = await list_users(limit=500, admin=admin)
    users = users_data.get("users", [])

    output = io.StringIO()
    writer = csv.writer(output)

    # Header Row
    writer.writerow([
        "User ID",
        "Email",
        "Full Name",
        "College / Institution",
        "Active Plan",
        "Plan Status",
        "Expires At",
        "Is IITB Verified",
        "Placement Analysis Whitelisted",
        "Placement Role / Notes",
        "Resumes Uploaded",
        "Mock Interviews Taken",
        "Total Revenue Spent (INR)",
        "Resume Quota Used",
        "Resume Quota Limit",
        "Mock Quota Used",
        "Mock Quota Limit",
        "Signup Date",
        "Last Sign-In Date"
    ])

    for u in users:
        ent = u.get("entitlement", {})
        usage = u.get("usage", {})
        act = u.get("activity", {})
        p_details = u.get("placement_details") or {}

        writer.writerow([
            u.get("id"),
            u.get("email"),
            u.get("full_name"),
            u.get("college"),
            ent.get("plan_key"),
            ent.get("status"),
            ent.get("expires_at") or "Perpetual / Free",
            "Yes" if ent.get("is_iitb") else "No",
            "Yes" if u.get("has_placement_access") else "No",
            p_details.get("notes") or p_details.get("role") or "",
            act.get("resumes_count", 0),
            act.get("interviews_count", 0),
            act.get("total_spent_inr", 0),
            usage.get("resume_analysis", {}).get("used", 0),
            usage.get("resume_analysis", {}).get("limit", 0),
            usage.get("mock_interview", {}).get("used", 0),
            usage.get("mock_interview", {}).get("limit", 0),
            u.get("created_at") or "",
            u.get("last_sign_in_at") or ""
        ])

    output.seek(0)
    filename = f"internprep_users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- Platform Broadcast Banner ---

@router.get("/broadcast")
async def get_system_broadcast():
    """
    Returns the active system-wide broadcast announcement banner.
    """
    return _SYSTEM_BROADCAST


@router.post("/broadcast")
async def set_system_broadcast(
    body: BroadcastAnnouncementRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin sets or clears the platform-wide broadcast announcement banner.
    """
    global _SYSTEM_BROADCAST
    _SYSTEM_BROADCAST = {
        "is_active": body.is_active,
        "message": body.message,
        "level": body.level or "info",
        "link_url": body.link_url,
        "link_text": body.link_text,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin.email
    }

    _record_audit_log(
        admin_email=admin.email,
        action="UPDATE_BROADCAST",
        target_user_id="ALL",
        details=_SYSTEM_BROADCAST
    )

    return {
        "status": "success",
        "broadcast": _SYSTEM_BROADCAST
    }


# --- Subscription Overrides ---

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

    # If user passed email as user_id, resolve UUID from Supabase Auth
    if "@" in body.user_id and supabase:
        try:
            auth_resp = supabase.auth.admin.list_users()
            users = auth_resp if isinstance(auth_resp, list) else getattr(auth_resp, 'users', [])
            for u in users:
                if getattr(u, 'email', '').lower() == body.user_id.lower().strip():
                    target_user_id = u.id
                    target_email = u.email
                    break
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
async def suspend_user_sessions(
    body: SuspendUserRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin revokes all active device sessions for a user, forcing immediate logout.
    """
    SessionService.revoke_all_user_sessions(user_id=body.user_id)

    _record_audit_log(
        admin_email=admin.email,
        action="SUSPEND_SESSIONS",
        target_user_id=body.user_id,
        details={"reason": body.reason}
    )

    return {
        "status": "success",
        "message": f"All active sessions revoked for user {body.user_id}"
    }


# --- Placement Analysis Gate & Whitelist Endpoints ---

@router.get("/placement/overview")
async def get_placement_access_overview(admin: AuthUser = Depends(require_admin)):
    """
    Returns full whitelist status, active invite codes, and recent studio sessions.
    """
    from routers.placement_analysis import get_access_store, ADMIN_EMAILS
    store = get_access_store()

    whitelisted_users = store.get("whitelisted_emails", [])
    invite_codes = store.get("invite_codes", ["IITB-VIP-2026", "IITB-CAMPUS-PASS", "DAY1-CONSULTING-PASS"])
    recent_sessions = store.get("active_sessions", [])

    return {
        "total_whitelisted": len(whitelisted_users),
        "total_invite_codes": len(invite_codes),
        "whitelisted_users": whitelisted_users,
        "invite_codes": invite_codes,
        "recent_sessions": recent_sessions,
        "admin_emails": ADMIN_EMAILS
    }


@router.post("/placement/grant")
async def grant_placement_access(
    body: GrantPlacementAccessRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin explicitly whitelists an email for direct Placement Analysis access.
    """
    from routers.placement_analysis import get_access_store, save_access_store, ADMIN_EMAILS
    store = get_access_store()
    
    clean_email = body.email.lower().strip()
    if not clean_email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Remove existing if any
    store["whitelisted_emails"] = [
        u for u in store.get("whitelisted_emails", [])
        if u.get("email", "").lower() != clean_email
    ]

    new_entry = {
        "email": clean_email,
        "role": body.role or ("admin" if clean_email in ADMIN_EMAILS else "authorized_user"),
        "notes": body.notes or "Granted via Admin Console",
        "granted_at": datetime.now(timezone.utc).isoformat(),
        "granted_by": admin.email
    }
    store["whitelisted_emails"].append(new_entry)
    save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="GRANT_PLACEMENT_ACCESS",
        target_user_id=clean_email,
        details=new_entry
    )

    return {
        "status": "success",
        "message": f"Placement Analysis access granted to {clean_email}",
        "user": new_entry
    }


@router.post("/placement/revoke")
async def revoke_placement_access(
    body: RevokePlacementAccessRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin revokes Placement Analysis access for a specific email.
    """
    from routers.placement_analysis import get_access_store, save_access_store, ADMIN_EMAILS
    clean_email = body.email.lower().strip()

    if clean_email in ADMIN_EMAILS:
        raise HTTPException(status_code=400, detail="Cannot revoke Placement Analysis access for SuperAdmin")

    store = get_access_store()
    initial_len = len(store.get("whitelisted_emails", []))
    store["whitelisted_emails"] = [
        u for u in store.get("whitelisted_emails", [])
        if u.get("email", "").lower() != clean_email
    ]
    save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="REVOKE_PLACEMENT_ACCESS",
        target_user_id=clean_email,
        details={"reason": "Admin manual revocation"}
    )

    return {
        "status": "success",
        "message": f"Placement Analysis access revoked for {clean_email}",
        "removed_count": initial_len - len(store["whitelisted_emails"])
    }


@router.post("/placement/invite-code")
async def create_placement_invite_code(
    body: CreatePlacementInviteRequest,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin creates a custom or generated invite passcode for the Placement Analysis Studio.
    """
    import secrets
    from routers.placement_analysis import get_access_store, save_access_store
    store = get_access_store()

    code = (body.code_name or f"IITB-VIP-{secrets.token_hex(3).upper()}").strip().upper()
    current_codes = set(store.get("invite_codes", []))
    current_codes.add(code)
    store["invite_codes"] = list(current_codes)
    save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="CREATE_PLACEMENT_INVITE_CODE",
        target_user_id=code,
        details={"code": code}
    )

    return {
        "status": "success",
        "code": code,
        "invite_codes": store["invite_codes"]
    }


@router.delete("/placement/invite-code")
async def delete_placement_invite_code(
    code: str,
    admin: AuthUser = Depends(require_admin)
):
    """
    Admin deletes an invite passcode.
    """
    from routers.placement_analysis import get_access_store, save_access_store
    store = get_access_store()

    clean_code = code.strip().upper()
    store["invite_codes"] = [c for c in store.get("invite_codes", []) if c.upper() != clean_code]
    save_access_store(store)

    _record_audit_log(
        admin_email=admin.email,
        action="DELETE_PLACEMENT_INVITE_CODE",
        target_user_id=clean_code,
        details={"code": clean_code}
    )

    return {
        "status": "success",
        "message": f"Deleted invite code {clean_code}",
        "invite_codes": store["invite_codes"]
    }


# --- Audit Logs & System Health ---

@router.get("/audit-logs")
async def list_admin_audit_logs(
    limit: int = Query(50, le=200),
    admin: AuthUser = Depends(require_admin)
):
    """
    Returns chronological log of all admin operations.
    """
    supabase = get_supabase()
    logs = []

    if supabase:
        try:
            res = supabase.table("admin_audit_logs").select("*").order("created_at", desc=True).limit(limit).execute()
            if res.data:
                logs = res.data
        except Exception:
            pass

    if not logs:
        logs = _ADMIN_AUDIT_LOGS[:limit]

    return {
        "count": len(logs),
        "audit_logs": logs
    }
