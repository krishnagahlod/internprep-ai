import json
import re

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
        data = json_repair.loads(response.text)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to parse PDF extraction JSON: {e}")
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
                
        data = json_repair.loads(response_text.strip())
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
        data = json_repair.loads(response.text)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list): return v
            return [data]
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Failed to parse text extraction JSON: {e}")
        return []

# Helper functions for Playbooks & Section Rules
def normalize_section_type(raw_section: str) -> str:
    if not raw_section:
        return "experience"
    s = raw_section.lower().strip()
    if "exp" in s or "work" in s or "intern" in s or "prof" in s:
        return "experience"
    if "proj" in s or "b.tech" in s or "btp" in s or "ddp" in s:
        return "project"
    if "por" in s or "responsib" in s or "position" in s or "lead" in s:
        return "por"
    if "scholas" in s or "acad" in s or "grade" in s or "cpi" in s or "rank" in s:
        return "scholastic"
    if "extra" in s or "cultur" in s or "sport" in s or "achieve" in s:
        return "extracurricular"
    return "experience"

def get_playbook_filename(target_role: str) -> str:
    r = target_role.lower() if target_role else "consulting"
    if "consult" in r:
        return "consulting.json"
    if "fin" in r:
        return "finance.json"
    if "prod" in r or "pm" in r:
        return "product_management.json"
    if "soft" in r or "it" in r or "swe" in r or "dev" in r:
        return "software.json"
    if "analyt" in r or "data" in r or "ds" in r:
        return "analytics.json"
    return "consulting.json"

def load_domain_playbook(target_role: str) -> Dict[str, Any]:
    filename = get_playbook_filename(target_role)
    playbook_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "strategy_playbooks", filename)
    if os.path.exists(playbook_path):
        try:
            with open(playbook_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load domain playbook {filename}: {e}")
    return {}

def load_placement_section_rules(raw_section: str = "") -> Dict[str, Any]:
    rules_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "resumes", "placement_section_rules.json")
    all_rules = {}
    if os.path.exists(rules_path):
        try:
            with open(rules_path, "r", encoding="utf-8") as f:
                all_rules = json.load(f)
        except Exception as e:
            print(f"Failed to load placement section rules: {e}")
    
    if raw_section:
        norm_key = normalize_section_type(raw_section)
        return all_rules.get(norm_key, {})
    return all_rules

def get_placement_rag_context(supabase_client, target_role: str, description: str, tags: List[str], section_type: str = "experience") -> str:
    """Fetches relevant placement-tier golden bullets to use as few-shot examples with role and section-type awareness."""
    query_embedding = get_query_embedding(description)
    if not query_embedding:
        return ""
        
    norm_section = normalize_section_type(section_type)
    
    try:
        # First attempt: match with both target_role and section_type
        response = supabase_client.rpc('match_golden_bullets_placement', {
            'query_embedding': query_embedding,
            'match_count': 8,
            'filter_section_type': norm_section,
            'filter_target_role': target_role
        }).execute()
        
        matches = response.data if response and response.data else []
        
        # If fewer than 3 matches with strict section filter, try role only
        if len(matches) < 3:
            fallback_res = supabase_client.rpc('match_golden_bullets_placement', {
                'query_embedding': query_embedding,
                'match_count': 6,
                'filter_section_type': None,
                'filter_target_role': target_role
            }).execute()
            if fallback_res and fallback_res.data:
                seen_texts = {m.get('bullet_text') for m in matches if m.get('bullet_text')}
                for m in fallback_res.data:
                    if m.get('bullet_text') not in seen_texts:
                        matches.append(m)
                        seen_texts.add(m.get('bullet_text'))
        
        # If still empty, try general golden_bullets
        if not matches:
            response = supabase_client.rpc('match_golden_bullets', {
                'query_embedding': query_embedding,
                'match_count': 5,
                'filter_section_type': norm_section,
                'filter_target_role': target_role
            }).execute()
            matches = response.data if response and response.data else []
            
        if not matches:
            return ""
            
        context = f"GOLDEN DAY 1 BENCHMARKS [{target_role.upper()} - {norm_section.upper()}] (For Inspiration):\n"
        for i, m in enumerate(matches[:8]):
            context += f"{i+1}. {m.get('bullet_text')} [Skeleton: {m.get('structural_skeleton')}]\n"
            
        return context
    except Exception as e:
        print(f"RAG fetch failed: {e}")
        return ""

def generate_bullet_variants(supabase_client, achievement: Dict[str, Any], target_role: str, target_company: str = "", benchmark_text: str = "", existing_bullets: List[str] = None, custom_instructions: str = "") -> Dict[str, Any]:
    # Extract metadata & section type
    raw_section = achievement.get('section_type', 'experience')
    norm_section = normalize_section_type(raw_section)
    
    desc = achievement.get('original_description', '')
    notes = achievement.get('user_notes', '')
    tags = achievement.get('competency_tags', [])
    combined_desc = f"{desc}\n\nAdditional Context/Notes: {notes}" if notes else desc
    
    # 1. Fetch RAG context with section awareness
    rag_context = get_placement_rag_context(supabase_client, target_role, combined_desc, tags, section_type=norm_section)
    
    # 2. Load Domain Playbook and Section Rules
    playbook = load_domain_playbook(target_role)
    display_domain = playbook.get("display_name", target_role)
    sec_allocation = playbook.get("section_allocation", {}).get(norm_section, {})
    sec_priority = sec_allocation.get("priority", "high")
    sec_guidance = sec_allocation.get("guidance", "Highlight measurable business/technical outcomes, ownership, and scale.")
    sec_emphasis = sec_allocation.get("emphasis", ["quantified_impact", "ownership"])
    sec_common_mistakes = sec_allocation.get("common_mistakes", ["Listing duties instead of accomplishments", "Vague impact without metrics"])
    
    section_rules_data = load_placement_section_rules(norm_section)
    sec_rules_list = section_rules_data.get("rules", [])
    sec_iitb_conventions = section_rules_data.get("iitb_conventions", [])
    
    formatted_mistakes = "\n".join([f"    - ⚠️ AVOID: {m}" for m in sec_common_mistakes])
    formatted_sec_rules = "\n".join([f"    - {r}" for r in sec_rules_list[:4]])
    formatted_conventions = "\n".join([f"    - {c}" for c in sec_iitb_conventions[:3]])
    
    domain_playbook_block = f"""
    DOMAIN PLAYBOOK & SECTION INTELLIGENCE ({display_domain.upper()} - {norm_section.upper()}):
    - Section Priority Level: {sec_priority.upper()}
    - Domain Target Guidance: {sec_guidance}
    - Key Competency Signals: {", ".join(sec_emphasis)}
    Common Mistakes to Avoid:
{formatted_mistakes}
    Placement & Section Rules:
{formatted_sec_rules}
{formatted_conventions}
    """

    # Setup length constraint
    if benchmark_text:
        length_constraint = f"CRITICAL LENGTH CONSTRAINT: You MUST strictly match the exact character length and density of this benchmark bullet: '{benchmark_text}'. Do not exceed its length."
    else:
        length_constraint = "CRITICAL LENGTH CONSTRAINT: Match standard 1-line length (approx 13-18 words, ~110-140 characters). NEVER exceed 1 line."

    # Setup context awareness
    context_rules = ""
    if existing_bullets:
        context_rules = f"""
    CONTEXT AWARENESS (ANTI-FRANKENSTEIN RULE):
    The user already has these bullets saved for this experience/project:
    {json.dumps(existing_bullets)}
    You MUST NOT reuse the action verbs or exact sentence structures found in these existing bullets to ensure variety.
        """

    # Setup custom strategic instructions
    user_instructions_block = ""
    if custom_instructions and custom_instructions.strip():
        user_instructions_block = f"""
    CRITICAL USER STRATEGIC DIRECTIVE & CUSTOM COMMENTS:
    "{custom_instructions.strip()}"
    
    EXECUTION RULES FOR USER DIRECTIVE:
    - You MUST actively steer, customize, and prioritize the requested technical angle, business theme, or strategic emphasis across all 4 variants.
    - STRICT GUARDRAILS: The directive shapes *what to emphasize*, but you MUST NEVER violate Day 1 elite formatting rules (Must start with elite action verb, follow Action Verb + What + How + Effect formula, preserve unrounded metrics, and never add a trailing period).
        """
        
    action_verb_dictionary = """
    ELITE ACTION VERBS: Spearheaded, Architected, Orchestrated, Synthesized, Catalyzed, Engineered, Pioneered, Executed, Designed, Driven, Formulated, Accelerated, Streamlined, Modernized, Revamped, Overhauled, Championed, Maximized, Optimized, Transformed, Automated, Directed, Guided, Mentored, Shaped.
    BANNED WEAK VERBS: Helped, Worked on, Used, Made, Did, Built (unless followed by high scale), Assisted with, Responsible for.
    CRITICAL RULE: NEVER start two bullet points with the same action verb in the same variant set. You MUST use a highly diverse vocabulary.
    """

    # Define variants dynamically based on role
    role_lower = target_role.lower()
    if "consult" in role_lower or "finance" in role_lower:
        variants_instructions = """
    1. 'strategic_impact': Focus heavily on the strategic business results, revenue/cost impact, and high-level outcomes.
    2. 'financial_roi': Focus specifically on financial metrics, cost savings, valuation, efficiency gains, or scale.
    3. 'leadership': Focus on stakeholder management, leading teams, cross-functional alignment, and initiative ownership.
    4. 'concise': A highly punchy version prioritizing extreme brevity and high density while maintaining the core outcome.
        """
        variant_enum = '"strategic_impact" | "financial_roi" | "leadership" | "concise"'
    elif "product" in role_lower:
        variants_instructions = """
    1. 'growth_metrics': Focus on MAU, retention, engagement, conversion rate, and core product KPIs.
    2. 'cross_functional': Focus on leading engineering/design teams, stakeholder alignment, user empathy, and product vision.
    3. 'go_to_market': Focus on launch success, market penetration, user feedback, and iterative validation.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"growth_metrics" | "cross_functional" | "go_to_market" | "concise"'
    elif "software" in role_lower or "it" in role_lower:
        variants_instructions = """
    1. 'architecture_scale': Focus heavily on system design, microservices, handling high TPS/scale, and infrastructure reliability.
    2. 'optimization': Focus on latency reduction, throughput, memory/cost savings, algorithm efficiency, and performance.
    3. 'feature_impact': Focus on the business/user impact of the shipped feature, technical execution, and reliability.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"architecture_scale" | "optimization" | "feature_impact" | "concise"'
    elif "analyt" in role_lower or "data" in role_lower:
        variants_instructions = """
    1. 'data_rigor': Focus on statistical modeling, dataset scale (e.g. millions of rows), ETL pipelines, and analytical depth.
    2. 'business_decision': Focus on how the data insights directly changed business strategy, ROI, or operational decisions.
    3. 'algorithm_engineering': Focus on predictive model performance (F1-score, AUC-ROC, inference latency, accuracy gains).
    4. 'concise': A highly punchy version prioritizing extreme brevity and density.
        """
        variant_enum = '"data_rigor" | "business_decision" | "algorithm_engineering" | "concise"'
    else:
        variants_instructions = """
    1. 'impact_heavy': Focus heavily on the quantified results and business/end-user value.
    2. 'leadership_heavy': Focus on ownership, stakeholder management, and driving the initiative.
    3. 'technical_heavy': Focus on the specific tools, methods, frameworks, and technical execution.
    4. 'concise': A highly punchy version prioritizing extreme brevity while maintaining the core outcome.
        """
        variant_enum = '"impact_heavy" | "leadership_heavy" | "technical_heavy" | "concise"'

    company_target = f"Specifically, the user is targeting a role at '{target_company}'." if target_company else ""

    # Generate variants using Cerebras
    system_prompt = f"""
    You are an elite IIT Bombay placement resume master and former top-tier recruiter for {display_domain}.
    The user is preparing for Day 1 placements in '{target_role}'. {company_target}
    Take their raw achievement data and generate 4 distinct, high-impact resume bullet variants tailored strictly to {display_domain} benchmarks.
    
    {domain_playbook_block}
    
    {rag_context}
    
    Raw Achievement Data:
    - Title: {achievement.get('title')}
    - Section: {raw_section} ({norm_section})
    - Context/Organization: {achievement.get('parent_experience')}
    - Description: {combined_desc}
    - Known Metrics: {json.dumps(achievement.get('quantified_metrics', {}))}
    
    {length_constraint}
    
    {context_rules}
    
    {user_instructions_block}
    
    {action_verb_dictionary}
    
    Generate 4 variants of the bullet:
    {variants_instructions}
    
    Also generate 2-3 proactive 'local_coaching_tips' for the user on how they can elevate this achievement further (e.g., specific proxy metrics to uncover, technical stack details to add, or how to pitch this in an interview).
    
    Return strictly a JSON object with this schema:
    {{
        "variants": [
            {{
                "variant_type": {variant_enum},
                "bullet_text": "The generated bullet point WITHOUT ANY FULL STOP AT THE END",
                "recruiter_notes": "1-2 sentences explaining why this bullet is elite, and actively suggesting exactly which metric could be further quantified to make it even stronger."
            }}
        ],
        "local_coaching_tips": [
            "Actionable coaching tip 1 for this achievement",
            "Actionable coaching tip 2 for this achievement"
        ]
    }}
    
    CRITICAL QUALITY RULES:
    - Follow standard Day 1 resume rules (Start with strong elite action verb, quantify, single line).
    - Strict Bullet Formula: Unless the effect is massive, every point MUST strictly follow this exact chronological sequence: [Elite Action Verb] + [What you did] + [How you did it (Tools/Skills)] + [Quantified Effect/Result].
    - Massive Effect Inversion: If the achievement contains a massive business impact (e.g., millions in revenue, massive scale, critical system rescue), you MUST invert the formula to front-load the result: [Elite Action Verb] + [Massive Quantified Effect] + by [What you did] + [How you did it].
    - Anti-Rounding Metric Rule: NEVER round numbers to clean intervals (e.g., avoid 20%, 50x, 5,000). Use exact, highly specific numbers (e.g., 17.4%, 48x, 4,132) to maximize believability. Preserve the exact unrounded metrics provided by the user.
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
                temperature=0.4,
                max_tokens=2048
            )
            
            # Clean up the JSON string

            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            response_text = response_text.strip()
            
            # Remove trailing commas which break standard json.loads
            response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
            
            data = json_repair.loads(response_text)
            
            if isinstance(data, str):

                try:
                    data = json.loads(data)
                except Exception:
                    # Attempt a final regex extraction if pure string

                    match = re.search(r'(\{.*\})', data, re.DOTALL)
                    if match:
                        try:
                            data = json.loads(match.group(1))
                        except Exception:
                            data = {}
                    else:
                        data = {}
            if not isinstance(data, dict):
                data = {}
                
            variants = data.get("variants", [])
            coaching_tips = data.get("local_coaching_tips", [])
            
            # Ensure no full stops made it through
            for v in variants:
                if v.get("bullet_text") and v["bullet_text"].endswith("."):
                    v["bullet_text"] = v["bullet_text"][:-1]
                # Attach coaching tips to variants for backwards compatibility
                if coaching_tips:
                    v["coaching_tips"] = coaching_tips
                    
            return {
                "variants": variants,
                "coaching_tips": coaching_tips
            }
        except Exception as e:
            print(f"Failed to generate variants JSON (attempt {attempt+1}): {e}")
            if attempt == max_retries - 1:
                return {"variants": [], "coaching_tips": []}
    return {"variants": [], "coaching_tips": []}

def generate_section_bullets(supabase_client, achievements: List[Dict[str, Any]], target_role: str, target_company: str = "", num_points: int = 3, benchmark_text: str = "", custom_instructions: str = "") -> Dict[str, Any]:
    # Extract tags and combined descriptions for RAG
    all_tags = []
    combined_desc = ""
    section_types = [a.get('section_type', 'experience') for a in achievements if a.get('section_type')]
    dominant_section = max(set(section_types), key=section_types.count) if section_types else "experience"
    norm_section = normalize_section_type(dominant_section)
    
    for ach in achievements:
        all_tags.extend(ach.get('competency_tags', []))
        desc = ach.get('original_description', '')
        notes = ach.get('user_notes', '')
        combined_desc += f"- {ach.get('title')}: {desc}\n"
        if notes:
            combined_desc += f"  Notes: {notes}\n"
    
    # 1. RAG context based on all achievements combined with section awareness
    rag_context = get_placement_rag_context(supabase_client, target_role, combined_desc, list(set(all_tags)), section_type=norm_section)
    
    # 2. Load Domain Playbook & Section Rules
    playbook = load_domain_playbook(target_role)
    display_domain = playbook.get("display_name", target_role)
    sec_allocation = playbook.get("section_allocation", {}).get(norm_section, {})
    sec_priority = sec_allocation.get("priority", "high")
    sec_guidance = sec_allocation.get("guidance", "Highlight measurable business/technical outcomes, ownership, and scale.")
    sec_emphasis = sec_allocation.get("emphasis", ["quantified_impact", "ownership"])
    sec_common_mistakes = sec_allocation.get("common_mistakes", ["Listing duties instead of accomplishments", "Vague impact without metrics"])
    
    section_rules_data = load_placement_section_rules(norm_section)
    sec_rules_list = section_rules_data.get("rules", [])
    sec_iitb_conventions = section_rules_data.get("iitb_conventions", [])
    
    formatted_mistakes = "\n".join([f"    - ⚠️ AVOID: {m}" for m in sec_common_mistakes])
    formatted_sec_rules = "\n".join([f"    - {r}" for r in sec_rules_list[:4]])
    formatted_conventions = "\n".join([f"    - {c}" for c in sec_iitb_conventions[:3]])
    
    domain_playbook_block = f"""
    DOMAIN PLAYBOOK & SECTION COMPOSITION INTELLIGENCE ({display_domain.upper()} - {norm_section.upper()}):
    - Section Priority Level: {sec_priority.upper()}
    - Domain Target Guidance: {sec_guidance}
    - Key Competency Signals: {", ".join(sec_emphasis)}
    Common Mistakes to Avoid:
{formatted_mistakes}
    Placement & Section Rules:
{formatted_sec_rules}
{formatted_conventions}
    """

    # Length constraint
    if benchmark_text:
        length_constraint = f"CRITICAL LENGTH CONSTRAINT: You MUST strictly match the exact character length and density of this benchmark bullet: '{benchmark_text}'. Do not exceed its length."
    else:
        length_constraint = "CRITICAL LENGTH CONSTRAINT: Standard 1-line length (approx 13-18 words, ~110-140 chars per bullet)."

    # Setup custom strategic instructions for section composition
    user_instructions_block = ""
    if custom_instructions and custom_instructions.strip():
        user_instructions_block = f"""
    CRITICAL USER STRATEGIC DIRECTIVE & CUSTOM COMMENTS FOR SECTION COMPOSITION:
    "{custom_instructions.strip()}"
    
    EXECUTION RULES FOR SECTION DIRECTIVE:
    - Use this directive to actively determine which achievements to highlight, how to intelligently merge related points, and how to frame the narrative across the {num_points} bullets in the section.
    - STRICT GUARDRAILS: All generated points must strictly start with elite action verbs, follow the elite bullet formula, preserve unrounded metrics, and have zero trailing periods.
        """

    action_verb_dictionary = """
    ELITE ACTION VERBS: Spearheaded, Architected, Orchestrated, Synthesized, Catalyzed, Engineered, Pioneered, Executed, Designed, Driven, Formulated, Accelerated, Streamlined, Modernized, Revamped, Overhauled, Championed, Maximized, Optimized, Transformed, Automated, Directed, Guided, Mentored, Shaped.
    BANNED WEAK VERBS: Helped, Worked on, Used, Made, Did, Built (unless followed by high scale), Assisted with, Responsible for.
    CRITICAL RULE: NEVER start two bullet points with the same action verb in the same variant set. You MUST use a highly diverse vocabulary to ensure no repetition across all bullets in the section.
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
    elif "analyt" in role_lower or "data" in role_lower:
        set_1 = {"label": "Insight & Strategy Set", "desc": "Focus on actionable insights that drove major business decisions and measurable ROI."}
        set_2 = {"label": "Modeling & Rigor Set", "desc": "Focus on technical ML modeling metrics, data scale, and algorithmic improvements."}
        variant_enum = '"data_rigor" | "business_decision"'
    else:
        set_1 = {"label": "Impact-Heavy Set", "desc": "Focus heavily on the quantified results and business/end-user value."}
        set_2 = {"label": "Technical/Execution Set", "desc": "Focus on the specific tools, methods, frameworks, and technical execution."}
        variant_enum = '"impact_heavy" | "technical_heavy"'

    company_target = f"Specifically, the user is targeting a role at '{target_company}'." if target_company else ""

    achievements_json = json.dumps([{
        "id": a.get("id"),
        "title": a.get("title"),
        "section": a.get("section_type", norm_section),
        "description": a.get("original_description"),
        "metrics": a.get("quantified_metrics", {})
    } for a in achievements], indent=2)

    system_prompt = f"""
    You are an elite IIT Bombay placement resume writer and expert recruiter for {display_domain}.
    The user is targeting a '{target_role}' role for Day 1 campus placements. {company_target}
    The user wants exactly {num_points} elite resume bullet points generated from a group of raw achievements in the {norm_section} section.
    
    {domain_playbook_block}
    
    {rag_context}
    
    Raw Achievements Group:
    {achievements_json}
    
    {length_constraint}
    
    {user_instructions_block}
    
    {action_verb_dictionary}
    
    CRITICAL SECTION OVERVIEW LINE INSTRUCTIONS (TOP ITALICIZED 1-LINER):
    In elite IIT Bombay placement resumes, every major experience, project, POR, or entrepreneurship section begins with a single, high-impact italicized overview line immediately below the organization/role heading.

    For each variant set, you MUST generate:
    1. "overview_line": The primary 1-line overview best aligned with this set's theme.
    2. "overview_line_variants": Exactly 3 distinct stylistic options:
       - Type "scope_mission": High-level scope, problem statement, product/system built, and primary technical/business mandate (e.g. "Developed an internal GenAI PoV establishing a framework for reliable, secure conversational AI agents on Google's CXAS", "Contributed to EdMe's AI-based learning app for competitive exams through UI & UX research, design and development").
       - Type "recognition_prestige": Accolades, partner/CSO commendations, Letter of Recommendation, grant amounts, or client/market valuation (e.g. "Received Letter of Recommendation from the CSO of the $40+ Billion Hinduja Group for exemplary performance", "Incubated at SINE, IIT Bombay | Awarded the Institute of Eminence grant of 0.6M & IDEAS grant of 0.3M", "Healthcare Market Entry | Facilitated the entry of a top 10 Indian conglomerate into the USD 630B+ market").
       - Type "scale_leadership": Multi-tiered team leadership, selection/nomination ratio, cross-functional footprint, or organizational scale (e.g. "Highest Nominated Student Representative (2/13k+) | Leading a 3-tiered 20+ member student-team", "Worked directly under the India Head of Supply Chain for the Electrification & Distribution Solutions Division").

    SECTION-SPECIFIC OVERVIEW GUIDELINES:
    - If section is 'experience' / 'internship': Prioritize client scale, market entry, LoR, partner praise, or high-level project mandate.
    - If section is 'por' / 'leadership' / 'extracurricular': Prioritize election/nomination ratio (e.g. 2/13k+), team hierarchy (e.g. 3-tiered 20+ members), or student reach (10k+ students).
    - If section is 'project' / 'research': Prioritize professor/lab affiliation, tech stack scope, or research topic (e.g. "Prof. Chintan Amrit | Faculty of Economics & Business Analytics, University of Amsterdam").
    - If section is 'entrepreneurship': Prioritize incubation (e.g. SINE, IIT Bombay), grants (e.g. 0.6M & 0.3M), and core platform premise.

    CRITICAL SECTION COMPOSITION INSTRUCTIONS:
    1. Output EXACTLY {num_points} bullets per variant set.
    2. Chronological & Impact Ordering: Order the sub-points strategically—lead with the broadest scope or highest business/technical impact as Bullet #1.
    3. Intelligent Merging: If multiple raw achievements are related (e.g. built the pipeline AND optimized it), combine them into a single dense bullet.
    4. Exclusion with Reasoning: If there are more raw achievements than the target {num_points} bullets, exclude the least relevant/weakest achievements. Provide crisp reasoning.
    5. Generate TWO distinct variant sets:
       - Set 1: {set_1['label']} - {set_1['desc']}
       - Set 2: {set_2['label']} - {set_2['desc']}
    6. Provide 2-3 proactive 'local_coaching_tips' on how this entire section can be presented most effectively in a 1-page resume and in interviews.

    Return strictly a JSON object matching this exact schema:
    {{
        "variant_sets": [
            {{
                "set_label": "The set label",
                "set_description": "The set description",
                "overview_line": "The primary overview line WITHOUT ANY FULL STOP AT THE END",
                "overview_line_variants": [
                    {{
                        "type": "scope_mission",
                        "label": "Scope & Core Mission",
                        "text": "1-line overview focusing on core scope and problem statement WITHOUT FULL STOP"
                    }},
                    {{
                        "type": "recognition_prestige",
                        "label": "Recognition & LoR Context",
                        "text": "1-line overview focusing on LoR, partner praise, grants, or client/market valuation WITHOUT FULL STOP"
                    }},
                    {{
                        "type": "scale_leadership",
                        "label": "Scale & Team Architecture",
                        "text": "1-line overview focusing on election ratio, team size, or high-profile reporting line WITHOUT FULL STOP"
                    }}
                ],
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
        ],
        "local_coaching_tips": [
            "Section-level coaching tip 1 (e.g., ordering or interview narrative advice)",
            "Section-level coaching tip 2"
        ]
    }}
    
    CRITICAL: 
    - Output EXACTLY {num_points} bullets in each 'bullets' array.
    - Strict Bullet Formula: Unless the effect is massive, every point MUST strictly follow this exact chronological sequence: [Elite Action Verb] + [What you did] + [How you did it (Tools/Skills)] + [Quantified Effect/Result].
    - Massive Effect Inversion: If the achievement contains a massive business impact, front-load the result: [Elite Action Verb] + [Massive Quantified Effect] + by [What you did] + [How you did it].
    - Anti-Rounding Metric Rule: NEVER round numbers to clean intervals (e.g., avoid 20%, 50x, 5,000). Use exact, highly specific numbers (e.g., 17.4%, 48x, 4,132) to maximize believability.
    - NEVER put a full stop (period) at the end of the overview line or bullet points.
    - OUTPUT STRICTLY VALID JSON. DO NOT INCLUDE TRAILING COMMAS. ESCAPE ALL DOUBLE QUOTES PROPERLY.
    """
    
    # Generate section bullets via Cerebras
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response_text = cerebras_client.generate_chat_completion(
                model="gpt-oss-120b",
                messages=[{"role": "user", "content": system_prompt}],
                temperature=0.3,
                max_tokens=2500
            )
            

            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            response_text = response_text.strip()
            response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
            data = json_repair.loads(response_text)
            
            if isinstance(data, str):

                try:
                    data = json.loads(data)
                except Exception:
                    pass

            if isinstance(data, dict) and "variant_sets" in data:
                for v_set in data.get("variant_sets", []):
                    if v_set.get("overview_line") and v_set["overview_line"].endswith("."):
                        v_set["overview_line"] = v_set["overview_line"][:-1]
                    for ov in v_set.get("overview_line_variants", []):
                        if ov.get("text") and ov["text"].endswith("."):
                            ov["text"] = ov["text"][:-1]
                    for v in v_set.get("bullets", []):
                        if v.get("bullet_text") and v["bullet_text"].endswith("."):
                            v["bullet_text"] = v["bullet_text"][:-1]
                return data
        except Exception as e:
            print(f"Failed to generate section variants JSON via Cerebras (attempt {attempt+1}): {e}")
            if attempt == max_retries - 1:
                # Fallback to Gemini if Cerebras encounters unexpected issue
                try:
                    response = gemini_client.generate_content(
                        model_name="gemini-3.5-flash",
                        prompt=system_prompt,
                        generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.3)
                    )

                    text = response.text.strip()
                    json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', text, re.DOTALL)
                    if json_match:
                        text = json_match.group(1).strip()
                    text = re.sub(r',\s*([}\]])', r'\1', text)
                    data = json_repair.loads(text)
                    if isinstance(data, dict) and "variant_sets" in data:
                        for v_set in data.get("variant_sets", []):
                            if v_set.get("overview_line") and v_set["overview_line"].endswith("."):
                                v_set["overview_line"] = v_set["overview_line"][:-1]
                            for ov in v_set.get("overview_line_variants", []):
                                if ov.get("text") and ov["text"].endswith("."):
                                    ov["text"] = ov["text"][:-1]
                            for v in v_set.get("bullets", []):
                                if v.get("bullet_text") and v["bullet_text"].endswith("."):
                                    v["bullet_text"] = v["bullet_text"][:-1]
                        return data
                except Exception as fallback_err:
                    print(f"Gemini fallback also failed: {fallback_err}")
                return {"variant_sets": [], "local_coaching_tips": []}
    return {"variant_sets": [], "local_coaching_tips": []}

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

def extract_final_resume_bullets(pdf_bytes: bytes = None, raw_text: str = None) -> List[Dict[str, Any]]:
    """Extracts exact finalized resume sections, overview lines, and bullet points from a finalized domain resume."""
    system_prompt = """
    You are an elite resume parser specialized in IIT Bombay placement resumes.
    Extract the complete, exact structure, parent organizations/projects, italicized overview lines, and bullet points from this finalized resume.
    
    CRITICAL INSTRUCTIONS:
    1. Identify all major sections (e.g. 'Professional Experience', 'Projects', 'Positions of Responsibility', 'Extracurricular Activities', 'Scholastic Achievements').
    2. Under each section, extract every parent organization or project:
       - 'parent_experience': The Company, Organization, or Project title (e.g. 'McKinsey & Company', 'ABB India', 'Hyperloop Pod Competition').
       - 'role': Designation or role if present (e.g. 'Summer Associate', 'Overall Coordinator').
       - 'timeline': Dates if present (e.g. 'May 2025 - Jul 2025').
       - 'overview_line': The top italicized/overview line directly under the title if present (e.g., 'Healthcare Market Entry | Facilitated the entry of a top 10 Indian conglomerate into the USD 630B+ market'). If none, leave as empty string.
       - 'bullets': Array of strings containing the EXACT bullet points as written in the resume. Do NOT summarize or shorten them. Keep exact numbers, tools, and phrasing.
    
    Return STRICTLY a JSON array of section objects matching this schema:
    [
      {
        "section_type": "Professional Experience",
        "parent_experience": "Boston Consulting Group",
        "role": "Summer Associate",
        "timeline": "May 2025 - Jul 2025",
        "overview_line": "Healthcare Market Entry | Facilitated entry of top 10 conglomerate into USD 630B+ market",
        "bullets": [
          "Crafted a 14-specialty Centres of Excellence strategy channelising investments of INR 350M",
          "Synthesized 10+ competitor benchmarks and market trends across 15 operational KPIs"
        ]
      }
    ]
    """
    
    # Try Gemini if pdf_bytes
    if pdf_bytes:
        try:
            response = gemini_client.generate_content(
                model_name="gemini-3.5-flash",
                prompt=system_prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1),
                pdf_bytes=pdf_bytes
            )
            data = json_repair.loads(response.text)
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, list): return v
                return [data]
            return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Gemini PDF extraction failed for final resume: {e}")
            import fitz
            try:
                pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                raw_text = ""
                for page_num in range(pdf_doc.page_count):
                    raw_text += pdf_doc[page_num].get_text()
                pdf_doc.close()
            except Exception as fitz_err:
                print(f"PyMuPDF fallback failed: {fitz_err}")
                return []
                
    if raw_text:
        try:
            full_prompt = f"{system_prompt}\n\nRESUME TEXT:\n{raw_text}"
            response_text = cerebras_client.generate_chat_completion(
                model="gpt-oss-120b",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.1,
                max_tokens=3500
            )

            json_match = re.search(r'```(?:json)?\s*(\[.*\]|\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            data = json_repair.loads(response_text)
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(v, list): return v
                return [data]
            return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Cerebras extraction failed for final resume text: {e}")
            return []
            
    return []

def refine_bullet_with_ai(
    bullet_text: str,
    user_instruction: str,
    target_role: str,
    preserve_length: bool = False,
    target_char_length: int = None
) -> Dict[str, Any]:
    """Refines a single bullet point based on user instruction, with strict character-length preservation if requested."""
    
    target_len = target_char_length or len(bullet_text)
    length_constraint_block = ""
    if preserve_length or target_char_length is not None:
        min_len = max(25, target_len - 8)
        max_len = target_len + 4
        length_constraint_block = f"""
    CRITICAL STRICT LENGTH PRESERVATION CONSTRAINT (NO LINE OVERFLOW):
    - Original Bullet: "{bullet_text}"
    - Original Character Count: {target_len} characters ({len(bullet_text.split())} words).
    - This point is extracted from the user's finalized 1-page placement resume.
    - In standard LaTeX / Word 1-page resume templates, exceeding this length causes an unwanted line-wrap that destroys page alignment.
    - YOUR REFINED BULLET MUST STRICTLY BE BETWEEN {min_len} AND {max_len} CHARACTERS IN TOTAL LENGTH.
    - Count characters precisely before outputting. Under no circumstances should the length exceed {max_len} characters.
    """
    
    system_prompt = f"""
    You are an elite IIT Bombay placement resume writer. 
    The user wants to edit/refine a resume bullet point for a '{target_role}' role.
    
    Original Bullet: "{bullet_text}"
    User's Editing Instruction: "{user_instruction}"
    
    {length_constraint_block}
    
    CRITICAL INSTRUCTIONS:
    1. Apply the user's instruction precisely to refine the bullet.
    2. Ensure the bullet still follows IIT Bombay placement rules: starts with a strong action verb, highlights scale/impact, uses active voice.
    3. Strict Bullet Formula: Unless the effect is massive, every point MUST strictly follow this exact chronological sequence: [Elite Action Verb] + [What you did] + [How you did it (Tools/Skills)] + [Quantified Effect/Result].
    4. Massive Effect Inversion: If the achievement contains a massive business impact, you MUST invert the formula to front-load the result: [Elite Action Verb] + [Massive Quantified Effect] + by [What you did] + [How you did it].
    5. Anti-Rounding Metric Rule: NEVER round numbers to clean intervals (e.g., avoid 20%, 50x, 5,000). Use exact, highly specific numbers (e.g., 17.4%, 48x, 4,132) to maximize believability. Preserve the exact unrounded metrics provided by the user.
    6. DO NOT hallucinate metrics that were not originally there or provided by the user.
    7. Provide a very short 1-sentence explanation of what you changed.
    
    You must return a valid JSON object matching this schema exactly:
    {{
        "refined_bullet": "The newly edited bullet point WITHOUT ANY FULL STOP AT THE END",
        "explanation": "A short 1-sentence explanation of the change"
    }}
    
    NEVER put a full stop (period) at the end of the refined_bullet string.
    """
    
    # Generate refinement via Cerebras gpt-oss-120b
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=[{"role": "user", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
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
                
        data = json_repair.loads(response_text.strip())
        if isinstance(data, dict) and "refined_bullet" in data:
            if data["refined_bullet"].endswith("."):
                data["refined_bullet"] = data["refined_bullet"][:-1]
            return data
    except Exception as e:
        print(f"Cerebras refinement failed, falling back to Gemini: {e}")
        
    try:
        response = gemini_client.generate_content(
            model_name="gemini-3.5-flash",
            contents=system_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.3)
        )
        data = json_repair.loads(response.text)
        if isinstance(data, dict) and "refined_bullet" in data:
            if data["refined_bullet"].endswith("."):
                data["refined_bullet"] = data["refined_bullet"][:-1]
            return data
    except Exception as e:
        print(f"Gemini fallback also failed: {e}")
        
    return {"refined_bullet": bullet_text, "explanation": "Failed to refine bullet due to server error."}

def generate_resume_strategy(data_source: str, achievements: List[Dict[str, Any]], saved_bullets: List[Dict[str, Any]], target_role: str, rag_context: List[Dict[str, Any]], target_company: str = None, job_description: str = None) -> Dict[str, Any]:
    """Analyzes the user's current vault and bank to provide a detailed placement strategy using domain playbooks and RAG."""
    
    # Load playbook
    playbook_data = load_domain_playbook(target_role)
    display_domain = playbook_data.get("display_name", target_role)
            
    target_context = f"Target Role: {target_role} ({display_domain})"
    if target_company:
        target_context += f"\n    - Target Company: {target_company}"
    if job_description:
        target_context += f"\n    - Job Description / Requirements: {job_description}"

    system_prompt = f"""
    You are an elite IIT Bombay placement strategy engine and former hiring committee member for {display_domain}.
    Analyze the user's achievements and saved bullets against the {display_domain} domain playbook and provide an exhaustive, highly actionable resume strategy report.
    
    Data Source Analyzed: {data_source}
    - Number of Achievements in Vault: {len(achievements)}
    - Number of Saved Bullets in Point Bank: {len(saved_bullets)}
    
    Target Context:
    {target_context}
    
    Domain Playbook Context:
    {json.dumps(playbook_data, indent=2)}
    
    User Achievements (Vault):
    {json.dumps([{ 'id': a.get('id'), 'title': a.get('title'), 'section': a.get('section_type'), 'parent': a.get('parent_experience'), 'tags': a.get('competency_tags', []), 'metrics': a.get('quantified_metrics', {}) } for a in achievements])}
    
    User Saved Bullets (Point Bank):
    {json.dumps([{'id': b.get('id'), 'bullet_text': b.get('bullet_text'), 'section': b.get('section_type')} for b in saved_bullets])}
    
    RAG Context (Comparison to successful senior Day 1 resumes):
    {json.dumps(rag_context, indent=2)}
    
    INSTRUCTIONS:
    Output MUST be a JSON object strictly matching this schema:
    {{
      "domain": "{display_domain}",
      "overall_readiness_score": 0-100,
      "overall_guidance": "High-level strategic guidance on what to prioritize to maximize Day 1 shortlisting chances",
      "global_coaching_roadmap": [
        {{
          "step_number": 1,
          "title": "Short title of action",
          "section": "experience|projects|por|scholastic|extracurricular|general",
          "priority": "critical|high|medium",
          "description": "Clear explanation of what the user needs to build or fix next",
          "action_type": "metric_lab|compose_section|generate_bullet|reorder"
        }}
      ],
      "section_density_targets": [
        {{
          "section": "experience|projects|por|scholastic|extracurricular",
          "current_count": 0,
          "target_min": 3,
          "target_max": 6,
          "status": "optimal|needs_more|over_limit",
          "reasoning": "Why this specific count is ideal for this user's profile and target role"
        }}
      ],
      "section_analysis": [
        {{
          "section": "experience|projects|por|scholastic|extracurricular",
          "priority_level": "critical|high|medium|low",
          "domain_guidance": "What the playbook says about this section",
          "user_points": [
            {{
              "point_id": "uuid of the bullet or achievement",
              "bullet_text": "The text being evaluated",
              "verdict": "keep|needs_rework|cut",
              "reasoning": "Why this verdict",
              "refine_instruction": "Instruction to pass to the AI Refine tool to fix it (if needs_rework), else null"
            }}
          ]
        }}
      ],
      "competency_coverage": [
        {{
          "theme": "name of competency theme from playbook",
          "domain_weight": 0.0-1.0,
          "user_coverage": 0.0-1.0,
          "gap_assessment": "Assessment of user coverage vs domain ideal",
          "suggested_action": "Actionable advice"
        }}
      ],
      "phrasing_alerts": [
        {{
          "point_id": "uuid",
          "issue": "weak_verb|missing_metric|structure",
          "detail": "What is wrong",
          "refine_instruction": "Instruction to fix"
        }}
      ]
    }}
    """
    
    # Try Gemini 3.5 Flash first
    try:
        response = gemini_client.generate_content(
            model_name="gemini-3.5-flash",
            prompt=system_prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.2)
        )
        data = json_repair.loads(response.text)
        if isinstance(data, dict) and "overall_readiness_score" in data:
            return data
    except Exception as e:
        print(f"Gemini strategy generation failed, falling back to Cerebras: {e}")
        
    # Fallback to Cerebras
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=[{"role": "user", "content": system_prompt}],
            temperature=0.2,
            max_tokens=4000
        )

        json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        response_text = response_text.strip()
        response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
        data = json_repair.loads(response_text)
        return data if isinstance(data, dict) else {}
    except Exception as e:
        print(f"Failed to parse strategy JSON: {e}")
        return {}


