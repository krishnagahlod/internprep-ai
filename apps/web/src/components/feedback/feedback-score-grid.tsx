"use client";

import React from "react";
import {
  Layers,
  Brain,
  BarChart3,
  MessageSquare,
  Target,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface FeedbackScoreGridProps {
  dimensionNotes?: Record<string, any>;
}

const DIMENSION_CONFIG: Record<
  string,
  { label: string; icon: any; category: string }
> = {
  structuring: {
    label: "Structuring & MECE-ness",
    icon: Layers,
    category: "Case Interviews",
  },
  business_intuition: {
    label: "Business Intuition & Commercial Sense",
    icon: Brain,
    category: "Case + PM",
  },
  quantitative_reasoning: {
    label: "Quantitative Reasoning & Math",
    icon: BarChart3,
    category: "Case + Finance",
  },
  communication_clarity: {
    label: "Communication Clarity & Synthesis",
    icon: MessageSquare,
    category: "Universal",
  },
  depth_vs_recitation: {
    label: "Depth vs Superficial Recitation",
    icon: Target,
    category: "Universal",
  },
  resume_grounding: {
    label: "Resume Claim Grounding",
    icon: FileText,
    category: "Behavioral / HR",
  },
  handling_pressure: {
    label: "Handling Follow-ups & Pressure",
    icon: ShieldAlert,
    category: "Stress Probing",
  },
};

export function FeedbackScoreGrid({ dimensionNotes = {} }: FeedbackScoreGridProps) {
  const entries = Object.entries(dimensionNotes);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/40">
        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
        <p className="text-xs font-mono-tech text-muted-foreground">
          Detailed dimensional notes are compiling for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(([key, data]) => {
        const config = DIMENSION_CONFIG[key] || {
          label: key.replace(/_/g, " ").toUpperCase(),
          icon: Sparkles,
          category: "General",
        };
        const Icon = config.icon;
        const critique =
          typeof data === "string"
            ? data
            : data?.critique || data?.notes || JSON.stringify(data);
        const rating = data?.rating || data?.verdict || "Evaluated";

        return (
          <div
            key={key}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {config.category}
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground font-mono-tech">
                {config.label}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                {critique}
              </p>
            </div>

            {data?.recommendation && (
              <div className="pt-2 border-t border-border/60 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono-tech">
                💡 {data.recommendation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
