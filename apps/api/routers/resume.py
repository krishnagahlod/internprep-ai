import io
import json
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from dependencies import limiter, posthog_client, AuthUser, get_current_user, get_optional_user, require_feature_access
from services.entitlement_service import EntitlementService
from services.usage_service import UsageService
from agents.resume_analyzer import analyze_resume_text, run_workshop_turn, parse_resume_structural

def extract_pdf_raw_text(pdf_bytes: bytes) -> str:
    """Safely extracts raw text from PDF bytes using PyMuPDF (fitz) or pypdf."""
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "\n".join([page.get_text() for page in doc]).strip()
        if text:
            return text
    except Exception as e:
        print(f"fitz extraction failed: {e}")
        
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join([page.extract_text() or "" for page in reader.pages]).strip()
        if text:
            return text
    except Exception as e2:
        print(f"pypdf extraction failed: {e2}")
        
    return ""

router = APIRouter(prefix="/resume", tags=["resume"])

class AnalysisResponse(BaseModel):
    raw_text: str
    analysis: Dict[str, Any]

class WorkshopMessage(BaseModel):
    role: str
    content: str

class WorkshopRequest(BaseModel):
    original_bullet: str
    section_type: str
    target_role: Optional[str] = "consult"
    resume_phase: Optional[str] = "placement"
    messages: List[WorkshopMessage]
    overall_context: Optional[str] = None
    user_id: Optional[str] = None

class WorkshopResponse(BaseModel):
    response: str
    is_final_bullet: bool
    final_bullet: Optional[str] = None

class SectionAnalysisRequest(BaseModel):
    text: str
    target_role: Optional[str] = "consult"
    resume_phase: Optional[str] = "placement"
    section_type: Optional[str] = "experience"
    user_id: Optional[str] = None

class UploadResponse(BaseModel):
    id: str
    file_name: str
    raw_text: str
    file_url: str

@router.post("/upload", response_model=UploadResponse)
@limiter.limit("10/hour")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    if not (file.filename.lower().endswith(".pdf") or file.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")

    from agents.resume_analyzer import supabase
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        pdf_bytes = await file.read()
        file_name = file.filename
        
        # 1. Upload to Storage
        import uuid
        file_path = f"{user_id}/{uuid.uuid4()}_{file_name}"
        
        # We need to read it again for upload or just use bytes
        res = supabase.storage.from_("resume_pdfs").upload(
            file_path,
            pdf_bytes,
            {"content-type": "application/pdf"}
        )
        file_url = supabase.storage.from_("resume_pdfs").get_public_url(file_path)
        if file_url.endswith("?"):
            file_url = file_url[:-1]
        
        # 2. Extract Structural text using Gemini
        parsed_content = await asyncio.wait_for(
            asyncio.to_thread(parse_resume_structural, pdf_bytes),
            timeout=120.0
        )
        
        # 3. Extract raw text for fallback or basic analytics
        raw_text = extract_pdf_raw_text(pdf_bytes)
        
        db_user_id = None if user_id == "guest" else user_id
        
        # 4. Save to database
        db_res = supabase.table("resumes").insert({
            "user_id": db_user_id,
            "file_name": file_name,
            "raw_text": raw_text,
            "file_url": file_url,
            "parsed_content": parsed_content
        }).execute()
        
        resume_id = db_res.data[0]["id"]
        
        if posthog_client and user_id:
            posthog_client.capture(
                distinct_id=user_id,
                event='resume_uploaded',
                properties={
                    'resume_id': resume_id,
                    'file_size': file_size
                }
            )
        
        return UploadResponse(
            id=resume_id,
            file_name=file_name,
            message="Resume uploaded and parsed successfully"
        )
        
    except asyncio.TimeoutError:
        raise HTTPException(status_code=503, detail="Resume parsing timed out.")
    except Exception as e:
        print(f"Error uploading resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=AnalysisResponse)
@limiter.limit("3/hour")
async def analyze_resume(
    request: Request,
    file: UploadFile = File(...),
    target_role: str = Form("consult"),
    resume_phase: str = Form("placement"),
    user_id: Optional[str] = Form(None),
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    # Resolve user identity
    effective_user_id = auth_user.id if auth_user else (user_id if user_id and user_id != "guest" else None)
    user_email = auth_user.email if auth_user else None

    # Strict PDF Validation
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")

    # Quota evaluation for authenticated deep analysis
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=user_email)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="resume_analysis",
                units=1,
                request_id=request.headers.get("x-request-id")
            )
        
    try:
        pdf_bytes = await file.read()
        text = extract_pdf_raw_text(pdf_bytes)
        
        if not text.strip():
            print("PDF text extraction found no text. Falling back to Gemini structural parsing.")
            text = await asyncio.to_thread(parse_resume_structural, pdf_bytes)
            if not text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from the PDF even with AI fallback.")

            
        # Check Cache for authenticated users
        from agents.resume_analyzer import supabase
        if supabase and effective_user_id:
            try:
                cached_res = supabase.table("resume_analyses") \
                    .select("analysis_data") \
                    .eq("user_id", effective_user_id) \
                    .eq("target_role", target_role) \
                    .eq("resume_text", text) \
                    .order("created_at", desc=True) \
                    .execute()
                if cached_res.data:
                    cached_analysis = cached_res.data[0]["analysis_data"]
                    if cached_analysis and cached_analysis.get("bullets"):
                        print("Cache hit! Returning cached analysis.")
                        return AnalysisResponse(raw_text=text, analysis=cached_analysis)
                    else:
                        print("Found incomplete cache entry. Bypassing cache.")
            except Exception as e:
                print(f"Error checking resume cache: {e}")

        # Run analyzer with timeout wrapper
        analysis_json_str = await asyncio.wait_for(
            asyncio.to_thread(analyze_resume_text, text, target_role, resume_phase, pdf_bytes),
            timeout=300.0
        )
        
        analysis_dict = json.loads(analysis_json_str)
        
        # Save to database if user is authenticated and analysis is complete
        if supabase and effective_user_id and analysis_dict.get("bullets"):
            try:
                supabase.table("resume_analyses").insert({
                    "user_id": effective_user_id,
                    "resume_text": text,
                    "target_role": target_role,
                    "analysis_data": analysis_dict
                }).execute()
            except Exception as e:
                print(f"Error saving resume analysis to Supabase: {e}")
        
        return AnalysisResponse(
            raw_text=text,
            analysis=analysis_dict
        )
    
    except asyncio.TimeoutError:
        raise HTTPException(status_code=503, detail="Analysis timed out. The resume might be too long or the AI engine is overloaded. Please try again.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse the AI engine's response into structural data.")
    except Exception as e:
        if "Connection" in str(e) or "supabase" in str(e).lower():
            raise HTTPException(status_code=503, detail="Database connection error while retrieving structural benchmarks.")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@router.post("/workshop", response_model=WorkshopResponse)
@limiter.limit("20/hour")
async def resume_workshop(
    request: Request,
    body: WorkshopRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (body.user_id if body.user_id and body.user_id != "guest" else None)
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="bullet_refine",
                units=1,
                request_id=request.headers.get("x-request-id")
            )

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                run_workshop_turn,
                body.original_bullet,
                body.section_type,
                body.target_role,
                body.resume_phase,
                [{"role": m.role, "content": m.content} for m in body.messages],
                body.overall_context
            ),
            timeout=90.0
        )
        return WorkshopResponse(**result)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Workshop engine timed out. Please try your response again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workshop error: {str(e)}")

class AnalyzeSectionRequest(BaseModel):
    text: str
    target_role: str = "consult"
    resume_phase: str = "placement"
    section_type: str = "experience"
    user_id: Optional[str] = None

@router.post("/analyze-section")
@limiter.limit("10/hour")
async def analyze_resume_section(
    request: Request,
    body: AnalyzeSectionRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (body.user_id if body.user_id and body.user_id != "guest" else None)
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="resume_analysis",
                units=1,
                request_id=request.headers.get("x-request-id")
            )

    try:
        from agents.resume_analyzer import analyze_resume_section_text
        
        if not body.text or not body.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
            
        analysis_json_str = await asyncio.wait_for(
            asyncio.to_thread(
                analyze_resume_section_text, 
                body.text, 
                body.target_role, 
                body.resume_phase, 
                body.section_type
            ),
            timeout=180.0
        )
        
        analysis_dict = json.loads(analysis_json_str)
        
        return {
            "raw_text": body.text,
            "analysis": analysis_dict,
            "is_section_only": True
        }
    except asyncio.TimeoutError:
        raise HTTPException(status_code=503, detail="Analysis timed out. Please try again.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse the AI engine's response into structural data.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing section: {str(e)}")


class ATSCheckRequest(BaseModel):
    raw_text: Optional[str] = None
    target_role: Optional[str] = "consulting"
    mode: Optional[str] = "iitb_placement"
    job_description: Optional[str] = None
    resume_id: Optional[str] = None


class ATSFixBulletRequest(BaseModel):
    bullet_text: str
    fix_type: str = "trim_line_wrap"
    target_role: Optional[str] = "consulting"
    mode: Optional[str] = "iitb_placement"
    missing_keyword: Optional[str] = None
    target_length: Optional[int] = None
    user_id: Optional[str] = None


@router.post("/ats-check")
@limiter.limit("20/hour")
async def ats_check(
    request: Request,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    target_role: str = Form("consulting"),
    sub_track: Optional[str] = Form(None),
    mode: str = Form("iitb_placement"),
    job_description: Optional[str] = Form(None),
    resume_id: Optional[str] = Form(None)
):
    try:
        from agents.ats_engine import compute_full_ats_report
        from dependencies import get_supabase
        supabase = get_supabase()
        
        pdf_bytes = None
        if file:
            pdf_bytes = await file.read()
            
        if not raw_text and not pdf_bytes and resume_id and supabase:
            res = supabase.table("resumes").select("raw_text, parsed_content").eq("id", resume_id).execute()
            if res.data:
                raw_text = res.data[0].get("raw_text", "")
                
        if not raw_text and not pdf_bytes:
            raise HTTPException(status_code=400, detail="Please upload a resume PDF file to perform visual layout, font geometry, and placement ATS evaluation.")
            
        report = await asyncio.to_thread(
            compute_full_ats_report,
            pdf_bytes=pdf_bytes,
            raw_text=raw_text,
            target_role=target_role,
            mode=mode,
            job_description=job_description,
            sub_track=sub_track
        )
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in ats_check: {e}")
        raise HTTPException(status_code=500, detail=f"Error computing ATS report: {str(e)}")


@router.post("/ats-fix-bullet")
@limiter.limit("30/hour")
async def ats_fix_bullet_endpoint(
    request: Request,
    body: ATSFixBulletRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (body.user_id if body.user_id and body.user_id != "guest" else None)
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="bullet_refine",
                units=1,
                request_id=request.headers.get("x-request-id")
            )

    try:
        from agents.ats_engine import refine_ats_bullet
        result = await asyncio.to_thread(
            refine_ats_bullet,
            bullet_text=body.bullet_text,
            fix_type=body.fix_type,
            target_role=body.target_role or "consulting",
            mode=body.mode or "iitb_placement",
            missing_keyword=body.missing_keyword,
            target_length=body.target_length
        )
        return result
    except Exception as e:
        print(f"Error in ats_fix_bullet: {e}")
        raise HTTPException(status_code=500, detail=f"Error refining bullet: {str(e)}")

