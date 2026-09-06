from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
from agents.case_interviewer import generate_case_response, generate_case_response_stream, generate_hint, get_random_case, DEFAULT_FALLBACK_CASE
from agents.domain_interviewer import generate_domain_interview_response, generate_domain_interview_response_stream
from services.rag import retrieve_context
from supabase import create_client
from dependencies import limiter, posthog_client, AuthUser, get_optional_user
from services.entitlement_service import EntitlementService
from services.usage_service import UsageService

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
    user_id: Optional[str] = None
    target_phase: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    new_phase: str
    is_paywall_locked: Optional[bool] = False
    turn_count: Optional[int] = 0
    max_turns: Optional[int] = 20

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
@limiter.limit("10/hour")
async def start_case_endpoint(
    request: Request,
    body: StartCaseRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else None
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="mock_interview",
                units=1,
                request_id=request.headers.get("x-request-id")
            )

    try:
        random_case_dict = get_random_case(body.case_type)
        if not random_case_dict:
            random_case_dict = DEFAULT_FALLBACK_CASE
            
        solution_transcript = random_case_dict.get("solution_transcript", "")
        problem_statement = random_case_dict.get("problem_statement", "")
        case_source = random_case_dict.get("pdf_source", "")
        page_number = random_case_dict.get("page_number") or 1
        
        full_context = f"PROBLEM STATEMENT: {problem_statement}\n\nGOLD STANDARD SOLUTION:\n{solution_transcript}"
        initial_phase = "introduction"
        
        # Generate opening message
        try:
            bot_reply, next_phase = generate_case_response(
                history=[],
                current_phase=initial_phase,
                context=full_context,
                scratchpad=""
            )
        except Exception as gen_err:
            print(f"Non-fatal error generating opening case response: {gen_err}")
            title = random_case_dict.get("title", "Strategic Market Evaluation")
            bot_reply = (
                f"Welcome! Today we will be working through a case concerning **{title}**.\n\n"
                f"**Client Problem**: {problem_statement}\n\n"
                f"Whenever you're ready, feel free to ask any initial clarifying questions, or take a moment to structure your thoughts."
            )
            next_phase = initial_phase
        
        session_id = f"case_{uuid.uuid4().hex[:12]}"
        if supabase:
            try:
                insert_data = {
                    "id": session_id,
                    "interview_type": "case",
                    "status": "in_progress",
                    "case_state": {
                        "current_phase": next_phase,
                        "case_id": random_case_dict.get("id"),
                        "case_source": case_source,
                        "page_number": page_number,
                        "case_context": full_context
                    }
                }
                if effective_user_id and effective_user_id != "guest":
                    insert_data["user_id"] = effective_user_id
                    
                res = supabase.table("interview_sessions").insert(insert_data).execute()
                if res.data:
                    session_id = res.data[0]["id"]
                    supabase.table("session_messages").insert({
                        "session_id": session_id,
                        "role": "assistant",
                        "content": bot_reply,
                        "phase": initial_phase
                    }).execute()
            except Exception as db_err:
                print(f"Non-fatal database error inserting case session: {db_err}")
        
        if posthog_client and effective_user_id:
            try:
                posthog_client.capture(
                    distinct_id=effective_user_id, 
                    event='interview_started', 
                    properties={
                        'interview_type': 'case',
                        'case_source': case_source,
                        'session_id': session_id,
                    }
                )
            except Exception:
                pass
            
        return StartCaseResponse(
            session_id=session_id,
            case_context=full_context,
            case_source=case_source,
            page_number=page_number,
            initial_message=bot_reply,
            initial_phase=next_phase
        )
    except HTTPException:
        raise
    except Exception as e:
        from services.security_logger import safe_log_error
        safe_log_error("Error starting case interview", exc=e)
        raise HTTPException(status_code=500, detail="Failed to start case interview session.")

@router.post("/start_domain", response_model=StartDomainResponse)
@limiter.limit("10/hour")
async def start_domain_endpoint(
    request: Request,
    body: StartDomainRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else None
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="mock_interview",
                units=1,
                request_id=request.headers.get("x-request-id")
            )
    try:
        resume_context = "No resume attached. Use standard candidate profile."
        file_url = ""
        if body.resume_id and supabase:
            try:
                res = supabase.table("resumes").select("user_id, parsed_text, file_url").eq("id", body.resume_id).execute()
                if res.data:
                    resume_owner = res.data[0].get("user_id")
                    if (
                        resume_owner
                        and resume_owner != "guest"
                        and auth_user
                        and auth_user.id != resume_owner
                        and not auth_user.is_admin
                    ):
                        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to attach this resume.")
                    resume_context = res.data[0].get("parsed_text", "") or "Resume attached."
                    file_url = res.data[0].get("file_url", "")
            except HTTPException:
                raise
            except Exception as resume_err:
                print(f"Non-fatal error retrieving resume {body.resume_id}: {resume_err}")
                
        initial_phase = "introduction"
        try:
            bot_reply, next_phase = generate_domain_interview_response(
                history=[],
                current_phase=initial_phase,
                resume_context=resume_context,
                domain=body.domain,
                company=body.company
            )
        except Exception as gen_err:
            print(f"Non-fatal error generating domain interview response: {gen_err}")
            company_str = f" at {body.company}" if body.company else ""
            bot_reply = (
                f"Welcome! I will be your interviewer today for the {body.domain} track{company_str}. "
                f"To start off, could you please give me a brief introduction of your background and walk me through what drew you to this role?"
            )
            next_phase = initial_phase
        
        session_id = f"domain_{uuid.uuid4().hex[:12]}"
        if supabase:
            try:
                insert_data = {
                    "id": session_id,
                    "interview_type": "domain",
                    "status": "in_progress",
                    "case_state": {
                        "current_phase": next_phase,
                        "domain": body.domain,
                        "company": body.company,
                        "resume_context": resume_context,
                        "case_source": file_url
                    }
                }
                if effective_user_id and effective_user_id != "guest":
                    insert_data["user_id"] = effective_user_id
                    
                res = supabase.table("interview_sessions").insert(insert_data).execute()
                if res.data:
                    session_id = res.data[0]["id"]
                    supabase.table("session_messages").insert({
                        "session_id": session_id,
                        "role": "assistant",
                        "content": bot_reply,
                        "phase": initial_phase
                    }).execute()
            except Exception as db_err:
                print(f"Non-fatal database error saving domain session: {db_err}")
        
        if posthog_client and effective_user_id:
            try:
                posthog_client.capture(
                    distinct_id=effective_user_id, 
                    event='interview_started', 
                    properties={
                        'interview_type': 'domain',
                        'domain': body.domain,
                        'company': body.company,
                        'session_id': session_id,
                    }
                )
            except Exception:
                pass
            
        return StartDomainResponse(
            session_id=session_id,
            initial_message=bot_reply,
            initial_phase=next_phase,
            domain=body.domain,
            company=body.company,
            resume_context=resume_context
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting domain interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("60/hour")
async def chat_endpoint(
    request: Request,
    body: ChatRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    try:
        history = [{"role": m.role, "content": m.content} for m in body.messages]
        user_turns = sum(1 for m in history if m.get("role") == "user")
        effective_user_id = auth_user.id if auth_user else (body.user_id if body.user_id and body.user_id != "guest" else None)
        
        # Determine user tier
        is_paid = False
        if auth_user:
            if auth_user.is_admin or auth_user.is_iitb:
                is_paid = True
            else:
                ent = EntitlementService.get_active_entitlement(user_id=auth_user.id, user_email=auth_user.email)
                pk = ent.get("plan_key", "free")
                if pk.startswith("pro") or pk in ["lifetime", "admin"] or ent.get("is_admin") or ent.get("is_iitb"):
                    is_paid = True
                else:
                    # Check topup credits
                    mock_credits = UsageService.get_topup_balance(auth_user.id, "mock_interview")
                    if mock_credits > 0:
                        is_paid = True
        elif effective_user_id:
            ent = EntitlementService.get_active_entitlement(user_id=effective_user_id)
            pk = ent.get("plan_key", "free")
            if pk.startswith("pro") or pk in ["lifetime", "admin"] or ent.get("is_admin") or ent.get("is_iitb"):
                is_paid = True
            else:
                mock_credits = UsageService.get_topup_balance(effective_user_id, "mock_interview")
                if mock_credits > 0:
                    is_paid = True

        # 1. Free tier teaser cutoff at 4 questions - NO in-character interviewer paywall chat text!
        if not is_paid and user_turns >= 4:
            return ChatResponse(
                response="",
                new_phase="trial_limit_reached",
                is_paywall_locked=True,
                turn_count=user_turns,
                max_turns=4
            )

        # 2. Paid user cap at 18-20 turns with graceful wrap-up
        if user_turns >= 19:
            wrapup_reply = (
                "👏 **Excellent analysis!** We have thoroughly covered the case framework, quantitative estimation, and risk synthesis over our session.\n\n"
                "We have reached the conclusion of this interview. Please click **'End & Generate Scorecard'** below to receive your comprehensive rubric evaluation and recruiter feedback!"
            )
            return ChatResponse(
                response=wrapup_reply,
                new_phase="conclusion",
                is_paywall_locked=False,
                turn_count=user_turns,
                max_turns=20
            )

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
                company=body.company,
                target_phase=body.target_phase
            )
        else:
            bot_reply, new_phase = generate_case_response(
                history=history,
                current_phase=body.current_phase,
                context=combined_context,
                scratchpad=body.scratchpad,
                target_phase=body.target_phase
            )
        
        if supabase and body.session_id != "temp_session_id":
            # Verify session ownership to prevent IDOR message injection
            if auth_user:
                sess_check = supabase.table("interview_sessions").select("user_id").eq("id", body.session_id).execute()
                if sess_check.data and sess_check.data[0].get("user_id"):
                    session_owner = sess_check.data[0].get("user_id")
                    if session_owner != auth_user.id and not auth_user.is_admin:
                        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to modify this interview session.")

            # Save user message
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
                sess = supabase.table("interview_sessions").select("case_state").eq("id", body.session_id).execute()
                if sess.data:
                    case_state = sess.data[0].get("case_state", {})
                    case_state["current_phase"] = new_phase
                    supabase.table("interview_sessions").update({
                        "case_state": case_state,
                        "scratchpad_content": body.scratchpad
                    }).eq("id", body.session_id).execute()
        
        return ChatResponse(
            response=bot_reply,
            new_phase=new_phase,
            is_paywall_locked=False,
            turn_count=user_turns,
            max_turns=20 if is_paid else 4
        )
    except HTTPException:
        raise
    except Exception as e:
        from services.security_logger import safe_log_error
        safe_log_error(f"Error in chat endpoint for session {body.session_id}", exc=e)
        raise HTTPException(status_code=500, detail="Failed to process interview message.")

@router.post("/chat/stream")
@limiter.limit("60/hour")
async def chat_stream_endpoint(
    request: Request,
    body: ChatRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """
    Streams AI Interviewer response chunks in real-time via Server-Sent Events (SSE).
    """
    history = [{"role": m.role, "content": m.content} for m in body.messages]
    user_turns = sum(1 for m in history if m.get("role") == "user")
    effective_user_id = auth_user.id if auth_user else (body.user_id if body.user_id and body.user_id != "guest" else None)

    # Determine user tier
    is_paid = False
    if auth_user:
        if auth_user.is_admin or auth_user.is_iitb:
            is_paid = True
        else:
            ent = EntitlementService.get_active_entitlement(user_id=auth_user.id, user_email=auth_user.email)
            pk = ent.get("plan_key", "free")
            if pk.startswith("pro") or pk in ["lifetime", "admin"] or ent.get("is_admin") or ent.get("is_iitb"):
                is_paid = True
            else:
                mock_credits = UsageService.get_topup_balance(auth_user.id, "mock_interview")
                if mock_credits > 0:
                    is_paid = True
    elif effective_user_id:
        ent = EntitlementService.get_active_entitlement(user_id=effective_user_id)
        pk = ent.get("plan_key", "free")
        if pk.startswith("pro") or pk in ["lifetime", "admin"] or ent.get("is_admin") or ent.get("is_iitb"):
            is_paid = True
        else:
            mock_credits = UsageService.get_topup_balance(effective_user_id, "mock_interview")
            if mock_credits > 0:
                is_paid = True

    # 1. Free tier teaser cutoff at 4 questions
    if not is_paid and user_turns >= 4:
        async def paywall_generator():
            yield f"event: paywall\ndata: {json.dumps({'is_paywall_locked': True, 'new_phase': 'trial_limit_reached', 'turn_count': user_turns, 'max_turns': 4})}\n\n"
        return StreamingResponse(paywall_generator(), media_type="text/event-stream")

    # 2. Paid user cap at 19 turns
    if user_turns >= 19:
        wrapup_reply = (
            "👏 **Excellent analysis!** We have thoroughly covered the case framework, quantitative estimation, and risk synthesis over our session.\n\n"
            "We have reached the conclusion of this interview. Please click **'End & Generate Scorecard'** below to receive your comprehensive rubric evaluation and recruiter feedback!"
        )
        async def wrapup_generator():
            yield f"event: phase\ndata: {json.dumps({'phase': 'conclusion'})}\n\n"
            yield f"event: token\ndata: {json.dumps({'token': wrapup_reply})}\n\n"
            yield f"event: done\ndata: {json.dumps({'response': wrapup_reply, 'new_phase': 'conclusion', 'turn_count': user_turns, 'max_turns': 20})}\n\n"
        return StreamingResponse(wrapup_generator(), media_type="text/event-stream")

    # Check context & build stream
    dynamic_context = ""
    latest_user_msg = history[-1]["content"] if history and history[-1]["role"] == "user" else ""
    if body.case_source and latest_user_msg:
        dynamic_context = retrieve_context(latest_user_msg, source=body.case_source, top_k=2)

    combined_context = body.case_context or ""
    if dynamic_context:
        combined_context += "\n\nRELEVANT CASEBOOK EXCERPTS FOR CURRENT QUESTION:\n" + dynamic_context

    if body.interview_type == "domain":
        stream_gen, new_phase = generate_domain_interview_response_stream(
            history=history,
            current_phase=body.current_phase,
            resume_context=body.resume_context or "No resume provided.",
            domain=body.domain or "General",
            company=body.company,
            target_phase=body.target_phase
        )
    else:
        stream_gen, new_phase = generate_case_response_stream(
            history=history,
            current_phase=body.current_phase,
            context=combined_context,
            scratchpad=body.scratchpad,
            target_phase=body.target_phase
        )

    async def sse_event_stream():
        try:
            yield f"event: phase\ndata: {json.dumps({'phase': new_phase})}\n\n"
            full_text_chunks = []

            for chunk in stream_gen:
                full_text_chunks.append(chunk)
                yield f"event: token\ndata: {json.dumps({'token': chunk})}\n\n"

            full_reply = "".join(full_text_chunks)

            # Persist session messages
            if supabase and body.session_id != "temp_session_id":
                if latest_user_msg:
                    supabase.table("session_messages").insert({
                        "session_id": body.session_id,
                        "role": "user",
                        "content": latest_user_msg,
                        "phase": body.current_phase
                    }).execute()
                supabase.table("session_messages").insert({
                    "session_id": body.session_id,
                    "role": "assistant",
                    "content": full_reply,
                    "phase": new_phase
                }).execute()

                if new_phase != body.current_phase:
                    sess = supabase.table("interview_sessions").select("case_state").eq("id", body.session_id).execute()
                    if sess.data:
                        case_state = sess.data[0].get("case_state", {})
                        case_state["current_phase"] = new_phase
                        supabase.table("interview_sessions").update({
                            "case_state": case_state,
                            "scratchpad_content": body.scratchpad
                        }).eq("id", body.session_id).execute()

            yield f"event: done\ndata: {json.dumps({'response': full_reply, 'new_phase': new_phase, 'turn_count': user_turns, 'max_turns': 20 if is_paid else 4})}\n\n"
        except Exception as e:
            from services.security_logger import safe_log_error
            safe_log_error("Error during interview SSE streaming", exc=e)
            yield f"event: error\ndata: {json.dumps({'error': 'Streaming interrupted'})}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/hint", response_model=HintResponse)
@limiter.limit("30/minute")
async def hint_endpoint(request: Request, body: ChatRequest):
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
            
        hint_reply = generate_hint(history=history, context=combined_context)
        return HintResponse(hint=hint_reply)
    except HTTPException:
        raise
    except Exception as e:
        from services.security_logger import safe_log_error
        safe_log_error("Error generating hint", exc=e)
        raise HTTPException(status_code=500, detail="Failed to generate hint.")

@router.post("/end_session")
@limiter.limit("20/hour")
async def end_session_endpoint(
    request: Request,
    body: EndSessionRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Marks session as complete with ownership verification."""
    try:
        if supabase and body.session_id != "temp_session_id":
            # Verify session ownership to prevent IDOR tampering
            sess_res = supabase.table("interview_sessions").select("user_id").eq("id", body.session_id).execute()
            if sess_res.data and sess_res.data[0].get("user_id"):
                owner_id = sess_res.data[0].get("user_id")
                if owner_id and (not auth_user or (auth_user.id != owner_id and not auth_user.is_admin)):
                    raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to close this session.")

            import datetime
            supabase.table("interview_sessions").update({
                "status": "completed",
                "completed_at": datetime.datetime.utcnow().isoformat()
            }).eq("id", body.session_id).execute()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        from services.security_logger import safe_log_error
        safe_log_error(f"Error ending session {body.session_id}", exc=e)
        raise HTTPException(status_code=500, detail="Failed to complete session.")

@router.get("/session/{session_id}")
@limiter.limit("30/hour")
async def get_session_endpoint(
    request: Request,
    session_id: str,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Retrieves session transcript with strict ownership verification to prevent IDOR leaks."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection unavailable")
    try:
        res = supabase.table("interview_sessions").select("*").eq("id", session_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = res.data[0]
        
        # Verify ownership
        owner_id = session.get("user_id")
        if owner_id and owner_id != "guest" and (not auth_user or (auth_user.id != owner_id and not auth_user.is_admin)):
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this session.")

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
        from services.security_logger import safe_log_error
        safe_log_error(f"Error fetching session {session_id}", exc=e)
        raise HTTPException(status_code=500, detail="Failed to fetch interview session.")


# ---------------------------------------------------------
# ACCENTURE MANAGEMENT CONSULTING SIMULATION ENDPOINTS
# ---------------------------------------------------------

class AccentureStartRequest(BaseModel):
    practice_mode: str = "full_simulation"
    resume_context: Optional[str] = None
    user_id: Optional[str] = None

class AccentureChatStreamRequest(BaseModel):
    session_id: str
    messages: List[Dict[str, str]]
    current_phase: str = "introduction"
    target_phase: Optional[str] = None
    practice_mode: str = "full_simulation"
    time_elapsed_secs: int = 0
    resume_context: Optional[str] = None

class AccentureEvaluateRequest(BaseModel):
    session_id: str
    messages: List[Dict[str, str]]
    resume_context: Optional[str] = None


@router.post("/accenture/start")
@limiter.limit("20/minute")
async def start_accenture_session(
    request: Request,
    body: AccentureStartRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Initializes an Accenture Strategy & Consulting mock session with dynamic mode calibration."""
    try:
        import uuid
        from agents.accenture_interviewer import build_accenture_system_prompt, PHASE_MAP
        from services.cerebras_client import cerebras_client

        session_id = f"acc_{uuid.uuid4().hex[:12]}"
        practice_mode = body.practice_mode or "full_simulation"
        active_phases = PHASE_MAP.get(practice_mode, PHASE_MAP["full_simulation"])
        initial_phase = active_phases[0]

        sys_prompt = build_accenture_system_prompt(
            session_id=session_id,
            practice_mode=practice_mode,
            current_phase=initial_phase,
            time_elapsed_secs=0,
            resume_context=body.resume_context
        )

        initial_greeting = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Start the interview for an IIT Bombay candidate preparing for the {practice_mode} mode. Greet them professionally as an Accenture Manager and ask the opening question."}
            ],
            temperature=0.4,
            max_tokens=200
        )

        return {
            "session_id": session_id,
            "practice_mode": practice_mode,
            "initial_phase": initial_phase,
            "initial_message": initial_greeting.strip(),
            "phases": active_phases
        }
    except Exception as e:
        import uuid
        from services.security_logger import safe_log_error
        safe_log_error("Error starting Accenture session", exc=e)
        return {
            "session_id": f"acc_{uuid.uuid4().hex[:12]}",
            "practice_mode": body.practice_mode or "full_simulation",
            "initial_phase": "introduction",
            "initial_message": "Good morning. I'm a Manager here at Accenture Strategy & Consulting. Walk me through your resume, highlighting the inflection points that shaped your interest in management consulting.",
            "phases": ["introduction", "resume_deep_dive", "consulting_case", "ai_genai_strategy", "behavioral_fit", "closing"]
        }


@router.post("/accenture/chat/stream")
@limiter.limit("45/minute")
async def stream_accenture_chat(
    request: Request,
    body: AccentureChatStreamRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Streams live token responses from the stateful Accenture Manager interviewer."""
    from agents.accenture_interviewer import build_accenture_system_prompt, PHASE_MAP
    from services.cerebras_client import cerebras_client

    active_phases = PHASE_MAP.get(body.practice_mode, PHASE_MAP["full_simulation"])
    
    is_jump = False
    if body.target_phase and body.target_phase in active_phases:
        next_phase = body.target_phase
        is_jump = True
    else:
        next_phase = body.current_phase if body.current_phase in active_phases else active_phases[0]

    candidate_last_msg = body.messages[-1].get("content", "") if body.messages else ""

    transition_instruction = None
    if is_jump:
        transition_instruction = f"The candidate has requested to jump ahead directly to the {next_phase.upper()} section. Seamlessly acknowledge this pivot in one concise professional clause, maintain all previous conversation context, and immediately pose your opening question for {next_phase.upper()}."

    sys_prompt = build_accenture_system_prompt(
        session_id=body.session_id,
        practice_mode=body.practice_mode,
        current_phase=next_phase,
        time_elapsed_secs=body.time_elapsed_secs,
        resume_context=body.resume_context,
        candidate_last_message=candidate_last_msg,
        transition_instruction=transition_instruction
    )

    llm_messages = [{"role": "system", "content": sys_prompt}]
    for m in body.messages:
        llm_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'phase', 'phase': next_phase})}\n\n"
            for token in cerebras_client.stream_chat_completion(llm_messages, temperature=0.3, max_tokens=350):
                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'session_id': body.session_id, 'new_phase': next_phase})}\n\n"
        except Exception as err:
            yield f"data: {json.dumps({'type': 'error', 'message': str(err)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/accenture/evaluate")
@limiter.limit("15/minute")
async def evaluate_accenture_session(
    request: Request,
    body: AccentureEvaluateRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Evaluates full interview transcript against the 6-dimension Accenture scorecard."""
    try:
        from agents.accenture_evaluator import evaluate_accenture_interview
        report = evaluate_accenture_interview(
            session_id=body.session_id,
            messages=body.messages,
            resume_context=body.resume_context
        )
        return {"status": "success", "feedback": report}
    except Exception as e:
        from services.security_logger import safe_log_error
        safe_log_error("Error evaluating Accenture session", exc=e)
        raise HTTPException(status_code=500, detail="Failed to evaluate Accenture interview.")


@router.get("/accenture/knowledge")
async def get_accenture_knowledge():
    """Returns summarized stats and patterns from the Accenture Knowledge Base."""
    from services.accenture_kb_service import get_accenture_kb
    kb = get_accenture_kb()
    return {
        "metadata": kb.get("metadata", {}),
        "taxonomy": kb.get("taxonomy", []),
        "sample_counts": {k: len(v) for k, v in kb.get("question_bank_by_category", {}).items()}
    }

