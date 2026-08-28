import json
import os
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from agents.feedback_generator import generate_interview_feedback
from supabase import create_client
from dependencies import limiter, AuthUser, get_optional_user
from services.security_logger import safe_log_error

router = APIRouter(prefix="/feedback", tags=["feedback"])

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class Message(BaseModel):
    role: str
    content: str

class FeedbackRequest(BaseModel):
    session_id: Optional[str] = None
    messages: Optional[List[Message]] = None # Fallback for no-db mode
    scratchpad: Optional[str] = ""
    interview_type: str = "case"

class FeedbackResponse(BaseModel):
    feedback: Dict[str, Any]

@router.post("/generate", response_model=FeedbackResponse)
@limiter.limit("15/hour")
async def generate_feedback(
    request: Request,
    body: FeedbackRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    try:
        history = []
        scratchpad = body.scratchpad
        
        if supabase and body.session_id and body.session_id != "temp_session_id":
            # Verify session ownership to prevent IDOR
            sess_res = supabase.table("interview_sessions").select("user_id, scratchpad_content, interview_type").eq("id", body.session_id).execute()
            if sess_res.data:
                owner_id = sess_res.data[0].get("user_id")
                if owner_id and (not auth_user or (auth_user.id != owner_id and not auth_user.is_admin)):
                    raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to access feedback for this session.")
                scratchpad = sess_res.data[0].get("scratchpad_content", "") or scratchpad
                body.interview_type = sess_res.data[0].get("interview_type", "case")

            # Fetch from DB
            msgs_res = supabase.table("session_messages").select("*").eq("session_id", body.session_id).order("created_at").execute()
            history = msgs_res.data or []
        elif body.messages:
            history = [{"role": m.role, "content": m.content, "phase": "unknown"} for m in body.messages]
        else:
            raise HTTPException(status_code=400, detail="No messages or valid session_id provided.")
            
        if not history:
             raise HTTPException(status_code=400, detail="Empty interview transcript.")
             
        # Generate feedback JSON
        feedback_json_str = generate_interview_feedback(
            history=history,
            scratchpad=scratchpad,
            interview_type=body.interview_type
        )
        
        feedback_dict = json.loads(feedback_json_str)
        
        if supabase and body.session_id and body.session_id != "temp_session_id":
             # Save to DB
             supabase.table("session_feedback").insert({
                 "session_id": body.session_id,
                 "dimension_notes": feedback_dict.get("dimensions", []),
                 "fix_next": feedback_dict.get("improvements", []),
                 "timeline_data": feedback_dict.get("timeline_data", []),
                 "suggested_resources": feedback_dict.get("strategic_advice", {})
             }).execute()
        
        return FeedbackResponse(feedback=feedback_dict)
    except HTTPException:
        raise
    except Exception as e:
        safe_log_error("Error generating feedback", exc=e)
        raise HTTPException(status_code=500, detail="An error occurred while generating interview feedback.")

@router.get("/{session_id}", response_model=FeedbackResponse)
@limiter.limit("30/hour")
async def get_feedback(
    request: Request,
    session_id: str,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Fetches previously generated feedback from DB with strict session ownership verification."""
    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Database connection unavailable")

        # Verify session ownership to prevent IDOR
        sess_res = supabase.table("interview_sessions").select("user_id, scratchpad_content, interview_type").eq("id", session_id).execute()
        if not sess_res.data:
            raise HTTPException(status_code=404, detail="Interview session not found.")
            
        owner_id = sess_res.data[0].get("user_id")
        if owner_id and (not auth_user or (auth_user.id != owner_id and not auth_user.is_admin)):
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view feedback for this session.")

        res = supabase.table("session_feedback").select("*").eq("session_id", session_id).execute()
        if not res.data:
             # Try generating it if it doesn't exist
             msgs_res = supabase.table("session_messages").select("*").eq("session_id", session_id).order("created_at").execute()
             history = msgs_res.data or []
             
             if not history:
                 raise HTTPException(status_code=404, detail="No session messages found to evaluate.")
                 
             scratchpad = sess_res.data[0].get("scratchpad_content", "") or ""
             interview_type = sess_res.data[0].get("interview_type", "case")
                 
             feedback_json_str = generate_interview_feedback(
                 history=history,
                 scratchpad=scratchpad,
                 interview_type=interview_type
             )
             
             feedback_dict = json.loads(feedback_json_str)
             
             supabase.table("session_feedback").insert({
                 "session_id": session_id,
                 "dimension_notes": feedback_dict.get("dimensions", []),
                 "fix_next": feedback_dict.get("improvements", []),
                 "timeline_data": feedback_dict.get("timeline_data", []),
                 "suggested_resources": feedback_dict.get("strategic_advice", {})
             }).execute()
             
             return FeedbackResponse(feedback=feedback_dict)
             
        db_fb = res.data[0]
        feedback_dict = {
             "overall_score": sum(d.get("score", 0) for d in db_fb.get("dimension_notes", [])) / max(len(db_fb.get("dimension_notes", [])), 1),
             "final_verdict": "Completed",
             "strengths": ["Adapted to feedback", "Maintained composure"],
             "improvements": db_fb.get("fix_next", []),
             "dimensions": db_fb.get("dimension_notes", []),
             "timeline_data": db_fb.get("timeline_data", []),
             "strategic_advice": db_fb.get("suggested_resources", {})
        }
        return FeedbackResponse(feedback=feedback_dict)
    except HTTPException:
        raise
    except Exception as e:
        safe_log_error(f"Error getting feedback for session {session_id}", exc=e)
        raise HTTPException(status_code=500, detail="Failed to retrieve interview feedback.")
