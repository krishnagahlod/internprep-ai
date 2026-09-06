"""
Test Suite for Case & Domain Interview Upgrades
Verifies smart case selection, fallbacks, and target_phase section jumps.
"""

import pytest
from agents.case_interviewer import get_random_case, DEFAULT_FALLBACK_CASE, PHASES as CASE_PHASES
from agents.domain_interviewer import PHASES as DOMAIN_PHASES


def test_get_random_case_normalization():
    """Verifies that selecting various case types returns valid cases and never raises errors."""
    # Test random mix
    case_random = get_random_case("Random Casebook Mix")
    assert case_random is not None
    assert "problem_statement" in case_random
    assert "solution_transcript" in case_random

    # Test market entry
    case_entry = get_random_case("Market Entry Strategy")
    assert case_entry is not None
    assert "problem_statement" in case_entry

    # Test profitability
    case_profit = get_random_case("Profitability & Cost Reduction")
    assert case_profit is not None
    assert "problem_statement" in case_profit

    # Test unknown string fallback
    case_unknown = get_random_case("Arbitrary Unmatched Category XYZ")
    assert case_unknown is not None
    assert "problem_statement" in case_unknown


def test_fallback_case_structure():
    """Verifies that the default fallback case has all required keys."""
    assert "id" in DEFAULT_FALLBACK_CASE
    assert "problem_statement" in DEFAULT_FALLBACK_CASE
    assert "solution_transcript" in DEFAULT_FALLBACK_CASE
    assert "pdf_source" in DEFAULT_FALLBACK_CASE
    assert "page_number" in DEFAULT_FALLBACK_CASE
    assert DEFAULT_FALLBACK_CASE["page_number"] == 91


def test_phase_definitions():
    """Verifies that case and domain phase lists contain all key stages for section jumping."""
    assert "introduction" in CASE_PHASES
    assert "quantitative" in CASE_PHASES
    assert "synthesis" in CASE_PHASES

    assert "introduction" in DOMAIN_PHASES
    assert "technical" in DOMAIN_PHASES
    assert "hr" in DOMAIN_PHASES


def test_fallback_pdf_file_exists():
    """Verifies that the default fallback PDF file actually exists on disk in data/casebooks."""
    import os
    pdf_name = DEFAULT_FALLBACK_CASE["pdf_source"]
    casebook_path = os.path.join(os.path.dirname(__file__), "data", "casebooks", pdf_name)
    assert os.path.exists(casebook_path), f"Expected {casebook_path} to exist"

