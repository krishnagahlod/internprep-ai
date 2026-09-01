"""
Accenture Interview Data Ingestion and Normalization Pipeline
Processes raw debriefs and experiences from data/accenture/raw/ into a structured
knowledge base in data/accenture/knowledge_base.json.
"""

import os
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
    "IIT Roorkee": 0.80,
    "IIT Dhanbad": 0.80,
    "Other": 0.65
}


def clean_pii(text: str) -> str:
    """Removes emails, phone numbers, roll numbers, and personal identifiers."""
    if not text:
        return ""
    # Email
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL_REDACTED]", text)
    # Phone numbers
    text = re.sub(r"\b(?:\+?91[\-\s]?)?[6789]\d{9}\b", "[PHONE_REDACTED]", text)
    # Roll numbers (e.g. 210050045)
    text = re.sub(r"\b\d{8,10}\b", "[ROLL_REDACTED]", text)
    return text


def determine_category(topic: str, question: str) -> str:
    """Classifies a question or topic into the 5-part taxonomy."""
    content = f"{topic} {question}".lower()
    if any(k in content for k in ["genai", "llm", "rag", "artificial intelligence", "machine learning", "fine-tuning", "hallucination", "model"]):
        return "ai_genai"
    if any(k in content for k in ["case", "market entry", "profitability", "guesstimate", "retail", "supermarket", "ev charging", "supply chain", "revenue minus cost", "margin"]):
        return "consulting_case"
    if any(k in content for k in ["why consulting", "why accenture", "conflict", "disagreement", "leadership", "ambiguity", "star method", "weakness"]):
        return "behavioral"
    if any(k in content for k in ["intro", "introduction", "walk me through", "tell me about yourself", "closing", "questions for me"]):
        return "opening_closing"
    return "resume"


def process_raw_interview_files() -> Dict[str, Any]:
    """Scans RAW_DATA_DIR, parses debriefs, and compiles knowledge base."""
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_experiences: List[Dict[str, Any]] = []

    # Read all JSON files in raw directory
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

    # Aggregation containers
    categorized_questions: Dict[str, List[Dict[str, Any]]] = {c: [] for c in TAXONOMY_CATEGORIES}
    interviewer_persona_metrics: Dict[str, Any] = {
        "avg_probing_intensity": 3.8,
        "observed_styles": ["direct", "conversational", "challenging", "structured"],
        "pacing_minutes": 25
    }
    candidate_triggers: List[Dict[str, Any]] = [
        {
            "trigger_type": "quantitative_metric_claim",
            "regex_signals": ["([0-9]+%|[0-9]+x|improved by|reduced by|increased by)"],
            "interviewer_probing_directive": "Probe the baseline, sample size, measurement methodology, and isolate the candidate's personal contribution from the broader team."
        },
        {
            "trigger_type": "ai_or_rag_claim",
            "regex_signals": ["(rag|llm|fine-tuning|agent|embeddings|langchain|transformer)"],
            "interviewer_probing_directive": "Probe the business rationale (Why RAG vs Fine-tuning? How do you explain latency/cost tradeoffs to a non-technical CXO?)."
        },
        {
            "trigger_type": "team_leadership_claim",
            "regex_signals": ["(led a team|headed|managed|spearheaded|core member)"],
            "interviewer_probing_directive": "Probe conflict resolution, alignment under ambiguity, and practical stakeholder pushback."
        }
    ]

    total_interviews = len(all_experiences)
    iitb_interviews = 0

    for exp in all_experiences:
        institute = exp.get("source", {}).get("institute", "Other")
        if "Bombay" in institute:
            iitb_interviews += 1
        weight = CONFIDENCE_WEIGHTS.get(institute, 0.7)

        sequence = exp.get("sequence", [])
        for step in sequence:
            topic = clean_pii(step.get("canonical_topic", ""))
            q_text = clean_pii(step.get("question", ""))
            ans_summary = clean_pii(step.get("candidate_response_summary", ""))
            follow_ups = [clean_pii(f) for f in step.get("follow_ups", [])]
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
            "version": "1.0.0",
            "target_company": "Accenture Global",
            "target_role": "Management Consulting Associate / Summer Internship",
            "target_cohort": "IIT Bombay 2028 Cohort & Top IITs",
            "total_processed_interviews": total_interviews,
            "iitb_interviews": iitb_interviews,
            "last_updated": "2026-09-01"
        },
        "taxonomy": TAXONOMY_CATEGORIES,
        "interviewer_persona": {
            "title": "Manager / Senior Manager (Accenture Strategy & Consulting)",
            "tone": "Professional, curious, direct, conversational, rigorous",
            "probing_intensity": 4,
            "prohibited_behaviors": [
                "Never give generic cheerleader validation like 'Great answer!' or 'Awesome!'",
                "Never read off a static checklist without dynamic follow-ups",
                "Never reveal hidden evaluation scores during the live interview"
            ],
            "required_behaviors": [
                "Probe unsupported claims and quantitative metrics",
                "Ask one question at a time and listen attentively to candidate responses",
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
        "categories_extracted": {cat: len(categorized_questions[cat]) for cat in TAXONOMY_CATEGORIES},
        "output_file": str(OUTPUT_KB_FILE)
    }
    with open(PROCESSED_DATA_DIR / "pipeline_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"[Accenture Pipeline] Successfully processed {total_interviews} interviews into {OUTPUT_KB_FILE}")
    return summary


if __name__ == "__main__":
    process_raw_interview_files()
