import { InterviewPhase } from "@/components/interview/types";

export type AccenturePracticeMode =
  | "full_simulation"
  | "case_ai_drill"
  | "resume_defense_drill"
  | "behavioral_fit_drill";

export interface AccentureDimensionScore {
  score: number;
  critique: string;
  recommendation?: string;
}

export interface AccentureTimelineTurn {
  turn_number: number;
  phase: string;
  question: string;
  candidate_response: string;
  evaluator_feedback: string;
  trajectory: "positive" | "neutral" | "negative";
}

export interface AccentureReadinessReport {
  session_id: string;
  overall_verdict: string;
  candidate_level: string;
  readiness_score: number;
  executive_summary: string;
  dimension_scores: Record<string, AccentureDimensionScore>;
  fix_before_real_interview: string[];
  timeline_data?: AccentureTimelineTurn[];
}

export interface AccentureModeConfig {
  id: AccenturePracticeMode;
  label: string;
  duration: string;
  description: string;
  phases: string[];
  icon: string;
}

export const ACCENTURE_PHASES_MAP: Record<AccenturePracticeMode, InterviewPhase[]> = {
  full_simulation: [
    { id: "introduction", label: "1. Intro & Walkthrough" },
    { id: "resume_deep_dive", label: "2. Resume Baselines" },
    { id: "consulting_case", label: "3. Consulting Case" },
    { id: "ai_genai_strategy", label: "4. GenAI Strategy" },
    { id: "behavioral_fit", label: "5. Behavioral Fit" },
    { id: "closing", label: "6. Closing" },
  ],
  case_ai_drill: [
    { id: "consulting_case", label: "1. Consulting Case" },
    { id: "ai_genai_strategy", label: "2. GenAI Strategy" },
    { id: "closing", label: "3. Closing" },
  ],
  resume_defense_drill: [
    { id: "resume_deep_dive", label: "1. Resume Probing" },
    { id: "closing", label: "2. Closing" },
  ],
  behavioral_fit_drill: [
    { id: "behavioral_fit", label: "1. Behavioral Fit" },
    { id: "closing", label: "2. Closing" },
  ],
};
