import io
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Body, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from dependencies import limiter, AuthUser, get_optional_user, get_current_user
from services.entitlement_service import EntitlementService
from services.usage_service import UsageService
from agents.achievement_engine import (
    extract_achievements_from_pdf,
    extract_achievements_from_text,
    extract_achievements_from_other_pdf,
    generate_bullet_variants,
    generate_section_bullets,
    run_metric_reconstruction_turn,
    generate_resume_strategy,
    refine_bullet_with_ai,
    extract_final_resume_bullets,
    convert_resume_domain,
    canonicalize_role_name
)

router = APIRouter(prefix="/builder", tags=["resume_builder"])

# Models
class ExtractTextRequest(BaseModel):
    user_id: str
    text: str

class BulletToSave(BaseModel):
    achievement_id: Optional[str] = None
    target_role: str
    bullet_text: str
    variant_type: Optional[str] = "domain_pivot"
    generation_group_id: Optional[str] = None
    parent_experience: Optional[str] = None
    section_type: Optional[str] = None

class SaveBulletsBatchRequest(BaseModel):
    user_id: str
    bullets: List[BulletToSave]

class ConvertDomainRequest(BaseModel):
    user_id: str
    source_role: str
    target_role: str
    target_company: Optional[str] = ""
    sections_to_convert: Optional[List[str]] = None
    raw_sections: Optional[List[Dict[str, Any]]] = None


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
    custom_instructions: Optional[str] = None

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
    custom_instructions: Optional[str] = None

class EditBulletRequest(BaseModel):
    bullet_text: str

class MetricChatRequest(BaseModel):
    achievement_id: str
    messages: List[Dict[str, str]]
    user_id: Optional[str] = None

class RefineBulletRequest(BaseModel):
    bullet_text: str
    instruction: str
    target_role: str
    preserve_length: Optional[bool] = False
    target_char_length: Optional[int] = None
    user_id: Optional[str] = None

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
        from dependencies import safe_execute
        
        # Fetch existing vault context, ignoring final_resume dummy containers
        existing_res = safe_execute(
            lambda s: s.table('achievements').select("id, section_type, parent_experience, title, original_description").eq('user_id', user_id).neq('source_type', 'final_resume')
        )
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
            res = safe_execute(lambda s: s.table('achievements').insert(db_records_to_insert))
            if res.data:
                for r in res.data: r['_is_merged'] = False
                inserted_data.extend(res.data)
            
        for merge_id, record in updates:
            res = safe_execute(lambda s: s.table('achievements').update(record).eq('id', merge_id))
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
        from dependencies import safe_execute
        
        # Fetch existing vault context, ignoring final_resume dummy containers
        existing_res = safe_execute(
            lambda s: s.table('achievements').select("id, section_type, parent_experience, title, original_description").eq('user_id', body.user_id).neq('source_type', 'final_resume')
        )
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
            res = safe_execute(lambda s: s.table('achievements').insert(db_records_to_insert))
            if res.data:
                for r in res.data: r['_is_merged'] = False
                inserted_data.extend(res.data)
            
        for merge_id, record in updates:
            res = safe_execute(lambda s: s.table('achievements').update(record).eq('id', merge_id))
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
    from dependencies import safe_execute
    try:
        res = safe_execute(
            lambda s: s.table('achievements').select("*").eq('user_id', user_id).neq('source_type', 'final_resume').order('created_at', desc=True)
        )
        return res.data or []
    except Exception as e:
        print(f"[Achievements] Error fetching: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/achievements/{achievement_id}")
def update_achievement(achievement_id: str, body: EditAchievementRequest):
    from dependencies import safe_execute
    try:
        res = safe_execute(
            lambda s: s.table('achievements').update({
                "title": body.title,
                "original_description": body.original_description,
                "section_type": body.section_type,
                "parent_experience": body.parent_experience,
                "timeline": body.timeline
            }).eq('id', achievement_id)
        )
        
        if res.data:
            return {"achievement": res.data[0]}
        raise HTTPException(status_code=404, detail="Achievement not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/achievements")
def add_achievement(req: ManualAchievementRequest):
    from dependencies import safe_execute
    try:
        res = safe_execute(
            lambda s: s.table('achievements').insert({
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
            })
        )
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/achievements/{ach_id}")
def edit_achievement(ach_id: str, req: EditAchievementRequest):
    from dependencies import safe_execute
    try:
        update_data = {k: v for k, v in req.dict(exclude_unset=True).items() if v is not None}
        if not update_data:
            return {"status": "no changes"}
        res = safe_execute(
            lambda s: s.table('achievements').update(update_data).eq('id', ach_id)
        )
        return res.data[0] if res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/achievements/{ach_id}")
def delete_achievement(ach_id: str):
    from dependencies import safe_execute
    try:
        # Also delete generated bullets linked to this
        safe_execute(lambda s: s.table('generated_bullets').delete().eq('achievement_id', ach_id))
        safe_execute(lambda s: s.table('achievements').delete().eq('id', ach_id))
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generate and Save
@router.post("/generate")
@limiter.limit("10/minute")
async def generate_bullets(
    request: Request,
    req: GenerateBulletsRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (req.user_id if req.user_id and req.user_id != "guest" else None)
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

    from dependencies import get_supabase; supabase = get_supabase()
    try:
        # Fetch achievement
        ach_res = supabase.table('achievements').select("*").eq('id', req.achievement_id).execute()
        if not ach_res.data:
            raise HTTPException(status_code=404, detail="Achievement not found")
            
        achievement = ach_res.data[0]
        
        # Generate
        gen_result = generate_bullet_variants(
            supabase, 
            achievement, 
            req.target_role, 
            target_company=req.target_company or "",
            benchmark_text=req.benchmark_text or "",
            existing_bullets=req.existing_bullets or [],
            custom_instructions=req.custom_instructions or ""
        )
        
        if isinstance(gen_result, dict):
            variants = gen_result.get("variants", [])
            coaching_tips = gen_result.get("coaching_tips", [])
        else:
            variants = gen_result
            coaching_tips = []
        
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
            # Reattach recruiter_notes and coaching_tips for the frontend
            for i in range(len(res.data)):
                res.data[i]['recruiter_notes'] = variants[i].get("recruiter_notes", "")
                res.data[i]['coaching_tips'] = coaching_tips
            return {
                "bullets": res.data,
                "coaching_tips": coaching_tips
            }
        return {"bullets": [], "coaching_tips": []}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_bullets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-section")
@limiter.limit("10/minute")
async def generate_section_bullets_api(
    request: Request,
    req: GenerateSectionRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (req.user_id if req.user_id and req.user_id != "guest" else None)
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

    from dependencies import get_supabase; supabase = get_supabase()
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
            benchmark_text=req.benchmark_text or "",
            custom_instructions=req.custom_instructions or ""
        )
        
        return variants_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_section_bullets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/point-bank")
def get_point_bank(user_id: str):
    from dependencies import safe_execute
    try:
        # Only return saved bullets with full achievement metadata including section_type
        res = safe_execute(
            lambda s: s.table('generated_bullets').select("*, achievements(id, title, parent_experience, section_type, timeline, original_description)").eq('user_id', user_id).eq('is_saved', True).order('created_at', desc=True)
        )
        return res.data or []
    except Exception as e:
        print(f"[PointBank] Error fetching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-bullet")
def save_bullet(req: SaveBulletRequest):
    from dependencies import safe_execute
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
            
        res = safe_execute(
            lambda s: s.table('generated_bullets').insert(insert_data)
        )
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/point-bank/{bullet_id}")
def delete_saved_bullet(bullet_id: str):
    from dependencies import safe_execute
    try:
        safe_execute(lambda s: s.table('generated_bullets').delete().eq('id', bullet_id))
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/point-bank/{bullet_id}")
def edit_saved_bullet(bullet_id: str, req: EditBulletRequest):
    from dependencies import safe_execute
    try:
        res = safe_execute(
            lambda s: s.table('generated_bullets').update({
                "bullet_text": req.bullet_text
            }).eq('id', bullet_id)
        )
        return res.data[0] if res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/metric-chat")
def metric_chat(
    req: MetricChatRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (req.user_id if req.user_id and req.user_id != "guest" else None)
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="bullet_refine",
                units=1
            )

    from dependencies import get_supabase; supabase = get_supabase()
    try:
        ach_res = supabase.table('achievements').select("*").eq('id', req.achievement_id).execute()
        if not ach_res.data:
            raise HTTPException(status_code=404, detail="Achievement not found")
        
        result = run_metric_reconstruction_turn(ach_res.data[0], req.messages)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in metric_chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refine-bullet")
def refine_bullet(
    req: RefineBulletRequest,
    auth_user: Optional[AuthUser] = Depends(get_optional_user)
):
    effective_user_id = auth_user.id if auth_user else (req.user_id if req.user_id and req.user_id != "guest" else None)
    if effective_user_id:
        entitlement = EntitlementService.get_active_entitlement(user_id=effective_user_id, user_email=auth_user.email if auth_user else None)
        plan_key = entitlement.get("plan_key", "free")
        if not (auth_user and auth_user.is_admin) and plan_key != "admin":
            UsageService.consume_quota(
                user_id=effective_user_id,
                plan_key=plan_key,
                feature_key="bullet_refine",
                units=1
            )

    try:
        result = refine_bullet_with_ai(
            req.bullet_text,
            req.instruction,
            req.target_role,
            preserve_length=req.preserve_length or False,
            target_char_length=req.target_char_length
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in refine_bullet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract/final-resume")
@limiter.limit("5/minute")
async def extract_final_resume(
    request: Request,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    user_id: str = Form(...),
    target_role: str = Form("consulting")
):
    from dependencies import get_supabase; supabase = get_supabase()
    try:
        pdf_bytes = None
        if file:
            pdf_bytes = await file.read()
            
        extracted = extract_final_resume_bullets(pdf_bytes=pdf_bytes, raw_text=raw_text)
        if not extracted:
            raise HTTPException(status_code=400, detail="Could not extract points from the provided resume.")
            
        inserted_bullets = []
        for sec in extracted:
            section_type = sec.get("section_type", "Professional Experience")
            parent_experience = sec.get("parent_experience", "General Experience")
            timeline = sec.get("timeline")
            overview_line = sec.get("overview_line", "")
            bullets = sec.get("bullets", [])
            
            # Check if an achievement for this parent_experience exists, else create one
            ach_res = supabase.table('achievements').select("id, section_type").eq('user_id', user_id).eq('parent_experience', parent_experience).execute()
            if ach_res.data:
                ach_id = ach_res.data[0]["id"]
                # If existing achievement has empty or generic section_type, update it with the extracted section_type
                if not ach_res.data[0].get("section_type") or ach_res.data[0].get("section_type") == "General":
                    supabase.table('achievements').update({"section_type": section_type}).eq('id', ach_id).execute()
            else:
                ach_create = supabase.table('achievements').insert({
                    "user_id": user_id,
                    "section_type": section_type,
                    "title": parent_experience,
                    "parent_experience": parent_experience,
                    "timeline": timeline,
                    "original_description": overview_line or (bullets[0] if bullets else parent_experience),
                    "source_type": "final_resume",
                    "status": "approved"
                }).execute()
                ach_id = ach_create.data[0]["id"] if ach_create.data else None

                
            if not ach_id:
                continue
                
            # Insert bullets into generated_bullets as finalized_resume points
            bullet_records = []
            for b_text in bullets:
                b_clean = b_text.strip()
                if b_clean.startswith("•") or b_clean.startswith("-") or b_clean.startswith("*"):
                    b_clean = b_clean[1:].strip()
                if b_clean.endswith("."):
                    b_clean = b_clean[:-1]
                if not b_clean:
                    continue
                    
                bullet_records.append({
                    "achievement_id": ach_id,
                    "user_id": user_id,
                    "target_role": target_role,
                    "bullet_text": b_clean,
                    "variant_type": "finalized_resume",
                    "is_saved": True
                })
                
            if bullet_records:
                res = supabase.table('generated_bullets').insert(bullet_records).execute()
                if res.data:
                    inserted_bullets.extend(res.data)
                    
        return {
            "status": "success",
            "extracted_sections": len(extracted),
            "saved_bullets_count": len(inserted_bullets),
            "bullets": inserted_bullets
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in extract_final_resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategy")
@limiter.limit("5/minute")
async def get_strategy(request: Request, req: StrategyRequest):
    from dependencies import get_supabase; supabase = get_supabase()
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
        import traceback
        traceback.print_exc()
        print(f"Error in get_strategy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-domain")
@limiter.limit("5/minute")
async def convert_domain_endpoint(request: Request, req: ConvertDomainRequest):
    from dependencies import get_supabase; supabase = get_supabase()
    try:
        res = convert_resume_domain(
            supabase_client=supabase,
            user_id=req.user_id,
            source_role=req.source_role,
            target_role=req.target_role,
            sections_to_convert=req.sections_to_convert,
            target_company=req.target_company or "",
            raw_sections=req.raw_sections
        )
        return res
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in convert_domain_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-bullets-batch")
@limiter.limit("10/minute")
async def save_bullets_batch(request: Request, req: SaveBulletsBatchRequest):
    from dependencies import safe_execute
    try:
        records_to_insert = []
        for b in req.bullets:
            ach_id = b.achievement_id
            
            # If achievement_id is missing, check or create a container
            if not ach_id and b.parent_experience:
                ach_check = safe_execute(lambda s: s.table('achievements').select("id").eq('user_id', req.user_id).eq('parent_experience', b.parent_experience))
                if ach_check.data:
                    ach_id = ach_check.data[0]["id"]
                else:
                    new_ach = safe_execute(lambda s: s.table('achievements').insert({
                        "user_id": req.user_id,
                        "section_type": b.section_type or "Professional Experience",
                        "title": b.parent_experience,
                        "parent_experience": b.parent_experience,
                        "original_description": b.bullet_text,
                        "source_type": "domain_pivot",
                        "status": "approved"
                    }))
                    ach_id = new_ach.data[0]["id"] if new_ach.data else None

            if not ach_id:
                fallback_ach = safe_execute(lambda s: s.table('achievements').select("id").eq('user_id', req.user_id).limit(1))
                ach_id = fallback_ach.data[0]["id"] if fallback_ach.data else None

            if ach_id:
                records_to_insert.append({
                    "achievement_id": ach_id,
                    "user_id": req.user_id,
                    "target_role": b.target_role,
                    "bullet_text": b.bullet_text,
                    "variant_type": b.variant_type or "domain_pivot",
                    "is_saved": True,
                    "generation_group_id": b.generation_group_id
                })

        if not records_to_insert:
            return {"status": "success", "count": 0, "saved_bullets": []}

        res = safe_execute(lambda s: s.table('generated_bullets').insert(records_to_insert))
        return {
            "status": "success",
            "count": len(res.data) if res.data else 0,
            "saved_bullets": res.data or []
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in save_bullets_batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

