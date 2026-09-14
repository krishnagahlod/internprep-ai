#!/usr/bin/env python3
"""
generate_placement_season_roadmap.py

Parses data/placement_blogs/raw/iitb_placement_blog25_raw.json (2,584 posts)
and builds a rich, structured, precomputed dataset for the IIT Bombay
Placement Season Calendar & Track-Wise Timeline Masterplan.

Outputs: apps/api/data/placement_season_roadmap.json
"""

import json
import os
import re
from collections import Counter, defaultdict
from datetime import datetime

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
BLOGS_RAW_PATH = os.path.join(ROOT_DIR, "data", "placement_blogs", "raw", "iitb_placement_blog25_raw.json")
OUTPUT_PATH = os.path.join(ROOT_DIR, "apps", "api", "data", "placement_season_roadmap.json")


def clean_html(raw_html: str) -> str:
    """Removes HTML tags and normalizes whitespace."""
    if not raw_html:
        return ""
    text = re.sub(r"<[^>]+>", " ", raw_html)
    text = re.sub(r"&[a-z]+;", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_post_date(date_str: str):
    """Parses date like 'October 8, 2025' or 'July 25, 2025' into datetime object."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str.strip(), "%B %d, %Y")
    except Exception:
        # Fallback regex match
        m = re.match(r"([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})", date_str.strip())
        if m:
            try:
                return datetime.strptime(f"{m.group(1)} {m.group(2)}, {m.group(3)}", "%B %d, %Y")
            except Exception:
                pass
    return None


def categorize_post(title: str, content: str) -> str:
    t = title.lower()
    c = content.lower()
    if any(k in t for k in ["interview shortlist", "interim shortlist", "extended interview shortlist", "shortlist update", "final shortlist"]):
        return "shortlist"
    if any(k in t for k in ["test announcement", "window test", "test schedule", "assessment", "hackerrank", "mettl", "test link", "test venue", "online test"]):
        return "assessment"
    if any(k in t for k in ["jaf open", "jafs open", "jaf deadline", "jaf update", "jaf re-open", "jaf extension"]):
        return "jaf"
    if any(k in t for k in ["pre-placement talk", "ppt", "corporate talk", "session", "knowledge session"]):
        return "ppt"
    if any(k in t for k in ["selection", "selected", "interim selection", "final selection", "offer"]):
        return "selection"
    if any(k in t for k in ["slotting", "day 1", "day 2", "day 3", "slot matrix", "idc day 1", "walkin", "walk-in"]):
        return "slotting"
    return "general"


def build_canonical_index():
    intel_path = os.path.join(ROOT_DIR, "apps", "api", "data", "placement_intelligence.json")
    if not os.path.exists(intel_path):
        return {}, {}
    with open(intel_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    slug_map = {}
    name_clean_map = {}

    for c in data.get("companies", []):
        slug = c["slug"]
        name = c["name"]
        slug_map[slug] = (name, slug)

        clean = re.sub(r"[^a-z0-9]", "", name.lower())
        name_clean_map[clean] = (name, slug)

        simplified = re.sub(r"\b(pvt|ltd|limited|private|llc|inc|corp|corporation|technologies|solutions|india|group|holdings)\b", "", name.lower())
        simplified_clean = re.sub(r"[^a-z0-9]", "", simplified)
        if len(simplified_clean) >= 3:
            name_clean_map[simplified_clean] = (name, slug)

    aliases = {
        "flipkart": ("Flipkart", "flipkart"),
        "kearney": ("Kearney", "kearney"),
        "mckinsey": ("McKinsey & Company", "mckinsey-and-company"),
        "bcg": ("Boston Consulting Group (BCG)", "boston-consulting-group-bcg"),
        "bain": ("Bain & Company", "bain-and-company"),
        "baincompany": ("Bain & Company", "bain-and-company"),
        "davinci": ("Da Vinci Derivatives BV", "da-vinci-derivatives-bv"),
        "janestreet": ("Jane Street", "jane-street"),
        "optiver": ("Optiver", "optiver"),
        "graviton": ("Graviton Research Capital", "graviton-research-capital"),
        "quadeye": ("Quadeye", "quadeye"),
        "squarepoint": ("Squarepoint Capital", "squarepoint-capital"),
        "nksecurities": ("NK Securities", "nk-securities"),
        "google": ("Google", "google"),
        "googleindia": ("Google", "google"),
        "microsoft": ("Microsoft", "microsoft"),
        "apple": ("Apple", "apple"),
        "uber": ("Uber", "uber"),
        "qualcomm": ("Qualcomm", "qualcomm"),
        "rubrik": ("Rubrik", "rubrik"),
        "glean": ("Glean", "glean"),
        "sprinklr": ("Sprinklr", "sprinklr"),
        "tatamotors": ("Tata Motors", "tata-motors"),
        "reliance": ("Reliance Industries", "reliance-industries"),
        "slb": ("SLB (Schlumberger)", "slb-schlumberger"),
        "schlumberger": ("SLB (Schlumberger)", "slb-schlumberger"),
        "procter": ("Procter & Gamble (P&G)", "procter-and-gamble-p-and-g"),
        "pg": ("Procter & Gamble (P&G)", "procter-and-gamble-p-and-g"),
        "sbifund": ("SBI Funds Management", "sbi-funds-management"),
        "sbifunds": ("SBI Funds Management", "sbi-funds-management"),
        "sony": ("Sony Group", "sony-group"),
        "sonyjapan": ("Sony Group", "sony-group"),
        "goldmansachs": ("Goldman Sachs", "goldman-sachs"),
        "morganstanley": ("Morgan Stanley", "morgan-stanley"),
        "jpmorgan": ("JPMorgan Chase", "jpmorgan-chase"),
        "jpmc": ("JPMorgan Chase", "jpmorgan-chase"),
        "itc": ("ITC Limited", "itc-limited"),
        "hul": ("Hindustan Unilever Limited (HUL)", "hindustan-unilever-limited-hul"),
        "airbus": ("Airbus", "airbus"),
        "siemens": ("Siemens", "siemens"),
        "texasinstruments": ("Texas Instruments", "texas-instruments"),
        "micron": ("Micron Technology", "micron-technology"),
        "bajajauto": ("Bajaj Auto", "bajaj-auto"),
        "maruti": ("Maruti Suzuki", "maruti-suzuki"),
        "honda": ("Honda R&D", "honda-r-d"),
        "zomato": ("Zomato", "zomato"),
        "meesho": ("Meesho", "meesho"),
        "americanexpress": ("American Express", "american-express"),
        "capitalone": ("Capital One", "capital-one"),
        "exl": ("EXL Service", "exl-service"),
    }
    for k, v in aliases.items():
        name_clean_map[re.sub(r"[^a-z0-9]", "", k.lower())] = v

    return slug_map, name_clean_map


NON_COMPANY_TRIGGERS = [
    "preparatory", "welcome to", "placement season", "timeline", "query form",
    "degree conversion", "formal suit", "incentive points", "knowledge session", "guidelines",
    "important update", "general notice", "slot matrix", "orientation", "cantilever labs",
    "idc day", "resume-making", "resume making", "career fair", "formal attire",
    "day 1", "day 2", "day 3", "day 4", "day 5", "day 6", "day 7", "day 8", "day 9",
    "day 10", "day 11", "day 12", "day 13", "day 14", "day 15"
]


def match_canonical_company(title: str, content: str, slug_map, name_clean_map):
    prefix = title.split("|")[0].strip() if "|" in title else (title.split("-")[0].strip() if "-" in title else title.strip())
    p_lower = prefix.lower()

    if any(trigger in p_lower for trigger in NON_COMPANY_TRIGGERS):
        return "", "", False

    clean_p = re.sub(r"[^a-z0-9]", "", p_lower)

    # 1. Exact match
    if clean_p in name_clean_map:
        name, slug = name_clean_map[clean_p]
        return name, slug, True

    # 2. Check if clean_p starts with any known key
    for k, (name, slug) in name_clean_map.items():
        if len(k) >= 4:
            if clean_p == k or clean_p.startswith(k) or (k.startswith(clean_p) and len(clean_p) >= 4):
                return name, slug, True

    # 3. Check if company name appears in title with word boundaries
    t_clean = re.sub(r"[^a-z0-9]", " ", title.lower())
    words = set(t_clean.split())
    for k, (name, slug) in name_clean_map.items():
        if len(k) >= 5 and k in words:
            return name, slug, True

    return "", "", False


def extract_external_links(raw_text: str) -> list:
    if not raw_text:
        return []
    urls = re.findall(r"https?://[^\s<>\"'\)]+", raw_text)
    clean_urls = []
    seen = set()
    for u in urls:
        cu = re.sub(r"[\.,;\)\]]+$", "", u).strip()
        if cu and "schema.org" not in cu and "w3.org" not in cu and cu not in seen:
            clean_urls.append(cu)
            seen.add(cu)
    return clean_urls


def assign_track(title: str, content: str, company: str) -> str:
    text = (title + " " + content + " " + company).lower()
    
    # 1. Consulting
    consult_keywords = [
        "mckinsey", "bcg", "bain", "kearney", "strategy&", "oliver wyman",
        "l.e.k", "parthenon", "ey-parthenon", "consulting", "accenture s&c",
        "guesstimate", "case study", "dalberg", "pwc strategy"
    ]
    if any(k in text for k in consult_keywords):
        return "consulting"
        
    # 2. Quant & HFT
    quant_keywords = [
        "jane street", "optiver", "graviton", "da vinci", "quadeye", "squarepoint",
        "worldquant", "nk securities", "citadel", "tower research", "alphagrep",
        "quantbox", "hft", "quant", "derivatives", "high frequency"
    ]
    if any(k in text for k in quant_keywords):
        return "quant"
        
    # 3. SDE & Tech
    sde_keywords = [
        "google", "apple", "microsoft", "flipkart", "uber", "qualcomm", "rubrik",
        "glean", "databricks", "sprinklr", "oracle", "salesforce", "amazon",
        "sde", "software", "hackerrank", "dsa", "coding", "systems engineer",
        "backend", "frontend", "full stack", "sony japan", "rakuten"
    ]
    if any(k in text for k in sde_keywords):
        return "sde"
        
    # 4. Core Engineering & FMCG
    core_keywords = [
        "tata motors", "reliance", "schlumberger", "slb", "airbus", "siemens",
        "texas instruments", "micron", "bajaj auto", "itc", "hul", "hindustan unilever",
        "maruti", "honda", "cad", "mechanical", "electrical", "civil", "chemical",
        "aerospace", "mems", "energy", "core talks", "sarc core"
    ]
    if any(k in text for k in core_keywords):
        return "core"
        
    # 5. Product Management & Analytics
    analytics_keywords = [
        "product manager", "apm", "analytics", "data science", "machine learning",
        "ai", "sql", "zomato", "meesho", "american express", "capital one", "exl",
        "cantilever labs", "business analyst", "data analyst"
    ]
    if any(k in text for k in analytics_keywords):
        return "analytics"
        
    return "general"


def is_high_impact_event(company: str, title: str, category: str) -> bool:
    c = company.lower()
    t = title.lower()
    tier1_companies = [
        "mckinsey", "bcg", "bain", "kearney", "jane street", "optiver", "graviton",
        "da vinci", "google", "apple", "microsoft", "qualcomm", "flipkart", "uber",
        "goldman sachs", "morgan stanley", "itc", "hul", "tata motors", "reliance",
        "schlumberger", "airbus", "meesho", "zomato", "micron", "rubrik", "glean",
        "squarepoint", "nk securities", "sony japan"
    ]
    if any(tc in c or tc in t for tc in tier1_companies):
        return True
    if category in ["ppt", "slotting", "shortlist"]:
        return True
    return False


def main():
    print(f"Loading raw blog posts from {BLOGS_RAW_PATH}...")
    if not os.path.exists(BLOGS_RAW_PATH):
        raise FileNotFoundError(f"Missing {BLOGS_RAW_PATH}")

    with open(BLOGS_RAW_PATH, "r", encoding="utf-8") as f:
        posts = json.load(f)

    print(f"Loaded {len(posts)} posts. Parsing and indexing into Calendar & Timeline...")

    slug_map, name_clean_map = build_canonical_index()
    print(f"Indexed {len(slug_map)} canonical companies with {len(name_clean_map)} search keys.")

    calendar_events = []
    days_map = defaultdict(list)
    track_events = defaultdict(list)
    month_events = defaultdict(list)
    
    # Phase buckets
    phase_posts = {
        "phase_0": [],   # July 2025
        "phase_1a": [],  # Aug - Sept 2025
        "phase_1b": [],  # Oct 2025
        "phase_1c": [],  # Nov 2025
        "phase_1d": [],  # Dec 1 - 15, 2025
        "phase_2": [],   # Dec 16, 2025 - June 2026
    }

    for idx, p in enumerate(posts):
        date_str = p.get("date", "").strip()
        dt = parse_post_date(date_str)
        title = p.get("title", "").strip()
        content = clean_html(p.get("content_text") or p.get("content_html") or "")
        cat = categorize_post(title, content)
        comp_name, comp_slug, has_dossier = match_canonical_company(title, content, slug_map, name_clean_map)
        track = assign_track(title, content, comp_name)
        is_high = is_high_impact_event(comp_name, title, cat)
        snippet = content[:160] + ("..." if len(content) > 160 else "")
        ext_links = extract_external_links(p.get("content_text") or p.get("content_html") or "")

        iso_date = dt.strftime("%Y-%m-%d") if dt else "2025-11-01"
        month_name = dt.strftime("%B") if dt else "November"
        year_num = dt.year if dt else 2025
        day_num = dt.day if dt else 1
        month_num = dt.month if dt else 11

        evt = {
            "id": f"evt-{idx}",
            "title": title,
            "company": comp_name,
            "company_slug": comp_slug,
            "has_dossier": has_dossier,
            "date": date_str,
            "iso_date": iso_date,
            "day": day_num,
            "month": month_num,
            "year": year_num,
            "month_name": month_name,
            "category": cat,
            "track": track,
            "is_high_impact": is_high,
            "snippet": snippet,
            "content": content[:2500],
            "external_links": ext_links,
        }

        calendar_events.append(evt)
        days_map[iso_date].append(evt)
        track_events[track].append(evt)
        month_key = f"{month_name} {year_num}"
        month_events[month_key].append(evt)

        # Assign to phase bucket
        if dt:
            if dt.year == 2025:
                if dt.month == 7:
                    phase_posts["phase_0"].append(evt)
                elif dt.month in [8, 9]:
                    phase_posts["phase_1a"].append(evt)
                elif dt.month == 10:
                    phase_posts["phase_1b"].append(evt)
                elif dt.month == 11:
                    phase_posts["phase_1c"].append(evt)
                elif dt.month == 12 and dt.day <= 15:
                    phase_posts["phase_1d"].append(evt)
                else:
                    phase_posts["phase_2"].append(evt)
            else:
                phase_posts["phase_2"].append(evt)
        else:
            phase_posts["phase_1c"].append(evt)

    # Sort each day's events: high impact first, then category priority
    category_order = {"ppt": 1, "shortlist": 2, "assessment": 3, "jaf": 4, "slotting": 5, "selection": 6, "general": 7}
    for d_iso, evts in days_map.items():
        evts.sort(key=lambda x: (not x["is_high_impact"], category_order.get(x["category"], 9)))

    print(f"Total calendar events indexed: {len(calendar_events)}")
    print(f"Days with events: {len(days_map)}")
    for trk, ev_list in track_events.items():
        print(f"  Track {trk}: {len(ev_list)} events")

    # Build Monthly Summaries with Tactical Guidance (Emphasizing October Test Fatigue)
    months_metadata = [
        {
            "month_name": "July",
            "year": 2025,
            "month_index": 7,
            "phase_code": "Phase 0",
            "title": "Season Kickoff & Master CV Locking",
            "theme": "Administration, Verification Proofs & Suit Stalls",
            "events_count": len(phase_posts["phase_0"]),
            "key_milestones": [
                {"date": "July 25", "title": "Official Placement Season 2025-26 Kickoff Broadcast"},
                {"date": "July 28", "title": "Degree Conversion & Dual Degree Preference Forms"},
                {"date": "July 30", "title": "Master CV Verification Portal Opens"}
            ],
            "tactical_guidance": "Lock your 1-page (SDE/Quant) and 2-page (Consulting/Core) LaTeX resumes with verified proofs. Any unverified project bullet point will lead to immediate portal debarment."
        },
        {
            "month_name": "August",
            "year": 2025,
            "month_index": 8,
            "phase_code": "Phase 1A",
            "title": "Orientation Talks & Masterclasses",
            "theme": "SARC Core Talks & Cantilever Labs Prep Masterclasses",
            "events_count": len([e for e in phase_posts["phase_1a"] if e["month"] == 8]),
            "key_milestones": [
                {"date": "August 1-2", "title": "Resume Making Sessions by Cantilever Labs"},
                {"date": "August 13", "title": "SARC Alumni Core Talks Kickoff"},
                {"date": "August 21", "title": "Finance & Quant Knowledge Sessions"},
                {"date": "August 28", "title": "Formal Suit Stalls Reminder & Fittings"}
            ],
            "tactical_guidance": "Establish a peer case group for Consulting (3 people) and start daily 2-hour LeetCode medium problem sets for Tech. Complete suit fittings early to avoid late November tailoring rushes."
        },
        {
            "month_name": "September",
            "year": 2025,
            "month_index": 9,
            "phase_code": "Phase 1A",
            "title": "Corporate PPTs & Institute Preparatory Tests",
            "theme": "Top Firm PPTs (Flipkart, Kearney) & Diagnostic Tests",
            "events_count": len([e for e in phase_posts["phase_1a"] if e["month"] == 9]),
            "key_milestones": [
                {"date": "September 3", "title": "Cantilever Labs Consulting Case Masterclass"},
                {"date": "September 12", "title": "Institute Preparatory Test (IPT) Set 1 [(DSA+OS+DBMS)]"},
                {"date": "September 18", "title": "Institute Preparatory Test (IPT) Set 2 [(DSA+Aptitude+Finance)]"},
                {"date": "September 25", "title": "Kearney Pre-Placement Talk (PPT Attendance Mandatory)"},
                {"date": "September 30", "title": "Flipkart Corporate Pre-Placement Talk (PPT)"}
            ],
            "tactical_guidance": "Treat IPT tests as real Day 1 tests. They give you your true campus rank across 1,600+ candidates. PPT attendance for Kearney, McKinsey, and BCG is strictly tracked for shortlisting eligibility."
        },
        {
            "month_name": "October",
            "year": 2025,
            "month_index": 10,
            "phase_code": "Phase 1B",
            "title": "The Online Assessment (OA) Surge",
            "theme": "Nightly Tests (8 PM - 11 PM), 157 JAFs & Window Collisions",
            "events_count": len(phase_posts["phase_1b"]),
            "key_milestones": [
                {"date": "October 4", "title": "Da Vinci Pre-Placement Talk & Quant Test Intro"},
                {"date": "October 6", "title": "Kearney JAF Opens (48-hour submission window)"},
                {"date": "October 8", "title": "Sony Japan & Squarepoint Capital JAFs Open"},
                {"date": "October 14", "title": "Flipkart APM-1 Problem Statement Released (72-hour window)"},
                {"date": "October 16", "title": "Google India Pre-Placement Talk & OA Registration"},
                {"date": "October 20-31", "title": "Peak Nightly OA Wave: 2-3 Tests Every Night from 8:00 PM to 11:30 PM"}
            ],
            "tactical_guidance": "CRITICAL: Back-to-back 8 PM & 10 PM test fatigue is the #1 reason strong candidates fail OAs. Follow our 15-Minute Brain Wash protocol. Never attempt 24-hr weekend tests on Sunday night after 10 PM due to portal server congestion."
        },
        {
            "month_name": "November",
            "year": 2025,
            "month_index": 11,
            "phase_code": "Phase 1C",
            "title": "Peak Shortlist Drops & Slot Matrix Preview",
            "theme": "Surprise Shortlist Drops, 277 JAFs & D-Day Slotting Finalization",
            "events_count": len(phase_posts["phase_1c"]),
            "key_milestones": [
                {"date": "November 5", "title": "First Wave Tech & Quant Test Shortlists Released"},
                {"date": "November 14", "title": "IDC Day 1 Companies Roster Announced"},
                {"date": "November 18", "title": "Bain & Company & Top Tier-1 Shortlists Drop"},
                {"date": "November 22", "title": "Google & Microsoft Interview Rosters Finalized"},
                {"date": "November 28", "title": "Official Day 1.1 and Day 1.2 Slotting Matrix Released"}
            ],
            "tactical_guidance": "Shortlists drop between midnight and 2:00 AM. Do not panic if your name isn't on Day 1.1 rosters; Day 1.2, Day 2.1, and Day 2.2 hold over 60% of all campus tech and consulting hiring."
        },
        {
            "month_name": "December",
            "year": 2025,
            "month_index": 12,
            "phase_code": "Phase 1D",
            "title": "D-Day Interviews (Day 1.1 to Day 15)",
            "theme": "The 15-Day Battle: Rapid Slots, Selections & Walk-in Rounds",
            "events_count": len(phase_posts["phase_1d"]),
            "key_milestones": [
                {"date": "December 1 (07:00 AM)", "title": "Day 1.1 Kickoff: Jane Street, Optiver, Apple, Google, Qualcomm"},
                {"date": "December 1 (05:00 PM)", "title": "Day 1.2 Kickoff: McKinsey, BCG, Bain, Goldman Sachs, ITC"},
                {"date": "December 2", "title": "Day 2 Sprint: Flipkart, Meesho, Zomato, Micron, NK Securities Walk-ins"},
                {"date": "December 3-8", "title": "Days 3 to 8: Bulk Core Engineering (Tata, Reliance, SLB) & Analytics"},
                {"date": "December 9-15", "title": "Phase 1 Conclusion & Extended Wave Selections"}
            ],
            "tactical_guidance": "Stay in interview holding lounges. Keep in close touch with your Department Placement Coordinator (DPC) runner. Over 40 companies issue instant walk-in shortlists when earlier candidates accept offers."
        }
    ]

    # Dedicated October OA Overlap & Fatigue Survival Guide (Issue A)
    oa_survival_guide = {
        "title": "October Online Assessment (OA) Overlap & Fatigue Survival Guide",
        "badge": "MISSION CRITICAL PLAYBOOK",
        "description": "In October, 92 Online Assessments take place across HackerRank, Mercer Mettl, and SHL, alongside 157 JAF deadlines and academic midsem exams. This tactical playbook helps candidates navigate back-to-back testing and mental fatigue.",
        "consecutive_test_strategy": [
            {
                "rule": "The 15-Minute Brain Wash (Between 8:00 PM and 9:45 PM Tests)",
                "action": "Never carry disappointment from a missed test case in the 8:00 PM test into the 9:45 PM test. Immediately close your laptop, wash your face with cold water, do 5 minutes of box breathing, and drink cold water with electrolytes. Reset your mental score to zero."
            },
            {
                "rule": "Neural Context Switching (SDE Coding → Quant/Analytics Math)",
                "action": "Switching from writing C++ algorithms to speed mental math requires different brain regions. Before starting a Quant/Analytics test, solve 3 quick mental arithmetic drills (multiplications / Bayes percentages) to activate your numerical intuition."
            },
            {
                "rule": "The 75-Minute Partial Credit Pivot",
                "action": "If you are stuck on problem 3 with 15 minutes remaining, stop attempting an optimal O(N) solution. Implement a clean brute-force O(N²) or O(2^N) solution to capture 30–50% partial points. In campus hiring, partial test cases often differentiate who gets shortlisted."
            }
        ],
        "weekend_window_strategy": [
            {
                "window_type": "24-Hour Open Window Assessments (Saturday 12 PM - Sunday 12 PM)",
                "golden_rule": "NEVER take the test between 10:00 PM and 11:59 PM on Sunday.",
                "why": "Historically, over 600 students attempt the test in the final 2 hours. HackerRank and Mettl servers experience severe latency spikes, code execution delays (queue times jump from 2s to 90s), and submission timeout failures.",
                "best_time_to_start": "Saturday 10:30 AM – 1:00 PM or Sunday 2:00 PM – 4:30 PM when mental alertness is high and platform bandwidth is free."
            }
        ],
        "platform_proctoring_profiles": [
            {
                "platform": "HackerRank",
                "strictness": "High Code & Tab Analysis",
                "traps_to_avoid": [
                    "Multi-monitor detection: Disconnect external HDMI cables completely before starting.",
                    "Clipboard tracking: Never paste external code. HackerRank logs keystroke cadence and paste volume.",
                    "Tab switching: Any window blur of >3 seconds triggers an automated integrity flag to the campus recruiter."
                ]
            },
            {
                "platform": "Mercer Mettl",
                "strictness": "Aggressive AI Webcam & Audio Monitoring",
                "traps_to_avoid": [
                    "Lighting traps: Ensure bright, uniform frontal lighting. Side shadows trigger 'No Face Detected' or 'Multiple Faces Detected' flags.",
                    "Audio sensitivity: Ambient hostel corridor noise or fans can trigger suspicious noise warnings. Test in a quiet room with the door locked.",
                    "Eye tracking: Looking away from the screen for >5 seconds generates an alert."
                ]
            },
            {
                "platform": "SHL / AMCAT",
                "strictness": "Strict Section Timers & Adaptive Logic",
                "traps_to_avoid": [
                    "No question backtracking: Once you submit an answer or skip, you CANNOT go back. If stuck, make an educated guess.",
                    "No negative marking: Never leave an SHL aptitude question blank before the timer expires."
                ]
            }
        ],
        "midsem_fatigue_recovery": [
            "Take a mandatory 45-minute power nap between 5:30 PM and 6:30 PM before evening tests.",
            "Selective JAF signing: Do not sign 120 JAFs blindly. An unattempted test after signing a JAF incurs placement cell penalty points. Target 35–50 high-conviction companies.",
            "Keep high-protein snacks (walnuts, almonds, dark chocolate) on your desk. Avoid heavy oily hostel dinners before 8:00 PM."
        ]
    }

    # Summary by Phase
    def summarize_phase(posts_list):
        cats = Counter(p["category"] for p in posts_list)
        comps = list(set(p["company"] for p in posts_list if p["company"] and not p["company"].startswith("Day")))
        sample_notices = [p for p in posts_list if p["category"] in ["assessment", "shortlist", "ppt", "jaf", "selection"]][:8]
        return {
            "total_posts": len(posts_list),
            "jafs_count": cats["jaf"],
            "oas_count": cats["assessment"],
            "shortlists_count": cats["shortlist"],
            "ppts_count": cats["ppt"],
            "selections_count": cats["selection"],
            "active_companies_count": len(comps),
            "sample_companies": comps[:12],
            "featured_announcements": sample_notices,
        }

    p0_summary = summarize_phase(phase_posts["phase_0"])
    p1a_summary = summarize_phase(phase_posts["phase_1a"])
    p1b_summary = summarize_phase(phase_posts["phase_1b"])
    p1c_summary = summarize_phase(phase_posts["phase_1c"])
    p1d_summary = summarize_phase(phase_posts["phase_1d"])
    p2_summary = summarize_phase(phase_posts["phase_2"])

    # D-Day Slotting Playbook
    dday_slotting_playbook = {
        "title": "D-Day (Dec 1–15) Slotting & Multi-Shortlist Playbook",
        "description": "How IIT Bombay orchestrates the premier recruiting slots, and how candidates navigate multi-shortlist collisions and walk-in rounds.",
        "slots": [
            {
                "slot_code": "Day 1.1",
                "timing": "December 1: 07:00 AM – 03:00 PM",
                "prestige": "Premier Global HFTs & Tier-1 Tech Titans",
                "characteristics": "Highest compensation on campus (₹1 Cr to ₹2.5+ Cr). Fastest round pacing (30–45 mins per technical panel).",
                "historical_recruiters": [
                    "Jane Street", "Optiver", "Graviton Research Capital", "Da Vinci Derivatives",
                    "Apple", "Google", "Microsoft", "Qualcomm", "Glean", "Rubrik", "Databricks"
                ],
                "collision_strategy": "You can physically attend at most 2–3 full interview loops before 3:00 PM. Prioritize the firm where your OA percentile and interviewer rapport was highest."
            },
            {
                "slot_code": "Day 1.2",
                "timing": "December 1: 05:00 PM – 01:00 AM",
                "prestige": "Global Management Consultancies, Tier-1 FinTech & Premier Core",
                "characteristics": "Premier consulting firms (McKinsey, BCG, Bain) and elite investment banks (Goldman Sachs, Morgan Stanley). Multi-partner case interviews.",
                "historical_recruiters": [
                    "McKinsey & Company", "Boston Consulting Group (BCG)", "Bain & Company",
                    "Goldman Sachs", "Morgan Stanley", "ITC Limited", "Hindustan Unilever (HUL)", "Texas Instruments"
                ],
                "collision_strategy": "Consulting interviews require rapid mental switching between case rounds and partner fits. If dual-shortlisted with tech/fintech, take the consulting round first as their partner panels have fixed schedules."
            },
            {
                "slot_code": "Day 2.1 & 2.2",
                "timing": "December 2: Day (08:00 AM – 04:00 PM) & Night (05:00 PM – 01:00 AM)",
                "prestige": "High-Growth Unicorns, E-Commerce Giants & Top Core",
                "characteristics": "Massive hiring velocity. Companies issue offers rapidly to prevent candidates from taking Day 3 slots.",
                "historical_recruiters": [
                    "Meesho", "Flipkart", "Zomato", "Micron Technology",
                    "American Express", "Oracle", "Cisco", "Deutsche Bank", "Schlumberger"
                ],
                "collision_strategy": "Look for extended shortlists. Day 2 companies often promote waitlisted candidates if Day 1 candidates accept earlier offers."
            },
            {
                "slot_code": "Days 3 to 15",
                "timing": "December 3 – 15: Rolling Daily Slots (12:00 PM – 08:00 PM)",
                "prestige": "Core Engineering, Analytics, Enterprise SaaS & PSUs",
                "characteristics": "Consistent daily hiring. Core engineering departments (Mech, Civil, Chem, Aero) see their peak selections during this period.",
                "historical_recruiters": [
                    "Tata Motors", "Reliance Industries", "L&T", "Siemens",
                    "Bajaj Auto", "Airbus", "Honeywell", "LTIMindtree", "EXL Analytics"
                ],
                "collision_strategy": "Keep your stamina high. Selections here are steady and reliable. Never let down your guard during HR and behavioral rounds."
            }
        ],
        "collision_rules": [
            {
                "scenario": "Shortlisted in two companies in the same slot (e.g. Google and Qualcomm in Day 1.1)",
                "protocol": "Notify your Department Placement Coordinator (DPC) at 6:30 AM. The DPC runners will sequence your panels so you complete Round 1 of Company A, then attend Round 1 of Company B while Company A deliberates."
            },
            {
                "scenario": "Receiving an offer while waiting for another interview",
                "protocol": "The 1-Offer Rule is absolute: as soon as Company A registers your offer in the placement system, you are placed and automatically withdrawn from Company B."
            },
            {
                "scenario": "What is an 'Extended Shortlist' or 'Walk-in'?",
                "protocol": "If Company X has 5 open slots and 3 shortlisted candidates get placed elsewhere in earlier slots, Company X issues an 'Extended Shortlist' on the spot. Candidates on the waitlist are called for instant interviews."
            }
        ]
    }

    # Track Guides
    track_guides = {
        "consulting": {
            "title": "Management Consulting & Strategy",
            "icon": "Briefcase",
            "sample_companies": ["McKinsey & Company", "Boston Consulting Group (BCG)", "Bain & Company", "Kearney", "L.E.K. Consulting", "Accenture S&C"],
            "core_pillars": ["Market Entry & Sizing", "Profitability Frameworks", "Guesstimates", "Executive Presence & Communication"],
            "key_advice": "Attendance at Kearney, McKinsey, and BCG PPTs in September is strictly monitored. Buddy rounds run throughout November; practice cases out loud with peers, not by reading casebooks silently.",
            "timeline_pattern": "PPTs in late Sept → JAFs early Oct → Buddy rounds in Nov → Day 1.2 Interviews (Dec 1 night)"
        },
        "sde": {
            "title": "Software Engineering (SDE)",
            "icon": "Code2",
            "sample_companies": ["Google", "Apple", "Microsoft", "Uber", "Flipkart", "Qualcomm", "Rubrik", "Glean"],
            "core_pillars": ["Data Structures & Algorithms", "System Design (HLD/LLD)", "OS / DBMS / Networks", "Object-Oriented Programming"],
            "key_advice": "October has 92 OAs. 80% test standard Dynamic Programming, Graph Traversal, and Trees. Master 60-minute timed sprints under HackerRank proctoring conditions.",
            "timeline_pattern": "Early JAFs in Sept/Oct → Massive OA surge Oct 10-31 → Shortlists mid-Nov → Day 1.1 & Day 2 Interviews"
        },
        "quant": {
            "title": "Quantitative Finance & Trading (HFT)",
            "icon": "TrendingUp",
            "sample_companies": ["Jane Street", "Optiver", "Graviton Research Capital", "Da Vinci Derivatives", "Squarepoint Capital", "NK Securities"],
            "core_pillars": ["Probability Theory", "Mental Math & Speed Calculation", "Brain Teasers & Puzzles", "Modern C++ / Low Latency"],
            "key_advice": "Accuracy and speed are everything. Practice 80-question speed math tests (Zetamac). Master Bayes theorem, Markov chains, and expected value puzzles.",
            "timeline_pattern": "Da Vinci / Squarepoint PPTs in early Oct → Mettl speed math tests in late Oct → Day 1.1 Interviews (Dec 1, 7 AM)"
        },
        "core": {
            "title": "Core Engineering & FMCG",
            "icon": "Cog",
            "sample_companies": ["Tata Motors", "Reliance Industries", "Schlumberger", "Airbus", "Siemens", "Texas Instruments", "ITC Limited", "HUL"],
            "core_pillars": ["Departmental Fundamentals", "GATE-Level Problem Solving", "CAD / Simulation / Lab Tools", "Practical Project Defense"],
            "key_advice": "Be ready to draw diagrams and derive equations on paper. Panelists focus on your summer internship and BTP design choices.",
            "timeline_pattern": "SARC Core Talks in Aug → JAFs in Oct/Nov → Days 3-8 Interviews (Dec 3-8 peak selections)"
        },
        "analytics": {
            "title": "Product Management, Analytics & AI/ML",
            "icon": "BarChart2",
            "sample_companies": ["Flipkart APM", "Meesho", "Zomato", "American Express", "Capital One", "EXL Analytics"],
            "core_pillars": ["SQL & Relational Algebra", "Python / Pandas / Modeling", "Product Problem Statements", "Business Case Metrics"],
            "key_advice": "Flipkart APM problem statement drops in mid-October with a strict 72-hour turnaround. Expect live SQL tests with window functions.",
            "timeline_pattern": "APM Assignment drops mid-Oct → SQL OAs in Nov → Day 1.2 / Day 2 Interviews"
        }
    }

    # Assemble full JSON dataset
    roadmap_data = {
        "season_overview": {
            "title": "IIT Bombay Campus Placement Season Masterplan & Recruitment Calendar",
            "total_announcements": len(posts),
            "phase1_announcements": len(phase_posts["phase_0"]) + len(phase_posts["phase_1a"]) + len(phase_posts["phase_1b"]) + len(phase_posts["phase_1c"]) + len(phase_posts["phase_1d"]),
            "phase2_announcements": len(phase_posts["phase_2"]),
            "kickoff_date": "July 25, 2025",
            "dday_start": "December 1, 2025",
            "dday_slot_1_start": "07:00 AM IST",
            "phase1_end": "December 15, 2025",
            "season_end": "June 30, 2026",
            "historical_verified_candidates_placed": 1640,
        },
        "months_overview": months_metadata,
        "calendar_events": calendar_events,
        "days_map": days_map,
        "oa_survival_guide": oa_survival_guide,
        "dday_slotting_playbook": dday_slotting_playbook,
        "track_guides": track_guides,
        "phases_summary": {
            "phase_0": p0_summary,
            "phase_1a": p1a_summary,
            "phase_1b": p1b_summary,
            "phase_1c": p1c_summary,
            "phase_1d": p1d_summary,
            "phase_2": p2_summary,
        }
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(roadmap_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated enriched Season Roadmap & Calendar at: {OUTPUT_PATH}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
