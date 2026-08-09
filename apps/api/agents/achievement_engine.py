import json
import os
import time
from typing import List, Dict, Any
from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai
from services.embeddings import get_query_embedding

def extract_achievements_from_pdf(pdf_bytes: bytes, existing_vault: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    vault_context = ""
    if existing_vault:
        vault_context = f"""
    VAULT AWARENESS (CRITICAL):
    Here is the user's existing achievement vault:
    {json.dumps(existing_vault, indent=2)}
    
    Rules for integrating with existing vault:
    A. HEADING ALIGNMENT: If an extracted achievement belongs to an organization/project ALREADY in the existing vault, you MUST use the EXACT SAME `section_type` and `parent_experience` strings.
    B. INFORMATION MERGING: If the extracted text describes the EXACT SAME core achievement as an existing one, DO NOT create a new duplicate. Provide the `merge_id` (the id of the existing achievement) in your JSON output, and write a new, comprehensive `original_description` that gracefully merges the new information into the old information without losing context.
    """
    
    system_prompt = """
    You are an expert career counselor helping a user build their 'Achievement Vault'.
    Extract all distinct professional, academic, or extracurricular achievements from this PDF resume.
    %s
    
    CRITICAL EXTRACTION RULES:
    1. Be Exhaustive & Granular: Do not summarize or group unrelated points into broad buckets. Extract every distinct achievement.
    2. Group By Hierarchy: Identify the major section (e.g., Professional Experience, Projects), then the parent organization/project, and list granular achievements underneath it.
    3. Deduplication (CRITICAL): Do NOT extract overlapping points. If multiple sentences describe the EXACT SAME core action, combine them into ONE achievement. Every extracted achievement must be mutually exclusive.
    4. Capitalization & Action Verbs (CRITICAL): The `original_description` MUST ALWAYS start with a capitalized Action Verb (e.g., "Built a local-first..." instead of "built a...").
    5. Standalone Independence (CRITICAL): Resolve pronouns (it, they, the framework, the work) and implicit references. Each extracted description MUST be completely understandable on its own without needing the surrounding text.
    6. No Raw Slicing & Tone Enforcement: Do NOT blindly copy-paste raw substrings from the middle of sentences. Reconstruct fragments into grammatically correct, standalone achievements. Remove first-person pronouns ("I", "my") and maintain a strict professional resume tone.
    7. A typical dense 1-page resume should yield 15-25 distinct granular achievements across all sections.
    
    Return ONLY a valid JSON array of section objects.
    Strictly follow this JSON schema:
    [
      {
        "section_type": "The major section heading (e.g. 'Professional Experience', 'Projects', 'Positions of Responsibility')",
        "parent_experience": "The company, organization, or overall project name",
        "timeline": "e.g., 'May 2025 - Jul 2025' or '2024' (if mentioned at the parent level)",
        "achievements": [
          {
            "merge_id": "optional string: the id of the existing achievement if merging, otherwise omit",
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
    """ % vault_context
    
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

def extract_achievements_from_other_pdf(pdf_bytes: bytes, existing_vault: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    import fitz # PyMuPDF
    
    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        raw_text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            raw_text += page.get_text()
        pdf_document.close()
    except Exception as e:
        print(f"Failed to parse PDF text locally: {e}")
        return []
        
    vault_context = ""
    if existing_vault:
        vault_context = f"""
    VAULT AWARENESS (CRITICAL):
    Here is the user's existing achievement vault:
    {json.dumps(existing_vault, indent=2)}
    
    Rules for integrating with existing vault:
    A. HEADING ALIGNMENT: If an extracted achievement belongs to an organization/project ALREADY in the existing vault, you MUST use the EXACT SAME `section_type` and `parent_experience` strings.
    B. INFORMATION MERGING: If the extracted text describes the EXACT SAME core achievement as an existing one, DO NOT create a new duplicate. Provide the `merge_id` (the id of the existing achievement) in your JSON output, and write a new, comprehensive `original_description` that gracefully merges the new information into the old information without losing context.
    """
        
    system_prompt = """
    You are an expert career counselor helping a user build their 'Achievement Vault'.
    Extract all distinct professional, academic, or extracurricular achievements from the provided document text.
    %s
    
    CRITICAL NOISE FILTERING RULE:
    This text is NOT a standard resume. It may be a project report, college transcript, presentation, or certificate.
    It contains a lot of boilerplate, generic company/project descriptions, and irrelevant noise.
    YOU MUST AGGRESSIVELY FILTER OUT NOISE. Only extract concrete, personal achievements that belong strictly to the user.
    Ignore general descriptions of what a project is. Focus ONLY on what the user DID and ACHIEVED.
    
    CRITICAL EXTRACTION RULES:
    1. Be Exhaustive & Granular for true achievements. Do not summarize or group unrelated points into broad buckets. Extract every distinct achievement.
    2. Group By Hierarchy: Identify the major section (e.g., Professional Experience, Projects), then the parent organization/project, and list granular achievements underneath it.
    3. Deduplication (CRITICAL): Do NOT extract overlapping points. If multiple sentences describe the EXACT SAME core action, combine them into ONE achievement. Every extracted achievement must be mutually exclusive.
    4. Capitalization & Action Verbs (CRITICAL): The `original_description` MUST ALWAYS start with a capitalized Action Verb (e.g., "Built a local-first..." instead of "built a...").
    5. Standalone Independence (CRITICAL): Resolve pronouns (it, they, the framework, the work) and implicit references. Each extracted description MUST be completely understandable on its own without needing the surrounding text.
    6. No Raw Slicing & Tone Enforcement: Do NOT blindly copy-paste raw substrings from the middle of sentences. Reconstruct fragments into grammatically correct, standalone achievements. Remove first-person pronouns ("I", "my") and maintain a strict professional resume tone.
    
    Return ONLY a valid JSON array of section objects.
    Strictly follow this JSON schema:
    [
      {
        "section_type": "The major section heading (e.g. 'Professional Experience', 'Projects')",
        "parent_experience": "The company, organization, or overall project name",
        "timeline": "e.g., 'May 2025 - Jul 2025' or '2024' (if mentioned at the parent level)",
        "achievements": [
          {
            "merge_id": "optional string: the id of the existing achievement if merging, otherwise omit",
            "title": "A short 3-5 word descriptive title",
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
    """ % vault_context
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Document Text:\n{raw_text[:25000]}"}
    ]
    
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=messages,
            temperature=0.1,
            max_tokens=4000
        )
        
        # Clean JSON markdown if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
        data = json.loads(response_text.strip())
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to parse other PDF extraction JSON: {e}")
        return []

def extract_achievements_from_text(text: str, existing_vault: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    vault_context = ""
    if existing_vault:
        vault_context = f"""
    VAULT AWARENESS (CRITICAL):
    Here is the user's existing achievement vault:
    {json.dumps(existing_vault, indent=2)}
    
    Rules for integrating with existing vault:
    A. HEADING ALIGNMENT: If an extracted achievement belongs to an organization/project ALREADY in the existing vault, you MUST use the EXACT SAME `section_type` and `parent_experience` strings.
    B. INFORMATION MERGING: If the extracted text describes the EXACT SAME core achievement as an existing one, DO NOT create a new duplicate. Provide the `merge_id` (the id of the existing achievement) in your JSON output, and write a new, comprehensive `original_description` that gracefully merges the new information into the old information without losing context.
    """

    system_prompt = """
    You are an expert career counselor helping a user build their 'Achievement Vault'.
    Extract all distinct professional, academic, or extracurricular achievements from the provided text notes.
    %s
    
    CRITICAL EXTRACTION RULES:
    1. Be Exhaustive & Granular: Break down large paragraphs. Do not summarize or group unrelated points into broad buckets. Extract every distinct achievement.
    2. Group By Hierarchy: Identify the major section (e.g., Professional Experience, Projects), then the parent organization/project, and list granular achievements underneath it.
    3. Deduplication (CRITICAL): Do NOT extract overlapping points. If multiple sentences describe the EXACT SAME core action, combine them into ONE achievement. Every extracted achievement must be mutually exclusive.
    4. Capitalization & Action Verbs (CRITICAL): The `original_description` MUST ALWAYS start with a capitalized Action Verb (e.g., "Built a local-first..." instead of "built a...").
    5. Standalone Independence (CRITICAL): Resolve pronouns (it, they, the framework, the work) and implicit references. Each extracted description MUST be completely understandable on its own without needing the surrounding text.
    6. No Raw Slicing & Tone Enforcement: Do NOT blindly copy-paste raw substrings from the middle of sentences. Reconstruct fragments into grammatically correct, standalone achievements. Remove first-person pronouns ("I", "my") and maintain a strict professional resume tone.
    
    Return ONLY a valid JSON array of section objects.
    Strictly follow this JSON schema:
    [
      {
        "section_type": "The major section heading (e.g. 'Professional Experience', 'Projects', 'Positions of Responsibility')",
        "parent_experience": "The company, organization, or overall project name",
        "timeline": "e.g., 'May 2025 - Jul 2025' or '2024' (if mentioned at the parent level)",
        "achievements": [
          {
            "merge_id": "optional string: the id of the existing achievement if merging, otherwise omit",
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
    """ % vault_context
    
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

def generate_bullet_variants(supabase_client, achievement: Dict[str, Any], target_role: str, target_company: str = "", benchmark_text: str = "", existing_bullets: List[str] = None) -> List[Dict[str, Any]]:
    # 1. Fetch RAG context
    desc = achievement.get('original_description', '')
    notes = achievement.get('user_notes', '')
    tags = achievement.get('competency_tags', [])
    
    combined_desc = f"{desc}\n\nAdditional Context/Notes: {notes}" if notes else desc
    
    rag_context = get_placement_rag_context(supabase_client, target_role, combined_desc, tags)
    
    # Setup length constraint
    if benchmark_text:
        length_constraint = f"CRITICAL LENGTH CONSTRAINT: You MUST strictly match the exact character length and density of this benchmark bullet: '{benchmark_text}'. Do not exceed its length."
    else:
        length_constraint = "CRITICAL LENGTH CONSTRAINT: Match the length of the original description closely. Standard 1-line length (approx 13-18 words)."

    # Setup context awareness
    context_rules = ""
    if existing_bullets:
        context_rules = f"""
    CONTEXT AWARENESS (ANTI-FRANKENSTEIN RULE):
    The user already has these bullets saved for this project:
    {json.dumps(existing_bullets)}
    You MUST NOT reuse the action verbs or exact sentence structures found in these existing bullets to ensure variety.
        """
        
    action_verb_dictionary = """
    ELITE ACTION VERBS: Spearheaded, Architected, Orchestrated, Synthesized, Catalyzed, Engineered, Pioneered, Executed, Designed.
    BANNED WEAK VERBS: Helped, Worked on, Used, Made, Did, Built (unless followed by high scale).
    """

    # Define variants dynamically based on role
    role_lower = target_role.lower()
    if "consult" in role_lower or "finance" in role_lower:
        variants_instructions = """
    1. 'strategic_impact': Focus heavily on the strategic business results, revenue/cost impact, and high-level outcomes.
    2. 'financial_roi': Focus specifically on financial metrics, cost savings, valuation, or profitability changes.
    3. 'leadership': Focus on stakeholder management, leading teams, cross-functional alignment, and ownership.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"strategic_impact" | "financial_roi" | "leadership" | "concise"'
    elif "product" in role_lower:
        variants_instructions = """
    1. 'growth_metrics': Focus on MAU, retention, engagement, adoption rate, and core product KPIs.
    2. 'cross_functional': Focus on leading engineering/design teams, stakeholder alignment, and product vision.
    3. 'go_to_market': Focus on launch success, market penetration, user feedback, and iteration.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"growth_metrics" | "cross_functional" | "go_to_market" | "concise"'
    elif "software" in role_lower or "it" in role_lower:
        variants_instructions = """
    1. 'architecture_scale': Focus heavily on system architecture, handling high TPS/scale, and infrastructure.
    2. 'optimization': Focus on latency reduction, memory/cost savings, algorithm efficiency, and performance.
    3. 'feature_impact': Focus on the business impact of the shipped feature, user adoption, and technical execution.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"architecture_scale" | "optimization" | "feature_impact" | "concise"'
    else:
        variants_instructions = """
    1. 'impact_heavy': Focus heavily on the quantified results and business/end-user value.
    2. 'leadership_heavy': Focus on ownership, stakeholder management, and driving the initiative.
    3. 'technical_heavy': Focus on the specific tools, methods, frameworks, and technical execution.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"impact_heavy" | "leadership_heavy" | "technical_heavy" | "concise"'

    company_target = f"Specifically, the user is targeting a role at '{target_company}'." if target_company else ""

    # 2. Generate variants using Cerebras
    system_prompt = f"""
    You are an elite IIT Bombay placement resume writer. The user is targeting a '{target_role}' role. {company_target}
    Take their raw achievement data and generate 4 distinct, high-impact resume bullet variants.
    
    {rag_context}
    
    Raw Achievement Data:
    - Title: {achievement.get('title')}
    - Context: {achievement.get('parent_experience')}
    - Description: {combined_desc}
    - Known Metrics: {json.dumps(achievement.get('quantified_metrics', {}))}
    
    {length_constraint}
    
    {context_rules}
    
    {action_verb_dictionary}
    
    Generate 4 variants of the bullet:
    {variants_instructions}
    
    Return strictly a JSON object with a "variants" key that contains an array of exactly 4 objects matching this schema:
    {{
        "variants": [
            {{
                "variant_type": {variant_enum},
                "bullet_text": "The generated bullet point WITHOUT ANY FULL STOP AT THE END",
                "recruiter_notes": "1-2 sentences explaining why this bullet is elite, and actively suggesting exactly which metric could be further quantified to make it even stronger."
            }}
        ]
    }}
    
    CRITICAL: 
    - Follow standard Day 1 resume rules (Start with strong elite action verb, quantify, single line).
    - Do NOT hallucinate metrics; use the provided metrics or abstract them safely (e.g. 'significant improvement').
    - NEVER put a full stop (period) at the end of the bullet point.
    - OUTPUT STRICTLY VALID JSON. DO NOT INCLUDE TRAILING COMMAS. ESCAPE ALL DOUBLE QUOTES PROPERLY.
    """
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response_text = cerebras_client.generate_chat_completion(
                model="gpt-oss-120b",
                messages=[{"role": "user", "content": system_prompt}],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=2048
            )
            
            # Clean up the JSON string
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            response_text = response_text.strip()
            
            # Remove trailing commas which break standard json.loads
            response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
            
            data = json.loads(response_text)
            variants = data.get("variants", [])
            
            # Ensure no full stops made it through
            for v in variants:
                if v.get("bullet_text") and v["bullet_text"].endswith("."):
                    v["bullet_text"] = v["bullet_text"][:-1]
                    
            return variants
        except Exception as e:
            print(f"Failed to generate variants JSON (attempt {attempt+1}): {e}")
            if attempt == max_retries - 1:
                return []
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
    2. BE HIGHLY PROACTIVE WITH PROXY METRICS: If they don't know exact revenue, actively suggest a proxy metric (e.g., "If you don't know the exact revenue, let's estimate the engineering hours saved or the percentage speedup?").
    3. Push for scale and context (e.g. "You built a bot. How many queries does it handle daily?").
    4. Focus on the best practices of IIT Bombay resumes: STAR format, highlighting magnitude of impact, and strong action verbs.
    5. BS DETECTION: If the user claims a highly improbable metric for a student (e.g., increased revenue by 5000%, managed a team of 50) or uses extremely vague language, professionally challenge them like a McKinsey interviewer. Ask them to refine the metric to reflect their specific, defensible contribution.
    6. Once you have solid metrics, tell them "I think we have enough to generate a great bullet now!"
    
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
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
        data = json.loads(response_text.strip())
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
