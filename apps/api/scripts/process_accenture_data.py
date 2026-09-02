"""
Accenture Interview Data Ingestion and Normalization Pipeline
Processes raw debriefs and experiences from data/accenture/raw/ (JSON & CSV) into a structured
knowledge base in data/accenture/knowledge_base.json.
"""

import os
import csv
import json
import re
from pathlib import Path
from typing import List, Dict, Any

# Root Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "accenture" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "accenture" / "processed"
OUTPUT_KB_FILE = BASE_DIR / "data" / "accenture" / "knowledge_base.json"

TAXONOMY_CATEGORIES = [
    "opening_closing",
    "resume",
    "consulting_case",
    "ai_genai",
    "behavioral"
]

CONFIDENCE_WEIGHTS = {
    "IIT Bombay": 1.0,
    "IIT Delhi": 0.85,
    "IIT Madras": 0.85,
    "IIT Kharagpur": 0.85,
    "IIT (ISM) Dhanbad": 0.80,
    "IIT ISM Dhanbad": 0.80,
    "IIT Roorkee": 0.80,
    "Other": 0.70
}


def clean_pii(text: str) -> str:
    """Removes emails, phone numbers, roll numbers, and personal identifiers."""
    if not text:
        return ""
    # Email
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL_REDACTED]", text)
    # Phone numbers (10 digits, +91, etc.)
    text = re.sub(r"\b(?:\+?91[\-\s]?)?[6789]\d{9}\b", "[PHONE_REDACTED]", text)
    # Roll numbers (e.g. 210050045)
    text = re.sub(r"\b\d{8,10}\b", "[ROLL_REDACTED]", text)
    return text.strip()


def determine_category(topic: str, question: str) -> str:
    """Classifies a question or topic into the 5-part taxonomy."""
    content = f"{topic} {question}".lower()
    if any(k in content for k in ["genai", "llm", "rag", "artificial intelligence", "machine learning", "fine-tuning", "hallucination", "model", "ai tools"]):
        return "ai_genai"
    if any(k in content for k in ["case", "market entry", "profitability", "guesstimate", "retail", "supermarket", "ev charging", "supply chain", "rca", "root cause", "revenue earned", "football"]):
        return "consulting_case"
    if any(k in content for k in ["why consulting", "why accenture", "conflict", "disagreement", "leadership", "ambiguity", "star method", "weakness", "5 years", "next few years"]):
        return "behavioral"
    if any(k in content for k in ["intro", "introduction", "walk me through", "tell me about yourself", "closing", "questions for me"]):
        return "opening_closing"
    return "resume"


def parse_csv_experiences(file_path: Path) -> List[Dict[str, Any]]:
    """Parses Google Form CSV export into standardized structured interview records."""
    experiences: List[Dict[str, Any]] = []

    try:
        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                inst = clean_pii(row.get("Which institute are you from?", "")).strip()
                dept = clean_pii(row.get("What is your department/branch and graduation year?", ""))
                role = clean_pii(row.get("Which role did you interview for?", "Management Consulting Intern"))
                duration_raw = clean_pii(row.get("What was the year and approximate duration of your interview?", "25 mins"))
                interviewers_count = row.get("How many interviewers were present?", "1")
                
                questions_raw = clean_pii(row.get("Please list the most important questions you remember (in approximate chronological order).", ""))
                followups_raw = clean_pii(row.get("Which 2-3 questions generated the most follow-ups or were the most challenging?", ""))
                
                has_ai = row.get("Were any AI/GenAI questions asked?", "").strip().lower() == "yes"
                ai_details = clean_pii(row.get("If yes, please describe the AI/GenAI questions and their nature (technical, conceptual, business-oriented, etc.).", ""))
                
                has_case = row.get("Was a case or business problem given?", "").strip().lower() == "yes"
                case_details = clean_pii(row.get("If a case was given, please describe the problem and the case type (e.g., Profitability, Market Entry, AI Transformation).", ""))
                
                behavioral_raw = clean_pii(row.get("Which behavioral questions were asked? (Did they ask 'Why Consulting?' or 'Why Accenture?')", ""))
                style = clean_pii(row.get("How would you describe the interviewer's style?", "Conversational"))
                challenge_score = row.get("On a scale of 1 to 5, how much did the interviewer challenge your answers?", "3")
                advice = clean_pii(row.get("What is the single most important advice you would give to someone preparing for this interview?", ""))

                # Build sequence
                sequence: List[Dict[str, Any]] = []
                step_idx = 1

                # 1. Main chronological questions
                if questions_raw:
                    lines = [l.strip() for l in questions_raw.split("\n") if l.strip()]
                    for q_line in lines:
                        if len(q_line) > 5:
                            cat = determine_category("", q_line)
                            sequence.append({
                                "step": step_idx,
                                "category": cat,
                                "canonical_topic": q_line[:60],
                                "question": q_line,
                                "candidate_response_summary": "Discussed in candidate debrief.",
                                "follow_ups": [followups_raw] if followups_raw and step_idx == 1 else [],
                                "interviewer_reaction": f"Challenged with intensity {challenge_score}/5",
                                "confidence": "high"
                            })
                            step_idx += 1

                # 2. Add AI questions if separate
                if has_ai and ai_details:
                    sequence.append({
                        "step": step_idx,
                        "category": "ai_genai",
                        "canonical_topic": "AI & GenAI Tool Knowledge",
                        "question": ai_details,
                        "candidate_response_summary": "Candidate discussed AI tools and conceptual understanding.",
                        "follow_ups": [],
                        "interviewer_reaction": "Probed on tools and business use cases",
                        "confidence": "high"
                    })
                    step_idx += 1

                # 3. Add Case questions if separate
                if has_case and case_details:
                    sequence.append({
                        "step": step_idx,
                        "category": "consulting_case",
                        "canonical_topic": case_details[:60],
                        "question": case_details,
                        "candidate_response_summary": "Candidate solved structured business case.",
                        "follow_ups": [],
                        "interviewer_reaction": "Tested MECE structure and mental math",
                        "confidence": "high"
                    })
                    step_idx += 1

                # 4. Add Behavioral questions if separate
                if behavioral_raw and behavioral_raw.lower() != "no":
                    sequence.append({
                        "step": step_idx,
                        "category": "behavioral",
                        "canonical_topic": "Why Consulting & Why Accenture",
                        "question": behavioral_raw,
                        "candidate_response_summary": "Candidate articulated motivation and fit.",
                        "follow_ups": [],
                        "interviewer_reaction": "Assessed communication and structured storytelling",
                        "confidence": "high"
                    })

                exp = {
                    "interview_id": f"csv_resp_{idx+1}",
                    "source": {
                        "institute": inst or "IIT",
                        "department": dept,
                        "role": role,
                        "duration": duration_raw,
                        "collection_method": "google_form_csv"
                    },
                    "metadata": {
                        "interviewers_count": interviewers_count,
                        "challenge_score": challenge_score,
                        "interviewer_style": style,
                        "candidate_advice": advice
                    },
                    "sequence": sequence,
                    "interviewer_behavior": {
                        "probing_intensity": int(challenge_score) if challenge_score.isdigit() else 3,
                        "style": [s.strip().lower() for s in style.split(",") if s.strip()]
                    }
                }
                experiences.append(exp)
    except Exception as e:
        print(f"[Accenture Pipeline] Error reading CSV {file_path}: {e}")

    return experiences


def process_raw_interview_files() -> Dict[str, Any]:
    """Scans RAW_DATA_DIR, parses debriefs from JSON and CSV, and compiles knowledge base."""
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_experiences: List[Dict[str, Any]] = []

    # 1. Parse JSON files
    for file_path in RAW_DATA_DIR.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    all_experiences.extend(data)
                elif isinstance(data, dict):
                    all_experiences.append(data)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    # 2. Parse CSV files
    for file_path in RAW_DATA_DIR.glob("*.csv"):
        csv_exps = parse_csv_experiences(file_path)
        all_experiences.extend(csv_exps)

    # Aggregation containers
    categorized_questions: Dict[str, List[Dict[str, Any]]] = {c: [] for c in TAXONOMY_CATEGORIES}
    
    # Dynamic Candidate Trigger Directives derived from real evidence
    candidate_triggers: List[Dict[str, Any]] = [
        {
            "trigger_type": "quantitative_metric_claim",
            "regex_signals": ["([0-9]+%|[0-9]+x|improved by|reduced by|increased by)"],
            "interviewer_probing_directive": "Probe the baseline, sample size, measurement methodology, and isolate the candidate's personal contribution from the broader team."
        },
        {
            "trigger_type": "ai_or_rag_claim",
            "regex_signals": ["(rag|llm|fine-tuning|agent|embeddings|langchain|transformer|genai|gpt)"],
            "interviewer_probing_directive": "Probe the business rationale (Why RAG vs Fine-tuning? How do you explain latency/cost tradeoffs to a non-technical CXO? What AI tools do you actively use in your workflow?)."
        },
        {
            "trigger_type": "team_leadership_claim",
            "regex_signals": ["(led a team|headed|managed|spearheaded|core member|mentor)"],
            "interviewer_probing_directive": "Probe how work was divided between team members, conflict resolution, and handling stakeholder pushback under ambiguity."
        },
        {
            "trigger_type": "academic_domain_pushback",
            "regex_signals": ["(environmental|chemical|civil|mechanical|metallurgy|mining|materials|aerospace)"],
            "interviewer_probing_directive": "Challenge the candidate on why Accenture should hire them for consulting from their specific engineering major, particularly when consulting for traditional enterprise sectors like oil & gas, mining, or industrial plants."
        },
        {
            "trigger_type": "guesstimate_or_case_trigger",
            "regex_signals": ["(ev charging|charging booth|petrol pump|footfall|supermarket|food quality|mess|margin|world cup|football)"],
            "interviewer_probing_directive": "Test structured MECE issue trees, assumptions, sanity checks on calculations, and crisp 3-point executive takeaways."
        }
    ]

    total_interviews = len(all_experiences)
    iitb_interviews = 0
    iit_distribution: Dict[str, int] = {}

    for exp in all_experiences:
        institute = exp.get("source", {}).get("institute", "Other")
        if "Bombay" in institute:
            iitb_interviews += 1
        iit_distribution[institute] = iit_distribution.get(institute, 0) + 1
        weight = CONFIDENCE_WEIGHTS.get(institute, 0.7)

        sequence = exp.get("sequence", [])
        for step in sequence:
            topic = clean_pii(step.get("canonical_topic", ""))
            q_text = clean_pii(step.get("question", ""))
            ans_summary = clean_pii(step.get("candidate_response_summary", ""))
            follow_ups = [clean_pii(f) for f in step.get("follow_ups", []) if f]
            reaction = step.get("interviewer_reaction", "")

            cat = step.get("category") or determine_category(topic, q_text)
            if cat not in categorized_questions:
                cat = "resume"

            categorized_questions[cat].append({
                "topic": topic,
                "question": q_text,
                "answer_summary": ans_summary,
                "follow_ups": follow_ups,
                "interviewer_reaction": reaction,
                "source_institute": institute,
                "weight": weight,
                "confidence": step.get("confidence", "high")
            })

    # Compile Knowledge Base
    kb = {
        "metadata": {
            "version": "1.1.0",
            "target_company": "Accenture Global",
            "target_role": "Management Consulting Associate / Summer Internship",
            "target_cohort": "IIT Bombay 2028 Batch & Premier IITs (IITD, IITM, IITKGP, IIT ISM)",
            "total_processed_interviews": total_interviews,
            "iitb_interviews": iitb_interviews,
            "institute_breakdown": iit_distribution,
            "last_updated": "2026-09-02"
        },
        "taxonomy": TAXONOMY_CATEGORIES,
        "interviewer_persona": {
            "title": "Manager / Senior Manager (Accenture Strategy & Consulting)",
            "tone": "Professional, curious, direct, conversational, rigorous",
            "probing_intensity": 3.6,
            "prohibited_behaviors": [
                "Never give generic cheerleader validation like 'Great answer!' or 'Awesome!'",
                "Never read off a static checklist without dynamic follow-ups",
                "Never reveal hidden evaluation scores during the live interview"
            ],
            "required_behaviors": [
                "Probe unsupported claims and quantitative metrics (always verify the baseline)",
                "Challenge candidates on their academic major relevance (domain pushback)",
                "Ask one focused question at a time and listen attentively to candidate responses",
                "Offer subtle hints during consulting cases only if candidate gets stuck",
                "Maintain time awareness (20-25 mins pacing)"
            ]
        },
        "candidate_trigger_rules": candidate_triggers,
        "question_bank_by_category": categorized_questions
    }

    # Write Knowledge Base JSON
    with open(OUTPUT_KB_FILE, "w", encoding="utf-8") as f:
        json.dump(kb, f, indent=2)

    # Write Pipeline Summary
    summary = {
        "status": "success",
        "total_interviews": total_interviews,
        "institutes_included": iit_distribution,
        "categories_extracted": {cat: len(categorized_questions[cat]) for cat in TAXONOMY_CATEGORIES},
        "output_file": str(OUTPUT_KB_FILE)
    }
    with open(PROCESSED_DATA_DIR / "pipeline_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"[Accenture Pipeline] Successfully processed {total_interviews} interviews ({list(iit_distribution.keys())}) into {OUTPUT_KB_FILE}")
    return summary


if __name__ == "__main__":
    process_raw_interview_files()
