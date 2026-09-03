"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Flame,
  ArrowRight,
  FileCheck,
  MessageSquare,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccentureReadinessReport } from "./types";
import { AccentureFeedbackCard } from "./accenture-feedback-card";

interface AccentureReadinessDossierProps {
  report: AccentureReadinessReport;
  onRetake?: () => void;
  onRestart?: () => void;
  onReturnToDashboard?: () => void;
}

const DIMENSION_CONFIG: Record<
  string,
  { label: string; icon: any; category: string; description: string }
> = {
  accenture_alignment: {
    label: "Accenture Alignment & 'Why Consulting'",
    icon: Target,
    category: "Culture & Fit",
    description: "STAR storytelling, Accenture tech-strategy alignment, and handling ambiguity.",
  },
  resume_ownership: {
    label: "Resume Claim Defense & Baselines",
    icon: ShieldCheck,
    category: "Experience Depth",
    description: "Metric verification, technical trade-offs, and academic domain defense.",
  },
  business_and_digital_thinking: {
    label: "Commercial Intuition & Digital Value",
    icon: TrendingUp,
    category: "Strategy & Operations",
    description: "Market sizing, revenue/cost trees, and translating digital tech to CXO value.",
  },
  structured_problem_solving: {
    label: "MECE Structuring & Case Math",
    icon: Award,
    category: "Case Interviews",
    description: "Mutually exclusive issue trees, quantitative sanity checks, and syntheses.",
  },
  ai_tech_fluency: {
    label: "AI / GenAI Fluency (Tech → CXO)",
    icon: Cpu,
    category: "Digital Transformation",
    description: "Enterprise RAG, Agentic workflows, change management, and client ROI.",
  },
  executive_presence_under_pressure: {
    label: "Executive Presence Under Probing",
    icon: Flame,
    category: "Communication",
    description: "Composure during manager pushback, concise delivery, and structured pauses.",
  },
};

export function AccentureReadinessDossier({
  report,
  onRetake,
  onRestart,
  onReturnToDashboard,
}: AccentureReadinessDossierProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const handleRestart = onRestart || onRetake || (() => {});
  const handleDashboard = onReturnToDashboard || (() => {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
  });

  const score = report.readiness_score || 75;
  const percentile = report.percentile_estimate || Math.min(99, Math.round(score * 0.95 + 10));

  const getVerdictBadge = () => {
    if (score >= 85) {
      return {
        label: "Accenture Day-1 Offer Caliber",
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    if (score >= 70) {
      return {
        label: "Strong Contender / Needs Minor Polish",
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    }
    return {
      label: "Borderline / Needs Target Drills",
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  };

  const verdict = getVerdictBadge();

  // Circular gauge calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const cleanQuotes = (str?: string) => {
    if (!str) return "";
    let clean = str.trim();
    if ((clean.startsWith('""') && clean.endsWith('""')) || (clean.startsWith("''") && clean.endsWith("''"))) {
      clean = clean.slice(1, -1).trim();
    }
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    return clean;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans antialiased text-foreground">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono-tech uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              ACCENTURE // MANAGEMENT CONSULTING READY
            </span>
            <Badge variant="outline" className="text-[10px] font-mono-tech border-border bg-muted/60">
              IIT Bombay Cohort Benchmark
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Accenture Consulting Readiness Dossier
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            Calibrated against real offer-holder debriefs from IIT Bombay, IIT Delhi, and premier IIT cohorts.
          </p>
        </div>

        <Button
          onClick={onRetake}
          size="sm"
          variant="outline"
          className="font-mono-tech text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto border-border hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retake Simulation</span>
        </Button>
      </div>

      {/* Hero Performance Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Radial Score Gauge */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-border/60">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted/40"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                  {score}
                </span>
                <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">
                  Score / 100
                </span>
              </div>
            </div>

            <div className="mt-3 text-center space-y-1">
              <span className={`text-[11px] font-mono-tech font-bold px-2.5 py-0.5 rounded-full border inline-block ${verdict.color}`}>
                {verdict.label}
              </span>
              <p className="text-[11px] font-mono-tech text-muted-foreground">
                Top <strong className="text-foreground">{percentile}%</strong> of IIT Candidates
              </p>
            </div>
          </div>

          {/* Executive Assessment */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold font-display text-foreground">
                Partner-Level Assessment
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed bg-muted/20 p-4 rounded-2xl border border-border/60">
              {report.executive_summary ||
                "Demonstrated solid structured problem solving and technical breadth, with room for sharper metric quantification on resume projects."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] font-mono-tech text-muted-foreground block uppercase font-semibold">Key Strength</span>
                  <span className="text-xs font-bold text-foreground truncate block">
                    Structured Problem Solving & AI
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] font-mono-tech text-muted-foreground block uppercase font-semibold">Primary Action</span>
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
          <span className="text-xs font-mono-tech text-muted-foreground hidden sm:inline">
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

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold font-mono-tech text-foreground">
                      {dimScore}/100
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dimScore >= 80
                        ? "bg-emerald-500"
                        : dimScore >= 65
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${dimScore}%` }}
                  />
                </div>

                {/* Expandable Critique Accordion */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-border/60 text-xs font-sans space-y-2"
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

      {/* Redesigned Question-Wise Analysis Cards */}
      {report.turn_by_turn_rewrites && report.turn_by_turn_rewrites.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span>Question-Wise Transcript Analysis & Golden Benchmarks</span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans">
              Direct comparison of your interview responses against real IIT Bombay offer-holder answers.
            </p>
          </div>

          <div className="space-y-4">
            {report.turn_by_turn_rewrites.map((rewrite, idx) => {
              const cleanSaid = cleanQuotes(rewrite.what_you_said);
              const cleanGolden = cleanQuotes(rewrite.golden_benchmark_answer);

              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-card border border-border shadow-md overflow-hidden"
                >
                  {/* Card Header Bar */}
                  <div className="p-4 sm:p-5 bg-muted/30 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono-tech font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Turn #{rewrite.turn_number}
                        </span>
                        {rewrite.competence_area && (
                          <Badge variant="outline" className="text-[10px] font-mono-tech border-border bg-background">
                            {rewrite.competence_area}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground font-sans">
                        {rewrite.question_context}
                      </h4>
                    </div>

                    {rewrite.gap_identified && (
                      <div className="sm:max-w-md shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-tech font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>Gap: {rewrite.gap_identified}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Box: Candidate Response */}
                    <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-tech font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider">
                          🔴 What You Said:
                        </span>
                        <p className="text-xs sm:text-[13px] text-muted-foreground font-sans italic leading-relaxed">
                          "{cleanSaid}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-rose-500/15 text-[11px] font-mono-tech text-rose-600 dark:text-rose-400">
                        <span>× Lacked quantitative baseline & structured delivery</span>
                      </div>
                    </div>

                    {/* Right Box: IITB Golden Benchmark */}
                    <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/30 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-tech font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
                            🟢 IIT Bombay Benchmark Rewrite:
                          </span>
                          <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                            OFFER CALIBER
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-foreground font-sans leading-relaxed font-medium">
                          "{cleanGolden}"
                        </p>
                      </div>

                      {/* Success Levers */}
                      {rewrite.key_levers && rewrite.key_levers.length > 0 ? (
                        <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                          <span className="text-[9px] font-mono-tech uppercase font-bold text-muted-foreground block">
                            Key Winning Levers:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {rewrite.key_levers.map((lever, lIdx) => (
                              <span
                                key={lIdx}
                                className="text-[10px] font-mono-tech px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              >
                                ✓ {lever}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-emerald-500/20 text-[11px] font-mono-tech text-emerald-600 dark:text-emerald-400">
                          <span>✓ Quantified baselines & linked directly to client impact</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prioritized 3-Point Action Plan */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 border border-emerald-500/30 space-y-4 shadow-lg">
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
              className="p-3.5 rounded-2xl bg-card border border-border flex items-start gap-3 shadow-xs"
            >
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono-tech font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                {fix}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-3 flex items-center justify-end">
          <Button
            size="sm"
            onClick={handleRestart}
            className="font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Practice Another Drill Track</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Candidate Feedback & Celebratory Treat Pledge Section */}
      <AccentureFeedbackCard
        sessionId={report.session_id}
        readinessScore={report.readiness_score}
        candidateLevel={report.candidate_level}
      />

      {/* Navigation Footer */}
      <div className="pt-2 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-tech">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDashboard}
          className="w-full sm:w-auto rounded-xl flex items-center gap-1.5 border-border text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Dashboard</span>
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="w-full sm:w-auto rounded-xl border-border text-foreground hover:bg-muted cursor-pointer"
          >
            Print / Save Dossier PDF
          </Button>
          <Button
            size="sm"
            onClick={handleRestart}
            className="w-full sm:w-auto font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Start New Simulation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
