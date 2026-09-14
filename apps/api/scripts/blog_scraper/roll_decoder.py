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
    "05": "Aerospace Engineering",  # Blog typo e.g. 22B0523 Vedant Parkhe
    "06": "Civil Engineering",
    "07": "Civil Engineering",
    "08": "Energy Science & Engineering",
    "09": "Computer Science & Engineering",
    "10": "Computer Science & Engineering",
    "11": "Electrical Engineering",
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

# Standard IIT Bombay 2-digit Department Codes (used in Dual Degree & general departments)
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
    "26": "Systems & Control Engineering",
    "30": "IEOR",
    "37": "Environmental Science & Engineering",
    "80": "Engineering",
}

# Dual Degree (21Dxx, 20Dxx) Department Code Mapping
DUAL_DEGREE_DEPT_CODES: Dict[str, str] = {
    "01": "Aerospace Engineering",
    "02": "Chemical Engineering",
    "04": "Civil Engineering",
    "05": "Computer Science & Engineering",
    "07": "Electrical Engineering",
    "08": "Energy Science & Engineering",
    "10": "Metallurgical Engineering & Materials Science",
    "11": "Mechanical Engineering",
    "12": "Mathematics",
    "13": "Design",
    "14": "Mechanical Engineering",
    "15": "Metallurgical Engineering & Materials Science",
    "16": "Mechanical Engineering",
    "17": "Mechanical Engineering",
    "18": "Biosciences & Bioengineering",
    "19": "Earth Sciences",
    "20": "Energy Science & Engineering",
    "21": "Environmental Science & Engineering",
    "22": "Design",
    "24": "Metallurgical Engineering & Materials Science",
    "25": "IEOR",
    "30": "IEOR",
    "37": "Environmental Science & Engineering",
    "80": "Engineering",
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
    "24": "Metallurgical Engineering & Materials Science",
    "25": "IEOR",
    "26": "Systems & Control Engineering",
    "30": "IEOR",
    "31": "Earth Sciences",
    "32": "Civil Engineering",
    "33": "Educational Technology",
}

# M.Sc. (24Nxx, 23Nxx) Department Code Groups (JAM Admissions)
MSC_DEPT_GROUPS: Dict[str, str] = {
    "00": "Applied Statistics & Informatics",
    "01": "Mathematics",
    "02": "Chemistry",
    "03": "Biotechnology",
    "04": "Physics",
    "05": "Applied Geology",
    "06": "Applied Geophysics",
}

# High-Level Department Cluster Classification
DEPARTMENT_CLUSTERS: Dict[str, str] = {
    "Computer Science & Engineering": "Circuital",
    "Electrical Engineering": "Circuital",
    "Systems & Control Engineering": "Circuital",
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
    "Applied Statistics & Informatics": "Sciences & Quantitative",
    "Biotechnology": "Sciences & Quantitative",
    "Applied Geology": "Sciences & Quantitative",
    "Applied Geophysics": "Sciences & Quantitative",
    "Biosciences & Bioengineering": "Sciences & Quantitative",
    "Earth Sciences": "Sciences & Quantitative",
    "Educational Technology": "Sciences & Quantitative",
    "Humanities & Social Sciences": "Sciences & Quantitative",
    "Design": "Design",
    "M.Tech": "Core Engineering",
    "M.Sc.": "Sciences & Quantitative",
    "Engineering": "Core Engineering",
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
        deg = "B.Des" if prefix == "36" else "B.Tech"
        return {
            "batch_year": "2022",
            "degree": deg,
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Core Engineering"),
        }

    # Case 2: Dual Degree e.g. 21D070044, 21D110007, 21D170041, 21D80038
    m_dual = re.match(r"^(\d{2})D(\d{2})\d{3,5}$", roll)
    if m_dual:
        year = "20" + m_dual.group(1)
        dept_code = m_dual.group(2)
        dept = DUAL_DEGREE_DEPT_CODES.get(dept_code, IITB_DEPT_CODES.get(dept_code, "Engineering"))
        return {
            "batch_year": year,
            "degree": "Dual Degree",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Core Engineering"),
        }

    # Case 3: 9-digit Dual Degree/B.Tech format (21001xxxx, 21005xxxx, 21010xxxx, 21026xxxx, 200110102, etc.)
    m_9digit_21 = re.match(r"^(\d{2})0(\d{2})\d{4}$", roll)
    if m_9digit_21:
        year = "20" + m_9digit_21.group(1)
        prefix_code = m_9digit_21.group(2)
        dept_9digit_map = {
            "01": "Aerospace Engineering",
            "02": "Chemical Engineering",
            "04": "Civil Engineering",
            "05": "Computer Science & Engineering",
            "07": "Electrical Engineering",
            "10": "Mechanical Engineering",
            "11": "Metallurgical Engineering & Materials Science",
            "26": "Energy Science & Engineering",
        }
        dept = dept_9digit_map.get(prefix_code, DUAL_DEGREE_DEPT_CODES.get(prefix_code, "Engineering"))
        deg = "Dual Degree" if year == "2021" else "Dual Degree"
        return {
            "batch_year": year,
            "degree": deg,
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Core Engineering"),
        }

    # Case 4: 9-digit rolls starting with 204... or 214... (Dual Degree candidates who sat this season)
    m_4series = re.match(r"^(\d{2})4(\d{2})\d{4}$", roll)
    if m_4series:
        year = "20" + m_4series.group(1)
        dept_code = m_4series.group(2)
        dept_4_map = {
            "01": "Aerospace Engineering",
            "02": "Chemical Engineering",
            "04": "Civil Engineering",
            "05": "Computer Science & Engineering",
            "07": "Electrical Engineering",
            "10": "Mechanical Engineering",
            "11": "Metallurgical Engineering & Materials Science",
            "12": "Mathematics",
            "17": "Physics",
            "18": "Biosciences & Bioengineering",
            "26": "Energy Science & Engineering",
            "35": "Engineering",
            "36": "Engineering",
        }
        dept = dept_4_map.get(dept_code, IITB_DEPT_CODES.get(dept_code, "Engineering"))
        return {
            "batch_year": year,
            "degree": "Dual Degree",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Core Engineering"),
        }

    # Case 5: Generic 9-digit format e.g. 200020033, 210020045
    m_9digit_gen = re.match(r"^(\d{2})00(\d{2})\d{3}$", roll)
    if m_9digit_gen:
        year = "20" + m_9digit_gen.group(1)
        dept_code = m_9digit_gen.group(2)
        dept = DUAL_DEGREE_DEPT_CODES.get(dept_code, IITB_DEPT_CODES.get(dept_code, "Engineering"))
        return {
            "batch_year": year,
            "degree": "Dual Degree" if year == "2021" else "B.Tech",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Core Engineering"),
        }

    # Case 6: M.Tech 24Mxxxx, 23Mxxxx e.g. 24M0211, 24M1194, 24M1647
    m_mtech = re.match(r"^(\d{2})M(\d{2})\d{2,3}$", roll)
    if m_mtech:
        year = "20" + m_mtech.group(1)
        code = m_mtech.group(2)
        dept = MTECH_DEPT_GROUPS.get(code, "M.Tech")
        return {
            "batch_year": year,
            "degree": "M.Tech",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Core Engineering"),
        }

    # Case 7: M.Sc. 24Nxxxx, 23Nxxxx e.g. 24N0080, 24N0305
    m_ms = re.match(r"^(\d{2})N(\d{2})\d{2,3}$", roll)
    if m_ms:
        year = "20" + m_ms.group(1)
        code = m_ms.group(2)
        dept = MSC_DEPT_GROUPS.get(code, "M.Sc.")
        return {
            "batch_year": year,
            "degree": "M.Sc.",
            "department": dept,
            "cluster": DEPARTMENT_CLUSTERS.get(dept, "Sciences & Quantitative"),
        }

    # Case 8: B.Des / IDC 21U13xxxx
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
