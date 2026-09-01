import React from "react";

export interface Achievement {
  id: string;
  title: string;
  section_type: string;
  parent_experience: string;
  timeline: string;
  original_description: string;
  competency_tags: string[];
  status: string;
  quantified_metrics: any;
  user_notes?: string;
}

export interface GeneratedBullet {
  id: string;
  achievement_id: string;
  source_achievement_ids?: string[];
  target_role: string;
  bullet_text: string;
  variant_type: string;
  recruiter_notes?: string;
  is_saved?: boolean;
  generation_group_id?: string;
  achievements?: {
    title?: string;
    parent_experience?: string;
    section_type?: string;
    timeline?: string;
    original_description?: string;
  };
}

export const ROLE_LABELS: Record<string, string> = {
  consult: "Consulting",
  consulting: "Consulting",
  finance: "Finance",
  "product management": "Product Management",
  product_management: "Product Management",
  analytics: "Data & Analytics",
  "it-software": "Software Engineering",
  software: "Software Engineering",
};

export const getRoleLabel = (r: string) => {
  if (!r) return "Unknown";
  return ROLE_LABELS[r.toLowerCase()] || r;
};

export const DOMAIN_OPTIONS = [
  { value: "consulting", label: "Management Consulting" },
  { value: "software", label: "Software Engineering / IT" },
  { value: "product_management", label: "Product Management" },
  { value: "finance", label: "Finance / Investment Banking" },
  { value: "analytics", label: "Data Science & Analytics" },
];

export const SECTION_ORDER: Record<string, number> = {
  "Scholastic Achievements": 1,
  "Professional Experience": 2,
  Projects: 3,
  "Positions of Responsibility": 4,
  Extracurriculars: 5,
  Other: 6,
};

export const resolveBulletSectionType = (
  bullet: GeneratedBullet,
  fallbackAch?: Achievement
): string => {
  const explicit =
    bullet.achievements?.section_type || fallbackAch?.section_type;
  if (explicit && explicit !== "General" && explicit !== "Other") {
    return explicit;
  }
  const title = (
    bullet.achievements?.parent_experience ||
    bullet.achievements?.title ||
    fallbackAch?.parent_experience ||
    fallbackAch?.title ||
    ""
  ).toLowerCase();
  if (
    /hyperloop|formula|project|b\.tech|btp|ddp|thesis|capstone|simulation|bot|pipeline|detection|system|model|classifier|app\b|platform|tool|engine|autonomous/i.test(
      title
    )
  ) {
    return "Projects";
  }
  if (
    /coordinator|manager|secretary|convenor|lead|head|council|representative|senator|damp|alumni|convenor/i.test(
      title
    )
  ) {
    return "Positions of Responsibility";
  }
  if (
    /olympiad|jee|rank|scholarship|kvpy|ntse|academic|cpi|cgpa|medal|dean/i.test(
      title
    )
  ) {
    return "Scholastic Achievements";
  }
  if (
    /club|sport|football|cricket|basketball|badminton|cultural|music|dance|drama|nss|nso|ncc/i.test(
      title
    )
  ) {
    return "Extracurricular Activities";
  }
  return explicit || "Professional Experience";
};

export const highlightMetrics = (text: string) => {
  const regex =
    /((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+)?(?:%|x|X)?)/g;
  const parts = text.split(regex);
  return React.createElement(
    React.Fragment,
    null,
    parts.map((part, i) => {
      if (
        /^(?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+)?(?:%|x|X)?$/.test(
          part
        )
      ) {
        return React.createElement(
          "span",
          { key: i, className: "font-bold text-primary" },
          part
        );
      }
      return part;
    })
  );
};
