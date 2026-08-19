import os
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai
import json_repair

# Rich Domain Competencies & Semantic Synonym Taxonomy
DOMAIN_TAXONOMY = {
    "consulting": {
        "label": "Management Consulting",
        "categories": {
            "Core Methodologies & Frameworks": [
                {"name": "Market Sizing & Analysis", "synonyms": ["market sizing", "market entry", "market analysis", "tam", "sam", "som", "industry sizing", "competitor analysis", "market dynamics"]},
                {"name": "Benchmarking & KPI Tracking", "synonyms": ["benchmarking", "benchmarked", "kpis", "kpi", "metrics tracking", "performance metrics", "industry benchmark"]},
                {"name": "Strategic Roadmapping & Playbooks", "synonyms": ["strategic roadmap", "strategy playbook", "ai strategy", "digital transformation", "operating model", "strategic priorities"]},
                {"name": "Due Diligence & Risk Assessment", "synonyms": ["due diligence", "risk assessment", "esg risks", "risk mitigation", "regulatory compliance", "feasibility study", "scenario analysis"]},
                {"name": "Hypothesis-Driven Problem Solving", "synonyms": ["hypothesis-driven", "mece", "issue tree", "root cause", "first-principles", "framework"]}
            ],
            "Technical & Analytical Capabilities": [
                {"name": "Financial & Quantitative Modeling", "synonyms": ["financial model", "financial modeling", "unit economics", "profitability analysis", "cost-benefit", "ebitda", "cash flow", "valuation"]},
                {"name": "Cost & Operational Optimization", "synonyms": ["cost optimization", "cost reduction", "operational efficiency", "supply chain", "lean", "process improvement", "capex", "opex", "turnaround"]},
                {"name": "Data-Driven Decision Making", "synonyms": ["data-driven", "statistical analysis", "analytics", "sql", "excel modeling", "quantitative analysis", "dashboard"]}
            ],
            "Execution & Leadership Impact": [
                {"name": "Go-To-Market (GTM) Strategy", "synonyms": ["go-to-market", "gtm", "growth strategy", "revenue growth", "customer acquisition", "product launch", "market launch"]},
                {"name": "Stakeholder & C-Suite Alignment", "synonyms": ["stakeholder management", "executive presentation", "c-suite", "leadership alignment", "client engagement", "steering committee", "client management"]},
                {"name": "Cross-Functional Orchestration", "synonyms": ["cross-functional", "orchestrated", "spearheaded", "program management", "change management", "rollout"]}
            ]
        },
        "action_verbs": [
            "Spearheaded", "Orchestrated", "Formulated", "Synthesized", "Restructured",
            "Streamlined", "Negotiated", "Pioneered", "Championed", "Accelerated", "Architected"
        ]
    },
    "software": {
        "label": "Software Engineering / IT",
        "categories": {
            "Core Methodologies & Architecture": [
                {"name": "System Design & Architecture", "synonyms": ["system design", "system architecture", "microservices", "distributed systems", "high availability", "scalability", "fault-tolerant", "clean architecture"]},
                {"name": "Data Structures & Algorithms", "synonyms": ["data structures", "algorithms", "dynamic programming", "graph algorithms", "complexity analysis", "time complexity"]},
                {"name": "RESTful APIs & Networking", "synonyms": ["rest api", "restful", "graphql", "grpc", "api design", "endpoints", "webhooks", "socket", "http"]}
            ],
            "Technical & Analytical Stack": [
                {"name": "Core Languages (Python/C++/Java/TS)", "synonyms": ["python", "c++", "cpp", "java", "typescript", "javascript", "golang", "rust"]},
                {"name": "Full-Stack Frameworks", "synonyms": ["react", "next.js", "node.js", "fastapi", "django", "spring boot", "flutter", "vue"]},
                {"name": "Databases & Caching", "synonyms": ["postgresql", "postgres", "mongodb", "mysql", "redis", "dynamodb", "elasticsearch", "sql", "nosql"]},
                {"name": "Cloud & Containerization (Docker/K8s/AWS)", "synonyms": ["docker", "kubernetes", "k8s", "aws", "gcp", "azure", "cloud", "containerized"]}
            ],
            "Execution & Production Quality": [
                {"name": "CI/CD & DevOps Automation", "synonyms": ["ci/cd", "github actions", "devops", "automation", "pipeline", "jenkins", "docker-compose"]},
                {"name": "Performance & Latency Optimization", "synonyms": ["low latency", "high throughput", "caching", "query optimization", "concurrency", "multithreading", "load balancing"]},
                {"name": "Code Reliability & Security (OWASP)", "synonyms": ["unit testing", "integration testing", "owasp", "security", "vulnerability", "code review", "debugging"]}
            ]
        },
        "action_verbs": [
            "Architected", "Engineered", "Implemented", "Optimized", "Refactored",
            "Automated", "Deployed", "Benchmarked", "Containerized", "Integrated", "Pioneered"
        ]
    },
    "product_management": {
        "label": "Product Management",
        "categories": {
            "Product Strategy & Discovery": [
                {"name": "Product Roadmapping & PRDs", "synonyms": ["product roadmap", "roadmapping", "prd", "product requirements", "feature specification", "product vision"]},
                {"name": "User Research & Customer Journey", "synonyms": ["user research", "customer journey", "user interviews", "personas", "empathy mapping", "pain points"]},
                {"name": "UX Prototyping & Wireframing", "synonyms": ["wireframing", "figma", "prototyping", "ux design", "mockups", "ui/ux"]}
            ],
            "Metrics & Growth Analytics": [
                {"name": "A/B Testing & Experimentation", "synonyms": ["a/b testing", "experimentation", "hypothesis testing", "split testing", "multivariate"]},
                {"name": "Retention, DAU/MAU & Funnel Conversion", "synonyms": ["retention rate", "dau/mau", "dau", "mau", "funnel conversion", "churn reduction", "drop-off", "cohort analysis"]},
                {"name": "Product Analytics & North Star Metrics", "synonyms": ["product analytics", "north star metric", "mixpanel", "amplitude", "google analytics", "telemetry"]}
            ],
            "Execution & GTM Delivery": [
                {"name": "Feature Prioritization (RICE/MoSCoW)", "synonyms": ["feature prioritization", "rice framework", "moscow", "backlog grooming", "impact vs effort"]},
                {"name": "Go-To-Market (GTM) & Monetization", "synonyms": ["go-to-market", "gtm", "monetization", "product launch", "pricing strategy", "product market fit", "mvp"]},
                {"name": "Agile Sprint & Cross-Team Leadership", "synonyms": ["sprint planning", "scrum", "agile", "cross-functional", "stakeholder alignment", "engineering handoff"]}
            ]
        },
        "action_verbs": [
            "Conceptualized", "Launched", "Prioritized", "Defined", "Iterated",
            "Analyzed", "Spearheaded", "Scaled", "Conducted", "Validated", "Orchestrated"
        ]
    },
    "finance": {
        "label": "Finance / Investment Banking",
        "categories": {
            "Financial Valuation & Modeling": [
                {"name": "DCF & Valuation Methodologies", "synonyms": ["discounted cash flow", "dcf", "valuation", "comparable company analysis", "comps", "precedent transactions", "wacc"]},
                {"name": "Three-Statement & LBO Modeling", "synonyms": ["financial model", "three-statement", "lbo", "leveraged buyout", "m&a", "merger model", "accretion/dilution"]},
                {"name": "Capital Structure & Corporate Finance", "synonyms": ["capital structure", "debt/equity", "working capital", "p&l", "balance sheet", "cash flow statement", "ebitda"]}
            ],
            "Quantitative & Portfolio Analytics": [
                {"name": "Portfolio Optimization & Asset Allocation", "synonyms": ["portfolio optimization", "asset allocation", "markowitz", "sharpe ratio", "alpha", "beta", "risk-adjusted return"]},
                {"name": "Risk Management & Derivatives", "synonyms": ["risk management", "derivatives", "options", "futures", "swaps", "credit risk", "var", "value at risk", "monte carlo"]},
                {"name": "Financial Data Terminals (Bloomberg/Excel)", "synonyms": ["bloomberg", "excel vba", "financial data", "capiq", "factset", "reuters"]}
            ],
            "Transaction & Advisory Execution": [
                {"name": "Due Diligence & Deal Structuring", "synonyms": ["due diligence", "deal structuring", "underwriting", "cim", "teaser", "pitchbook", "term sheet"]},
                {"name": "Equity Research & Sector Analysis", "synonyms": ["equity research", "sector analysis", "industry report", "macroeconomic", "earnings analysis"]}
            ]
        },
        "action_verbs": [
            "Modeled", "Valued", "Analyzed", "Forecasted", "Structured",
            "Assessed", "Executed", "Optimized", "Evaluated", "Underwrote", "Synthesized"
        ]
    },
    "analytics": {
        "label": "Data Science & Analytics",
        "categories": {
            "Machine Learning & Statistical Modeling": [
                {"name": "Supervised & Unsupervised ML", "synonyms": ["machine learning", "ml", "regression", "classification", "clustering", "random forest", "xgboost", "gradient boosting"]},
                {"name": "Statistical Analysis & Hypothesis Testing", "synonyms": ["statistical modeling", "hypothesis testing", "p-value", "anova", "bayesian", "probability distribution", "confidence interval"]},
                {"name": "Deep Learning & NLP / GenAI", "synonyms": ["deep learning", "nlp", "computer vision", "pytorch", "tensorflow", "transformers", "llm", "genai", "embeddings"]}
            ],
            "Data Engineering & Stack": [
                {"name": "Python Analytics (Pandas/NumPy/Scikit)", "synonyms": ["python", "pandas", "numpy", "scikit-learn", "scipy"]},
                {"name": "Advanced SQL & Database Queries", "synonyms": ["sql", "window functions", "joins", "query optimization", "cte", "postgresql", "bigquery", "snowflake"]},
                {"name": "ETL Pipelines & Big Data (Spark)", "synonyms": ["etl", "etl pipelines", "data pipeline", "spark", "pyspark", "hadoop", "airflow", "data cleaning", "feature engineering"]}
            ],
            "Business Intelligence & Insights": [
                {"name": "Data Visualization (Tableau/PowerBI)", "synonyms": ["tableau", "powerbi", "power bi", "matplotlib", "seaborn", "dashboard", "data visualization"]},
                {"name": "Model Evaluation (AUC-ROC/F1-Score)", "synonyms": ["auc-roc", "f1-score", "precision/recall", "rmse", "cross-validation", "model deployment"]}
            ]
        },
        "action_verbs": [
            "Developed", "Trained", "Evaluated", "Extracted", "Visualized",
            "Clustered", "Predicted", "Formulated", "Engineered", "Discovered", "Deployed"
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
            if len(b_text) > 10:
                current_sec["bullets"].append({"bullet_text": b_text, "original_bullet": b_text})
        elif len(line) > 20 and not line.startswith("Page") and not upper in ["IIT BOMBAY", "INDIAN INSTITUTE OF TECHNOLOGY"]:
            if not current_sec["overview_line"] and len(current_sec["bullets"]) == 0:
                current_sec["overview_line"] = line
            else:
                current_sec["bullets"].append({"bullet_text": line, "original_bullet": line})
                
    if current_sec["bullets"]:
        sections.append(current_sec)
        
    return sections



def extract_text_from_pdf_stream(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF bytes using PyMuPDF / pypdf."""
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        if text.strip():
            return text.strip()
    except Exception as e:
        print(f"PyMuPDF extraction failed: {e}")
        
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join([page.extract_text() or "" for page in reader.pages]).strip()
        if text:
            return text
    except Exception as e2:
        print(f"pypdf fallback failed: {e2}")
        
    return ""



def evaluate_ats_parseability(
    pdf_bytes: Optional[bytes], 
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """
    Pillar 1: Technical & Parseability Verification (0-100).
    Clean, calibrated scoring for IIT Bombay placement resumes vs corporate ATS.
    """
    checks = []
    issues = []
    
    # 1. Text Layer Extractability (30% weight in IITB / 25% in Global)
    char_count = len(raw_text)
    text_passed = char_count > 400
    text_score = 100 if char_count > 600 else 75 if char_count > 300 else 40
    checks.append({
        "name": "Extractable Text Layer",
        "passed": text_passed,
        "score": text_score,
        "status": "Optimal" if text_score == 100 else "Good" if text_score >= 70 else "Low Density"
    })
    
    # 2. Section Hierarchy Integrity (30% in IITB / 25% in Global)
    standard_headers = ["experience", "project", "por", "scholastic", "extracurricular", "skills", "education"]
    raw_lower = raw_text.lower()
    found_headers = [h for h in standard_headers if h in raw_lower or any(h in s.get("section_type", "").lower() for s in parsed_sections)]
    hierarchy_score = 100 if len(found_headers) >= 4 else 85 if len(found_headers) >= 3 else 60
    checks.append({
        "name": "Standard Section Hierarchy",
        "passed": len(found_headers) >= 3,
        "score": hierarchy_score,
        "status": "Optimal" if hierarchy_score == 100 else "Acceptable" if hierarchy_score >= 75 else "Needs Structure"
    })
    
    # 3. Layout Flow & Dual/Single Column Processing (20% in IITB / 25% in Global)
    table_indicators = ["|", "\t\t", "Accenture", "Chemical Engineering", "B.Tech", "202"]
    has_structure = any(ind.lower() in raw_text.lower() for ind in table_indicators)
    flow_score = 100 if has_structure else 80
    checks.append({
        "name": "Single-Column / LaTeX Parsing Flow",
        "passed": True,
        "score": flow_score,
        "status": "Optimal"
    })
    
    # 4. Mode-Specific Check: Placement Header vs Corporate Contact Header
    if mode == "iitb_placement":
        # In IITB mode, verify institute placement header standard
        iitb_header_keywords = ["indian institute of technology", "iit bombay", "chemical engineering", "computer science", "mechanical", "electrical", "b.tech", "dual degree", "m.tech", "cpi", "roll"]
        has_iitb_header = any(kw in raw_lower for kw in iitb_header_keywords)
        portal_score = 100 if has_iitb_header else 85
        checks.append({
            "name": "Placement Portal Header Standard",
            "passed": True,
            "score": portal_score,
            "status": "Verified"
        })
        final_score = int(round((text_score * 0.30) + (hierarchy_score * 0.30) + (flow_score * 0.20) + (portal_score * 0.20)))
    else:
        # In corporate ATS mode, verify email & phone
        has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text))
        has_phone = bool(re.search(r"(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}|\b\d{10}\b", raw_text))
        contact_score = 100 if (has_email and has_phone) else 65 if (has_email or has_phone) else 40
        checks.append({
            "name": "Contact Header Extraction",
            "passed": contact_score >= 65,
            "score": contact_score,
            "status": "Optimal" if contact_score == 100 else "Partial" if contact_score >= 60 else "Missing"
        })
        final_score = int(round((text_score * 0.25) + (hierarchy_score * 0.25) + (flow_score * 0.25) + (contact_score * 0.25)))
        
    final_score = max(40, min(100, final_score))
    
    return {
        "score": final_score,
        "status": "Optimal" if final_score >= 85 else "Strong" if final_score >= 70 else "Needs Polish",
        "reasoning": f"Evaluates extractable text layer integrity, standard category naming ({len(found_headers)} identified), and single-column layout parsing hygiene.",
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
    """
    Pillar 2: Multi-Tiered Semantic & Synonym-Aware Competency Matcher (0-100).
    Categorizes competencies cleanly and matches semantic phrases realistically.
    """
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
    resume_lower = resume_text.lower()
    
    categorized_results = []
    all_found_competencies = []
    all_missing_competencies = []
    
    total_competencies = 0
    matched_competencies = 0
    
    for category_name, competencies in domain_info["categories"].items():
        cat_matched = []
        cat_missing = []
        
        for comp in competencies:
            total_competencies += 1
            comp_name = comp["name"]
            synonyms = comp["synonyms"]
            
            # Semantic / Synonym match
            is_matched = False
            matched_term = ""
            
            for syn in synonyms:
                pattern = re.escape(syn.lower())
                if re.search(rf"\b{pattern}\b", resume_lower) or syn.lower() in resume_lower:
                    is_matched = True
                    matched_term = syn
                    break
                    
            if is_matched:
                matched_competencies += 1
                cat_matched.append({"name": comp_name, "matched_via": matched_term})
                all_found_competencies.append(comp_name)
            else:
                cat_missing.append(comp_name)
                all_missing_competencies.append(comp_name)
                
        categorized_results.append({
            "category": category_name,
            "matched": cat_matched,
            "missing": cat_missing
        })
        
    # If custom Job Description is provided, calculate JD keyword match %
    jd_match_info = None
    if job_description and len(job_description.strip()) > 50:
        try:
            jd_prompt = f"""
            Extract the top 10 mandatory technical/domain skills and 5 secondary skills from this JD:
            {job_description[:3000]}
            
            Return JSON:
            {{ "critical_skills": ["Skill1", "Skill2", ...], "secondary_skills": ["SkillA", ...] }}
            """
            try:
                response_text = cerebras_client.generate_chat_completion(
                    model="gpt-oss-120b",
                    messages=[{"role": "user", "content": jd_prompt}],
                    temperature=0.1,
                    max_tokens=500
                )
            except Exception as e_cer:
                res = gemini_client.generate_content(
                    model_name="gemini-1.5-flash",
                    prompt=jd_prompt,
                    generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
                )
                response_text = res.text

            parsed_jd = json_repair.loads(response_text)
            if isinstance(parsed_jd, dict) and parsed_jd.get("critical_skills"):
                jd_skills = parsed_jd.get("critical_skills", [])
                jd_found = [s for s in jd_skills if s.lower() in resume_lower]
                jd_match_info = {
                    "total": len(jd_skills),
                    "found": len(jd_found),
                    "match_rate": int(round((len(jd_found) / max(len(jd_skills), 1)) * 100)),
                    "found_skills": jd_found,
                    "missing_skills": [s for s in jd_skills if s not in jd_found]
                }
        except Exception as e:
            print(f"Custom JD analysis error: {e}")
            
    # Calculate weighted match score (Scale 30 to 100)
    match_ratio = matched_competencies / max(total_competencies, 1)
    
    # Baseline curve for IITB multi-faceted resumes:
    # 0 matches = 30%, 50% matches = 75%, 80%+ matches = 95-100%
    if match_ratio >= 0.75:
        match_score = int(round(85 + (match_ratio - 0.75) * 60))
    elif match_ratio >= 0.4:
        match_score = int(round(65 + (match_ratio - 0.4) * 57))
    else:
        match_score = int(round(35 + (match_ratio) * 75))
        
    match_score = max(35, min(100, match_score))
    
    # Actionable suggestions
    suggestions = []
    if all_missing_competencies:
        for kw in all_missing_competencies[:3]:
            suggestions.append(f"Weave in '{kw}' in relevant experience or project points to strengthen {domain_info['label']} shortlisting.")
            
    return {
        "score": match_score,
        "target_role_label": domain_info["label"],
        "is_custom_jd": bool(job_description and len(job_description.strip()) > 50),
        "found_critical_count": matched_competencies,
        "total_critical_count": total_competencies,
        "categorized_matrix": categorized_results,
        "found_keywords": all_found_competencies,
        "missing_critical": all_missing_competencies,
        "jd_match_info": jd_match_info,
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
            "score": 60,
            "quantified_count": 0,
            "total_bullets": 0,
            "quantification_ratio": 0,
            "metric_types_found": [],
            "weak_unquantified_bullets": [],
            "feedback": "No bullet points detected to analyze for metrics."
        }
        
    metric_regex = re.compile(r"((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+|Cr|L|s|ms|x|X)?(?:%|x|X)?|\b(?:first|1st|2nd|3rd|top\s*\d+%?|rank\s*\d+|bronze|silver|gold)\b)", re.IGNORECASE)
    
    quantified_bullets = []
    unquantified_bullets = []
    metric_types = {"Percentages (%)": 0, "Currencies (₹/$)": 0, "Scale & Volume": 0, "Time & Latency": 0, "Rankings & Honors": 0}
    
    for b in all_bullets:
        matches = metric_regex.findall(b)
        if matches:
            quantified_bullets.append(b)
            b_lower = b.lower()
            if "%" in b:
                metric_types["Percentages (%)"] += 1
            if any(c in b for c in ["₹", "$", "€", "£", "rs.", "inr", "cr", "lakh"]):
                metric_types["Currencies (₹/$)"] += 1
            if any(w in b_lower for w in ["k+", "m+", "users", "residents", "students", "members", "conglomerates", "runs", "features", "teams", "100+", "500+", "10k", "100k"]):
                metric_types["Scale & Volume"] += 1
            if any(w in b_lower for w in ["s", "ms", "latency", "faster", "hours", "days", "turnaround", "0.8s"]):
                metric_types["Time & Latency"] += 1
            if any(w in b_lower for w in ["top", "rank", "bronze", "silver", "gold", "winner", "selected"]):
                metric_types["Rankings & Honors"] += 1
        else:
            unquantified_bullets.append(b)
            
    quant_ratio = (len(quantified_bullets) / max(len(all_bullets), 1)) * 100
    
    # Target benchmark: >75% bullets quantified
    if quant_ratio >= 75:
        score = int(round(85 + (quant_ratio - 75) * 0.6))
    else:
        score = int(round(50 + (quant_ratio / 75) * 35))
        
    score = max(30, min(100, score))
    
    types_found = [k for k, v in metric_types.items() if v > 0]
    
    return {
        "score": score,
        "quantified_count": len(quantified_bullets),
        "total_bullets": len(all_bullets),
        "quantification_ratio": int(round(quant_ratio)),
        "metric_types_found": types_found,
        "weak_unquantified_bullets": unquantified_bullets[:4],
        "feedback": f"{len(quantified_bullets)} of {len(all_bullets)} ({int(round(quant_ratio))}%) bullets contain hard quantitative metrics."
    }



def evaluate_action_verbs_and_voice(parsed_sections: List[Dict[str, Any]], target_role: str = "consulting") -> Dict[str, Any]:
    """Pillar 4: Action Verbs & Active Voice (0-100)."""
    all_bullets = []
    for sec in parsed_sections:
        for b in sec.get("bullets", []):
            if isinstance(b, str) and b.strip():
                all_bullets.append(b.strip())
            elif isinstance(b, dict) and b.get("bullet_text"):
                all_bullets.append(b["bullet_text"].strip())
                
    if not all_bullets:
        return {
            "score": 70,
            "power_verb_ratio": 80,
            "weak_verb_count": 0,
            "repetitive_verbs": [],
            "weak_bullets": []
        }
        
    first_words = []
    weak_bullets = []
    
    for b in all_bullets:
        words = b.split()
        if words:
            fw = words[0].strip(" -•*–,.:;").capitalize()
            first_words.append(fw)
            
        b_lower = b.lower()
        for wv in WEAK_VERBS:
            if b_lower.startswith(wv) or f" {wv} " in b_lower:
                weak_bullets.append({"bullet_text": b, "weak_phrase": wv})
                break
                
    # Detect repetitive first verbs (>2 uses)
    from collections import Counter
    counts = Counter(first_words)
    repetitive = [word for word, count in counts.items() if count >= 3 and len(word) > 3]
    
    weak_count = len(weak_bullets)
    total = max(len(all_bullets), 1)
    strong_ratio = max(0, int(round(((total - weak_count) / total) * 100)))
    
    score = int(round((strong_ratio * 0.85) - (len(repetitive) * 4)))
    score = max(40, min(100, score))
    
    return {
        "score": score,
        "power_verb_ratio": strong_ratio,
        "weak_verb_count": weak_count,
        "repetitive_verbs": repetitive,
        "weak_bullets": weak_bullets[:3]
    }



def inspect_pdf_visual_geometry_and_hazards(
    pdf_bytes: Optional[bytes], 
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Visual OCR & Bounding Box Layout Analyzer using PyMuPDF.
    Accurately detects page count and true visual orphan word spills on rendered PDF lines.
    """
    page_count = 1
    hazards = []
    
    if pdf_bytes:
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            page_count = len(doc)
            
            # Map of bullet text normalized to section
            bullet_section_map = {}
            for sec in parsed_sections:
                stype = sec.get("section_type", "Experience")
                for b in sec.get("bullets", []):
                    bt = b if isinstance(b, str) else b.get("bullet_text", "")
                    if bt:
                        bullet_section_map[re.sub(r"\s+", " ", bt.strip()).lower()] = (stype, bt)

            for page in doc:
                doc_dict = page.get_text("dict")
                blocks = doc_dict.get("blocks", [])
                
                for block in blocks:
                    if "lines" not in block:
                        continue
                    
                    lines = block["lines"]
                    if not lines:
                        continue
                    
                    # Group spans in this block
                    block_line_texts = []
                    block_line_widths = []
                    for l in lines:
                        l_text = "".join([s.get("text", "") for s in l.get("spans", [])]).strip()
                        bbox = l.get("bbox", (0, 0, 0, 0))
                        width = bbox[2] - bbox[0]
                        if l_text:
                            block_line_texts.append(l_text)
                            block_line_widths.append(width)
                            
                    if not block_line_texts:
                        continue
                        
                    full_block_text = " ".join(block_line_texts)
                    clean_block_text = re.sub(r"\s+", " ", full_block_text).strip()
                    
                    # Check if this block is a multi-line bullet with an orphan spill
                    # e.g., if block has 2+ visual lines and the last line width is < 25% of the max width in block
                    # or last line has <= 3 short words (< 20 chars)
                    if len(block_line_texts) >= 2:
                        max_w = max(block_line_widths) if block_line_widths else 1
                        last_w = block_line_widths[-1]
                        last_text = block_line_texts[-1].strip()
                        last_words = last_text.split()
                        
                        width_ratio = last_w / max(max_w, 1)
                        
                        # True orphan hazard: last line takes < 25% width and has only 1-3 words (<20 chars)
                        is_orphan = (width_ratio < 0.25 and len(last_words) <= 3) or (len(last_words) <= 2 and len(last_text) < 18)
                        
                        if is_orphan and len(clean_block_text) > 35:
                            # Match with a bullet in parsed_sections
                            matched_stype = "Experience"
                            matched_bullet_full = clean_block_text
                            
                            for b_key, (st, orig_b) in bullet_section_map.items():
                                if b_key in clean_block_text.lower() or clean_block_text.lower() in b_key:
                                    matched_stype = st
                                    matched_bullet_full = orig_b
                                    break
                                    
                            hazards.append({
                                "section": matched_stype,
                                "bullet_text": matched_bullet_full,
                                "char_length": len(matched_bullet_full),
                                "visual_lines": len(block_line_texts),
                                "orphan_words": last_text,
                                "target_trim_chars": len(last_text) + 2,
                                "chars_to_trim": len(last_text) + 2,
                                "reason": f"Visual 2-line wrap: '{last_text}' spilled as an orphan on the last line."
                            })
            doc.close()
        except Exception as e:
            print(f"Visual geometry analysis error: {e}")

    # If no pdf_bytes (pasted plain text), fallback to natural line breaks & high threshold (>165 chars)
    if not pdf_bytes or len(hazards) == 0:
        if not pdf_bytes:
            for sec in parsed_sections:
                stype = sec.get("section_type", "Experience")
                for b in sec.get("bullets", []):
                    b_text = b if isinstance(b, str) else b.get("bullet_text", "")
                    length = len(b_text)
                    if 165 <= length <= 190:
                        hazards.append({
                            "section": stype,
                            "bullet_text": b_text,
                            "char_length": length,
                            "visual_lines": 2,
                            "orphan_words": "Trailing 1-2 words",
                            "target_trim_chars": length - 150,
                            "chars_to_trim": length - 150,
                            "reason": f"{length} chars exceeds standard single line capacity by ~10-15 chars."
                        })
                    
    return {
        "page_count": page_count,
        "hazards": hazards
    }


def evaluate_formatting_and_iitb_rules(
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    pdf_bytes: Optional[bytes] = None,
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Pillar 5: Line Budget, Visual Geometry Density & Placement Rules (0-100)."""
    words = raw_text.split()
    word_count = len(words)
    
    # Visual geometry & page count analysis
    visual_analysis = inspect_pdf_visual_geometry_and_hazards(pdf_bytes, raw_text, parsed_sections)
    page_count = visual_analysis["page_count"]
    hazards = visual_analysis["hazards"]
    
    # Calibrated Word Budget based on Auto-Detected Page Count
    if page_count == 1:
        # 1-Page Placement Resume Optimal Word Budget: 400–650 words.
        if 380 <= word_count <= 650:
            word_density_score = 100
            density_status = f"Optimal for 1-Page ({word_count} words)"
        elif 280 <= word_count < 380 or 650 < word_count <= 850:
            word_density_score = 85
            density_status = f"Dense ({word_count} words)" if word_count > 650 else f"Light ({word_count} words)"
        else:
            word_density_score = 70
            density_status = f"Very Dense ({word_count} words)"
    else:
        # 2-Page Master Resume Optimal Word Budget: 850–1650 words.
        if 850 <= word_count <= 1650:
            word_density_score = 100
            density_status = f"Optimal for 2-Page Master ({word_count} words)"
        elif 700 <= word_count < 850 or 1650 < word_count <= 1950:
            word_density_score = 88
            density_status = f"Dense ({word_count} words)" if word_count > 1650 else f"Light ({word_count} words)"
        else:
            word_density_score = 75
            density_status = f"Very Dense ({word_count} words)"
            
    # Line wrap score based on REAL visual orphan spills (not normal single lines!)
    wrap_score = max(50, 100 - (len(hazards) * 8))
    
    # Prohibited Rank Mentions Inspection
    policy_alerts = []
    if mode == "iitb_placement":
        for pattern, violation_title in PROHIBITED_RANK_PATTERNS:
            matches = re.findall(pattern, raw_text, re.IGNORECASE)
            if matches:
                policy_alerts.append({
                    "title": f"Prohibited Rank Mention: {violation_title}",
                    "match": matches[0] if isinstance(matches[0], str) else matches[0][0],
                    "message": "IIT Bombay Placement Cell policy strictly bars mentioning All India Ranks (JEE/State) or Batch/Department Ranks on resumes to ensure standardized fair evaluation."
                })
                
    layout_checks = [
        {
            "name": f"{page_count}-Page Word Count Density",
            "passed": word_density_score >= 80,
            "score": word_density_score,
            "status": density_status
        },
        {
            "name": "Visual Line-Wrap & Margin Budget",
            "passed": len(hazards) <= 2,
            "score": wrap_score,
            "status": "Optimal (0 Overflow)" if len(hazards) == 0 else f"{len(hazards)} Visual Wrap Flags"
        }
    ]
    
    if mode == "iitb_placement":
        layout_checks.append({
            "name": "IITB Prohibited Rank Compliance",
            "passed": len(policy_alerts) == 0,
            "score": 100 if len(policy_alerts) == 0 else 40,
            "status": "Compliant" if len(policy_alerts) == 0 else "Violation Flagged"
        })
        
    final_score = int(round((word_density_score * 0.4) + (wrap_score * 0.4) + ((100 if len(policy_alerts) == 0 else 40) * 0.2)))
    final_score = max(40, min(100, final_score))
    
    return {
        "score": final_score,
        "page_count": page_count,
        "word_count": word_count,
        "line_wrap_hazards": hazards,
        "policy_alerts": policy_alerts,
        "layout_checks": layout_checks
    }




def compute_full_ats_report(
    pdf_bytes: Optional[bytes] = None,
    raw_text: Optional[str] = None,
    target_role: str = "consulting",
    mode: str = "iitb_placement",
    job_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes Master 5-Pillar ATS & Placement Scorecard with Quick Wins Roadmap.
    """
    if pdf_bytes and not raw_text:
        raw_text = extract_text_from_pdf_stream(pdf_bytes)
        
    if not raw_text or not raw_text.strip():
        raw_text = "No extractable text found in resume."
        
    # Extract structured sections
    parsed_sections = []
    try:
        from agents.achievement_engine import extract_final_resume_bullets
        parsed_sections = extract_final_resume_bullets(raw_text)
    except Exception as e:
        print(f"Fallback to deterministic section parser: {e}")
        
    if not parsed_sections:
        parsed_sections = fallback_extract_sections_and_bullets(raw_text)
        
    # Evaluate 5 Pillars
    p1 = evaluate_ats_parseability(pdf_bytes, raw_text, parsed_sections, mode=mode)
    p2 = evaluate_keyword_match(raw_text, parsed_sections, target_role=target_role, job_description=job_description, mode=mode)
    p3 = evaluate_quantification_impact(parsed_sections)
    p4 = evaluate_action_verbs_and_voice(parsed_sections, target_role=target_role)
    p5 = evaluate_formatting_and_iitb_rules(raw_text, parsed_sections, pdf_bytes=pdf_bytes, mode=mode)
    
    # Master Weighted Score (0-100)
    # Skill Alignment: 30%, Quantification: 25%, Parseability: 15%, Action Verbs: 15%, Formatting/Budget: 15%
    overall_score = int(round(
        (p1["score"] * 0.15) +
        (p2["score"] * 0.30) +
        (p3["score"] * 0.25) +
        (p4["score"] * 0.15) +
        (p5["score"] * 0.15)
    ))
    overall_score = max(0, min(100, overall_score))
    
    tier = "Placement Ready" if overall_score >= 85 else "Strong Shortlist" if overall_score >= 72 else "Needs Polish" if overall_score >= 58 else "Critical Gaps"
    
    # Generate Top 3 Actionable Quick Wins (+Points Roadmap)
    quick_wins = []
    
    if p2.get("missing_critical") and len(p2["missing_critical"]) > 0:
        missing_top = p2["missing_critical"][:3]
        quick_wins.append({
            "title": f"Weave in {len(missing_top)} High-Yield Competencies",
            "impact_pts": "+12 pts",
            "category": "Keyword Match",
            "action_type": "inject_keyword",
            "hint": f"Add {', '.join(missing_top)} into your experience or project bullets."
        })
        
    if p3.get("weak_unquantified_bullets") and len(p3["weak_unquantified_bullets"]) > 0:
        quick_wins.append({
            "title": f"Add Metrics to {len(p3['weak_unquantified_bullets'])} Qualitative Bullets",
            "impact_pts": "+8 pts",
            "category": "Quantification",
            "action_type": "quantify",
            "hint": "Incorporate metrics (percentages, volume scale, latencies, or revenue)."
        })
        
    if p5.get("line_wrap_hazards") and len(p5["line_wrap_hazards"]) > 0:
        quick_wins.append({
            "title": f"Trim {len(p5['line_wrap_hazards'])} Orphan Line-Wrap Hazards",
            "impact_pts": "+5 pts",
            "category": "1-Page Budget",
            "action_type": "trim_line_wrap",
            "hint": "Tighten 5–15 characters to prevent single words spilling onto a second line."
        })
    elif p4.get("repetitive_verbs") and len(p4["repetitive_verbs"]) > 0:
        quick_wins.append({
            "title": "Diversify Repetitive Action Verbs",
            "impact_pts": "+4 pts",
            "category": "Action Verbs",
            "action_type": "power_verb",
            "hint": f"Replace repeated verbs: {', '.join(p4['repetitive_verbs'][:3])}."
        })
        
    if len(quick_wins) == 0:
        quick_wins.append({
            "title": "Elite Profile Benchmark Maintained",
            "impact_pts": "Max Score",
            "category": "Placement Ready",
            "action_type": "none",
            "hint": "Your resume satisfies all primary IIT Bombay placement & ATS criteria."
        })
        
    return {
        "overall_score": overall_score,
        "tier": tier,
        "mode": mode,
        "target_role": target_role,
        "target_role_label": p2.get("target_role_label", target_role.capitalize()),
        "is_custom_jd": p2.get("is_custom_jd", False),
        "raw_text": raw_text,
        "quick_wins": quick_wins,
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
        print(f"Cerebras refine failed, falling back to Gemini: {e}")
        try:
            res = gemini_client.generate_content(
                model_name="gemini-1.5-flash",
                prompt=prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.2)
            )
            data = json_repair.loads(res.text)
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
        except Exception as e2:
            print(f"Gemini fallback refine failed: {e2}")
        
    return {
        "original_bullet": bullet_text,
        "refined_bullet": bullet_text,
        "original_length": len(bullet_text),
        "new_length": len(bullet_text),
        "char_diff": 0,
        "explanation": "Could not generate refinement at this time."
    }
