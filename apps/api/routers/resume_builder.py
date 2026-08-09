import io
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Body
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from dependencies import limiter
from agents.achievement_engine import (
    extract_achievements_from_pdf,
    extract_achievements_from_text,
    generate_bullet_variants,
    run_metric_reconstruction_turn,
    generate_resume_strategy
)

router = APIRouter(prefix="/builder", tags=["resume_builder"])

# Models
class ExtractTextRequest(BaseModel):
    user_id: str
    text: str

class ManualAchievementRequest(BaseModel):
    user_id: str
    title: str
    parent_experience: str
    timeline: Optional[str] = None
    original_description: str
    user_notes: Optional[str] = None
    quantified_metrics: Optional[Dict[str, Any]] = None
    competency_tags: Optional[List[str]] = None

class EditAchievementRequest(BaseModel):
    title: Optional[str] = None
    parent_experience: Optional[str] = None
    timeline: Optional[str] = None
    original_description: Optional[str] = None
    user_notes: Optional[str] = None
    quantified_metrics: Optional[Dict[str, Any]] = None
    competency_tags: Optional[List[str]] = None
    status: Optional[str] = None

class GenerateBulletsRequest(BaseModel):
    user_id: str
    achievement_id: str
    target_role: str
    target_company: Optional[str] = None
    benchmark_text: Optional[str] = None
    existing_bullets: Optional[List[str]] = None

class SaveBulletRequest(BaseModel):
    user_id: str
    achievement_id: str
    target_role: str
    bullet_text: str
    variant_type: str
    recruiter_notes: Optional[str] = None

class MetricChatRequest(BaseModel):
    achievement_id: str
    messages: List[Dict[str, str]]

class StrategyRequest(BaseModel):
    user_id: str
    target_role: str

# Extract endpoints
@router.post("/extract/pdf")
@limiter.limit("5/minute")
async def extract_from_pdf(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    if not (file.filename.lower().endswith(".pdf") or file.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        pdf_bytes = await file.read()
        extracted = extract_achievements_from_pdf(pdf_bytes)
        
        # Save to Supabase
        from agents.resume_analyzer import supabase
        db_records = []
        for section in extracted:
            section_type = section.get("section_type", "Experience")
            parent_experience = section.get("parent_experience", "Unknown")
            for ach in section.get("achievements", []):
                db_records.append({
                    "user_id": user_id,
                    "section_type": section_type,
                    "title": ach.get("title", "Untitled"),
                    "parent_experience": parent_experience,
                    "timeline": ach.get("timeline") or section.get("timeline"),
                    "original_description": ach.get("original_description", ""),
                    "quantified_metrics": ach.get("quantified_metrics", {}),
                    "competency_tags": ach.get("competency_tags", []),
                    "extraction_confidence": ach.get("extraction_confidence", 1.0),
                    "source_type": "resume_upload",
                    "status": "pending"
                })
            
        if db_records:
            res = supabase.table('achievements').insert(db_records).execute()
            return {"achievements": res.data}
        return {"achievements": []}
        
    except Exception as e:
        print(f"Error in extract_from_pdf: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract/text")
@limiter.limit("5/minute")
async def extract_from_text(request: Request, body: ExtractTextRequest):
    try:
        extracted = extract_achievements_from_text(body.text)
        
        from agents.resume_analyzer import supabase
        db_records = []
        for section in extracted:
            section_type = section.get("section_type", "Experience")
            parent_experience = section.get("parent_experience", "Unknown")
            for ach in section.get("achievements", []):
                db_records.append({
                    "user_id": body.user_id,
                    "section_type": section_type,
                    "title": ach.get("title", "Untitled"),
                    "parent_experience": parent_experience,
                    "timeline": ach.get("timeline") or section.get("timeline"),
                    "original_description": ach.get("original_description", ""),
                    "quantified_metrics": ach.get("quantified_metrics", {}),
                    "competency_tags": ach.get("competency_tags", []),
                    "extraction_confidence": ach.get("extraction_confidence", 1.0),
                    "source_type": "text_paste",
                    "status": "pending"
                })
            
        if db_records:
            res = supabase.table('achievements').insert(db_records).execute()
            return {"achievements": res.data}
        return {"achievements": []}
    except Exception as e:
        print(f"Error in extract_from_text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CRUD endpoints
@router.get("/achievements")
def get_achievements(user_id: str):
    from agents.resume_analyzer import supabase
    try:
        res = supabase.table('achievements').select("*").eq('user_id', user_id).order('created_at', desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/achievements")
def add_achievement(req: ManualAchievementRequest):
    from agents.resume_analyzer import supabase
    try:
        res = supabase.table('achievements').insert({
            "user_id": req.user_id,
            "title": req.title,
            "parent_experience": req.parent_experience,
            "timeline": req.timeline,
            "original_description": req.original_description,
            "user_notes": req.user_notes,
            "quantified_metrics": req.quantified_metrics or {},
            "competency_tags": req.competency_tags or [],
            "source_type": "manual",
            "status": "accepted"
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/achievements/{ach_id}")
def edit_achievement(ach_id: str, req: EditAchievementRequest):
    from agents.resume_analyzer import supabase
    try:
        update_data = {k: v for k, v in req.dict(exclude_unset=True).items() if v is not None}
        if not update_data:
            return {"status": "no changes"}
        res = supabase.table('achievements').update(update_data).eq('id', ach_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/achievements/{ach_id}")
def delete_achievement(ach_id: str):
    from agents.resume_analyzer import supabase
    try:
        # Also delete generated bullets linked to this
        supabase.table('generated_bullets').delete().eq('achievement_id', ach_id).execute()
        supabase.table('achievements').delete().eq('id', ach_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generate and Save
@router.post("/generate")
@limiter.limit("10/minute")
async def generate_bullets(request: Request, req: GenerateBulletsRequest):
    from agents.resume_analyzer import supabase
    try:
        # Fetch achievement
        ach_res = supabase.table('achievements').select("*").eq('id', req.achievement_id).execute()
        if not ach_res.data:
            raise HTTPException(status_code=404, detail="Achievement not found")
            
        achievement = ach_res.data[0]
        
        # Generate
        variants = generate_bullet_variants(
            supabase, 
            achievement, 
            req.target_role, 
            target_company=req.target_company or "",
            benchmark_text=req.benchmark_text or "",
            existing_bullets=req.existing_bullets or []
        )
        
        # Save to generated_bullets table
        db_records = []
        for v in variants:
            db_records.append({
                "achievement_id": req.achievement_id,
                "user_id": req.user_id,
                "target_role": req.target_role,
                "bullet_text": v.get("bullet_text", ""),
                "variant_type": v.get("variant_type", "unknown"),
                "is_saved": False
            })
            
        if db_records:
            res = supabase.table('generated_bullets').insert(db_records).execute()
            # Reattach recruiter_notes for the frontend
            for i in range(len(res.data)):
                res.data[i]['recruiter_notes'] = variants[i].get("recruiter_notes", "")
            return res.data
        return []
    except Exception as e:
        print(f"Error in generate_bullets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/point-bank")
def get_point_bank(user_id: str):
    from agents.resume_analyzer import supabase
    try:
        # Only return saved bullets
        res = supabase.table('generated_bullets').select("*, achievements(title, parent_experience)").eq('user_id', user_id).eq('is_saved', True).order('created_at', desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-bullet")
def save_bullet(req: SaveBulletRequest):
    from agents.resume_analyzer import supabase
    try:
        res = supabase.table('generated_bullets').insert({
            "achievement_id": req.achievement_id,
            "user_id": req.user_id,
            "target_role": req.target_role,
            "bullet_text": req.bullet_text,
            "variant_type": req.variant_type,
            "recruiter_notes": req.recruiter_notes,
            "is_saved": True
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/point-bank/{bullet_id}")
def delete_saved_bullet(bullet_id: str):
    from agents.resume_analyzer import supabase
    try:
        supabase.table('generated_bullets').delete().eq('id', bullet_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/metric-chat")
def metric_chat(req: MetricChatRequest):
    from agents.resume_analyzer import supabase
    try:
        ach_res = supabase.table('achievements').select("*").eq('id', req.achievement_id).execute()
        if not ach_res.data:
            raise HTTPException(status_code=404, detail="Achievement not found")
        
        result = run_metric_reconstruction_turn(ach_res.data[0], req.messages)
        return result
    except Exception as e:
        print(f"Error in metric_chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategy")
@limiter.limit("5/minute")
async def get_strategy(request: Request, req: StrategyRequest):
    from agents.resume_analyzer import supabase
    try:
        # Fetch user's achievements
        ach_res = supabase.table('achievements').select("*").eq('user_id', req.user_id).execute()
        
        # Fetch user's saved bullets for this role
        bullets_res = supabase.table('generated_bullets').select("*").eq('user_id', req.user_id).eq('is_saved', True).eq('target_role', req.target_role).execute()
        
        strategy = generate_resume_strategy(ach_res.data or [], bullets_res.data or [], req.target_role)
        return strategy
    except Exception as e:
        print(f"Error in get_strategy: {e}")
        raise HTTPException(status_code=500, detail=str(e))
