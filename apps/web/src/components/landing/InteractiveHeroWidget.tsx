"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Mic, 
  Volume2, 
  ChevronRight, 
  RefreshCw,
  Award,
  Zap,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulletSample {
  id: string;
  category: string;
  original: string;
  scoreOriginal: number;
  rewritten: string;
  scoreRewritten: number;
  highlightWords: string[];
  crossQuestion: string;
  critique: string;
}

const BULLET_SAMPLES: BulletSample[] = [
  {
    id: "consulting",
    category: "Consulting / Strategy",
    original: "Worked on marketing strategy for client to increase engagement across platforms and helped team.",
    scoreOriginal: 42,
    rewritten: "Spearheaded omni-channel GTM strategy across 4 digital platforms for Tier-1 FMCG client; boosted conversion rates by 34% and unlocked ₹4.2 Cr ARR.",
    scoreRewritten: 96,
    highlightWords: ["Spearheaded", "omni-channel GTM", "34%", "₹4.2 Cr ARR"],
    crossQuestion: "How did you isolate the 34% conversion lift from external macroeconomic and festive seasonality?",
    critique: "Transformed passive voice into high-impact action verbs. Added MECE scope, quantified monetary lift, and eliminated filler phrases."
  },
  {
    id: "tech",
    category: "Software / Tech",
    original: "Built backend APIs using Python and database to improve the performance of application.",
    scoreOriginal: 48,
    rewritten: "Architected distributed Redis-backed caching layer and asynchronous FastAPI endpoints; reduced p99 latency from 450ms to 42ms (-90.6%) across 2.5M daily active users.",
    scoreRewritten: 98,
    highlightWords: ["Architected", "Redis-backed caching", "p99 latency", "42ms (-90.6%)", "2.5M DAU"],
    crossQuestion: "What cache eviction strategy and fallback mechanism did you implement to handle cache stampedes under peak load?",
    critique: "Replaced generic 'built APIs' with concrete architectural patterns and precise p99 latency metrics under scale."
  },
  {
    id: "finance",
    category: "Finance / Analytics",
    original: "Analyzed financial datasets in Excel and presented reports to senior management for quarterly reviews.",
    scoreOriginal: 51,
    rewritten: "Constructed dynamic 3-statement DCF & Monte Carlo sensitivity models for ₹180 Cr asset buyout; identified ₹14 Cr in redundant OpEx to optimize EBITDA margins by 280 bps.",
    scoreRewritten: 95,
    highlightWords: ["Constructed", "DCF & Monte Carlo", "₹180 Cr buyout", "₹14 Cr OpEx", "280 bps"],
    crossQuestion: "How did you calibrate the terminal growth rate and discount rate assumptions in your DCF sensitivity analysis?",
    critique: "Elevated standard Excel analysis into Wall-Street grade valuation modeling with precise basis points improvement."
  }
];

export function InteractiveHeroWidget() {
  const [activeTab, setActiveTab] = useState<"resume" | "interview">("resume");
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isTransforming, setIsTransforming] = useState(false);
  const [customBullet, setCustomBullet] = useState("");
  const [hasCustomRun, setHasCustomRun] = useState(false);

  // Interview state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [interviewTurn, setInterviewTurn] = useState<"question" | "answer" | "feedback">("feedback");

  const sample = BULLET_SAMPLES[selectedSampleIndex];

  const handleSelectSample = (index: number) => {
    setSelectedSampleIndex(index);
    setHasCustomRun(false);
    setCustomBullet("");
    setIsTransforming(true);
    setTimeout(() => setIsTransforming(false), 350);
  };

  const handleRunCustom = () => {
    if (!customBullet.trim()) return;
    setIsTransforming(true);
    setTimeout(() => {
      setIsTransforming(false);
      setHasCustomRun(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 rounded-3xl p-1 bg-gradient-to-b from-violet-500/20 via-cyan-500/10 to-transparent shadow-2xl backdrop-blur-xl">
      <div className="bg-white/90 dark:bg-zinc-950/90 rounded-[22px] border border-black/10 dark:border-white/10 overflow-hidden backdrop-blur-2xl">
        {/* Top Control Bar with Tab Switchers */}
        <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Interactive Sandbox
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground">Test AI Precision in Real-Time</span>
          </div>

          <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "resume"
                  ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4 text-violet-500" />
              Resume Intelligence
            </button>
            <button
              onClick={() => setActiveTab("interview")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "interview"
                  ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-cyan-500" />
              Mock Interview Turn
            </button>
          </div>
        </div>

        {/* Tab 1: Live Resume Intelligence */}
        {activeTab === "resume" && (
          <div className="p-6 lg:p-8 flex flex-col gap-6">
            {/* Domain Sample Selector Chips */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Domain Example:
              </span>
              <div className="flex flex-wrap gap-2">
                {BULLET_SAMPLES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSample(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedSampleIndex === idx && !hasCustomRun
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {s.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Before vs After Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={hasCustomRun ? "custom" : selectedSampleIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {/* Left Card: Before Raw Student Draft */}
                <div className="rounded-2xl p-5 bg-red-500/5 dark:bg-red-950/10 border border-red-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Raw Draft
                      </span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        ATS Score: {sample.scoreOriginal}/100
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-normal text-muted-foreground leading-relaxed italic">
                      "{sample.original}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-red-500/10 flex items-center justify-between text-xs text-red-600/80 dark:text-red-400/80">
                    <span className="flex items-center gap-1">
                      ⚠️ Missing STAR Structure & Metrics
                    </span>
                    <span>High Rejection Risk</span>
                  </div>
                </div>

                {/* Right Card: After Partner Calibrated Transformation */}
                <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-emerald-500/5 border border-violet-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-violet-500/5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                        Partner-Calibrated (Day 1 Ready)
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        ATS Score: {sample.scoreRewritten}/100
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                      "{sample.rewritten}"
                    </p>
                  </div>

                  {/* Partner Cross Question Box */}
                  <div className="mt-4 pt-3 border-t border-violet-500/20">
                    <div className="p-2.5 rounded-xl bg-violet-500/5 dark:bg-violet-950/30 border border-violet-500/15">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        Predicted Partner Cross-Question
                      </div>
                      <p className="text-xs text-muted-foreground">
                        "{sample.crossQuestion}"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Critique Feedback Strip */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex items-start sm:items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                <strong className="text-foreground font-semibold">AI Transformation Note: </strong>
                {sample.critique}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Live Mock Interview Turn */}
        {activeTab === "interview" && (
          <div className="p-6 lg:p-8 flex flex-col gap-6">
            {/* Interview Session Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 p-[2px]">
                  <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-sm">
                    SK
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Shreya Kapoor</h4>
                  <p className="text-xs text-muted-foreground">Engagement Manager • McKinsey & Co. Persona</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Case: FMCG Margin Turnaround
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  Turn 4 of 18
                </span>
              </div>
            </div>

            {/* Audio Wave & Interlocutor Speech */}
            <div className="rounded-2xl p-5 bg-muted/40 border border-border space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                    Interviewer Prompt
                  </span>
                  <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                    "Our client is experiencing a 15% margin erosion in their premium packaged foods division despite rising top-line sales. Walk me through your structure to diagnose whether this is driven by raw material inflation, channel mix, or logistical inefficiencies."
                  </p>
                </div>
              </div>

              {/* Dynamic Soundwave Visualizer */}
              <div className="flex items-center justify-center gap-1 py-2">
                {[12, 28, 45, 18, 55, 34, 48, 20, 60, 38, 22, 50, 30, 15].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [height * 0.4, height, height * 0.4] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.08,
                    }}
                    className="w-1 rounded-full bg-gradient-to-t from-violet-500 to-cyan-400"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Candidate Response & Live Scoring Strip */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-2xl p-4 bg-white dark:bg-zinc-900 border border-border flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Live Candidate Response (Voice Transcribed)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    "I will structure this across 3 MECE branches: First, Cost of Goods Sold (COGS) analyzing palm oil & packaging procurement costs; second, Channel Mix dissecting high-margin General Trade vs lower-margin Quick Commerce discounting; third, Freight & Supply Chain bottleneck costs..."
                  </p>
                </div>
              </div>

              {/* Live Partner Scorecard */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Real-Time Evaluation
                  </span>
                  <Award className="w-4 h-4 text-emerald-500" />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">MECE Structuring:</span>
                    <span className="font-bold text-emerald-600">9.6 / 10</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Business Acumen:</span>
                    <span className="font-bold text-emerald-600">9.2 / 10</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Verbal Synthesis:</span>
                    <span className="font-bold text-emerald-600">9.4 / 10</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-emerald-500/20 text-center">
                  <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Verdict: Strong Hire (Partner Track)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
