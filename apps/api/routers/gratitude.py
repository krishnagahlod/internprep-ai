import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client

router = APIRouter(prefix="/gratitude", tags=["gratitude"])

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class GratitudeRequest(BaseModel):
    name: Optional[str] = "Anonymous"
    message: str
    user_id: Optional[str] = None

class GratitudeResponse(BaseModel):
    id: str
    name: Optional[str] = None
    message: str
    created_at: str

@router.post("/", response_model=dict)
async def submit_gratitude(request: GratitudeRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        insert_data = {
            "name": request.name,
            "message": request.message
        }
        if request.user_id and request.user_id != "guest":
            insert_data["user_id"] = request.user_id
            
        res = supabase.table("gratitude_messages").insert(insert_data).execute()
        return {"status": "success", "message": "Gratitude saved successfully"}
    except Exception as e:
        print(f"Error saving gratitude: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[GratitudeResponse])
async def get_gratitudes():
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        res = supabase.table("gratitude_messages").select("id, name, message, created_at").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Error fetching gratitudes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
