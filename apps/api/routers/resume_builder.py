import io
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Body
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from dependencies import limiter
from agents.achievement_engine import (
    extract_achievements_from_pdf,
    extract_achievements_from_text,
    extract_achievements_from_other_pdf,
    generate_bullet_variants,
    generate_section_bullets,
    run_metric_reconstruction_turn,
    generate_resume_strategy,
    refine_bullet_with_ai
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
    title: str
    original_description: str
    section_type: str
    parent_experience: str
    timeline: Optional[str] = None

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
    generation_group_id: Optional[str] = None

class GenerateSectionRequest(BaseModel):
    user_id: str
    achievement_ids: List[str]
    parent_experience: str
    target_role: str
    num_points: int
    target_company: Optional[str] = None
    benchmark_text: Optional[str] = None

class EditBulletRequest(BaseModel):
    bullet_text: str

class MetricChatRequest(BaseModel):
    achievement_id: str
    messages: List[Dict[str, str]]

class RefineBulletRequest(BaseModel):
    bullet_text: str
    instruction: str
    target_role: str

class StrategyRequest(BaseModel):
    user_id: str
    target_role: str
    data_source: str = "point_bank" # "point_bank", "vault", or "both"
    target_company: Optional[str] = None
    job_description: Optional[str] = None

# Extract endpoints
@router.post("/extract/pdf")
@limiter.limit("5/minute")
async def extract_from_pdf(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    document_type: str = Form("resume")
):
    if not (file.filename.lower().endswith(".pdf") or file.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        from agents.resume_analyzer import supabase
        
        # Fetch existing vault context
        existing_res = supabase.table('achievements').select("id, section_type, parent_experience, title, original_description").eq('user_id', user_id).execute()
        existing_vault = existing_res.data if existing_res else []
        
        pdf_bytes = await file.read()
        if document_type == "other":
            extracted = extract_achievements_from_other_pdf(pdf_bytes, existing_vault)
        else:
            extracted = extract_achievements_from_pdf(pdf_bytes, existing_vault)
        
        # Process and Save to Supabase
        db_records_to_insert = []
        updates = []
        
        for section in extracted:
            section_type = section.get("section_type", "Experience")
            parent_experience = section.get("parent_experience", "Unknown")
            for ach in section.get("achievements", []):
                merge_id = ach.get("merge_id")
                
                record = {
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
                }
                
                if merge_id:
                    # Update existing record
                    updates.append((merge_id, record))
                else:
                    db_records_to_insert.append(record)
            
        inserted_data = []
        if db_records_to_insert:
            res = supabase.table('achievements').insert(db_records_to_insert).execute()
            if res.data:
                for r in res.data: r['_is_merged'] = False
                inserted_data.extend(res.data)
            
        for merge_id, record in updates:
            res = supabase.table('achievements').update(record).eq('id', merge_id).execute()
            if res.data:
                for r in res.data: r['_is_merged'] = True
                inserted_data.extend(res.data)
                
        return {
            "achievements": inserted_data,
            "new_count": len(db_records_to_insert),
            "merged_count": len(updates)
        }
        
    except Exception as e:
        print(f"Error in extract_from_pdf: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract/text")
@limiter.limit("5/minute")
async def extract_from_text(request: Request, body: ExtractTextRequest):
    try:
        from agents.resume_analyzer import supabase
        
        # Fetch existing vault context
        existing_res = supabase.table('achievements').select("id, section_type, parent_experience, title, original_description").eq('user_id', body.user_id).execute()
        existing_vault = existing_res.data if existing_res else []
        
        extracted = extract_achievements_from_text(body.text, existing_vault)
        
        db_records_to_insert = []
        updates = []
        
        for section in extracted:
            section_type = section.get("section_type", "Experience")
            parent_experience = section.get("parent_experience", "Unknown")
            for ach in section.get("achievements", []):
                merge_id = ach.get("merge_id")
                
                record = {
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
                }
                
                if merge_id:
                    updates.append((merge_id, record))
                else:
                    db_records_to_insert.append(record)
            
        inserted_data = []
        if db_records_to_insert:
            res = supabase.table('achievements').insert(db_records_to_insert).execute()
            if res.data:
                for r in res.data: r['_is_merged'] = False
                inserted_data.extend(res.data)
            
        for merge_id, record in updates:
            res = supabase.table('achievements').update(record).eq('id', merge_id).execute()
            if res.data:
                for r in res.data: r['_is_merged'] = True
                inserted_data.extend(res.data)
                
        return {
            "achievements": inserted_data,
            "new_count": len(db_records_to_insert),
            "merged_count": len(updates)
        }
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

@router.put("/achievements/{achievement_id}")
def update_achievement(achievement_id: str, body: EditAchievementRequest):
    from agents.resume_analyzer import supabase
    try:
        res = supabase.table('achievements').update({
            "title": body.title,
            "original_description": body.original_description,
            "section_type": body.section_type,
            "parent_experience": body.parent_experience,
            "timeline": body.timeline
        }).eq('id', achievement_id).execute()
        
        if res.data:
            return {"achievement": res.data[0]}
        raise HTTPException(status_code=404, detail="Achievement not found")
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

@router.post("/generate-section")
@limiter.limit("10/minute")
async def generate_section_bullets_api(request: Request, req: GenerateSectionRequest):
    from agents.resume_analyzer import supabase
    try:
        if not req.achievement_ids:
            raise HTTPException(status_code=400, detail="No achievements provided")
            
        ach_res = supabase.table('achievements').select("*").in_('id', req.achievement_ids).execute()
        if not ach_res.data:
            raise HTTPException(status_code=404, detail="Achievements not found")
            
        from agents.achievement_engine import generate_section_bullets
        variants_data = generate_section_bullets(
            supabase, 
            ach_res.data, 
            req.target_role, 
            target_company=req.target_company or "",
            num_points=req.num_points,
            benchmark_text=req.benchmark_text or ""
        )
        
        return variants_data
    except Exception as e:
        print(f"Error in generate_section_bullets: {e}")
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
        insert_data = {
            "achievement_id": req.achievement_id,
            "user_id": req.user_id,
            "target_role": req.target_role,
            "bullet_text": req.bullet_text,
            "variant_type": req.variant_type,
            "is_saved": True
        }
        if req.generation_group_id:
            insert_data["generation_group_id"] = req.generation_group_id
            
        res = supabase.table('generated_bullets').insert(insert_data).execute()
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

@router.put("/point-bank/{bullet_id}")
def edit_saved_bullet(bullet_id: str, req: EditBulletRequest):
    from agents.resume_analyzer import supabase
    try:
        res = supabase.table('generated_bullets').update({
            "bullet_text": req.bullet_text
        }).eq('id', bullet_id).execute()
        return res.data[0] if res.data else None
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

@router.post("/refine-bullet")
def refine_bullet(req: RefineBulletRequest):
    try:
        result = refine_bullet_with_ai(req.bullet_text, req.instruction, req.target_role)
        return result
    except Exception as e:
        print(f"Error in refine_bullet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategy")
@limiter.limit("5/minute")
async def get_strategy(request: Request, req: StrategyRequest):
    from agents.resume_analyzer import supabase
    try:
        achievements = []
        bullets = []
        
        if req.data_source in ["vault", "both"]:
            ach_res = supabase.table('achievements').select("*").eq('user_id', req.user_id).execute()
            achievements = ach_res.data or []
            
        if req.data_source in ["point_bank", "both"]:
            bullets_res = supabase.table('generated_bullets').select("*").eq('user_id', req.user_id).eq('is_saved', True).eq('target_role', req.target_role).execute()
            bullets = bullets_res.data or []
            
        # RAG Step: Find similar golden bullets for the user's saved points
        # To avoid blocking/rate limits on embedding, we could do this async or skip if too many points, 
        # but for strategy report we will just embed the user's points and match.
        from services.gemini_client import gemini_client
        
        rag_context = []
        if bullets:
            # only embed top 5 to save time
            texts_to_embed = [b['bullet_text'] for b in bullets[:5]]
            try:
                embeddings = gemini_client.embed_batch(texts_to_embed)
                for i, emb in enumerate(embeddings):
                    # Query pgvector
                    match_res = supabase.rpc(
                        'match_golden_bullets',
                        {
                            'query_embedding': emb,
                            'match_count': 2,
                            'filter_target_role': req.target_role
                        }
                    ).execute()
                    
                    if match_res.data:
                        rag_context.append({
                            "user_bullet": texts_to_embed[i],
                            "similar_golden_bullets": [m['bullet_text'] for m in match_res.data]
                        })
            except Exception as e:
                print(f"Failed to fetch RAG context for strategy: {e}")
        
        strategy = generate_resume_strategy(
            req.data_source,
            achievements, 
            bullets, 
            req.target_role, 
            rag_context,
            req.target_company, 
            req.job_description
        )
        return strategy
    except Exception as e:
        print(f"Error in get_strategy: {e}")
        raise HTTPException(status_code=500, detail=str(e))
