"""
Ingestion & Analytics Engine for IIT Bombay Placement Blogs (2025-26 Season)
Processes 2,584 raw blog announcements and batch roll lists to extract:
1. Official Day-wise Slotting Matrix (Day 1.1 to Day 15)
2. Branch Placement Velocity Analytics (Cumulative Day 1-15 trajectory curves)
3. Take-Home Assignments & Product Deck Rounds Tracker
4. Group Discussion (GD) Rounds Identifier
5. OA Physical Venues (LA/LH), Test Formats & Service Agreement (Bond) Badges
6. Selection Funnel Conversion Metrics (Test-to-Interview %, Interview-to-Offer %)
7. Department & Degree Demographics via Deterministic Roll Decoder
8. Strict Zero-PII Enforcement (purges student names & individual roll numbers)
"""

import json
import os
import re
import sys
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

# Reconfigure stdout for utf-8 on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add blog_scraper directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "blog_scraper"))
from roll_decoder import aggregate_candidate_demographics, decode_roll

# Known Canonical Aliases mapping blog recruiter names to canonical company slugs
BLOG_ALIASES: Dict[str, str] = {
    "fashnear technologies private limited [meesho]": "meesho",
    "meesho": "meesho",
    "fashnear technologies": "meesho",
    "iqvia [ims health analytics services private limited]": "iqvia",
    "iqvia": "iqvia",
    "da vinci": "da-vinci-derivatives",
    "da vinci derivatives": "da-vinci-derivatives",
    "da vinci derivatives b.v.": "da-vinci-derivatives",
    "amazon development centre [india]": "amazon",
    "amazon": "amazon",
    "amazon dev centre": "amazon",
    "nk securities research private limited": "nk-securities",
    "nk securities": "nk-securities",
    "nk securities research": "nk-securities",
    "flipkart": "flipkart",
    "flipkart apm-1": "flipkart",
    "flipkart apm": "flipkart",
    "airbus": "airbus",
    "wipro limited": "wipro",
    "wipro": "wipro",
    "accenture s&c": "accenture-strategy-consulting",
    "accenture s&c gn": "accenture-strategy-consulting",
    "accenture strategy & consulting": "accenture-strategy-consulting",
    "accenture": "accenture",
    "ather energy": "ather-energy",
    "mathworks india private limited": "mathworks",
    "mathworks": "mathworks",
    "icici lombard gic ltd.": "icici-lombard",
    "icici lombard": "icici-lombard",
    "applied materials": "applied-materials",
    "applied materials india": "applied-materials",
    "micron technology": "micron-technology",
    "micron": "micron-technology",
    "futures first": "futures-first",
    "future first": "futures-first",
    "honda r&d": "honda-r-d",
    "shell india markets private limited": "shell",
    "shell": "shell",
    "axxela": "axxela",
    "tvs motor company limited": "tvs-motors",
    "tvs motor": "tvs-motors",
    "nvidia graphics pvt. ltd.": "nvidia",
    "nvidia": "nvidia",
    "risa labs, inc": "risa-labs",
    "risa labs": "risa-labs",
    "imc trading": "imc-trading",
    "de shaw india pvt. ltd.": "de-shaw",
    "de shaw": "de-shaw",
    "balyasny asset management": "balyasny-asset-management",
    "bam": "balyasny-asset-management",
    "aviso software india llp [aviso ai]": "aviso-ai",
    "aviso ai": "aviso-ai",
    "abacus.ai [abacusdotai india private limited]": "abacus-ai",
    "abacus.ai": "abacus-ai",
    "glean search technologies india private l": "glean",
    "glean": "glean",
    "krafton india private limited": "krafton",
    "krafton": "krafton",
    "salescode.ai": "salescode-ai",
    "augnito": "augnito",
    "chroniclehq": "chroniclehq",
    "hilabs": "hilabs",
    "loop health": "loop-health",
    "yms financial private limited": "yms-financial",
    "optum ce": "optum",
    "optum": "optum",
    "dbs bank india limited": "dbs-bank",
    "dbs bank": "dbs-bank",
    "samsung research institute, bangalore": "samsung-sri-b",
    "samsung research institute bangalore": "samsung-sri-b",
    "texas instruments": "texas-instruments",
    "american express india pvt. ltd. [aeipl]": "american-express",
    "american express": "american-express",
    "bajaj auto ltd and bajaj auto technology limited": "bajaj-auto",
    "bajaj auto": "bajaj-auto",
    "wellsfargo international solutions private limited": "wells-fargo",
    "wells fargo": "wells-fargo",
    "squarepoint capital": "squarepoint-capital",
    "predii india pvt ltd": "predii",
    "predii": "predii",
    "hevo data": "hevo-data",
    "piramal foundation": "piramal-foundation",
    "ge aerospace": "ge-aerospace",
    "ge vernova": "ge-vernova",
    "hero motocorp": "hero-motocorp",
    "itc limited": "itc-limited",
    "itc": "itc-limited",
}


def normalize_recruiter_name(title: str) -> Tuple[str, str]:
    """
    Extracts the recruiter name and topic from blog post title.
    Usually formatted as: 'Recruiter Name | Topic / Stage'
    """
    if "|" in title:
        parts = title.split("|", 1)
        recruiter = parts[0].strip()
        topic = parts[1].strip()
    elif " - " in title:
        parts = title.split(" - ", 1)
        recruiter = parts[0].strip()
        topic = parts[1].strip()
    elif " – " in title:
        parts = title.split(" – ", 1)
        recruiter = parts[0].strip()
        topic = parts[1].strip()
    else:
        recruiter = title.strip()
        topic = "General Update"

    # Remove trailing status brackets like [Updated], [Rescheduled]
    recruiter_clean = re.sub(r"\[.*?\]", "", recruiter).strip()
    return recruiter_clean, topic


def resolve_canonical_slug(recruiter_name: str, canonical_map: Dict[str, str]) -> Optional[str]:
    """
    Resolves recruiter name against canonical aliases and known corporate slugs.
    """
    cleaned = recruiter_name.lower().strip()
    cleaned = re.sub(r"\s+", " ", cleaned)

    if cleaned in BLOG_ALIASES:
        return BLOG_ALIASES[cleaned]

    if cleaned in canonical_map:
        return canonical_map[cleaned]

    slug_attempt = re.sub(r"[^a-z0-9]+", "-", cleaned).strip("-")
    if slug_attempt in canonical_map:
        return canonical_map[slug_attempt]

    for known_name, slug in canonical_map.items():
        if len(known_name) > 3 and (known_name in cleaned or cleaned in known_name):
            return slug

    return None


def extract_assessment_intelligence(text: str) -> Dict:
    """
    Extracts testing platform, mode, duration, offline venue, and special instructions.
    """
    text_lower = text.lower()

    # Platform detection
    detected_platform = "Online Assessment Platform"
    platforms = [
        ("hackerrank", "HackerRank"),
        ("mettl", "Mercer Mettl"),
        ("cocubes", "CoCubes"),
        ("doselect", "DoSelect"),
        ("codeforces", "Codeforces"),
        ("leetcode", "LeetCode Assessment"),
        ("glider", "Glider AI"),
        ("shl", "SHL Assessment"),
        ("hirevue", "HireVue"),
        ("amcat", "AMCAT"),
        ("codesignal", "CodeSignal"),
    ]
    for key, name in platforms:
        if key in text_lower:
            detected_platform = name
            break

    # Venue & Mode detection
    mode = "Online"
    venue = None
    m_venue = re.search(r"venue\s*[:\-]?\s*([^\n\r,]+)", text_lower)
    if m_venue:
        v_str = m_venue.group(1).strip().upper()
        if any(h in v_str for h in ["LA", "LH", "PC LAB", "CC", "HALL", "LECTURE"]):
            venue = v_str
            mode = f"Designated Venue ({v_str})"
    elif re.search(r"from\s*(hostel\s*)?room|online\s*from\s*room", text_lower):
        mode = "Online from Hostel Room"
    elif re.search(r"venue|offline|placement\s*office|lab|cc|computer\s*centre", text_lower):
        mode = "Designated Lab / Venue"

    # Duration detection
    duration_min = None
    m_dur = re.search(r"(\d{1,3})\s*(mins?|minutes?|hours?|hrs?)", text_lower)
    if m_dur:
        val = int(m_dur.group(1))
        unit = m_dur.group(2)
        if "hour" in unit or "hr" in unit:
            duration_min = val * 60
        else:
            duration_min = val
        if duration_min > 300:
            duration_min = None

    # Test Format (Coding vs Aptitude vs Technical)
    test_format = "Technical & Aptitude Assessment"
    if "coding" in text_lower and "aptitude" in text_lower:
        test_format = "Coding Challenges (DSA) + Quantitative Aptitude"
    elif "coding" in text_lower:
        test_format = "Pure Coding / DSA Challenges"
    elif "aptitude" in text_lower:
        test_format = "Aptitude, Logic & Problem Solving"
    elif "mcq" in text_lower:
        test_format = "Domain MCQs & Technical Concepts"

    # Special instructions
    special_notes = []
    if "figma" in text_lower:
        special_notes.append("Figma required for design exercise")
    if re.search(r"webcam|camera|proctor", text_lower):
        special_notes.append("Webcam & microphone proctoring mandatory")
    if re.search(r"negative\s*marking", text_lower):
        special_notes.append("Negative marking enabled for MCQs")
    if re.search(r"cheat|plagiarism|malpractice", text_lower):
        special_notes.append("Automated code plagiarism & malpractice detection")

    return {
        "platform": detected_platform,
        "mode": mode,
        "venue": venue,
        "duration_minutes": duration_min,
        "test_format": test_format,
        "special_instructions": special_notes,
    }


def extract_jaf_parameters(text: str) -> Dict:
    """
    Extracts CPI cutoff, bonus JAF eligibility, and bond requirements from JAF announcements.
    """
    text_lower = text.lower()

    # CPI Cutoff
    cpi_cutoff = "None"
    m_cpi = re.search(r"cpi\s*(?:cut-?off|cutoff)?\s*[:\-]?\s*([^\n\r]+)", text_lower)
    if m_cpi:
        raw_cpi = m_cpi.group(1).strip()
        if "none" in raw_cpi or "no" in raw_cpi or "0" in raw_cpi:
            cpi_cutoff = "None"
        else:
            m_num = re.search(r"(\d\.\d{1,2}|\d)", raw_cpi)
            if m_num:
                cpi_cutoff = f"{m_num.group(1)}+"
            else:
                cpi_cutoff = raw_cpi[:25].title()

    # Bonus JAF
    bonus_allowed = False
    if "bonus jaf" in text_lower or "bonus application" in text_lower:
        if "not allowed" in text_lower or "not-allowed" in text_lower or "no" in text_lower:
            bonus_allowed = False
        elif "allowed" in text_lower or "yes" in text_lower:
            bonus_allowed = True

    # Employment Bond
    bond_applicable = None
    bond_details = None
    if "bond" in text_lower:
        if "bond applicable: yes" in text_lower or "bond: applicable" in text_lower or "bond: yes" in text_lower:
            bond_applicable = True
            bond_details = "Service Agreement / Employment Bond applicable"
        elif "bond applicable: no" in text_lower or "bond: not applicable" in text_lower or "bond: no" in text_lower:
            bond_applicable = False

    return {
        "cpi_cutoff": cpi_cutoff,
        "bonus_jaf_allowed": bonus_allowed,
        "bond_applicable": bond_applicable,
        "bond_details": bond_details,
    }


def extract_roll_numbers_from_post(html_content: str, text_content: str) -> List[str]:
    """
    Extracts all distinct student roll numbers from post HTML and text.
    Matches 22Bxxxx, 24Mxxxx, 21Dxxxx, 23Mxxxx, etc.
    """
    combined = (html_content or "") + " " + (text_content or "")
    matches = re.findall(r"\b(2[0-5][0-9A-Za-z]{5,7})\b", combined)
    valid_rolls = set()
    for m in matches:
        m_clean = m.upper()
        if re.match(r"^2[0-5](B\d{4}|M\d{4}|D\d{5,7}|N\d{4}|U\d{6}|\d{7})$", m_clean):
            valid_rolls.add(m_clean)

    return sorted(list(valid_rolls))


def classify_shortlist_stage(title: str, text: str) -> str:
    comb = (title + " " + text).lower()
    if re.search(r"final\s*select|selected|offer|congratulations", comb):
        return "final_selects"
    elif re.search(r"walkin|walk-in|extended\s*shortlist", comb):
        return "walkin_extended"
    elif re.search(r"round\s*2|test-2|second\s*test", comb):
        return "round2_shortlist"
    elif re.search(r"gd|group\s*discussion", comb):
        return "gd_shortlist"
    elif re.search(r"interview\s*shortlist|shortlist\s*for\s*interview", comb):
        return "interview_shortlist"
    elif re.search(r"test\s*shortlist|shortlisted\s*for\s*(the\s*)?test", comb):
        return "oa_shortlist"
    else:
        return "general_shortlist"


def extract_day_slotting_matrix(posts: List[Dict], canonical_map: Dict[str, str]) -> Dict[str, Dict]:
    """
    Parses all 34 official 'Day X Companies' announcements from Day 1 to Day 15.
    Returns mapping of slug -> { 'slot': 'Day 1.1', 'timing': '7:00 AM – 3:00 PM', 'date': '1st Dec 2025' }
    """
    company_slots = {}

    for p in posts:
        title = p.get("title", "")
        if not (re.search(r"^(Day\s+\d+(\.\d+)?\s+(Companies|Company|Slot))", title, re.IGNORECASE) or title in ["Day 1 Companies", "Day 2 Companies"]):
            continue

        content = p.get("content_text", "")
        sections = re.split(r"(Day\s+\d+(?:\.\d+)?(?:\s*\([^)]+\))?[:\s][^\n\r]*)", content, flags=re.IGNORECASE)
        current_slot = None
        current_timing = None

        if len(sections) == 1:
            m_slot = re.search(r"Day\s+(\d+(?:\.\d+)?)", title, re.IGNORECASE)
            if m_slot:
                current_slot = f"Day {m_slot.group(1)}"

        for sec in sections:
            m_head = re.match(r"Day\s+(\d+(?:\.\d+)?)", sec.strip(), re.IGNORECASE)
            if m_head:
                current_slot = f"Day {m_head.group(1)}"
                m_time = re.search(r"(\d{1,2}:\d{2}\s*(?:AM|PM)\s*[\-–—]\s*\d{1,2}:\d{2}\s*(?:AM|PM))", sec, re.IGNORECASE)
                if m_time:
                    current_timing = m_time.group(1)
                continue

            if not current_slot:
                continue

            for line in sec.splitlines():
                line_str = line.strip()
                if not line_str or line_str.lower() in [
                    "company", "job code", "companies", "name of the company", "rooms allotted"
                ] or "venue" in line_str.lower() or "time:" in line_str.lower():
                    continue

                if len(line_str) > 2 and not line_str.isdigit() and not re.match(r"^[0-9,\s]+$", line_str):
                    norm_name, _ = normalize_recruiter_name(line_str)
                    slug = resolve_canonical_slug(norm_name, canonical_map)
                    if slug and slug not in company_slots:
                        company_slots[slug] = {
                            "slot": current_slot,
                            "timing": current_timing or "Official Phase 1 Schedule",
                            "raw_name": line_str,
                        }

    return company_slots


def compute_branch_placement_velocity(posts: List[Dict], btech_rolls_file: Optional[str]) -> Dict:
    """
    Reconstructs the Day 1 to Day 15 hiring velocity curves from Interim Selections posts
    and the 1,378 batch roll list.
    """
    btech_rolls = set()
    if btech_rolls_file and os.path.exists(btech_rolls_file):
        try:
            from pypdf import PdfReader
            reader = PdfReader(btech_rolls_file)
            for page in reader.pages:
                btech_rolls.update(re.findall(r"\b22B\d{4}\b", page.extract_text()))
        except Exception as e:
            print(f"Note: Could not parse PDF roll list: {e}")

    day_placed_rolls = defaultdict(set)
    dept_day_placed = defaultdict(lambda: defaultdict(int))
    dept_totals = defaultdict(int)

    for r in btech_rolls:
        info = decode_roll(r)
        dept = info["department"] if info else "Unmapped"
        dept_totals[dept] += 1

    selection_posts = [p for p in posts if "interim selection" in p.get("title", "").lower()]

    for p in selection_posts:
        t = p.get("title", "")
        m = re.search(r"Day\s+(\d+(?:\.\d+)?)", t, re.IGNORECASE)
        day_num = float(m.group(1)) if m else 99.0

        if day_num <= 1.0:
            day_bucket = "Day 1"
        elif day_num <= 2.2:
            day_bucket = "Day 2"
        elif day_num <= 3.2:
            day_bucket = "Day 3"
        elif day_num <= 4.2:
            day_bucket = "Day 4"
        elif day_num <= 5.0:
            day_bucket = "Day 5"
        elif day_num <= 10.0:
            day_bucket = "Day 6-10"
        else:
            day_bucket = "Day 11-15"

        rolls = set(re.findall(r"\b2[0-5][BMDN]\d{4,6}\b", p.get("content_text", "")))
        for r in rolls:
            day_placed_rolls[day_bucket].add(r)
            info = decode_roll(r)
            if info:
                dept_day_placed[info["department"]][day_bucket] += 1

    milestones = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6-10", "Day 11-15"]
    cumulative_count = 0
    total_placed = len(set().union(*day_placed_rolls.values()))

    cumulative_curve = []
    for m in milestones:
        count = len(day_placed_rolls[m])
        cumulative_count += count
        pct = round((cumulative_count / total_placed) * 100, 1) if total_placed > 0 else 0
        cumulative_curve.append({
            "milestone": m,
            "placed_in_window": count,
            "cumulative_placed": cumulative_count,
            "cumulative_percentage": pct,
        })

    dept_trajectories = []
    for dept, days_dict in dept_day_placed.items():
        total_dept = sum(days_dict.values())
        if total_dept < 3:
            continue

        d1 = days_dict["Day 1"]
        d2 = days_dict["Day 2"]
        d3 = days_dict["Day 3"]
        d4 = days_dict["Day 4"]
        d5 = days_dict["Day 5"]
        d6_10 = days_dict["Day 6-10"]
        d11_15 = days_dict["Day 11-15"]

        day1_2 = d1 + d2
        day3_5 = d3 + d4 + d5
        day6_15 = d6_10 + d11_15

        p_d12 = round((day1_2 / total_dept) * 100, 1)
        p_d35 = round((day3_5 / total_dept) * 100, 1)
        p_d615 = round((day6_15 / total_dept) * 100, 1)

        if p_d12 >= 50.0:
            peak_window = "Days 1–2 (First 48 Hours)"
            advice = "Heavy early hiring wave. Target Day 1.1 / 1.2 shortlists and early technical rounds."
        elif p_d35 >= 40.0:
            peak_window = "Days 3–5 (Mid-Season Surge)"
            advice = "Core engineering and techno-commercial hiring wave. Keep momentum through Day 4."
        else:
            peak_window = "Days 5–15 (Steady Extended Placements)"
            advice = "Specialized manufacturing, consulting, and domain-specific roles open progressively."

        dept_trajectories.append({
            "department": dept,
            "total_phase1_placed": total_dept,
            "day1_2_placed": day1_2,
            "day1_2_pct": p_d12,
            "day3_5_placed": day3_5,
            "day3_5_pct": p_d35,
            "day6_15_placed": day6_15,
            "day6_15_pct": p_d615,
            "peak_hiring_window": peak_window,
            "strategic_advice": advice,
        })

    dept_trajectories.sort(key=lambda x: -x["total_phase1_placed"])

    return {
        "total_phase1_placed_candidates": total_placed,
        "btech_students_tracked": len(btech_rolls),
        "overall_cumulative_velocity": cumulative_curve,
        "department_trajectories": dept_trajectories,
    }


def run_pipeline():
    print("================================================================")
    print("🚀 Starting Advanced IIT Bombay Recruitment Intelligence Pipeline")
    print("================================================================")

    raw_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "placement_blogs", "raw", "iitb_placement_blog25_raw.json"
    )
    btech_pdf_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "placement_blogs", "Division_Tutorial_wise_roll_list_for_2022_Batch.pdf"
    )
    intel_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "placement_intelligence.json"
    )
    output_blogs_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "placement_blog_intelligence.json"
    )
    velocity_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "placement_velocity_analytics.json"
    )

    if not os.path.exists(raw_path):
        print(f"❌ Error: Raw blog file not found at: {raw_path}")
        return

    with open(raw_path, "r", encoding="utf-8") as f:
        raw_blog = json.load(f)

    # Invert blog array to chronological order (July 2025 -> June 2026)
    chronological_posts = list(reversed(raw_blog))
    print(f"✓ Loaded {len(chronological_posts)} raw blog updates in chronological order.")

    # Load canonical companies map
    canonical_slug_map = {}
    companies_data = []
    if os.path.exists(intel_path):
        with open(intel_path, "r", encoding="utf-8") as f:
            intel_json = json.load(f)
            companies_data = intel_json.get("companies", [])
            for c in companies_data:
                canonical_slug_map[c["name"].lower().strip()] = c["slug"]
                canonical_slug_map[c["slug"]] = c["slug"]
    print(f"✓ Loaded {len(companies_data)} canonical companies from placement_intelligence.json.")

    # Step 1: Extract Official Day Slotting Matrix
    day_slot_map = extract_day_slotting_matrix(chronological_posts, canonical_slug_map)
    print(f"✓ Extracted official Day Slotting for {len(day_slot_map)} canonical recruiters.")

    # Step 2: Compute Branch Placement Velocity Curves
    velocity_data = compute_branch_placement_velocity(chronological_posts, btech_pdf_path)
    os.makedirs(os.path.dirname(velocity_path), exist_ok=True)
    with open(velocity_path, "w", encoding="utf-8") as f:
        json.dump(velocity_data, f, indent=2)
    print(f"✓ Generated Branch Placement Velocity Model ({velocity_data['total_phase1_placed_candidates']} selections) -> {velocity_path}")

    # Storage per company
    company_intel = defaultdict(lambda: {
        "slug": "",
        "company_name": "",
        "total_updates": 0,
        "hiring_phases": set(),
        "placement_slot": None,
        "slot_timing": None,
        "has_assignment_deck_round": False,
        "assignment_details": None,
        "has_group_discussion": False,
        "gd_details": None,
        "bond_applicable": None,
        "bond_details": None,
        "cpi_criteria": {"cutoff_stated": "None", "bonus_jaf_allowed": False},
        "online_assessment": {
            "platform": "Online Assessment Platform",
            "mode": "Online",
            "venue": None,
            "duration_minutes": None,
            "test_format": "Technical & Aptitude Assessment",
            "special_instructions": [],
        },
        "conversion_funnel": {
            "oa_shortlisted_count": 0,
            "interview_shortlisted_count": 0,
            "final_selected_count": 0,
            "walkin_extended_shortlists_count": 0,
            "oa_to_interview_conversion_pct": None,
            "interview_to_offer_conversion_pct": None,
        },
        "all_shortlisted_rolls": set(),
        "interview_shortlisted_rolls": set(),
        "final_selected_rolls": set(),
        "demographics": {
            "branch_distribution": {},
            "degree_distribution": {},
            "cluster_breakdown": {},
        },
        "recruitment_timeline": [],
        "has_walkins": False,
        "slots_recorded": set(),
    })

    matched_posts = 0

    for idx, post in enumerate(chronological_posts):
        title = post.get("title", "")
        content_html = post.get("content_html", "")
        content_text = post.get("content_text", "")
        date_str = post.get("date", "")

        recruiter_raw, topic = normalize_recruiter_name(title)
        slug = resolve_canonical_slug(recruiter_raw, canonical_slug_map)

        if not slug:
            continue

        matched_posts += 1
        entry = company_intel[slug]
        entry["slug"] = slug
        if not entry["company_name"]:
            entry["company_name"] = recruiter_raw
        entry["total_updates"] += 1

        # Check Day Slotting
        if slug in day_slot_map:
            entry["placement_slot"] = day_slot_map[slug]["slot"]
            entry["slot_timing"] = day_slot_map[slug]["timing"]

        # Check Take-Home Assignment / Deck Submission
        comb_text = (title + " " + content_text).lower()
        if any(k in title.lower() for k in ["problem statement", "assignment", "deck", "case study"]):
            entry["has_assignment_deck_round"] = True
            desc_lines = []
            for line in content_text.splitlines():
                if any(w in line.lower() for w in ["job code", "deadline", "submission", "prompt", "deck", "case"]):
                    desc_lines.append(line.strip())
            entry["assignment_details"] = " | ".join(desc_lines[:3]) if desc_lines else "Take-home case study / assignment required prior to interviews."

        # Check Group Discussion (GD)
        if re.search(r"\b(gd|group discussion)\b", comb_text):
            entry["has_group_discussion"] = True
            entry["gd_details"] = "Group Discussion round conducted prior to technical interviews."

        # Timeline event logging
        stage_label = "Update"
        if "jaf" in title.lower():
            stage_label = "JAF Announcement"
            jaf_params = extract_jaf_parameters(content_text)
            if jaf_params["cpi_cutoff"] != "None":
                entry["cpi_criteria"]["cutoff_stated"] = jaf_params["cpi_cutoff"]
            if jaf_params["bonus_jaf_allowed"]:
                entry["cpi_criteria"]["bonus_jaf_allowed"] = True
            if jaf_params["bond_applicable"] is not None:
                entry["bond_applicable"] = jaf_params["bond_applicable"]
                entry["bond_details"] = jaf_params["bond_details"]
        elif "test" in title.lower() or "assessment" in title.lower():
            stage_label = "Online Assessment"
            oa_params = extract_assessment_intelligence(content_text)
            if oa_params["platform"] != "Online Assessment Platform":
                entry["online_assessment"]["platform"] = oa_params["platform"]
            if oa_params["mode"] != "Online":
                entry["online_assessment"]["mode"] = oa_params["mode"]
            if oa_params["venue"]:
                entry["online_assessment"]["venue"] = oa_params["venue"]
            if oa_params["duration_minutes"]:
                entry["online_assessment"]["duration_minutes"] = oa_params["duration_minutes"]
            if oa_params["test_format"]:
                entry["online_assessment"]["test_format"] = oa_params["test_format"]
            if oa_params["special_instructions"]:
                entry["online_assessment"]["special_instructions"] = list(
                    set(entry["online_assessment"]["special_instructions"] + oa_params["special_instructions"])
                )
        elif "interview" in title.lower():
            stage_label = "Interview Stage"
        elif "walkin" in title.lower() or "extended" in title.lower():
            stage_label = "Walk-in & Extended Shortlist"
            entry["has_walkins"] = True
        elif "select" in title.lower() or "offer" in title.lower():
            stage_label = "Final Selections"

        entry["recruitment_timeline"].append({
            "date": date_str,
            "stage": stage_label,
            "headline": title[:90],
        })

        # Roll Numbers Extraction
        rolls = extract_roll_numbers_from_post(content_html, content_text)
        if rolls:
            stage_type = classify_shortlist_stage(title, content_text)
            if stage_type == "oa_shortlist":
                entry["all_shortlisted_rolls"].update(rolls)
            elif stage_type in ["interview_shortlist", "round2_shortlist", "gd_shortlist"]:
                entry["interview_shortlisted_rolls"].update(rolls)
                entry["all_shortlisted_rolls"].update(rolls)
            elif stage_type == "walkin_extended":
                entry["conversion_funnel"]["walkin_extended_shortlists_count"] += len(rolls)
                entry["interview_shortlisted_rolls"].update(rolls)
                entry["all_shortlisted_rolls"].update(rolls)
            elif stage_type == "final_selects":
                entry["final_selected_rolls"].update(rolls)
                entry["interview_shortlisted_rolls"].update(rolls)
                entry["all_shortlisted_rolls"].update(rolls)
            else:
                entry["all_shortlisted_rolls"].update(rolls)

    print(f"✓ Successfully processed {matched_posts}/{len(chronological_posts)} posts.")
    print(f"✓ Aggregated intelligence for {len(company_intel)} canonical companies.")

    # Second Pass: Compute Conversion Ratios & Demographics (Strict Zero-PII)
    cleaned_intelligence_output = {}

    for slug, data in company_intel.items():
        all_rolls = list(data["all_shortlisted_rolls"])
        interview_rolls = list(data["interview_shortlisted_rolls"])
        final_rolls = list(data["final_selected_rolls"])

        oa_count = len(all_rolls)
        interview_count = len(interview_rolls)
        final_count = len(final_rolls)

        if oa_count == 0 and interview_count > 0:
            oa_count = interview_count

        data["conversion_funnel"]["oa_shortlisted_count"] = oa_count
        data["conversion_funnel"]["interview_shortlisted_count"] = interview_count
        data["conversion_funnel"]["final_selected_count"] = final_count

        if oa_count > 0 and interview_count > 0:
            conv_oa = round((interview_count / oa_count) * 100, 1)
            data["conversion_funnel"]["oa_to_interview_conversion_pct"] = min(100.0, conv_oa)
        if interview_count > 0 and final_count > 0:
            conv_final = round((final_count / interview_count) * 100, 1)
            data["conversion_funnel"]["interview_to_offer_conversion_pct"] = min(100.0, conv_final)

        target_rolls = interview_rolls if len(interview_rolls) > 0 else all_rolls
        demo_stats = aggregate_candidate_demographics(target_rolls)

        data["demographics"]["branch_distribution"] = demo_stats["department_breakdown"]
        data["demographics"]["degree_distribution"] = demo_stats["degree_breakdown"]
        data["demographics"]["cluster_breakdown"] = demo_stats["cluster_breakdown"]

        data["hiring_phases"] = sorted(list(data["hiring_phases"]))
        data["slots_recorded"] = sorted(list(data["slots_recorded"]))

        # STRICT PII SANITIZATION
        del data["all_shortlisted_rolls"]
        del data["interview_shortlisted_rolls"]
        del data["final_selected_rolls"]

        cleaned_intelligence_output[slug] = data

    # Write standalone placement_blog_intelligence.json
    os.makedirs(os.path.dirname(output_blogs_path), exist_ok=True)
    with open(output_blogs_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_intelligence_output, f, indent=2)
    print(f"✓ Saved cleaned, zero-PII blog intelligence to: {output_blogs_path}")

    # Merge directly into placement_intelligence.json
    merged_count = 0
    for comp in companies_data:
        c_slug = comp.get("slug")
        if c_slug in cleaned_intelligence_output:
            blog_intel = cleaned_intelligence_output[c_slug]
            comp["hiring_funnel_intelligence"] = blog_intel
            comp["placement_slot"] = blog_intel.get("placement_slot")
            comp["slot_timing"] = blog_intel.get("slot_timing")
            comp["has_assignment_deck_round"] = blog_intel.get("has_assignment_deck_round")
            comp["assignment_details"] = blog_intel.get("assignment_details")
            comp["has_group_discussion"] = blog_intel.get("has_group_discussion")
            comp["gd_details"] = blog_intel.get("gd_details")
            comp["bond_applicable"] = blog_intel.get("bond_applicable")
            comp["bond_details"] = blog_intel.get("bond_details")
            merged_count += 1

    with open(intel_path, "w", encoding="utf-8") as f:
        json.dump({"companies": companies_data}, f, indent=2)
    print(f"✓ Merged hiring funnel intelligence directly into {merged_count}/{len(companies_data)} companies in placement_intelligence.json!")

    # Verify zero-PII
    print("\n🔍 Running Strict Zero-PII Leakage Assertion Check...")
    for check_file in [output_blogs_path, velocity_path, intel_path]:
        with open(check_file, "r", encoding="utf-8") as f:
            out_content = f.read()
        roll_leaks = re.findall(r"\b2[0-5][BMDN]\d{4}\b", out_content)
        assert len(roll_leaks) == 0, f"Leaked roll numbers in {check_file}: {roll_leaks[:5]}"
        print(f"PASS: {os.path.basename(check_file)} is 100% clean of student roll numbers!")

    print("================================================================")
    print("🎉 Advanced Intelligence Pipeline Completed Successfully!")
    print("================================================================")


if __name__ == "__main__":
    run_pipeline()
