#!/usr/bin/env python3
"""
Interview Shortlists Extraction Engine (IIT Bombay 2025-26 Season).
Extracts authentic candidate rosters (Student Names, Roll Numbers, Branches,
Degrees, and specific Interview Roles) from raw placement blog announcements.
Strictly filters for INTERVIEW shortlists only (excludes OA / test-only lists).
"""

import os
import sys
import re
import json
from collections import defaultdict
from typing import Dict, List, Any, Optional, Tuple
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

# Reconfigure stdout for utf-8 on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add blog_scraper directory to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(SCRIPT_DIR, "blog_scraper"))
from roll_decoder import decode_roll

# Import canonical mapping functions from ingest_placement_blogs
from ingest_placement_blogs import BLOG_ALIASES, normalize_recruiter_name, resolve_canonical_slug

RAW_BLOGS_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, "../../..", "data", "placement_blogs", "raw", "iitb_placement_blog25_raw.json"))
OUTPUT_SHORTLISTS_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, "../data/placement_interview_shortlists.json"))
INTEL_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, "../data/placement_intelligence.json"))

RECRUITER_SLUG_OVERRIDES: Dict[str, str] = {
    "axxela": "axxela-advisory-services",
    "axxela-advisory-services": "axxela-advisory-services",
    "da-vinci": "da-vinci-derivatives-bv",
    "da-vinci-derivatives": "da-vinci-derivatives-bv",
    "da-vinci-derivatives-b-v": "da-vinci-derivatives-bv",
    "da-vinci-derivatives-bv": "da-vinci-derivatives-bv",
    "tvs-motors": "tvs-motor",
    "tvs-motor": "tvs-motor",
    "tvs-motor-company-limited": "tvs-motor",
    "bajaj-auto": "bajaj-auto-and-bajaj-auto-technology",
    "bajaj-auto-and-bajaj-auto-technology": "bajaj-auto-and-bajaj-auto-technology",
    "bajaj-auto-technology-pvt-ltd": "bajaj-auto-and-bajaj-auto-technology",
    "larsen-and-toubro": "larsen-tubro",
    "larsen-tubro": "larsen-tubro",
    "larsen-toubro": "larsen-tubro",
    "pwc-us": "pwc-us-advisory",
    "pwc-us-advisory": "pwc-us-advisory",
    "kla-tencor": "kla",
    "kla": "kla",
    "mercedes-benz-research-and-development": "mercedes-benz-r-d",
    "mercedes-benz-research-and-development-india-private-limited": "mercedes-benz-r-d",
    "mercedes-benz-r-d": "mercedes-benz-r-d",
    "deloitte-i-interview-shortlist": "deloitte-india",
    "deloitte-i": "deloitte-india",
    "deloitte-india": "deloitte-india",
    "icici-lombard": "icici-lombard-gic",
    "icici-lombard-gic": "icici-lombard-gic",
    "icici-lombard-gic-ltd": "icici-lombard-gic",
    "glean": "glean-search-technologies-india",
    "glean-search-technologies-india": "glean-search-technologies-india",
    "procter-and-gamble-home-products-pvt-ltd": "procter-gamble-p-g",
    "procter-gamble": "procter-gamble-p-g",
    "procter-gamble-p-g": "procter-gamble-p-g",
    "mckinsey-ccn": "mckinsey-company",
    "mckinsey-company": "mckinsey-company",
    "samsung-research-institute-delhi": "samsung-research-and-development-institute-india-delhi",
    "samsung-research-and-development-institute-india-delhi": "samsung-research-and-development-institute-india-delhi",
    "sbi-fund-management": "sbi-funds-management",
    "sbi-funds-management": "sbi-funds-management",
    "intellimation-ai": "intellimationai",
    "intellimationai": "intellimationai",
    "intellimation": "intellimationai",
    "fashnear-technologies": "meesho",
    "fashnear-technologies-private-limited": "meesho",
    "meesho": "meesho",
    "balyasny-asset-management": "balyasny-asset-management",
}


def clean_student_name(name_raw: str) -> str:
    """Cleans student names, stripping leading numbers, dots, and trailing artifact chars."""
    if not name_raw:
        return ""
    # Strip leading numbers e.g. '1. ', '12) ', '. '
    n = re.sub(r"^[\d\.\)\s\-–]+", "", name_raw).strip()
    # Strip trailing punctuation
    n = re.sub(r"[\.,\-–\s]+$", "", n).strip()
    # Replace multiple whitespaces
    n = re.sub(r"\s+", " ", n)
    # Check if name is all uppercase (e.g. 'SHIVANSHI DUBEY')
    if n.isupper() and len(n) > 3:
        n = n.title()
    # Filter out common table headers
    if n.lower() in {"name", "candidate name", "student name", "slot", "sr no", "no", "roll", "roll num", "roll no"}:
        return ""
    return n


def clean_role_name(role_raw: str) -> str:
    """Normalizes job profile / role strings."""
    if not role_raw:
        return "Interview Candidate"
    r = re.sub(r"[\r\n\t]+", " ", role_raw).strip()
    r = re.sub(r"^Job\s*Code\s*\d*\s*[:\-–]\s*", "", r, flags=re.IGNORECASE)
    r = re.sub(r"^(?:Job\s*Profile|Profile|Role)\s*[:\-–]\s*", "", r, flags=re.IGNORECASE)
    r = re.sub(r"\s+", " ", r).strip(" -–:;,.")
    if not r or r.lower() in {"none", "tba", "open", "all"}:
        return "Interview Candidate"
    return r[:80]


def is_strict_interview_shortlist(title: str, text: str) -> bool:
    """
    Returns True ONLY if the announcement is an interview shortlist/update/schedule.
    Strictly excludes OA, Window Test, or Assessment-only shortlists.
    """
    comb = (title + " " + text).lower()

    # If it explicitly says test / OA shortlist
    is_test_shortlist = bool(re.search(
        r"test\s*shortlist|shortlist\s*for\s*(?:the\s*)?(?:test|oa|assessment)|assessment\s*shortlist|window\s*test|oa\s*shortlist|hackerrank|codeforces|shortlisted\s*for\s*round\s*1\s*test",
        comb
    ))
    has_interview_shortlist_phrase = bool(re.search(
        r"interview\s*(?:shortlist|update|schedule|round|call|process|list)|shortlist(?:ed)?\s*for\s*(?:the\s*)?interview|round\s*[1-5]\s*interview",
        comb
    ))

    if is_test_shortlist and not has_interview_shortlist_phrase:
        return False

    # Must contain interview keyword
    if not bool(re.search(r"interview", comb)):
        return False

    # Exclude JAF Open, Registration, or general info announcements without shortlists
    if bool(re.search(r"jaf\s*open|registration\s*link|mandatory\s*registration|presentation\s*link|slotting\s*matrix|rooms\s*allotted", comb)) and not has_interview_shortlist_phrase:
        return False

    # Must contain shortlist, selection, schedule, or round indicator
    has_shortlist_indicator = bool(re.search(
        r"shortlist|selected|schedule|round\s*\d|extended\s*shortlist|following\s*students|candidates",
        comb
    ))

    return has_shortlist_indicator


def extract_candidate_pairs(html_chunk: str, text_chunk: str) -> List[Tuple[str, str]]:
    """
    Extracts (roll_number, name) pairs from a block of HTML or text.
    """
    candidates: List[Tuple[str, str]] = []
    seen_rolls = set()

    # Strategy 1: HTML Table parsing
    if "<table" in html_chunk:
        soup = BeautifulSoup(html_chunk, "html.parser")
        for tr in soup.find_all("tr"):
            tds = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if len(tds) >= 2:
                roll = None
                name = None
                for idx, val in enumerate(tds):
                    clean_val = val.strip().upper()
                    if re.match(r"^2[0-5](B\d{4}|M\d{4}|D\d{5,7}|N\d{4}|U\d{6}|\d{7})$", clean_val):
                        roll = clean_val
                        # The other column is the name
                        for other_idx, other_val in enumerate(tds):
                            if other_idx != idx:
                                cand_name = clean_student_name(other_val)
                                if cand_name and len(cand_name) > 1:
                                    name = cand_name
                                    break
                        break
                if roll and roll not in seen_rolls:
                    seen_rolls.add(roll)
                    candidates.append((roll, name or "Candidate"))

    # Strategy 2: Text regex parsing (if table didn't extract or for text-formatted lists)
    if not candidates:
        for line in text_chunk.splitlines():
            line_str = line.strip()
            if not line_str:
                continue

            # Format A: '1. Name (Roll)' or 'Name [Roll]'
            mA = re.search(r"([A-Za-z\s\.\'\-]+)\s*[\(\[]\s*(2[0-5][BMDN]\d{4,6}|2[0-5]\d{7,8})\s*[\)\]]", line_str, re.IGNORECASE)
            if mA:
                name_val = clean_student_name(mA.group(1))
                roll_val = mA.group(2).strip().upper()
                if roll_val not in seen_rolls and name_val:
                    seen_rolls.add(roll_val)
                    candidates.append((roll_val, name_val))
                continue

            # Format B: 'Roll Name' e.g. '24M0211 Shashank Singh'
            mB = re.search(r"\b(2[0-5][BMDN]\d{4,6}|2[0-5]\d{7,8})\b\s+([A-Za-z\s\.\'\-]+)", line_str, re.IGNORECASE)
            if mB:
                roll_val = mB.group(1).strip().upper()
                name_val = clean_student_name(mB.group(2))
                if roll_val not in seen_rolls and name_val:
                    seen_rolls.add(roll_val)
                    candidates.append((roll_val, name_val))
                continue

            # Format C: 'Name Roll' e.g. '1. Ananya Kulashreshtha 22b0906'
            mC = re.search(r"([A-Za-z\s\.\'\-]+)\s+\b(2[0-5][BMDN]\d{4,6}|2[0-5]\d{7,8})\b", line_str, re.IGNORECASE)
            if mC:
                name_val = clean_student_name(mC.group(1))
                roll_val = mC.group(2).strip().upper()
                if roll_val not in seen_rolls and name_val:
                    seen_rolls.add(roll_val)
                    candidates.append((roll_val, name_val))
                continue

    return candidates


def split_into_role_sections(title: str, text: str, html: str) -> List[Tuple[str, str, str]]:
    """
    Splits post content into role-specific sub-sections if multiple job codes are present.
    Returns list of (role_title, text_chunk, html_chunk).
    """
    # Check if multiple job codes exist
    pattern = r"(Job\s*Code\s*\d*\s*[:\-–][^\n\r<]+)"
    matches = list(re.finditer(pattern, text, re.IGNORECASE))

    if len(matches) <= 1:
        # Single role post
        m_single = re.search(r"(?:Job\s*Code|Job\s*Profile|Profile|Role)\s*(?:\d+)?\s*[:\-–]\s*([^\n\r<]+)", text, re.IGNORECASE)
        if m_single:
            role_name = clean_role_name(m_single.group(1))
        else:
            parts = [p.strip() for p in title.split("|")]
            role_name = clean_role_name(parts[1]) if len(parts) >= 3 else "Interview Candidate"
        return [(role_name, text, html)]

    sections = []
    for i, match in enumerate(matches):
        role_header = match.group(1)
        role_name = clean_role_name(role_header)
        start_pos = match.start()
        end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        chunk_text = text[start_pos:end_pos]
        # For simplicity, reuse full html for table queries if present in chunk
        sections.append((role_name, chunk_text, html))

    return sections


def run_interview_shortlist_extraction():
    print("==================================================================")
    print("🚀 IIT Bombay Interview Shortlist Extraction Engine Starting...")
    print("==================================================================")

    if not os.path.exists(RAW_BLOGS_PATH):
        print(f"Error: Raw blog posts file not found at: {RAW_BLOGS_PATH}")
        sys.exit(1)

    with open(RAW_BLOGS_PATH, "r", encoding="utf-8") as f:
        posts = json.load(f)
    print(f"✓ Loaded {len(posts):,} raw blog announcements.")

    with open(INTEL_PATH, "r", encoding="utf-8") as f:
        intel_data = json.load(f)
    companies_data = intel_data.get("companies", [])
    print(f"✓ Loaded {len(companies_data)} companies from Placement Intelligence.")

    # Build canonical resolver map
    canonical_map: Dict[str, str] = {c["slug"]: c["slug"] for c in companies_data}
    company_name_by_slug: Dict[str, str] = {c["slug"]: c["name"] for c in companies_data}

    def clean_co_name(n: str) -> str:
        n = n.lower()
        n = re.sub(r'\[.*?\]', '', n)
        n = re.sub(r'\b(pvt|private|ltd|limited|technologies|technology|solutions|india|services|inc|corp|corporation|group|llp)\b', '', n)
        n = re.sub(r'[^a-z0-9]', '', n)
        return n

    clean_map: Dict[str, str] = {}
    for c in companies_data:
        clean_map[c["slug"]] = c["slug"]
        clean_map[clean_co_name(c["slug"])] = c["slug"]
        clean_map[clean_co_name(c["name"])] = c["slug"]

    for c in companies_data:
        norm_n, _ = normalize_recruiter_name(c["name"])
        canonical_map[norm_n] = c["slug"]
        canonical_map[norm_n.lower()] = c["slug"]
        canonical_map[c["name"].lower()] = c["slug"]
    for k, v in BLOG_ALIASES.items():
        canonical_map[k] = v

    shortlists_by_slug = defaultdict(lambda: {
        "company_name": "",
        "slug": "",
        "all_candidates": [],
        "candidates_by_roll": {}
    })

    interview_posts_processed = 0

    for p in posts:
        title = p.get("title", "")
        text = p.get("content_text", "")
        html = p.get("content_html", "")
        date = p.get("date", "2025-26 Season")

        if not is_strict_interview_shortlist(title, text):
            continue

        # Extract Recruiter Name
        comp_raw = title.split("|")[0].strip() if "|" in title else title
        comp_raw = re.sub(r"\s*–\s*.*$", "", comp_raw).strip()
        norm_name, _ = normalize_recruiter_name(comp_raw)
        slug = resolve_canonical_slug(norm_name, canonical_map)
        if slug in RECRUITER_SLUG_OVERRIDES:
            slug = RECRUITER_SLUG_OVERRIDES[slug]

        if not slug or slug not in company_name_by_slug:
            cn = clean_co_name(comp_raw)
            if cn in clean_map:
                slug = clean_map[cn]
            elif not slug:
                slug = re.sub(r"[^a-z0-9]+", "-", norm_name.lower()).strip("-")

        if slug in RECRUITER_SLUG_OVERRIDES:
            slug = RECRUITER_SLUG_OVERRIDES[slug]

        official_name = company_name_by_slug.get(slug, comp_raw)
        shortlists_by_slug[slug]["company_name"] = official_name
        shortlists_by_slug[slug]["slug"] = slug

        # Determine Interview Round Name
        round_name = "Interview Call"
        if re.search(r"round\s*2", title + " " + text, re.IGNORECASE):
            round_name = "Round 2 Interview"
        elif re.search(r"round\s*1", title + " " + text, re.IGNORECASE):
            round_name = "Round 1 Interview"
        elif re.search(r"extended", title + " " + text, re.IGNORECASE):
            round_name = "Extended Shortlist"
        elif re.search(r"walkin|walk-in", title + " " + text, re.IGNORECASE):
            round_name = "Walk-in Shortlist"

        # Split into Role Sections
        role_sections = split_into_role_sections(title, text, html)
        post_has_candidates = False

        for role_name, chunk_text, chunk_html in role_sections:
            pairs = extract_candidate_pairs(chunk_html, chunk_text)
            if not pairs:
                continue

            post_has_candidates = True
            for roll, name in pairs:
                # Decode roll number
                decoded = decode_roll(roll) or {
                    "department": "Other Engineering",
                    "degree": "B.Tech",
                    "cluster": "Other",
                    "batch_year": "2022"
                }

                cand_record = {
                    "name": name,
                    "roll_number": roll,
                    "branch": decoded["department"],
                    "degree": decoded["degree"],
                    "cluster": decoded["cluster"],
                    "role": role_name,
                    "round": round_name,
                    "date": date
                }

                # Deduplicate by roll number per company
                existing = shortlists_by_slug[slug]["candidates_by_roll"].get(roll)
                if not existing or (round_name == "Round 2 Interview" and existing.get("round") != "Round 2 Interview"):
                    shortlists_by_slug[slug]["candidates_by_roll"][roll] = cand_record

        if post_has_candidates:
            interview_posts_processed += 1

    # Format structured output with branch-wise grouping
    output_data: Dict[str, Any] = {}
    total_candidates_count = 0

    for slug, c_data in shortlists_by_slug.items():
        candidates = list(c_data["candidates_by_roll"].values())
        if not candidates:
            continue

        # Group by branch
        branch_groups_map = defaultdict(list)
        degrees_map = defaultdict(int)
        roles_map = defaultdict(int)

        for cand in candidates:
            branch_groups_map[cand["branch"]].append(cand)
            degrees_map[cand["degree"]] += 1
            roles_map[cand["role"]] += 1

        # Sort branches by count descending
        sorted_branches = []
        for branch_name, b_cands in sorted(branch_groups_map.items(), key=lambda x: len(x[1]), reverse=True):
            # Sort candidates alphabetically by name
            b_cands.sort(key=lambda x: x["name"].lower())
            sorted_branches.append({
                "branch": branch_name,
                "count": len(b_cands),
                "candidates": b_cands
            })

        # Sort all candidates strictly in alphabetical order by candidate name (A -> Z)
        candidates.sort(key=lambda x: x["name"].lower())

        output_data[slug] = {
            "company_name": c_data["company_name"],
            "slug": slug,
            "total_shortlisted": len(candidates),
            "branches": sorted_branches,
            "degrees_breakdown": dict(degrees_map),
            "roles_breakdown": dict(roles_map),
            "all_candidates": candidates
        }
        total_candidates_count += len(candidates)

    print(f"✓ Processed {interview_posts_processed} authentic interview shortlist announcements.")
    print(f"✓ Extracted {total_candidates_count:,} shortlisted candidate records across {len(output_data)} companies.")

    # Save standalone placement_interview_shortlists.json
    os.makedirs(os.path.dirname(OUTPUT_SHORTLISTS_PATH), exist_ok=True)
    with open(OUTPUT_SHORTLISTS_PATH, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)
    print(f"✓ Saved interview shortlist records to: {OUTPUT_SHORTLISTS_PATH}")

    # Merge directly into placement_intelligence.json
    merged_intel_count = 0
    clean_output_map = {clean_co_name(v.get("company_name", "")): v for v in output_data.values()}
    clean_slug_output_map = {re.sub(r'[^a-z0-9]', '', k): v for k, v in output_data.items()}

    for comp in companies_data:
        c_slug = comp.get("slug")
        matched_shortlist = None
        if c_slug in output_data:
            matched_shortlist = output_data[c_slug]
        elif c_slug in RECRUITER_SLUG_OVERRIDES and RECRUITER_SLUG_OVERRIDES[c_slug] in output_data:
            matched_shortlist = output_data[RECRUITER_SLUG_OVERRIDES[c_slug]]
        else:
            for orig, ovr in RECRUITER_SLUG_OVERRIDES.items():
                if ovr == c_slug and orig in output_data:
                    matched_shortlist = output_data[orig]
                    break
        if not matched_shortlist:
            clean_sl = re.sub(r'[^a-z0-9]', '', c_slug)
            if clean_sl in clean_slug_output_map:
                matched_shortlist = clean_slug_output_map[clean_sl]
            else:
                cn = clean_co_name(comp.get("name", ""))
                if len(cn) > 3 and cn in clean_output_map:
                    matched_shortlist = clean_output_map[cn]

        if matched_shortlist:
            comp["interview_shortlists"] = matched_shortlist
            merged_intel_count += 1
        else:
            comp["interview_shortlists"] = None

    intel_data["companies"] = companies_data
    with open(INTEL_PATH, "w", encoding="utf-8") as f:
        json.dump(intel_data, f, indent=2)
    print(f"✓ Merged interview shortlists into {merged_intel_count} companies in {os.path.basename(INTEL_PATH)}!")

    print("==================================================================")
    print("🎉 Interview Shortlist Extraction Pipeline Finished Successfully!")
    print("==================================================================")


if __name__ == "__main__":
    run_interview_shortlist_extraction()
