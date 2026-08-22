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
# GRANULAR DOMAIN TAXONOMY & HIGH-YIELD COMPETENCY CLUSTERS
# ==============================================================================
DOMAIN_TAXONOMY = {
    "software": {
        "label": "Software Engineering / IT",
        "sub_tracks": {
            "sde_generalist": {"label": "Full-Stack / General SDE", "priority_categories": ["Core Languages & Runtimes", "Architecture & Distributed Systems", "Databases & Storage Architecture"]},
            "frontend": {"label": "Frontend & Web Architecture", "priority_categories": ["Frontend & Modern Web Stack", "Core Languages & Runtimes", "Quality, AppSec & Observability"]},
            "backend": {"label": "Backend & Distributed Systems", "priority_categories": ["Architecture & Distributed Systems", "Databases & Storage Architecture", "Core Languages & Runtimes"]},
            "ai_ml": {"label": "AI/ML Engineering & LLMOps", "priority_categories": ["AI/ML Engineering & LLMOps", "Core Languages & Runtimes", "Databases & Storage Architecture"]},
            "devops": {"label": "DevOps & Cloud Infrastructure", "priority_categories": ["Cloud, DevOps & Production Infrastructure", "Quality, AppSec & Observability", "Architecture & Distributed Systems"]}
        },
        "categories": {
            "Core Languages & Runtimes": [
                {"name": "Python & Modern Async", "synonyms": ["python", "asyncio", "pydantic", "fastapi", "pytest", "cython", "poetry", "uv"]},
                {"name": "C++ & Low-Level Systems", "synonyms": ["c++", "cpp", "c++17", "c++20", "pointers", "memory management", "stl", "raii", "valgrind", "cmake"]},
                {"name": "Java / Spring Ecosystem", "synonyms": ["java", "spring boot", "spring", "jvm", "hibernate", "maven", "gradle", "junit"]},
                {"name": "TypeScript & Modern JS", "synonyms": ["typescript", "javascript", "ecmascript", "es6", "node.js", "deno", "bun"]},
                {"name": "Go (Golang) / Rust", "synonyms": ["golang", "go", "goroutines", "rust", "cargo", "rustlang", "actix", "tokio"]}
            ],
            "Frontend & Modern Web Stack": [
                {"name": "React & Next.js Ecosystem", "synonyms": ["react", "next.js", "nextjs", "react hooks", "server components", "redux", "zustand", "tanstack query", "vue", "tailwind", "styled-components"]},
                {"name": "Web Performance & Core Web Vitals", "synonyms": ["core web vitals", "lighthouse", "ssr", "ssg", "csr", "code splitting", "tree shaking", "lazy loading", "hydration", "accessibility", "a11y", "wcag"]}
            ],
            "Architecture & Distributed Systems": [
                {"name": "System Design & Microservices", "synonyms": ["system design", "system architecture", "microservices", "service-oriented", "domain driven design", "scalability"]},
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
                {"name": "Model Serving & Deep Learning", "synonyms": ["pytorch", "tensorflow", "onnx", "tensorrt", "vllm", "huggingface", "transformers", "model serving", "quantization"]}
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
        "sub_tracks": {
            "general_strategy": {"label": "General Strategy & Advisory", "priority_categories": ["Core Strategic Frameworks", "Executive Leadership & Alignment"]},
            "operations": {"label": "Operations & Supply Chain", "priority_categories": ["Operational & Financial Transformation", "Executive Leadership & Alignment"]},
            "esg": {"label": "ESG & Sustainability", "priority_categories": ["ESG, Risk & Digital Transformation", "Core Strategic Frameworks"]},
            "digital_ai": {"label": "Digital & AI Strategy", "priority_categories": ["ESG, Risk & Digital Transformation", "Core Strategic Frameworks"]}
        },
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
        "sub_tracks": {
            "b2b_tech": {"label": "Technical & B2B SaaS PM", "priority_categories": ["Product Discovery & Strategy", "Agile Execution & GTM Delivery"]},
            "b2c_growth": {"label": "Growth & B2C Product", "priority_categories": ["Metrics, Growth & Experimentation", "Product Discovery & Strategy"]}
        },
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
        "sub_tracks": {
            "ib_pe": {"label": "Investment Banking & Private Equity", "priority_categories": ["Financial Valuation & Deal Modeling", "Transaction & Corporate Advisory"]},
            "quant_trading": {"label": "Quantitative Research & Trading", "priority_categories": ["Quantitative & Portfolio Analytics", "Financial Valuation & Deal Modeling"]}
        },
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
        "sub_tracks": {
            "ml_ai": {"label": "Machine Learning & AI Modeling", "priority_categories": ["Machine Learning & Statistical Modeling", "Business Intelligence & Impact Evaluation"]},
            "data_engineering": {"label": "Data Engineering & Big Data", "priority_categories": ["Data Engineering & High-Scale Analytics", "Machine Learning & Statistical Modeling"]},
            "bi_analytics": {"label": "Business Intelligence & Product Analytics", "priority_categories": ["Business Intelligence & Impact Evaluation", "Data Engineering & High-Scale Analytics"]}
        },
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
    """Deterministic parser extracting sections and bullets from resume text."""
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    sections = []
    current_sec = {"section_type": "experience", "bullets": [], "overview_line": ""}
    
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
        elif len(line) > 20 and not line.startswith("Page") and upper not in ["IIT BOMBAY", "INDIAN INSTITUTE OF TECHNOLOGY"]:
            if not current_sec["overview_line"] and len(current_sec["bullets"]) == 0:
                current_sec["overview_line"] = line
            else:
                current_sec["bullets"].append({"bullet_text": line, "original_bullet": line})
                
    if current_sec["bullets"] or current_sec["overview_line"]:
        sections.append(current_sec)
        
    return sections


def extract_text_from_pdf_stream(pdf_bytes: bytes) -> str:
    """Extracts raw text stream from PDF bytes using PyMuPDF / pdfminer."""
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "\n".join([page.get_text() for page in doc])
        doc.close()
        if text.strip():
            return text
    except Exception as e:
        print(f"PyMuPDF extract failed: {e}")
        
    try:
        from pdfminer.high_level import extract_text
        import io
        return extract_text(io.BytesIO(pdf_bytes))
    except Exception as e:
        print(f"pdfminer fallback failed: {e}")
        return ""


# ==============================================================================
# PILLAR 1: ATS PARSEABILITY & SECTION INTEGRITY
# ==============================================================================
def evaluate_ats_parseability(
    pdf_bytes: Optional[bytes], 
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Pillar 1: ATS Parseability & Contact Integrity (0-100)."""
    checks = []
    issues = []
    
    char_count = len(raw_text.strip())
    text_score = 100 if char_count >= 800 else 75 if char_count >= 400 else 40
    checks.append({
        "name": "Extractable Text Layer",
        "passed": char_count >= 400,
        "score": text_score,
        "status": "Optimal" if text_score == 100 else "Acceptable" if text_score >= 70 else "Warning"
    })
    
    standard_headers = ["experience", "project", "por", "scholastic", "extracurricular", "skills", "education"]
    raw_lower = raw_text.lower()
    found_headers = [h for h in standard_headers if h in raw_lower or any(h in s.get("section_type", "").lower() for s in parsed_sections)]
    
    hierarchy_score = 95 if len(found_headers) >= 4 else 80 if len(found_headers) == 3 else 60 if len(found_headers) == 2 else 40
    checks.append({
        "name": "Standard Section Hierarchy",
        "passed": len(found_headers) >= 3,
        "score": hierarchy_score,
        "status": "Optimal" if hierarchy_score >= 90 else "Acceptable" if hierarchy_score >= 75 else "Needs Structure"
    })
    
    # Contact Extraction
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text))
    has_phone = bool(re.search(r"(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}|\b\d{10}\b", raw_text))
    
    if mode == "iitb_placement":
        iitb_header_keywords = ["indian institute of technology", "iit bombay", "chemical engineering", "computer science", "mechanical", "electrical", "b.tech", "dual degree", "m.tech", "cpi", "roll"]
        has_iitb_header = any(kw in raw_lower for kw in iitb_header_keywords)
        portal_score = 95 if (has_iitb_header and (has_email or has_phone)) else 80 if has_iitb_header else 60
        checks.append({
            "name": "Placement Portal Header Standard",
            "passed": portal_score >= 80,
            "score": portal_score,
            "status": "Verified" if portal_score >= 90 else "Partial"
        })
        final_score = int(round((text_score * 0.35) + (hierarchy_score * 0.35) + (portal_score * 0.30)))
    else:
        contact_score = 95 if (has_email and has_phone) else 65 if (has_email or has_phone) else 40
        checks.append({
            "name": "Contact Header Extraction",
            "passed": contact_score >= 65,
            "score": contact_score,
            "status": "Optimal" if contact_score >= 90 else "Partial" if contact_score >= 60 else "Missing"
        })
        final_score = int(round((text_score * 0.35) + (hierarchy_score * 0.35) + (contact_score * 0.30)))
        
    final_score = max(35, min(100, final_score))
    
    return {
        "score": final_score,
        "status": "Optimal" if final_score >= 85 else "Strong" if final_score >= 70 else "Needs Polish",
        "reasoning": f"Evaluates extractable text layer, standard category naming ({len(found_headers)} identified), and header hygiene.",
        "checks": checks,
        "issues": issues,
        "raw_text_preview": raw_text[:1200] + ("..." if len(raw_text) > 1200 else "")
    }


# ==============================================================================
# PILLAR 2: GROUND-TRUTH KEYWORD & COMPETENCY MATCHER
# ==============================================================================
# Standard Alias and Equivalent Tech Terms Mapping
KEYWORD_ALIASES = {
    "distributed systems": ["distributed systems", "distributed architecture", "distributed services", "distributed computing", "distributed pipeline", "distributed"],
    "microservices architecture": ["microservices architecture", "microservices", "microservice", "micro-services", "service-oriented"],
    "microservices": ["microservices architecture", "microservices", "microservice", "micro-services"],
    "system design": ["system design", "system architecture", "high-level design", "low-level design", "hld", "lld"],
    "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment", "github actions", "gitlab ci", "jenkins"],
    "kubernetes": ["kubernetes", "k8s"],
    "k8s": ["kubernetes", "k8s"],
    "postgresql": ["postgresql", "postgres", "psql"],
    "postgres": ["postgresql", "postgres", "psql"],
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "ecs", "eks", "cloudwatch", "dynamodb"],
    "gcp": ["gcp", "google cloud", "google cloud platform", "bigquery", "cloud run", "gcs"],
    "azure": ["azure", "microsoft azure", "azure devops", "blob storage"],
    "react": ["react", "react.js", "reactjs"],
    "next.js": ["next.js", "nextjs", "next"],
    "node.js": ["node.js", "nodejs", "node"],
    "c++": ["c++", "cpp", "c++17", "c++20"],
    "c#": ["c#", "csharp", ".net"],
    "golang": ["golang", "go", "goroutines"],
    "go": ["golang", "go language", "in go", "with go", "using go", "go/"],
    "docker": ["docker", "dockerfile", "containerized", "containers"],
    "rest api": ["rest api", "restful", "rest apis", "rest endpoints"],
    "nosql": ["nosql", "mongodb", "dynamodb", "cassandra", "couchbase", "documentdb"],
    "relational database": ["relational database", "rdbms", "sql", "postgresql", "mysql", "postgres"],
    "message queue": ["message queue", "kafka", "rabbitmq", "pub/sub", "sqs", "event streaming"],
    "machine learning": ["machine learning", "ml", "supervised learning", "unsupervised learning", "xgboost", "scikit-learn"],
    "deep learning": ["deep learning", "dl", "pytorch", "tensorflow", "neural networks", "transformers"],
    "data science": ["data science", "data analysis", "pandas", "numpy", "eda"],
    "product management": ["product management", "product strategy", "product roadmap", "prd"],
    "market sizing": ["market sizing", "tam", "sam", "som", "market entry"],
    "financial modeling": ["financial modeling", "financial model", "dcf", "three-statement", "lbo", "valuation"]
}

def check_keyword_in_text(keyword: str, text_lower: str) -> bool:
    """Accurate word-boundary check with alias awareness preventing false positive substrings."""
    kw = keyword.strip().lower()
    if not kw:
        return False
    
    # Check if keyword has predefined alias expansions
    aliases = KEYWORD_ALIASES.get(kw, [kw])
    if kw not in aliases:
        aliases.append(kw)
        
    for alias in aliases:
        a_clean = alias.strip().lower()
        if a_clean in ["c++", "cpp"]:
            if bool(re.search(r"\b(c\+\+|cpp)\b", text_lower)): return True
        elif a_clean in ["c#", "csharp"]:
            if bool(re.search(r"\b(c#|csharp)\b", text_lower)): return True
        elif a_clean in [".net", "dotnet"]:
            if bool(re.search(r"\b(\.net|dotnet)\b", text_lower)): return True
        elif a_clean in ["ci/cd", "cicd"]:
            if bool(re.search(r"\b(ci/cd|cicd)\b", text_lower)): return True
        elif a_clean == "go":
            if bool(re.search(r"\b(golang|go language|in go|with go|using go)\b", text_lower) or re.search(r"(?:\b|/)(go)(?:/|,|\b)", text_lower)): return True
        elif a_clean == "r":
            if bool(re.search(r"\b(r language|in r|with r|using r|r script)\b", text_lower)): return True
        elif a_clean == "c":
            if bool(re.search(r"\b(c language|c programming|c/c\+\+|c,)\b", text_lower)): return True
        else:
            escaped = re.escape(a_clean)
            if bool(re.search(rf"\b{escaped}\b", text_lower)):
                return True
                
    return False


def extract_skills_from_jd_with_llm(jd_text: str) -> Dict[str, List[str]]:
    """Extracts atomic, normalized skill requirements from a Job Description."""
    prompt = f"""
    You are an expert ATS parser. Extract all technical skills, frameworks, tools, and domain requirements from this Job Description.
    Split them strictly into:
    1. "core_mandatory_skills": 6 to 12 must-have required skills.
    2. "preferred_skills": 3 to 8 nice-to-have or preferred tools/technologies.

    RULES:
    - Each skill must be an atomic short name (e.g. "Kafka", "PostgreSQL", "Go", "Docker", "Kubernetes", "AWS", "Distributed Systems").
    - Do NOT include full sentences.
    - OUTPUT STRICTLY VALID JSON.

    JOB DESCRIPTION:
    {jd_text[:3000]}
    """
    try:
        response_text = cerebras_client.generate_chat_completion(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=400
        )
        data = json_repair.loads(response_text)
        if isinstance(data, dict):
            core = data.get("core_mandatory_skills", [])
            pref = data.get("preferred_skills", [])
            if isinstance(core, list) and isinstance(pref, list):
                return {
                    "core_mandatory_skills": [str(s).strip() for s in core if str(s).strip()],
                    "preferred_skills": [str(s).strip() for s in pref if str(s).strip()]
                }
    except Exception as e:
        print(f"JD skills extraction fallback: {e}")
        
    return {
        "core_mandatory_skills": ["Python", "SQL", "Git", "System Design", "Problem Solving"],
        "preferred_skills": ["Docker", "Cloud", "Agile"]
    }


def evaluate_keyword_match(
    resume_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    target_role: str = "consulting", 
    job_description: Optional[str] = None,
    mode: str = "iitb_placement",
    sub_track: Optional[str] = None
) -> Dict[str, Any]:
    """
    Pillar 2: Deep Ground-Truth Keyword & Competency Alignment (0-100).
    Calibrated with zero hallucinations and realistic enterprise scoring.
    """
    canonical_role = target_role.lower()
    if any(k in canonical_role for k in ["software", "tech", "developer", "sde", "engineering"]):
        role_key = "software"
    elif any(k in canonical_role for k in ["prod", "pm"]):
        role_key = "product_management"
    elif any(k in canonical_role for k in ["fin", "ib", "pe", "banking"]):
        role_key = "finance"
    elif any(k in canonical_role for k in ["data", "analy", "ml", "ai"]):
        role_key = "analytics"
    else:
        role_key = "consulting"
        
    domain_info = DOMAIN_TAXONOMY.get(role_key, DOMAIN_TAXONOMY["consulting"])
    resume_lower = resume_text.lower()
    
    # Sub-track priority categories
    sub_tracks = domain_info.get("sub_tracks", {})
    active_sub_track_data = sub_tracks.get(sub_track) if sub_track else None
    priority_categories = active_sub_track_data.get("priority_categories", []) if active_sub_track_data else []
    
    # 1. Deterministic Domain Taxonomy Match
    explicit_matches = {}
    total_competencies = 0
    priority_matched_count = 0
    priority_total_count = 0
    
    for category_name, competencies in domain_info["categories"].items():
        is_priority_cat = category_name in priority_categories
        for comp in competencies:
            total_competencies += 1
            if is_priority_cat:
                priority_total_count += 1
                
            comp_name = comp["name"]
            synonyms = comp["synonyms"]
            
            matched_synonym = None
            for syn in synonyms:
                if check_keyword_in_text(syn, resume_lower):
                    matched_synonym = syn
                    break
                    
            if matched_synonym:
                explicit_matches[comp_name] = {
                    "name": comp_name,
                    "matched_via": matched_synonym,
                    "category": category_name,
                    "is_implicit": False,
                    "is_priority_subtrack": is_priority_cat
                }
                if is_priority_cat:
                    priority_matched_count += 1
                    
    categorized_results = []
    all_found = []
    all_missing = []
    
    for category_name, competencies in domain_info["categories"].items():
        cat_matched = []
        cat_missing = []
        is_priority_cat = category_name in priority_categories
        
        for comp in competencies:
            comp_name = comp["name"]
            if comp_name in explicit_matches:
                cat_matched.append(explicit_matches[comp_name])
                all_found.append(comp_name)
            else:
                cat_missing.append(comp_name)
                all_missing.append(comp_name)
                
        categorized_results.append({
            "category": category_name,
            "is_priority_subtrack": is_priority_cat,
            "matched": cat_matched,
            "missing": cat_missing
        })
        
    # 2. Custom Job Description Matching (if provided)
    jd_match_info = None
    is_custom_jd = bool(job_description and len(job_description.strip()) > 50)
    
    if is_custom_jd:
        try:
            extracted_jd = extract_skills_from_jd_with_llm(job_description)
            core_skills = extracted_jd.get("core_mandatory_skills", [])
            pref_skills = extracted_jd.get("preferred_skills", [])
            
            core_found = [s for s in core_skills if check_keyword_in_text(s, resume_lower)]
            pref_found = [s for s in pref_skills if check_keyword_in_text(s, resume_lower)]
            
            core_ratio = (len(core_found) / max(len(core_skills), 1))
            pref_ratio = (len(pref_found) / max(len(pref_skills), 1))
            
            # Calibrated realistic match score (75% core + 25% preferred)
            weighted_match_rate = int(round((core_ratio * 0.75 + pref_ratio * 0.25) * 100))
            
            jd_match_info = {
                "total_core": len(core_skills),
                "found_core": len(core_found),
                "total_preferred": len(pref_skills),
                "found_preferred": len(pref_found),
                "match_rate": weighted_match_rate,
                "core_found": core_found,
                "core_missing": [s for s in core_skills if s not in core_found],
                "pref_found": pref_found,
                "pref_missing": [s for s in pref_skills if s not in pref_found]
            }
        except Exception as e:
            print(f"JD matching calculation error: {e}")
            
    # 3. Calibrated Score Computation
    if is_custom_jd and jd_match_info:
        # JD Mode: Strictly driven by the Job Description alignment
        match_score = jd_match_info["match_rate"]
    else:
        # Domain Mode: True coverage ratio across the domain's skills
        matched_count = len(all_found)
        base_match_ratio = matched_count / max(total_competencies, 1)
        
        if priority_total_count > 0:
            priority_ratio = priority_matched_count / priority_total_count
            effective_ratio = (base_match_ratio * 0.4) + (priority_ratio * 0.6)
        else:
            effective_ratio = base_match_ratio
            
        # Realistic calibration curve without 35% free floor
        match_score = int(round(effective_ratio * 100))
        
    match_score = max(20, min(98, match_score))
    
    # 4. Actionable Suggestions
    suggestions = []
    if is_custom_jd and jd_match_info and jd_match_info.get("core_missing"):
        for kw in jd_match_info["core_missing"][:3]:
            suggestions.append(f"Weave in mandatory requirement '{kw}' into your relevant project or work experience bullets.")
    elif all_missing:
        priority_missing = []
        for cat in categorized_results:
            if cat.get("is_priority_subtrack"):
                priority_missing.extend(cat.get("missing", []))
        target_suggestions = priority_missing[:3] if priority_missing else all_missing[:3]
        for kw in target_suggestions:
            suggestions.append(f"Incorporate '{kw}' in technical or strategic points to strengthen {domain_info['label']} shortlisting.")
            
    return {
        "score": match_score,
        "target_role_label": domain_info["label"],
        "sub_track_label": active_sub_track_data.get("label") if active_sub_track_data else None,
        "is_custom_jd": is_custom_jd,
        "found_critical_count": len(all_found),
        "total_critical_count": total_competencies,
        "categorized_matrix": categorized_results,
        "found_keywords": all_found,
        "missing_critical": all_missing,
        "jd_match_info": jd_match_info,
        "suggestions": suggestions
    }


# ==============================================================================
# PILLAR 3: GOOGLE X-Y-Z QUANTIFICATION & CAUSALITY
# ==============================================================================
def classify_metric_causality(bullet: str) -> Dict[str, Any]:
    """Classifies metrics into High-Impact Causal Outcomes vs Activity Scope."""
    b_lower = bullet.lower()
    is_causal = any(k in b_lower for k in [
        "%", "faster", "reduced", "increased", "boosted", "saved", "cut", "grew",
        "latency", "throughput", "roi", "capex", "opex", "ebitda", "revenue", "cost",
        "cr", "crore", "lakh", "$", "₹", "€", "£", "accuracy", "f1", "retention",
        "uptime", "p99", "p95", "qps", "tps", "ms", "queries/sec"
    ])
    return {
        "is_causal": is_causal,
        "classification": "Causal Outcome Metric" if is_causal else "Activity / Scope Metric"
    }


def deconstruct_bullet_xyz_anatomy(bullets: List[str]) -> List[Dict[str, Any]]:
    """Deconstructs bullets into Google X-Y-Z components."""
    results = []
    metric_regex = re.compile(r"((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+|Cr|L|s|ms|x|X)?(?:%|x|X)?|\b(?:first|1st|2nd|3rd|top\s*\d+%?|rank\s*\d+|bronze|silver|gold)\b)", re.IGNORECASE)
    
    for b in bullets:
        has_metric = bool(metric_regex.search(b))
        metric_meta = classify_metric_causality(b)
        
        clean_b = re.sub(r"^\s*(?:\\item\s*|\\textbf\{|\*\*|\d+[\.\)]|[-•*–—])\s*", "", b)
        words = clean_b.split()
        first_word = words[0].strip(" -•*–,.:;{}*") if words else ""
        has_power_verb = len(first_word) > 3 and not any(first_word.lower().startswith(w) for w in WEAK_VERBS)
        has_mechanism = any(k in b.lower() for k in ["using", "via", "through", "leveraging", "by ", "with ", "implementing", "architecting", "orchestrating", "deploying"])
        
        if has_metric and metric_meta["is_causal"] and has_power_verb and has_mechanism:
            xyz_score = 96
        elif has_metric and has_power_verb and has_mechanism:
            xyz_score = 85
        elif has_metric and has_power_verb:
            xyz_score = 75
        elif has_metric:
            xyz_score = 60
        else:
            xyz_score = 35
            
        results.append({
            "bullet_text": b,
            "has_metric_y": has_metric,
            "metric_type_label": metric_meta["classification"] if has_metric else "Unquantified",
            "is_causal_metric": metric_meta["is_causal"] if has_metric else False,
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
            "score": 40,
            "quantified_count": 0,
            "total_bullets": 0,
            "quantification_ratio": 0,
            "causal_outcomes_count": 0,
            "metric_types_found": [],
            "weak_unquantified_bullets": [],
            "feedback": "No bullet points detected to analyze for metrics."
        }
        
    metric_regex = re.compile(r"((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+|Cr|L|s|ms|x|X)?(?:%|x|X)?|\b(?:first|1st|2nd|3rd|top\s*\d+%?|rank\s*\d+|bronze|silver|gold)\b)", re.IGNORECASE)
    
    quantified_bullets = []
    unquantified_bullets = []
    causal_count = 0
    metric_types = {"Percentages (%)": 0, "Currencies (₹/$)": 0, "Scale & Volume": 0, "Time & Latency": 0, "Rankings & Honors": 0}
    
    for b in all_bullets:
        matches = metric_regex.findall(b)
        if matches:
            quantified_bullets.append(b)
            if classify_metric_causality(b)["is_causal"]:
                causal_count += 1
                
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
            
    quant_ratio = len(quantified_bullets) / max(len(all_bullets), 1)
    causal_ratio = causal_count / max(len(all_bullets), 1)
    
    # Realistic linear score: Base quantification (75%) + Causal impact bonus (25%)
    score = int(round((quant_ratio * 75) + (causal_ratio * 25)))
    score = max(25, min(98, score))
    
    types_found = [k for k, v in metric_types.items() if v > 0]
    xyz_deconstruction = deconstruct_bullet_xyz_anatomy(all_bullets[:8])
    
    return {
        "score": score,
        "quantified_count": len(quantified_bullets),
        "causal_outcomes_count": causal_count,
        "total_bullets": len(all_bullets),
        "quantification_ratio": int(round(quant_ratio * 100)),
        "causal_ratio": int(round(causal_ratio * 100)),
        "metric_types_found": types_found,
        "weak_unquantified_bullets": unquantified_bullets[:4],
        "xyz_deconstruction": xyz_deconstruction,
        "feedback": f"{len(quantified_bullets)} of {len(all_bullets)} ({int(round(quant_ratio * 100))}%) bullets contain metrics, with {causal_count} causal business/system outcomes."
    }


# ==============================================================================
# PILLAR 4: EXECUTIVE ACTION VERBS & ACTIVE VOICE
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
            "score": 50,
            "power_verb_ratio": 50,
            "weak_verb_count": 0,
            "repetitive_verbs": [],
            "weak_bullets": []
        }
        
    first_words = []
    weak_bullets = []
    
    for b in all_bullets:
        clean_b = re.sub(r"\\item\s*", "", b)
        clean_b = re.sub(r"\\textbf\{([^}]+)\}", r"\1", clean_b)
        clean_b = re.sub(r"\\emph\{([^}]+)\}", r"\1", clean_b)
        clean_b = re.sub(r"\*\*([^*]+)\*\*", r"\1", clean_b)
        clean_b = re.sub(r"^\s*[\d\.\-\•\*\–\—\:]+\s*", "", clean_b)
        
        words = clean_b.split()
        if words:
            fw = words[0].strip(" -•*–,.:;{}*()").capitalize()
            if len(fw) > 2:
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
    strong_ratio = max(0.0, (total - weak_count) / total)
    
    score = int(round((strong_ratio * 88) - (len(repetitive) * 5)))
    score = max(30, min(98, score))
    
    return {
        "score": score,
        "power_verb_ratio": int(round(strong_ratio * 100)),
        "weak_verb_count": weak_count,
        "repetitive_verbs": repetitive,
        "weak_bullets": weak_bullets[:3]
    }


# ==============================================================================
# PILLAR 5: FORMATTING, LINE BUDGET & PLACEMENT POLICY
# ==============================================================================
def evaluate_formatting_and_iitb_rules(
    raw_text: str, 
    parsed_sections: List[Dict[str, Any]], 
    pdf_bytes: Optional[bytes] = None,
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Pillar 5: Line Budget, Word Density & Policy Compliance (0-100)."""
    words = raw_text.split()
    word_count = len(words)
    
    page_count = 1
    if pdf_bytes:
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            page_count = len(doc)
            doc.close()
        except Exception:
            page_count = 1 if word_count <= 750 else 2
    else:
        page_count = 1 if word_count <= 750 else 2
        
    if page_count == 1:
        if 420 <= word_count <= 640:
            word_density_score = 95
            density_status = f"Optimal for 1-Page ({word_count} words)"
        elif 320 <= word_count < 420 or 640 < word_count <= 780:
            word_density_score = 78
            density_status = f"Dense ({word_count} words)" if word_count > 640 else f"Light ({word_count} words)"
        else:
            word_density_score = 55
            density_status = f"Very Dense ({word_count} words)" if word_count > 780 else f"Too Brief ({word_count} words)"
    else:
        if 850 <= word_count <= 1450:
            word_density_score = 95
            density_status = f"Optimal for 2-Page Master ({word_count} words)"
        elif 700 <= word_count < 850 or 1450 < word_count <= 1750:
            word_density_score = 80
            density_status = f"Dense ({word_count} words)" if word_count > 1450 else f"Light ({word_count} words)"
        else:
            word_density_score = 60
            density_status = f"Overloaded ({word_count} words)"
            
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
            "passed": word_density_score >= 75,
            "score": word_density_score,
            "status": density_status
        }
    ]
    
    if mode == "iitb_placement":
        policy_score = 95 if len(policy_alerts) == 0 else 40
        layout_checks.append({
            "name": "IITB Prohibited Rank Compliance",
            "passed": len(policy_alerts) == 0,
            "score": policy_score,
            "status": "Compliant" if len(policy_alerts) == 0 else "Violation Flagged"
        })
        final_score = int(round((word_density_score * 0.6) + (policy_score * 0.4)))
    else:
        final_score = word_density_score
        
    final_score = max(35, min(98, final_score))
    
    return {
        "score": final_score,
        "page_count": page_count,
        "word_count": word_count,
        "line_wrap_hazards": [],
        "policy_alerts": policy_alerts,
        "layout_checks": layout_checks
    }


# ==============================================================================
# SECTION-BY-SECTION HEALTH DIAGNOSTICS
# ==============================================================================
def audit_sections_with_deep_ai(
    parsed_sections: List[Dict[str, Any]], 
    raw_text: str,
    target_role: str = "software",
    mode: str = "iitb_placement"
) -> Dict[str, Any]:
    """Section-Wise Scoring Framework & Deep Diagnostics."""
    raw_lower = raw_text.lower()
    
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
                
    # A. Work Experience
    exp_metrics = sum(1 for b in exp_bullets if re.search(r"\d+%|\d+x|\$[\d,]+|₹[\d,]+|\b\d+\b", b))
    m_ratio = (exp_metrics / max(len(exp_bullets), 1))
    exp_d1 = min(92, max(40, int(round(40 + m_ratio * 52))))
    
    weak_verbs = sum(1 for b in exp_bullets if any(w in b.lower() for w in WEAK_VERBS))
    exp_d2 = min(92, max(45, int(round(90 - (weak_verbs / max(len(exp_bullets), 1)) * 45))))
    exp_d3 = min(90, max(45, int(round(50 + (min(len(exp_bullets), 6) / 6) * 38))))
    exp_d4 = 88 if len(exp_bullets) >= 3 else 55
    exp_score = int(round(exp_d1 * 0.30 + exp_d2 * 0.25 + exp_d3 * 0.25 + exp_d4 * 0.20))
    
    # B. Projects
    has_live_proof = any(k in raw_lower for k in ["deployed", "live", "active users", "production", "github", "hosted", "users", "http", "api"])
    proj_d1 = 88 if has_live_proof else 58
    proj_tech_matches = sum(1 for k in ["api", "database", "sql", "model", "pipeline", "docker", "react", "fastapi", "postgres", "redis", "cloud", "aws"] if k in raw_lower)
    proj_d2 = min(92, max(45, int(round(45 + min(proj_tech_matches, 8) * 5.8))))
    proj_d3 = min(88, max(45, int(round(50 + min(len(proj_bullets), 6) * 6.0))))
    proj_d4 = 85 if len(proj_bullets) >= 2 else 55
    proj_score = int(round(proj_d1 * 0.25 + proj_d2 * 0.30 + proj_d3 * 0.25 + proj_d4 * 0.20))
    
    # C. Education
    has_cpi = bool(re.search(r"\bcpi\b|\bgpa\b|\bcredits\b|\bb\.tech\b|\bdual degree\b|\bdepartment\b", raw_lower))
    edu_d1 = 90 if has_cpi else 60
    has_honors = any(k in raw_lower for k in ["ap grade", "scholar", "kvpy", "olympiad", "top", "medal", "fellowship", "merit", "hackathon", "icpc"])
    edu_d2 = 88 if has_honors else 60
    has_banned_rank = any(re.search(pat, raw_text, re.IGNORECASE) for pat, _ in PROHIBITED_RANK_PATTERNS)
    edu_d3 = 40 if has_banned_rank else 92
    edu_d4 = 85
    edu_score = int(round(edu_d1 * 0.30 + edu_d2 * 0.30 + edu_d3 * 0.25 + edu_d4 * 0.15))
    
    # D. Skills Matrix
    has_skills_table = any(k in raw_lower for k in ["languages:", "frameworks:", "databases:", "tools:", "libraries:", "developer tools:", "cloud:"])
    skills_d1 = 90 if has_skills_table else 55
    skills_d2 = 88 if any(k in raw_lower for k in ["python", "typescript", "docker", "postgres", "fastapi", "react", "pytorch", "next.js", "kubernetes", "sql"]) else 55
    skills_d3 = 85 if (has_skills_table or len(skills_lines) > 0) else 55
    skills_d4 = 85
    skills_score = int(round(skills_d1 * 0.30 + skills_d2 * 0.30 + skills_d3 * 0.25 + skills_d4 * 0.15))
    
    # E. Leadership / POR
    por_present = any(k in raw_lower for k in ["position of responsibility", "positions of responsibility", "convenor", "head", "manager", "lead", "coordinator", "secretary", "core team"])
    por_d1 = 88 if por_present else 45
    por_d2 = 85 if any(k in raw_lower for k in ["team of", "budget", "participants", "footfall", "organized", "spearheaded", "managed"]) else 50
    por_d3 = 84 if por_present else 45
    por_d4 = 85 if por_present else 50
    por_score = int(round(por_d1 * 0.30 + por_d2 * 0.30 + por_d3 * 0.25 + por_d4 * 0.15))
    
    diagnostics = {
        "experience": {
            "name": "Work Experience & Internships",
            "score": exp_score,
            "bullets_count": len(exp_bullets),
            "status": "Elite Impact" if exp_score >= 82 else "Strong Fit" if exp_score >= 70 else "Needs Polish",
            "dimensions": [
                {"name": "Metric Density & Impact", "score": exp_d1, "benchmark": "≥75% with metrics"},
                {"name": "Action Verbs & Voice", "score": exp_d2, "benchmark": "Executive action verbs"},
                {"name": "Scope & End-to-End Ownership", "score": exp_d3, "benchmark": "Problem → Solution → Impact"},
                {"name": "Structural Hygiene & Budget", "score": exp_d4, "benchmark": "3-5 bullets per role"}
            ],
            "strengths": [
                f"{int(round(m_ratio * 100))}% of experience bullets contain metrics" if m_ratio > 0 else "Clear experience timeline",
                "Action-oriented bullet phrasing"
            ],
            "gaps": [
                "Quantify secondary achievements with latency, throughput, or business outcome gains" if m_ratio < 0.75 else "Maintain consistent STAR structure across all roles"
            ]
        },
        "projects": {
            "name": "Key Technical / Domain Projects",
            "score": proj_score,
            "bullets_count": len(proj_bullets),
            "status": "Production Caliber" if proj_score >= 82 else "Strong Depth" if proj_score >= 70 else "Needs Polish",
            "dimensions": [
                {"name": "Production & Live Deployment", "score": proj_d1, "benchmark": "Live links or repo proof"},
                {"name": "Stack Depth & Completeness", "score": proj_d2, "benchmark": "Full-stack / Cloud / DB"},
                {"name": "Problem Scale & Originality", "score": proj_d3, "benchmark": "Non-trivial engineering"},
                {"name": "Presentation Standard", "score": proj_d4, "benchmark": "Overview line + bullets"}
            ],
            "strengths": [
                "Demonstrates live production proof and active deployment" if has_live_proof else "Clear problem definitions across technical projects",
                "Multi-tier technology stack utilized"
            ],
            "gaps": [
                "Include live deployment links or architecture scale indicators" if not has_live_proof else "Add performance benchmarks or user scale"
            ]
        },
        "education": {
            "name": "Scholastic Achievements & Education",
            "score": edu_score,
            "bullets_count": len(scholastic_bullets),
            "status": "Placement Compliant" if edu_score >= 80 else "Acceptable" if edu_score >= 65 else "Policy Alert",
            "dimensions": [
                {"name": "Academic Baseline Clarity", "score": edu_d1, "benchmark": "CPI / Degree properly formatted"},
                {"name": "Competitive Honors & Distinctions", "score": edu_d2, "benchmark": "Olympiads / Scholarships / AP"},
                {"name": "Placement Policy Compliance", "score": edu_d3, "benchmark": "Zero prohibited AIR/Batch ranks"},
                {"name": "Formatting & Chronology", "score": edu_d4, "benchmark": "Reverse chronological hierarchy"}
            ],
            "strengths": [
                "Academic identifiers and degree status verified" if has_cpi else "Clear educational progression",
                "Distinctions and academic honors highlighted" if has_honors else "Standard academic standing"
            ],
            "gaps": [
                "Strictly omit prohibited All India Ranks per placement policy" if has_banned_rank else "Include national scholarships or academic recognitions if applicable"
            ]
        },
        "skills": {
            "name": "Technical & Domain Skills Matrix",
            "score": skills_score,
            "bullets_count": len(skills_lines),
            "status": "Structured Stack" if skills_score >= 78 else "Uncategorized",
            "dimensions": [
                {"name": "Taxonomic Categorization", "score": skills_d1, "benchmark": "Languages / Frameworks / DBs"},
                {"name": "Stack Modernity & Currency", "score": skills_d2, "benchmark": "Industry-standard tools"},
                {"name": "Skill Density & Curation", "score": skills_d3, "benchmark": "15-25 curated technologies"},
                {"name": "Target Domain Alignment", "score": skills_d4, "benchmark": f"Aligned with {target_role.capitalize()}"}
            ],
            "strengths": [
                "Structured under distinct functional categories" if has_skills_table else "Comprehensive tool inventory",
                "Alignment with modern engineering practices"
            ],
            "gaps": [
                "Group flat skill lists into distinct categories (Languages, Frameworks, Databases, Tools)" if not has_skills_table else "Ensure listed technologies are supported by evidence in project points"
            ]
        },
        "leadership": {
            "name": "Positions of Responsibility & Leadership",
            "score": por_score,
            "bullets_count": len(por_bullets),
            "status": "Verified Leadership" if por_score >= 78 else "Standard Participation",
            "dimensions": [
                {"name": "Leadership Scope & Footprint", "score": por_d1, "benchmark": "Team size & event scale"},
                {"name": "Administrative Impact", "score": por_d2, "benchmark": "Process & growth metrics"},
                {"name": "Proactivity & Initiatives", "score": por_d3, "benchmark": "Launched new initiatives"},
                {"name": "Hierarchy & Title Standard", "score": por_d4, "benchmark": "Role | Organization | Date"}
            ],
            "strengths": [
                "Demonstrates formal leadership ownership and footprint" if por_present else "Extracurricular participation",
                "Cross-functional collaboration and initiative"
            ],
            "gaps": [
                "Quantify leadership scope with team size or budget managed" if por_present else "Consider highlighting formal responsibility roles"
            ]
        }
    }
    
    return diagnostics


# ==============================================================================
# MASTER ATS REPORT GENERATOR
# ==============================================================================
def compute_full_ats_report(
    pdf_bytes: Optional[bytes] = None,
    raw_text: Optional[str] = None,
    target_role: str = "consulting",
    mode: str = "iitb_placement",
    job_description: Optional[str] = None,
    sub_track: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes Master 5-Pillar ATS & Placement Scorecard with Calibrated Ground-Truth
    Scoring, Strict Word-Boundary Keyword Matching, and Multi-Dimensional Diagnostics.
    """
    if pdf_bytes and not raw_text:
        raw_text = extract_text_from_pdf_stream(pdf_bytes)
        
    if not raw_text or not raw_text.strip():
        raw_text = "No extractable text found in resume."
        
    parsed_sections = fallback_extract_sections_and_bullets(raw_text)
    
    # Evaluate 5 Calibrated Pillars
    p1 = evaluate_ats_parseability(pdf_bytes, raw_text, parsed_sections, mode=mode)
    p2 = evaluate_keyword_match(raw_text, parsed_sections, target_role=target_role, job_description=job_description, mode=mode, sub_track=sub_track)
    p3 = evaluate_quantification_impact(parsed_sections)
    p4 = evaluate_action_verbs_and_voice(parsed_sections, target_role=target_role)
    p5 = evaluate_formatting_and_iitb_rules(raw_text, parsed_sections, pdf_bytes=pdf_bytes, mode=mode)
    
    section_health = audit_sections_with_deep_ai(parsed_sections, raw_text, target_role=target_role, mode=mode)
    
    # Master Weighted Score (0-100)
    # Parseability: 15%, Keyword Alignment: 35%, Quantification: 25%, Action Verbs: 15%, Layout: 10%
    overall_score = int(round(
        (p1["score"] * 0.15) +
        (p2["score"] * 0.35) +
        (p3["score"] * 0.25) +
        (p4["score"] * 0.15) +
        (p5["score"] * 0.10)
    ))
    overall_score = max(20, min(98, overall_score))
    
    tier = (
        "Placement Ready" if overall_score >= 85 
        else "Strong Shortlist" if overall_score >= 72 
        else "Moderate Alignment — Key Gaps" if overall_score >= 58 
        else "Critical Gaps"
    )
    
    # Actionable Quick Wins
    quick_wins = []
    
    if p2.get("is_custom_jd") and p2.get("jd_match_info") and p2["jd_match_info"].get("core_missing"):
        missing_top = p2["jd_match_info"]["core_missing"][:3]
        quick_wins.append({
            "title": f"Integrate {len(missing_top)} Mandatory JD Skills",
            "impact_pts": "+14 pts",
            "category": "Keyword Match",
            "action_type": "inject_keyword",
            "hint": f"Explicitly add required tools: {', '.join(missing_top)}."
        })
    elif p2.get("missing_critical") and len(p2["missing_critical"]) > 0:
        missing_top = p2["missing_critical"][:3]
        quick_wins.append({
            "title": f"Weave in {len(missing_top)} Key Domain Competencies",
            "impact_pts": "+10 pts",
            "category": "Keyword Match",
            "action_type": "inject_keyword",
            "hint": f"Add {', '.join(missing_top)} into relevant experience or project points."
        })
        
    if p3.get("weak_unquantified_bullets") and len(p3["weak_unquantified_bullets"]) > 0:
        quick_wins.append({
            "title": f"Add Metrics to {len(p3['weak_unquantified_bullets'])} Qualitative Bullets",
            "impact_pts": "+8 pts",
            "category": "Quantification",
            "action_type": "quantify",
            "hint": "Incorporate percentages, volume scale, latencies, or revenue outcomes."
        })
        
    if p4.get("repetitive_verbs") and len(p4["repetitive_verbs"]) > 0:
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
            "hint": "Your resume satisfies all primary placement & ATS criteria."
        })
        
    return {
        "overall_score": overall_score,
        "tier": tier,
        "mode": mode,
        "target_role": target_role,
        "sub_track": sub_track,
        "sub_track_label": p2.get("sub_track_label"),
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
        "quick_fixes_count": len(p4.get("weak_bullets", [])) + len(p3.get("weak_unquantified_bullets", []))
    }


# ==============================================================================
# CONTEXT-AWARE MULTI-OPTION AI BULLET REFINER
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
    3. "line_budget_trim": Concise, tight phrasing optimized for 1-line fit.
    
    RULES:
    - Never invent fictitious degrees or false facts; enhance the phrasing of the existing accomplishment.
    - No period at the end.
    - OUTPUT STRICTLY VALID JSON.
    
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
        response_text = cerebras_client.generate_chat_completion(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=450
        )
        data = json_repair.loads(response_text)
        if isinstance(data, dict) and data.get("refined_bullet"):
            return data
    except Exception as e:
        print(f"AI bullet refiner fallback: {e}")
        
    return {
        "refined_bullet": bullet_text,
        "new_length": len(bullet_text),
        "char_diff": 0,
        "explanation": "Maintained existing bullet phrasing.",
        "options": []
    }
