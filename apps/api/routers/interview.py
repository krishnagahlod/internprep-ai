from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from agents.case_interviewer import generate_case_response, generate_hint, get_random_case
from agents.domain_interviewer import generate_domain_interview_response
from services.rag import retrieve_context
from supabase import create_client
from dependencies import limiter, posthog_client

router = APIRouter(prefix="/interview", tags=["interview"])

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class Message(BaseModel):
    role: str
    content: str

class StartCaseRequest(BaseModel):
    user_id: Optional[str] = None
    case_type: Optional[str] = "Random"

class StartCaseResponse(BaseModel):
    session_id: str
    case_context: str
    case_source: str
    page_number: Optional[int] = 0
    initial_message: str
    initial_phase: str

class ChatRequest(BaseModel):
    session_id: str
    messages: List[Message]
    current_phase: str
    scratchpad: str
    case_context: Optional[str] = None
    case_source: Optional[str] = None
    interview_type: Optional[str] = "case"
    domain: Optional[str] = None
    company: Optional[str] = None
    resume_context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    new_phase: str

class StartDomainRequest(BaseModel):
    user_id: Optional[str] = None
    domain: str
    company: Optional[str] = None
    resume_id: Optional[str] = None

class StartDomainResponse(BaseModel):
    session_id: str
    initial_message: str
    initial_phase: str
    domain: str
    company: Optional[str] = None
    resume_context: Optional[str] = None

class HintResponse(BaseModel):
    hint: str

class EndSessionRequest(BaseModel):
    session_id: str

@router.post("/start_case", response_model=StartCaseResponse)
@limiter.limit("3/hour")
async def start_case_endpoint(request: Request, body: StartCaseRequest):
    try:
        random_case_dict = get_random_case(body.case_type)
        if not random_case_dict:
            raise Exception("No cases found for the given criteria.")
            
        solution_transcript = random_case_dict.get("solution_transcript", "")
        problem_statement = random_case_dict.get("problem_statement", "")
        case_source = random_case_dict.get("pdf_source", "")
        page_number = random_case_dict.get("page_number") or 1
        
        full_context = f"PROBLEM STATEMENT: {problem_statement}\n\nGOLD STANDARD SOLUTION:\n{solution_transcript}"
        initial_phase = "introduction"
        
        # Generate the opening message
        bot_reply, next_phase = generate_case_response(
            history=[],
            current_phase=initial_phase,
            context=full_context,
            scratchpad=""
        )
        
        session_id = "temp_session_id"
        if supabase:
            # Create session in DB
            insert_data = {
                "interview_type": "case",
                "status": "in_progress",
                "case_state": {"current_phase": next_phase, "case_id": random_case_dict.get("id")}
            }
            if body.user_id:
                insert_data["user_id"] = body.user_id
                
            res = supabase.table("interview_sessions").insert(insert_data).execute()
            if res.data:
                session_id = res.data[0]["id"]
                # Save initial bot message
                supabase.table("session_messages").insert({
                    "session_id": session_id,
                    "role": "assistant",
                    "content": bot_reply,
                    "phase": initial_phase
                }).execute()
        
        if posthog_client and body.user_id:
            posthog_client.capture(
                distinct_id=body.user_id, 
                event='interview_started', 
                properties={
                    'interview_type': 'case',
                    'case_source': case_source,
                    'session_id': session_id,
                }
            )
            
        return StartCaseResponse(
            session_id=session_id,
            case_context=full_context,
            case_source=case_source,
            page_number=page_number,
            initial_message=bot_reply,
            initial_phase=next_phase
        )
    except Exception as e:
        print(f"Error starting case: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start_domain", response_model=StartDomainResponse)
@limiter.limit("3/hour")
async def start_domain_endpoint(request: Request, body: StartDomainRequest):
    try:
        initial_phase = "introduction"
        
        # Get resume context if resume_id is provided
        resume_context = "No resume provided."
        file_url = ""
        if body.resume_id and supabase:
            res = supabase.table("resumes").select("parsed_content, file_url").eq("id", body.resume_id).execute()
            if res.data:
                if res.data[0].get("parsed_content"):
                    resume_context = res.data[0]["parsed_content"]
                if res.data[0].get("file_url"):
                    file_url = res.data[0]["file_url"]
        
        # Generate the opening message
        bot_reply, next_phase = generate_domain_interview_response(
            history=[],
            current_phase=initial_phase,
            resume_context=resume_context,
            domain=body.domain,
            company=body.company
        )
        
        session_id = "temp_session_id"
        if supabase:
            # Create session in DB
            insert_data = {
                "interview_type": "domain",
                "status": "in_progress",
                "case_state": {"current_phase": next_phase, "domain": body.domain, "company": body.company, "resume_context": resume_context, "case_source": file_url}
            }
            if body.user_id:
                insert_data["user_id"] = body.user_id
                
            res = supabase.table("interview_sessions").insert(insert_data).execute()
            if res.data:
                session_id = res.data[0]["id"]
                # Save initial bot message
                supabase.table("session_messages").insert({
                    "session_id": session_id,
                    "role": "assistant",
                    "content": bot_reply,
                    "phase": initial_phase
                }).execute()
        
        if posthog_client and body.user_id:
            posthog_client.capture(
                distinct_id=body.user_id, 
                event='interview_started', 
                properties={
                    'interview_type': 'domain',
                    'domain': body.domain,
                    'company': body.company,
                    'session_id': session_id,
                }
            )
            
        return StartDomainResponse(
            session_id=session_id,
            initial_message=bot_reply,
            initial_phase=next_phase,
            domain=body.domain,
            company=body.company,
            resume_context=resume_context
        )
    except Exception as e:
        print(f"Error starting domain interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("50/hour")
async def chat_endpoint(request: Request, body: ChatRequest):
    try:
        history = [{"role": m.role, "content": m.content} for m in body.messages]
        
        dynamic_context = ""
        latest_user_msg = history[-1]["content"] if history and history[-1]["role"] == "user" else ""
        if body.case_source and latest_user_msg:
            from services.rag import retrieve_context
            dynamic_context = retrieve_context(latest_user_msg, source=body.case_source, top_k=2)
            
        combined_context = body.case_context or ""
        if dynamic_context:
            combined_context += "\n\nRELEVANT CASEBOOK EXCERPTS FOR CURRENT QUESTION:\n" + dynamic_context
        
        bot_reply = ""
        new_phase = body.current_phase
        
        if body.interview_type == "domain":
            bot_reply, new_phase = generate_domain_interview_response(
                history=history,
                current_phase=body.current_phase,
                resume_context=body.resume_context or "No resume provided.",
                domain=body.domain or "General",
                company=body.company
            )
        else:
            bot_reply, new_phase = generate_case_response(
                history=history,
                current_phase=body.current_phase,
                context=combined_context,
                scratchpad=body.scratchpad
            )
        
        if supabase and body.session_id != "temp_session_id":
            # Save user message
            latest_user_msg = history[-1]["content"] if history and history[-1]["role"] == "user" else ""
            if latest_user_msg:
                supabase.table("session_messages").insert({
                    "session_id": body.session_id,
                    "role": "user",
                    "content": latest_user_msg,
                    "phase": body.current_phase
                }).execute()
                
            # Save bot message
            supabase.table("session_messages").insert({
                "session_id": body.session_id,
                "role": "assistant",
                "content": bot_reply,
                "phase": new_phase
            }).execute()
            
            # Update session state if phase changed
            if new_phase != body.current_phase:
                # Fetch existing case_state
                sess = supabase.table("interview_sessions").select("case_state").eq("id", body.session_id).execute()
                if sess.data:
                    case_state = sess.data[0].get("case_state", {})
                    case_state["current_phase"] = new_phase
                    supabase.table("interview_sessions").update({
                        "case_state": case_state,
                        "scratchpad_content": body.scratchpad
                    }).eq("id", body.session_id).execute()
        
        return ChatResponse(response=bot_reply, new_phase=new_phase)
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hint", response_model=HintResponse)
async def hint_endpoint(request: ChatRequest):
    try:
        history = [{"role": m.role, "content": m.content} for m in request.messages]
        
        dynamic_context = ""
        latest_user_msg = history[-1]["content"] if history and history[-1]["role"] == "user" else ""
        if request.case_source and latest_user_msg:
            from services.rag import retrieve_context
            dynamic_context = retrieve_context(latest_user_msg, source=request.case_source, top_k=2)
            
        combined_context = request.case_context or ""
        if dynamic_context:
            combined_context += "\n\nRELEVANT CASEBOOK EXCERPTS FOR CURRENT QUESTION:\n" + dynamic_context
            
        hint_reply = generate_hint(history=history, context=combined_context)
        return HintResponse(hint=hint_reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/end_session")
async def end_session_endpoint(request: EndSessionRequest):
    """Marks session as complete. The feedback router will handle generation."""
    try:
        if supabase and request.session_id != "temp_session_id":
            import datetime
            supabase.table("interview_sessions").update({
                "status": "completed",
                "completed_at": datetime.datetime.utcnow().isoformat()
            }).eq("id", request.session_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
@limiter.limit("30/hour")
async def get_session_endpoint(request: Request, session_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        res = supabase.table("interview_sessions").select("*").eq("id", session_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = res.data[0]
        
        # Fetch messages
        msg_res = supabase.table("session_messages").select("*").eq("session_id", session_id).order("created_at").execute()
        messages = [{"role": m["role"], "content": m["content"]} for m in msg_res.data] if msg_res.data else session.get("messages", [])
        
        return {
            "session": session,
            "messages": messages
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
