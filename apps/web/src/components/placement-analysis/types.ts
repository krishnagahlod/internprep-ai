export interface Compensation {
  original_currency: string;
  ctc_min: number;
  ctc_max: number;
  ctc_median: number;
  inhand_median: number;
  ctc_inr_equivalent: number;
  inhand_inr_equivalent: number;
  is_international: boolean;
}

export interface CategorizedKeywords {
  all: string[];
  languages: string[];
  frameworks_and_tools: string[];
  core_concepts: string[];
  leadership: string[];
}

export interface RoleIntelligence {
  difficulty_score: number;
  difficulty_tier: string;
  key_selection_hurdle: string;
  resume_power_tip: string;
  topic_weightage: {
    dsa_and_problem_solving: number;
    system_and_domain_design: number;
    case_and_business_sense: number;
    resume_and_leadership_fit: number;
  };
}

export interface RoleOffer {
  id: string;
  job_title: string;
  primary_sector: string;
  raw_job_sector?: string;
  session_sheet: string;
  session_label: string;
  ctc_inr: number;
  inhand_inr: number;
  currency: string;
  is_international: boolean;
  location: string;
  category_tier?: string;
  selection_rounds_count: number;
  required_skills: string[];
}

export interface PlacementRole {
  id: string;
  company_name: string;
  company_slug: string;
  job_title: string;
  session_sheet: string;
  session_label: string;
  primary_sector: string;
  raw_job_sector: string;
  location: string;
  category_tier: string;
  currency: string;
  compensation: Compensation;
  role_summary: string;
  required_skills: string[];
  categorized_keywords?: CategorizedKeywords;
  responsibilities: string[];
  selection_rounds: string[];
  perks_and_benefits: string[];
  additional_info_raw: string;
  raw_jd: string;
  intelligence?: RoleIntelligence;
}

export interface SelectionInsights {
  matched_company_name: string;
  domain: string;
  test_details: string;
  interview_details: string;
  questions_asked: string[];
  recommended_electives_projects: string[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  primary_sector: string;
  tier_category: string;
  is_hiring_24_25: boolean;
  is_hiring_25_26: boolean;
  has_phase_1?: boolean;
  has_phase_2?: boolean;
  has_24_25?: boolean;
  roles_count: number;
  available_roles?: string[];
  highest_ctc_inr: number;
  highest_inhand_inr: number;
  display_highest_ctc_inr?: number;
  display_highest_inhand_inr?: number;
  sector_roles_count?: number;
  role_offers?: RoleOffer[];
  median_ctc_inr: number;
  dominant_currency: string;
  has_international_offers: boolean;
  locations: string[];
  top_skills?: string[];
  roles: string[];
  selection_insights: SelectionInsights | null;
  has_authentic_insights?: boolean;
  selection_blueprint?: {
    has_authentic_student_data: boolean;
    online_test_details: string;
    interview_details: string;
    questions_asked: string[];
    recommended_electives_projects: string[];
  };
  hiring_funnel_intelligence?: HiringFunnelIntelligence | null;
  placement_slot?: string | null;
  slot_timing?: string | null;
  has_assignment_deck_round?: boolean;
  assignment_details?: string | null;
  has_group_discussion?: boolean;
  gd_details?: string | null;
  bond_applicable?: boolean | null;
  bond_details?: string | null;
  ai_overview: string;
  difficulty_score?: number;
  difficulty_tier?: string;
  interview_shortlists?: CompanyInterviewShortlist | null;
}

export interface ShortlistedCandidate {
  name: string;
  roll_number: string;
  branch: string;
  degree: string;
  cluster: string;
  role: string;
  round?: string;
  date: string;
}

export interface BranchShortlistGroup {
  branch: string;
  count: number;
  candidates: ShortlistedCandidate[];
}

export interface CompanyInterviewShortlist {
  company_name: string;
  slug: string;
  total_shortlisted: number;
  total_candidates?: number;
  branches_count?: number;
  branches: BranchShortlistGroup[];
  degrees_breakdown?: Record<string, number>;
  roles_breakdown?: Record<string, number>;
  all_candidates: ShortlistedCandidate[];
  message?: string;
}

export interface HiringFunnelIntelligence {
  slug: string;
  company_name: string;
  total_updates: number;
  hiring_phases: string[];
  slots_recorded: string[];
  has_walkins: boolean;
  placement_slot?: string | null;
  slot_timing?: string | null;
  has_assignment_deck_round?: boolean;
  assignment_details?: string | null;
  has_group_discussion?: boolean;
  gd_details?: string | null;
  bond_applicable?: boolean | null;
  bond_details?: string | null;
  cpi_criteria: {
    cutoff_stated: string;
    bonus_jaf_allowed: boolean;
  };
  online_assessment: {
    platform: string;
    mode: string;
    venue?: string | null;
    duration_minutes: number | null;
    test_format?: string;
    special_instructions: string[];
  };
  conversion_funnel: {
    oa_shortlisted_count: number;
    interview_shortlisted_count: number;
    final_selected_count: number;
    walkin_extended_shortlists_count: number;
    oa_to_interview_conversion_pct: number | null;
    interview_to_offer_conversion_pct: number | null;
  };
  demographics: {
    branch_distribution: Record<string, number>;
    degree_distribution: Record<string, number>;
    cluster_breakdown: Record<string, number>;
  };
  recruitment_timeline: Array<{
    date: string;
    phase?: string;
    stage: string;
    headline: string;
  }>;
}

export interface PlatformStats {
  total_companies: number;
  total_roles: number;
  highest_ctc_inr: number;
  median_ctc_inr: number;
  international_offers_count: number;
  sectors_breakdown: Record<
    string,
    {
      companies_count: number;
      roles_count: number;
      median_ctc_inr: number;
      highest_ctc_inr: number;
    }
  >;
}

export interface WhitelistedUser {
  email: string;
  role: string;
  notes?: string;
  granted_at?: string;
  granted_by?: string;
}

export interface ResumeMatchResult {
  match_score: number;
  match_rating: string;
  matched_skills: string[];
  missing_critical_skills: string[];
  tailored_resume_bullets: string[];
}

export interface SalaryBreakdownResult {
  ctc_inr: number;
  base_pay_annual: number;
  variable_bonus_annual: number;
  esops_annual: number;
  estimated_monthly_gross: number;
  estimated_monthly_net_inhand: number;
  estimated_annual_tax: number;
  estimated_annual_epf: number;
  vesting_schedule: string;
}

export type CRMMilestone =
  | "interested"
  | "jaf_filled"
  | "oa_submitted"
  | "interview_shortlisted"
  | "offer_received";

export interface CRMCompanyItem {
  slug: string;
  company_name: string;
  sector: string;
  tier: string;
  highest_ctc_inr: number;
  priority: "dream" | "target" | "backup";
  milestone: CRMMilestone;
  notes: string;
  added_at: string;
}

export const MILESTONE_CONFIG: Record<
  CRMMilestone,
  { label: string; badgeClass: string; icon: string }
> = {
  interested: {
    label: "Interested",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: "📌",
  },
  jaf_filled: {
    label: "JAF Filled",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: "📝",
  },
  oa_submitted: {
    label: "OA / Test Submitted",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: "⚡",
  },
  interview_shortlisted: {
    label: "Interview Shortlist",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: "🎯",
  },
  offer_received: {
    label: "Offer Received",
    badgeClass:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 font-bold",
    icon: "🏆",
  },
};

export const SECTOR_TABS = [
  "All Sectors",
  "Product Management",
  "Software & Engineering",
  "Finance & Quant",
  "Consulting & Strategy",
  "AI, ML & Data Science",
  "Core Engineering & Technology",
  "FMCG & Operations",
  "Design & UI/UX",
];

export const POPULAR_SKILLS = [
  "All Skills",
  "Product Roadmap",
  "PRD Writing",
  "A/B Testing",
  "Python",
  "C++",
  "Low-Latency",
  "Distributed Systems",
  "PyTorch",
  "System Design",
  "SQL",
  "Statistical Arbitrage",
  "Guesstimates",
  "Kafka",
  "Docker",
  "VLSI Design",
];

export const DAY_SLOT_OPTIONS = [
  "All Slots",
  "Day 1.1",
  "Day 1.2",
  "Day 2.1",
  "Day 2.2",
  "Day 2",
  "Day 3–5",
  "Day 6+",
];

export interface RoadmapPhaseMilestone {
  id: string;
  week_label: string;
  title: string;
  tracks: string[];
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  description: string;
  tasks: string[];
}

export interface RoadmapFeaturedAnnouncement {
  title: string;
  date: string;
  category: string;
  company: string;
  snippet: string;
  timestamp: string | null;
}

export interface RoadmapPhaseSummary {
  total_posts: number;
  jafs_count: number;
  oas_count: number;
  shortlists_count: number;
  ppts_count: number;
  selections_count: number;
  active_companies_count: number;
  sample_companies: string[];
  featured_announcements: RoadmapFeaturedAnnouncement[];
}

export interface RoadmapPhase {
  id: string;
  phase_code: string;
  name: string;
  subtitle: string;
  season_group: "phase_1" | "phase_2";
  date_range: string;
  duration_weeks: number;
  urgency_badge: string;
  accent_color: string;
  icon: string;
  summary: RoadmapPhaseSummary;
  candidate_reality: string;
  mindset_advice: string;
  placement_cell_rules: string[];
  weekly_milestones: RoadmapPhaseMilestone[];
}

export interface RoadmapSlot {
  slot_code: string;
  timing: string;
  prestige: string;
  characteristics: string;
  historical_recruiters: string[];
  collision_strategy: string;
}

export interface RoadmapCollisionRule {
  scenario: string;
  protocol: string;
}

export interface RoadmapTrackGuide {
  title: string;
  icon: string;
  core_pillars: string[];
  key_advice: string;
}

export interface SeasonRoadmapData {
  season_overview: {
    title: string;
    total_announcements: number;
    phase1_announcements: number;
    phase2_announcements: number;
    kickoff_date: string;
    dday_start: string;
    dday_slot_1_start: string;
    phase1_end: string;
    season_end: string;
    historical_verified_candidates_placed: number;
  };
  phases: RoadmapPhase[];
  dday_slotting_playbook: {
    title: string;
    description: string;
    slots: RoadmapSlot[];
    collision_rules: RoadmapCollisionRule[];
  };
  track_guides: Record<string, RoadmapTrackGuide>;
}

