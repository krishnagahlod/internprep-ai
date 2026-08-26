"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, FileCheck, ShieldAlert, Cpu, GitCompare, Sparkles, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DIMENSIONS = [
  { name: "Metric Density & Scale", score: "96%", status: "Optimal", color: "text-emerald-500" },
  { name: "High-Agency Action Verbs", score: "92%", status: "Optimal", color: "text-emerald-500" },
  { name: "Technical Scope & Context", score: "88%", status: "Good", color: "text-emerald-500" },
  { name: "Cross-Question Risk", score: "12%", status: "Low Risk", color: "text-emerald-500" },
  { name: "ATS Parser Compatibility", score: "100%", status: "Verified", color: "text-emerald-500" },
];

export function ResumeIntelligenceSection() {
  return (
    <section id="resume-intelligence" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [CORE MODULE 02]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">RESUME INTELLIGENCE & DIFFS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Bullet-level benchmarking against verified Day 1 placement resumes.
        </h2>

        {/* 2-Column Deep Dive */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Dimensions */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
              Extracts every achievement from your PDF, maps it to verified Day 1 placement cohorts, and outputs line-by-line Tier-1 benchmark rewrites.
            </p>

            {/* Score Table */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3 font-mono-tech text-xs shadow-xs">
              <div className="text-muted-foreground uppercase text-[11px] pb-2 border-b border-border flex justify-between">
                <span>EVALUATION METRIC</span>
                <span>CALIBRATION</span>
              </div>
              {DIMENSIONS.map((dim, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-foreground font-medium">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dim.score}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                      {dim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Feature Points */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono-tech font-bold text-foreground">
                  <GitCompare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Inline Diffs</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans">Precise word-level replacements for maximum impact.</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono-tech font-bold text-foreground">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Interview Prep</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans">Predicts cross-questions interviewers will ask.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/resume" className="block w-full">
                <Button 
                  size="lg" 
                  className="w-full h-11 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-bold font-mono-tech shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
                >
                  Upload PDF for Deep Audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Console Preview */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
              <span>SCANNER TELEMETRY: PLACEMENT BULLET DIFF</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> 98% VERIFIED MATCH
              </span>
            </div>

            <div className="p-6 space-y-4 font-sans">
              {/* Bullet 1 */}
              <div className="p-4 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-muted-foreground font-semibold">BULLET 01 • QUANT & FINANCE</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Score: 98/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed font-sans">
                  "Designed an automated statistical arbitrage strategy backtested across 5 years of tick data, generating an annualized Sharpe ratio of 2.84 with 14% max drawdown."
                </p>
                <div className="text-[11px] font-mono-tech text-muted-foreground pt-1 flex items-center justify-between">
                  <span>STRUCTURE: Action + Context + Quantified Outcome</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Day 1 Pass</span>
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="p-4 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-muted-foreground font-semibold">BULLET 02 • SYSTEM SCALING</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Score: 96/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed font-sans">
                  "Architected an event-driven Kafka ingestion pipeline processing 85,000 events/sec, cutting peak database write locks by 74%."
                </p>
                <div className="text-[11px] font-mono-tech text-muted-foreground pt-1 flex items-center justify-between">
                  <span>STRUCTURE: Scale Metric + Latency Optimization</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Day 1 Pass</span>
                </div>
              </div>

              {/* Cross-Question Warning */}
              <div className="p-3.5 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs font-mono-tech text-foreground space-y-1.5">
                <div className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> PREDICTED INTERVIEWER CROSS-QUESTION
                </div>
                <div className="text-muted-foreground font-sans text-xs">
                  "How did you account for transaction slippage and exchange fees when calculating that 2.84 Sharpe ratio?"
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
