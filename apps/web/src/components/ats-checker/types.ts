export interface SubTrack {
  id: string;
  label: string;
}

export const SUB_TRACKS_BY_ROLE: Record<string, SubTrack[]> = {
  software: [
    { id: "sde_generalist", label: "Full-Stack / General SDE" },
    { id: "frontend", label: "Frontend & Web Architecture" },
    { id: "backend", label: "Backend & Distributed Systems" },
    { id: "ai_ml", label: "AI/ML Engineering & LLMOps" },
    { id: "devops", label: "DevOps & Cloud Infrastructure" },
  ],
  consulting: [
    { id: "general_strategy", label: "General Strategy & Advisory" },
    { id: "operations", label: "Operations & Supply Chain" },
    { id: "esg", label: "ESG & Sustainability" },
    { id: "digital_ai", label: "Digital & AI Strategy" },
  ],
  product_management: [
    { id: "b2b_tech", label: "Technical & B2B SaaS PM" },
    { id: "b2c_growth", label: "Growth & B2C Product" },
  ],
  finance: [
    { id: "ib_pe", label: "Investment Banking & Private Equity" },
    { id: "quant_trading", label: "Quantitative Research & Trading" },
  ],
  analytics: [
    { id: "ml_ai", label: "Machine Learning & AI Modeling" },
    { id: "data_engineering", label: "Data Engineering & Big Data" },
    { id: "bi_analytics", label: "Business Intelligence & Product Analytics" },
  ],
};
