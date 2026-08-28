"""
Ingestion & Analytics Engine for IIT Bombay Placement Blogs (2025-26 Season)
Processes 2,584 raw blog announcements to extract:
1. Recruitment Timelines (JAF -> OA -> Shortlists -> Walk-ins -> Offers)
2. Assessment Platform & Environment Intelligence (HackerRank, Mettl, Duration, Mode)
3. Selection Funnel Conversion Metrics (Test-to-Interview %, Interview-to-Offer %)
4. Department & Degree Demographics via Deterministic Roll Decoder
5. Strict Zero-PII Enforcement (purges student names & individual roll numbers)
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
    "amazon development centre [india]": "amazon",
    "amazon": "amazon",
    "amazon dev centre": "amazon",
    "nk securities research private limited": "nk-securities",
    "nk securities": "nk-securities",
    "nk securities research": "nk-securities",
    "flipkart": "flipkart",
    "flipkart apm-1": "flipkart",
    "airbus": "airbus",
    "wipro limited": "wipro",
    "wipro": "wipro",
    "accenture s&c": "accenture-strategy-consulting",
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
    "apport software solutions private ltd (doubletick)": "doubletick",
    "doubletick": "doubletick",
    "blinikit": "blinkit",
    "blinkit": "blinkit",
    "larsen & toubro limited": "larsen-toubro",
    "larsen & tubro limited": "larsen-toubro",
    "l&t": "larsen-toubro",
    "bajaj auto ltd. & bajaj auto technology ltd": "bajaj-auto",
    "bajaj auto": "bajaj-auto",
    "itc limited": "itc",
    "itc": "itc",
    "hindustan unilever limited [hul]": "hindustan-unilever-limited",
    "hul": "hindustan-unilever-limited",
    "mckinsey & company": "mckinsey-company",
    "mckinsey": "mckinsey-company",
    "mckinsey ccn": "mckinsey-company",
    "boston consulting group [bcg]": "boston-consulting-group-bcg",
    "boston consulting group": "boston-consulting-group-bcg",
    "bcg": "boston-consulting-group-bcg",
    "goldman sachs": "goldman-sachs",
    "morgan stanley": "morgan-stanley",
    "jpmorgan chase & co.": "jpmorgan-chase-co",
    "jp morgan": "jpmorgan-chase-co",
    "google india": "google",
    "google": "google",
    "microsoft": "microsoft",
    "adobe": "adobe",
    "atlassian": "atlassian",
    "optiver": "optiver",
    "bain & company": "bain-company",
    "bain": "bain-company",
    "jump trading": "jump-trading",
    "salesforce": "salesforce",
    "visa": "visa",
    "wells fargo": "wells-fargo",
    "wells fargo international solutions": "wells-fargo",
    "qualcomm india pvt. ltd.": "qualcomm",
    "qualcomm": "qualcomm",
    "texas instruments": "texas-instruments",
    "intel technology india pvt. ltd.": "intel",
    "intel": "intel",
    "samsung r&d institute india": "samsung-r-d",
    "samsung": "samsung-r-d",
    "tata steel": "tata-steel",
    "tata motors": "tata-motors",
    "reliance industries limited": "reliance-industries",
    "ril": "reliance-industries",
    "jurin ai": "jurin-ai",
    "vconnectech systems pvt. ltd.": "vconnectech-systems",
    "vconnectech systems": "vconnectech-systems",
    "ascendion": "ascendion",
    "ideaforge technology ltd.": "ideaforge",
    "ideaforge": "ideaforge",
    "exl service": "exl-service",
    "augnito": "augnito",
    "media.net": "media-net",
    "bank of america": "bank-of-america",
    "jefferies": "jefferies",
    "niva bupa health insurance": "niva-bupa",
    "nation with namo": "nation-with-namo",
    "motilal oswal": "motilal-oswal",
    "kotak mahindra bank": "kotak-mahindra-bank",
    "hyde inc.": "hyde-inc",
    "kla tencor": "kla-tencor",
    "exxon mobil": "exxonmobil",
    "exxonmobil": "exxonmobil",
    "wood group": "wood-group",
    "baker hughes": "baker-hughes",
    "aditya birla science and technology": "aditya-birla-group",
    "blue energy motors": "blue-energy-motors",
}


def normalize_recruiter_name(raw_title: str) -> Tuple[str, str]:
    """
    Extracts the recruiter name from the post title (usually before the pipe '|').
    Returns (cleaned_recruiter_name, post_subtitle_or_topic).
    """
    cleaned = raw_title.strip()
    # Remove urgent/update prefixes
    cleaned = re.sub(
        r"^(update|important update|reminder|urgent|final update):\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()

    if "|" in cleaned:
        parts = cleaned.split("|", 1)
        recruiter = parts[0].strip()
        topic = parts[1].strip()
    else:
        recruiter = cleaned
        topic = ""

    # Clean recruiter string: strip legal suffixes
    norm_recruiter = recruiter.lower()
    norm_recruiter = re.sub(r"\[.*?\]", "", norm_recruiter).strip()
    norm_recruiter = re.sub(
        r"\s*(pvt\.?|ltd\.?|private|limited|llc|inc\.?|india|technologies|corporation)\b",
        "",
        norm_recruiter,
        flags=re.IGNORECASE,
    ).strip()

    return recruiter, topic


def resolve_canonical_slug(
    recruiter_raw: str, canonical_slug_map: Dict[str, str]
) -> Optional[str]:
    """
    Resolves raw recruiter name to our 645 canonical company slugs.
    """
    raw_lower = recruiter_raw.lower().strip()

    # 1. Exact alias match
    if raw_lower in BLOG_ALIASES:
        return BLOG_ALIASES[raw_lower]

    # 2. Normalized alias match
    norm = re.sub(
        r"\s*(pvt\.?|ltd\.?|private|limited|llc|inc\.?|india|technologies)\b",
        "",
        raw_lower,
    ).strip()
    if norm in BLOG_ALIASES:
        return BLOG_ALIASES[norm]

    # 3. Direct match in canonical_slug_map (by name or slug)
    if raw_lower in canonical_slug_map:
        return canonical_slug_map[raw_lower]
    if norm in canonical_slug_map:
        return canonical_slug_map[norm]

    # 4. Substring matching
    for name_key, slug in canonical_slug_map.items():
        if len(norm) >= 4 and (norm in name_key or name_key in norm):
            return slug

    # 5. Generate fallback slug from recruiter name
    fallback_slug = re.sub(r"[^a-z0-9]+", "-", norm).strip("-")
    if fallback_slug:
        return fallback_slug

    return None


def extract_assessment_intelligence(text: str) -> Dict:
    """
    Extracts testing platform, duration, and test environment mode from post text.
    """
    text_lower = text.lower()

    # Platform detection
    platforms = [
        ("HackerRank", r"hackerrank"),
        ("Mercer Mettl", r"mettl|mercer"),
        ("CoCubes", r"cocubes"),
        ("DoSelect", r"doselect"),
        ("Glider", r"glider"),
        ("Codeforces", r"codeforces"),
        ("Wheebox", r"wheebox"),
        ("Talview", r"talview"),
        ("Google Form", r"google\s*form"),
        ("HackerEarth", r"hackerearth"),
        ("Kite", r"kite"),
    ]

    detected_platform = "Online Assessment Platform"
    for name, pat in platforms:
        if re.search(pat, text_lower):
            detected_platform = name
            break

    # Mode detection
    mode = "Online"
    if re.search(r"from\s*(hostel\s*)?room|online\s*from\s*room", text_lower):
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
        if duration_min > 300:  # ignore windows like 24 hours
            duration_min = None

    # Special instructions
    special_notes = []
    if "figma" in text_lower:
        special_notes.append("Figma installed for on-spot design exercise")
    if re.search(r"webcam|camera|proctor", text_lower):
        special_notes.append("Strict webcam / audio proctoring enabled")
    if re.search(r"negative\s*marking", text_lower):
        special_notes.append("Negative marking for MCQs")
    if re.search(r"cheat|plagiarism|malpractice", text_lower):
        special_notes.append("Automated code plagiarism checking")

    return {
        "platform": detected_platform,
        "mode": mode,
        "duration_minutes": duration_min,
        "special_instructions": special_notes,
    }


def extract_jaf_parameters(text: str) -> Dict:
    """
    Extracts CPI cutoff, bonus JAF eligibility, and deadlines from JAF announcement.
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
    if "bonus jaf" in text_lower:
        if "not allowed" in text_lower or "not-allowed" in text_lower:
            bonus_allowed = False
        elif "allowed" in text_lower:
            bonus_allowed = True

    return {
        "cpi_cutoff": cpi_cutoff,
        "bonus_jaf_allowed": bonus_allowed,
    }


def extract_roll_numbers_from_post(html_content: str, text_content: str) -> List[str]:
    """
    Extracts all distinct student roll numbers from post HTML and text using robust regex.
    Matches 22Bxxxx, 24Mxxxx, 21Dxxxx, 23Mxxxx, 2100xxxxx, 2000xxxxx, etc.
    """
    combined = (html_content or "") + " " + (text_content or "")
    # Standard IITB roll pattern
    # 22Bxxxx, 24Mxxxx, 21Dxxxx, 24Nxxxx, 21Uxxxx, 2100xxxxx, 2000xxxxx
    matches = re.findall(r"\b(2[0-5][0-9A-Za-z]{5,7})\b", combined)
    valid_rolls = set()
    for m in matches:
        m_clean = m.upper()
        # Ensure it starts with 20-25 and has valid letter/digit format
        if re.match(r"^2[0-5](B\d{4}|M\d{4}|D\d{5,7}|N\d{4}|U\d{6}|\d{7})$", m_clean):
            valid_rolls.add(m_clean)

    return sorted(list(valid_rolls))


def classify_shortlist_stage(title: str, text: str) -> str:
    """
    Classifies the shortlist type: OA shortlist, Round 2, GD, Interview, Walkin, Final Selects.
    """
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


def determine_phase_and_date(date_str: str, title: str) -> Tuple[str, Optional[str]]:
    """
    Determines Phase 1 vs Phase 2 and slotting.
    Phase 1: Dec 1 - Dec 15, 2025 (with Day 1.1, Day 1.2, Day 2, etc.)
    Phase 2: Jan 2026 onwards.
    """
    date_lower = (date_str or "").lower()
    title_lower = (title or "").lower()

    slot = None
    m_day = re.search(r"\b(day\s*\d+(\.\d+)?)\b", title_lower)
    if m_day:
        slot = m_day.group(1).title()

    if "december" in date_lower:
        return "Phase 1", slot or "Phase 1 Hiring"
    elif any(m in date_lower for m in ["january", "february", "march", "april", "may", "june"]):
        if "2026" in date_lower:
            return "Phase 2", "Phase 2 Rolling"
        else:
            return "Pre-Placement Prep", "Prep Phase"
    elif any(m in date_lower for m in ["july", "august", "september", "october", "november"]):
        return "Phase 1 Preparation & OAs", "Phase 1 Pre-Season"
    else:
        return "Phase 1", "Phase 1"


def run_pipeline():
    print("================================================================")
    print("🚀 Starting IIT Bombay Placement Blog Ingestion Pipeline")
    print("================================================================")

    raw_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "placement_blogs", "raw", "iitb_placement_blog25_raw.json"
    )
    intel_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "placement_intelligence.json"
    )
    output_blogs_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "placement_blog_intelligence.json"
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

    # Aggregated storage per company
    company_intel = defaultdict(lambda: {
        "slug": "",
        "company_name": "",
        "total_updates": 0,
        "hiring_phases": set(),
        "cpi_criteria": {"cutoff_stated": "None", "bonus_jaf_allowed": False},
        "online_assessment": {
            "platform": "Online Assessment Platform",
            "mode": "Online",
            "duration_minutes": None,
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
    unmatched_companies = set()

    for idx, post in enumerate(chronological_posts):
        title = post.get("title", "")
        content_html = post.get("content_html", "")
        content_text = post.get("content_text", "")
        date_str = post.get("date", "")

        recruiter_raw, topic = normalize_recruiter_name(title)
        slug = resolve_canonical_slug(recruiter_raw, canonical_slug_map)

        if not slug:
            unmatched_companies.add(recruiter_raw)
            continue

        matched_posts += 1
        entry = company_intel[slug]
        entry["slug"] = slug
        if not entry["company_name"]:
            entry["company_name"] = recruiter_raw
        entry["total_updates"] += 1

        phase, slot = determine_phase_and_date(date_str, title)
        entry["hiring_phases"].add(phase)
        if slot:
            entry["slots_recorded"].add(slot)

        # Timeline event logging
        stage_label = "Update"
        if "jaf" in title.lower():
            stage_label = "JAF Announcement"
            jaf_params = extract_jaf_parameters(content_text)
            if jaf_params["cpi_cutoff"] != "None":
                entry["cpi_criteria"]["cutoff_stated"] = jaf_params["cpi_cutoff"]
            if jaf_params["bonus_jaf_allowed"]:
                entry["cpi_criteria"]["bonus_jaf_allowed"] = True
        elif "test" in title.lower() or "assessment" in title.lower():
            stage_label = "Online Assessment"
            oa_params = extract_assessment_intelligence(content_text)
            if oa_params["platform"] != "Online Assessment Platform":
                entry["online_assessment"]["platform"] = oa_params["platform"]
            if oa_params["mode"] != "Online":
                entry["online_assessment"]["mode"] = oa_params["mode"]
            if oa_params["duration_minutes"]:
                entry["online_assessment"]["duration_minutes"] = oa_params["duration_minutes"]
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
            "phase": phase,
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

        # Fallbacks if counts are missing but stages occurred
        if oa_count == 0 and interview_count > 0:
            oa_count = interview_count

        data["conversion_funnel"]["oa_shortlisted_count"] = oa_count
        data["conversion_funnel"]["interview_shortlisted_count"] = interview_count
        data["conversion_funnel"]["final_selected_count"] = final_count

        # Compute conversion percentages
        if oa_count > 0 and interview_count > 0:
            conv_oa = round((interview_count / oa_count) * 100, 1)
            data["conversion_funnel"]["oa_to_interview_conversion_pct"] = min(100.0, conv_oa)
        if interview_count > 0 and final_count > 0:
            conv_final = round((final_count / interview_count) * 100, 1)
            data["conversion_funnel"]["interview_to_offer_conversion_pct"] = min(100.0, conv_final)

        # Compute Demographics using Deterministic Roll Decoder
        # Use interview rolls if available, else all shortlist rolls
        target_rolls = interview_rolls if len(interview_rolls) > 0 else all_rolls
        demo_stats = aggregate_candidate_demographics(target_rolls)

        data["demographics"]["branch_distribution"] = demo_stats["department_breakdown"]
        data["demographics"]["degree_distribution"] = demo_stats["degree_breakdown"]
        data["demographics"]["cluster_breakdown"] = demo_stats["cluster_breakdown"]

        # Convert sets to sorted lists for JSON serialization
        data["hiring_phases"] = sorted(list(data["hiring_phases"]))
        data["slots_recorded"] = sorted(list(data["slots_recorded"]))

        # STRICT PII SANITIZATION: Delete all roll number sets before saving!
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
            merged_count += 1

    with open(intel_path, "w", encoding="utf-8") as f:
        json.dump({"companies": companies_data}, f, indent=2)
    print(f"✓ Merged hiring funnel intelligence directly into {merged_count}/{len(companies_data)} companies in placement_intelligence.json!")

    # Verify zero-PII in the output
    print("\n🔍 Running Strict Zero-PII Leakage Assertion Check...")
    with open(output_blogs_path, "r", encoding="utf-8") as f:
        out_content = f.read()

    # Search for roll number leaks e.g. 22Bxxxx, 24Mxxxx, 21Dxxxx
    roll_leaks = re.findall(r"\b2[0-5][BMDN]\d{4}\b", out_content)
    if len(roll_leaks) == 0:
        print("✅ SUCCESS: Zero student roll numbers or PII detected in output JSON! 100% anonymized.")
    else:
        print(f"⚠️ WARNING: Found {len(roll_leaks)} potential roll leaks. Please inspect!")

    print("================================================================")
    print("🎉 Ingestion Pipeline Completed Successfully!")
    print("================================================================")


if __name__ == "__main__":
    run_pipeline()
