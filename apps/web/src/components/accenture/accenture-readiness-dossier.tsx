"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Target,
  ArrowRight,
  Brain,
  Layers,
  Sparkles,
  Download,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandHero, CommandNav } from "@/components/shared";
import { AccentureReadinessReport } from "./types";

interface AccentureReadinessDossierProps {
  report: AccentureReadinessReport;
  onRetake: () => void;
}

const DIMENSION_CONFIG: Record<
  string,
  { label: string; icon: any; category: string }
> = {
  accenture_alignment: {
    label: "Accenture Alignment & 'Why Consulting'",
    icon: Target,
    category: "Culture & Fit",
  },
  resume_ownership: {
    label: "Resume Claim Defense & Baselines",
    icon: ShieldCheck,
    category: "Experience Depth",
  },
  business_and_digital_thinking: {
    label: "Commercial Intuition & Digital Value",
    icon: Brain,
    category: "Strategy & Operations",
  },
  structured_problem_solving: {
    label: "MECE Structuring & Case Math",
    icon: Layers,
    category: "Case Interviews",
  },
  ai_tech_fluency: {
    label: "AI / GenAI Fluency (Tech → CXO)",
    icon: Sparkles,
    category: "Digital Transformation",
  },
  executive_presence_under_pressure: {
    label: "Executive Presence Under Probing",
    icon: Award,
    category: "Communication",
  },
};

export function AccentureReadinessDossier({
  report,
  onRetake,
}: AccentureReadinessDossierProps) {
  const handlePrint = () => {
    window.print();
  };

  const entries = Object.entries(report.dimension_scores || {});

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
      <CommandNav
        backHref="/dashboard"
        backLabel="Dashboard"
        breadcrumb="ACCENTURE READINESS DOSSIER"
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-8 text-xs font-mono-tech font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print Scorecard</span>
            </Button>
            <Button
              size="sm"
              onClick={onRetake}
              className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-mono-tech text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retake Drill</span>
            </Button>
          </div>
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Command Hero */}
        <CommandHero
          variant="card"
          watermark="ACCENTURE"
          badge="[ACCENTURE // MANAGEMENT CONSULTING READY]"
          statusBadge={report.overall_verdict.toUpperCase()}
          statusVariant="emerald"
          title="Accenture Consulting Readiness Evaluation"
          subtitle={
            report.executive_summary ||
            "Performance appraisal across 6 core Accenture dimensions modeled on Manager-level interviews at IIT Bombay."
          }
        />

        {/* Priority Action Items: Fix Before Real Interview */}
        {report.fix_before_real_interview && report.fix_before_real_interview.length > 0 && (
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground font-display">
                  Fix This Before Your Real Accenture Interview
                </h3>
                <p className="text-xs text-muted-foreground font-sans">
                  High-yield adjustments to sharpen your answers before stepping into the live interview room.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {report.fix_before_real_interview.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-card/80 border border-border/80 rounded-2xl p-4 text-xs font-sans text-foreground shadow-xs"
                >
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 font-mono-tech text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6-Dimension Score Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground font-display">
                6-Dimension Qualitative Evaluation Breakdown
              </h3>
              <p className="text-xs text-muted-foreground font-sans">
                Specific partner-level observations across key competence areas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(([key, data]) => {
              const config = DIMENSION_CONFIG[key] || {
                label: key.replace(/_/g, " ").toUpperCase(),
                icon: Sparkles,
                category: "General",
              };
              const Icon = config.icon;

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
                      {data.critique}
                    </p>
                  </div>

                  {data.recommendation && (
                    <div className="pt-2 border-t border-border/60 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono-tech">
                      💡 {data.recommendation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
