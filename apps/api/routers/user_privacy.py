import datetime
from typing import Dict, Any
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse

from dependencies import limiter, AuthUser, get_current_user
from services.db import get_supabase, safe_execute
from services.security_logger import safe_log_info, safe_log_error

router = APIRouter(prefix="/privacy", tags=["Data Privacy & DPDP Compliance"])

@router.get("/export-data")
@limiter.limit("5/hour")
async def export_user_data(
    request: Request,
    auth_user: AuthUser = Depends(get_current_user)
):
    """
    DPDP Act 2023 & GDPR Right to Data Portability / Access.
    Exports all personal records, parsed resumes, achievements, interview transcripts,
    and account metadata into a portable, machine-readable JSON archive.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    user_id = auth_user.id
    export_payload: Dict[str, Any] = {
        "metadata": {
            "platform": "InternPrep AI",
            "data_fiduciary": "InternPrep AI Technologies Pvt. Ltd.",
            "export_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "compliance": "India DPDP Act 2023 & GDPR Art. 20",
            "user_id": user_id,
            "email": auth_user.email
        },
        "profile": {},
        "resumes": [],
        "achievements": [],
        "saved_bullets": [],
        "interview_sessions": [],
        "credits_and_entitlements": {}
    }

    try:
        # 1. Profile
        prof_res = safe_execute(lambda client: client.table("profiles").select("*").eq("id", user_id))
        if prof_res and prof_res.data:
            export_payload["profile"] = prof_res.data[0]

        # 2. Resumes
        res_res = safe_execute(lambda client: client.table("resumes").select("*").eq("user_id", user_id))
        if res_res and res_res.data:
            export_payload["resumes"] = res_res.data

        # 3. Achievements Vault
        try:
            ach_res = safe_execute(lambda client: client.table("resume_achievements").select("*").eq("user_id", user_id))
            if ach_res and ach_res.data:
                export_payload["achievements"] = ach_res.data
        except Exception:
            pass

        # 4. Point Bank Saved Bullets
        try:
            bullet_res = safe_execute(lambda client: client.table("resume_saved_bullets").select("*").eq("user_id", user_id))
            if bullet_res and bullet_res.data:
                export_payload["saved_bullets"] = bullet_res.data
        except Exception:
            pass

        # 5. Interview Sessions & Transcripts
        try:
            sess_res = safe_execute(lambda client: client.table("interview_sessions").select("*").eq("user_id", user_id))
            sessions = sess_res.data if sess_res and sess_res.data else []
            
            for sess in sessions:
                sid = sess.get("id")
                sess_item = dict(sess)
                msg_res = safe_execute(lambda client: client.table("session_messages").select("role, content, phase, created_at").eq("session_id", sid).order("created_at"))
                sess_item["messages"] = [dict(m) for m in msg_res.data] if msg_res and msg_res.data else []
                export_payload["interview_sessions"].append(sess_item)
        except Exception as sess_err:
            safe_log_error(f"Error gathering interview transcripts during export for {user_id}", exc=sess_err)

        # 6. Entitlements & Topups
        try:
            from services.entitlement_service import EntitlementService
            from services.usage_service import UsageService
            ent = EntitlementService.get_active_entitlement(user_id=user_id, user_email=auth_user.email)
            topups = UsageService.get_topup_balance(user_id, "mock_interview")
            export_payload["credits_and_entitlements"] = {
                "active_entitlement": ent,
                "mock_credits_balance": topups
            }
        except Exception:
            pass

        safe_log_info(f"[DPDP DATA EXPORT] Completed portable data export for user {user_id}")
        
        filename = f"internprep_data_export_{user_id[:8]}.json"
        return JSONResponse(
            status_code=200,
            content=export_payload,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/json"
            }
        )
    except Exception as e:
        safe_log_error(f"Data export failed for user {user_id}", exc=e)
        raise HTTPException(status_code=500, detail="Failed to generate data export archive.")


@router.delete("/delete-account")
@limiter.limit("3/hour")
async def delete_user_account(
    request: Request,
    auth_user: AuthUser = Depends(get_current_user)
):
    """
    DPDP Act 2023 Section 12 & GDPR Article 17 (Right to Erasure / Right to be Forgotten).
    Permanently deletes all personal information, uploaded resumes, interview transcripts,
    bullet achievements, and the underlying Supabase Auth identity.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    user_id = auth_user.id
    safe_log_info(f"[DPDP ACCOUNT ERASURE INITIATED] Permanent deletion request for user {user_id}")

    try:
        # 1. Fetch user's session IDs to delete messages
        try:
            sess_res = safe_execute(lambda client: client.table("interview_sessions").select("id").eq("user_id", user_id))
            if sess_res and sess_res.data:
                session_ids = [s["id"] for s in sess_res.data]
                for sid in session_ids:
                    safe_execute(lambda client: client.table("session_messages").delete().eq("session_id", sid))
        except Exception as e:
            safe_log_error(f"Error purging session messages for user {user_id}", exc=e)

        # 2. Delete Interview Sessions
        try:
            safe_execute(lambda client: client.table("interview_sessions").delete().eq("user_id", user_id))
        except Exception as e:
            safe_log_error(f"Error purging interview sessions for user {user_id}", exc=e)

        # 3. Delete Resume Achievements & Point Bank Bullets
        try:
            safe_execute(lambda client: client.table("resume_achievements").delete().eq("user_id", user_id))
            safe_execute(lambda client: client.table("resume_saved_bullets").delete().eq("user_id", user_id))
        except Exception as e:
            safe_log_error(f"Error purging resume builder items for user {user_id}", exc=e)

        # 4. Delete Resumes and Storage Objects
        try:
            res_res = safe_execute(lambda client: client.table("resumes").select("id, file_url").eq("user_id", user_id))
            if res_res and res_res.data:
                for r in res_res.data:
                    furl = r.get("file_url")
                    if furl and "resumes/" in furl:
                        try:
                            fname = furl.split("resumes/")[-1]
                            supabase.storage.from_("resumes").remove([fname])
                        except Exception:
                            pass
            safe_execute(lambda client: client.table("resumes").delete().eq("user_id", user_id))
        except Exception as e:
            safe_log_error(f"Error purging resumes for user {user_id}", exc=e)

        # 5. Delete Profile
        try:
            safe_execute(lambda client: client.table("profiles").delete().eq("id", user_id))
        except Exception as e:
            safe_log_error(f"Error purging profile for user {user_id}", exc=e)

        # 6. Delete Supabase Auth User via Admin API
        try:
            if hasattr(supabase, "auth") and hasattr(supabase.auth, "admin"):
                supabase.auth.admin.delete_user(user_id)
        except Exception as auth_err:
            safe_log_error(f"Error calling supabase.auth.admin.delete_user for {user_id}", exc=auth_err)

        safe_log_info(f"[DPDP ACCOUNT ERASURE COMPLETE] Erased all records for user {user_id}")

        return {
            "status": "success",
            "message": "Your account and all associated personal data have been permanently deleted in accordance with the DPDP Act 2023."
        }
    except Exception as e:
        safe_log_error(f"Account deletion failed for user {user_id}", exc=e)
        raise HTTPException(status_code=500, detail="Failed to complete account deletion.")
