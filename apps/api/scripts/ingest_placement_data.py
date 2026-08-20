#!/usr/bin/env python3
"""
Placement Analysis & Company Intelligence Ingestion Engine.
Processes Placement_tijori.xlsx (2,246 records across 3 sheets: 24-25, 25-26 s1, 25-26 s2)
and fuses with data/selection insights/*.xlsx.
Outputs structured, enriched JSON/SQLite store and optionally syncs to Supabase.
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

SECTOR_MAPPING = {
    "IT/Software": "Software & Engineering",
    "Software Development": "Software & Engineering",
    "Engineering & Technology": "Core Engineering & Technology",
    "Research & Development": "Core Engineering & Technology",
    "Finance": "Finance & Quant",
    "Consulting": "Consulting & Strategy",
    "Data Science": "AI, ML & Data Science",
    "Analytics": "AI, ML & Data Science",
    "AI/ML": "AI, ML & Data Science",
    "Product Management": "Product Management",
    "Design": "Design & UI/UX",
    "FMCG/Consumer Goods": "FMCG & Consumer",
    "Operations": "Operations & Supply Chain",
    "Public Sector Undertaking": "PSU & Government",
    "Education": "Education & Research",
    "Services": "Services & Advisory",
    "Other": "General & Other"
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


def extract_jd_semantic_structure(jd_text: str, title: str, company: str) -> Dict[str, Any]:
    """
    Extracts structured must-have skills, selection rounds, and role summary from raw JAF text.
    """
    if not jd_text or pd.isna(jd_text) or str(jd_text).lower() == "nan":
        return {
            "role_summary": f"Full-time graduate placement opportunity for {title} at {company}.",
            "skills": [],
            "responsibilities": [],
            "selection_rounds": ["Resume Shortlisting", "Online Assessment", "Technical Interview Rounds", "HR / Culture Fit"]
        }
        
    text = str(jd_text).strip()
    
    # Skill taxonomy patterns
    known_tech_skills = [
        "Python", "C++", "Java", "Go", "Golang", "Rust", "C#", "JavaScript", "TypeScript", "React", "Next.js",
        "Node.js", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "Docker", "Kubernetes", "AWS",
        "GCP", "Azure", "PyTorch", "TensorFlow", "Scikit-Learn", "Machine Learning", "Deep Learning", "LLMs",
        "NLP", "Computer Vision", "DSA", "Algorithms", "System Design", "Distributed Systems", "Microservices",
        "Git", "CI/CD", "Linux", "gRPC", "REST APIs", "MATLAB", "Simulink", "Verilog", "VHDL", "FPGA", "Embedded C",
        "RTOS", "VLSI", "Power BI", "Tableau", "Excel", "Financial Modeling", "Guesstimates", "Case Solving",
        "Probability", "Statistics", "Stochastic Calculus", "Quantitative Analysis", "Optimization", "Spark"
    ]
    
    extracted_skills = []
    text_lower = text.lower()
    for skill in known_tech_skills:
        # Check whole word boundary
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            extracted_skills.append(skill)
            
    # Responsibilities extraction (lines or numbered points)
    resp_matches = re.findall(r'(?:(?:[\d\.\-\•\*\–\—]+|\b(?:responsibility|responsibilities|tasks|role|you will)\b[:\-]?)\s*)([A-Z][^\.\n]{20,180}\.?)', text)
    responsibilities = [r.strip() for r in resp_matches[:6]]
    
    if not responsibilities:
        # Split by sentences
        sentences = [s.strip() for s in re.split(r'[\.\n]+', text) if len(s.strip()) > 30 and len(s.strip()) < 180]
        responsibilities = sentences[:4]
        
    # Selection process detection
    selection_rounds = []
    if any(k in text_lower for k in ["online test", "coding test", "aptitude test", "assessment", "oa", "written test"]):
        selection_rounds.append("Round 1: Online Assessment (Coding / Aptitude / Technical)")
    else:
        selection_rounds.append("Round 1: Resume Shortlisting & Preliminary Screening")
        
    if any(k in text_lower for k in ["technical interview", "tech round", "coding interview", "system design", "case interview"]):
        selection_rounds.append("Round 2: Technical Interview (Problem Solving & Core Fundamentals)")
        selection_rounds.append("Round 3: Advanced Technical / Domain Deep-Dive")
    else:
        selection_rounds.append("Round 2: Technical Evaluation Interview")
        
    selection_rounds.append("Final Round: Leadership, Team Fit & HR Discussion")
    
    # Generate concise role summary
    first_paragraph = text.split("\n\n")[0] if "\n\n" in text else text[:250]
    role_summary = re.sub(r'\s+', ' ', first_paragraph).strip()
    if len(role_summary) > 280:
        role_summary = role_summary[:277] + "..."
        
    return {
        "role_summary": role_summary,
        "skills": extracted_skills[:12],
        "responsibilities": responsibilities,
        "selection_rounds": selection_rounds
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
            # Standardize columns
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
                        
                # Split questions into clean list
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
    print(f"Starting ingestion from {excel_path}...")
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
            standardized_sector = SECTOR_MAPPING.get(raw_job_sector, SECTOR_MAPPING.get(raw_comp_sector, "General & Other"))
            
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
            jd_info = extract_jd_semantic_structure(str(row.get("Job Description", "")), raw_title, cname)
            
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
                "role_summary": jd_info["role_summary"],
                "required_skills": jd_info["skills"],
                "responsibilities": jd_info["responsibilities"],
                "selection_rounds": jd_info["selection_rounds"],
                "perks_and_benefits": add_info["highlights"],
                "additional_info_raw": add_info.get("raw_summary", ""),
                "raw_jd": str(row.get("Job Description", ""))[:2000]
            }
            roles_list.append(role_record)
            
            # Update or create Company Master
            if cslug not in companies_dict:
                # Check selection insights matching
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
                    "highest_ctc_inr": ctc_inr_equiv,
                    "highest_inhand_inr": inhand_inr_equiv,
                    "median_ctc_inr": ctc_inr_equiv,
                    "dominant_currency": currency,
                    "has_international_offers": currency != "INR",
                    "locations": [location] if location != "India" else ["Pan India"],
                    "roles": [role_id],
                    "selection_insights": insight_data if insight_data else None,
                    "ai_overview": jd_info["role_summary"]
                }
            else:
                comp = companies_dict[cslug]
                comp["roles_count"] += 1
                comp["roles"].append(role_id)
                if is_24_25:
                    comp["is_hiring_24_25"] = True
                if is_25_26:
                    comp["is_hiring_25_26"] = True
                if ctc_inr_equiv > comp["highest_ctc_inr"]:
                    comp["highest_ctc_inr"] = ctc_inr_equiv
                if inhand_inr_equiv > comp["highest_inhand_inr"]:
                    comp["highest_inhand_inr"] = inhand_inr_equiv
                if currency != "INR":
                    comp["has_international_offers"] = True
                if location not in comp["locations"] and len(comp["locations"]) < 5:
                    comp["locations"].append(location)

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
            "version": "1.0.0",
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
        
    print(f"Successfully generated structured placement intelligence dataset at: {output_json_path}")
    return dataset_payload


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    excel_file = os.path.join(base_dir, "data", "Placement Companies & JDs", "Placement_tijori.xlsx")
    insights_folder = os.path.join(base_dir, "data", "selection insights")
    out_file = os.path.join(base_dir, "apps", "api", "data", "placement_intelligence.json")
    
    ingest_placement_tijori_dataset(excel_file, insights_folder, out_file)
