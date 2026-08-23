import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException
from services.db import get_supabase
from services.entitlement_service import DEFAULT_FEATURE_LIMITS

# Local in-memory caches
_IN_MEMORY_USAGE_CACHE: Dict[str, int] = {}
_IN_MEMORY_TOPUP_CREDITS: Dict[str, int] = {}

class UsageService:
    @staticmethod
    def get_current_period_key(period: str = "month") -> str:
        now = datetime.now(timezone.utc)
        if period == "month":
            return now.strftime("%Y-%m")
        elif period == "day":
            return now.strftime("%Y-%m-%d")
        return "lifetime"

    @staticmethod
    def get_period_reset_at(period: str = "month") -> str:
        now = datetime.now(timezone.utc)
        if period == "month":
            # First day of next month
            if now.month == 12:
                next_month = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                next_month = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
            return next_month.isoformat()
        elif period == "day":
            next_day = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            return next_day.isoformat()
        return "never"

    @staticmethod
    def get_feature_limit(plan_key: str, feature_key: str) -> int:
        """Retrieves numerical limit for a feature under a plan (-1 = unlimited)."""
        supabase = get_supabase()
        try:
            res = supabase.table("feature_limits") \
                .select("limit_value, enabled") \
                .eq("product", "internprep_ai") \
                .eq("plan_key", plan_key) \
                .eq("feature_key", feature_key) \
                .limit(1) \
                .execute()
            if res.data and len(res.data) > 0:
                item = res.data[0]
                if not item.get("enabled", True):
                    return 0
                return item.get("limit_value", 0)
        except Exception:
            pass

        # Fallback to configured defaults
        plan_limits = DEFAULT_FEATURE_LIMITS.get(plan_key, DEFAULT_FEATURE_LIMITS["free"])
        return plan_limits.get(feature_key, 0)

    @classmethod
    def get_topup_balance(cls, user_id: str, feature_key: str) -> int:
        """Retrieves user's purchased non-expiring topup credit balance."""
        cache_key = f"{user_id}:{feature_key}"
        supabase = get_supabase()
        try:
            if supabase:
                res = supabase.table("user_topup_credits") \
                    .select("credits_remaining") \
                    .eq("user_id", user_id) \
                    .eq("product", "internprep_ai") \
                    .eq("feature_key", feature_key) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    balance = int(res.data[0].get("credits_remaining", 0))
                    _IN_MEMORY_TOPUP_CREDITS[cache_key] = balance
                    return balance
        except Exception:
            pass
        return _IN_MEMORY_TOPUP_CREDITS.get(cache_key, 0)

    @classmethod
    def add_topup_credits(cls, user_id: str, feature_key: str, credits: int) -> int:
        """Adds purchased micro-topup credits to user's balance."""
        cache_key = f"{user_id}:{feature_key}"
        current = cls.get_topup_balance(user_id, feature_key)
        new_balance = current + credits
        _IN_MEMORY_TOPUP_CREDITS[cache_key] = new_balance

        supabase = get_supabase()
        try:
            if supabase:
                supabase.table("user_topup_credits").upsert({
                    "user_id": user_id,
                    "product": "internprep_ai",
                    "feature_key": feature_key,
                    "credits_remaining": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }, on_conflict="user_id,product,feature_key").execute()
        except Exception as e:
            print(f"Warning: Failed to persist topup credit addition: {e}")

        return new_balance

    @classmethod
    def deduct_topup_credits(cls, user_id: str, feature_key: str, units: int = 1) -> int:
        """Deducts consumed credits from topup balance."""
        cache_key = f"{user_id}:{feature_key}"
        current = cls.get_topup_balance(user_id, feature_key)
        new_balance = max(0, current - units)
        _IN_MEMORY_TOPUP_CREDITS[cache_key] = new_balance

        supabase = get_supabase()
        try:
            if supabase:
                supabase.table("user_topup_credits").update({
                    "credits_remaining": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("user_id", user_id).eq("product", "internprep_ai").eq("feature_key", feature_key).execute()
        except Exception as e:
            print(f"Warning: Failed to deduct topup credit: {e}")

        return new_balance

    @classmethod
    def get_feature_usage(cls, user_id: str, feature_key: str, period_key: Optional[str] = None) -> int:
        """Retrieves count of units used in the current period."""
        if not period_key:
            period_key = cls.get_current_period_key("month")
        
        cache_key = f"{user_id}:{feature_key}:{period_key}"
        supabase = get_supabase()
        
        try:
            if supabase:
                res = supabase.table("usage_events") \
                    .select("count") \
                    .eq("user_id", user_id) \
                    .eq("product", "internprep_ai") \
                    .eq("feature_key", feature_key) \
                    .eq("period_key", period_key) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    count = int(res.data[0].get("count", 0))
                    _IN_MEMORY_USAGE_CACHE[cache_key] = count
                    return count
        except Exception:
            pass

        return _IN_MEMORY_USAGE_CACHE.get(cache_key, 0)

    @classmethod
    def check_quota(cls, user_id: str, plan_key: str, feature_key: str) -> Dict[str, Any]:
        """
        Calculates quota status for a feature including top-up add-ons.
        Returns: { allowed, limit, used, base_remaining, topup_credits, remaining, period, reset_at }
        """
        limit = cls.get_feature_limit(plan_key, feature_key)
        period_key = cls.get_current_period_key("month")
        used = cls.get_feature_usage(user_id, feature_key, period_key)
        topup_credits = cls.get_topup_balance(user_id, feature_key)
        reset_at = cls.get_period_reset_at("month")

        if limit == -1:  # Unlimited
            return {
                "allowed": True,
                "limit": -1,
                "used": used,
                "base_remaining": 999999,
                "topup_credits": topup_credits,
                "remaining": 999999,
                "period": "month",
                "reset_at": reset_at,
                "plan_key": plan_key,
                "feature_key": feature_key
            }

        base_remaining = max(0, limit - used)
        total_remaining = base_remaining + topup_credits
        allowed = total_remaining > 0

        return {
            "allowed": allowed,
            "limit": limit,
            "used": used,
            "base_remaining": base_remaining,
            "topup_credits": topup_credits,
            "remaining": total_remaining,
            "period": "month",
            "reset_at": reset_at,
            "plan_key": plan_key,
            "feature_key": feature_key
        }

    @classmethod
    def get_user_usage_summary(cls, user_id: str, plan_key: str) -> Dict[str, Any]:
        """
        Returns quota consumption summary across all key platform capabilities:
        - resume_analysis
        - mock_interview
        - bullet_refine
        - placement_intelligence
        """
        features = ["resume_analysis", "mock_interview", "bullet_refine", "placement_intelligence"]
        return {
            feat: cls.check_quota(user_id=user_id, plan_key=plan_key, feature_key=feat)
            for feat in features
        }

    @classmethod
    def consume_quota(
        cls,
        user_id: str,
        plan_key: str,
        feature_key: str,
        units: int = 1,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enforces and consumes quota atomically.
        Consumes from base monthly quota first; when base quota = 0, consumes top-up credits.
        Raises HTTPException(403) if combined quota is exceeded.
        """
        quota = cls.check_quota(user_id, plan_key, feature_key)
        
        if not quota["allowed"] or (quota["limit"] != -1 and quota["remaining"] < units):
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "quota_exceeded",
                    "message": f"You have reached your limit for {feature_key.replace('_', ' ')}. Upgrade to Pro or get a 1-time Top-Up to continue.",
                    "feature": feature_key,
                    "plan": plan_key,
                    "limit": quota["limit"],
                    "used": quota["used"],
                    "base_remaining": quota["base_remaining"],
                    "topup_credits": quota["topup_credits"],
                    "remaining": quota["remaining"],
                    "reset_at": quota["reset_at"],
                    "upgrade_required": True
                }
            )

        # Deduct from base quota first if available
        base_rem = quota["base_remaining"]
        period_key = cls.get_current_period_key("month")
        cache_key = f"{user_id}:{feature_key}:{period_key}"

        if quota["limit"] == -1:
            new_count = quota["used"] + units
            _IN_MEMORY_USAGE_CACHE[cache_key] = new_count
        elif base_rem >= units:
            new_count = quota["used"] + units
            _IN_MEMORY_USAGE_CACHE[cache_key] = new_count
        else:
            # Base quota partially or fully exhausted -> consume remaining base quota and deduct rest from topup
            needed_from_topup = units - base_rem
            new_count = quota["limit"]
            _IN_MEMORY_USAGE_CACHE[cache_key] = new_count
            cls.deduct_topup_credits(user_id, feature_key, needed_from_topup)

        # Persist atomic increment in Supabase if connected
        supabase = get_supabase()
        if supabase:
            try:
                # Upsert usage_events
                supabase.table("usage_events").upsert({
                    "user_id": user_id,
                    "product": "internprep_ai",
                    "feature_key": feature_key,
                    "period_key": period_key,
                    "count": new_count,
                    "last_used_at": datetime.now(timezone.utc).isoformat()
                }, on_conflict="user_id,product,feature_key,period_key").execute()

                # Record event in usage_event_log
                supabase.table("usage_event_log").insert({
                    "user_id": user_id,
                    "product": "internprep_ai",
                    "feature_key": feature_key,
                    "request_id": request_id,
                    "units": units
                }).execute()
            except Exception as e:
                print(f"Warning: Failed to persist usage event to DB: {e}")

        refreshed = cls.check_quota(user_id, plan_key, feature_key)
        return {
            "success": True,
            "feature": feature_key,
            "used": refreshed["used"],
            "used_count": refreshed["used"],
            "remaining": refreshed["remaining"],
            "remaining_count": refreshed["remaining"],
            "base_remaining": refreshed["base_remaining"],
            "topup_credits": refreshed["topup_credits"],
            "limit": refreshed["limit"]
        }
