"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { BulletAnalysis } from "./types";

interface ResumeBulletHeatmapProps {
  bullets?: BulletAnalysis[];
  onSelectBullet?: (bullet: BulletAnalysis) => void;
}

export function ResumeBulletHeatmap({
  bullets = [],
  onSelectBullet,
}: ResumeBulletHeatmapProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!bullets || bullets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/40">
        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
        <p className="text-xs font-mono-tech text-muted-foreground">
          Upload a resume above to generate your interactive bullet risk heatmap.
        </p>
      </div>
    );
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const getRiskStyle = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "high":
        return {
          border: "border-red-500/40 hover:border-red-500",
          badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
          icon: ShieldAlert,
          label: "HIGH PROBING RISK",
        };
      case "medium":
        return {
          border: "border-amber-500/40 hover:border-amber-500",
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
          label: "MODERATE RISK",
        };
      default:
        return {
          border: "border-emerald-500/40 hover:border-emerald-500",
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
          label: "SOLID CLAIM",
        };
    }
  };

  return (
    <div className="space-y-3">
      {bullets.map((b, idx) => {
        const style = getRiskStyle(b.risk_level);
        const Icon = style.icon;
        const isExpanded = expandedIndex === idx;

        return (
          <div
            key={idx}
            className={`rounded-2xl border bg-card overflow-hidden transition-all shadow-xs ${style.border}`}
          >
            {/* Summary Bar */}
            <div
              className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-muted/30"
              onClick={() => toggleExpand(idx)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono-tech px-2 py-0.2 rounded-full border font-bold ${style.badge}`}
                    >
                      {style.label}
                    </span>
                    {b.section && (
                      <span className="text-[10px] font-mono-tech text-muted-foreground">
                        [{b.section}]
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-sans text-foreground leading-relaxed">
                    {b.bullet}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-muted-foreground pt-1">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
              <div className="p-4 border-t border-border/70 bg-muted/20 space-y-3">
                {/* Likely Questions */}
                {b.likely_questions && b.likely_questions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-amber-600 dark:text-amber-400 font-bold uppercase">
                      <HelpCircle className="h-3 w-3" />
                      <span>Likely Interview Probing Questions</span>
                    </div>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-muted-foreground font-sans leading-relaxed">
                      {b.likely_questions.map((q, qIdx) => (
                        <li key={qIdx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improved Version */}
                {b.improved_version && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      <Sparkles className="h-3 w-3" />
                      <span>Suggested Impact Enhancement</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-foreground leading-relaxed">
                      {b.improved_version}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
