#!/usr/bin/env python3
"""
Placement Analysis & Company Intelligence Deep Ingestion Engine.
Processes Placement_tijori.xlsx (2,246 records across 3 sheets: 24-25, 25-26 s1, 25-26 s2)
with multi-factor role classification, categorized keyword taxonomy extraction,
and fusion with authentic student selection insights (data/selection insights/*.xlsx).
"""

import os
import sys
import re
import json
import glob
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional

# Exchange rates to INR for normalized comparison
CURRENCY_RATES_TO_INR = {
    "INR": 1.0,
    "USD": 86.5,
    "JPY": 0.58,
    "EUR": 93.0,
    "GBP": 110.0,
    "SGD": 65.0,
    "AED": 23.5,
    "HKD": 11.1,
    "TWD": 2.7
}


def clean_company_name(raw_name: str) -> str:
    """Normalizes raw company names into a canonical clean corporate entity name."""
    if not raw_name or not isinstance(raw_name, str):
        return "Unknown Company"
    
    name = raw_name.strip()
    # Strip square bracket annotations e.g. OLA [ANI Technologies Private Limited] -> OLA
    name = re.sub(r'\[.*?\]', '', name)
    # Strip parenthetical annotations e.g. Sony Group (Japan) -> Sony Group
    name = re.sub(r'\(.*?\)', '', name)
    # Clean legal suffixes
    name = re.sub(r'\b(Pvt\.?|Ltd\.?|Private|Limited|Inc\.?|LLP|Corporation|Corp\.?|Company|Co\.?)\b', '', name, flags=re.IGNORECASE)
    # Remove trailing punctuation and excessive whitespace
    name = name.replace(',', '').replace('.', '').strip()
    name = re.sub(r'\s+', ' ', name)
    
    # Specific known brand aliases
    aliases = {
        "Google India": "Google",
        "Microsoft India": "Microsoft",
        "Uber India": "Uber",
        "Amazon India": "Amazon",
        "Goldman Sachs Services": "Goldman Sachs",
        "Morgan Stanley Advantage Services": "Morgan Stanley",
        "Barclays Global Service Centre": "Barclays",
        "Qualcomm India": "Qualcomm",
        "Apple India": "Apple",
        "Citadel Securities India": "Citadel Securities",
        "McKinsey &": "McKinsey & Company",
        "Bain &": "Bain & Company",
        "Boston Consulting Group": "Boston Consulting Group (BCG)",
        "BCG": "Boston Consulting Group (BCG)",
        "Accenture S&C GN": "Accenture Strategy & Consulting",
        "Accenture India": "Accenture",
        "Sprinklr India": "Sprinklr",
        "Tower Research Capital India": "Tower Research Capital",
        "Quadeye": "Quadeye Securities",
        "Graviton Research Capital": "Graviton Research Capital",
        "Jane Street Capital": "Jane Street",
        "DE Shaw India": "D.E. Shaw",
        "D E Shaw": "D.E. Shaw",
        "Flipkart Internet": "Flipkart"
    }
    
    return aliases.get(name, name) if name in aliases else name


def generate_slug(name: str) -> str:
    """Generates a clean URL slug from company name."""
    clean = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
    return clean or "company"


def classify_role_intelligently(title: str, jd: str, raw_job_sector: str, raw_comp_sector: str) -> str:
    """
    Classifies every placement role into its true functional domain using
    Job Title semantic signals, Job Description keywords, and sector fallbacks.
    """
    t = str(title).lower().strip() if pd.notna(title) else ""
    j = str(jd).lower().strip() if pd.notna(jd) else ""
    rjs = str(raw_job_sector).lower().strip() if pd.notna(raw_job_sector) else ""
    rcs = str(raw_comp_sector).lower().strip() if pd.notna(raw_comp_sector) else ""
    
    # 1. Product Management
    if any(k in t for k in ['product manager', 'associate product manager', 'apm\b', 'product owner', 'product analyst', 'product lead', 'technical product manager', 'tpm\b', 'product designer', 'growth product', 'digital product']):
        return 'Product Management'
    if re.search(r'\b(apm|prd|product roadmap|product management|backlog grooming|user stories)\b', t):
        return 'Product Management'
    if 'product management' in rjs or 'product management' in rcs:
        return 'Product Management'
    if any(k in t for k in ['product definition', 'product engineer', 'product specialist']) and any(k in j for k in ['roadmap', 'user research', 'prd', 'feature prioritization', 'a/b testing']):
        return 'Product Management'

    # 2. Finance & Quant / High Frequency Trading
    if any(k in t for k in ['quant', 'trader', 'trading', 'investment banking', 'equity research', 'risk analyst', 'portfolio', 'hedge fund', 'fixed income', 'derivatives', 'market maker', 'hft', 'algo trader']):
        return 'Finance & Quant'
    if 'finance' in rjs or 'finance' in rcs:
        return 'Finance & Quant'
    if any(k in j for k in ['algorithmic trading', 'market making', 'order book', 'options pricing', 'derivatives trading', 'alpha generation', 'stochastic calculus', 'greenbook']):
        return 'Finance & Quant'

    # 3. AI, ML, Data Science & Analytics
    if any(k in t for k in ['data scientist', 'machine learning', 'ai/ml', 'ai engineer', 'nlp', 'computer vision', 'data engineer', 'deep learning', 'ml engineer', 'business analyst', 'analytics', 'data analyst', 'bi analyst', 'applied scientist', 'research scientist (ai)', 'generative ai']):
        return 'AI, ML & Data Science'
    if any(k in rjs for k in ['data science', 'analytics', 'ai/ml']) or any(k in rcs for k in ['data science', 'analytics', 'ai/ml']):
        return 'AI, ML & Data Science'

    # 4. Consulting & Strategy
    if any(k in t for k in ['consultant', 'consulting', 'strategy', 'advisory', 'management trainee', 'business consultant', 'strategic initiatives', 'program associate', 'general management', 'analyst - strategy']):
        return 'Consulting & Strategy'
    if 'consulting' in rjs or 'consulting' in rcs:
        return 'Consulting & Strategy'

    # 5. Core Engineering & Semiconductor / R&D
    if any(k in t for k in ['vlsi', 'asic', 'fpga', 'embedded', 'hardware', 'mechanical', 'chemical', 'civil', 'aerospace', 'materials', 'metallurgy', 'robotics', 'cad', 'cae', 'cfd', 'thermal', 'electrical engineer', 'substation', 'rf engineer', 'semiconductor', 'process engineer', 'plant engineer', 'manufacturing engineer']):
        return 'Core Engineering & Technology'

    # 6. Software & Engineering
    if any(k in t for k in ['software', 'developer', 'sde', 'swe', 'frontend', 'backend', 'fullstack', 'full stack', 'devops', 'cloud', 'security engineer', 'qa', 'sre', 'systems engineer', 'firmware', 'application engineer']):
        return 'Software & Engineering'
    if any(k in rjs for k in ['it/software', 'software development']) or any(k in rcs for k in ['it/software', 'software development']):
        return 'Software & Engineering'

    # 7. Design & UI/UX
    if any(k in t for k in ['ui/ux', 'ux designer', 'interaction designer', 'visual designer', 'graphic designer', 'industrial design']):
        return 'Design & UI/UX'

    # 8. FMCG & Operations
    if any(k in t for k in ['supply chain', 'operations', 'logistics', 'procurement', 'fmcg', 'plant operations']):
        return 'FMCG & Operations'

    # Fallback to sector maps
    if 'engineering & technology' in rjs or 'research & development' in rjs or 'engineering & technology' in rcs or 'research & development' in rcs:
        return 'Core Engineering & Technology'

    return 'General & Other'


def parse_pipe_number(val: Any) -> Dict[str, Any]:
    """
    Parses single or pipe-delimited values (e.g. '1622875 | 1622875 | ...' or '4150000 | 0 | ...')
    Returns min, max, median, mode, and list of non-zero numbers.
    """
    if pd.isna(val) or val is None or str(val).strip() == "" or str(val).lower() == "nan":
        return {"min": 0, "max": 0, "median": 0, "raw_values": []}
        
    s = str(val).strip()
    parts = re.split(r'[\|,;/]+', s)
    numbers = []
    
    for p in parts:
        p_clean = re.sub(r'[^\d\.]', '', p.strip())
        if p_clean:
            try:
                num = float(p_clean)
                numbers.append(num)
            except ValueError:
                pass
                
    if not numbers:
        return {"min": 0, "max": 0, "median": 0, "raw_values": []}
        
    non_zero = [n for n in numbers if n > 0]
    eval_nums = non_zero if non_zero else numbers
    
    return {
        "min": float(np.min(eval_nums)),
        "max": float(np.max(eval_nums)),
        "median": float(np.median(eval_nums)),
        "raw_values": numbers
    }


def parse_category_tier(cat_val: Any) -> str:
    """Parses Category tier (e.g. 'C1 | C1' -> 'C1', 'C2' -> 'C2')."""
    if pd.isna(cat_val) or not cat_val:
        return "Standard"
    s = str(cat_val).strip()
    matches = re.findall(r'C\d+', s, re.IGNORECASE)
    if matches:
        return matches[0].upper()
    return s[:15].strip()


def parse_additional_info_details(info_str: str) -> Dict[str, Any]:
    """Extracts structured bonus, ESOP, bond, and accommodation details from Additional Info."""
    if not info_str or pd.isna(info_str) or str(info_str).lower() == "nan":
        return {
            "has_sign_on_bonus": False,
            "has_performance_bonus": False,
            "has_esops": False,
            "has_bond": False,
            "has_accommodation": False,
            "highlights": []
        }
        
    text = str(info_str).strip()
    text_lower = text.lower()
    
    has_sign_on = any(k in text_lower for k in ["sign on", "sign-on", "joining bonus", "joining incentive"])
    has_perf = any(k in text_lower for k in ["performance bonus", "discretionary bonus", "variable pay", "variable bonus", "annual bonus"])
    has_esops = any(k in text_lower for k in ["esop", "stock", "rsu", "equity", "stocks"])
    has_bond = any(k in text_lower for k in ["bond", "service agreement", "retention", "tenure agreement"])
    has_accom = any(k in text_lower for k in ["accommodation", "relocation", "stay", "flight tickets", "guest house"])
    
    highlights = []
    if has_sign_on:
        highlights.append("Sign-on / Joining Bonus Included")
    if has_perf:
        highlights.append("Performance / Variable Bonus")
    if has_esops:
        highlights.append("Stock / ESOP Grants")
    if has_bond:
        highlights.append("Service / Retention Agreement")
    if has_accom:
        highlights.append("Initial Accommodation / Relocation Support")
        
    return {
        "has_sign_on_bonus": has_sign_on,
        "has_performance_bonus": has_perf,
        "has_esops": has_esops,
        "has_bond": has_bond,
        "has_accommodation": has_accom,
        "raw_summary": text[:400],
        "highlights": highlights
    }


# Comprehensive Multi-Category Keyword Taxonomies
KEYWORD_TAXONOMIES = {
    "languages": [
        "Python", "C++", "Java", "Go", "Golang", "Rust", "C#", "C", "SQL", "TypeScript", "JavaScript",
        "R", "Scala", "MATLAB", "Verilog", "VHDL", "SystemVerilog", "Solidity", "Kotlin", "Swift", "Bash", "Shell"
    ],
    "frameworks_and_tools": [
        "PyTorch", "TensorFlow", "Scikit-Learn", "Keras", "React", "Next.js", "Node.js", "Express", "Django",
        "FastAPI", "Spring Boot", "Docker", "Kubernetes", "Kafka", "Spark", "dbt", "Airflow", "Hadoop",
        "AWS", "GCP", "Azure", "Redis", "PostgreSQL", "MySQL", "MongoDB", "Cassandra", "Elasticsearch",
        "Figma", "Jira", "Mixpanel", "Amplitude", "Postman", "Tableau", "Power BI", "Excel", "Bloomberg",
        "Git", "GitHub", "CI/CD", "Linux", "gRPC", "GraphQL", "Simulink", "Ansys", "SolidWorks", "AutoCAD"
    ],
    "core_domain_concepts": [
        # Software & Systems
        "Low-Latency", "Distributed Systems", "Concurrency", "Multithreading", "Microservices", "System Design",
        "High Throughput", "Database Indexing", "Cache Invalidation", "REST APIs", "Event-Driven Architecture",
        "Object-Oriented Programming", "Data Structures & Algorithms", "Networking Protocols", "Linux Kernel",
        # Product Management
        "Product Roadmap", "PRD Writing", "User Stories", "A/B Testing", "GTM Strategy", "Feature Prioritization",
        "User Research", "Wireframing", "Customer Discovery", "Unit Economics", "North Star Metric", "Cohort Retention",
        "Product Lifecycle Management", "Market Analysis", "Design Sprints", "Conversion Funnel Optimization",
        # Finance & Quant
        "Market Making", "Order Book Dynamics", "Statistical Arbitrage", "Options Greeks", "Stochastic Calculus",
        "Alpha Generation", "Backtesting", "Risk Management", "Portfolio Optimization", "Monte Carlo Simulation",
        "Time Series Forecasting", "Financial Modeling", "Valuation (DCF/Comps)", "Derivatives Pricing",
        # Consulting & Strategy
        "Profitability Framework", "Market Entry", "M&A Synergies", "Guesstimates", "Value Chain Analysis",
        "MECE Structuring", "Root Cause Analysis", "Executive Storyboarding", "Competitive Benchmarking",
        # AI / ML & Data
        "LLM Fine-Tuning", "RAG Architecture", "Prompt Engineering", "Vector Embeddings", "Transformers",
        "Computer Vision", "NLP", "Deep Learning", "Feature Engineering", "Data Pipelines / ETL", "Data Lakehouse",
        # Core Hardware & Engineering
        "VLSI Design", "RTL Design", "ASIC Timing Closure", "FPGA Synthesis", "Embedded Systems", "PCB Design",
        "Finite Element Analysis (FEA)", "Computational Fluid Dynamics (CFD)", "Thermal Analysis", "Process Optimization"
    ],
    "leadership_competencies": [
        "First-Principles Problem Solving", "Cross-Functional Leadership", "Data-Driven Decision Making",
        "Stakeholder Management", "Ambiguity Navigation", "High Ownership & Accountability",
        "Client-Facing Communication", "Analytical Rigor", "Fast Prototyping & Execution"
    ]
}


def extract_jd_deep_keywords_and_analysis(jd_text: str, title: str, company: str, sector: str, ctc_inr: float, tier_cat: str) -> Dict[str, Any]:
    """
    Extracts multi-dimensional categorized keywords, role summary, responsibilities,
    selection rounds, and synthesized preparation playbook for each role.
    """
    text = str(jd_text).strip() if (pd.notna(jd_text) and str(jd_text).lower() != "nan") else ""
    text_lower = text.lower()
    title_lower = title.lower()
    
    extracted_languages = []
    extracted_frameworks = []
    extracted_concepts = []
    extracted_leadership = []
    
    # 1. Extract Languages
    for lang in KEYWORD_TAXONOMIES["languages"]:
        p = r'\b' + re.escape(lang.lower()) + r'\b'
        if re.search(p, text_lower) or re.search(p, title_lower):
            extracted_languages.append(lang)
            
    # 2. Extract Frameworks & Tools
    for tool in KEYWORD_TAXONOMIES["frameworks_and_tools"]:
        p = r'\b' + re.escape(tool.lower()) + r'\b'
        if re.search(p, text_lower) or re.search(p, title_lower):
            extracted_frameworks.append(tool)
            
    # 3. Extract Core Domain Concepts
    for concept in KEYWORD_TAXONOMIES["core_domain_concepts"]:
        p = r'\b' + re.escape(concept.lower()) + r'\b'
        if re.search(p, text_lower) or re.search(p, title_lower):
            extracted_concepts.append(concept)
            
    # 4. Extract Leadership Competencies
    for comp in KEYWORD_TAXONOMIES["leadership_competencies"]:
        words = comp.lower().split()
        if any(w in text_lower for w in words if len(w) > 4):
            extracted_leadership.append(comp)

    # Defaults if JD text is concise
    if sector == "Product Management" and not extracted_concepts:
        extracted_concepts = ["Product Roadmap", "PRD Writing", "User Stories", "A/B Testing", "GTM Strategy"]
    elif sector == "Finance & Quant" and not extracted_concepts:
        extracted_concepts = ["Statistical Arbitrage", "Alpha Generation", "Probability", "Time Series", "Risk Management"]
    elif sector == "Consulting & Strategy" and not extracted_concepts:
        extracted_concepts = ["Profitability Framework", "Market Entry", "Guesstimates", "MECE Structuring"]
    elif sector == "AI, ML & Data Science" and not extracted_concepts:
        extracted_concepts = ["Machine Learning", "Deep Learning", "Data Pipelines / ETL", "Feature Engineering"]
    elif sector == "Software & Engineering" and not extracted_concepts:
        extracted_concepts = ["Data Structures & Algorithms", "System Design", "Distributed Systems", "REST APIs"]

    all_keywords = extracted_languages + extracted_frameworks + extracted_concepts[:6]

    # Responsibilities extraction
    resp_matches = re.findall(r'(?:(?:[\d\.\-\•\*\–\—]+|\b(?:responsibility|responsibilities|tasks|role|you will)\b[:\-]?)\s*)([A-Z][^\.\n]{20,180}\.?)', text)
    responsibilities = [r.strip() for r in resp_matches[:6]]
    if not responsibilities:
        sentences = [s.strip() for s in re.split(r'[\.\n]+', text) if len(s.strip()) > 30 and len(s.strip()) < 180]
        responsibilities = sentences[:4]

    # Selection process detection
    selection_rounds = []
    if any(k in text_lower for k in ["online test", "coding test", "aptitude test", "assessment", "oa", "written test"]):
        selection_rounds.append("Round 1: Online Assessment (Coding Challenges, Aptitude & Domain Fundamentals)")
    else:
        selection_rounds.append("Round 1: Resume Shortlisting & Preliminary Screening")
        
    if sector == "Consulting & Strategy":
        selection_rounds.append("Round 2: Problem Solving & Case Study Interview (Market Entry / Profitability)")
        selection_rounds.append("Round 3: Senior Partner Case + Guesstimate & Fit Discussion")
    elif sector == "Product Management":
        selection_rounds.append("Round 2: Product Sense & RCA / Feature Design Interview")
        selection_rounds.append("Round 3: Technical & Metric Analytics Discussion")
    elif sector == "Finance & Quant":
        selection_rounds.append("Round 2: Probability, Statistics, Mental Math & Speed Coding")
        selection_rounds.append("Round 3: Advanced Algorithmic / Brainteaser Deep-Dive")
    else:
        selection_rounds.append("Round 2: Core Technical Interview (Problem Solving & System Architecture)")
        selection_rounds.append("Round 3: Advanced Domain Deep-Dive & Projects Review")
        
    selection_rounds.append("Final Round: Leadership, Team Fit & Cultural Alignment")

    # Role summary
    first_paragraph = text.split("\n\n")[0] if "\n\n" in text else text[:250]
    role_summary = re.sub(r'\s+', ' ', first_paragraph).strip()
    if not role_summary:
        role_summary = f"Full-time campus placement hire for {title} within the {sector} division at {company}."
    elif len(role_summary) > 280:
        role_summary = role_summary[:277] + "..."

    # Hiring difficulty rating (1-10)
    is_c1 = "C1" in tier_cat.upper()
    is_high_pay = ctc_inr >= 3500000
    if is_c1 and is_high_pay:
        diff_score = 9.4
        diff_tier = "Tier 1 Elite (Day-1 / Dream)"
    elif is_c1 or is_high_pay:
        diff_score = 8.6
        diff_tier = "Tier 1 High Impact"
    elif "C2" in tier_cat.upper():
        diff_score = 7.8
        diff_tier = "Tier 2 Core"
    else:
        diff_score = 7.0
        diff_tier = "Tier 3 Standard"

    # Domain specific resume advice
    if sector == "Product Management":
        resume_tip = "Highlight user discovery insights, PRDs written, and measurable North Star metric improvements (e.g. +18% D30 retention, +25% funnel conversion)."
        hurdle = "Balancing product intuition with rigorous execution metrics, technical feasibility, and user empathy during live case prompts."
    elif sector == "Finance & Quant":
        resume_tip = "Emphasize competitive programming ratings (Codeforces/LeetCode), mathematical Olympiads, stochastic calculus, and low-latency C++ projects."
        hurdle = "Extreme time-pressured mental math, brainteasers from Greenbook/Brainstellar, and high-frequency order-book architecture questions."
    elif sector == "Consulting & Strategy":
        resume_tip = "Structure resume with clear PoR leadership impacts, quantifiable business cost reductions or revenue uplifts, and clean MECE bullets."
        hurdle = "Structuring ambiguous business problems on the fly using MECE frameworks without jumping to premature conclusions."
    elif sector == "AI, ML & Data Science":
        resume_tip = "Include production ML deployment metrics (e.g. latency, F1-score, inference throughput) rather than just Kaggle model training."
        hurdle = "Mathematical depth behind modern architectures (Transformers, attention mechanisms, loss formulations) and live SQL/data pipeline debugging."
    else:
        resume_tip = "Feature production-grade code contributions, clean system architecture designs, and causal performance optimizations (latency, TPS, cache hit rates)."
        hurdle = "Multi-threaded concurrency, clean algorithmic edge-case handling, and scalable distributed system trade-offs."

    return {
        "role_summary": role_summary,
        "keywords": {
            "all": all_keywords[:15],
            "languages": extracted_languages[:8],
            "frameworks_and_tools": extracted_frameworks[:10],
            "core_concepts": extracted_concepts[:10],
            "leadership": extracted_leadership[:5]
        },
        "responsibilities": responsibilities,
        "selection_rounds": selection_rounds,
        "intelligence": {
            "difficulty_score": diff_score,
            "difficulty_tier": diff_tier,
            "key_selection_hurdle": hurdle,
            "resume_power_tip": resume_tip,
            "topic_weightage": {
                "dsa_and_problem_solving": 40 if sector in ["Software & Engineering", "Finance & Quant"] else 20,
                "system_and_domain_design": 30 if sector in ["Software & Engineering", "Product Management"] else 20,
                "case_and_business_sense": 40 if sector in ["Consulting & Strategy", "Product Management"] else 10,
                "resume_and_leadership_fit": 20
            }
        }
    }


def load_selection_insights(insights_dir: str) -> Dict[str, Any]:
    """
    Loads authentic student selection insight files and builds a company-keyed lookup dictionary.
    """
    company_insights = {}
    files = glob.glob(os.path.join(insights_dir, "*.xlsx"))
    print(f"Found {len(files)} selection insights files in {insights_dir}")
    
    for f in files:
        domain = os.path.basename(f).replace("Selection Insights", "").replace(".xlsx", "").strip()
        try:
            df = pd.read_excel(f)
            company_col = None
            for col in df.columns:
                if "company" in col.lower():
                    company_col = col
                    break
                    
            if not company_col:
                continue
                
            for _, row in df.iterrows():
                raw_cname = str(row.get(company_col, "")).strip()
                if not raw_cname or raw_cname.lower() == "nan":
                    continue
                    
                cname = clean_company_name(raw_cname)
                c_key = cname.lower()
                
                test_details = str(row.get("Test Details", "")).strip() if "Test Details" in row else ""
                interview_details = str(row.get("Interview Details", "")).strip() if "Interview Details" in row else ""
                raw_questions = str(row.get("Questions Asked", "")).strip() if "Questions Asked" in row else ""
                courses_projects = ""
                for col in df.columns:
                    if "project" in col.lower() or "course" in col.lower() or "elective" in col.lower():
                        courses_projects = str(row.get(col, "")).strip()
                        break
                        
                q_list = []
                if raw_questions and raw_questions.lower() != "nan":
                    lines = re.split(r'[\n\•\\*\-]+', raw_questions)
                    for l in lines:
                        cl = l.strip()
                        if len(cl) > 10:
                            q_list.append(cl)
                            
                company_insights[c_key] = {
                    "matched_company_name": cname,
                    "domain": domain,
                    "test_details": test_details if test_details.lower() != "nan" else "",
                    "interview_details": interview_details if interview_details.lower() != "nan" else "",
                    "questions_asked": q_list[:10],
                    "recommended_electives_projects": [c.strip() for c in courses_projects.split(",") if len(c.strip()) > 2] if courses_projects and courses_projects.lower() != "nan" else []
                }
        except Exception as e:
            print(f"Error loading {f}: {e}")
            
    print(f"Loaded selection insights for {len(company_insights)} unique company keys.")
    return company_insights


def ingest_placement_tijori_dataset(
    excel_path: str,
    insights_dir: str,
    output_json_path: str
) -> Dict[str, Any]:
    """
    Main extraction and structuring pipeline.
    """
    print(f"Starting deep ingestion from {excel_path}...")
    xl = pd.ExcelFile(excel_path)
    
    insights_lookup = load_selection_insights(insights_dir)
    
    companies_dict: Dict[str, Dict[str, Any]] = {}
    roles_list: List[Dict[str, Any]] = []
    
    total_raw_rows = 0
    
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        total_raw_rows += len(df)
        print(f"Parsing sheet '{sheet_name}' ({len(df)} rows)...")
        
        session_label = "2024-25" if sheet_name == "24-25" else "2025-26 Phase 1" if "s1" in sheet_name else "2025-26 Phase 2"
        is_24_25 = "24-25" in sheet_name
        is_25_26 = "25-26" in sheet_name
        
        for idx, row in df.iterrows():
            raw_cname = str(row.get("Company Name", "")).strip()
            if not raw_cname or raw_cname.lower() == "nan":
                continue
                
            raw_title = str(row.get("Job Title", "Graduate Hire")).strip()
            if not raw_title or raw_title.lower() == "nan":
                raw_title = "Engineering / Management Associate"
                
            cname = clean_company_name(raw_cname)
            cslug = generate_slug(cname)
            
            raw_comp_sector = str(row.get("Company Sector", "IT/Software")).strip()
            raw_job_sector = str(row.get("Job Sector", raw_comp_sector)).strip()
            
            # Intelligent sector classification
            standardized_sector = classify_role_intelligently(
                raw_title,
                str(row.get("Job Description", "")),
                raw_job_sector,
                raw_comp_sector
            )
            
            currency = str(row.get("Currency", "INR")).strip().upper()
            if not currency or currency == "NAN":
                currency = "INR"
            conv_rate = CURRENCY_RATES_TO_INR.get(currency, 1.0)
            
            ctc_parsed = parse_pipe_number(row.get("ctc"))
            inhand_parsed = parse_pipe_number(row.get("inhand"))
            
            ctc_orig_median = ctc_parsed["median"]
            inhand_orig_median = inhand_parsed["median"]
            
            ctc_inr_equiv = round(ctc_orig_median * conv_rate)
            inhand_inr_equiv = round(inhand_orig_median * conv_rate)
            
            category_tier = parse_category_tier(row.get("Category"))
            location = str(row.get("Job Location", "India")).strip()
            if not location or location.lower() == "nan":
                location = "India"
                
            add_info = parse_additional_info_details(str(row.get("Additional Info", "")))
            deep_jd_analysis = extract_jd_deep_keywords_and_analysis(
                str(row.get("Job Description", "")),
                raw_title,
                cname,
                standardized_sector,
                ctc_inr_equiv,
                category_tier
            )
            
            # Formulate single role record
            role_id = f"role_{cslug}_{sheet_name.replace(' ', '_')}_{idx}"
            role_record = {
                "id": role_id,
                "company_name": cname,
                "company_slug": cslug,
                "job_title": raw_title,
                "session_sheet": sheet_name,
                "session_label": session_label,
                "primary_sector": standardized_sector,
                "raw_job_sector": raw_job_sector,
                "location": location,
                "category_tier": category_tier,
                "currency": currency,
                "exchange_rate_to_inr": conv_rate,
                "compensation": {
                    "original_currency": currency,
                    "ctc_min": ctc_parsed["min"],
                    "ctc_max": ctc_parsed["max"],
                    "ctc_median": ctc_orig_median,
                    "inhand_median": inhand_orig_median,
                    "ctc_inr_equivalent": ctc_inr_equiv,
                    "inhand_inr_equivalent": inhand_inr_equiv,
                    "is_international": currency != "INR"
                },
                "role_summary": deep_jd_analysis["role_summary"],
                "required_skills": deep_jd_analysis["keywords"]["all"],
                "categorized_keywords": deep_jd_analysis["keywords"],
                "responsibilities": deep_jd_analysis["responsibilities"],
                "selection_rounds": deep_jd_analysis["selection_rounds"],
                "perks_and_benefits": add_info["highlights"],
                "additional_info_raw": add_info.get("raw_summary", ""),
                "raw_jd": str(row.get("Job Description", ""))[:2500],
                "intelligence": deep_jd_analysis["intelligence"]
            }
            roles_list.append(role_record)
            
            # Update or create Company Master
            if cslug not in companies_dict:
                insight_data = insights_lookup.get(cname.lower()) or insights_lookup.get(raw_cname.lower()) or {}
                
                companies_dict[cslug] = {
                    "id": f"comp_{cslug}",
                    "name": cname,
                    "slug": cslug,
                    "primary_sector": standardized_sector,
                    "tier_category": category_tier,
                    "is_hiring_24_25": is_24_25,
                    "is_hiring_25_26": is_25_26,
                    "roles_count": 1,
                    "available_roles": [raw_title],
                    "highest_ctc_inr": ctc_inr_equiv,
                    "highest_inhand_inr": inhand_inr_equiv,
                    "median_ctc_inr": ctc_inr_equiv,
                    "dominant_currency": currency,
                    "has_international_offers": currency != "INR",
                    "locations": [location] if location != "India" else ["Pan India"],
                    "top_skills": deep_jd_analysis["keywords"]["all"][:8],
                    "roles": [role_id],
                    "selection_insights": insight_data if insight_data else None,
                    "ai_overview": deep_jd_analysis["role_summary"],
                    "difficulty_score": deep_jd_analysis["intelligence"]["difficulty_score"],
                    "difficulty_tier": deep_jd_analysis["intelligence"]["difficulty_tier"]
                }
            else:
                comp = companies_dict[cslug]
                comp["roles_count"] += 1
                comp["roles"].append(role_id)
                if raw_title not in comp["available_roles"] and len(comp["available_roles"]) < 8:
                    comp["available_roles"].append(raw_title)
                if is_24_25:
                    comp["is_hiring_24_25"] = True
                if is_25_26:
                    comp["is_hiring_25_26"] = True
                if ctc_inr_equiv > comp["highest_ctc_inr"]:
                    comp["highest_ctc_inr"] = ctc_inr_equiv
                    # If this role is higher tier / PM / Quant, prioritize company sector
                    if standardized_sector in ["Product Management", "Finance & Quant", "AI, ML & Data Science", "Consulting & Strategy", "Software & Engineering"]:
                        comp["primary_sector"] = standardized_sector
                if inhand_inr_equiv > comp["highest_inhand_inr"]:
                    comp["highest_inhand_inr"] = inhand_inr_equiv
                if currency != "INR":
                    comp["has_international_offers"] = True
                if location not in comp["locations"] and len(comp["locations"]) < 5:
                    comp["locations"].append(location)
                for sk in deep_jd_analysis["keywords"]["all"]:
                    if sk not in comp["top_skills"] and len(comp["top_skills"]) < 12:
                        comp["top_skills"].append(sk)
                if deep_jd_analysis["intelligence"]["difficulty_score"] > comp["difficulty_score"]:
                    comp["difficulty_score"] = deep_jd_analysis["intelligence"]["difficulty_score"]
                    comp["difficulty_tier"] = deep_jd_analysis["intelligence"]["difficulty_tier"]

    # Compute median CTC for companies
    for cslug, comp in companies_dict.items():
        comp_roles = [r for r in roles_list if r["company_slug"] == cslug]
        ctc_vals = [r["compensation"]["ctc_inr_equivalent"] for r in comp_roles if r["compensation"]["ctc_inr_equivalent"] > 0]
        if ctc_vals:
            comp["median_ctc_inr"] = round(float(np.median(ctc_vals)))

    print(f"\nIngestion complete!")
    print(f"Total raw records parsed: {total_raw_rows}")
    print(f"Total structured roles: {len(roles_list)}")
    print(f"Total unique canonical companies: {len(companies_dict)}")
    
    # Platform Summary Stats
    all_ctcs = [r["compensation"]["ctc_inr_equivalent"] for r in roles_list if r["compensation"]["ctc_inr_equivalent"] > 0]
    intl_roles = [r for r in roles_list if r["compensation"]["is_international"]]
    
    stats = {
        "total_companies": len(companies_dict),
        "total_roles": len(roles_list),
        "total_sessions": ["2024-25", "2025-26 Phase 1", "2025-26 Phase 2"],
        "highest_ctc_inr": max(all_ctcs) if all_ctcs else 0,
        "median_ctc_inr": int(np.median(all_ctcs)) if all_ctcs else 0,
        "international_offers_count": len(intl_roles),
        "sectors_breakdown": {}
    }
    
    for sector in set(c["primary_sector"] for c in companies_dict.values()):
        sector_comps = [c for c in companies_dict.values() if c["primary_sector"] == sector]
        sector_roles = [r for r in roles_list if r["primary_sector"] == sector]
        s_ctcs = [r["compensation"]["ctc_inr_equivalent"] for r in sector_roles if r["compensation"]["ctc_inr_equivalent"] > 0]
        stats["sectors_breakdown"][sector] = {
            "companies_count": len(sector_comps),
            "roles_count": len(sector_roles),
            "median_ctc_inr": int(np.median(s_ctcs)) if s_ctcs else 0,
            "highest_ctc_inr": max(s_ctcs) if s_ctcs else 0
        }

    dataset_payload = {
        "metadata": {
            "version": "2.0.0",
            "extracted_at": "2026-08-20",
            "source_files": ["Placement_tijori.xlsx", "Selection Insights/*.xlsx"]
        },
        "stats": stats,
        "companies": list(companies_dict.values()),
        "roles": roles_list
    }
    
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(dataset_payload, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully generated deep placement intelligence dataset at: {output_json_path}")
    return dataset_payload


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    excel_file = os.path.join(base_dir, "data", "Placement Companies & JDs", "Placement_tijori.xlsx")
    insights_folder = os.path.join(base_dir, "data", "selection insights")
    out_file = os.path.join(base_dir, "apps", "api", "data", "placement_intelligence.json")
    
    ingest_placement_tijori_dataset(excel_file, insights_folder, out_file)
