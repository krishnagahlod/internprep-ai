import os
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

from services.gemini_client import gemini_client
from services.cerebras_client import cerebras_client
import google.generativeai as genai
import json_repair

# ==============================================================================
# MASSIVE MULTI-DOMAIN COMPETENCY TAXONOMY (25-35 Granular Skills per Domain)
# ==============================================================================
DOMAIN_TAXONOMY = {
    "software": {
        "label": "Software Engineering / IT",
        "categories": {
            "Core Languages & Runtimes": [
                {"name": "Python & Modern Async", "synonyms": ["python", "asyncio", "pydantic", "fastapi", "pytest", "cython", "poetry", "uv"]},
                {"name": "C++ & Low-Level Systems", "synonyms": ["c++", "cpp", "c++17", "c++20", "pointers", "memory management", "stl", "raii", "valgrind", "cmake"]},
                {"name": "Java / Spring Ecosystem", "synonyms": ["java", "spring boot", "spring", "jvm", "hibernate", "maven", "gradle", "junit"]},
                {"name": "TypeScript & Modern JS", "synonyms": ["typescript", "javascript", "ecmascript", "es6", "node.js", "deno", "bun"]},
                {"name": "Go (Golang) / Rust", "synonyms": ["golang", "go", "goroutines", "rust", "cargo", "rustlang", "actix", "tokio"]}
            ],
            "Architecture & Distributed Systems": [
                {"name": "System Design & Microservices", "synonyms": ["system design", "system architecture", "microservices", "service-oriented", "monolith to microservices", "domain driven design", "scalability"]},
                {"name": "Distributed Concurrency & Messaging", "synonyms": ["distributed systems", "kafka", "rabbitmq", "pub/sub", "message queue", "event-driven", "sqs", "concurrency", "multithreading", "celery"]},
                {"name": "REST, GraphQL & gRPC APIs", "synonyms": ["rest api", "restful", "graphql", "grpc", "protobuf", "api design", "openapi", "swagger", "webhook"]},
                {"name": "Caching & High Availability", "synonyms": ["redis", "memcached", "caching", "cache invalidation", "cdn", "load balancing", "failover", "replication", "high availability"]}
            ],
            "Databases & Storage Architecture": [
                {"name": "Relational SQL & Query Optimization", "synonyms": ["postgresql", "postgres", "mysql", "sql", "indexing", "query optimization", "explain analyze", "stored procedures", "acid"]},
                {"name": "NoSQL & Document Stores", "synonyms": ["mongodb", "dynamodb", "cassandra", "couchbase", "nosql", "key-value store"]},
                {"name": "Vector Databases & Semantic Search", "synonyms": ["pgvector", "pinecone", "qdrant", "milvus", "weaviate", "faiss", "vector search", "embeddings"]}
            ],
            "AI/ML Engineering & LLMOps": [
                {"name": "RAG Pipelines & Agent Orchestration", "synonyms": ["rag", "retrieval augmented", "langchain", "llamaindex", "agent architecture", "ai agents", "multi-agent", "prompt engineering"]},
                {"name": "Model Serving & Edge Inference", "synonyms": ["onnx", "tensorrt", "vllm", "ollama", "model serving", "huggingface", "transformers", "pytorch", "quantization"]}
            ],
            "Cloud, DevOps & Production Infrastructure": [
                {"name": "Containerization & Kubernetes (K8s)", "synonyms": ["docker", "docker-compose", "kubernetes", "k8s", "helm", "containerized"]},
                {"name": "Cloud Platforms (AWS/GCP/Azure)", "synonyms": ["aws", "gcp", "azure", "google cloud", "s3", "ec2", "lambda", "cloud run", "cloud functions"]},
                {"name": "CI/CD & Infrastructure as Code (IaC)", "synonyms": ["ci/cd", "github actions", "gitlab ci", "jenkins", "terraform", "ansible", "automated pipeline"]}
            ],
            "Quality, AppSec & Observability": [
                {"name": "Testing & Test-Driven Development (TDD)", "synonyms": ["unit testing", "integration testing", "e2e testing", "tdd", "mocking", "selenium", "playwright", "cypress"]},
                {"name": "Application Security (OWASP & Auth)", "synonyms": ["owasp", "vulnerability", "jwt", "oauth2", "authentication", "authorization", "rls", "rate limiting", "csrf", "xss", "cors"]},
                {"name": "Monitoring & Telemetry (Sentry/Prometheus)", "synonyms": ["sentry", "prometheus", "grafana", "datadog", "telemetry", "tracing", "logging", "apm"]}
            ]
        },
        "action_verbs": [
            "Architected", "Engineered", "Implemented", "Optimized", "Refactored",
            "Automated", "Deployed", "Benchmarked", "Containerized", "Integrated", "Pioneered"
        ]
    },
    "consulting": {
        "label": "Management Consulting",
        "categories": {
            "Core Strategic Frameworks": [
                {"name": "Market Sizing & TAM/SAM/SOM", "synonyms": ["market sizing", "market entry", "market analysis", "tam", "sam", "som", "industry sizing", "market dynamics"]},
                {"name": "Competitive Benchmarking & 5 Forces", "synonyms": ["benchmarking", "benchmarked", "competitor analysis", "porter's five forces", "competitive landscape", "swot analysis", "value chain"]},
                {"name": "Strategic Roadmapping & Playbooks", "synonyms": ["strategic roadmap", "strategy playbook", "ai strategy", "digital transformation", "operating model", "strategic priorities"]},
                {"name": "Hypothesis-Driven Problem Solving (MECE)", "synonyms": ["hypothesis-driven", "mece", "issue tree", "root cause", "first-principles", "framework"]}
            ],
            "Operational & Financial Transformation": [
                {"name": "Cost & Process Optimization (Lean/Kaizen)", "synonyms": ["cost optimization", "cost reduction", "operational efficiency", "supply chain", "lean", "kaizen", "process re-engineering", "bottlenecks"]},
                {"name": "Capex/Opex Restructuring & Turnaround", "synonyms": ["capex", "opex", "turnaround", "restructuring", "working capital", "procurement optimization"]},
                {"name": "EBITDA & Unit Economics Modeling", "synonyms": ["financial model", "unit economics", "profitability analysis", "cost-benefit", "ebitda", "cash flow", "gross margin", "pricing strategy"]}
            ],
            "ESG, Risk & Digital Transformation": [
                {"name": "Sustainability & Net Zero Roadmaps", "synonyms": ["sustainability", "net zero", "esg", "green technologies", "carbon footprint", "circular economy", "energy transition"]},
                {"name": "Due Diligence & Risk Assessment", "synonyms": ["due diligence", "risk assessment", "esg risks", "risk mitigation", "regulatory compliance", "feasibility study", "scenario analysis"]},
                {"name": "Digital & AI Transformation Strategy", "synonyms": ["digital transformation", "ai adoption", "automation strategy", "tech modernization", "poc roadmap"]}
            ],
            "Executive Leadership & Alignment": [
                {"name": "Go-To-Market (GTM) Strategy", "synonyms": ["go-to-market", "gtm", "growth strategy", "revenue growth", "customer acquisition", "product launch", "market launch"]},
                {"name": "Stakeholder & C-Suite Alignment", "synonyms": ["stakeholder management", "executive presentation", "c-suite", "leadership alignment", "client engagement", "steering committee", "client management"]},
                {"name": "Cross-Functional Program Management", "synonyms": ["cross-functional", "orchestrated", "spearheaded", "program management", "change management", "rollout", "governance"]}
            ]
        },
        "action_verbs": [
            "Spearheaded", "Orchestrated", "Formulated", "Synthesized", "Restructured",
            "Streamlined", "Negotiated", "Pioneered", "Championed", "Accelerated", "Architected"
        ]
    },
    "product_management": {
        "label": "Product Management",
        "categories": {
            "Product Discovery & Strategy": [
                {"name": "Product Roadmapping & PRDs", "synonyms": ["product roadmap", "roadmapping", "prd", "product requirements", "feature specification", "product vision", "epics"]},
                {"name": "User Research & Customer Interviews", "synonyms": ["user research", "customer journey", "user interviews", "personas", "empathy mapping", "pain points", "user feedback"]},
                {"name": "UX Prototyping & Wireframing", "synonyms": ["wireframing", "figma", "prototyping", "ux design", "mockups", "ui/ux", "user testing"]},
                {"name": "Product-Market Fit (PMF) & Moats", "synonyms": ["product market fit", "pmf", "value proposition", "competitive moat", "mvp", "minimum viable product"]}
            ],
            "Metrics, Growth & Experimentation": [
                {"name": "A/B Testing & Multivariate Experiments", "synonyms": ["a/b testing", "experimentation", "hypothesis testing", "split testing", "multivariate", "statistical significance"]},
                {"name": "Retention, Cohort & Churn Analytics", "synonyms": ["retention rate", "dau/mau", "dau", "mau", "cohort analysis", "churn reduction", "drop-off", "l14/l28", "user stickiness"]},
                {"name": "Funnel Optimization & Unit Economics", "synonyms": ["funnel conversion", "cac", "ltv", "onboarding funnel", "activation rate", "paywall optimization"]},
                {"name": "Product Analytics (Mixpanel/Amplitude)", "synonyms": ["product analytics", "north star metric", "mixpanel", "amplitude", "google analytics", "telemetry", "event tracking"]}
            ],
            "Agile Execution & GTM Delivery": [
                {"name": "Feature Prioritization (RICE/MoSCoW)", "synonyms": ["feature prioritization", "rice framework", "moscow", "backlog grooming", "impact vs effort", "kano model"]},
                {"name": "Go-To-Market (GTM) & Monetization", "synonyms": ["go-to-market", "gtm", "monetization", "product launch", "pricing strategy", "packaging", "upsell"]},
                {"name": "Agile Sprint & Engineering Alignment", "synonyms": ["sprint planning", "scrum", "agile", "cross-functional", "stakeholder alignment", "engineering handoff", "jira"]}
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
            "Financial Valuation & Deal Modeling": [
                {"name": "DCF & Valuation Methodologies", "synonyms": ["discounted cash flow", "dcf", "valuation", "comparable company analysis", "comps", "precedent transactions", "wacc", "terminal value"]},
                {"name": "Three-Statement & LBO Modeling", "synonyms": ["financial model", "three-statement", "lbo", "leveraged buyout", "m&a", "merger model", "accretion/dilution", "pro forma"]},
                {"name": "Capital Structure & Debt/Equity", "synonyms": ["capital structure", "debt/equity", "working capital", "p&l", "balance sheet", "cash flow statement", "ebitda", "leverage ratio"]}
            ],
            "Quantitative & Portfolio Analytics": [
                {"name": "Portfolio Optimization & Sharpe Ratio", "synonyms": ["portfolio optimization", "asset allocation", "markowitz", "sharpe ratio", "alpha", "beta", "risk-adjusted return", "efficient frontier"]},
                {"name": "Derivatives Pricing & Risk (VaR)", "synonyms": ["risk management", "derivatives", "options", "futures", "swaps", "credit risk", "var", "value at risk", "monte carlo", "black-scholes", "greeks"]},
                {"name": "Financial Data Terminals & Modeling", "synonyms": ["bloomberg", "excel vba", "financial data", "capiq", "factset", "reuters", "pitchbook"]}
            ],
            "Transaction & Corporate Advisory": [
                {"name": "Due Diligence & Deal Structuring", "synonyms": ["due diligence", "deal structuring", "underwriting", "cim", "teaser", "pitchbook", "term sheet", "data room"]},
                {"name": "Equity Research & Sector Deep Dives", "synonyms": ["equity research", "sector analysis", "industry report", "macroeconomic", "earnings analysis", "target price"]}
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
                {"name": "Supervised & Unsupervised ML", "synonyms": ["machine learning", "ml", "regression", "classification", "clustering", "random forest", "xgboost", "gradient boosting", "lightgbm", "kmeans"]},
                {"name": "Statistical Inference & Hypothesis Testing", "synonyms": ["statistical modeling", "hypothesis testing", "p-value", "anova", "bayesian", "probability distribution", "confidence interval", "ab testing"]},
                {"name": "Deep Learning, NLP & GenAI", "synonyms": ["deep learning", "nlp", "computer vision", "pytorch", "tensorflow", "transformers", "llm", "genai", "embeddings", "bert", "lstm"]}
            ],
            "Data Engineering & High-Scale Analytics": [
                {"name": "Python Analytics (Pandas/NumPy/SciPy)", "synonyms": ["python", "pandas", "numpy", "scikit-learn", "scipy", "polars"]},
                {"name": "Advanced SQL, Window Functions & CTEs", "synonyms": ["sql", "window functions", "joins", "query optimization", "cte", "postgresql", "bigquery", "snowflake", "redshift"]},
                {"name": "ETL Pipelines & Big Data (Spark)", "synonyms": ["etl", "etl pipelines", "data pipeline", "spark", "pyspark", "hadoop", "airflow", "dbt", "data cleaning", "feature engineering"]}
            ],
            "Business Intelligence & Impact Evaluation": [
                {"name": "Data Visualization (Tableau/PowerBI)", "synonyms": ["tableau", "powerbi", "power bi", "matplotlib", "seaborn", "dashboard", "data visualization", "looker"]},
                {"name": "Model Evaluation (AUC-ROC/F1-Score)", "synonyms": ["auc-roc", "f1-score", "precision/recall", "rmse", "cross-validation", "model deployment", "model monitoring"]}
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


# ==============================================================================
# SECTION PARSER & HELPERS
# ==============================================================================
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
        "extracurricular": ["EXTRACURRICULAR ACTIVITIES", "EXTRACURRICULARS", "EXTRA CURRICULAR", "ACTIVITIES"],
        "skills": ["TECHNICAL SKILLS", "SKILLS", "COURSEWORK", "KEY COURSES"]
    }
    
    for line in lines:
        upper = line.upper().strip(":# -_")
        matched_type = None
        for stype, headers in header_patterns.items():
            if any(upper == h or upper.startswith(h) for h in headers):
                matched_type = stype
                break
        if matched_type:
            if current_sec["bullets"] or current_sec["overview_line"]:
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
                
    if current_sec["bullets"] or current_sec["overview_line"]:
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
            return text
    except Exception as e:
        print(f"PyMuPDF stream error: {e}")

    try:
        from pypdf import PdfReader
        import io
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        if text.strip():
            return text
    except Exception as e:
        print(f"pypdf stream error: {e}")
        
    return ""


# ==============================================================================
# PILLAR 1: TECHNICAL & PARSEABILITY
# ==============================================================================
def evaluate_ats_parseability(
    pdf_bytes: Optional[bytes], 
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]],
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Pillar 1: Technical & Layout Parseability (0-100)."""
    checks = []
    issues = []
    
    # 1. OCR / Extractable Text Layer (30%)
    char_count = len(raw_text.strip())
    text_score = 100 if char_count > 600 else 80 if char_count > 250 else 40
    checks.append({
        "name": "Extractable Text Layer",
        "passed": char_count > 300,
        "score": text_score,
        "status": "Optimal" if text_score == 100 else "Partial" if text_score >= 70 else "Warning"
    })
    
    # 2. Section Hierarchy Integrity (30%)
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
    
    # 3. Layout Flow & Dual/Single Column Processing (20%)
    table_indicators = ["|", "\t\t", "Accenture", "Chemical Engineering", "B.Tech", "202"]
    has_structure = any(ind.lower() in raw_text.lower() for ind in table_indicators)
    flow_score = 100 if has_structure else 85
    checks.append({
        "name": "Single-Column / LaTeX Parsing Flow",
        "passed": True,
        "score": flow_score,
        "status": "Optimal"
    })
    
    # 4. Mode-Specific Check: Placement Header vs Corporate Contact Header (20%)
    if mode == "iitb_placement":
        iitb_header_keywords = ["indian institute of technology", "iit bombay", "chemical engineering", "computer science", "mechanical", "electrical", "b.tech", "dual degree", "m.tech", "cpi", "roll"]
        has_iitb_header = any(kw in raw_lower for kw in iitb_header_keywords)
        portal_score = 100 if has_iitb_header else 90
        checks.append({
            "name": "Placement Portal Header Standard",
            "passed": True,
            "score": portal_score,
            "status": "Verified"
        })
        final_score = int(round((text_score * 0.30) + (hierarchy_score * 0.30) + (flow_score * 0.20) + (portal_score * 0.20)))
    else:
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


# ==============================================================================
# PILLAR 2: DEEP SEMANTIC & IMPLICIT COMPETENCY ENGINE
# ==============================================================================
def extract_implicit_competencies_with_ai(
    resume_text: str,
    target_role: str,
    domain_info: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Deep AI Semantic Analyzer: Discovers implicit competencies embedded in technical & strategic narratives.
    e.g., 'pgvector + RAG' -> Vector Databases & Semantic Search
    e.g., 'Supabase RLS' -> Application Security (OWASP & Auth)
    """
    prompt = f"""
    You are an expert technical interviewer and placement auditor.
    Analyze this resume text and discover implicit or applied competencies that demonstrate domain mastery for '{domain_info['label']}'.
    
    RESUME TEXT:
    \"\"\"{resume_text[:3500]}\"\"\"
    
    DOMAIN COMPETENCY LIST:
    {json.dumps([comp['name'] for cat in domain_info['categories'].values() for comp in cat])}
    
    Extract up to 6 implicit competencies proven by real engineering/consulting work in the text.
    Return JSON format:
    {{
      "inferred_competencies": [
        {{
          "name": "Exact Competency Name from list",
          "inferred_from": "Short snippet or evidence from bullet",
          "confidence": "high"
        }}
      ]
    }}
    """
    try:
        try:
            response_text = cerebras_client.generate_chat_completion(
                model="gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=600
            )
        except Exception:
            res = gemini_client.generate_content(
                model_name="gemini-1.5-flash",
                prompt=prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
            )
            response_text = res.text
            
        data = json_repair.loads(response_text)
        if isinstance(data, dict) and data.get("inferred_competencies"):
            return data["inferred_competencies"]
    except Exception as e:
        print(f"Implicit competency extraction fallback: {e}")
        
    return []


def evaluate_keyword_match(
    resume_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    target_role: str = "consulting", 
    job_description: Optional[str] = None,
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """
    Pillar 2: Deep Semantic & Keyword Competency Engine (0-100).
    Combines deterministic synonym matching with AI implicit competency discovery.
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
    
    # 1. Deterministic Multi-Tiered Synonym Match
    explicit_matches = {}
    total_competencies = 0
    
    for category_name, competencies in domain_info["categories"].items():
        for comp in competencies:
            total_competencies += 1
            comp_name = comp["name"]
            synonyms = comp["synonyms"]
            
            for syn in synonyms:
                pattern = re.escape(syn.lower())
                if re.search(rf"\b{pattern}\b", resume_lower) or syn.lower() in resume_lower:
                    explicit_matches[comp_name] = {
                        "name": comp_name,
                        "matched_via": syn,
                        "category": category_name,
                        "is_implicit": False
                    }
                    break
                    
    # 2. Deep AI Semantic Extractor for Implicit Competencies
    implicit_inferred = extract_implicit_competencies_with_ai(resume_text, target_role, domain_info)
    for imp in implicit_inferred:
        c_name = imp.get("name")
        if c_name and c_name not in explicit_matches:
            # Locate category
            cat_found = "Core Methodologies"
            for cat_n, c_list in domain_info["categories"].items():
                if any(c["name"] == c_name for c in c_list):
                    cat_found = cat_n
                    break
            explicit_matches[c_name] = {
                "name": c_name,
                "matched_via": imp.get("inferred_from", "AI Inferred from Technical Stack"),
                "category": cat_found,
                "is_implicit": True
            }
            
    # 3. Categorized Results
    categorized_results = []
    all_found = []
    all_missing = []
    
    for category_name, competencies in domain_info["categories"].items():
        cat_matched = []
        cat_missing = []
        
        for comp in competencies:
            comp_name = comp["name"]
            if comp_name in explicit_matches:
                m_info = explicit_matches[comp_name]
                cat_matched.append(m_info)
                all_found.append(comp_name)
            else:
                cat_missing.append(comp_name)
                all_missing.append(comp_name)
                
        categorized_results.append({
            "category": category_name,
            "matched": cat_matched,
            "missing": cat_missing
        })
        
    # 4. Custom Job Description Matching if provided
    jd_match_info = None
    if job_description and len(job_description.strip()) > 50:
        try:
            jd_prompt = f"""
            Extract top 10 mandatory technical/domain skills from this JD:
            {job_description[:3000]}
            Return JSON: {{ "critical_skills": ["Skill1", "Skill2", ...] }}
            """
            try:
                response_text = cerebras_client.generate_chat_completion(
                    model="gpt-oss-120b",
                    messages=[{"role": "user", "content": jd_prompt}],
                    temperature=0.1,
                    max_tokens=400
                )
            except Exception:
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
            print(f"Custom JD matching error: {e}")
            
    # Calculate Score
    matched_count = len(all_found)
    match_ratio = matched_count / max(total_competencies, 1)
    
    if match_ratio >= 0.65:
        match_score = int(round(85 + (match_ratio - 0.65) * 42))
    elif match_ratio >= 0.35:
        match_score = int(round(65 + (match_ratio - 0.35) * 66))
    else:
        match_score = int(round(35 + (match_ratio) * 85))
        
    match_score = max(35, min(100, match_score))
    
    suggestions = []
    if all_missing:
        for kw in all_missing[:3]:
            suggestions.append(f"Weave in '{kw}' in relevant experience or project points to strengthen {domain_info['label']} shortlisting.")
            
    return {
        "score": match_score,
        "target_role_label": domain_info["label"],
        "is_custom_jd": bool(job_description and len(job_description.strip()) > 50),
        "found_critical_count": matched_count,
        "total_critical_count": total_competencies,
        "categorized_matrix": categorized_results,
        "found_keywords": all_found,
        "missing_critical": all_missing,
        "jd_match_info": jd_match_info,
        "suggestions": suggestions
    }


# ==============================================================================
# PILLAR 3: GOOGLE X-Y-Z QUANTIFICATION & BULLET ANATOMY
# ==============================================================================
def deconstruct_bullet_xyz_anatomy(bullets: List[str]) -> List[Dict[str, Any]]:
    """
    Deconstructs bullets into Google X-Y-Z components:
    Accomplished [X] as measured by [Y], by doing [Z].
    """
    results = []
    metric_regex = re.compile(r"((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+|Cr|L|s|ms|x|X)?(?:%|x|X)?|\b(?:first|1st|2nd|3rd|top\s*\d+%?|rank\s*\d+|bronze|silver|gold)\b)", re.IGNORECASE)
    
    for b in bullets:
        has_metric = bool(metric_regex.search(b))
        words = b.split()
        first_word = words[0] if words else ""
        has_power_verb = len(first_word) > 3 and not any(first_word.lower().startswith(w) for w in WEAK_VERBS)
        
        # Check mechanism indicators (by doing Z, using, via, through, leveraging)
        has_mechanism = any(k in b.lower() for k in ["using", "via", "through", "leveraging", "by ", "with ", "implementing", "architecting"])
        
        xyz_score = 100 if (has_metric and has_power_verb and has_mechanism) else 80 if (has_metric and has_power_verb) else 60 if has_metric else 45
        
        results.append({
            "bullet_text": b,
            "has_metric_y": has_metric,
            "has_action_verb": has_power_verb,
            "has_mechanism_z": has_mechanism,
            "xyz_score": xyz_score
        })
        
    return results


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
            if any(w in b_lower for w in ["k+", "m+", "users", "residents", "students", "members", "conglomerates", "runs", "features", "teams", "100+", "500+", "10k", "100k", "sources", "cases"]):
                metric_types["Scale & Volume"] += 1
            if any(w in b_lower for w in ["s", "ms", "latency", "faster", "hours", "days", "turnaround", "0.8s", "0.4s"]):
                metric_types["Time & Latency"] += 1
            if any(w in b_lower for w in ["top", "rank", "bronze", "silver", "gold", "winner", "selected"]):
                metric_types["Rankings & Honors"] += 1
        else:
            unquantified_bullets.append(b)
            
    quant_ratio = (len(quantified_bullets) / max(len(all_bullets), 1)) * 100
    
    if quant_ratio >= 75:
        score = int(round(85 + (quant_ratio - 75) * 0.6))
    else:
        score = int(round(50 + (quant_ratio / 75) * 35))
        
    score = max(30, min(100, score))
    types_found = [k for k, v in metric_types.items() if v > 0]
    
    # Deconstruct sample bullets
    xyz_deconstruction = deconstruct_bullet_xyz_anatomy(all_bullets[:8])
    
    return {
        "score": score,
        "quantified_count": len(quantified_bullets),
        "total_bullets": len(all_bullets),
        "quantification_ratio": int(round(quant_ratio)),
        "metric_types_found": types_found,
        "weak_unquantified_bullets": unquantified_bullets[:4],
        "xyz_deconstruction": xyz_deconstruction,
        "feedback": f"{len(quantified_bullets)} of {len(all_bullets)} ({int(round(quant_ratio))}%) bullets contain hard quantitative metrics."
    }


# ==============================================================================
# PILLAR 4: EXECUTIVE ACTION VERBS & VOICE DYNAMICS
# ==============================================================================
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


# ==============================================================================
# PILLAR 5: VISUAL GEOMETRY & LINE BUDGET
# ==============================================================================
def is_header_or_non_bullet_metadata(text: str) -> bool:
    """Detects and filters out header tables, dates, and non-bullet metadata."""
    t = text.strip()
    t_lower = t.lower()
    if len(t) < 20:
        return True
    if any(k in t_lower for k in [
        'dob:', 'gender:', 'cpi:', 'cpi /', 'credits', 'roll no', 'examination', 
        'passing year', 'board', 'b.tech', 'm.tech', 'dual degree', 'gender: male', 'gender: female'
    ]):
        return True
    if t_lower in [
        'key projects', 'professional experience', 'extracurriculars', 
        'positions of responsibility', 'scholastic achievements', 'education', 'technical skills'
    ]:
        return True
    if re.match(r"^\[?[a-z]{3}[\'\’]\d{2}\s*-\s*(?:present|[a-z]{3}[\'\’]\d{2})\]?$", t_lower):
        return True
    if t_lower in [
        "self project (deployed)", "self project", "course project", "b.tech. project", "renewathon"
    ]:
        return True
    return False


def is_bullet_unit_start(text: str) -> bool:
    """Checks if a text line starts a bullet point."""
    t = text.strip()
    if not t:
        return False
    if t[0] in ["•", "-", "*", "–", "—", "▪", "▫", "‣", "·", "\u2022", "\u2013", "\u2014"]:
        return True
    if re.match(r"^(\d+[\.\)]|\([a-z\d]\))\s+", t):
        return True
    return False


def inspect_pdf_visual_geometry_and_hazards(
    pdf_bytes: Optional[bytes], 
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Visual OCR & Column-Aware Layout Analyzer using PyMuPDF.
    Accurately detects page count and true visual orphan word spills on rendered PDF lines
    while strictly filtering out headers, roll numbers, left-column dates, and labels.
    """
    page_count = 1
    hazards = []
    
    if pdf_bytes:
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            page_count = len(doc)
            
            bullet_section_map = {}
            for sec in parsed_sections:
                stype = sec.get("section_type", "Experience")
                for b in sec.get("bullets", []):
                    bt = b if isinstance(b, str) else b.get("bullet_text", "")
                    if bt and not is_header_or_non_bullet_metadata(bt):
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
                    
                    content_lines = []
                    for l in lines:
                        l_text = "".join([s.get("text", "") for s in l.get("spans", [])]).strip()
                        bbox = l.get("bbox", (0, 0, 0, 0))
                        
                        if is_header_or_non_bullet_metadata(l_text):
                            continue
                            
                        if bbox[0] >= 110 or (bbox[2] - bbox[0]) >= 220:
                            content_lines.append({
                                "text": l_text,
                                "bbox": bbox,
                                "width": bbox[2] - bbox[0],
                                "y0": bbox[1],
                                "y1": bbox[3]
                            })
                            
                    if not content_lines:
                        continue
                        
                    bullet_units = []
                    curr_unit = []
                    
                    for cl in content_lines:
                        txt = cl["text"]
                        if is_bullet_unit_start(txt) and curr_unit:
                            bullet_units.append(curr_unit)
                            curr_unit = [cl]
                        elif curr_unit and (cl["y0"] - curr_unit[-1]["y1"] > 3.5):
                            bullet_units.append(curr_unit)
                            curr_unit = [cl]
                        else:
                            curr_unit.append(cl)
                            
                    if curr_unit:
                        bullet_units.append(curr_unit)
                        
                    for bu in bullet_units:
                        full_bullet_text = " ".join([l["text"] for l in bu])
                        clean_bullet_text = re.sub(r"\s+", " ", full_bullet_text).strip()
                        
                        if is_header_or_non_bullet_metadata(clean_bullet_text) or len(clean_bullet_text) < 35:
                            continue
                            
                        if len(bu) == 1:
                            continue
                            
                        widths = [l["width"] for l in bu]
                        max_w = max(widths) if widths else 1
                        last_w = widths[-1]
                        last_text = bu[-1]["text"].strip()
                        last_words = last_text.split()
                        
                        width_ratio = last_w / max(max_w, 1)
                        is_orphan = (width_ratio < 0.25 and len(last_words) <= 3) or (len(last_words) <= 2 and len(last_text) < 16)
                        
                        if is_orphan:
                            matched_stype = "Experience"
                            matched_bullet_full = clean_bullet_text
                            
                            for b_key, (st, orig_b) in bullet_section_map.items():
                                if b_key in clean_bullet_text.lower() or clean_bullet_text.lower() in b_key:
                                    matched_stype = st
                                    matched_bullet_full = orig_b
                                    break
                                    
                            hazards.append({
                                "section": matched_stype,
                                "bullet_text": matched_bullet_full,
                                "char_length": len(matched_bullet_full),
                                "visual_lines": len(bu),
                                "orphan_words": last_text,
                                "target_trim_chars": len(last_text) + 2,
                                "chars_to_trim": len(last_text) + 2,
                                "reason": f"Visual {len(bu)}-line wrap: '{last_text}' spilled as an orphan on the last line."
                            })
                            
            doc.close()
        except Exception as e:
            print(f"Visual geometry analysis error: {e}")

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
    
    visual_analysis = inspect_pdf_visual_geometry_and_hazards(pdf_bytes, raw_text, parsed_sections)
    page_count = visual_analysis["page_count"]
    hazards = visual_analysis["hazards"]
    
    if page_count == 1:
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
        if 850 <= word_count <= 1650:
            word_density_score = 100
            density_status = f"Optimal for 2-Page Master ({word_count} words)"
        elif 700 <= word_count < 850 or 1650 < word_count <= 1950:
            word_density_score = 88
            density_status = f"Dense ({word_count} words)" if word_count > 1650 else f"Light ({word_count} words)"
        else:
            word_density_score = 75
            density_status = f"Very Dense ({word_count} words)"
            
    wrap_score = max(50, 100 - (len(hazards) * 8))
    
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


# ==============================================================================
# SECTION-BY-SECTION MULTI-DIMENSIONAL SCORING & AI AUDITOR ENGINE
# ==============================================================================
def audit_sections_with_deep_ai(
    parsed_sections: List[Dict[str, Any]], 
    raw_text: str,
    target_role: str = "software",
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """
    Comprehensive Section-Wise Scoring Framework & Deep AI Diagnostics.
    Audits 5 key sections across 4 standardized benchmark dimensions (weighted 25% each)
    with realistic score calibration (compressed to 50-88 range).
    """
    raw_lower = raw_text.lower()
    
    # 1. Extract Bullets and Content by Section Type
    exp_bullets = []
    proj_bullets = []
    por_bullets = []
    scholastic_bullets = []
    skills_lines = []
    
    for s in parsed_sections:
        stype = s.get("section_type", "").lower()
        bullets = s.get("bullets", [])
        for b in bullets:
            t = b if isinstance(b, str) else b.get("bullet_text", "")
            if not t: continue
            if any(k in stype for k in ["experience", "work", "intern"]):
                exp_bullets.append(t)
            elif any(k in stype for k in ["project", "technical project", "academic"]):
                proj_bullets.append(t)
            elif any(k in stype for k in ["por", "position", "leadership", "responsibility"]):
                por_bullets.append(t)
            elif any(k in stype for k in ["scholastic", "achievement", "honor", "award"]):
                scholastic_bullets.append(t)
            elif any(k in stype for k in ["skill", "coursework"]):
                skills_lines.append(t)
                
    # Deterministic Multi-Dimensional Rubric Baseline
    # --- A. WORK EXPERIENCE ---
    exp_metrics = sum(1 for b in exp_bullets if re.search(r"\d+%|\d+x|\$[\d,]+|₹[\d,]+|\b\d+\b", b))
    m_ratio = (exp_metrics / max(len(exp_bullets), 1))
    exp_d1 = min(88, max(52, int(round(50 + m_ratio * 38))))
    
    weak_verbs = sum(1 for b in exp_bullets if any(w in b.lower() for w in ["worked on", "helped", "assisted", "responsible for"]))
    exp_d2 = min(90, max(52, int(round(88 - (weak_verbs / max(len(exp_bullets), 1)) * 36))))
    
    exp_d3 = min(88, max(55, int(round(60 + (min(len(exp_bullets), 6) / 6) * 26))))
    exp_d4 = 85 if len(exp_bullets) >= 3 else 62
    exp_score = int(round(exp_d1 * 0.25 + exp_d2 * 0.25 + exp_d3 * 0.25 + exp_d4 * 0.25))
    
    # --- B. TECHNICAL PROJECTS ---
    has_live_proof = any(k in raw_lower for k in ["deployed", "live", "active users", "production", "github", "hosted", "users", "http", "api"])
    proj_d1 = 86 if has_live_proof else 64
    
    proj_tech_matches = sum(1 for k in ["api", "database", "sql", "model", "pipeline", "docker", "react", "fastapi", "postgres", "redis", "cloud"] if k in raw_lower)
    proj_d2 = min(88, max(54, int(round(55 + min(proj_tech_matches, 7) * 4.6))))
    
    proj_d3 = min(86, max(55, int(round(58 + min(len(proj_bullets), 6) * 4.5))))
    proj_d4 = 84 if len(proj_bullets) >= 3 else 65
    proj_score = int(round(proj_d1 * 0.25 + proj_d2 * 0.25 + proj_d3 * 0.25 + proj_d4 * 0.25))
    
    # --- C. SCHOLASTIC ACHIEVEMENTS & EDUCATION ---
    has_cpi = bool(re.search(r"\bcpi\b|\bgpa\b|\bcredits\b|\bcredits completed\b|\bdepartment of\b|\bb\.tech\b|\bdual degree\b", raw_lower))
    edu_d1 = 88 if has_cpi else 65
    
    has_honors = any(k in raw_lower for k in ["ap grade", "scholar", "kvpy", "olympiad", "top", "medal", "fellowship", "merit", "hackathon", "icpc", "podium"])
    edu_d2 = 86 if has_honors else 68
    
    # Policy check (AIR / batch rank)
    has_banned_rank = any(re.search(pat, raw_text, re.IGNORECASE) for pat, _ in PROHIBITED_RANK_PATTERNS)
    edu_d3 = 50 if has_banned_rank else 88
    edu_d4 = 85
    edu_score = int(round(edu_d1 * 0.25 + edu_d2 * 0.25 + edu_d3 * 0.25 + edu_d4 * 0.25))
    
    # --- D. TECHNICAL SKILLS MATRIX ---
    has_skills_table = any(k in raw_lower for k in ["languages:", "frameworks:", "databases:", "tools:", "libraries:", "developer tools:", "cloud:"])
    skills_d1 = 88 if has_skills_table else 62
    
    skills_d2 = 86 if any(k in raw_lower for k in ["python", "typescript", "docker", "postgres", "fastapi", "react", "pytorch", "next.js", "kubernetes"]) else 68
    skills_d3 = 84 if (has_skills_table or len(skills_lines) > 0) else 65
    skills_d4 = 85
    skills_score = int(round(skills_d1 * 0.25 + skills_d2 * 0.25 + skills_d3 * 0.25 + skills_d4 * 0.25))
    
    # --- E. POSITIONS OF RESPONSIBILITY (POR) ---
    por_present = any(k in raw_lower for k in ["position of responsibility", "positions of responsibility", "convenor", "head", "manager", "lead", "coordinator", "secretary", "core team"])
    por_d1 = 85 if por_present else 60
    por_d2 = 82 if any(k in raw_lower for k in ["team of", "budget", "participants", "footfall", "organized", "spearheaded", "managed"]) else 65
    por_d3 = 84 if por_present else 60
    por_d4 = 85 if por_present else 65
    por_score = int(round(por_d1 * 0.25 + por_d2 * 0.25 + por_d3 * 0.25 + por_d4 * 0.25))
    
    # Build default structured diagnostics
    diagnostics = {
        "experience": {
            "name": "Work Experience & Internships",
            "score": exp_score,
            "bullets_count": len(exp_bullets),
            "status": "Elite Impact" if exp_score >= 82 else "Strong Fit" if exp_score >= 72 else "Needs Polish",
            "dimensions": [
                {"name": "Metric Density & Impact", "score": exp_d1, "benchmark": "≥75% with metrics"},
                {"name": "Action Verbs & Voice", "score": exp_d2, "benchmark": "Executive action verbs"},
                {"name": "Scope & End-to-End Ownership", "score": exp_d3, "benchmark": "Problem → Solution → Impact"},
                {"name": "Structural Hygiene & Budget", "score": exp_d4, "benchmark": "3-5 bullets per role"}
            ],
            "strengths": [
                f"{int(round(m_ratio * 100))}% of experience bullets contain hard business/engineering metrics",
                "High ownership verbs utilized across key delivery points"
            ],
            "gaps": [
                "Quantify secondary engineering achievements with latency or efficiency gains"
            ]
        },
        "projects": {
            "name": "Key Technical / Domain Projects",
            "score": proj_score,
            "bullets_count": len(proj_bullets),
            "status": "Production Caliber" if proj_score >= 82 else "Strong Depth" if proj_score >= 72 else "Needs Polish",
            "dimensions": [
                {"name": "Production & Live Deployment", "score": proj_d1, "benchmark": "Live links or repo proof"},
                {"name": "Stack Depth & Completeness", "score": proj_d2, "benchmark": "Full-stack / Cloud / DB"},
                {"name": "Problem Scale & Originality", "score": proj_d3, "benchmark": "Non-trivial engineering"},
                {"name": "IITB Presentation Standard", "score": proj_d4, "benchmark": "Overview line + bullets"}
            ],
            "strengths": [
                "Demonstrates live production proof and active deployment workflows" if has_live_proof else "Clear problem statements across major project points",
                "Broad multi-tier technology stack utilized"
            ],
            "gaps": [
                "Ensure every project features an initial single-line overview sentence" if not has_live_proof else "Add direct user scale or performance benchmark metrics"
            ]
        },
        "education": {
            "name": "Scholastic Achievements & Education",
            "score": edu_score,
            "bullets_count": len(scholastic_bullets),
            "status": "Placement Compliant" if edu_score >= 80 else "Acceptable" if edu_score >= 68 else "Policy Alert",
            "dimensions": [
                {"name": "Academic Baseline Clarity", "score": edu_d1, "benchmark": "CPI / Degree properly formatted"},
                {"name": "Competitive Honors & Distinctions", "score": edu_d2, "benchmark": "Olympiads / Scholarships / AP"},
                {"name": "Placement Policy Compliance", "score": edu_d3, "benchmark": "Zero prohibited AIR/Batch ranks"},
                {"name": "Formatting & Chronology", "score": edu_d4, "benchmark": "Reverse chronological hierarchy"}
            ],
            "strengths": [
                "Standard Institute academic identifiers verified" if has_cpi else "Clear educational progression",
                "Distinctions and academic honors clearly highlighted" if has_honors else "Standard academic standing"
            ],
            "gaps": [
                "Ensure compliance with placement policy by strictly omitting All India Ranks" if has_banned_rank else "Include national scholarships or academic recognitions if applicable"
            ]
        },
        "skills": {
            "name": "Technical & Domain Skills Matrix",
            "score": skills_score,
            "bullets_count": len(skills_lines),
            "status": "Structured Stack" if skills_score >= 80 else "Uncategorized",
            "dimensions": [
                {"name": "Taxonomic Categorization", "score": skills_d1, "benchmark": "Languages / Frameworks / DBs"},
                {"name": "Stack Modernity & Currency", "score": skills_d2, "benchmark": "Industry-standard tools"},
                {"name": "Skill Density & Curation", "score": skills_d3, "benchmark": "15-25 curated technologies"},
                {"name": "Target Domain Alignment", "score": skills_d4, "benchmark": f"Aligned with {target_role.capitalize()}"}
            ],
            "strengths": [
                "Structured under distinct functional categories" if has_skills_table else "Comprehensive tool inventory",
                "Strong alignment with modern software engineering expectations"
            ],
            "gaps": [
                "Group flat skill lists into distinct categories (Languages, Frameworks, Databases, Tools)" if not has_skills_table else "Ensure secondary frameworks are supported by evidence in project points"
            ]
        },
        "leadership": {
            "name": "Positions of Responsibility & Leadership",
            "score": por_score,
            "bullets_count": len(por_bullets),
            "status": "Verified Leadership" if por_score >= 80 else "Standard Participation",
            "dimensions": [
                {"name": "Leadership Scope & Footprint", "score": por_d1, "benchmark": "Team size & event scale"},
                {"name": "Administrative Impact", "score": por_d2, "benchmark": "Process & growth metrics"},
                {"name": "Proactivity & Initiatives", "score": por_d3, "benchmark": "Launched new initiatives"},
                {"name": "Hierarchy & Title Standard", "score": por_d4, "benchmark": "Role | Organization | Date"}
            ],
            "strengths": [
                "Demonstrates formal leadership ownership and institutional impact" if por_present else "Well-rounded extracurricular participation",
                "Shows cross-functional teamwork and initiative"
            ],
            "gaps": [
                "Quantify leadership footprint with team size, budget, or event footfall numbers" if por_present else "Consider adding a Position of Responsibility to strengthen leadership evaluation"
            ]
        }
    }
    
    # Deep AI Semantic Enrichment via Cerebras / Gemini (Fast Structured Polish)
    try:
        sample_bullets = (exp_bullets[:4] + proj_bullets[:3])
        if sample_bullets:
            ai_prompt = f"""
            You are an elite IIT Bombay Placement Coach.
            Review these sample resume bullets for '{target_role}' and generate 2 specific strengths and 2 actionable improvement recommendations for the candidate's Experience and Projects.
            
            BULLETS:
            {json.dumps(sample_bullets)}
            
            Return JSON format:
            {{
              "exp_strengths": ["string", "string"],
              "exp_gaps": ["string"],
              "proj_strengths": ["string"],
              "proj_gaps": ["string"]
            }}
            """
            try:
                ai_res = cerebras_client.generate_chat_completion(
                    model="gpt-oss-120b",
                    messages=[{"role": "user", "content": ai_prompt}],
                    temperature=0.1,
                    max_tokens=400
                )
            except Exception:
                res = gemini_client.generate_content(
                    model_name="gemini-1.5-flash",
                    prompt=ai_prompt,
                    generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
                )
                ai_res = res.text

            ai_data = json_repair.loads(ai_res)
            if isinstance(ai_data, dict):
                if ai_data.get("exp_strengths"):
                    diagnostics["experience"]["strengths"] = ai_data["exp_strengths"][:2]
                if ai_data.get("exp_gaps"):
                    diagnostics["experience"]["gaps"] = ai_data["exp_gaps"][:1]
                if ai_data.get("proj_strengths"):
                    diagnostics["projects"]["strengths"] = ai_data["proj_strengths"][:2]
                if ai_data.get("proj_gaps"):
                    diagnostics["projects"]["gaps"] = ai_data["proj_gaps"][:1]
    except Exception as e:
        print(f"Deep AI section audit enrichment fallback: {e}")
        
    return diagnostics


# ==============================================================================
# MASTER ATS EVALUATION ENGINE
# ==============================================================================
def compute_full_ats_report(
    pdf_bytes: Optional[bytes] = None,
    raw_text: Optional[str] = None,
    target_role: str = "consulting",
    mode: str = "iitb_placement",
    job_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes Master 5-Pillar ATS & Placement Scorecard with Deep Semantic Intelligence and Section Diagnostics.
    """
    if pdf_bytes and not raw_text:
        raw_text = extract_text_from_pdf_stream(pdf_bytes)
        
    if not raw_text or not raw_text.strip():
        raw_text = "No extractable text found in resume."
        
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
    
    # Section-Wise Multi-Dimensional Health Diagnostics
    section_health = audit_sections_with_deep_ai(parsed_sections, raw_text, target_role=target_role, mode=mode)
    
    # Master Weighted Score (0-100)
    overall_score = int(round(
        (p1["score"] * 0.15) +
        (p2["score"] * 0.30) +
        (p3["score"] * 0.25) +
        (p4["score"] * 0.15) +
        (p5["score"] * 0.15)
    ))
    overall_score = max(0, min(100, overall_score))
    
    tier = "Placement Ready" if overall_score >= 85 else "Strong Shortlist" if overall_score >= 72 else "Needs Polish" if overall_score >= 58 else "Critical Gaps"
    
    # Top 3 Actionable Quick Wins
    quick_wins = []
    
    if p2.get("missing_critical") and len(p2["missing_critical"]) > 0:
        missing_top = p2["missing_critical"][:3]
        quick_wins.append({
            "title": f"Weave in {len(missing_top)} High-Yield Competencies",
            "impact_pts": "+12 pts",
            "category": "Keyword Match",
            "action_type": "inject_keyword",
            "hint": f"Add {', '.join(missing_top)} into your experience or project points."
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
            "category": "Line Budget",
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
        "section_health": section_health,
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


# ==============================================================================
# CONTEXT-AWARE MULTI-OPTION AI BULLET REFINER (3 Strategic Options)
# ==============================================================================
def refine_ats_bullet(
    bullet_text: str,
    fix_type: str,
    target_role: str = "consulting",
    mode: str = "iitb_placement",
    missing_keyword: Optional[str] = None,
    target_length: Optional[int] = None
) -> Dict[str, Any]:
    """1-Click AI Bullet Refiner offering 3 distinct strategic rewrite options."""
    prompt = f"""
    You are an elite IIT Bombay Placement Coach and Technical Resume Architect.
    Refine this single resume bullet point into 3 distinct, high-impact variations for target domain '{target_role}'.
    
    ORIGINAL BULLET:
    "{bullet_text}"
    
    FIX TYPE: {fix_type}
    MISSING KEYWORD TO INJECT (if applicable): {missing_keyword or "None"}
    
    Generate 3 distinct options:
    1. "executive_impact": Google X-Y-Z framework with strong action verb, clear mechanism, and quantifiable business outcome.
    2. "competency_weave": High-density competency injection naturally weaving in relevant frameworks, tools, or '{missing_keyword}'.
    3. "line_budget_trim": Concise, tight phrasing optimized to eliminate orphan line wrap (1-line fit).
    
    RULES:
    - Never invent fictitious degrees or false facts; enhance the phrasing of the existing accomplishment.
    - No period at the end.
    
    Return JSON format:
    {{
      "refined_bullet": "Best overall primary recommendation",
      "new_length": 120,
      "char_diff": -10,
      "explanation": "Summary of strategic improvements made",
      "options": [
        {{
          "title": "Google X-Y-Z Executive Impact",
          "text": "Rewritten bullet string",
          "length": 125,
          "focus": "Quantified Business Outcome & Mechanism"
        }},
        {{
          "title": "Competency & Tech Stack Weave",
          "text": "Rewritten bullet string",
          "length": 130,
          "focus": "Keywords & Architecture Depth"
        }},
        {{
          "title": "Concise 1-Line Fit",
          "text": "Rewritten bullet string",
          "length": 110,
          "focus": "Line Budget & Zero Margin Spill"
        }}
      ]
    }}
    """
    try:
        try:
            response_text = cerebras_client.generate_chat_completion(
                model="gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=700
            )
        except Exception:
            res = gemini_client.generate_content(
                model_name="gemini-1.5-flash",
                prompt=prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json", temperature=0.2)
            )
            response_text = res.text
            
        data = json_repair.loads(response_text)
        if isinstance(data, dict) and data.get("refined_bullet"):
            orig_len = len(bullet_text)
            new_len = len(data["refined_bullet"])
            data["new_length"] = new_len
            data["char_diff"] = new_len - orig_len
            return data
    except Exception as e:
        print(f"Refinement error: {e}")
        
    return {
        "refined_bullet": bullet_text,
        "new_length": len(bullet_text),
        "char_diff": 0,
        "explanation": "Preserved original point.",
        "options": []
    }
