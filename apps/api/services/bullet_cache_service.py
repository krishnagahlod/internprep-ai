import hashlib
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from services.db import get_supabase

# In-memory LRU cache to minimize database roundtrips
_IN_MEMORY_BULLET_CACHE: Dict[str, Dict[str, Any]] = {}
MAX_IN_MEMORY_ENTRIES = 5000

class BulletCacheService:
    @staticmethod
    def normalize_bullet_text(text: str) -> str:
        """Normalizes bullet text by lowercasing, stripping leading symbols, and standardizing whitespace."""
        if not text:
            return ""
        # Remove bullet symbols (•, -, *, numbers like 1.)
        cleaned = re.sub(r"^[\s\•\-\*\d\.\)\:]+", "", text.strip())
        cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()
        return cleaned

    @classmethod
    def get_bullet_hash(cls, text: str) -> str:
        """Computes deterministic SHA-256 hash of normalized bullet text."""
        normalized = cls.normalize_bullet_text(text)
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    @classmethod
    def get_cached_bullet(cls, text: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached critique and suggested rewrites for a bullet point."""
        if not text or len(text.strip()) < 10:
            return None

        b_hash = cls.get_bullet_hash(text)

        # 1. In-memory check
        if b_hash in _IN_MEMORY_BULLET_CACHE:
            entry = _IN_MEMORY_BULLET_CACHE[b_hash]
            return {
                "bullet_hash": b_hash,
                "score": entry.get("score", 75),
                "critique": entry.get("critique", {}),
                "suggested_rewrites": entry.get("suggested_rewrites", []),
                "is_cached": True
            }

        # 2. Database lookup
        supabase = get_supabase()
        try:
            if supabase:
                res = supabase.table("bullet_critique_cache") \
                    .select("*") \
                    .eq("bullet_hash", b_hash) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    item = res.data[0]
                    cache_item = {
                        "bullet_hash": b_hash,
                        "score": item.get("score", 75),
                        "critique": item.get("critique", {}),
                        "suggested_rewrites": item.get("suggested_rewrites", []),
                        "is_cached": True
                    }
                    _IN_MEMORY_BULLET_CACHE[b_hash] = cache_item
                    return cache_item
        except Exception:
            pass

        return None

    @classmethod
    def cache_bullet_critique(
        cls,
        raw_bullet: str,
        score: int,
        critique: Dict[str, Any],
        suggested_rewrites: List[str]
    ) -> None:
        """Stores a newly generated bullet critique in cache."""
        if not raw_bullet or len(raw_bullet.strip()) < 10:
            return

        b_hash = cls.get_bullet_hash(raw_bullet)
        cache_entry = {
            "bullet_hash": b_hash,
            "raw_bullet": raw_bullet,
            "score": score,
            "critique": critique,
            "suggested_rewrites": suggested_rewrites,
            "is_cached": True
        }

        # Enforce memory cap
        if len(_IN_MEMORY_BULLET_CACHE) >= MAX_IN_MEMORY_ENTRIES:
            _IN_MEMORY_BULLET_CACHE.pop(next(iter(_IN_MEMORY_BULLET_CACHE)))

        _IN_MEMORY_BULLET_CACHE[b_hash] = cache_entry

        supabase = get_supabase()
        try:
            if supabase:
                supabase.table("bullet_critique_cache").upsert({
                    "bullet_hash": b_hash,
                    "raw_bullet": raw_bullet[:1000],
                    "score": score,
                    "critique": critique,
                    "suggested_rewrites": suggested_rewrites,
                    "last_hit_at": datetime.now(timezone.utc).isoformat()
                }, on_conflict="bullet_hash").execute()
        except Exception as e:
            print(f"Warning: Failed to persist bullet critique to DB: {e}")

    @classmethod
    def partition_bullets_by_cache(
        cls,
        bullets: List[str]
    ) -> Tuple[Dict[str, Dict[str, Any]], List[str]]:
        """
        Splits a list of resume bullets into:
        1. Dictionary of cached critique results mapped by raw bullet
        2. List of uncached raw bullets that must be processed by the LLM
        """
        cached_map: Dict[str, Dict[str, Any]] = {}
        uncached_list: List[str] = []

        for b in bullets:
            cached_val = cls.get_cached_bullet(b)
            if cached_val:
                cached_map[b] = cached_val
            else:
                uncached_list.append(b)

        return cached_map, uncached_list
