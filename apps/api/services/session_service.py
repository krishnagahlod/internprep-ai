import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from services.db import get_supabase

# Memory cache for active sessions
_REVOKED_SESSIONS = set()
_ACTIVE_SESSIONS: Dict[str, Dict[str, Dict[str, Any]]] = {}

class SessionService:
    @staticmethod
    def hash_ip(ip: Optional[str]) -> Optional[str]:
        if not ip:
            return None
        return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]

    @staticmethod
    def hash_device(user_agent: Optional[str]) -> Optional[str]:
        if not user_agent:
            return "unknown_device"
        return hashlib.sha256(user_agent.encode("utf-8")).hexdigest()[:16]

    @classmethod
    def record_session(
        cls,
        user_id: str,
        session_id: str,
        user_agent: Optional[str] = None,
        client_ip: Optional[str] = None,
        device_name: Optional[str] = None
    ) -> None:
        """Records or updates user device session."""
        now = datetime.now(timezone.utc).isoformat()
        supabase = get_supabase()
        
        device_hash = cls.hash_device(user_agent)
        ip_hash = cls.hash_ip(client_ip)

        session_record = {
            "user_id": user_id,
            "session_id": session_id,
            "device_hash": device_hash,
            "device_name": device_name or "Web Browser",
            "user_agent": (user_agent or "")[:250],
            "ip_hash": ip_hash,
            "last_seen_at": now,
            "revoked_at": None
        }

        # Enforce strict single-device concurrency: Revoke other sessions for this user
        if user_id in _ACTIVE_SESSIONS:
            for old_sess_id in list(_ACTIVE_SESSIONS[user_id].keys()):
                if old_sess_id != session_id:
                    _REVOKED_SESSIONS.add(old_sess_id)
                    _ACTIVE_SESSIONS[user_id].pop(old_sess_id, None)

        # Track new session in memory
        cls.clear_revoked_if_relogin(session_id)
        _ACTIVE_SESSIONS.setdefault(user_id, {})[session_id] = session_record

        if supabase:
            try:
                # Revoke previous sessions in DB
                supabase.table("user_sessions") \
                    .update({"revoked_at": now}) \
                    .eq("user_id", user_id) \
                    .neq("session_id", session_id) \
                    .is_("revoked_at", "null") \
                    .execute()

                supabase.table("user_sessions").upsert({
                    "user_id": user_id,
                    "session_id": session_id,
                    "device_hash": device_hash,
                    "device_name": device_name or "Web Browser",
                    "user_agent": (user_agent or "")[:250],
                    "ip_hash": ip_hash,
                    "last_seen_at": now,
                    "revoked_at": None
                }, on_conflict="session_id").execute()
            except Exception:
                pass

    @classmethod
    def clear_revoked_if_relogin(cls, session_id: str):
        if session_id in _REVOKED_SESSIONS:
            _REVOKED_SESSIONS.discard(session_id)

    @classmethod
    def is_session_revoked(cls, session_id: str) -> bool:
        """Checks if a session has been revoked."""
        if session_id in _REVOKED_SESSIONS:
            return True

        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("user_sessions") \
                    .select("revoked_at") \
                    .eq("session_id", session_id) \
                    .limit(1) \
                    .execute()
                if res.data and len(res.data) > 0:
                    revoked_at = res.data[0].get("revoked_at")
                    if revoked_at:
                        _REVOKED_SESSIONS.add(session_id)
                        return True
            except Exception:
                pass

        return False

    @classmethod
    def get_user_sessions(cls, user_id: str) -> List[Dict[str, Any]]:
        """Lists active and past sessions for a user."""
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("user_sessions") \
                    .select("*") \
                    .eq("user_id", user_id) \
                    .order("last_seen_at", desc=True) \
                    .limit(20) \
                    .execute()
                if res.data:
                    return res.data
            except Exception:
                pass
        
        user_sess_map = _ACTIVE_SESSIONS.get(user_id, {})
        return list(user_sess_map.values())

    @classmethod
    def get_active_sessions(cls, user_id: str) -> List[Dict[str, Any]]:
        """Lists only unrevoked active sessions for a user."""
        all_sessions = cls.get_user_sessions(user_id)
        return [s for s in all_sessions if not s.get("revoked_at") and s.get("session_id") not in _REVOKED_SESSIONS]

    @classmethod
    def revoke_session(cls, user_id: str, session_id: str) -> bool:
        """Revokes a specific session."""
        now = datetime.now(timezone.utc).isoformat()
        _REVOKED_SESSIONS.add(session_id)
        
        if user_id in _ACTIVE_SESSIONS and session_id in _ACTIVE_SESSIONS[user_id]:
            _ACTIVE_SESSIONS[user_id][session_id]["revoked_at"] = now

        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("user_sessions") \
                    .update({"revoked_at": now}) \
                    .eq("user_id", user_id) \
                    .eq("session_id", session_id) \
                    .execute()
                return True
            except Exception as e:
                print(f"Error revoking session: {e}")
        return True

    @classmethod
    def revoke_all_other_sessions(cls, user_id: str, current_session_id: str) -> int:
        """Signs user out of all other devices and returns number of revoked sessions."""
        now = datetime.now(timezone.utc).isoformat()
        revoked_count = 0

        user_sess = _ACTIVE_SESSIONS.get(user_id, {})
        for s_id, s_data in user_sess.items():
            if s_id != current_session_id:
                _REVOKED_SESSIONS.add(s_id)
                s_data["revoked_at"] = now
                revoked_count += 1

        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("user_sessions") \
                    .update({"revoked_at": now}) \
                    .eq("user_id", user_id) \
                    .neq("session_id", current_session_id) \
                    .execute()
            except Exception as e:
                print(f"Error revoking other sessions: {e}")

        return max(revoked_count, 1 if len(user_sess) > 1 else 0)
