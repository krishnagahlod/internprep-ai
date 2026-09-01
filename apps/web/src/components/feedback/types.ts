export interface DimensionNote {
  dimension: string;
  rating?: string;
  score?: number;
  critique: string;
  recommendation?: string;
}

export interface TimelineTurn {
  turn_number: number;
  phase: string;
  question: string;
  candidate_response: string;
  evaluator_feedback: string;
  trajectory: "positive" | "neutral" | "negative";
}

export interface FeedbackData {
  session_id: string;
  overall_verdict: string;
  candidate_level?: string;
  executive_summary: string;
  dimension_notes?: Record<string, any>;
  fix_next?: string[];
  timeline_data?: TimelineTurn[];
  suggested_resources?: Array<{
    title: string;
    url?: string;
    description: string;
    category?: string;
  }>;
}
