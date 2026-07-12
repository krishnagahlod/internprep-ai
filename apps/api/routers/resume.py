import io
import json
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
from pdfminer.high_level import extract_text
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from dependencies import limiter
from agents.resume_analyzer import analyze_resume_text, run_workshop_turn, parse_resume_structural

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
    target_role: Optional[str] = "consulting"
    messages: List[WorkshopMessage]
    overall_context: Optional[str] = None

class WorkshopResponse(BaseModel):
    response: str
    is_final_bullet: bool
    final_bullet: Optional[str] = None

class UploadResponse(BaseModel):
    id: str
    file_name: str
    message: str

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
        
        # 2. Extract Structural text using Gemini
        parsed_content = await asyncio.wait_for(
            asyncio.to_thread(parse_resume_structural, pdf_bytes),
            timeout=120.0
        )
        
        # 3. Extract raw text for fallback or basic analytics
        raw_text = extract_text(io.BytesIO(pdf_bytes))
        
        # 4. Save to database
        db_res = supabase.table("resumes").insert({
            "user_id": user_id,
            "file_name": file_name,
            "raw_text": raw_text,
            "file_url": file_url,
            "parsed_content": parsed_content
        }).execute()
        
        resume_id = db_res.data[0]["id"]
        
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
    target_role: str = Form("consulting"),
    user_id: Optional[str] = Form(None)
):
    # Strict PDF Validation
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")
        
    try:
        pdf_bytes = await file.read()
        text = extract_text(io.BytesIO(pdf_bytes))
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF")
            
        # Check Cache for authenticated users
        from agents.resume_analyzer import supabase
        if supabase and user_id:
            try:
                cached_res = supabase.table("resume_analyses") \
                    .select("analysis_data") \
                    .eq("user_id", user_id) \
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
            asyncio.to_thread(analyze_resume_text, text, target_role, pdf_bytes),
            timeout=300.0
        )
        
        analysis_dict = json.loads(analysis_json_str)
        
        # Save to database if user is authenticated and analysis is complete
        if supabase and user_id and analysis_dict.get("bullets"):
            try:
                # We do an upsert or just insert, but since we bypassed a bad cache, let's just insert for now 
                # (or ideally update if it existed, but insert is fine since we select the first one).
                supabase.table("resume_analyses").insert({
                    "user_id": user_id,
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
async def resume_workshop(request: Request, body: WorkshopRequest):
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                run_workshop_turn,
                body.original_bullet,
                body.section_type,
                body.target_role,
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
