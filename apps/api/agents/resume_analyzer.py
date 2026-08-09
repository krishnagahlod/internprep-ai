import json
import os
import re
import concurrent.futures
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
import base64

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

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def extract_user_bullets(resume_text: str) -> List[Dict[str, str]]:
    """Extracts raw bullets from the user's resume and classifies their strength for independent analysis."""
    prompt = f"""
    Extract every single achievement bullet point from the following resume text.
    Return ONLY a JSON list of objects containing 'bullet_text', 'section_type', and 'strength'.
    Section type must be one of: experience, project, por, scholastic, extracurricular.
    Strength must be either "strong" (has numbers/metrics) or "weak" (vague, no metrics).
    
    CRITICAL: You MUST extract EVERY SINGLE bullet point from the entire resume (usually 20-40 points). Do not omit or skip any bullet.
    
    Resume Text:
    {resume_text}
    """
    try:
        config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
        res = gemini_client.generate_content(os.getenv("PREPROCESSING_MODEL", "gemini-3.1-flash-lite"), prompt, generation_config=config)
        data = json.loads(clean_json(res.text))
        if isinstance(data, list): return data
        if "bullets" in data: return data["bullets"]
        return []
    except Exception as e:
        print(f"Extraction error: {e}")
        return []

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def parse_resume_structural(pdf_bytes: bytes) -> str:
    """Uses Gemini to extract deeply structured text from a PDF resume."""
    try:
        prompt = """
You are an expert resume parser. I am providing you with a raw PDF resume.
Extract the entire text content of this resume into a highly structured, clean Markdown document.
CRITICAL INSTRUCTIONS:
1. Maintain the exact logical structure, sections (e.g., Experience, Education, Skills, Projects).
2. Preserve all bullet points perfectly. Do NOT truncate or summarize.
3. Capture the hierarchy (e.g., Company -> Role -> Dates -> Bullets).
4. Do NOT output anything other than the extracted Markdown. No conversational filler.
"""
        
        response = gemini_client.generate_content("gemini-1.5-flash", prompt, pdf_bytes=pdf_bytes)
        
        text = response.text
        # Strip markdown fences if they exist
        if text.startswith("```markdown"):
            text = text[11:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return text.strip()
    except Exception as e:
        print(f"Error parsing resume with Gemini: {e}")
        # Fallback to standard extraction if Gemini fails
        from pdfminer.high_level import extract_text
        import io
        return extract_text(io.BytesIO(pdf_bytes))


def analyze_resume_text(resume_text: str, target_role: str = "consult", resume_phase: str = "placement", pdf_bytes: bytes = None) -> str:
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
        config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.0)
        response = gemini_client.generate_content(os.getenv("ANALYSIS_MODEL", "gemini-1.5-flash"), prompt, generation_config=config)
        return clean_json(response.text)

    print("Fetching adaptive RAG context concurrently using batch embeddings...")
    
    # 1. Extract texts for batch embedding
    bullet_texts = [ub.get('bullet_text', '') for ub in user_bullets]
    
    # 2. Fetch all embeddings in ONE API call to avoid rate limits
    try:
        embeddings = gemini_client.embed_batch(bullet_texts)
    except Exception as e:
        print(f"Batch embedding failed: {e}")
        embeddings = [None] * len(user_bullets)
        
    def fetch_rag_for_bullet(args):
        import time
        import random
        idx, ub, embedding = args
        bullet_text = ub.get('bullet_text', '')
        section_type = ub.get('section_type', 'experience')
        if len(bullet_text) < 15 or not embedding: return ""
        
        strength = ub.get("strength", "weak")
        match_count = 15 # Increased for Gemini 3.5 Flash massive context window
        
        for attempt in range(3):
            try:
                rpc_name = 'match_golden_bullets_placement' if resume_phase == 'placement' else 'match_golden_bullets'
                rpc_res = supabase.rpc(rpc_name, {
                    'query_embedding': embedding,
                    'match_count': match_count,
                    'filter_section_type': section_type,
                    'filter_target_role': target_role
                }).execute()
                
                matches = rpc_res.data
                if matches:
                    local_context = f"\n--- USER BULLET: {bullet_text} (Section: {section_type}) ---\n"
                    local_context += f"GOLDEN DAY 1 BENCHMARKS ({len(matches)} matches):\n"
                    for m in matches:
                        local_context += f"- Pattern: {m['structural_skeleton']} | Verb: {m['action_verb']}\n"
                        local_context += f"  Text: {m['bullet_text']}\n"
                    return local_context
                break # Success, break out of retry loop
            except Exception as e:
                print(f"Supabase RPC error on attempt {attempt+1} for bullet {idx}: {e}")
                time.sleep(1.5) # Wait before retrying
        return ""

    # 3. Fetch RAG matches concurrently from Supabase
    args_list = [(i, ub, embeddings[i] if i < len(embeddings) else None) for i, ub in enumerate(user_bullets)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        rag_results = list(executor.map(fetch_rag_for_bullet, args_list))
    
    rag_context = "".join(rag_results)

    # Format Rules
    global_rules_text = "\n".join([f"- {r}" for r in BEST_PRACTICES])
    
    # Dynamically load section rules based on resume phase
    active_section_rules = SECTION_RULES
    if resume_phase == "placement":
        PLACEMENT_RULES_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes/placement_section_rules.json"))
        if os.path.exists(PLACEMENT_RULES_PATH):
            try:
                with open(PLACEMENT_RULES_PATH, 'r') as f:
                    active_section_rules = json.load(f)
            except Exception as e:
                print(f"Failed to load placement section rules: {e}")
                
    section_rules_text = json.dumps(active_section_rules, indent=2)
    user_bullets_json = json.dumps(user_bullets, indent=2)

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
    
    ### USER BULLETS TO EVALUATE:
    {user_bullets_json}
    
    ### ADAPTIVE RAG CONTEXT (User Bullets mapped to Day 1 Golden Examples):
    {rag_context}
    
    ### TASK:
    Analyze the user's resume bullet by bullet. Provide a deep structural critique using the new schema.
    Provide severity (critical, major, minor, good), an action verb rating (weak, moderate, strong) with alternatives, and a metrics hint if they lack quantification.
    Generate a suggested_rewrite that preserves their facts but upgrades the structural skeleton.
    CRITICAL TENSE RULE: You MUST preserve the original verb tense of the point (e.g. if the original uses continuous tense like "Designing", the rewrite and suggested verbs MUST use continuous tense. Do not change it to past tense if they are currently doing it).
    
    CRITICAL LENGTH CONSTRAINT: The suggested_rewrite MUST be extremely close in length to the original_bullet (ideally exactly the same number of words/characters). IIT Bombay resumes require exactly 1-line per bullet with no empty space. Do NOT generate a rewrite that is significantly longer or shorter than the original, otherwise it will ruin their formatting.
    
    Also generate overall feedback, radar scores (0-100), section summaries, Day 1 comparison, and ordering advice.
    
    CRITICAL: You MUST evaluate EVERY SINGLE bullet present in the "USER BULLETS TO EVALUATE" section (there are {len(user_bullets)} bullets). 
    Do NOT rely solely on the RAG context, as some bullets might not have matched golden examples. You MUST output exactly {len(user_bullets)} bullet evaluations.
    Do NOT stop early.
    
    Return ONLY valid JSON exactly matching this schema:
    {{
        "overall_feedback": "string",
        "day1_comparison": "string",
        "section_ordering_advice": "string",
        "radar_scores_reasoning": ["string (reasoning for Quantification)", "string (reasoning for Action Verbs)", "..."],
        "radar_scores": {{
            "quantification": number, "action_verbs": number, "structure": number,
            "section_balance": number, "star_compliance": number, "formatting": number
        }},
        "section_summaries": {{
            "experience": {{"score": number, "summary": "string", "bullet_count": number}},
            "project": {{"score": number, "summary": "string", "bullet_count": number}},
            "por": {{"score": number, "summary": "string", "bullet_count": number}},
            "scholastic": {{"score": number, "summary": "string", "bullet_count": number}},
            "extracurricular": {{"score": number, "summary": "string", "bullet_count": number}}
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
    
    import typing_extensions as typing
    class RadarScores(typing.TypedDict):
        quantification: int
        action_verbs: int
        structure: int
        section_balance: int
        star_compliance: int
        formatting: int
        
    class SectionSummary(typing.TypedDict):
        score: int
        summary: str
        bullet_count: int
        
    class BulletFeedback(typing.TypedDict, total=False):
        original_bullet: str
        section_type: str
        severity: str
        confidence: float
        critique: str
        action_verb_rating: str
        action_verb_alternatives: list[str]
        structural_issues: list[str]
        best_practice_violations: list[str]
        metrics_hint: str
        golden_comparison: str
        suggested_rewrite: str
        predicted_questions: list[str]
        mapped_company_category: str

    class SectionSummaries(typing.TypedDict, total=False):
        experience: SectionSummary
        project: SectionSummary
        por: SectionSummary
        scholastic: SectionSummary
        extracurricular: SectionSummary

    class ResumeAnalysisResponse(typing.TypedDict):
        overall_feedback: str
        day1_comparison: str
        section_ordering_advice: str
        radar_scores_reasoning: list[str]
        radar_scores: RadarScores
        section_summaries: SectionSummaries
        bullets: list[BulletFeedback]

    config = genai.GenerationConfig(
        response_mime_type="application/json", 
        temperature=0.0
    )
    response = gemini_client.generate_content(os.getenv("ANALYSIS_MODEL", "gemini-3.1-flash-lite"), final_prompt, generation_config=config)
    
    return clean_json(response.text)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def run_workshop_turn(
    original_bullet: str, 
    section_type: str, 
    target_role: str = "consult", 
    resume_phase: str = "placement",
    messages: List[Dict[str, str]] = None,
    overall_context: str = None
) -> Dict[str, Any]:
    """
    Executes a single turn of the Resume Workshop chat.
    If section_type == 'overall', uses full analysis context for strategic advice.
    Otherwise, uses RAG for bullet-level advice.
    """
    if section_type == "overall":
        # Dynamically load section rules based on resume phase
        active_section_rules = SECTION_RULES
        if resume_phase == "placement":
            PLACEMENT_RULES_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes/placement_section_rules.json"))
            if os.path.exists(PLACEMENT_RULES_PATH):
                try:
                    with open(PLACEMENT_RULES_PATH, 'r') as f:
                        active_section_rules = json.load(f)
                except Exception:
                    pass

        system_prompt = f"""
        You are an elite IIT Bombay Day 1 Placement Resume Consultant. 
        You are actively coaching a student in real-time.
        
        ### Overall Resume Context & Analysis:
        {overall_context}
        
        ### Section Rules for {section_type}:
        {json.dumps(active_section_rules.get(section_type, {}), indent=2)}
        
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
                rpc_name = 'match_golden_bullets_placement' if resume_phase == 'placement' else 'match_golden_bullets'
                rpc_res = supabase.rpc(rpc_name, {
                    'query_embedding': embedding,
                    'match_count': 10,
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
        5. CRITICAL LENGTH CONSTRAINT: The final polished bullet MUST be extremely close in length (character/word count) as the original bullet to ensure it perfectly fits on 1 line without wrapping or leaving empty space.
        6. When you provide the final bullet, set `is_final_bullet` to true and put the polished bullet string in `final_bullet`.

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
            model=os.getenv("INTERVIEW_MODEL", "gpt-oss-120b"),
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
