import pytest
from fastapi.testclient import TestClient
import os
import json
from apps.api.main import app

client = TestClient(app)


def test_shortlist_dataset_integrity():
    """Verify that the extracted interview shortlist dataset exists and meets quality standards."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "placement_interview_shortlists.json")
    assert os.path.exists(data_path), f"Shortlists dataset missing at {data_path}"

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 300, f"Expected at least 300 companies, got {len(data)}"
    
    total_shortlisted = sum(c.get("total_shortlisted", 0) for c in data.values())
    assert total_shortlisted >= 9500, f"Expected at least 9,500 shortlisted records, got {total_shortlisted}"


def test_strict_interview_shortlist_filtering():
    """Verify that only interview shortlists are present and no test/OA shortlists leak in."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "placement_interview_shortlists.json")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    forbidden_terms = [
        "window test",
        "mock test",
        "test link",
        "hackerrank test",
        "oa shortlist",
        "test shortlist",
    ]

    for slug, comp in data.items():
        for cand in comp.get("all_candidates", []):
            round_name = cand.get("round", "").lower()
            role_name = cand.get("role", "").lower()
            for term in forbidden_terms:
                assert term not in round_name, f"Forbidden term '{term}' leaked in candidate round for {slug}: {round_name}"
                assert term not in role_name, f"Forbidden term '{term}' leaked in candidate role for {slug}: {role_name}"


def test_get_company_interview_shortlists_api():
    """Test the dedicated interview shortlists endpoint for a known recruiter."""
    response = client.get("/placement-analysis/company/futures-first/interview-shortlists")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["total_shortlisted"] > 0
    assert len(res_data["branches"]) > 0
    assert len(res_data["all_candidates"]) > 0

    first_cand = res_data["all_candidates"][0]
    assert "name" in first_cand and len(first_cand["name"]) > 0
    assert "roll_number" in first_cand and len(first_cand["roll_number"]) > 0
    assert "branch" in first_cand and len(first_cand["branch"]) > 0
    assert "role" in first_cand and len(first_cand["role"]) > 0


def test_embedded_shortlist_in_company_details():
    """Verify interview shortlists are embedded in the company details endpoint."""
    response = client.get("/placement-analysis/company/futures-first")
    assert response.status_code == 200
    res_data = response.json()
    assert "interview_shortlists" in res_data
    assert res_data["interview_shortlists"] is not None
    assert res_data["interview_shortlists"]["total_shortlisted"] > 0


def test_fashnear_technologies_regression():
    """Verify fashnear-technologies (Meesho) resolves without missing module errors and displays shortlists."""
    # 1. Company details endpoint
    resp = client.get("/placement-analysis/company/fashnear-technologies")
    assert resp.status_code == 200
    data = resp.json()
    assert data["company"]["name"] == "FASHNEAR TECHNOLOGIES"
    assert data["interview_shortlists"] is not None
    assert data["interview_shortlists"]["total_shortlisted"] == 135

    # 2. Dedicated shortlists endpoint
    resp_sl = client.get("/placement-analysis/company/fashnear-technologies/interview-shortlists")
    assert resp_sl.status_code == 200
    data_sl = resp_sl.json()
    assert data_sl["status"] == "success"
    assert data_sl["total_shortlisted"] == 135
    assert len(data_sl["all_candidates"]) == 135


def test_company_without_shortlist_graceful_handling():
    """Verify companies without published interview shortlists return cleanly with 200 without throwing 500 exceptions."""
    # 1. Company details endpoint
    resp = client.get("/placement-analysis/company/aarvee-associates")
    assert resp.status_code == 200
    data = resp.json()
    assert data["interview_shortlists"] is None

    # 2. Dedicated shortlists endpoint
    resp_sl = client.get("/placement-analysis/company/aarvee-associates/interview-shortlists")
    assert resp_sl.status_code == 200
    data_sl = resp_sl.json()
    assert data_sl["status"] == "success"
    assert data_sl["total_shortlisted"] == 0
    assert data_sl["all_candidates"] == []

