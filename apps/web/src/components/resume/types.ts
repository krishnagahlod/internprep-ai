export interface RadarScores {
  quantification: number;
  action_verbs: number;
  structure: number;
  section_balance: number;
  star_compliance: number;
  formatting: number;
}

export interface BulletAnalysis {
  bullet: string;
  risk_level: "low" | "medium" | "high";
  flagged_claims?: string[];
  likely_questions?: string[];
  improved_version?: string;
  section?: string;
}

export interface ResumeAnalysisData {
  id?: string;
  file_name?: string;
  overall_score: number;
  scores?: RadarScores;
  radar_scores?: RadarScores;
  bullet_analyses?: BulletAnalysis[];
  executive_summary?: string;
  raw_text?: string;
}
