import os
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai
import json_repair

# Domain Keywords & Competency Taxonomy
DOMAIN_TAXONOMY = {
    "consulting": {
        "label": "Management Consulting",
        "critical_keywords": [
            "Market Sizing", "Market Entry", "Benchmarking", "Financial Modeling", "Due Diligence",
            "Competitor Analysis", "Cost Optimization", "Supply Chain", "Go-to-Market", "Stakeholder Management",
            "Strategic Roadmapping", "Profitability Analysis", "Unit Economics", "Root Cause Analysis", "Risk Assessment"
        ],
        "important_keywords": [
            "Revenue Growth", "EBITDA Improvement", "Operational Efficiency", "Cross-Functional Leadership",
            "Hypothesis-Driven", "Framework", "Client Engagement", "Executive Presentation", "Capex / Opex", "Turnaround"
        ],
        "action_verbs": [
            "Spearheaded", "Orchestrated", "Formulated", "Synthesized", "Restructured",
            "Streamlined", "Negotiated", "Pioneered", "Championed", "Accelerated"
        ]
    },
    "software": {
        "label": "Software Engineering / IT",
        "critical_keywords": [
            "Data Structures", "Algorithms", "System Design", "Microservices", "REST APIs",
            "Python", "C++", "Java", "TypeScript", "React", "Node.js", "Docker",
            "Kubernetes", "AWS", "GCP", "PostgreSQL", "MongoDB", "Redis", "Distributed Systems"
        ],
        "important_keywords": [
            "CI/CD", "Unit Testing", "Low Latency", "High Throughput", "Concurrency",
            "Multithreading", "GraphQL", "Kafka", "Scalability", "Optimization", "Git"
        ],
        "action_verbs": [
            "Architected", "Engineered", "Implemented", "Optimized", "Refactored",
            "Automated", "Deployed", "Benchmarked", "Containerized", "Integrated"
        ]
    },
    "product_management": {
        "label": "Product Management",
        "critical_keywords": [
            "Product Roadmapping", "A/B Testing", "User Stories", "PRD", "Retention Rate",
            "DAU/MAU", "Customer Journey", "Wireframing", "Figma", "Go-To-Market",
            "Feature Prioritization", "RICE Framework", "User Research", "Funnel Conversion", "Cohort Analysis"
        ],
        "important_keywords": [
            "Product Analytics", "North Star Metric", "Churn Reduction", "Sprint Planning",
            "Stakeholder Alignment", "Product Market Fit", "User Feedback", "MVP", "Monetization"
        ],
        "action_verbs": [
            "Conceptualized", "Launched", "Prioritized", "Defined", "Iterated",
            "Analyzed", "Spearheaded", "Scaled", "Conducted", "Validated"
        ]
    },
    "finance": {
        "label": "Finance / Investment Banking",
        "critical_keywords": [
            "Financial Modeling", "DCF", "Discounted Cash Flow", "LBO", "Comparable Companies",
            "Valuation", "M&A", "Portfolio Optimization", "Capital Structure", "Risk-Adjusted Return",
            "EBITDA", "P&L", "Balance Sheet", "Cash Flow", "Bloomberg", "Asset Allocation"
        ],
        "important_keywords": [
            "Due Diligence", "Credit Analysis", "Derivatives", "Fixed Income", "Equities",
            "Monte Carlo", "Financial Statements", "Equity Research", "Alpha", "Sharpe Ratio"
        ],
        "action_verbs": [
            "Modeled", "Valued", "Analyzed", "Forecasted", "Structured",
            "Assessed", "Executed", "Optimized", "Evaluated", "Underwrote"
        ]
    },
    "analytics": {
        "label": "Data Science & Analytics",
        "critical_keywords": [
            "Machine Learning", "Statistical Modeling", "Predictive Analytics", "Deep Learning",
            "NLP", "Computer Vision", "Python", "Pandas", "NumPy", "Scikit-Learn",
            "SQL", "PyTorch", "TensorFlow", "ETL Pipelines", "Feature Engineering", "Tableau", "PowerBI"
        ],
        "important_keywords": [
            "A/B Testing", "Hypothesis Testing", "Spark", "Hadoop", "AUC-ROC",
            "F1-Score", "RMSE", "Model Deployment", "Data Cleaning", "Clustering", "Regression"
        ],
        "action_verbs": [
            "Developed", "Trained", "Evaluated", "Extracted", "Visualized",
            "Clustered", "Predicted", "Formulated", "Engineered", "Discovered"
        ]
    }
}

# Weak Action Verbs & Passive Fillers
WEAK_VERBS = [
    "worked on", "helped", "assisted", "responsible for", "participated in",
    "involved in", "handled", "looked after", "tried to", "supported",
    "contributed to", "did", "made", "used", "got", "took part"
]

# Prohibited Rank Regex Patterns (Current IITB Placement Policy)
PROHIBITED_RANK_PATTERNS = [
    (r"\b(?:All\s*India\s*Rank|AIR)\s*#?\s*:?\s*\d+\b", "All India Rank (AIR) Mention"),
    (r"\b(?:JEE|IIT-?JEE|Joint Entrance Examination)\s*(?:Advanced|Mains)?(?:\s*(?:AIR|Rank|rank))?\s*#?\s*:?\s*\d+\b", "JEE Rank Mention"),
    (r"\b(?:JEE|IIT-?JEE|Joint Entrance Examination)\s*(?:Advanced|Mains)\b[^\n\.\,]*\b(?:rank|AIR|standing)\s*#?\s*:?\s*\d+\b", "JEE Rank Mention"),
    (r"\b(?:Department|Branch|Batch)\s*(?:Rank|Position|Ranker|DR)\s*#?\s*:?\s*\d+\b", "Department/Branch Rank Mention"),
    (r"\bState\s*(?:Rank|Entrance|CET|MHT-?CET|WBJEE)\s*(?:Rank|AIR|#)?\s*:?\s*\d+\b", "State Exam Rank Mention"),
    (r"\bRanked\s*\d+(?:st|nd|rd|th)?\s*(?:in|amongst|across)\s*(?:the\s*)?(?:department|branch|state|batch|jee)\b", "Relative Batch/Branch Rank Mention")
]


def fallback_extract_sections_and_bullets(raw_text: str) -> List[Dict[str, Any]]:
    """Deterministic fallback parser extracting sections and bullets when LLM is offline."""
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    sections = []
    current_sec = {"section_type": "Experience", "bullets": [], "overview_line": ""}
    
    header_patterns = {
        "experience": ["PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EXPERIENCE", "INTERNSHIPS"],
        "project": ["PROJECTS", "KEY PROJECTS", "ACADEMIC PROJECTS", "TECHNICAL PROJECTS"],
        "por": ["POSITIONS OF RESPONSIBILITY", "LEADERSHIP", "RESPONSIBILITIES"],
        "scholastic": ["SCHOLASTIC ACHIEVEMENTS", "ACADEMIC ACHIEVEMENTS", "ACHIEVEMENTS", "HONORS"],
        "extracurricular": ["EXTRACURRICULAR ACTIVITIES", "EXTRACURRICULARS", "EXTRA CURRICULAR", "ACTIVITIES"]
    }
    
    for line in lines:
        upper = line.upper().strip(":# -_")
        matched_type = None
        for stype, headers in header_patterns.items():
            if any(upper == h or upper.startswith(h) for h in headers):
                matched_type = stype
                break
        if matched_type:
            if current_sec["bullets"]:
                sections.append(current_sec)
            current_sec = {"section_type": matched_type, "bullets": [], "overview_line": ""}
        elif line.startswith("-") or line.startswith("•") or line.startswith("*") or line.startswith("–"):
            b_text = line.lstrip("-•*– ").strip()
            if b_text:
                current_sec["bullets"].append(b_text)
        elif "|" in line and len(line) < 120 and not current_sec["overview_line"]:
            current_sec["overview_line"] = line
        elif len(line) > 35:
            current_sec["bullets"].append(line)
            
    if current_sec["bullets"]:
        sections.append(current_sec)
        
    return sections



def extract_text_from_pdf_stream(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF bytes using PyMuPDF / pdfminer."""
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text.strip()
    except Exception as e:
        print(f"PyMuPDF extraction fallback: {e}")
        try:
            from pdfminer.high_level import extract_text
            import io
            return extract_text(io.BytesIO(pdf_bytes)).strip()
        except Exception as e2:
            print(f"pdfminer fallback failed: {e2}")
            return ""


def evaluate_ats_parseability(pdf_bytes: Optional[bytes], raw_text: str, parsed_sections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Pillar 1: ATS Parseability & Technical Hygiene (0-100)."""
    score = 100
    issues = []
    checks = []
    
    # 1. Text Layer Extractability
    char_count = len(raw_text)
    if char_count < 300:
        score -= 40
        issues.append("Resume appears to be scanned or contains very little extractable text. ATS parsers cannot read images.")
        checks.append({"name": "Extractable Text Layer", "passed": False, "detail": "Less than 300 characters detected"})
    else:
        checks.append({"name": "Extractable Text Layer", "passed": True, "detail": f"{char_count} characters cleanly extracted"})
        
    # 2. Contact Information Detection
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text)
    phone_match = re.search(r"(?:\+91[\-\s]?)?[6-9]\d{9}|\b\d{10}\b", raw_text)
    linkedin_match = re.search(r"linkedin\.com/in/[\w\-]+|linkedin", raw_text, re.IGNORECASE)
    github_match = re.search(r"github\.com/[\w\-]+|github", raw_text, re.IGNORECASE)
    
    contact_score = 0
    missing_contacts = []
    if email_match: contact_score += 25
    else: missing_contacts.append("Email")
    if phone_match: contact_score += 25
    else: missing_contacts.append("Phone")
    if linkedin_match: contact_score += 25
    else: missing_contacts.append("LinkedIn")
    if github_match or "portfolio" in raw_text.lower(): contact_score += 25
    
    if contact_score < 75:
        deduction = (75 - contact_score) // 2
        score -= deduction
        if not email_match: issues.append("Email address not clearly parsed from header.")
        if not phone_match: issues.append("Phone number not clearly parsed from header.")
        if not linkedin_match: issues.append("Professional profile link (LinkedIn/Portfolio) not found.")
        
    checks.append({
        "name": "Contact Header Completeness",
        "passed": contact_score >= 75,
        "detail": "Verified contact details and professional links" if contact_score >= 75 else f"Missing: {', '.join(missing_contacts)}"
    })
    
    # 3. Standard Section Header Recognition
    std_headers = ["experience", "project", "education", "responsibility", "leadership", "scholastic", "skill", "achievement", "extracurricular"]
    found_headers = [h for h in std_headers if re.search(rf"\b{h}\b", raw_text, re.IGNORECASE)]
    
    if len(found_headers) < 3:
        score -= 20
        issues.append("Standard section headings (Experience, Projects, Education, Leadership) are missing or non-standard.")
        checks.append({"name": "Standard Section Hierarchy", "passed": False, "detail": "Non-standard section naming may cause parser drops"})
    else:
        checks.append({"name": "Standard Section Hierarchy", "passed": True, "detail": f"Recognized standard structure across {len(found_headers)} core categories"})
        
    # 4. Multi-Column / Scrambling Risk Check
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    short_line_ratio = sum(1 for l in lines if len(l) < 20) / max(len(lines), 1)
    if short_line_ratio > 0.45 and len(lines) > 40:
        score -= 15
        issues.append("High risk of multi-column table scrambling detected. Text blocks appear fragmented.")
        checks.append({"name": "Single-Column Parsing Flow", "passed": False, "detail": "Multi-column layout or table cells detected"})
    else:
        checks.append({"name": "Single-Column Parsing Flow", "passed": True, "detail": "Clean single-column parsing stream verified"})

        
    final_score = max(0, min(100, score))
    return {
        "score": final_score,
        "status": "Excellent" if final_score >= 85 else "Good" if final_score >= 70 else "Needs Fix",
        "checks": checks,
        "issues": issues,
        "raw_text_preview": raw_text[:1200] + ("..." if len(raw_text) > 1200 else "")
    }


def evaluate_keyword_match(
    resume_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    target_role: str = "consulting", 
    job_description: Optional[str] = None,
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Pillar 2: Keyword & Skill Match Rate (0-100)."""
    canonical_role = target_role.lower()
    if "software" in canonical_role or "tech" in canonical_role or "developer" in canonical_role or "sde" in canonical_role:
        role_key = "software"
    elif "prod" in canonical_role or "pm" in canonical_role:
        role_key = "product_management"
    elif "fin" in canonical_role or "ib" in canonical_role or "pe" in canonical_role:
        role_key = "finance"
    elif "data" in canonical_role or "analy" in canonical_role or "ml" in canonical_role or "ai" in canonical_role:
        role_key = "analytics"
    else:
        role_key = "consulting"
        
    domain_info = DOMAIN_TAXONOMY.get(role_key, DOMAIN_TAXONOMY["consulting"])
    
    # If custom Job Description is provided, extract dynamic keywords using LLM or NLP
    if job_description and len(job_description.strip()) > 50:
        try:
            jd_prompt = f"""
            Analyze the following Job Description and extract:
            1. 'critical_keywords': The top 10 mandatory technical skills, frameworks, tools, or domain methodologies required.
            2. 'important_keywords': 10 secondary/preferred skills, soft skills, or domain concepts.
            
            Return JSON matching:
            {{
               "critical_keywords": ["Python", "System Design", ...],
               "important_keywords": ["CI/CD", "Agile", ...]
            }}
            
            Job Description:
            {job_description[:3000]}
            """
            response_text = cerebras_client.generate_chat_completion(
                model="gpt-oss-120b",
                messages=[{"role": "user", "content": jd_prompt}],
                temperature=0.1,
                max_tokens=600
            )
            parsed_jd = json_repair.loads(response_text)
            if isinstance(parsed_jd, dict) and parsed_jd.get("critical_keywords"):
                target_critical = parsed_jd.get("critical_keywords", [])
                target_important = parsed_jd.get("important_keywords", [])
            else:
                target_critical = domain_info["critical_keywords"]
                target_important = domain_info["important_keywords"]
        except Exception as e:
            print(f"Error parsing custom JD keywords: {e}")
            target_critical = domain_info["critical_keywords"]
            target_important = domain_info["important_keywords"]
    else:
        target_critical = domain_info["critical_keywords"]
        target_important = domain_info["important_keywords"]
        
    # Match analysis against resume text
    resume_lower = resume_text.lower()
    found_critical = []
    missing_critical = []
    found_important = []
    missing_important = []
    
    for kw in target_critical:
        pattern = re.escape(kw.lower())
        if re.search(rf"\b{pattern}\b", resume_lower) or kw.lower() in resume_lower:
            found_critical.append(kw)
        else:
            missing_critical.append(kw)
            
    for kw in target_important:
        pattern = re.escape(kw.lower())
        if re.search(rf"\b{pattern}\b", resume_lower) or kw.lower() in resume_lower:
            found_important.append(kw)
        else:
            missing_important.append(kw)
            
    total_critical = len(target_critical)
    total_important = len(target_important)
    
    crit_ratio = len(found_critical) / max(total_critical, 1)
    imp_ratio = len(found_important) / max(total_important, 1)
    
    # 70% weight to critical keywords, 30% to important
    match_score = int(round((crit_ratio * 70) + (imp_ratio * 30)))
    match_score = max(10, min(100, match_score))
    
    # Suggestions for top 3 missing keywords
    suggestions = []
    for kw in missing_critical[:3]:
        suggestions.append(f"Incorporate '{kw}' into relevant project or internship bullets to boost domain keyword density.")
    for kw in missing_important[:2]:
        suggestions.append(f"Consider mentioning '{kw}' if you have experience with it.")
        
    return {
        "score": match_score,
        "target_role_label": domain_info["label"],
        "is_custom_jd": bool(job_description and len(job_description.strip()) > 50),
        "found_critical_count": len(found_critical),
        "total_critical_count": total_critical,
        "found_keywords": found_critical + found_important,
        "missing_critical": missing_critical,
        "missing_important": missing_important,
        "suggestions": suggestions
    }


def evaluate_quantification_impact(parsed_sections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Pillar 3: Quantification & Google X-Y-Z Impact (0-100)."""
    all_bullets = []
    for sec in parsed_sections:
        for b in sec.get("bullets", []):
            if isinstance(b, str) and b.strip():
                all_bullets.append(b.strip())
            elif isinstance(b, dict) and b.get("bullet_text"):
                all_bullets.append(b["bullet_text"].strip())
                
    if not all_bullets:
        return {
            "score": 50,
            "quantified_count": 0,
            "total_bullets": 0,
            "quantification_ratio": 0,
            "metric_types_found": [],
            "weak_unquantified_bullets": [],
            "feedback": "No bullet points detected to analyze for metrics."
        }
        
    metric_regex = re.compile(r"((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+)?(?:%|x|X)?|\b(?:first|1st|2nd|3rd|top\s*\d+%?|rank\s*\d+)\b)", re.IGNORECASE)
    
    quantified_bullets = []
    unquantified_bullets = []
    metric_types = {"Percentages (%)": 0, "Currencies (₹/$)": 0, "Scale & Users": 0, "Time & Latency": 0}
    
    for b in all_bullets:
        matches = metric_regex.findall(b)
        if matches:
            quantified_bullets.append(b)
            if "%" in b: metric_types["Percentages (%)"] += 1
            if any(c in b for c in ["₹", "$", "INR", "USD", "EUR"]): metric_types["Currencies (₹/$)"] += 1
            if any(w in b.lower() for w in ["users", "students", "clients", "teams", "requests", "records", "queries", "participants", "members"]): metric_types["Scale & Users"] += 1
            if any(w in b.lower() for w in ["ms", "fps", "hours", "days", "weeks", "reduction", "faster", "speed"]): metric_types["Time & Latency"] += 1
        else:
            unquantified_bullets.append(b)
            
    total = len(all_bullets)
    ratio = len(quantified_bullets) / total
    
    # Scoring: Target is >= 75% quantified
    if ratio >= 0.75:
        score = 85 + int((ratio - 0.75) * 60)
    elif ratio >= 0.50:
        score = 70 + int((ratio - 0.50) * 60)
    elif ratio >= 0.30:
        score = 50 + int((ratio - 0.30) * 100)
    else:
        score = max(20, int(ratio * 150))
        
    score = min(100, score)
    
    # Metric diversity bonus
    types_found = [k for k, v in metric_types.items() if v > 0]
    if len(types_found) >= 3 and score < 95:
        score = min(100, score + 5)
        
    return {
        "score": score,
        "quantified_count": len(quantified_bullets),
        "total_bullets": total,
        "quantification_ratio": int(round(ratio * 100)),
        "metric_types_found": types_found,
        "weak_unquantified_bullets": unquantified_bullets[:4],
        "feedback": f"{len(quantified_bullets)} of {total} bullets ({int(round(ratio * 100))}%) contain hard metrics. Elite placement standard is >75%."
    }


def evaluate_action_verbs_language(parsed_sections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Pillar 4: Action Verbs & Language Power (0-100)."""
    all_bullets = []
    for sec in parsed_sections:
        for b in sec.get("bullets", []):
            if isinstance(b, str) and b.strip():
                all_bullets.append(b.strip())
            elif isinstance(b, dict) and b.get("bullet_text"):
                all_bullets.append(b["bullet_text"].strip())
                
    if not all_bullets:
        return {
            "score": 50,
            "power_verb_count": 0,
            "weak_verb_count": 0,
            "repetitive_verbs": [],
            "passive_bullets": []
        }
        
    first_words = []
    weak_bullets = []
    pronoun_bullets = []
    
    for b in all_bullets:
        words = b.split()
        if words:
            first_word = re.sub(r"[^\w]", "", words[0]).capitalize()
            first_words.append(first_word)
            
        b_lower = b.lower()
        if any(wb in b_lower for wb in WEAK_VERBS):
            weak_bullets.append(b)
            
        if re.search(r"\b(?:I|my|we|our|me)\b", b, re.IGNORECASE):
            pronoun_bullets.append(b)
            
    # Check for verb repetition
    from collections import Counter
    counts = Counter(first_words)
    repetitive = [f"{word} ({count}x)" for word, count in counts.items() if count >= 3]
    
    score = 95
    if weak_bullets:
        score -= min(30, len(weak_bullets) * 6)
    if repetitive:
        score -= min(20, len(repetitive) * 5)
    if pronoun_bullets:
        score -= min(20, len(pronoun_bullets) * 8)
        
    score = max(20, min(100, score))
    
    return {
        "score": score,
        "total_bullets": len(all_bullets),
        "weak_verb_count": len(weak_bullets),
        "repetitive_verbs": repetitive,
        "weak_bullets": weak_bullets[:3],
        "pronoun_bullets": pronoun_bullets[:2],
        "feedback": "Strong action verbs detected across points." if score >= 85 else f"Found {len(weak_bullets)} bullets with weak/passive verbs and {len(repetitive)} repetitive opening verbs."
    }


def evaluate_formatting_and_iitb_rules(
    parsed_sections: List[Dict[str, Any]], 
    raw_text: str, 
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Pillar 5: Formatting, Layout & Line-Budget Health (0-100)."""
    score = 100
    policy_alerts = []
    layout_checks = []
    line_wrap_hazards = []
    
    # 1. Check for Prohibited Ranks (Current IITB Placement Policy)
    for pattern, rule_name in PROHIBITED_RANK_PATTERNS:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            matched_text = match.group(0)
            score -= 20
            policy_alerts.append({
                "type": "prohibited_rank_violation",
                "severity": "high",
                "title": f"Prohibited Rank Mention: '{matched_text}'",
                "message": f"Under current IIT Bombay placement guidelines, explicit mentions of JEE ranks, State CET ranks, and Department ranks are not permitted on placement resumes. We recommend replacing this with CPI, specific AP (10/10) course grades, Olympiads, or Merit Scholarships."
            })
            
    # 2. Check for Positive Scholastic Highlights
    has_cpi = bool(re.search(r"\b(?:CPI|CGPA|GPA)\b", raw_text, re.IGNORECASE))
    has_ap_grades = bool(re.search(r"\b(?:AP\s*grade|10/10|Grade\s*10|AP\b)", raw_text, re.IGNORECASE))
    has_olympiad = bool(re.search(r"\b(?:Olympiad|KVPY|NTSE|Scholarship|Fellowship|Dean's)\b", raw_text, re.IGNORECASE))
    
    layout_checks.append({
        "name": "Scholastic Distinction Highlights",
        "passed": has_cpi or has_ap_grades or has_olympiad,
        "detail": "Features strong academic differentiators (CPI / AP Grades / Scholarships)" if (has_cpi or has_ap_grades or has_olympiad) else "Include verified academic achievements (CPI, course grades, or scholarships)"
    })
    
    # 3. Word Count & 1-Page Budget Health
    words = raw_text.split()
    word_count = len(words)
    if word_count > 650:
        score -= 15
        layout_checks.append({"name": "1-Page Word Count Density", "passed": False, "detail": f"{word_count} words (Risk of spilling over 1-page layout margin)"})
    elif word_count < 350:
        score -= 15
        layout_checks.append({"name": "1-Page Word Count Density", "passed": False, "detail": f"{word_count} words (Underfilled, consider expanding project depth)"})
    else:
        layout_checks.append({"name": "1-Page Word Count Density", "passed": True, "detail": f"{word_count} words (Optimal 400–580 words range for 1-page template)"})

        
    # 4. Line-Wrap Overflow Hazards (Single vs Two-Line LaTeX/Word budget)
    for sec in parsed_sections:
        sec_name = sec.get("section_type", "Experience")
        for b in sec.get("bullets", []):
            b_text = b if isinstance(b, str) else b.get("bullet_text", "")
            b_clean = b_text.strip()
            char_len = len(b_clean)
            
            # Bullets between 115-140 chars or 225-255 chars typically overflow by 1-3 words
            if (115 <= char_len <= 140) or (225 <= char_len <= 255):
                line_wrap_hazards.append({
                    "section": sec_name,
                    "bullet_text": b_clean,
                    "char_length": char_len,
                    "target_trim_chars": 110 if char_len <= 140 else 215,
                    "chars_to_trim": char_len - (110 if char_len <= 140 else 215),
                    "reason": f"{char_len} characters: High risk of spilling 1–3 words onto a new line, wasting vertical margin budget."
                })
                
    if line_wrap_hazards:
        deduction = min(20, len(line_wrap_hazards) * 5)
        score -= deduction
        layout_checks.append({
            "name": "Line-Wrap Budget (No Orphan Overflows)",
            "passed": False,
            "detail": f"{len(line_wrap_hazards)} bullets risk spilling 1–3 words onto an extra line"
        })
    else:
        layout_checks.append({
            "name": "Line-Wrap Budget (No Orphan Overflows)",
            "passed": True,
            "detail": "All bullets comfortably fit within single or dual line budgets"
        })
        
    # 5. Italicized Overview 1-Liners (IITB Standard Convention)
    has_overview_lines = any(bool(sec.get("overview_line")) for sec in parsed_sections)
    layout_checks.append({
        "name": "Italicized Overview 1-Liners",
        "passed": has_overview_lines,
        "detail": "Present beneath key company/project headings" if has_overview_lines else "Recommended for top placement experiences"
    })
    
    final_score = max(20, min(100, score))
    return {
        "score": final_score,
        "word_count": word_count,
        "policy_alerts": policy_alerts,
        "layout_checks": layout_checks,
        "line_wrap_hazards": line_wrap_hazards[:5]
    }


def compute_full_ats_report(
    pdf_bytes: Optional[bytes] = None,
    raw_text: Optional[str] = None,
    parsed_sections: Optional[List[Dict[str, Any]]] = None,
    target_role: str = "consulting",
    mode: str = "iitb_placement",
    job_description: Optional[str] = None
) -> Dict[str, Any]:
    """Computes comprehensive 5-pillar ATS & Placement Scorecard."""
    
    # 1. Ensure text is extracted
    if not raw_text and pdf_bytes:
        raw_text = extract_text_from_pdf_stream(pdf_bytes)
    raw_text = raw_text or ""
    
    # 2. Ensure parsed_sections exist
    if not parsed_sections:
        from agents.achievement_engine import extract_final_resume_bullets
        try:
            parsed_sections = extract_final_resume_bullets(pdf_bytes=pdf_bytes, raw_text=raw_text)
        except Exception as e:
            print(f"Error extracting sections for ATS engine: {e}")
            parsed_sections = []
            
        if not parsed_sections and raw_text:
            parsed_sections = fallback_extract_sections_and_bullets(raw_text)

            
    # 3. Compute 5 Pillars
    p1 = evaluate_ats_parseability(pdf_bytes, raw_text, parsed_sections)
    p2 = evaluate_keyword_match(raw_text, parsed_sections, target_role, job_description, mode)
    p3 = evaluate_quantification_impact(parsed_sections)
    p4 = evaluate_action_verbs_language(parsed_sections)
    p5 = evaluate_formatting_and_iitb_rules(parsed_sections, raw_text, mode)
    
    # 4. Overall Weighted Score
    # Parseability: 15%, Keywords: 30%, Quantification: 25%, Action Verbs: 15%, Formatting: 15%
    overall_score = int(round(
        (p1["score"] * 0.15) +
        (p2["score"] * 0.30) +
        (p3["score"] * 0.25) +
        (p4["score"] * 0.15) +
        (p5["score"] * 0.15)
    ))
    overall_score = max(0, min(100, overall_score))
    
    tier = "Placement Ready" if overall_score >= 85 else "Strong Shortlist" if overall_score >= 72 else "Needs Polish" if overall_score >= 58 else "Critical Gaps"
    
    return {
        "overall_score": overall_score,
        "tier": tier,
        "mode": mode,
        "target_role": target_role,
        "target_role_label": p2.get("target_role_label", target_role.capitalize()),
        "is_custom_jd": p2.get("is_custom_jd", False),
        "pillars": {
            "parseability": p1,
            "keyword_match": p2,
            "quantification": p3,
            "action_verbs": p4,
            "formatting_layout": p5
        },
        "policy_alerts": p5.get("policy_alerts", []),
        "quick_fixes_count": len(p5.get("line_wrap_hazards", [])) + len(p4.get("weak_bullets", [])) + len(p3.get("weak_unquantified_bullets", []))
    }


def refine_ats_bullet(
    bullet_text: str,
    fix_type: str,
    target_role: str = "consulting",
    mode: str = "iitb_placement",
    missing_keyword: Optional[str] = None,
    target_length: Optional[int] = None
) -> Dict[str, Any]:
    """1-Click AI Bullet Refiner for ATS & Line-Wrap fixes."""
    length_instruction = f"Strictly constrain output to approximately {target_length or len(bullet_text)} characters." if target_length else "Keep length tight for a 1-line placement resume bullet."
    
    prompt = f"""
    You are an elite IIT Bombay placement resume editor.
    Refine this single resume bullet point according to the specified fix type.
    
    ORIGINAL BULLET:
    "{bullet_text}"
    
    FIX TYPE: {fix_type}
    TARGET DOMAIN: {target_role}
    MISSING KEYWORD TO INJECT (if applicable): {missing_keyword or "None"}
    
    INSTRUCTIONS:
    - If fix_type is 'trim_line_wrap': Trim 5-15 characters to prevent awkward 1-2 word line wrapping while preserving all metrics, tools, and impact.
    - If fix_type is 'inject_keyword': Naturally weave in the missing keyword '{missing_keyword}' while keeping the point factual.
    - If fix_type is 'power_verb': Replace weak/passive opening with a punchy, non-repetitive power action verb (e.g., Spearheaded, Architected, Formulated).
    - If fix_type is 'quantify': Suggest realistic metric brackets or strengthen impact positioning.
    - {length_instruction}
    - Do NOT end with a period.
    
    Return JSON format:
    {{
      "refined_bullet": "string",
      "char_diff": integer,
      "explanation": "string explaining what was improved"
    }}
    """
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=400
        )
        data = json_repair.loads(response_text)
        if isinstance(data, dict) and data.get("refined_bullet"):
            refined = data["refined_bullet"].strip()
            if refined.endswith("."): refined = refined[:-1]
            return {
                "original_bullet": bullet_text,
                "refined_bullet": refined,
                "original_length": len(bullet_text),
                "new_length": len(refined),
                "char_diff": len(refined) - len(bullet_text),
                "explanation": data.get("explanation", "Refined for placement impact and ATS alignment.")
            }
    except Exception as e:
        print(f"Error in refine_ats_bullet: {e}")
        
    return {
        "original_bullet": bullet_text,
        "refined_bullet": bullet_text,
        "original_length": len(bullet_text),
        "new_length": len(bullet_text),
        "char_diff": 0,
        "explanation": "Could not generate refinement at this time."
    }
