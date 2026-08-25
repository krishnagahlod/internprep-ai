"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowRight, FileCheck, ShieldAlert, Cpu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DIMENSIONS = [
  { name: "Metric Density & Scale", score: "96%", status: "Optimal" },
  { name: "High-Agency Action Verbs", score: "92%", status: "Optimal" },
  { name: "Technical Architecture Clarity", score: "88%", status: "Good" },
  { name: "Cross-Question Vulnerability", score: "12%", status: "Low Risk" },
  { name: "ATS Parser Compatibility", score: "100%", status: "Perfect" },
];

export function ResumeIntelligenceSection() {
  return (
    <section id="resume-intelligence" className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [CORE ENGINE 02]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">RESUME INTELLIGENCE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-16 max-w-3xl">
          Line-by-line audit calibrated against Google & McKinsey hiring standards.
        </h2>

        {/* 2-Column Deep Dive */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Dimensions & Core Logic */}
          <div className="lg:col-span-5 space-y-8">
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
              Most candidates get rejected before the interview because their bullets lack quantification and high-agency action verbs. InternPrep audits every line against 6 recruiter dimensions.
            </p>

            {/* 6-Dimension Scoreboard */}
            <div className="p-4 rounded-lg bg-[#0E1013] border border-white/[0.08] space-y-3 font-mono-tech text-xs">
              <div className="text-zinc-400 uppercase text-[11px] pb-1 border-b border-white/[0.06] flex justify-between">
                <span>AUDIT DIMENSION</span>
                <span>BENCHMARK SCORE</span>
              </div>
              {DIMENSIONS.map((dim, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-zinc-300">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{dim.score}</span>
                    <span className="text-[10px] text-zinc-500 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {dim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs text-zinc-300 font-sans">
              <div className="flex items-start gap-2">
                <Cpu className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Predicts the exact cross-questions an interviewer will ask based on your bullet points.</span>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Google XYZ Formula enforcement: Accomplished [X], as measured by [Y], by doing [Z].</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/resume">
                <Button size="sm" className="h-9 px-4 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold">
                  Run Full Resume Audit
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Line-by-Line Scanner Console */}
          <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#0E1013] overflow-hidden space-y-0">
            {/* Header */}
            <div className="px-4 py-2.5 bg-[#14161B] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono-tech text-zinc-400">
              <span>SCANNER CONSOLE: IITB PLACEMENT TEMPLATE</span>
              <span className="text-emerald-400 font-bold">TOTAL SCORE: 94/100</span>
            </div>

            <div className="p-6 space-y-4 font-sans">
              {/* Scanned Bullet Item 1 */}
              <div className="p-4 rounded-lg bg-[#14161B] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-zinc-400 font-semibold">BULLET 01 • QUANTITATIVE FINANCE</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Score: 98/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                  "Designed an automated statistical arbitrage strategy backtested across 5 years of tick data, generating an annualized Sharpe ratio of 2.84 with 14% max drawdown."
                </p>
                <div className="text-[11px] font-mono-tech text-zinc-500 pt-1">
                  TAGS: <span className="text-zinc-300">Sharpe 2.84, Tick Data, Risk Management</span>
                </div>
              </div>

              {/* Scanned Bullet Item 2 */}
              <div className="p-4 rounded-lg bg-[#14161B] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-zinc-400 font-semibold">BULLET 02 • SYSTEM SCALING</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Score: 96/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                  "Architected an event-driven Kafka ingestion pipeline processing 85,000 events/sec, cutting peak database write locks by 74%."
                </p>
                <div className="text-[11px] font-mono-tech text-zinc-500 pt-1">
                  TAGS: <span className="text-zinc-300">Kafka, 85k events/sec, Lock Reduction</span>
                </div>
              </div>

              {/* Cross-Question Warning */}
              <div className="p-3 rounded-md bg-[#181A20] border border-white/[0.06] text-xs font-mono-tech text-zinc-300 space-y-1">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> PREDICTED PARTNER CROSS-QUESTION
                </div>
                <div className="text-zinc-400">
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
