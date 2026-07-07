import io
import json
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pdfminer.high_level import extract_text
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from agents.resume_analyzer import analyze_resume_text, run_workshop_turn

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

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form("consulting")
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        pdf_bytes = await file.read()
        text = extract_text(io.BytesIO(pdf_bytes))
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF")
            
        # Run analyzer with timeout wrapper
        analysis_json_str = await asyncio.wait_for(
            asyncio.to_thread(analyze_resume_text, text, target_role),
            timeout=180.0
        )
        
        analysis_dict = json.loads(analysis_json_str)
        
        return AnalysisResponse(
            raw_text=text,
            analysis=analysis_dict
        )
    
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Analysis timed out. The resume might be too long or the AI engine is overloaded. Please try again.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse the AI engine's response into structural data.")
    except Exception as e:
        if "Connection" in str(e) or "supabase" in str(e).lower():
            raise HTTPException(status_code=503, detail="Database connection error while retrieving structural benchmarks.")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@router.post("/workshop", response_model=WorkshopResponse)
async def resume_workshop(request: WorkshopRequest):
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                run_workshop_turn,
                request.original_bullet,
                request.section_type,
                request.target_role,
                [{"role": m.role, "content": m.content} for m in request.messages],
                request.overall_context
            ),
            timeout=90.0
        )
        return WorkshopResponse(**result)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Workshop engine timed out. Please try your response again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workshop error: {str(e)}")
