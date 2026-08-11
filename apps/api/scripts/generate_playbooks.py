import os
import json

# Define the directory for playbooks
PLAYBOOKS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "strategy_playbooks"))

if not os.path.exists(PLAYBOOKS_DIR):
    os.makedirs(PLAYBOOKS_DIR)

# Common Phrasing Rules
COMMON_PHRASING_RULES = [
    "Every bullet must pass the 'So What?' test \u2014 state the result, not just the action.",
    "Lead with non-repetitive power verbs: Spearheaded, Orchestrated, Synthesized, Catalyzed.",
    "Include at least one quantified metric per experience/POR point.",
    "Use the Action + Context + Impact structure consistently.",
    "Keep each bullet to exactly 1 line on a standard template.",
    "Do not use full stops at the end of bullet points.",
    "Avoid explaining too much in a single point; focus on the outcome."
]

# Base Competency Themes
COMPETENCY_THEMES = {
    "leadership_stakeholder_mgmt": {
        "description": "Demonstrated ability to lead teams, manage stakeholders, and drive organizational change.",
        "signal_phrases": ["Led a team of", "Managed stakeholder expectations", "Coordinated with cross-functional teams"]
    },
    "strategic_problem_solving": {
        "description": "Evidence of structured, analytical thinking applied to real-world problems.",
        "signal_phrases": ["Identified root cause", "Developed a framework", "Synthesized findings", "Formulated strategy"]
    },
    "financial_quantitative_rigor": {
        "description": "Presence of hard metrics, financial figures, and data-driven outcomes.",
        "signal_phrases": ["$X revenue", "X% improvement", "ROI of X", "Analyzed dataset"]
    },
    "product_technical_execution": {
        "description": "Technical skills used as a means to business ends, or core technical delivery.",
        "signal_phrases": ["Built a dashboard", "Automated a pipeline", "Deployed model", "Engineered architecture"]
    },
    "entrepreneurial_ownership": {
        "description": "Self-started initiatives, side projects, or entrepreneurial ventures.",
        "signal_phrases": ["Founded", "Launched", "Bootstrapped", "Initiated"]
    }
}

# Domain specific configurations
DOMAINS = {
    "consulting": {
        "display_name": "Management Consulting",
        "resume_format": "1-page",
        "section_allocation": {
            "experience": {
                "priority": "critical",
                "guidance": "2-3 internship entries, 3-5 sub-points each. Every point must demonstrate business impact with quantified metrics. Lead with ownership verbs (Spearheaded, Drove, Led).",
                "emphasis": ["quantified_impact", "ownership", "cross_functional_collaboration"],
                "common_mistakes": ["Too many technical details without business impact", "Using passive voice"]
            },
            "projects": {
                "priority": "high",
                "guidance": "2-3 projects max. Prioritize projects showing analytical/problem-solving skills over pure coding projects. Always include methodology + result.",
                "emphasis": ["analytical_methodology", "structured_problem_solving", "data_driven_decisions"],
                "common_mistakes": ["Listing tech stack without impact", "Including coursework projects with no unique contribution"]
            },
            "por": {
                "priority": "very_high",
                "guidance": "2-4 PORs. This section is disproportionately important for consulting. Focus on scale (team size, budget, event footfall) and unique initiatives.",
                "emphasis": ["leadership_at_scale", "stakeholder_management", "initiative_ownership"],
                "common_mistakes": ["Listing responsibilities instead of initiatives", "Not quantifying team/budget scale"]
            },
            "scholastic": {
                "priority": "medium",
                "guidance": "3-5 punchy phrases. Include JEE rank, olympiad selections, and academic awards.",
                "emphasis": ["competitive_rankings", "academic_excellence"],
                "common_mistakes": ["Full sentences instead of concise phrases"]
            },
            "extracurricular": {
                "priority": "medium",
                "guidance": "Show breadth and depth. Sports achievements (Inter-IIT, national level) are valued. Cultural/social impact initiatives add well-roundedness.",
                "emphasis": ["competitive_achievements", "breadth_of_interests"],
                "common_mistakes": ["Listing hobbies without achievements"]
            }
        },
        "competency_weights": {
            "leadership_stakeholder_mgmt": 0.35,
            "strategic_problem_solving": 0.30,
            "financial_quantitative_rigor": 0.20,
            "product_technical_execution": 0.05,
            "entrepreneurial_ownership": 0.10
        }
    },
    "finance": {
        "display_name": "Finance (IB/PE/VC/Quant)",
        "resume_format": "1-page",
        "section_allocation": {
            "experience": {
                "priority": "critical",
                "guidance": "Focus on deal flow, financial modeling, valuation, market research, or quantitative analysis. Quantify capital raised, portfolio sizes, or trading volume.",
                "emphasis": ["financial_impact", "modeling_valuation", "market_research"],
                "common_mistakes": ["Vague market research without actionable insights"]
            },
            "projects": {
                "priority": "high",
                "guidance": "Highlight independent financial modeling, stock pitch projects, algorithmic trading, or macro-economic research.",
                "emphasis": ["analytical_rigor", "financial_metrics"],
                "common_mistakes": ["Lacking complexity in financial models"]
            },
            "por": {
                "priority": "medium",
                "guidance": "Highlight roles involving budget management (e.g., Treasurer) or leadership in Finance Clubs/Investment Groups.",
                "emphasis": ["budget_management", "financial_leadership"],
                "common_mistakes": ["Over-indexing on event management instead of financial responsibility"]
            },
            "scholastic": {
                "priority": "very_high",
                "guidance": "Extremely important. Highlight top percentiles (JEE, Olympiads), CFA/FRM levels passed, or high CPI/GPA.",
                "emphasis": ["certifications", "extreme_academic_rigor"],
                "common_mistakes": ["Burying CFA/FRM certifications at the bottom"]
            },
            "extracurricular": {
                "priority": "low",
                "guidance": "Include only highly competitive achievements (e.g., national level chess, poker, or major sports).",
                "emphasis": ["competitive_excellence"],
                "common_mistakes": ["Including generic participation certificates"]
            }
        },
        "competency_weights": {
            "leadership_stakeholder_mgmt": 0.15,
            "strategic_problem_solving": 0.25,
            "financial_quantitative_rigor": 0.45,
            "product_technical_execution": 0.10,
            "entrepreneurial_ownership": 0.05
        }
    },
    "product_management": {
        "display_name": "Product Management",
        "resume_format": "1-page",
        "section_allocation": {
            "experience": {
                "priority": "critical",
                "guidance": "Highlight product launches, feature development, A/B testing, and user growth. Focus on 'Why' a feature was built and its metric impact (DAU/MAU, conversion).",
                "emphasis": ["user_impact", "feature_launch", "cross_functional"],
                "common_mistakes": ["Focusing only on the engineering/code rather than the product outcome"]
            },
            "projects": {
                "priority": "very_high",
                "guidance": "Showcase end-to-end product builds (design to deployment). Include user research, wireframing, and go-to-market strategies.",
                "emphasis": ["end_to_end_execution", "user_centric_design"],
                "common_mistakes": ["Listing hackathon projects without explaining the user problem solved"]
            },
            "por": {
                "priority": "high",
                "guidance": "Highlight roles where you managed a team of developers/designers (e.g., Tech Coordinator) or launched a new initiative for the campus.",
                "emphasis": ["team_management", "initiative_launch"],
                "common_mistakes": ["Focusing on logistics rather than product/initiative delivery"]
            },
            "scholastic": {
                "priority": "low",
                "guidance": "Keep it brief. PM roles value execution and intuition over pure academic pedigree.",
                "emphasis": ["relevant_coursework"],
                "common_mistakes": ["Taking up too much space with minor academic awards"]
            },
            "extracurricular": {
                "priority": "medium",
                "guidance": "Showcase entrepreneurial ventures, hackathon wins, or design/creative pursuits.",
                "emphasis": ["entrepreneurial_spirit", "hackathons"],
                "common_mistakes": ["Generic hobbies"]
            }
        },
        "competency_weights": {
            "leadership_stakeholder_mgmt": 0.25,
            "strategic_problem_solving": 0.25,
            "financial_quantitative_rigor": 0.15,
            "product_technical_execution": 0.20,
            "entrepreneurial_ownership": 0.15
        }
    },
    "analytics": {
        "display_name": "Data Science & Analytics",
        "resume_format": "1-page or 2-page",
        "section_allocation": {
            "experience": {
                "priority": "critical",
                "guidance": "Focus on data pipelines, predictive modeling, and business insights. Must explicitly state the tech stack used (Python, SQL, Tableau) and the business impact of the model.",
                "emphasis": ["data_driven_insights", "model_accuracy", "tech_stack"],
                "common_mistakes": ["Listing tools without context", "Not mentioning the business ROI of an analysis"]
            },
            "projects": {
                "priority": "critical",
                "guidance": "The core of an Analytics resume. Detail the dataset size, algorithms used (e.g., XGBoost, NLP), and the performance metrics (Accuracy, F1-score, RMSE).",
                "emphasis": ["algorithmic_complexity", "large_datasets", "performance_metrics"],
                "common_mistakes": ["Using generic datasets like Titanic without unique methodology"]
            },
            "por": {
                "priority": "low",
                "guidance": "Only relevant if you led an analytics team, club, or organized a data hackathon.",
                "emphasis": ["technical_leadership"],
                "common_mistakes": ["Wasting space on non-technical PORs"]
            },
            "scholastic": {
                "priority": "high",
                "guidance": "Highlight statistics, ML, and math coursework. Mention relevant Kaggle ranks or data hackathon wins.",
                "emphasis": ["kaggle_ranks", "ml_coursework"],
                "common_mistakes": ["Listing basic introductory courses"]
            },
            "extracurricular": {
                "priority": "low",
                "guidance": "Keep minimal. Replace with more projects if possible.",
                "emphasis": [],
                "common_mistakes": ["Listing sports/cultural events over technical achievements"]
            }
        },
        "competency_weights": {
            "leadership_stakeholder_mgmt": 0.05,
            "strategic_problem_solving": 0.20,
            "financial_quantitative_rigor": 0.40,
            "product_technical_execution": 0.30,
            "entrepreneurial_ownership": 0.05
        }
    },
    "software": {
        "display_name": "Software Engineering (IT)",
        "resume_format": "1-page or 2-page",
        "section_allocation": {
            "experience": {
                "priority": "critical",
                "guidance": "Focus on architecture, scale, and performance improvements. Use strict formatting: 'Action + Methodology/Tech + Result (Latency reduced by X ms, handled Y TPS)'.",
                "emphasis": ["system_design", "performance_optimization", "tech_stack"],
                "common_mistakes": ["Writing 'Worked on backend' instead of 'Architected REST APIs using Node.js'"]
            },
            "projects": {
                "priority": "critical",
                "guidance": "Highlight complex, deployed systems. Open-source contributions (GSoC) and major BTPs are highly valued. Include GitHub links if possible.",
                "emphasis": ["open_source", "deployed_systems", "complex_architecture"],
                "common_mistakes": ["Listing simple CRUD apps with no users or scale"]
            },
            "por": {
                "priority": "low",
                "guidance": "Focus on Tech Team leads (e.g., Web & Coding Club Manager, Techfest Coordinator).",
                "emphasis": ["tech_team_management"],
                "common_mistakes": ["Including non-technical event management"]
            },
            "scholastic": {
                "priority": "medium",
                "guidance": "Highlight Competitive Programming ranks (Codeforces, ICPC), Hackathon wins, and core CS coursework.",
                "emphasis": ["competitive_programming", "hackathon_wins"],
                "common_mistakes": ["Not mentioning LeetCode/Codeforces handles if they are strong"]
            },
            "extracurricular": {
                "priority": "low",
                "guidance": "Keep minimal. Use space for more technical projects.",
                "emphasis": [],
                "common_mistakes": []
            }
        },
        "competency_weights": {
            "leadership_stakeholder_mgmt": 0.05,
            "strategic_problem_solving": 0.15,
            "financial_quantitative_rigor": 0.10,
            "product_technical_execution": 0.65,
            "entrepreneurial_ownership": 0.05
        }
    }
}

def generate():
    for domain, data in DOMAINS.items():
        playbook = {
            "domain": domain,
            "display_name": data["display_name"],
            "resume_format": data["resume_format"],
            "section_allocation": data["section_allocation"],
            "competency_themes": {},
            "phrasing_rules": COMMON_PHRASING_RULES
        }
        
        # Populate competency themes with weights
        for theme, weight in data["competency_weights"].items():
            playbook["competency_themes"][theme] = {
                "weight": weight,
                **COMPETENCY_THEMES[theme]
            }
            
        file_path = os.path.join(PLAYBOOKS_DIR, f"{domain}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(playbook, f, indent=2)
        
        print(f"Generated playbook: {file_path}")

if __name__ == "__main__":
    generate()
