"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, MessageSquare, Award, ArrowRight, CheckCircle2, Terminal, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PIPELINE_STAGES = [
  {
    id: "01",
    tag: "INGESTION & AUDIT",
    title: "1. Upload & Vector Audit",
    shortDesc: "Extracts PDF geometry, computes vector embeddings, and benchmarks against verified Day 1 offers.",
    icon: UploadCloud,
    inputLabel: "Candidate Input",
    inputValue: "Standard 1-Page PDF Resume (Consulting / SDE / Analytics / Quant / PM)",
    telemetry: "ADAPTIVE RAG: 24 bullets parsed • High-density vector matching • 4 weak action verbs flagged",
    outputLabel: "System Output",
    outputValue: "Line-by-line Google XYZ formula rewrites + Competence Radar (STAR, Quantification, Formatting)",
    actionText: "Try Resume Audit",
    actionLink: "/resume"
  },
  {
    id: "02",
    tag: "LIVE SIMULATION",
    title: "2. Conversational Simulation",
    shortDesc: "Engage in real-time voice and text rounds with instant edge-case probing and framework pushbacks.",
    icon: MessageSquare,
    inputLabel: "Candidate Input",
    inputValue: "Live spoken / typed problem structuring, napkin math, and architectural defenses",
    telemetry: "SIMULATION ENGINE: Real-time conversational flow • Dynamic multi-turn cross-examination active",
    outputLabel: "System Output",
    outputValue: "Interactive Excalidraw scratchpad sync + Real-time interviewer follow-up prompts",
    actionText: "Launch Interview Simulator",
    actionLink: "/interview"
  },
  {
    id: "03",
    tag: "DEBRIEF & DRILLS",
    title: "3. 7-Dimension Scorecard & Drills",
    shortDesc: "Review post-session debriefs to eliminate logical gaps and perfect your positioning before Day 1.",
    icon: Award,
    inputLabel: "Candidate Input",
    inputValue: "Complete transcript session + structured calculations",
    telemetry: "RUBRIC EVALUATION: MECE 9.6 • Technical Depth 9.4 • Numerical Precision 10.0 • Verdict: Strong Hire",
    outputLabel: "System Output",
    outputValue: "Comprehensive 7-dimension performance scorecard + targeted drill recommendations",
    actionText: "View Sample Scorecard",
    actionLink: "/feedback"
  }
];

export function HowItWorks() {
  const [activeStage, setActiveStage] = useState(0);
  const stage = PIPELINE_STAGES[activeStage];
  const Icon = stage.icon;

  return (
    <section className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [WORKFLOW]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">CONNECTED PIPELINE ARCHITECTURE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 max-w-3xl">
          Three structured stages from first draft to Day 1 offer.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-12 max-w-2xl font-sans">
          Select any pipeline stage below to inspect real-time input requirements, AI processing telemetry, and generated evaluation artifacts.
        </p>

        {/* Connected Interactive Stage Controller */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {PIPELINE_STAGES.map((s, idx) => {
            const StageIcon = s.icon;
            const isActive = activeStage === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(idx)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isActive
                    ? "bg-card border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                    : "bg-muted/30 border-border hover:bg-muted/60 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs font-mono-tech">
                  <span className={`font-bold ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    STAGE {s.id}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                    {s.tag}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mb-1.5">
                  <StageIcon className={`h-4 w-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                  <h3 className={`text-sm font-bold ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                    {s.title}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 font-sans mt-1">
                  {s.shortDesc}
                </p>

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Stage Deep Dive Inspector */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-mono-tech">{stage.title}</h3>
                    <p className="text-xs text-muted-foreground font-sans">{stage.shortDesc}</p>
                  </div>
                </div>

                <Link href={stage.actionLink}>
                  <Button 
                    size="sm" 
                    className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold font-mono-tech shadow-xs"
                  >
                    {stage.actionText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Data Flow Grid */}
              <div className="grid md:grid-cols-2 gap-5">
                
                {/* Input Artifact */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                  <div className="text-xs font-mono-tech text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {stage.inputLabel}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                    {stage.inputValue}
                  </p>
                </div>

                {/* Output Artifact */}
                <div className="p-4 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {stage.outputLabel}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                    {stage.outputValue}
                  </p>
                </div>

              </div>

              {/* Console Telemetry Banner */}
              <div className="p-3 rounded-lg bg-muted/70 border border-border flex items-center gap-2 text-xs font-mono-tech text-muted-foreground overflow-x-auto">
                <Terminal className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{stage.telemetry}</span>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
