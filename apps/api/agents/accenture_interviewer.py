"""
Accenture Interviewer Agent
Stateful prompting engine modeling a Manager / Senior Manager at Accenture Strategy & Consulting.
"""

from typing import List, Dict, Any, Optional
from services.accenture_kb_service import (
    get_interviewer_persona_prompt,
    match_candidate_triggers,
    get_category_questions,
    get_accenture_kb
)

PHASE_MAP = {
    "full_simulation": ["introduction", "resume_deep_dive", "consulting_case", "ai_genai_strategy", "behavioral_fit", "closing"],
    "case_ai_drill": ["consulting_case", "ai_genai_strategy", "closing"],
    "resume_defense_drill": ["resume_deep_dive", "closing"],
    "behavioral_fit_drill": ["behavioral_fit", "closing"]
}


def build_accenture_system_prompt(
    session_id: str,
    practice_mode: str = "full_simulation",
    current_phase: str = "introduction",
    time_elapsed_secs: int = 0,
    resume_context: Optional[str] = None,
    candidate_last_message: Optional[str] = None
) -> str:
    """Constructs the dynamic, state-aware prompt for the Accenture Manager interviewer."""
    persona_prompt = get_interviewer_persona_prompt()
    kb = get_accenture_kb()
    meta = kb.get("metadata", {})
    target_role = meta.get("target_role", "Management Consulting Associate Summer Intern")
    target_cohort = meta.get("target_cohort", "IIT Bombay 2028 Batch")

    active_phases = PHASE_MAP.get(practice_mode, PHASE_MAP["full_simulation"])
    minutes_elapsed = time_elapsed_secs // 60

    # Match any specific triggers from the candidate's last message
    trigger_directives = []
    if candidate_last_message:
        trigger_directives = match_candidate_triggers(candidate_last_message)

    trigger_prompt = ""
    if trigger_directives:
        trigger_prompt = "\nDYNAMIC SIGNAL DETECTED IN CANDIDATE RESPONSE:\n" + "\n".join([f"- {d}" for d in trigger_directives])

    # Category-specific guidance
    historical_samples = get_category_questions(current_phase if current_phase != "introduction" else "opening_closing")
    samples_prompt = ""
    if historical_samples:
        sample_questions = [f"• \"{s.get('question')}\"" for s in historical_samples[:3]]
        samples_prompt = f"\nHISTORICAL ACCENTURE PATTERNS FOR THIS SECTION:\n" + "\n".join(sample_questions)

    return f"""
{persona_prompt}

TARGET CONTEXT:
- Role: {target_role}
- Candidate Target Cohort: {target_cohort}
- Practice Mode: {practice_mode.upper()}
- Current Interview Phase: {current_phase.upper()} (Phases: {' → '.join(active_phases)})
- Pacing: {minutes_elapsed} minutes elapsed out of ~25 minutes total.

CANDIDATE RESUME CONTEXT:
{resume_context or "IIT Bombay Candidate (Engineering & Analytical background, relevant tech/consulting projects)." }
{trigger_prompt}
{samples_prompt}

INTERVIEW RULES:
1. Speak as an experienced Manager in Accenture Strategy & Consulting.
2. Ask exactly ONE concise, focused question at a time.
3. If the candidate makes an unquantified claim or cites a % metric, challenge them to provide the baseline or isolate their personal contribution.
4. If this is a consulting case or AI strategy question, provide additional numbers/context ONLY if the candidate asks the right clarifying question.
5. Do NOT say 'Great answer!', 'Awesome!', or provide meta-commentary about the interview.
6. When satisfied with the candidate's depth on the current topic, transition naturally to the next phase in: [{' → '.join(active_phases)}].
"""
