import json
import os
import time
from typing import List, Dict, Any
from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai
from services.embeddings import get_query_embedding

def extract_achievements_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    system_prompt = """
    You are an expert career counselor helping a user build their 'Achievement Vault'.
    Extract all distinct professional, academic, or extracurricular achievements from this PDF resume.
    
    CRITICAL EXTRACTION RULES:
    1. Be Exhaustive & Granular: Do not summarize or group unrelated points into broad buckets. 
    2. Group By Hierarchy: Identify the major section (e.g., Professional Experience, Projects, Positions of Responsibility, Extracurriculars, Scholastic Achievements), then the parent organization/project, and list granular achievements underneath it.
    3. If a single experience or project has 5 distinct technical, leadership, or quantitative achievements, extract them as 5 separate items under the same parent.
    4. A typical dense 1-page resume should yield 15-25 distinct granular achievements across all sections.
    5. Deduplication (CRITICAL): Do NOT extract overlapping points. If a project has multiple sentences describing the EXACT SAME core action, combine them into ONE achievement. Every extracted achievement must be mutually exclusive.
    
    Return ONLY a valid JSON array of section objects.
    Strictly follow this JSON schema:
    [
      {
        "section_type": "The major section heading (e.g. 'Professional Experience', 'Projects', 'Positions of Responsibility')",
        "parent_experience": "The company, organization, or overall project name",
        "timeline": "e.g., 'May 2025 - Jul 2025' or '2024' (if mentioned at the parent level)",
        "achievements": [
          {
            "title": "A short 3-5 word descriptive title (e.g. 'Automated Data Pipeline')",
            "original_description": "The full original text/bullets associated with this specific achievement",
            "quantified_metrics": {"metric_name_1": 500, "metric_name_2": "20%"},
            "competency_tags": ["array of 1-3 tags from the allowed list"],
            "extraction_confidence": 0.95
          }
        ]
      }
    ]
    
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
    2. Group By Hierarchy: Identify the major section (e.g., Professional Experience, Projects, Positions of Responsibility, Extracurriculars, Scholastic Achievements), then the parent organization/project, and list granular achievements underneath it.
    3. If a project has 5 distinct achievements, extract them as 5 separate items under the same parent.
    4. Deduplication (CRITICAL): Do NOT extract overlapping points. If a project has multiple sentences describing the EXACT SAME core action, combine them into ONE achievement. Every extracted achievement must be mutually exclusive.
    
    Return ONLY a valid JSON array of section objects.
    Strictly follow this JSON schema:
    [
      {
        "section_type": "The major section heading (e.g. 'Professional Experience', 'Projects', 'Positions of Responsibility')",
        "parent_experience": "The company, organization, or overall project name",
        "timeline": "e.g., 'May 2025 - Jul 2025' or '2024' (if mentioned at the parent level)",
        "achievements": [
          {
            "title": "A short 3-5 word descriptive title (e.g. 'Automated Data Pipeline')",
            "original_description": "The full original text/bullets associated with this specific achievement",
            "quantified_metrics": {"metric_name_1": 500, "metric_name_2": "20%"},
            "competency_tags": ["array of 1-3 tags from the allowed list"],
            "extraction_confidence": 0.95
          }
        ]
      }
    ]
    
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
        target_words = len(benchmark_text.strip().split())
        min_words = max(5, target_words - 2)
        max_words = target_words + 2
        length_constraint = f"CRITICAL LENGTH CONSTRAINT: Analyze the user-provided benchmark bullet: '{benchmark_text.strip()}'. Your generated variants MUST be EXACTLY between {min_words} and {max_words} words long. Count the words before outputting. If a variant exceeds {max_words} words, YOU FAIL."
    else:
        target_words = len(desc.split()) if desc else 15
        min_words = max(5, target_words - 4)
        max_words = target_words + 4
        length_constraint = f"CRITICAL LENGTH CONSTRAINT: Your generated variants MUST be EXACTLY between {min_words} and {max_words} words long (matching the original text). Count the words before outputting. Do not output more than {max_words} words."

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
    
    Return strictly a JSON object with a "variants" key that contains an array of exactly 4 objects matching this schema:
    {
        "variants": [
            {
                "variant_type": "impact_heavy" | "leadership_heavy" | "technical_heavy" | "concise",
                "bullet_text": "The generated bullet point WITHOUT ANY FULL STOP AT THE END",
                "scores": {
                    "impact": 0-100,
                    "quantification": 0-100,
                    "role_fit": 0-100
                }
            }
        ]
    }
    
    CRITICAL: 
    - Follow standard Day 1 resume rules (Start with strong action verb, quantify, single line).
    - Do NOT hallucinate metrics; use the provided metrics or abstract them safely (e.g. 'significant improvement').
    - NEVER put a full stop (period) at the end of the bullet point.
    """
    
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=[{"role": "user", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=1024
        )
        data = json.loads(response_text)
        variants = data.get("variants", [])
        
        # Ensure no full stops made it through
        for v in variants:
            if v.get("bullet_text") and v["bullet_text"].endswith("."):
                v["bullet_text"] = v["bullet_text"][:-1]
                
        return variants
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
    1. Ask exactly 1 short, focused question. Keep it conversational.
    2. Use proxy metrics: If they don't know exact revenue, ask about time saved, team size, scale of the project, or user base.
    3. Push for scale and context (e.g. "You built a bot. How many queries does it handle daily?").
    4. Focus on the best practices of IIT Bombay resumes: STAR format, highlighting magnitude of impact, and strong action verbs.
    5. Once you have solid metrics, tell them "I think we have enough to generate a great bullet now!"
    
    You must return a valid JSON object matching this schema exactly:
    {{
      "response": "Your chat response to the user.",
      "extracted_metrics_update": {{ "metric_name": "metric_value" }},
      "new_context_summary": "A concise summary of any new context or notes the user provided in this turn that should be appended to the achievement (or empty string if none)."
    }}
    """
    
    # Convert messages to Cerebras (OpenAI-compatible) format
    cerebras_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        # Cerebras takes 'assistant' instead of 'model'
        role = "assistant" if msg["role"] in ["assistant", "model"] else "user"
        cerebras_messages.append({"role": role, "content": msg["content"]})
        
    response_text = cerebras_client.generate_chat_completion(
        messages=cerebras_messages,
        model="gpt-oss-120b", # Using standard reliable model
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    try:
        data = json.loads(response_text)
        return data
    except Exception as e:
        print(f"Failed to parse metric chat JSON: {e}")
        return {"response": response_text, "extracted_metrics_update": {}, "new_context_summary": ""}

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
