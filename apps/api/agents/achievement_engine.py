import json
import os
import time
from typing import List, Dict, Any
from services.gemini_client import gemini_client
import google.generativeai as genai
from services.embeddings import get_query_embedding

def extract_achievements_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    system_prompt = """
    You are an expert career counselor helping a user build their 'Achievement Vault'.
    Extract all distinct professional, academic, or extracurricular achievements from this PDF resume.
    
    CRITICAL EXTRACTION RULES:
    1. Be Exhaustive & Granular: Do not summarize or group unrelated points into broad buckets. 
    2. If a single experience or project has 5 distinct technical, leadership, or quantitative achievements, extract them as 5 separate items.
    3. A typical dense 1-page resume should yield 15-25 distinct granular achievements.
    
    Return ONLY a valid JSON array of objects.
    Each object must strictly follow this schema:
    {
        "title": "A short 3-5 word descriptive title (e.g. 'Automated Data Pipeline')",
        "parent_experience": "The company, organization, or project name",
        "timeline": "e.g., 'May 2025 - Jul 2025' or '2024'",
        "original_description": "The full original text/bullets associated with this achievement",
        "quantified_metrics": {"metric_name_1": 500, "metric_name_2": "20%"},
        "competency_tags": ["array of 1-3 tags from the allowed list"],
        "extraction_confidence": 0.95
    }
    
    Allowed competency_tags:
    - strategic_problem_solving
    - product_technical_execution
    - sustainability_impact
    - financial_quantitative_rigor
    - leadership_stakeholder_mgmt
    - entrepreneurial_ownership
    """
    
    response = gemini_client.generate_content(
        model_name="gemini-3.5-flash",
        prompt=system_prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1),
        pdf_bytes=pdf_bytes
    )
    
    try:
        data = json.loads(response.text)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to parse extraction JSON: {e}")
        return []

def extract_achievements_from_text(text: str) -> List[Dict[str, Any]]:
    system_prompt = """
    You are an expert career counselor helping a user build their 'Achievement Vault'.
    Extract all distinct professional, academic, or extracurricular achievements from the provided text notes.
    
    CRITICAL EXTRACTION RULES:
    1. Be Exhaustive & Granular: Break down large paragraphs. Do not summarize or group unrelated points into broad buckets.
    2. If a project has 5 distinct achievements, extract them as 5 separate items.
    
    Return ONLY a valid JSON array of objects.
    Each object must strictly follow this schema:
    {
        "title": "A short 3-5 word descriptive title",
        "parent_experience": "The company, organization, or project name (if evident, otherwise 'Independent')",
        "timeline": "Timeline if mentioned, otherwise null",
        "original_description": "The original text describing this achievement",
        "quantified_metrics": {"metric_name": value},
        "competency_tags": ["array of 1-3 tags from the allowed list"],
        "extraction_confidence": 0.9
    }
    
    Allowed competency_tags:
    - strategic_problem_solving
    - product_technical_execution
    - sustainability_impact
    - financial_quantitative_rigor
    - leadership_stakeholder_mgmt
    - entrepreneurial_ownership
    """
    
    response = gemini_client.generate_content(
        model_name="gemini-3.5-flash",
        prompt=system_prompt + "\n\nUser Text:\n" + text,
        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
    )
    
    try:
        data = json.loads(response.text)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to parse text extraction JSON: {e}")
        return []

def get_placement_rag_context(supabase_client, target_role: str, description: str, tags: List[str]) -> str:
    """Fetches relevant placement-tier golden bullets to use as few-shot examples."""
    query_embedding = get_query_embedding(description)
    if not query_embedding:
        return ""
        
    try:
        # Match using the new placement RPC function
        response = supabase_client.rpc('match_golden_bullets_placement', {
            'query_embedding': query_embedding,
            'match_count': 10,
            'filter_target_role': target_role,
            'filter_tier': 'placement'
        }).execute()
        
        matches = response.data
        if not matches:
            # Fallback to any tier if placement tier is empty for this role
            response = supabase_client.rpc('match_golden_bullets', {
                'query_embedding': query_embedding,
                'match_count': 5,
                'filter_target_role': target_role
            }).execute()
            matches = response.data
            
        if not matches:
            return ""
            
        context = "GOLDEN BULLET EXAMPLES (For Inspiration):\n"
        for i, m in enumerate(matches):
            context += f"{i+1}. {m.get('bullet_text')} [Skeleton: {m.get('structural_skeleton')}]\n"
            
        return context
    except Exception as e:
        print(f"RAG fetch failed: {e}")
        return ""

def generate_bullet_variants(supabase_client, achievement: Dict[str, Any], target_role: str, benchmark_text: str = "") -> List[Dict[str, Any]]:
    # 1. Fetch RAG context
    desc = achievement.get('original_description', '')
    notes = achievement.get('user_notes', '')
    tags = achievement.get('competency_tags', [])
    combined_desc = f"{desc}\nAdditional Notes: {notes}"
    
    rag_context = get_placement_rag_context(supabase_client, target_role, combined_desc, tags)
    
    # Setup length constraint
    if benchmark_text and benchmark_text.strip():
        length_constraint = f"Analyze the length and density of this user-provided benchmark bullet: '{benchmark_text.strip()}'. Ensure all generated variants match this exact length and structural density so it fits perfectly on their resume."
    else:
        length_constraint = f"Constrain the character count of each variant to be roughly similar (+/- 15%) to the length of the original description."

    # 2. Generate variants using Gemini
    system_prompt = f"""
    You are an elite IIT Bombay placement resume writer. The user is targeting a '{target_role}' role.
    Take their raw achievement data and generate 4 distinct, high-impact resume bullet variants.
    
    {rag_context}
    
    Raw Achievement Data:
    - Title: {achievement.get('title')}
    - Context: {achievement.get('parent_experience')}
    - Description: {combined_desc}
    - Known Metrics: {json.dumps(achievement.get('quantified_metrics', {}))}
    
    LENGTH CONSTRAINT:
    {length_constraint}
    
    Generate 4 variants of the bullet:
    1. 'impact_heavy': Focus heavily on the quantified results and business/end-user value.
    2. 'leadership_heavy': Focus on ownership, stakeholder management, and driving the initiative.
    3. 'technical_heavy': Focus on the specific tools, methods, frameworks, and technical execution.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
    
    Return strictly a JSON array of objects, with each object matching this schema:
    {{
        "variant_type": "impact_heavy" | "leadership_heavy" | "technical_heavy" | "concise",
        "bullet_text": "The generated bullet point",
        "scores": {{
            "impact": 0-100,
            "quantification": 0-100,
            "role_fit": 0-100
        }}
    }}
    
    CRITICAL: 
    - Follow standard Day 1 resume rules (Start with strong action verb, quantify, single line).
    - Do NOT hallucinate metrics; use the provided metrics or abstract them safely (e.g. 'significant improvement').
    """
    
    response = gemini_client.generate_content(
        model_name="gemini-3.5-flash",
        prompt=system_prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.4)
    )
    
    try:
        data = json.loads(response.text)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to generate variants JSON: {e}")
        return []

def run_metric_reconstruction_turn(achievement: Dict[str, Any], messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """Runs a single turn of the metric reconstruction chat."""
    system_prompt = f"""
    You are an expert McKinsey consultant and IIT Bombay placement coach.
    Your goal is to help the user quantify the impact of their achievement by asking sharp, probing questions to estimate metrics.
    
    Achievement Context:
    Title: {achievement.get('title')}
    Experience: {achievement.get('parent_experience')}
    Description: {achievement.get('original_description')}
    Current Metrics: {json.dumps(achievement.get('quantified_metrics', {}))}
    
    Guidelines:
    1. Do NOT ask more than 1 or 2 questions at a time. Keep it conversational.
    2. Suggest proxy metrics if they don't have exact numbers (e.g., 'If you don't know the exact revenue, can you estimate the time saved per week?').
    3. If the user provides new metrics or context, acknowledge them, then ask the next logical question to drill deeper.
    4. When you feel you have enough metrics to write a strong bullet, tell them 'I think we have enough to generate a great bullet now!'
    
    You must return a JSON object with:
    - "response": Your chat response to the user.
    - "extracted_metrics_update": Any NEW metrics you've confidently extracted from the conversation so far (as a dictionary). If none yet, return an empty dictionary.
    """
    
    # Convert messages to Gemini format
    gemini_messages = []
    for msg in messages:
        role = "model" if msg["role"] in ["assistant", "model"] else "user"
        gemini_messages.append({"role": role, "parts": [msg["content"]]})
        
    response = gemini_client.generate_content_with_history(
        model_name="gemini-3.5-flash",
        system_instruction=system_prompt,
        history=gemini_messages[:-1] if gemini_messages else [],
        new_message=gemini_messages[-1]["parts"][0] if gemini_messages else "Hello! Let's quantify this achievement.",
        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.7)
    )
    
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Failed to parse metric chat JSON: {e}")
        return {"response": response.text, "extracted_metrics_update": {}}

def generate_resume_strategy(achievements: List[Dict[str, Any]], saved_bullets: List[Dict[str, Any]], target_role: str) -> Dict[str, Any]:
    """Analyzes the user's current vault and bank to provide a placement strategy."""
    
    system_prompt = f"""
    You are a placement strategy engine for an IIT Bombay student targeting a '{target_role}' role.
    Analyze the user's achievements and saved bullets to identify gaps, suggest a resume structure, and provide actionable advice.
    
    Input Data:
    - Number of Achievements: {len(achievements)}
    - Number of Saved Bullets: {len(saved_bullets)}
    - Target Role: {target_role}
    
    Achievements Data (Summarized):
    {json.dumps([{ 'title': a.get('title'), 'tags': a.get('competency_tags', []) } for a in achievements])}
    
    Saved Bullets:
    {json.dumps([b.get('bullet_text') for b in saved_bullets])}
    
    Return a JSON object with:
    {{
        "overall_readiness_score": 0-100,
        "strengths": ["list of 2-3 strong points"],
        "critical_gaps": ["list of 2-3 missing skills/experiences for this role"],
        "recommended_sections": [
            {{"name": "e.g., Professional Experience", "focus": "What to highlight here"}}
        ],
        "action_plan": ["list of 3 actionable steps to improve the resume"]
    }}
    """
    
    response = gemini_client.generate_content(
        model_name="gemini-3.5-flash",
        prompt=system_prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.2)
    )
    
    try:
        return json.loads(response.text)
    except Exception as e:
        print(f"Failed to parse strategy JSON: {e}")
        return {}
