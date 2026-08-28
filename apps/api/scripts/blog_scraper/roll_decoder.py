"""
Deterministic Roll Number and Department Decoder for IIT Bombay
Decodes undergraduate and postgraduate roll numbers into:
- Department (CSE, EE, Mechanical, Civil, Chemical, etc.)
- Degree (B.Tech, Dual Degree, M.Tech, M.Des, B.Des, Ph.D)
- Department Cluster (Circuital, Core Engineering, Sciences & Quantitative, Design)
- Batch Year
"""

import re
from typing import Dict, List, Optional, Tuple

# Mapping for 2022 Batch B.Tech (22B[Prefix]xx) based on Division list & institutional intake
BTECH_22B_PREFIXES: Dict[str, str] = {
    "00": "Aerospace Engineering",
    "03": "Chemical Engineering",
    "04": "Chemical Engineering",
    "06": "Civil Engineering",
    "07": "Civil Engineering",
    "09": "Computer Science & Engineering",
    "10": "Computer Science & Engineering",
    "12": "Electrical Engineering",
    "13": "Electrical Engineering",
    "15": "Electrical Engineering",
    "18": "Mechanical Engineering",
    "21": "Mechanical Engineering",
    "22": "Mechanical Engineering",
    "24": "Metallurgical Engineering & Materials Science",
    "25": "Metallurgical Engineering & Materials Science",
    "27": "Energy Science & Engineering",
    "30": "Engineering Physics",
    "33": "Chemistry",
    "36": "Design",  # B.Des / IDC
    "39": "Economics",
    "42": "Earth Sciences",
    "45": "Mathematics",
}

# Standard IIT Bombay 2-digit Department Codes (used in Dual Degree & M.Tech)
IITB_DEPT_CODES: Dict[str, str] = {
    "01": "Aerospace Engineering",
    "02": "Chemical Engineering",
    "03": "Chemistry",
    "04": "Civil Engineering",
    "05": "Computer Science & Engineering",
    "06": "Earth Sciences",
    "07": "Electrical Engineering",
    "08": "Energy Science & Engineering",
    "09": "Computer Science & Engineering",
    "10": "Humanities & Social Sciences",
    "11": "Design",  # IDC
    "12": "Mathematics",
    "13": "Design",
    "14": "Mechanical Engineering",
    "15": "Metallurgical Engineering & Materials Science",
    "16": "Mechanical Engineering",
    "17": "Physics",
    "18": "Biosciences & Bioengineering",
    "19": "Earth Sciences",
    "20": "Energy Science & Engineering",
    "21": "Environmental Science & Engineering",
    "22": "Design",
    "24": "Metallurgical Engineering & Materials Science",
    "25": "IEOR",
    "30": "IEOR",
    "37": "Environmental Science & Engineering",
}

# M.Tech (24Mxx, 23Mxx) Department Code Groups
MTECH_DEPT_GROUPS: Dict[str, str] = {
    "00": "Aerospace Engineering",
    "01": "Aerospace Engineering",
    "02": "Chemical Engineering",
    "03": "Chemical Engineering",
    "04": "Civil Engineering",
    "05": "Civil Engineering",
    "06": "Civil Engineering",
    "07": "Computer Science & Engineering",
    "08": "Computer Science & Engineering",
    "09": "Computer Science & Engineering",
    "10": "Electrical Engineering",
    "11": "Electrical Engineering",
    "12": "Electrical Engineering",
    "13": "Electrical Engineering",
    "14": "Mechanical Engineering",
    "15": "Mechanical Engineering",
    "16": "Mechanical Engineering",
    "17": "Metallurgical Engineering & Materials Science",
    "18": "Biosciences & Bioengineering",
    "19": "Earth Sciences",
    "20": "Energy Science & Engineering",
    "21": "Environmental Science & Engineering",
    "22": "Design",
    "25": "IEOR",
}

# High-Level Department Cluster Classification
DEPARTMENT_CLUSTERS: Dict[str, str] = {
    "Computer Science & Engineering": "Circuital",
    "Electrical Engineering": "Circuital",
    "Mechanical Engineering": "Core Engineering",
    "Chemical Engineering": "Core Engineering",
    "Civil Engineering": "Core Engineering",
    "Aerospace Engineering": "Core Engineering",
    "Metallurgical Engineering & Materials Science": "Core Engineering",
    "Energy Science & Engineering": "Core Engineering",
    "Environmental Science & Engineering": "Core Engineering",
    "Engineering Physics": "Sciences & Quantitative",
    "Physics": "Sciences & Quantitative",
    "Chemistry": "Sciences & Quantitative",
    "Mathematics": "Sciences & Quantitative",
    "Economics": "Sciences & Quantitative",
    "IEOR": "Sciences & Quantitative",
    "Biosciences & Bioengineering": "Sciences & Quantitative",
    "Earth Sciences": "Sciences & Quantitative",
    "Humanities & Social Sciences": "Sciences & Quantitative",
    "Design": "Design",
}


def decode_roll(raw_roll: str) -> Optional[Dict[str, str]]:
    """
    Decodes a single IIT Bombay roll number string into its demographic components.
    Returns None if unparseable.
    """
    if not raw_roll:
        return None

    roll = raw_roll.strip().upper()

    # Case 1: 22Bxxxx format (B.Tech 2022 Batch)
    m_btech = re.match(r"^22B(\d{2})\d{2}$", roll)
    if m_btech:
        prefix = m_btech.group(1)
        dept = BTECH_22B_PREFIXES.get(prefix, "Engineering")
        return {
            "batch_year": "2022",
            "degree": "B.Tech",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Other"),
        }

    # Case 2: Older 9-digit B.Tech format e.g. 210050045, 200020033
    m_9digit = re.match(r"^(\d{2})00(\d{2})\d{3}$", roll)
    if m_9digit:
        year = "20" + m_9digit.group(1)
        dept_code = m_9digit.group(2)
        dept = IITB_DEPT_CODES.get(dept_code, "Engineering")
        return {
            "batch_year": year,
            "degree": "B.Tech",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Other"),
        }

    # Case 3: Dual Degree e.g. 21D070044, 21D110007, 21D170041
    m_dual = re.match(r"^(\d{2})D(\d{2})\d{4,5}$", roll)
    if m_dual:
        year = "20" + m_dual.group(1)
        dept_code = m_dual.group(2)
        dept = IITB_DEPT_CODES.get(dept_code, "Engineering")
        return {
            "batch_year": year,
            "degree": "Dual Degree",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Other"),
        }

    # Case 4: M.Tech 24Mxxxx, 23Mxxxx e.g. 24M0211, 24M1194, 24M1647
    m_mtech = re.match(r"^(\d{2})M(\d{2})\d{2,3}$", roll)
    if m_mtech:
        year = "20" + m_mtech.group(1)
        code = m_mtech.group(2)
        dept = MTECH_DEPT_GROUPS.get(code, IITB_DEPT_CODES.get(code, "Engineering"))
        return {
            "batch_year": year,
            "degree": "M.Tech",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Other"),
        }

    # Case 5: M.S. / M.Sc. 24Nxxxx, 23Nxxxx e.g. 24N0080, 24N0305
    m_ms = re.match(r"^(\d{2})N(\d{2})\d{2,3}$", roll)
    if m_ms:
        year = "20" + m_ms.group(1)
        code = m_ms.group(2)
        dept = MTECH_DEPT_GROUPS.get(code, IITB_DEPT_CODES.get(code, "Sciences & Engineering"))
        return {
            "batch_year": year,
            "degree": "M.S. / M.Sc.",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Sciences & Quantitative"),
        }

    # Case 6: B.Des / IDC 21U13xxxx, 22B36xx
    m_des = re.match(r"^(\d{2})U13\d{4}$", roll)
    if m_des:
        year = "20" + m_des.group(1)
        return {
            "batch_year": year,
            "degree": "B.Des",
            "department": "Design",
            "cluster": "Design",
        }

    return None


def aggregate_candidate_demographics(roll_list: List[str]) -> Dict:
    """
    Given a list of raw roll numbers from a shortlist/selection post,
    decodes them in-memory, scrubs individual roll numbers, and returns
    aggregated statistical percentages.
    """
    total_count = len(roll_list)
    if total_count == 0:
        return {
            "total_candidates": 0,
            "department_breakdown": {},
            "degree_breakdown": {},
            "cluster_breakdown": {},
        }

    dept_counts: Dict[str, int] = {}
    degree_counts: Dict[str, int] = {}
    cluster_counts: Dict[str, int] = {}

    resolved = 0
    for roll in roll_list:
        decoded = decode_roll(roll)
        if decoded:
            resolved += 1
            d = decoded["department"]
            deg = decoded["degree"]
            cl = decoded["cluster"]

            dept_counts[d] = dept_counts.get(d, 0) + 1
            degree_counts[deg] = degree_counts.get(deg, 0) + 1
            cluster_counts[cl] = cluster_counts.get(cl, 0) + 1

    # If some rolls could not be matched, classify as Unspecified
    unresolved = total_count - resolved
    if unresolved > 0:
        dept_counts["Other / Unspecified"] = unresolved
        degree_counts["Unspecified"] = unresolved
        cluster_counts["Other"] = cluster_counts.get("Other", 0) + unresolved

    # Compute percentages rounded to 1 decimal place
    dept_pct = {
        k: round((v / total_count) * 100, 1)
        for k, v in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)
    }
    degree_pct = {
        k: round((v / total_count) * 100, 1)
        for k, v in sorted(degree_counts.items(), key=lambda x: x[1], reverse=True)
    }
    cluster_pct = {
        k: round((v / total_count) * 100, 1)
        for k, v in sorted(cluster_counts.items(), key=lambda x: x[1], reverse=True)
    }

    return {
        "total_candidates": total_count,
        "resolved_candidates": resolved,
        "department_breakdown": dept_pct,
        "degree_breakdown": degree_pct,
        "cluster_breakdown": cluster_pct,
    }
