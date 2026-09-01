export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type RightPanelState = "whiteboard" | "source";

export type InterviewMode = "case" | "domain";

export interface InterviewPhase {
  id: string;
  label: string;
}

export const PHASES: InterviewPhase[] = [
  { id: "introduction", label: "Intro" },
  { id: "clarifying", label: "Clarify" },
  { id: "structuring", label: "Structure" },
  { id: "quantitative", label: "Quant" },
  { id: "brainstorming", label: "Ideas" },
  { id: "synthesis", label: "Synthesis" },
];

export const DOMAIN_PHASES: InterviewPhase[] = [
  { id: "introduction", label: "Intro & Resume" },
  { id: "technical", label: "Technical Q&A" },
  { id: "hr", label: "HR & Behavioral" },
];
