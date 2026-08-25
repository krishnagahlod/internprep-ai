"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, FileCheck, ShieldAlert, Cpu, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DIMENSIONS = [
  { name: "Metric Density & Scale", score: "96%", status: "Optimal" },
  { name: "High-Agency Action Verbs", score: "92%", status: "Optimal" },
  { name: "Technical Scope & Context", score: "88%", status: "Good" },
  { name: "Cross-Question Vulnerability", score: "12%", status: "Low Risk" },
  { name: "ATS Parser Compatibility", score: "100%", status: "Verified" },
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
          <span className="text-xs font-mono-tech text-muted-foreground">ADAPTIVE RAG RESUME AUDIT</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Bullet-level benchmarking against verified Day 1 placement resumes.
        </h2>

        {/* 2-Column Deep Dive */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Dimensions */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
              Our Adaptive RAG engine extracts every bullet from your uploaded PDF, maps it to the closest "Golden Example" using vector similarity, and generates line-by-line diff rewrites.
            </p>

            {/* Score Table */}
            <div className="p-4 rounded-lg bg-card border border-border space-y-3 font-mono-tech text-xs shadow-xs">
              <div className="text-muted-foreground uppercase text-[11px] pb-1 border-b border-border flex justify-between">
                <span>EVALUATION DIMENSION</span>
                <span>BENCHMARK</span>
              </div>
              {DIMENSIONS.map((dim, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-foreground">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dim.score}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                      {dim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs text-muted-foreground font-sans">
              <div className="flex items-start gap-2">
                <GitCompare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Side-by-side color diffs showing exactly what words to replace for maximum impact.</span>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Interactive workshop mode to brainstorm missing metrics and co-write sentences.</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/resume">
                <Button size="sm" className="h-9 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold">
                  Upload PDF for Audit
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Console Preview */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
              <span>SCANNER TELEMETRY: PLACEMENT BULLET DIFF</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ACCURACY: 98%</span>
            </div>

            <div className="p-6 space-y-4 font-sans">
              {/* Bullet 1 */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-muted-foreground font-semibold">BULLET 01 • QUANTITATIVE FINANCE</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Score: 98/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed font-sans">
                  "Designed an automated statistical arbitrage strategy backtested across 5 years of tick data, generating an annualized Sharpe ratio of 2.84 with 14% max drawdown."
                </p>
                <div className="text-[11px] font-mono-tech text-muted-foreground pt-1">
                  STRUCTURE: <span className="text-foreground">Action + Context + Quantified Outcome</span>
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-muted-foreground font-semibold">BULLET 02 • SYSTEM SCALING</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Score: 96/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed font-sans">
                  "Architected an event-driven Kafka ingestion pipeline processing 85,000 events/sec, cutting peak database write locks by 74%."
                </p>
                <div className="text-[11px] font-mono-tech text-muted-foreground pt-1">
                  STRUCTURE: <span className="text-foreground">Scale Metric + Latency Optimization</span>
                </div>
              </div>

              {/* Cross-Question Warning */}
              <div className="p-3 rounded-md bg-muted/60 border border-border text-xs font-mono-tech text-foreground space-y-1">
                <div className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> PREDICTED INTERVIEWER CROSS-QUESTION
                </div>
                <div className="text-muted-foreground">
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
