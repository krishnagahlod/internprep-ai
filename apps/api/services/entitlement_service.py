import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from services.db import get_supabase

# In-memory fallback plan definitions ensuring 100% uptime
DEFAULT_PLANS = {
    "guest": {
        "slug": "guest",
        "display_name": "Guest Explorer",
        "description": "Unauthenticated trial preview"
    },
    "free": {
        "slug": "free",
        "display_name": "Free Student Tier",
        "description": "External authenticated user with monthly starter limits"
    },
    "iitb_free": {
        "slug": "iitb_free",
        "display_name": "IIT Bombay Partner Access",
        "description": "Verified IIT Bombay student access with full platform capabilities"
    },
    "pro": {
        "slug": "pro",
        "display_name": "InternPrep Pro",
        "description": "Paid power-user access with elevated quotas and full placement dossiers"
    },
    "pro_1m": {
        "slug": "pro_1m",
        "display_name": "1-Month Sprint Pass",
        "description": "30 days of full Pro access"
    },
    "pro_3m": {
        "slug": "pro_3m",
        "display_name": "Placement Season Pass",
        "description": "90 days of complete placement preparation"
    },
    "pro_season": {
        "slug": "pro_season",
        "display_name": "Placement Season Pass",
        "description": "90 days of complete placement preparation"
    },
    "pro_1y": {
        "slug": "pro_1y",
        "display_name": "Master Pass",
        "description": "365 days of comprehensive preparation"
    },
    "pro_master": {
        "slug": "pro_master",
        "display_name": "Master Pass",
        "description": "365 days of comprehensive preparation"
    },
    "lifetime": {
        "slug": "lifetime",
        "display_name": "Lifetime VIP",
        "description": "Special promotion or honorary placement season access"
    },
    "admin": {
        "slug": "admin",
        "display_name": "System Administrator",
        "description": "Full access control and override privileges"
    }
}

DEFAULT_FEATURE_LIMITS = {
    "guest": {
        "resume_analysis": 1,
        "mock_interview": 0,
        "bullet_refine": 2,
        "placement_intelligence": 3
    },
    "free": {
        "resume_analysis": 2,
        "mock_interview": 1,
        "bullet_refine": 10,
        "placement_intelligence": 5
    },
    "iitb_free": {
        "resume_analysis": 10,
        "mock_interview": 10,
        "bullet_refine": 100,
        "placement_intelligence": -1  # unlimited
    },
    "pro": {
        "resume_analysis": 30,
        "mock_interview": 15,
        "bullet_refine": 200,
        "placement_intelligence": -1  # unlimited
    },
    "pro_1m": {
        "resume_analysis": 30,
        "mock_interview": 15,
        "bullet_refine": 200,
        "placement_intelligence": -1
    },
    "pro_3m": {
        "resume_analysis": 30,
        "mock_interview": 15,
        "bullet_refine": 200,
        "placement_intelligence": -1
    },
    "pro_season": {
        "resume_analysis": 30,
        "mock_interview": 15,
        "bullet_refine": 200,
        "placement_intelligence": -1
    },
    "pro_1y": {
        "resume_analysis": 30,
        "mock_interview": 15,
        "bullet_refine": 200,
        "placement_intelligence": -1
    },
    "pro_master": {
        "resume_analysis": 30,
        "mock_interview": 15,
        "bullet_refine": 200,
        "placement_intelligence": -1
    },
    "lifetime": {
        "resume_analysis": 50,
        "mock_interview": 30,
        "bullet_refine": 500,
        "placement_intelligence": -1  # unlimited
    },
    "admin": {
        "resume_analysis": -1,
        "mock_interview": -1,
        "bullet_refine": -1,
        "placement_intelligence": -1
    }
}

# Local in-memory cache for fallback & tests
_IN_MEMORY_ENTITLEMENTS: Dict[str, Dict[str, Any]] = {}

def is_iitb_email(email: Optional[str]) -> bool:
    """Validates if email domain belongs to IIT Bombay."""
    if not email:
        return False
    email_clean = email.strip().lower()
    return email_clean.endswith("@iitb.ac.in") or email_clean.endswith(".iitb.ac.in")

def is_admin_email(email: Optional[str]) -> bool:
    """Checks if email matches configured administrative accounts."""
    if not email:
        return False
    email_clean = email.strip().lower()
    admin_emails = os.getenv("ADMIN_EMAILS", "krishnagahlod@gmail.com").lower().split(",")
    admin_emails = [e.strip() for e in admin_emails if e.strip()]
    
    # Strictly check exact configured admin email list (no wildcards or substrings)
    return email_clean == "krishnagahlod@gmail.com" or email_clean in admin_emails

class EntitlementService:
    @staticmethod
    def get_active_entitlement(user_id: str, user_email: Optional[str] = None) -> Dict[str, Any]:
        """
        Server-side source of truth for resolving active entitlement.
        Evaluates DB entitlements -> In-memory -> IITB email rule -> fallback free tier.
        """
        now = datetime.now(timezone.utc)
        supabase = get_supabase()

        # 1. Admin Email Check
        if is_admin_email(user_email):
            limits = DEFAULT_FEATURE_LIMITS["admin"]
            return {
                "user_id": user_id,
                "product": "internprep_ai",
                "plan_key": "admin",
                "plan_name": DEFAULT_PLANS["admin"]["display_name"],
                "status": "active",
                "source": "admin_allowlist",
                "starts_at": now.isoformat(),
                "expires_at": None,
                "is_iitb": is_iitb_email(user_email),
                "is_admin": True,
                "limits": limits,
                "feature_limits": limits
            }

        # 2. Check In-Memory cache (for tests & bursts)
        if user_id in _IN_MEMORY_ENTITLEMENTS:
            mem_ent = _IN_MEMORY_ENTITLEMENTS[user_id]
            expires_at_str = mem_ent.get("expires_at")
            if not expires_at_str or datetime.fromisoformat(expires_at_str.replace("Z", "+00:00")) > now:
                pk = mem_ent.get("plan_key", "free")
                limits = DEFAULT_FEATURE_LIMITS.get(pk, DEFAULT_FEATURE_LIMITS["free"])
                mem_ent["limits"] = limits
                mem_ent["feature_limits"] = limits
                return mem_ent

        # 3. Query Supabase entitlements table
        if supabase:
            try:
                res = supabase.table("entitlements") \
                    .select("*") \
                    .eq("user_id", user_id) \
                    .eq("product", "internprep_ai") \
                    .in_("status", ["active", "scheduled"]) \
                    .order("created_at", desc=True) \
                    .limit(1) \
                    .execute()
                
                if res.data and len(res.data) > 0:
                    ent = res.data[0]
                    expires_at_str = ent.get("expires_at")
                    
                    # Check expiration
                    if expires_at_str:
                        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                        if expires_at < now:
                            try:
                                supabase.table("entitlements").update({"status": "expired"}).eq("id", ent["id"]).execute()
                            except Exception:
                                pass
                            ent = None
                    
                    if ent:
                        plan_key = ent.get("plan_key", "free")
                        plan_info = DEFAULT_PLANS.get(plan_key, DEFAULT_PLANS["free"])
                        limits = DEFAULT_FEATURE_LIMITS.get(plan_key, DEFAULT_FEATURE_LIMITS["free"])
                        return {
                            "id": ent.get("id"),
                            "user_id": user_id,
                            "product": "internprep_ai",
                            "plan_key": plan_key,
                            "plan_name": plan_info["display_name"],
                            "status": "active",
                            "source": ent.get("source", "system"),
                            "starts_at": ent.get("starts_at"),
                            "expires_at": ent.get("expires_at"),
                            "external_reference": ent.get("external_reference"),
                            "is_iitb": is_iitb_email(user_email),
                            "is_admin": False,
                            "limits": limits,
                            "feature_limits": limits
                        }
            except Exception:
                pass

        # 4. IIT Bombay automatic verification rule
        if is_iitb_email(user_email):
            if supabase:
                try:
                    supabase.table("entitlements").insert({
                        "user_id": user_id,
                        "product": "internprep_ai",
                        "plan_key": "iitb_free",
                        "status": "active",
                        "source": "iitb",
                        "starts_at": now.isoformat(),
                        "expires_at": None,
                        "metadata": {"verified_email": user_email}
                    }).execute()
                except Exception:
                    pass

            limits = DEFAULT_FEATURE_LIMITS["iitb_free"]
            return {
                "user_id": user_id,
                "product": "internprep_ai",
                "plan_key": "iitb_free",
                "plan_name": DEFAULT_PLANS["iitb_free"]["display_name"],
                "status": "active",
                "source": "iitb",
                "starts_at": now.isoformat(),
                "expires_at": None,
                "is_iitb": True,
                "is_admin": False,
                "limits": limits,
                "feature_limits": limits
            }

        # 5. Default External Free Plan
        limits = DEFAULT_FEATURE_LIMITS["free"]
        return {
            "user_id": user_id,
            "product": "internprep_ai",
            "plan_key": "free",
            "plan_name": DEFAULT_PLANS["free"]["display_name"],
            "status": "active",
            "source": "system",
            "starts_at": now.isoformat(),
            "expires_at": None,
            "is_iitb": False,
            "is_admin": False,
            "limits": limits,
            "feature_limits": limits
        }

    @staticmethod
    def grant_entitlement(
        user_id: str,
        plan_key: str,
        duration_days: Optional[int] = 30,
        source: str = "admin",
        admin_id: Optional[str] = None,
        external_reference: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Grants or extends an entitlement.
        If user already has an active entitlement with an expiration, extends from existing expiry.
        """
        now = datetime.now(timezone.utc)
        supabase = get_supabase()
        
        # Check existing active entitlement for renewal extension
        existing = None
        if user_id in _IN_MEMORY_ENTITLEMENTS:
            existing = _IN_MEMORY_ENTITLEMENTS[user_id]
        elif supabase:
            try:
                res = supabase.table("entitlements") \
                    .select("*") \
                    .eq("user_id", user_id) \
                    .eq("product", "internprep_ai") \
                    .eq("status", "active") \
                    .order("created_at", desc=True) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    existing = res.data[0]
            except Exception:
                pass

        starts_at = now
        expires_at = None
        
        if duration_days is not None:
            base_time = now
            if existing and existing.get("expires_at"):
                try:
                    existing_expires = datetime.fromisoformat(existing["expires_at"].replace("Z", "+00:00"))
                    if existing_expires > now:
                        base_time = existing_expires
                except Exception:
                    pass
            expires_at = base_time + timedelta(days=duration_days)

        expires_at_iso = expires_at.isoformat() if expires_at else None
        plan_info = DEFAULT_PLANS.get(plan_key, DEFAULT_PLANS["pro"])
        limits = DEFAULT_FEATURE_LIMITS.get(plan_key, DEFAULT_FEATURE_LIMITS["pro"])

        entitlement_record = {
            "id": f"ent_{user_id}_{int(now.timestamp())}",
            "user_id": user_id,
            "product": "internprep_ai",
            "plan_key": plan_key,
            "plan_name": plan_info["display_name"],
            "status": "active",
            "source": source,
            "starts_at": starts_at.isoformat(),
            "expires_at": expires_at_iso,
            "external_reference": external_reference,
            "metadata": metadata or {},
            "limits": limits,
            "feature_limits": limits
        }

        # Cache in memory
        _IN_MEMORY_ENTITLEMENTS[user_id] = entitlement_record

        # Persist to database if available
        if supabase:
            try:
                # Mark previous active entitlements as superseded
                supabase.table("entitlements") \
                    .update({"status": "superseded"}) \
                    .eq("user_id", user_id) \
                    .eq("product", "internprep_ai") \
                    .eq("status", "active") \
                    .execute()

                supabase.table("entitlements").insert({
                    "user_id": user_id,
                    "product": "internprep_ai",
                    "plan_key": plan_key,
                    "status": "active",
                    "source": source,
                    "starts_at": starts_at.isoformat(),
                    "expires_at": expires_at_iso,
                    "external_reference": external_reference,
                    "metadata": metadata or {}
                }).execute()
                # Record admin audit log if applicable
                if admin_id and supabase:
                    try:
                        import uuid as _uuid
                        valid_admin_id = admin_id if _uuid.UUID(str(admin_id)) else None
                        valid_target_id = user_id if _uuid.UUID(str(user_id)) else None
                        supabase.table("admin_audit_logs").insert({
                            "admin_user_id": valid_admin_id,
                            "target_user_id": valid_target_id,
                            "product": "internprep_ai",
                            "action": "grant",
                            "before_state": existing,
                            "after_state": entitlement_record,
                            "reason": f"Manual grant of {plan_key} for {duration_days} days"
                        }).execute()
                    except Exception:
                        pass
            except Exception as e:
                print(f"Error granting entitlement to DB: {e}")

        return entitlement_record

    @staticmethod
    def revoke_entitlement(user_id: str, admin_id: Optional[str] = None, reason: str = "Admin revocation") -> bool:
        """Revokes all active entitlements for a user."""
        # Evict from in-memory cache
        _IN_MEMORY_ENTITLEMENTS.pop(user_id, None)
        supabase = get_supabase()
        try:
            if supabase:
                supabase.table("entitlements").update({"status": "revoked"}).eq("user_id", user_id).eq("status", "active").execute()
                if admin_id:
                    try:
                        import uuid as _uuid
                        valid_admin_id = admin_id if _uuid.UUID(str(admin_id)) else None
                        valid_target_id = user_id if _uuid.UUID(str(user_id)) else None
                        supabase.table("admin_audit_logs").insert({
                            "admin_user_id": valid_admin_id,
                            "target_user_id": valid_target_id,
                            "product": "internprep_ai",
                            "action": "revoke",
                            "reason": reason
                        }).execute()
                    except Exception:
                        pass
            return True
        except Exception as e:
            print(f"Error revoking entitlement: {e}")
            return False
