"""
Accenture Knowledge Base Service
Loads data/accenture/knowledge_base.json into memory and resolves relevant
historical questions, follow-up chains, and trigger patterns during live interviews.
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
KB_FILE = BASE_DIR / "data" / "accenture" / "knowledge_base.json"

_CACHED_KB: Optional[Dict[str, Any]] = None


def get_accenture_kb() -> Dict[str, Any]:
    """Loads and caches the Accenture Knowledge Base in memory."""
    global _CACHED_KB
    if _CACHED_KB is None:
        if KB_FILE.exists():
            try:
                with open(KB_FILE, "r", encoding="utf-8") as f:
                    _CACHED_KB = json.load(f)
            except Exception as e:
                print(f"[Accenture KB] Error loading KB file: {e}")
                _CACHED_KB = {}
        else:
            _CACHED_KB = {}
    return _CACHED_KB or {}


def reload_accenture_kb() -> Dict[str, Any]:
    """Forces reload of the knowledge base from disk."""
    global _CACHED_KB
    _CACHED_KB = None
    return get_accenture_kb()


def get_category_questions(category: str) -> List[Dict[str, Any]]:
    """Returns all questions recorded under a specific category."""
    kb = get_accenture_kb()
    q_bank = kb.get("question_bank_by_category", {})
    return q_bank.get(category, [])


def match_candidate_triggers(candidate_message: str) -> List[str]:
    """Identifies any trigger signals in the candidate's last answer."""
    kb = get_accenture_kb()
    trigger_rules = kb.get("candidate_trigger_rules", [])
    matched_directives: List[str] = []

    text = candidate_message.lower()
    for rule in trigger_rules:
        signals = rule.get("regex_signals", [])
        directive = rule.get("interviewer_probing_directive", "")
        for pattern in signals:
            if re.search(pattern, text, re.IGNORECASE):
                matched_directives.append(directive)
                break

    return matched_directives


def get_interviewer_persona_prompt() -> str:
    """Returns the core prompt guidelines for the Accenture Manager persona."""
    kb = get_accenture_kb()
    persona = kb.get("interviewer_persona", {})
    title = persona.get("title", "Manager / Senior Manager (Accenture Strategy & Consulting)")
    tone = persona.get("tone", "Professional, curious, direct, conversational, rigorous")
    prohibited = "\n- ".join(persona.get("prohibited_behaviors", []))
    required = "\n- ".join(persona.get("required_behaviors", []))

    return f"""
YOU ARE: {title}
TONE & POSTURE: {tone}

PROHIBITED BEHAVIORS:
- {prohibited}

REQUIRED INTERVIEWING DIRECTIVES:
- {required}
"""
