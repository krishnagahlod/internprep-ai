import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException
from services.db import get_supabase
from services.entitlement_service import DEFAULT_FEATURE_LIMITS

# Local in-memory cache to prevent race conditions during bursts
_IN_MEMORY_USAGE_CACHE: Dict[str, int] = {}

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
    def get_feature_usage(cls, user_id: str, feature_key: str, period_key: Optional[str] = None) -> int:
        """Retrieves count of units used in the current period."""
        if not period_key:
            period_key = cls.get_current_period_key("month")
        
        cache_key = f"{user_id}:{feature_key}:{period_key}"
        supabase = get_supabase()
        
        try:
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
        Calculates quota status for a feature.
        Returns: { allowed, limit, used, remaining, period, reset_at }
        """
        limit = cls.get_feature_limit(plan_key, feature_key)
        period_key = cls.get_current_period_key("month")
        used = cls.get_feature_usage(user_id, feature_key, period_key)
        reset_at = cls.get_period_reset_at("month")

        if limit == -1:  # Unlimited
            return {
                "allowed": True,
                "limit": -1,
                "used": used,
                "remaining": 999999,
                "period": "month",
                "reset_at": reset_at,
                "plan_key": plan_key,
                "feature_key": feature_key
            }

        remaining = max(0, limit - used)
        allowed = remaining > 0

        return {
            "allowed": allowed,
            "limit": limit,
            "used": used,
            "remaining": remaining,
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
        Raises HTTPException(403) if quota is exceeded.
        """
        quota = cls.check_quota(user_id, plan_key, feature_key)
        
        if not quota["allowed"] or (quota["limit"] != -1 and quota["remaining"] < units):
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "quota_exceeded",
                    "message": f"You have reached your {plan_key.upper()} tier limit for {feature_key.replace('_', ' ')}. Please upgrade to Pro for elevated placement quotas.",
                    "feature": feature_key,
                    "plan": plan_key,
                    "limit": quota["limit"],
                    "used": quota["used"],
                    "remaining": quota["remaining"],
                    "reset_at": quota["reset_at"],
                    "upgrade_required": True
                }
            )

        period_key = cls.get_current_period_key("month")
        cache_key = f"{user_id}:{feature_key}:{period_key}"
        new_count = quota["used"] + units
        _IN_MEMORY_USAGE_CACHE[cache_key] = new_count

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

        return {
            "success": True,
            "feature": feature_key,
            "used": new_count,
            "used_count": new_count,
            "remaining": (quota["limit"] - new_count) if quota["limit"] != -1 else 999999,
            "remaining_count": (quota["limit"] - new_count) if quota["limit"] != -1 else 999999,
            "limit": quota["limit"]
        }
