import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from agents.feedback_generator import generate_interview_feedback
from supabase import create_client

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
async def generate_feedback(request: FeedbackRequest):
    try:
        history = []
        scratchpad = request.scratchpad
        
        if supabase and request.session_id and request.session_id != "temp_session_id":
            # Fetch from DB
            msgs_res = supabase.table("session_messages").select("*").eq("session_id", request.session_id).order("created_at").execute()
            history = msgs_res.data or []
            
            sess_res = supabase.table("interview_sessions").select("scratchpad_content, interview_type").eq("id", request.session_id).execute()
            if sess_res.data:
                scratchpad = sess_res.data[0].get("scratchpad_content", "") or scratchpad
                request.interview_type = sess_res.data[0].get("interview_type", "case")
        elif request.messages:
            history = [{"role": m.role, "content": m.content, "phase": "unknown"} for m in request.messages]
        else:
            raise Exception("No messages or valid session_id provided.")
            
        if not history:
             raise Exception("Empty interview transcript.")
             
        # Generate feedback JSON
        feedback_json_str = generate_interview_feedback(
            history=history,
            scratchpad=scratchpad,
            interview_type=request.interview_type
        )
        
        feedback_dict = json.loads(feedback_json_str)
        
        if supabase and request.session_id and request.session_id != "temp_session_id":
             # Save to DB
             supabase.table("session_feedback").insert({
                 "session_id": request.session_id,
                 "dimension_notes": feedback_dict.get("dimensions", []),
                 "fix_next": feedback_dict.get("improvements", []),
                 "timeline_data": feedback_dict.get("timeline_data", []),
                 "suggested_resources": feedback_dict.get("strategic_advice", {})
             }).execute()
        
        return FeedbackResponse(feedback=feedback_dict)
    except Exception as e:
        print(f"Error generating feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}", response_model=FeedbackResponse)
async def get_feedback(session_id: str):
    """Fetches previously generated feedback from DB."""
    try:
        if not supabase:
             raise Exception("DB not configured")
             
        res = supabase.table("session_feedback").select("*").eq("session_id", session_id).execute()
        if not res.data:
             # Try generating it if it doesn't exist
             msgs_res = supabase.table("session_messages").select("*").eq("session_id", session_id).order("created_at").execute()
             history = msgs_res.data or []
             
             if not history:
                 raise HTTPException(status_code=404, detail="No session messages found to evaluate.")
                 
             sess_res = supabase.table("interview_sessions").select("scratchpad_content, interview_type").eq("id", session_id).execute()
             scratchpad = ""
             interview_type = "case"
             if sess_res.data:
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
        # Reconstruct the schema shape for the frontend
        feedback_dict = {
             "overall_score": sum(d.get("score", 0) for d in db_fb.get("dimension_notes", [])) / max(len(db_fb.get("dimension_notes", [])), 1),
             "final_verdict": "Completed", # Could store this in DB too
             "strengths": ["Adapted to feedback", "Maintained composure"], # Hardcoded if not saved
             "improvements": db_fb.get("fix_next", []),
             "dimensions": db_fb.get("dimension_notes", []),
             "timeline_data": db_fb.get("timeline_data", []),
             "strategic_advice": db_fb.get("suggested_resources", {})
        }
        return FeedbackResponse(feedback=feedback_dict)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
