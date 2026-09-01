"""
Test Suite for Accenture Simulation Services & Evaluator
"""

import pytest
from services.accenture_kb_service import (
    get_accenture_kb,
    match_candidate_triggers,
    get_interviewer_persona_prompt,
    get_category_questions
)
from agents.accenture_interviewer import build_accenture_system_prompt
from agents.accenture_evaluator import evaluate_accenture_interview


def test_accenture_kb_loading():
    """Verifies that the Accenture Knowledge Base loads correctly."""
    kb = get_accenture_kb()
    assert kb is not None
    assert "metadata" in kb
    assert "taxonomy" in kb
    assert len(kb["taxonomy"]) == 5
    assert "interviewer_persona" in kb
    assert kb["metadata"]["target_company"] == "Accenture Global"


def test_candidate_trigger_matching():
    """Verifies that quantitative & AI trigger signals match correctly."""
    # Test quant trigger
    directives = match_candidate_triggers("I reduced latency by 45% using a cache.")
    assert len(directives) > 0
    assert any("baseline" in d.lower() for d in directives)

    # Test AI trigger
    directives = match_candidate_triggers("We implemented a RAG pipeline for customer documents.")
    assert len(directives) > 0
    assert any("rag" in d.lower() for d in directives)

    # Test leadership trigger
    directives = match_candidate_triggers("I led a team of 5 engineers.")
    assert len(directives) > 0
    assert any("conflict" in d.lower() for d in directives)


def test_interviewer_prompt_generation():
    """Verifies system prompt construction for the Accenture manager."""
    prompt = build_accenture_system_prompt(
        session_id="test_acc_123",
        practice_mode="full_simulation",
        current_phase="resume_deep_dive",
        time_elapsed_secs=300,
        candidate_last_message="I led a team of 5 engineers."
    )
    assert "Accenture Strategy & Consulting" in prompt
    assert "FULL_SIMULATION" in prompt
    assert "RESUME_DEEP_DIVE" in prompt


def test_category_questions_retrieval():
    """Verifies retrieval of category-specific historical questions."""
    ai_questions = get_category_questions("ai_genai")
    assert isinstance(ai_questions, list)

    case_questions = get_category_questions("consulting_case")
    assert isinstance(case_questions, list)


def test_evaluator_schema_fallback():
    """Verifies that the evaluator produces a valid 6-dimension report schema."""
    sample_messages = [
        {"role": "assistant", "content": "Tell me about your internship."},
        {"role": "user", "content": "I improved system throughput by 30% by building a RAG pipeline."}
    ]
    report = evaluate_accenture_interview(
        session_id="test_session_123",
        messages=sample_messages,
        resume_context="IIT Bombay CS Student"
    )
    assert report is not None
    assert "overall_verdict" in report
    assert "candidate_level" in report
    assert "dimension_scores" in report
    assert "fix_before_real_interview" in report
    assert len(report["fix_before_real_interview"]) > 0


if __name__ == "__main__":
    print("Running Accenture Unit Test Suite...")
    test_accenture_kb_loading()
    test_candidate_trigger_matching()
    test_interviewer_prompt_generation()
    test_category_questions_retrieval()
    test_evaluator_schema_fallback()
    print("All 5 Accenture unit tests passed successfully!")
