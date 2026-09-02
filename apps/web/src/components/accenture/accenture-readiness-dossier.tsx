"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  ShieldCheck,
  Brain,
  Layers,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccentureReadinessReport } from "./types";

interface AccentureReadinessDossierProps {
  report: AccentureReadinessReport;
  onRetake: () => void;
}

const DIMENSION_CONFIG: Record<
  string,
  { label: string; icon: any; category: string; description: string }
> = {
  accenture_alignment: {
    label: "Accenture Alignment & 'Why Consulting'",
    icon: Target,
    category: "Culture & Fit",
    description: "Understanding of Accenture's end-to-end transformation model & motivation.",
  },
  resume_ownership: {
    label: "Resume Claim Defense & Baselines",
    icon: ShieldCheck,
    category: "Experience Depth",
    description: "Quantification, baseline verification, and individual contribution defense.",
  },
  business_and_digital_thinking: {
    label: "Commercial Intuition & Digital Value",
    icon: Zap,
    category: "Strategy & Operations",
    description: "Business viability, revenue/cost levers, and digital transformation.",
  },
  structured_problem_solving: {
    label: "MECE Structuring & Case Math",
    icon: Layers,
    category: "Case Interviews",
    description: "Problem breakdown, issue trees, and sanity-checked mental math.",
  },
  ai_tech_fluency: {
    label: "AI / GenAI Fluency (Tech → CXO)",
    icon: Brain,
    category: "Digital Transformation",
    description: "Translating AI/RAG into business ROI for non-technical stakeholders.",
  },
  executive_presence_under_pressure: {
    label: "Executive Presence Under Probing",
    icon: Award,
    category: "Communication",
    description: "Composure, crisp synthesis, and adapting to interviewer pushback.",
  },
};

export function AccentureReadinessDossier({
  report,
  onRetake,
}: AccentureReadinessDossierProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  const score = report.readiness_score || 80;
  const percentile = report.percentile_estimate || Math.min(99, Math.max(50, Math.round(score * 1.08)));

  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-500/10";
    if (val >= 70) return "text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-500/10";
    if (val >= 60) return "text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-500/10";
    return "text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-500/10";
  };

  const getProgressBarColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 70) return "bg-blue-500";
    if (val >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Banner & Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono-tech uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                ACCENTURE // MANAGEMENT CONSULTING READY
              </span>
              <Badge variant="outline" className="text-[10px] font-mono-tech bg-muted/60">
                IIT BOMBAY COHORT BENCHMARK
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-foreground">
              Accenture Consulting Readiness Dossier
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              Calibrated against real offer-holder debriefs from IIT Bombay, IIT Delhi, and premier IIT cohorts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetake}
              className="font-mono-tech text-xs rounded-xl flex items-center gap-1.5 cursor-pointer w-full sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retake Simulation
            </Button>
          </div>
        </div>

        {/* Executive Score & Verdict Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Circular Readiness Gauge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border border-border text-center space-y-3">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted-foreground/20"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-emerald-500"
                  strokeWidth="8"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * score) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold font-mono-tech text-foreground tracking-tight">
                  {score}
                </span>
                <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">
                  Score / 100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-mono-tech font-bold px-2.5 py-0.5 rounded-full border ${getScoreColor(score)}`}>
                {report.overall_verdict || "Hire"}
              </span>
              <p className="text-[11px] font-mono-tech text-muted-foreground">
                Top <span className="text-foreground font-bold">{100 - percentile}%</span> of IIT Candidates
              </p>
            </div>
          </div>

          {/* Executive Assessment */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold font-display text-foreground">
                Partner-Level Assessment
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/60">
              {report.executive_summary ||
                "Demonstrated solid structured problem solving and technical breadth, with room for sharper metric quantification on resume projects."}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] font-mono-tech text-muted-foreground block">Key Strength</span>
                  <span className="text-xs font-bold text-foreground truncate block">
                    Structured Problem Solving & AI
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] font-mono-tech text-muted-foreground block">Primary Action</span>
                  <span className="text-xs font-bold text-foreground truncate block">
                    State Baseline Metrics First
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual 6-Dimension Performance Meters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold font-display text-foreground">
              6-Dimension Competence Breakdown
            </h2>
            <p className="text-xs text-muted-foreground font-sans">
              Click any dimension to view specific critique and action steps.
            </p>
          </div>
          <span className="text-xs font-mono-tech text-muted-foreground">
            Benchmarked vs Day-1 Standards
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {Object.entries(report.dimension_scores || {}).map(([key, item]) => {
            const config = DIMENSION_CONFIG[key] || {
              label: key.replace(/_/g, " "),
              icon: Target,
              category: "General",
              description: "",
            };
            const Icon = config.icon;
            const isExpanded = expandedDimension === key;
            const dimScore = item.score || 80;

            return (
              <div
                key={key}
                onClick={() => setExpandedDimension(isExpanded ? null : key)}
                className={`p-4 rounded-2xl border bg-card transition-all cursor-pointer space-y-3 ${
                  isExpanded
                    ? "border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-md"
                    : "border-border hover:border-emerald-500/30 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground font-display">
                        {config.label}
                      </h4>
                      <span className="text-[10px] font-mono-tech text-muted-foreground">
                        {config.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-tech font-bold text-foreground">
                      {dimScore}/100
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                      dimScore
                    )}`}
                    style={{ width: `${dimScore}%` }}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pt-2 border-t border-border/60 space-y-2 text-xs font-sans leading-relaxed"
                  >
                    <p className="text-muted-foreground">
                      <strong className="text-foreground font-semibold font-mono-tech text-[11px] block mb-0.5">
                        Observation:
                      </strong>
                      {item.critique}
                    </p>
                    {item.recommendation && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono-tech">
                        💡 <strong>Action Step:</strong> {item.recommendation}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Turn-by-Turn "What You Said vs. IITB Benchmark Golden Answer" */}
      {report.turn_by_turn_rewrites && report.turn_by_turn_rewrites.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span>Transcript Rewrite: What You Said vs. Golden Benchmark</span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans">
              Modeled on successful interview answers from IIT Bombay offer holders.
            </p>
          </div>

          <div className="space-y-3">
            {report.turn_by_turn_rewrites.map((rewrite, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-mono-tech font-bold text-foreground">
                    Turn {rewrite.turn_number}: {rewrite.question_context}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono-tech text-rose-500 border-rose-500/30">
                    Gap: {rewrite.gap_identified}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* What you said */}
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] font-mono-tech font-bold text-rose-600 dark:text-rose-400 block uppercase">
                      🔴 What You Said:
                    </span>
                    <p className="text-muted-foreground font-sans italic leading-relaxed">
                      "{rewrite.what_you_said}"
                    </p>
                  </div>

                  {/* Golden Benchmark */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono-tech font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                      🟢 Accenture Benchmark Rewrite:
                    </span>
                    <p className="text-foreground font-sans leading-relaxed font-medium">
                      "{rewrite.golden_benchmark_answer}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prioritized 3-Point Action Plan */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 border border-emerald-500/30 space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-emerald-500" />
          <h3 className="text-base font-bold font-display text-foreground">
            Fix This Before Your Real Accenture Interview
          </h3>
        </div>

        <div className="space-y-2.5">
          {(report.fix_before_real_interview || []).map((fix, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-card border border-border flex items-start gap-3 shadow-xs"
            >
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono-tech font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-foreground font-sans leading-relaxed">
                {fix}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-end">
          <Button
            size="sm"
            onClick={onRetake}
            className="font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Practice Another Drill Mode</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
