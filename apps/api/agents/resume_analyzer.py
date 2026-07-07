import json
import os
import re
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai

# Configure Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load Best Practices Rules globally
RULES_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes/best_practices_rules.json"))
BEST_PRACTICES = []
if os.path.exists(RULES_PATH):
    try:
        with open(RULES_PATH, 'r') as f:
            BEST_PRACTICES = json.load(f).get("rules", [])
    except Exception as e:
        print(f"Failed to load best practices: {e}")

# Load Section-Specific Rules globally
SECTION_RULES_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes/section_rules.json"))
SECTION_RULES = {}
if os.path.exists(SECTION_RULES_PATH):
    try:
        with open(SECTION_RULES_PATH, 'r') as f:
            SECTION_RULES = json.load(f)
    except Exception as e:
        print(f"Failed to load section rules: {e}")

def clean_json(text: str) -> str:
    """Strips markdown code block formatting (```json ... ```) from Gemini responses."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

class BulletAnalysis(BaseModel):
    original_bullet: str
    section_type: str = Field(description="experience, project, por, scholastic, extracurricular")
    severity: str = Field(description="critical, major, minor, or good")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0")
    critique: str
    action_verb_rating: str = Field(description="weak, moderate, or strong")
    action_verb_alternatives: List[str]
    structural_issues: List[str]
    best_practice_violations: List[str]
    metrics_hint: Optional[str] = Field(description="If lacking metrics, suggest what specific metric they should find")
    golden_comparison: str
    suggested_rewrite: str
    predicted_questions: List[str]
    mapped_company_category: str

class SectionSummary(BaseModel):
    score: int
    summary: str
    bullet_count: int

class RadarScores(BaseModel):
    quantification: int
    action_verbs: int
    structure: int
    section_balance: int
    star_compliance: int
    formatting: int

class ResumeAnalysisResult(BaseModel):
    overall_feedback: str
    day1_comparison: str
    section_ordering_advice: str
    radar_scores: RadarScores
    section_summaries: Dict[str, SectionSummary]
    bullets: List[BulletAnalysis]

def extract_user_bullets(resume_text: str) -> List[Dict[str, str]]:
    """Extracts raw bullets from the user's resume for independent analysis."""
    prompt = f"""
    Extract every single achievement bullet point from the following resume text.
    Return ONLY a JSON list of objects containing 'bullet_text' and 'section_type'.
    Section type must be one of: experience, project, por, scholastic, extracurricular.
    
    CRITICAL: You MUST extract EVERY SINGLE bullet point from the entire resume (usually 20-40 points). Do not omit or skip any bullet.
    
    Resume Text:
    {resume_text}
    """
    try:
        config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
        res = gemini_client.generate_content(os.getenv("ANALYSIS_MODEL", "gemini-2.5-flash"), prompt, generation_config=config)
        data = json.loads(clean_json(res.text))
        if isinstance(data, list): return data
        if "bullets" in data: return data["bullets"]
        return []
    except Exception as e:
        print(f"Extraction error: {e}")
        return []

def classify_bullet_strengths(bullets: List[Dict[str, str]]) -> Dict[str, str]:
    """Fast pass to classify bullet strengths (weak vs strong) to guide RAG depth."""
    if not bullets: return {}
    
    bullets_json = json.dumps([{"id": i, "text": b.get("bullet_text", "")[:100]} for i, b in enumerate(bullets)])
    prompt = f"""
    Quickly classify if each bullet point is 'strong' (has numbers/metrics) or 'weak' (vague, no metrics).
    Return ONLY a JSON list of objects with 'id' and 'strength' ("strong" or "weak").
    
    Bullets:
    {bullets_json}
    """
    try:
        config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
        res = gemini_client.generate_content(os.getenv("ANALYSIS_MODEL", "gemini-2.5-flash"), prompt, generation_config=config)
        data = json.loads(clean_json(res.text))
        result = {}
        for item in data:
            result[str(item.get("id"))] = item.get("strength", "weak")
        return result
    except Exception as e:
        print(f"Classification error: {e}")
        return {str(i): "weak" for i in range(len(bullets))}

def analyze_resume_text(resume_text: str, target_role: str = "consulting") -> str:
    """
    Analyzes resume text using Two-Pass Adaptive RAG against Golden Resumes and Best Practices.
    """
    print("Extracting bullets from user resume...")
    user_bullets = extract_user_bullets(resume_text)
    
    # If bullet extraction fails or is empty, fallback to holistic analysis
    if not user_bullets:
        print("Fallback: No bullets extracted.")
        prompt = f"""
        Analyze this resume text. Follow standard best practices for Day 1 IIT Bombay consulting/finance resumes.
        Return ONLY valid JSON exactly matching the ResumeAnalysisResult schema.
        Resume: {resume_text}
        """
        config = genai.GenerationConfig(response_mime_type="application/json")
        response = gemini_client.generate_content(os.getenv("ANALYSIS_MODEL", "gemini-2.5-flash"), prompt, generation_config=config)
        return clean_json(response.text)

    print(f"Found {len(user_bullets)} user bullets. Running strength classification...")
    strengths = classify_bullet_strengths(user_bullets)
    
    print("Fetching adaptive RAG context...")
    rag_context = ""
    for idx, ub in enumerate(user_bullets):
        bullet_text = ub.get('bullet_text', '')
        section_type = ub.get('section_type', 'experience')
        if len(bullet_text) < 15: continue
        
        strength = strengths.get(str(idx), "weak")
        match_count = 3 if strength == "strong" else 7
        
        embedding = gemini_client.embed_text(bullet_text)
        if embedding:
            try:
                rpc_res = supabase.rpc('match_golden_bullets', {
                    'query_embedding': embedding,
                    'match_count': match_count,
                    'filter_section_type': section_type,
                    'filter_target_role': target_role
                }).execute()
                
                matches = rpc_res.data
                if matches:
                    rag_context += f"\n--- USER BULLET: {bullet_text} (Section: {section_type}) ---\n"
                    rag_context += f"GOLDEN DAY 1 BENCHMARKS ({len(matches)} matches):\n"
                    for m in matches:
                        rag_context += f"- Pattern: {m['structural_skeleton']} | Verb: {m['action_verb']}\n"
                        rag_context += f"  Text: {m['bullet_text']}\n"
            except Exception as e:
                print(f"Supabase RPC error: {e}")

    # Format Rules
    global_rules_text = "\n".join([f"- {r}" for r in BEST_PRACTICES])
    section_rules_text = json.dumps(SECTION_RULES, indent=2)

    final_prompt = f"""
    You are an elite IIT Bombay Day 1 Resume Reviewer.
    
    We parsed the user's resume. For their bullets, we ran a vector search against verified Day 1 Senior Resumes.
    CRITICAL CONSTRAINT: You MUST NOT tell the user to copy specific facts from the Golden Examples. 
    Use the Golden Examples purely as a STRUCTURAL BENCHMARK.
    
    ### GLOBAL STRICT RULES:
    {global_rules_text}
    
    ### SECTION-SPECIFIC RULES & CONVENTIONS:
    {section_rules_text}
    
    ### USER RESUME TEXT (Raw):
    {resume_text}
    
    ### ADAPTIVE RAG CONTEXT (User Bullets mapped to Day 1 Golden Examples):
    {rag_context}
    
    ### TASK:
    Analyze the user's resume bullet by bullet. Provide a deep structural critique using the new schema.
    Provide severity (critical, major, minor, good), an action verb rating (weak, moderate, strong) with alternatives, and a metrics hint if they lack quantification.
    Generate a suggested_rewrite that preserves their facts but upgrades the structural skeleton.
    Also generate overall feedback, radar scores (0-100), section summaries, Day 1 comparison, and ordering advice.
    
    CRITICAL: You MUST evaluate EVERY SINGLE bullet present in the RAG CONTEXT (there are {len(user_bullets)} bullets). 
    Do NOT stop early.
    
    Return ONLY valid JSON exactly matching this schema:
    {{
        "overall_feedback": "string",
        "day1_comparison": "string",
        "section_ordering_advice": "string",
        "radar_scores": {{
            "quantification": number, "action_verbs": number, "structure": number,
            "section_balance": number, "star_compliance": number, "formatting": number
        }},
        "section_summaries": {{
            "experience": {{"score": number, "summary": "string", "bullet_count": number}},
            "project": {{...}} // Include all sections present
        }},
        "bullets": [
            {{
                "original_bullet": "string",
                "section_type": "string",
                "severity": "critical" | "major" | "minor" | "good",
                "confidence": number,
                "critique": "string",
                "action_verb_rating": "weak" | "moderate" | "strong",
                "action_verb_alternatives": ["string"],
                "structural_issues": ["string"],
                "best_practice_violations": ["string"],
                "metrics_hint": "string" or null,
                "golden_comparison": "string",
                "suggested_rewrite": "string",
                "predicted_questions": ["string"],
                "mapped_company_category": "string"
            }}
        ]
    }}
    """

    config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.2)
    response = gemini_client.generate_content(os.getenv("ANALYSIS_MODEL", "gemini-2.5-flash"), final_prompt, generation_config=config)
    
    return clean_json(response.text)

def run_workshop_turn(original_bullet: str, section_type: str, target_role: str, messages: List[Dict[str, str]], overall_context: str = None) -> Dict[str, Any]:
    """
    Executes a single turn of the Resume Workshop chat.
    If section_type == 'overall', uses full analysis context for strategic advice.
    Otherwise, uses RAG for bullet-level advice.
    """
    if section_type == "overall":
        system_prompt = f"""
        You are an elite IIT Bombay Day 1 Resume Interviewer conducting a 1-on-1 resume strategy session.
        
        ### Overall Resume Context & Analysis:
        {overall_context}
        
        ### YOUR PERSONA & TASK:
        1. Act as a strict but helpful strategic advisor.
        2. Help the user prioritize sections, drop weak points, and highlight their unique strengths for the {target_role} role.
        3. Do NOT focus on grammatical fixes; focus on narrative, ordering, and missing skill gaps.
        4. Keep your responses concise and action-oriented.
        
        Respond in JSON format:
        {{
            "response": "Your strategic advice or question to the user",
            "is_final_bullet": false,
            "final_bullet": null
        }}
        """
    else:
        embedding = gemini_client.embed_text(original_bullet)
        rag_context = ""
        if embedding:
            try:
                rpc_res = supabase.rpc('match_golden_bullets', {
                    'query_embedding': embedding,
                    'match_count': 5,
                    'filter_section_type': section_type,
                    'filter_target_role': target_role
                }).execute()
                
                matches = rpc_res.data
                if matches:
                    rag_context = "GOLDEN STRUCTURAL EXAMPLES FOR SIMILAR BULLET:\n"
                    for m in matches:
                        rag_context += f"- Pattern: {m['structural_skeleton']} (e.g. {m['action_verb']})\n"
                        rag_context += f"  Text: {m['bullet_text']}\n"
            except Exception as e:
                print(f"Workshop Supabase RPC error: {e}")

        global_rules_text = "\n".join([f"- {r}" for r in BEST_PRACTICES])
        section_rules_text = json.dumps(SECTION_RULES.get(section_type, {}), indent=2)
        
        system_prompt = f"""
        You are an elite IIT Bombay Day 1 Resume Interviewer conducting a 1-on-1 resume workshop.
        Your goal is to help the user upgrade a weak, vague bullet point into a high-impact, quantified Day 1 bullet.
        
        ### Original Bullet Being Workshoped:
        "{original_bullet}"
        
        ### Golden Day 1 Examples (For STRUCTURAL reference only):
        {rag_context}
        
        ### Best Practice Rules:
        {global_rules_text}
        
        ### Section Rules ({section_type}):
        {section_rules_text}
        
        ### YOUR PERSONA & TASK:
        1. Act as a strict but helpful interviewer (like a McKinsey Engagement Manager).
        2. Ask 1-2 sharp, targeted questions to extract missing metrics (e.g., "What was the budget?").
        3. Keep your questions very concise.
        4. Once you have extracted enough metrics, synthesize the final, polished bullet point that adheres strictly to the Golden structural examples and Best Practice rules.
        5. When you provide the final bullet, set `is_final_bullet` to true and put the polished bullet string in `final_bullet`.

        Respond in JSON format:
        {{
            "response": "Your conversational reply or question to the user",
            "is_final_bullet": boolean,
            "final_bullet": "The polished string (only include if is_final_bullet is true, else null)"
        }}
        """
        
    chat_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "assistant"
        chat_messages.append({"role": role, "content": msg["content"]})
        
    last_user_msg = messages[-1]["content"] if messages else "Hi, I need help."
    chat_messages.append({"role": "user", "content": last_user_msg})
    
    try:
        res_text = cerebras_client.generate_chat_completion(
            model=os.getenv("INTERVIEW_MODEL", "gpt-oss-120b"), # using standard Cerebras model
            messages=chat_messages,
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        return json.loads(clean_json(res_text))
    except Exception as e:
        print(f"Workshop API Error: {e}")
        return {
            "response": "I encountered a rate limit or API error with the AI engine. Please wait a moment and try again.",
            "is_final_bullet": False,
            "final_bullet": None
        }
