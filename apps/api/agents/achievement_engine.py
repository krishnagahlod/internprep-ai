import json
import os
import time
import json_repair
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
    {{VAULT_CONTEXT}}
    
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
    """
    
    system_prompt = system_prompt.replace("{{VAULT_CONTEXT}}", vault_context)
    
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
        print(f"Failed to parse PDF extraction JSON: {e}. Attempting repair...")
        try:
            repaired_data = json_repair.loads(response.text.strip())
            if isinstance(repaired_data, dict):
                for k, v in repaired_data.items():
                    if isinstance(v, list): return v
                return [repaired_data]
            return repaired_data if isinstance(repaired_data, list) else []
        except Exception as repair_e:
            print(f"Failed to repair JSON: {repair_e}")
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
    {{VAULT_CONTEXT}}
    
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
    """
    
    system_prompt = system_prompt.replace("{{VAULT_CONTEXT}}", vault_context)
    
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
        print(f"Failed to parse other PDF extraction JSON: {e}. Attempting repair...")
        try:
            repaired_data = json_repair.loads(response_text.strip())
            if isinstance(repaired_data, dict):
                for k, v in repaired_data.items():
                    if isinstance(v, list): return v
                return [repaired_data]
            return repaired_data if isinstance(repaired_data, list) else []
        except Exception as repair_e:
            print(f"Failed to repair JSON: {repair_e}")
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
    {{VAULT_CONTEXT}}
    
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
    """
    
    system_prompt = system_prompt.replace("{{VAULT_CONTEXT}}", vault_context)
    
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
        print(f"Failed to parse text extraction JSON: {e}. Attempting repair...")
        try:
            repaired_data = json_repair.loads(response.text.strip())
            if isinstance(repaired_data, dict):
                for k, v in repaired_data.items():
                    if isinstance(v, list): return v
                return [repaired_data]
            return repaired_data if isinstance(repaired_data, list) else []
        except Exception as repair_e:
            print(f"Failed to repair JSON: {repair_e}")
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

def generate_section_bullets(supabase_client, achievements: List[Dict[str, Any]], target_role: str, target_company: str = "", num_points: int = 3, benchmark_text: str = "") -> Dict[str, Any]:
    # Extract tags and combined descriptions for RAG
    all_tags = []
    combined_desc = ""
    for ach in achievements:
        all_tags.extend(ach.get('competency_tags', []))
        desc = ach.get('original_description', '')
        notes = ach.get('user_notes', '')
        combined_desc += f"- {ach.get('title')}: {desc}\n"
        if notes:
            combined_desc += f"  Notes: {notes}\n"
    
    # RAG context based on all achievements combined
    rag_context = get_placement_rag_context(supabase_client, target_role, combined_desc, list(set(all_tags)))
    
    # Length constraint
    if benchmark_text:
        length_constraint = f"CRITICAL LENGTH CONSTRAINT: You MUST strictly match the exact character length and density of this benchmark bullet: '{benchmark_text}'. Do not exceed its length."
    else:
        length_constraint = "CRITICAL LENGTH CONSTRAINT: Standard 1-line length (approx 13-18 words, ~120-140 chars)."

    action_verb_dictionary = """
    ELITE ACTION VERBS: Spearheaded, Architected, Orchestrated, Synthesized, Catalyzed, Engineered, Pioneered, Executed, Designed, Driven, Formulated, Accelerated.
    BANNED WEAK VERBS: Helped, Worked on, Used, Made, Did, Built (unless followed by high scale).
    """

    role_lower = target_role.lower()
    if "consult" in role_lower or "finance" in role_lower:
        set_1 = {"label": "Impact-Optimized Set", "desc": "Focus heavily on the strategic business results, revenue/cost impact, and high-level outcomes."}
        set_2 = {"label": "Leadership-Focused Set", "desc": "Focus on stakeholder management, leading teams, cross-functional alignment, and ownership."}
        variant_enum = '"strategic_impact" | "leadership"'
    elif "product" in role_lower:
        set_1 = {"label": "Growth & Metrics Set", "desc": "Focus on MAU, retention, engagement, adoption rate, and core product KPIs."}
        set_2 = {"label": "Cross-Functional Set", "desc": "Focus on leading engineering/design teams, stakeholder alignment, and product vision."}
        variant_enum = '"growth_metrics" | "cross_functional"'
    elif "software" in role_lower or "it" in role_lower:
        set_1 = {"label": "Architecture & Scale Set", "desc": "Focus heavily on system architecture, handling high TPS/scale, and infrastructure."}
        set_2 = {"label": "Optimization Set", "desc": "Focus on latency reduction, memory/cost savings, algorithm efficiency, and performance."}
        variant_enum = '"architecture_scale" | "optimization"'
    else:
        set_1 = {"label": "Impact-Heavy Set", "desc": "Focus heavily on the quantified results and business/end-user value."}
        set_2 = {"label": "Technical/Execution Set", "desc": "Focus on the specific tools, methods, frameworks, and technical execution."}
        variant_enum = '"impact_heavy" | "technical_heavy"'

    company_target = f"Specifically, the user is targeting a role at '{target_company}'." if target_company else ""

    achievements_json = json.dumps([{
        "id": a.get("id"),
        "title": a.get("title"),
        "description": a.get("original_description"),
        "metrics": a.get("quantified_metrics", {})
    } for a in achievements], indent=2)

    system_prompt = f"""
    You are an elite IIT Bombay placement resume writer. The user is targeting a '{target_role}' role. {company_target}
    The user wants exactly {num_points} elite resume bullet points generated from a group of raw achievements.
    
    {rag_context}
    
    Raw Achievements Group:
    {achievements_json}
    
    {length_constraint}
    
    {action_verb_dictionary}
    
    CRITICAL TASK INSTRUCTIONS:
    1. The user requested EXACTLY {num_points} bullets. You must output EXACTLY {num_points} bullets per variant set.
    2. Intelligent Merging: If multiple raw achievements are related (e.g. built the pipeline AND optimized it), combine them into a single dense bullet. 
    3. Exclusion: If there are more raw achievements than the target {num_points} bullets, exclude the least relevant/weakest achievements (e.g., ones lacking metrics or relevance to {target_role}). Provide reasoning for exclusion.
    4. You must generate TWO distinct variant sets:
       - Set 1: {set_1['label']} - {set_1['desc']}
       - Set 2: {set_2['label']} - {set_2['desc']}

    Return strictly a JSON object matching this exact schema:
    {{
        "variant_sets": [
            {{
                "set_label": "The set label",
                "set_description": "The set description",
                "bullets": [
                    {{
                        "variant_type": {variant_enum},
                        "bullet_text": "The generated bullet point WITHOUT ANY FULL STOP AT THE END",
                        "source_achievement_ids": ["uuid-1", "uuid-2"],
                        "merge_explanation": "Explain why these were merged or why this was chosen",
                        "recruiter_notes": "1-2 sentences on why this is strong."
                    }}
                ],
                "excluded_achievements": [
                    {{
                        "achievement_id": "uuid-5",
                        "title": "Title of excluded",
                        "reason": "Why it was excluded"
                    }}
                ]
            }}
        ]
    }}
    
    CRITICAL: 
    - Output EXACTLY {num_points} bullets in each 'bullets' array.
    - NEVER put a full stop (period) at the end of the bullet point.
    - OUTPUT STRICTLY VALID JSON. DO NOT INCLUDE TRAILING COMMAS. ESCAPE ALL DOUBLE QUOTES PROPERLY.
    """
    
    # Try Gemini first
    try:
        response = gemini_client.generate_content(
            model_name="gemini-3.5-flash",
            prompt=system_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.3)
        )
        import re
        text = response.text.strip()
        json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1).strip()
        text = re.sub(r',\s*([}\]])', r'\1', text)
        return json.loads(text)
    except Exception as e:
        print(f"Gemini generation failed for section bullets, falling back to Cerebras: {e}")
        
    # Fallback to Cerebras
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response_text = cerebras_client.generate_chat_completion(
                model="llama-3.3-70b",
                messages=[{"role": "user", "content": system_prompt}],
                temperature=0.3,
                max_tokens=2500
            )
            
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            response_text = response_text.strip()
            response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
            
            try:
                data = json.loads(response_text)
            except json.JSONDecodeError:
                # One last attempt to extract JSON if it was unparseable
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                else:
                    raise Exception("Could not parse Cerebras output as JSON")
            
            # Ensure no full stops
            for v_set in data.get("variant_sets", []):
                for v in v_set.get("bullets", []):
                    if v.get("bullet_text") and v["bullet_text"].endswith("."):
                        v["bullet_text"] = v["bullet_text"][:-1]
                        
            return data
        except Exception as e:
            print(f"Failed to generate section variants JSON via Cerebras (attempt {attempt+1}): {e}")
            if attempt == max_retries - 1:
                return {}
    return {}

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
        if "response" in data and str(data["response"]).lower().startswith("response:"):
            data["response"] = data["response"][9:].strip()
            
        return data
    except Exception as e:
        print(f"Failed to parse metric chat JSON: {e}")
        
        # Fallback cleanup just in case
        if response_text.lower().startswith("response:"):
            response_text = response_text[9:].strip()
            
        return {"response": response_text, "extracted_metrics_update": {}, "new_context_summary": ""}

def refine_bullet_with_ai(bullet_text: str, user_instruction: str, target_role: str) -> Dict[str, Any]:
    """Refines a single bullet point based on user instruction."""
    system_prompt = f"""
    You are an elite IIT Bombay placement resume writer. 
    The user wants to edit/refine a resume bullet point for a '{target_role}' role.
    
    Original Bullet: "{bullet_text}"
    User's Editing Instruction: "{user_instruction}"
    
    CRITICAL INSTRUCTIONS:
    1. Apply the user's instruction precisely to refine the bullet.
    2. Ensure the bullet still follows IIT Bombay placement rules: starts with a strong action verb, highlights scale/impact, uses active voice.
    3. DO NOT hallucinate metrics that were not originally there or provided by the user.
    4. Provide a very short 1-sentence explanation of what you changed.
    
    You must return a valid JSON object matching this schema exactly:
    {{
        "refined_bullet": "The newly edited bullet point WITHOUT ANY FULL STOP AT THE END",
        "explanation": "A short 1-sentence explanation of the change"
    }}
    
    NEVER put a full stop (period) at the end of the refined_bullet string.
    """
    
    try:
        response = gemini_client.generate_content(
            model_name="gemini-3.5-flash",
            contents=system_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.3)
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini generation failed for bullet refinement, falling back to Cerebras: {e}")
        
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=[{"role": "user", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=1000
        )
        
        # Clean up JSON
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
        return json.loads(response_text.strip())
    except Exception as e:
        print(f"Failed to refine bullet via Cerebras: {e}")
        return {"refined_bullet": bullet_text, "explanation": "Failed to refine bullet due to server error."}

def generate_resume_strategy(achievements: List[Dict[str, Any]], saved_bullets: List[Dict[str, Any]], target_role: str, target_company: str = None, job_description: str = None) -> Dict[str, Any]:
    """Analyzes the user's current vault and bank to provide a placement strategy."""
    
    target_context = f"Target Role: {target_role}"
    if target_company:
        target_context += f"\n    - Target Company: {target_company}"
    if job_description:
        target_context += f"\n    - Job Description / Requirements: {job_description}"

    system_prompt = f"""
    You are a placement strategy engine for an IIT Bombay student.
    Analyze the user's achievements and saved bullets to identify gaps, suggest a resume structure, and provide actionable advice.
    
    Input Data:
    - {target_context}
    - Number of Achievements: {len(achievements)}
    - Number of Saved Bullets: {len(saved_bullets)}
    
    Achievements Data (Summarized):
    {json.dumps([{ 'id': a.get('id'), 'title': a.get('title'), 'section': a.get('section_type'), 'parent': a.get('parent_experience'), 'tags': a.get('competency_tags', []) } for a in achievements])}
    
    Saved Bullets:
    {json.dumps([b.get('bullet_text') for b in saved_bullets])}
    
    Return a JSON object with:
    {{
        "overall_readiness_score": 0-100,
        "strengths": ["list of 2-3 strong points"],
        "critical_gaps": ["list of 2-3 missing skills/experiences for this role"],
        "action_plan": ["list of 3 actionable steps to improve the resume or which metrics to hunt down"],
        "vault_recommendations": [
            {{"achievement_id": "id from achievements list above", "reason": "Why they should generate a bullet for this specific vault item to fill a critical gap"}}
        ]
    }}
    """
    
    response = gemini_client.generate_content(
        model_name="gemini-3.5-flash",
        contents=system_prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.2)
    )
    
    try:
        return json.loads(response.text)
    except Exception as e:
        print(f"Failed to parse strategy JSON: {e}")
        return {}
