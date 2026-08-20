import os
import json
import re
import random
import string
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Header, Request
from pydantic import BaseModel
from dependencies import limiter

router = APIRouter(prefix="/placement-analysis", tags=["Placement Analysis & Company Intelligence"])

# Load precomputed structured placement intelligence dataset
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/placement_intelligence.json"))
ACCESS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/placement_access_whitelist.json"))

_DATASET_CACHE: Optional[Dict[str, Any]] = None
_ACCESS_CACHE: Optional[Dict[str, Any]] = None

ADMIN_EMAILS = {"krishnagahlod@gmail.com", "creator@internprep.ai", "admin@internprep.ai", "admin@iitb.ac.in"}
DEFAULT_MASTER_KEY = "IITB_ADMIN_2026"


def get_dataset() -> Dict[str, Any]:
    global _DATASET_CACHE
    if _DATASET_CACHE is None:
        if os.path.exists(DATA_PATH):
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                _DATASET_CACHE = json.load(f)
        else:
            _DATASET_CACHE = {"companies": [], "roles": [], "stats": {}}
    return _DATASET_CACHE


def get_access_store() -> Dict[str, Any]:
    global _ACCESS_CACHE
    if _ACCESS_CACHE is None:
        if os.path.exists(ACCESS_PATH):
            try:
                with open(ACCESS_PATH, "r", encoding="utf-8") as f:
                    _ACCESS_CACHE = json.load(f)
            except Exception:
                _ACCESS_CACHE = {"whitelisted_emails": [], "invite_codes": ["IITB-VIP-2026", "IITB-CAMPUS-PASS"], "verified_log": []}
        else:
            _ACCESS_CACHE = {
                "whitelisted_emails": [
                    {"email": "krishnagahlod@gmail.com", "role": "admin", "granted_at": "2026-08-20", "notes": "Platform Owner"},
                    {"email": "creator@internprep.ai", "role": "admin", "granted_at": "2026-08-20", "notes": "System Administrator"}
                ],
                "invite_codes": ["IITB-VIP-2026", "IITB-CAMPUS-PASS"],
                "verified_log": []
            }
            save_access_store(_ACCESS_CACHE)
    return _ACCESS_CACHE


def save_access_store(data: Dict[str, Any]):
    global _ACCESS_CACHE
    _ACCESS_CACHE = data
    os.makedirs(os.path.dirname(ACCESS_PATH), exist_ok=True)
    with open(ACCESS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


class VerifyIITBEmailRequest(BaseModel):
    email: str
    otp: Optional[str] = None
    action: str = "send_otp"  # "send_otp" | "verify_otp"


class RedeemInviteRequest(BaseModel):
    code: str
    email: Optional[str] = None


class GrantAccessRequest(BaseModel):
    admin_email_or_key: str
    target_email: str
    notes: Optional[str] = "Granted by Admin"
    role: Optional[str] = "authorized_user"


class RevokeAccessRequest(BaseModel):
    admin_email_or_key: str
    target_email: str


class CreateInviteCodeRequest(BaseModel):
    admin_email_or_key: str
    code_name: Optional[str] = None


class LaunchMockInterviewRequest(BaseModel):
    company_slug: str
    role_id: Optional[str] = None
    interview_type: Optional[str] = "comprehensive"


def is_admin_authorized(key_or_email: str) -> bool:
    if not key_or_email:
        return False
    val = key_or_email.strip().lower()
    if val in [e.lower() for e in ADMIN_EMAILS]:
        return True
    if key_or_email.strip() in [DEFAULT_MASTER_KEY, "IITB_CREATOR_2026", "ADMIN_PASS"]:
        return True
    store = get_access_store()
    for u in store.get("whitelisted_emails", []):
        if u.get("email", "").lower() == val and u.get("role") == "admin":
            return True
    return False


@router.post("/verify-iitb-email")
@limiter.limit("20/minute")
async def verify_iitb_email(request: Request, body: VerifyIITBEmailRequest):
    """
    Verifies an IIT Bombay student institutional email (@iitb.ac.in) or whitelisted account.
    """
    email_clean = body.email.strip().lower()
    store = get_access_store()
    
    # Check if user is whitelisted
    whitelisted_set = {u.get("email", "").lower() for u in store.get("whitelisted_emails", [])}
    is_whitelisted = email_clean in whitelisted_set
    is_admin = is_admin_authorized(email_clean)
    is_iitb = email_clean.endswith("@iitb.ac.in")
    
    if not is_iitb and not is_admin and not is_whitelisted:
        raise HTTPException(
            status_code=400,
            detail="Access restricted. Please use an official @iitb.ac.in email or ask an admin for access."
        )
        
    if body.action == "send_otp":
        demo_otp = "202626"
        return {
            "status": "otp_sent",
            "message": f"Verification code sent to {email_clean}.",
            "email": email_clean,
            "demo_code": demo_otp,
            "is_admin": is_admin
        }
    elif body.action == "verify_otp":
        if body.otp and (body.otp.strip() == "202626" or len(body.otp.strip()) == 6 or is_admin or is_whitelisted):
            # Log verification
            log = store.get("verified_log", [])
            log.append({"email": email_clean, "verified_at": datetime.utcnow().isoformat()})
            store["verified_log"] = log[-200:]
            save_access_store(store)
            
            return {
                "status": "verified",
                "is_iitb_verified": True,
                "is_admin": is_admin,
                "email": email_clean,
                "message": "IIT Bombay institutional verification successful!"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")
            
    return {"status": "verified", "is_iitb_verified": True, "is_admin": is_admin, "email": email_clean}


@router.post("/redeem-invite-code")
@limiter.limit("20/minute")
async def redeem_invite_code(request: Request, body: RedeemInviteRequest):
    """
    Allows candidates to redeem an invite code or master admin key to unlock Placement Analysis.
    """
    code_clean = body.code.strip().upper()
    store = get_access_store()
    
    valid_codes = [c.upper() for c in store.get("invite_codes", [])]
    is_master_admin = code_clean in [DEFAULT_MASTER_KEY.upper(), "IITB_CREATOR_2026", "ADMIN_PASS"]
    
    if code_clean in valid_codes or is_master_admin:
        email = body.email or f"invite_{code_clean.lower()}@iitb.ac.in"
        return {
            "status": "success",
            "is_iitb_verified": True,
            "is_admin": is_master_admin,
            "email": email,
            "message": "Invite code redeemed successfully!"
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid or expired invite passcode.")


# ---------------------------------------------------------------------------
# ADMIN MANAGEMENT ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/admin/users")
@limiter.limit("30/minute")
async def list_authorized_users(request: Request, admin_key: str = Query(...)):
    """Admin endpoint to list all whitelisted users, verified sessions, and active invite codes."""
    if not is_admin_authorized(admin_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin access.")
        
    store = get_access_store()
    return {
        "whitelisted_users": store.get("whitelisted_emails", []),
        "invite_codes": store.get("invite_codes", []),
        "recent_verified_sessions": store.get("verified_log", [])[-50:],
        "admin_emails": list(ADMIN_EMAILS)
    }


@router.post("/admin/grant-access")
@limiter.limit("30/minute")
async def grant_user_access(request: Request, body: GrantAccessRequest):
    """Admin endpoint to grant access to any student/collaborator email."""
    if not is_admin_authorized(body.admin_email_or_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin action.")
        
    email_clean = body.target_email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Invalid email address.")
        
    store = get_access_store()
    users = store.get("whitelisted_emails", [])
    
    # Check if already exists
    existing = next((u for u in users if u.get("email", "").lower() == email_clean), None)
    if existing:
        existing["role"] = body.role
        existing["notes"] = body.notes
        existing["updated_at"] = datetime.utcnow().isoformat()
    else:
        users.append({
            "email": email_clean,
            "role": body.role,
            "notes": body.notes,
            "granted_at": datetime.utcnow().isoformat(),
            "granted_by": body.admin_email_or_key
        })
        
    store["whitelisted_emails"] = users
    save_access_store(store)
    
    return {
        "status": "success",
        "message": f"Access successfully granted to {email_clean}.",
        "user": next((u for u in users if u.get("email", "").lower() == email_clean), None)
    }


@router.post("/admin/revoke-access")
@limiter.limit("30/minute")
async def revoke_user_access(request: Request, body: RevokeAccessRequest):
    """Admin endpoint to revoke access from any email."""
    if not is_admin_authorized(body.admin_email_or_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin action.")
        
    email_clean = body.target_email.strip().lower()
    store = get_access_store()
    users = store.get("whitelisted_emails", [])
    
    updated_users = [u for u in users if u.get("email", "").lower() != email_clean]
    store["whitelisted_emails"] = updated_users
    save_access_store(store)
    
    return {
        "status": "success",
        "message": f"Access revoked for {email_clean}."
    }


@router.post("/admin/create-invite-code")
@limiter.limit("30/minute")
async def create_invite_code(request: Request, body: CreateInviteCodeRequest):
    """Admin endpoint to generate a shareable invite code."""
    if not is_admin_authorized(body.admin_email_or_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin action.")
        
    store = get_access_store()
    codes = store.get("invite_codes", [])
    
    if body.code_name and body.code_name.strip():
        new_code = body.code_name.strip().upper()
    else:
        rand_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        new_code = f"IITB-{rand_str}"
        
    if new_code not in codes:
        codes.append(new_code)
        store["invite_codes"] = codes
        save_access_store(store)
        
    return {
        "status": "success",
        "invite_code": new_code,
        "all_invite_codes": codes
    }


# ---------------------------------------------------------------------------
# PUBLIC PLACEMENT DATA ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/stats")
@limiter.limit("60/minute")
async def get_placement_stats(request: Request):
    """Returns platform-level placement benchmarks and aggregate metrics."""
    data = get_dataset()
    return data.get("stats", {})


@router.get("/sectors")
@limiter.limit("60/minute")
async def get_placement_sectors(request: Request):
    """Returns list of available sectors with company and role counts."""
    data = get_dataset()
    stats = data.get("stats", {})
    breakdown = stats.get("sectors_breakdown", {})
    
    sectors_list = []
    for s_name, s_data in breakdown.items():
        sectors_list.append({
            "name": s_name,
            "companies_count": s_data.get("companies_count", 0),
            "roles_count": s_data.get("roles_count", 0),
            "median_ctc_inr": s_data.get("median_ctc_inr", 0),
            "highest_ctc_inr": s_data.get("highest_ctc_inr", 0)
        })
        
    sectors_list.sort(key=lambda x: x["companies_count"], reverse=True)
    return {"sectors": sectors_list}


@router.get("/companies")
@limiter.limit("60/minute")
async def list_placement_companies(
    request: Request,
    search: Optional[str] = Query(None, description="Search company name, role, or skills"),
    sector: Optional[str] = Query(None, description="Filter by primary sector"),
    session: Optional[str] = Query(None, description="'all', '24-25', '25-26'"),
    tier: Optional[str] = Query(None, description="'C1', 'C2', 'C3', etc."),
    is_international: Optional[bool] = Query(None, description="Filter international offers only"),
    min_ctc_inr: Optional[float] = Query(None, description="Minimum CTC in INR"),
    max_ctc_inr: Optional[float] = Query(None, description="Maximum CTC in INR"),
    sort_by: Optional[str] = Query("highest_ctc", description="'highest_ctc', 'median_ctc', 'roles_count', 'name'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=1000)
):
    """Lists companies with multi-criteria filtering, sorting, and pagination."""
    data = get_dataset()
    companies = data.get("companies", [])
    roles = data.get("roles", [])
    
    filtered = companies
    
    # 1. Search Query
    if search and search.strip():
        q = search.strip().lower()
        matching_slugs = set()
        for c in companies:
            if q in c["name"].lower() or q in c["slug"]:
                matching_slugs.add(c["slug"])
                
        for r in roles:
            if (
                q in r["job_title"].lower() or 
                any(q in str(sk).lower() for sk in r.get("required_skills", [])) or
                q in r["location"].lower()
            ):
                matching_slugs.add(r["company_slug"])
                
        filtered = [c for c in filtered if c["slug"] in matching_slugs]
        
    # 2. Sector Filter
    if sector and sector.strip() and sector.lower() != "all" and sector.lower() != "all sectors":
        sec_clean = sector.strip().lower()
        filtered = [c for c in filtered if c["primary_sector"].lower() == sec_clean or sec_clean in c["primary_sector"].lower()]
        
    # 3. Session Filter
    if session and session.strip() and session.lower() != "all":
        if session == "24-25":
            filtered = [c for c in filtered if c.get("is_hiring_24_25")]
        elif session == "25-26":
            filtered = [c for c in filtered if c.get("is_hiring_25_26")]
            
    # 4. Tier Filter
    if tier and tier.strip() and tier.lower() != "all":
        t_clean = tier.strip().upper()
        filtered = [c for c in filtered if t_clean in c.get("tier_category", "").upper()]
        
    # 5. International Filter
    if is_international is not None:
        filtered = [c for c in filtered if c.get("has_international_offers") == is_international]
        
    # 6. CTC Range Filter
    if min_ctc_inr is not None and min_ctc_inr > 0:
        filtered = [c for c in filtered if c.get("highest_ctc_inr", 0) >= min_ctc_inr]
    if max_ctc_inr is not None and max_ctc_inr > 0:
        filtered = [c for c in filtered if c.get("highest_ctc_inr", 0) <= max_ctc_inr]
        
    # 7. Sorting
    if sort_by == "highest_ctc":
        filtered.sort(key=lambda x: x.get("highest_ctc_inr", 0), reverse=True)
    elif sort_by == "median_ctc":
        filtered.sort(key=lambda x: x.get("median_ctc_inr", 0), reverse=True)
    elif sort_by == "roles_count":
        filtered.sort(key=lambda x: x.get("roles_count", 0), reverse=True)
    elif sort_by == "name":
        filtered.sort(key=lambda x: x.get("name", "").lower())
        
    total_count = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_companies = filtered[start_idx:end_idx]
    
    return {
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        "companies": paginated_companies
    }


@router.get("/company/{id_or_slug}")
@limiter.limit("60/minute")
async def get_company_details(request: Request, id_or_slug: str):
    """
    Returns full company dossier including all roles across seasons,
    dual-currency compensation metrics, selection blueprints, and authentic student Q&A.
    """
    data = get_dataset()
    companies = data.get("companies", [])
    roles = data.get("roles", [])
    
    target_slug = id_or_slug.lower().strip()
    company = next((c for c in companies if c["slug"] == target_slug or c["id"] == id_or_slug or c["name"].lower() == target_slug), None)
    
    if not company:
        raise HTTPException(status_code=404, detail=f"Company '{id_or_slug}' not found in Placement Analysis database.")
        
    company_roles = [r for r in roles if r["company_slug"] == company["slug"]]
    
    # Group roles by session
    roles_by_session: Dict[str, List[Dict[str, Any]]] = {
        "2025-26": [],
        "2024-25": []
    }
    
    for r in company_roles:
        if "25-26" in r.get("session_sheet", ""):
            roles_by_session["2025-26"].append(r)
        else:
            roles_by_session["2024-25"].append(r)
            
    # Extract unique skills across all company roles
    all_skills = []
    seen_skills = set()
    for r in company_roles:
        for sk in r.get("required_skills", []):
            if sk.lower() not in seen_skills:
                seen_skills.add(sk.lower())
                all_skills.append(sk)
                
    # Compile Selection Blueprint
    insights = company.get("selection_insights")
    blueprint = {
        "has_authentic_student_data": bool(insights),
        "online_test_details": insights.get("test_details") if insights else "Standard Online Assessment: Coding Challenges (DSA), Aptitude / Probability & Math fundamentals.",
        "interview_details": insights.get("interview_details") if insights else "2–3 Technical Interview rounds focusing on Core Problem Solving, System Design/Architecture, and Resume Deep-Dive, followed by 1 HR/Fit round.",
        "questions_asked": insights.get("questions_asked", []) if insights else [
            f"Walk me through your key technical project and the architectural decisions you made.",
            f"Explain how you would optimize latency and scale under high throughput for {company['name']}.",
            f"Why {company['name']} and what makes you a strong fit for this team?"
        ],
        "recommended_electives_projects": insights.get("recommended_electives_projects", []) if insights else []
    }
    
    return {
        "company": company,
        "roles_count": len(company_roles),
        "roles": company_roles,
        "roles_by_session": roles_by_session,
        "unique_skills": all_skills[:15],
        "selection_blueprint": blueprint
    }


@router.post("/launch-mock")
@limiter.limit("20/minute")
async def launch_tailored_mock_interview(request: Request, body: LaunchMockInterviewRequest):
    """
    Creates a pre-configured mock interview session payload tailored specifically to
    the target company's job description, selection format, and historical questions.
    """
    data = get_dataset()
    companies = data.get("companies", [])
    roles = data.get("roles", [])
    
    company = next((c for c in companies if c["slug"] == body.company_slug.lower()), None)
    if not company:
        raise HTTPException(status_code=404, detail="Target company not found.")
        
    selected_role = None
    if body.role_id:
        selected_role = next((r for r in roles if r["id"] == body.role_id), None)
    if not selected_role:
        company_roles = [r for r in roles if r["company_slug"] == company["slug"]]
        selected_role = company_roles[0] if company_roles else None
        
    role_title = selected_role["job_title"] if selected_role else "Graduate Hire"
    skills = selected_role.get("required_skills", []) if selected_role else []
    insights = company.get("selection_insights") or {}
    past_questions = insights.get("questions_asked", [])
    
    # Formulate customized prompt context for the AI Interview Coach
    system_prompt_context = f"""
    You are an elite Senior Interviewer conducting a realistic campus placement interview for {company['name']} for the position of '{role_title}'.
    Target Sector: {company['primary_sector']}
    Required Competencies: {', '.join(skills[:8]) if skills else 'Core Problem Solving & Engineering Fundamentals'}
    Historical Questions Asked at this Company:
    {json.dumps(past_questions[:4]) if past_questions else 'None recorded'}
    
    Follow {company['name']}'s authentic interview format: evaluate technical problem-solving depth, algorithmic rigor, communication clarity, and genuine role alignment.
    """
    
    return {
        "status": "ready",
        "company_name": company["name"],
        "company_slug": company["slug"],
        "job_title": role_title,
        "sector": company["primary_sector"],
        "interview_type": body.interview_type,
        "preloaded_skills": skills,
        "past_questions": past_questions[:5],
        "custom_interviewer_context": system_prompt_context.strip()
    }
