#!/usr/bin/env python3
"""
generate_placement_season_roadmap.py

Parses data/placement_blogs/raw/iitb_placement_blog25_raw.json (2,584 posts)
and builds a rich, structured, precomputed dataset for the IIT Bombay
Placement Season Roadmap & Preparation Masterplan.

Outputs: apps/api/data/placement_season_roadmap.json
"""

import json
import os
import re
from collections import Counter
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
    if any(k in t for k in ["interview shortlist", "interim shortlist", "extended interview shortlist", "shortlist update"]):
        return "shortlist"
    if any(k in t for k in ["test announcement", "window test", "test schedule", "assessment", "hackerrank", "mettl", "test link", "test venue"]):
        return "assessment"
    if any(k in t for k in ["jaf open", "jafs open", "jaf deadline", "jaf update", "jaf re-open"]):
        return "jaf"
    if any(k in t for k in ["pre-placement talk", "ppt", "corporate talk", "session"]):
        return "ppt"
    if any(k in t for k in ["selection", "selected", "interim selection", "final selection", "offer"]):
        return "selection"
    if any(k in t for k in ["slotting", "day 1", "day 2", "day 3", "slot matrix", "idc day 1"]):
        return "slotting"
    return "general"


def extract_company_name(title: str) -> str:
    if "|" in title:
        parts = title.split("|")
        return parts[0].strip()
    if "-" in title and not title.startswith("Day"):
        parts = title.split("-")
        return parts[0].strip()
    return ""


def main():
    print(f"Loading raw blog posts from {BLOGS_RAW_PATH}...")
    if not os.path.exists(BLOGS_RAW_PATH):
        raise FileNotFoundError(f"Missing {BLOGS_RAW_PATH}")

    with open(BLOGS_RAW_PATH, "r", encoding="utf-8") as f:
        posts = json.load(f)

    print(f"Loaded {len(posts)} posts. Parsing and bucketing into Season Phases...")

    # Buckets for each phase
    phase_posts = {
        "phase_0": [],   # July 2025
        "phase_1a": [],  # Aug - Sept 2025
        "phase_1b": [],  # Oct 2025
        "phase_1c": [],  # Nov 2025
        "phase_1d": [],  # Dec 1 - 15, 2025
        "phase_2": [],   # Dec 16, 2025 - June 2026
    }

    month_counter = Counter()
    category_counter = Counter()

    for p in posts:
        dt = parse_post_date(p.get("date", ""))
        title = p.get("title", "").strip()
        content = clean_html(p.get("content_text") or p.get("content_html") or "")
        cat = categorize_post(title, content)
        comp = extract_company_name(title)

        post_entry = {
            "title": title,
            "date": p.get("date", "").strip(),
            "category": cat,
            "company": comp,
            "snippet": content[:240] + ("..." if len(content) > 240 else ""),
            "timestamp": dt.isoformat() if dt else None,
        }

        if dt:
            month_key = dt.strftime("%B %Y")
            month_counter[month_key] += 1
            category_counter[cat] += 1

            if dt.year == 2025:
                if dt.month == 7:
                    phase_posts["phase_0"].append(post_entry)
                elif dt.month in [8, 9]:
                    phase_posts["phase_1a"].append(post_entry)
                elif dt.month == 10:
                    phase_posts["phase_1b"].append(post_entry)
                elif dt.month == 11:
                    phase_posts["phase_1c"].append(post_entry)
                elif dt.month == 12 and dt.day <= 15:
                    phase_posts["phase_1d"].append(post_entry)
                else:
                    phase_posts["phase_2"].append(post_entry)
            else:
                phase_posts["phase_2"].append(post_entry)
        else:
            # Fallback if date unparseable
            phase_posts["phase_1c"].append(post_entry)

    print("Post counts per phase:")
    for k, v in phase_posts.items():
        print(f"  {k}: {len(v)} posts")

    # Helper to calculate phase stats
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

    # Build the full structured roadmap dataset
    roadmap_data = {
        "season_overview": {
            "title": "IIT Bombay Campus Placement Season Masterplan (2025–26)",
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
        "phases": [
            {
                "id": "phase-0",
                "phase_code": "Phase 0",
                "name": "Kickoff, CV Registration & Master Proofs",
                "subtitle": "Institutional Registration, Master CV Locking & Policy Orientation",
                "season_group": "phase_1",
                "date_range": "July 20 – July 31, 2025",
                "duration_weeks": 2,
                "urgency_badge": "FOUNDATIONAL",
                "accent_color": "blue",
                "icon": "FileCheck",
                "summary": p0_summary,
                "candidate_reality": "Placement season officially kicks off. The Placement Cell opens registration forms, degree conversion applications (for dual-degree/branch transfers), and the dreaded Master CV verification process. Students must create and freeze 1-page and 2-page Master Resumes where every single claim, grade, internship, and POR requires an official verification proof. Missing a deadline here means instant debarment from Phase 1.",
                "mindset_advice": "Do not rush your resume. A rejected bullet point during verification can leave an awkward empty space or force you into a weak fallback template. Obtain signed certificates for all PORs and previous internships right now.",
                "placement_cell_rules": [
                    "Zero Tolerance Policy on Unverified Claims: Any fake CGPA, unverified POR, or phantom project leads to immediate 1-year debarment.",
                    "1-Page vs 2-Page Strict Rule: Master CVs once frozen cannot be edited until Phase 2 without Placement Cell administrative penalties.",
                    "Formal Suit Requirement: Suit fitting stalls are set up in SAC/Hostels; mandatory corporate formal wear is required for all PPTs and interviews.",
                ],
                "weekly_milestones": [
                    {
                        "id": "m_p0_w1",
                        "week_label": "Late July (Week 1)",
                        "title": "Master CV Verification & Proof Assembly",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Assemble all proof documents for academic credentials, internships, research papers, and club leadership roles.",
                        "tasks": [
                            "Complete Placement Cell Institutional Registration and sign the placement agreement.",
                            "Download verified grade sheet / transcript from Academic Office.",
                            "Collate signed letters/emails for summer internships, technical projects, and PORs.",
                            "Format 1-page standard SDE/Quant CV and 2-page Consulting/Core CV following the IITB LaTeX format."
                        ]
                    },
                    {
                        "id": "m_p0_w2",
                        "week_label": "Late July (Week 2)",
                        "title": "Career Track Decision & Baseline Diagnostic",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "HIGH",
                        "description": "Decide your primary vs secondary hiring tracks and complete your baseline skill assessment.",
                        "tasks": [
                            "Pick primary track (e.g. SDE vs Quant vs Consulting vs Core) to avoid spreading prep too thin.",
                            "Submit Master CV on the placement portal before the initial freeze deadline.",
                            "Attend Formal Suit Fitting sessions organized in hostel clusters for interview season.",
                            "Set up daily DSA/Aptitude practice routines (minimum 2 hours daily)."
                        ]
                    }
                ]
            },
            {
                "id": "phase-1a",
                "phase_code": "Phase 1A",
                "name": "Corporate PPTs & Institute Preparatory Tests (IPT)",
                "subtitle": "Early Pre-Placement Talks, Institute Diagnostic Tests & JAF Openings",
                "season_group": "phase_1",
                "date_range": "August 1 – September 30, 2025",
                "duration_weeks": 8,
                "urgency_badge": "HIGH PREP",
                "accent_color": "purple",
                "icon": "Presentation",
                "summary": p1a_summary,
                "candidate_reality": "Evening Pre-Placement Talks (PPTs) commence in PC Saxena Auditorium and LT clusters. Top firms like McKinsey, BCG, Flipkart, Qualcomm, and Goldman Sachs deliver company overviews. Simultaneously, the Placement Cell conducts mandatory 'Institute Preparatory Tests' (IPT Sets 1 & 2) covering DSA, OS, DBMS, Aptitude, and Finance. This gives students their first brutal reality check on speed, percentile rank across campus, and time management.",
                "mindset_advice": "Do not skip IPT tests. The questions are contributed by recent IITB alumni working at top firms. The percentile rank in IPT is the most accurate predictor of whether you will clear Day 1 OAs.",
                "placement_cell_rules": [
                    "Mandatory PPT Attendance: Certain tier-1 consulting firms (McKinsey, BCG, Bain) require attendance at PPTs to be eligible for resume shortlisting.",
                    "Early JAF Deadline Adherence: The first wave of JAFs (Sony Japan, Quant firms, early MNCs) open with strict 48-hour submission windows.",
                    "Sign-in / Sign-out Rules: Students must record attendance via RFID/QR scanners at designated talk venues.",
                ],
                "weekly_milestones": [
                    {
                        "id": "m_p1a_w1",
                        "week_label": "August (Weeks 1–2)",
                        "title": "Foundational Core & Algorithmic Sprints",
                        "tracks": ["sde", "quant", "analytics"],
                        "priority": "HIGH",
                        "description": "Intensive focus on Data Structures (Trees, Graphs, DP, Heaps) and Object-Oriented Design.",
                        "tasks": [
                            "Solve top 100 LeetCode Medium/Hard problems across Dynamic Programming and Graphs.",
                            "Revise Operating Systems (Paging, Threading, Deadlocks, Virtual Memory) and DBMS (SQL queries, indexing, ACID).",
                            "Practice 50 Quant puzzles from Heard on the Street and 50 Brain Teasers (Quant track).",
                            "Attend SARC Core Talks and Alumni career interaction webinars."
                        ]
                    },
                    {
                        "id": "m_p1a_w2",
                        "week_label": "August (Weeks 3–4)",
                        "title": "Consulting Case Groups & Product Teardowns",
                        "tracks": ["consulting", "analytics"],
                        "priority": "HIGH",
                        "description": "Form 3-person peer case groups; master Market Entry, Profitability, and Guesstimate frameworks.",
                        "tasks": [
                            "Form a dedicated case group of 3–4 peers with diverse departmental backgrounds.",
                            "Practice 20 live case studies from Victor Cheng / Day 1 IITB Casebooks.",
                            "Master guesstimate estimation frameworks (Top-Down, Bottom-Up, Sanity Checks).",
                            "Attend Cantilever Labs product management & case workshop sessions."
                        ]
                    },
                    {
                        "id": "m_p1a_w3",
                        "week_label": "September (Weeks 1–2)",
                        "title": "Institute Preparatory Test (IPT) – Set 1",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Take Institute Preparatory Test Set 1 under strict timed conditions.",
                        "tasks": [
                            "Attempt IPT Set 1: DSA + OS + DBMS in standard 90-minute timed environment.",
                            "Attempt IPT Set 1: Aptitude + Quantitative Reasoning + Finance.",
                            "Analyze incorrect questions and build an error log of weak algorithmic concepts.",
                            "Attend Flipkart, Qualcomm, and Goldman Sachs Pre-Placement Talks."
                        ]
                    },
                    {
                        "id": "m_p1a_w4",
                        "week_label": "September (Weeks 3–4)",
                        "title": "IPT Set 2 & First Wave JAF Filings",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Take IPT Set 2 and begin filing early MNC and international JAFs.",
                        "tasks": [
                            "Attempt IPT Set 2: Advanced Dynamic Programming, Graph Theory, and Core Systems.",
                            "Submit JAF applications for early international recruiters (Sony Japan, Rakuten, Bloomberg London).",
                            "Draft customized cover letters or specialized essays for firms requiring them (e.g. Da Vinci, Jane Street, Bain).",
                            "Conduct initial 1-on-1 mock interviews with placed seniors."
                        ]
                    }
                ]
            },
            {
                "id": "phase-1b",
                "phase_code": "Phase 1B",
                "name": "The Online Assessment (OA) Blitz",
                "subtitle": "Nightly Tests, 157 JAF Openings & Severe Test Window Collisions",
                "season_group": "phase_1",
                "date_range": "October 1 – October 31, 2025",
                "duration_weeks": 4,
                "urgency_badge": "PEAK PRESSURE",
                "accent_color": "amber",
                "icon": "Terminal",
                "summary": p1b_summary,
                "candidate_reality": "The single most exhausting month of the academic semester. Over 330 blog posts are published in October alone! 157 JAFs open and close in rapid succession, while 92 Online Assessments take place. Every single night from 8:00 PM to 11:30 PM, students are writing proctored HackerRank, Mercer Mettl, SHL, or Glider tests. On weekends, 24-hour test windows overlap. Students must balance mid-semester exams, B.Tech/M.Tech project deadlines, and 2–3 tests per night.",
                "mindset_advice": "Do not let a bad test ruin your evening. You will fail some OAs due to extreme test cases or tricky hidden constraints. The candidates who win Day 1 are those who shake off a bad 8:00 PM test and focus completely on the 9:45 PM test.",
                "placement_cell_rules": [
                    "Strict Proctoring Enforcement: Full-screen browser lock, webcam monitoring, and audio recording. Any tab-switching flag or external monitor detection leads to automatic debarment.",
                    "JAF Submission Penalty: Failing to submit a JAF by 11:59 PM is non-negotiable; placement cell coordinators cannot override locked JAFs.",
                    "Mandatory Test Attendance: If you sign a JAF with a test requirement, unexcused absence from the OA can lead to a black mark or fine by the Placement Cell.",
                ],
                "weekly_milestones": [
                    {
                        "id": "m_p1b_w1",
                        "week_label": "October (Week 1)",
                        "title": "OA Execution Engine & Test Platform Setup",
                        "tracks": ["sde", "quant", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Calibrate your hardware, webcam, IDE templates, and speed coding routine for HackerRank & Mettl.",
                        "tasks": [
                            "Set up a dedicated clean testing environment with high-speed wired internet and webcam check.",
                            "Prepare C++ / Python fast I/O boilerplate and standard algorithm snippets.",
                            "Master mental math shortcuts for 15-minute speed aptitude sections.",
                            "Track every JAF deadline on a live spreadsheet or Placement CRM to avoid missed cutoffs."
                        ]
                    },
                    {
                        "id": "m_p1b_w2",
                        "week_label": "October (Week 2)",
                        "title": "HFT Quant & Tier-1 Tech OA Wave",
                        "tracks": ["sde", "quant"],
                        "priority": "CRITICAL",
                        "description": "Clear high-stakes assessments for Jane Street, Graviton, Optiver, Google, and Apple.",
                        "tasks": [
                            "Practice advanced probability distributions, conditional expectation, and Markov chains.",
                            "Drill 60-minute coding blocks under strict timer constraints (target 2 medium problems in 45 mins).",
                            "Review system design principles (Caching, Load Balancing, SQL vs NoSQL, Sharding) for senior SDE roles.",
                            "Attend online pre-assessment doubt clearance sessions organized by test coordinators."
                        ]
                    },
                    {
                        "id": "m_p1b_w3",
                        "week_label": "October (Week 3)",
                        "title": "FinTech, Core & Analytics Assessment Surge",
                        "tracks": ["consulting", "core", "analytics"],
                        "priority": "HIGH",
                        "description": "Manage multi-window assessments across core engineering and analytics recruiters.",
                        "tasks": [
                            "Complete SQL queries and data manipulation assessments (Pandas, Joins, Window Functions).",
                            "Revise core department fundamentals: Thermodynamics/Fluids (Mech), Signals/Analog (Elec), Structures (Civil).",
                            "Solve SHL and Mercer Mettl inductive reasoning & psychometric personality questionnaires honestly and consistently.",
                            "Maintain healthy sleep: take 30-minute power naps between the 6:00 PM lab and 8:00 PM test."
                        ]
                    },
                    {
                        "id": "m_p1b_w4",
                        "week_label": "October (Week 4)",
                        "title": "Mid-Semester Academic Sync & Mid-Point Audit",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "HIGH",
                        "description": "Audit tests completed vs shortlists expected; balance BTP/DDP and semester exams.",
                        "tasks": [
                            "Review test completion rate (aim for 85%+ attendance across signed JAFs).",
                            "Coordinate with course professors for assignment submissions so exams do not clash with OAs.",
                            "Log unexpected test formats (e.g. Codeforces rounds, Google Forms quizzes) for future reference.",
                            "Begin targeted resume customization for companies requiring role-specific CV selections."
                        ]
                    }
                ]
            },
            {
                "id": "phase-1c",
                "phase_code": "Phase 1C",
                "name": "Shortlist Drops & Slotting Matrix Preview",
                "subtitle": "Peak Shortlist Announcements, Interview Slotting Matrices & Mock Polish",
                "season_group": "phase_1",
                "date_range": "November 1 – November 30, 2025",
                "duration_weeks": 4,
                "urgency_badge": "HIGH ANXIETY",
                "accent_color": "rose",
                "icon": "Award",
                "summary": p1c_summary,
                "candidate_reality": "The month of peak anticipation and adrenaline. 785 announcements are posted! The first interview shortlists drop in late October and throughout November, often between midnight and 2:00 AM. 137 interview shortlists are published. The Placement Cell releases the IDC Day 1 companies roster, Day 1.1 and Day 1.2 company maps, and preliminary slotting arrangements. Candidates experience extreme emotions: relief when shortlisted by a dream firm, or anxiety when rejected after an OA.",
                "mindset_advice": "Do not obsess over shortlists dropped in hostel wings at 1:00 AM. Having 3 solid shortlists in Day 1.2 or Day 2 is statistically far better than having 5 conflicting shortlists in Day 1.1 where you can only attend 2 before rounds close. Protect your mental stamina.",
                "placement_cell_rules": [
                    "CV Freeze for Shortlisted Firms: Once an interview shortlist is published, your resume for that company is frozen and transmitted to the recruiter.",
                    "Pre-Interview Presentation Attendance: Many shortlisted candidates are required to attend mandatory pre-interview tech briefings.",
                    "Slot Conflict Registration: Students shortlisted for multiple firms in the same slot (e.g. 3 companies in Day 1.1) must submit their preference hierarchy to the placement coordinator team.",
                ],
                "weekly_milestones": [
                    {
                        "id": "m_p1c_w1",
                        "week_label": "November (Week 1)",
                        "title": "Shortlist Roster Tracking & Gap Analysis",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Track shortlist drops and identify which target companies have selected you for live interviews.",
                        "tasks": [
                            "Update your Placement CRM / tracker with every announced interview shortlist.",
                            "Identify shortlists by Day: Day 1.1, Day 1.2, Day 2.1, Day 2.2, Day 3+.",
                            "For non-shortlists, evaluate fallback companies with rolling tests in mid-November.",
                            "Deep-dive into each shortlisted company's verified JAF, past questions, and tech stack."
                        ]
                    },
                    {
                        "id": "m_p1c_w2",
                        "week_label": "November (Week 2)",
                        "title": "Behavioral HR (STAR) & Resume Project Defense",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Perfect the 2-minute 'Tell me about yourself' pitch and defend every line on your resume.",
                        "tasks": [
                            "Draft structured STAR stories (Situation, Task, Action, Result) for 6 core behavioral questions.",
                            "Prepare technical deep dives on your 2 best projects (architecture, tradeoffs, what failed, metrics).",
                            "Practice explaining technical concepts simply to a non-technical manager.",
                            "Prepare customized answers for 'Why this company?' and 'What do you know about our product?'"
                        ]
                    },
                    {
                        "id": "m_p1c_w3",
                        "week_label": "November (Week 3)",
                        "title": "Full-Length Mock Interview Gauntlet",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Simulate 45-minute live technical and case interview pressure with seniors and AI platforms.",
                        "tasks": [
                            "Complete at least 5 live mock interviews with recently placed alumni / seniors.",
                            "Practice live code writing on a shared Google Doc / CoderPad without syntax highlighting.",
                            "Do timed case rounds with peers (15 minutes case cracking + 5 minutes synthesis).",
                            "Review past interview questions from our Placement Intelligence Dossier for each shortlisted firm."
                        ]
                    },
                    {
                        "id": "m_p1c_w4",
                        "week_label": "November (Week 4)",
                        "title": "D-Day Logistics, Wardrobe & Slot Hierarchy",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Finalize interview logistics, slot clash strategies, wardrobe, and mental calm.",
                        "tasks": [
                            "Submit slot conflict preferences to Department Placement Coordinators (DPCs).",
                            "Prepare interview wardrobe: dry-cleaned formal suit, ironed shirts, formal shoes, portfolio folder.",
                            "Print 10 physical copies of your Master CV (for in-person panel interviews).",
                            "Finalize sleep schedule: adjust circadian rhythm to be sharp for 7:00 AM Day 1.1 interviews."
                        ]
                    }
                ]
            },
            {
                "id": "phase-1d",
                "phase_code": "Phase 1D",
                "name": "D-Day Interviews (Day 1.1 to Day 15)",
                "subtitle": "The 15-Day Battle: Rapid Slots, Live Selections & Walk-in Shortlists",
                "season_group": "phase_1",
                "date_range": "December 1 – December 15, 2025",
                "duration_weeks": 2.5,
                "urgency_badge": "D-DAY INTERVIEWS",
                "accent_color": "emerald",
                "icon": "Briefcase",
                "summary": p1d_summary,
                "candidate_reality": "The legendary 15 days of IIT Bombay placements. 953 blog announcements are published in this short window! Over 323 interview shortlists, 58 slotting matrices, and 59 interim selection rosters are released. Day 1.1 begins at 7:00 AM sharp on December 1 (HFTs, Apple, Google, Microsoft, Qualcomm). Day 1.2 runs from 5:00 PM to 1:00 AM (Top Consultancies, FinTech, Core). Then Day 2 to Day 15 progress rapidly. As top candidates get placed, companies issue surprise 'Extended Shortlists' and 'Walk-in Shortlists' on the fly to fill open slots.",
                "mindset_advice": "Rejection on Day 1 is not the end; it is simply statistical variance. Over 65% of the total campus selections happen between Day 2 and Day 8! Stay calm, keep your phone with your DPC runner, and be ready when an extended shortlist calls your name.",
                "placement_cell_rules": [
                    "One-Candidate-One-Offer Rule: Once you receive an offer from any company, you are immediately deregistered and debarred from attending any further interviews.",
                    "Mandatory Offer Acceptance: You cannot reject an offer from a company you interviewed with; the first offer you receive is binding.",
                    "Runner Protocol: Placement Cell student runners will physically summon you from waiting rooms to interview panels. You must stay within designated interview zones.",
                    "Walk-In Interview Eligibility: Candidates present on waitlists can be called for instant walk-in interviews if shortlisted candidates accept competing offers.",
                ],
                "weekly_milestones": [
                    {
                        "id": "m_p1d_w1",
                        "week_label": "Day 1 (December 1)",
                        "title": "Day 1.1 & Day 1.2 Execution",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Survive the premier 18-hour sprint across Day 1.1 (7 AM – 3 PM) and Day 1.2 (5 PM – 1 AM).",
                        "tasks": [
                            "Arrive at interview holding lounge by 6:30 AM with CV copies and student ID.",
                            "Coordinate with your runner to sequence panel interviews according to slot priority.",
                            "Between rounds: drink water, eat high-protein snacks (nuts/energy bars), do not over-analyze mistakes.",
                            "If Day 1.1 concludes without an offer, take a 2-hour nap, reset completely, and enter Day 1.2 with fresh energy."
                        ]
                    },
                    {
                        "id": "m_p1d_w2",
                        "week_label": "Day 2 (December 2)",
                        "title": "Day 2 High-Growth Tech & Analytics Sprint",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Capitalize on high-volume hiring in Day 2.1 and Day 2.2 (Flipkart, Meesho, Micron, Zomato).",
                        "tasks": [
                            "Track Day 2 interim selection notices published on the placement blog.",
                            "Be alert for extended shortlists: companies frequently pull 5–10 extra candidates into Day 2 morning panels.",
                            "Demonstrate high energy: recruiters on Day 2 love candidates who show genuine enthusiasm for their product.",
                            "Review notes on behavioral questions: culture fit is heavily weighted on Day 2."
                        ]
                    },
                    {
                        "id": "m_p1d_w3",
                        "week_label": "Days 3–7 (December 3–7)",
                        "title": "Days 3 to 7: Bulk Hiring & Core Engineering Peak",
                        "tracks": ["core", "analytics", "sde"],
                        "priority": "HIGH",
                        "description": "Peak hiring window for Mechanical, Civil, Chemical, Aerospace, and mid-tier software firms.",
                        "tasks": [
                            "Attend scheduled interviews for Core Engineering MNCs (Tata, Reliance, L&T, Siemens, Schlumberger).",
                            "Monitor blog for daily 12:00 PM – 8:00 PM rolling slots.",
                            "Check in daily with your department placement coordinator for impromptu company openings.",
                            "Keep your resume polished and stay actively engaged."
                        ]
                    },
                    {
                        "id": "m_p1d_w4",
                        "week_label": "Days 8–15 (December 8–15)",
                        "title": "Days 8 to 15: Phase 1 Wrap-up & Extended Waves",
                        "tracks": ["sde", "core", "analytics"],
                        "priority": "HIGH",
                        "description": "Late Phase 1 opportunities, boutique firms, research labs, and initial PSU rounds.",
                        "tasks": [
                            "Complete remaining scheduled interviews across boutique tech and analytics startups.",
                            "If unplaced by Day 15, do not panic: winter break provides a valuable 6-week window to upgrade skills.",
                            "Debrief your interview performance with placement mentors to pinpoint exact areas of improvement.",
                            "Transition to winter break prep for Phase 2 kickoff in February."
                        ]
                    }
                ]
            },
            {
                "id": "phase-2",
                "phase_code": "Phase 2",
                "name": "Phase 2 & Spring Wave",
                "subtitle": "Winter Reset, Spring JAFs, PSUs, Startups & Rolling Selections",
                "season_group": "phase_2",
                "date_range": "January 1 – June 30, 2026",
                "duration_weeks": 24,
                "urgency_badge": "PHASE 2 SPRING",
                "accent_color": "cyan",
                "icon": "Compass",
                "summary": p2_summary,
                "candidate_reality": "Phase 2 spans the entire spring semester. Following a restful winter break in January, February brings a massive secondary wave: 135 blog posts, 65 new JAFs, 25 shortlists. High-growth startups, specialized AI research labs, PSU recruiters (ONGC, IOCL, BEL), and boutique consulting firms hire aggressively. Rolling interviews take place throughout February and March, extending until June for late offers and off-campus referrals.",
                "mindset_advice": "Many of IIT Bombay's most successful alumni were placed in Phase 2 in fast-growing startups and core PSUs. Companies in Phase 2 often have less rigid interview processes and value practical project experience far more than abstract competitive coding speed.",
                "placement_cell_rules": [
                    "Resume Unlock: Candidates are allowed to update and re-verify their resumes with new semester grades, BTP project deliverables, and winter research work.",
                    "PSU Eligibility Rules: Government PSUs mandate specific CGPA cutoffs and category reservation guidelines.",
                    "Continuous Rolling JAFs: JAFs in Phase 2 are posted on a rolling basis with shorter notice periods.",
                ],
                "weekly_milestones": [
                    {
                        "id": "m_p2_w1",
                        "week_label": "January (Winter Break)",
                        "title": "Winter Project Sprint & Resume Upgrade",
                        "tracks": ["sde", "quant", "consulting", "core", "analytics"],
                        "priority": "HIGH",
                        "description": "Rebuild your portfolio, add production projects or research papers, and re-freeze Phase 2 CV.",
                        "tasks": [
                            "Build an end-to-end full-stack or deep-learning project to showcase on GitHub.",
                            "Update your Master CV with semester 7/9 grades and latest BTP achievements.",
                            "Submit Phase 2 resume updates to Placement Cell during the January unlock window.",
                            "Target 50 LeetCode Mediums or specialized domain practice to rebuild rhythm."
                        ]
                    },
                    {
                        "id": "m_p2_w2",
                        "week_label": "February",
                        "title": "Phase 2 Spring Hiring Surge (65 JAFs)",
                        "tracks": ["sde", "consulting", "core", "analytics"],
                        "priority": "CRITICAL",
                        "description": "Capitalize on the February wave of startup JAFs and specialized consulting roles.",
                        "tasks": [
                            "Apply to all relevant Phase 2 JAFs (over 65 new companies open in February).",
                            "Attempt Phase 2 Online Assessments and assignment-based rounds.",
                            "Attend tech interviews with Series A/B funded tech startups and boutique firms.",
                            "Network directly with founders and senior engineers who visit campus."
                        ]
                    },
                    {
                        "id": "m_p2_w3",
                        "week_label": "March – April",
                        "title": "PSU Hiring & Niche Research Labs",
                        "tracks": ["core", "analytics"],
                        "priority": "HIGH",
                        "description": "Interviews for Government PSUs and specialized core engineering organizations.",
                        "tasks": [
                            "Verify eligibility and documentation for Public Sector Undertakings (PSUs).",
                            "Revise undergraduate gate-level fundamentals for PSU technical panels.",
                            "Participate in late-stage rolling drives and off-campus pool drives supported by the Placement Cell.",
                            "Secure final offer and submit official placement paperwork to conclude the season."
                        ]
                    }
                ]
            }
        ],
        "dday_slotting_playbook": {
            "title": "D-Day (Dec 1–15) Slotting & Multi-Shortlist Playbook",
            "description": "How IIT Bombay orchestrates the most competitive campus recruiting slots in India, and how candidates navigate multi-shortlist collisions.",
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
        },
        "track_guides": {
            "sde": {
                "title": "Software Engineering (SDE)",
                "icon": "Code2",
                "core_pillars": ["Data Structures & Algorithms", "System Design (HLD/LLD)", "OS / DBMS / Networks", "Object-Oriented Programming"],
                "key_advice": "Focus on high-speed problem solving. 80% of OAs test standard Dynamic Programming, Graph Traversal, and Trees. Do not over-index on rare competitive programming tricks at the expense of clean, bug-free implementation."
            },
            "quant": {
                "title": "Quantitative Finance & Trading (HFT)",
                "icon": "TrendingUp",
                "core_pillars": ["Probability Theory", "Mental Math & Speed Calculation", "Brain Teasers & Puzzles", "Modern C++ / Low Latency"],
                "key_advice": "Accuracy and speed are everything. Practice 80-question speed math tests (Zetamac). Master Bayes theorem, Markov chains, random walks, and expected value puzzles."
            },
            "consulting": {
                "title": "Management Consulting & Strategy",
                "icon": "Briefcase",
                "core_pillars": ["Market Entry & Sizing", "Profitability Frameworks", "Guesstimates", "Executive Presence & Communication"],
                "key_advice": "Practice cases out loud with peers, not by reading casebooks silently. Structure is 80% of the score. Always clarify objectives before jumping into root causes."
            },
            "core": {
                "title": "Core Engineering (Mech, Elec, Civil, Chem, Aero)",
                "icon": "Cog",
                "core_pillars": ["Departmental Fundamentals", "GATE-Level Problem Solving", "CAD / Simulation / Lab Tools", "Practical Project Defense"],
                "key_advice": "Be ready to draw diagrams and derive equations on whiteboard/paper. Panelists love asking about your summer training and final year project design choices."
            },
            "analytics": {
                "title": "Data Science, Analytics & AI/ML",
                "icon": "BarChart2",
                "core_pillars": ["SQL & Relational Algebra", "Python / Pandas / Scikit-Learn", "Applied Statistics & Hypothesis Testing", "Business Case Metrics"],
                "key_advice": "Expect live SQL coding tests with multiple joins, window functions (ROW_NUMBER, RANK), and group aggregations. Be prepared to explain your ML model's precision-recall tradeoffs."
            }
        }
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(roadmap_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated structured Season Roadmap at: {OUTPUT_PATH}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
