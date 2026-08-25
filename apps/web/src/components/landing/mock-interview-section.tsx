"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowRight, Check, Activity, Layers, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRACKS = [
  {
    id: "consulting",
    label: "Management Consulting",
    persona: "BCG / McKinsey Partner Track",
    focus: "MECE Structure, Market Sizing, Profitability Diagnostics",
    turnExample: {
      interviewer: "You assumed a 20% operating margin, but logistics in Tier-2 Indian cities carry a 40% higher return-to-origin cost. How does that reshape your unit economics?",
      candidate: "I'll adjust the Contribution Margin per order: factoring in a 14% RTO rate and ₹65 reverse logistics penalty, the break-even threshold shifts from 3.2 to 4.8 orders per active user.",
      rubricBadge: "MECE Score: 9.8/10",
    }
  },
  {
    id: "tech",
    label: "Systems & SWE",
    persona: "FAANG Staff Engineer Track",
    focus: "Concurrency, Partition Tolerance, P99 Latency SLAs",
    turnExample: {
      interviewer: "Your caching layer avoids database contention, but what prevents cache stampede when the 100k-key flash sale cache expires simultaneously at midnight?",
      candidate: "I'll implement probabilistic early expiration with mutex locks and jittered TTLs, ensuring only one background thread computes the cache while others read the stale replica.",
      rubricBadge: "System Architecture: 9.9/10",
    }
  },
  {
    id: "finance",
    label: "Investment Banking & PE",
    persona: "Goldman Sachs VP Track",
    focus: "LBO Modeling, WACC Calculation, Working Capital Cycles",
    turnExample: {
      interviewer: "If Capex is $10M higher than Depreciation, how does this flow through the three financial statements and impact Unlevered Free Cash Flow?",
      candidate: "On Income Statement: unchanged immediately. Cash Flow: Net CFO drops by $0, Cash from CFI drops by $10M. Balance Sheet: Cash down $10M, PP&E up $10M. UFCF decreases by $10M.",
      rubricBadge: "Accounting Precision: 10/10",
    }
  }
];

export function MockInterviewSection() {
  const [activeTrack, setActiveTrack] = useState(0);
  const track = TRACKS[activeTrack];

  return (
    <section id="simulator" className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [CORE ENGINE 01]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">VOICE SIMULATION</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-16 max-w-3xl">
          Voice-activated simulation that pushes back when your logic fails.
        </h2>

        {/* 2-Column Deep Dive */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Features & Track Switcher */}
          <div className="lg:col-span-5 space-y-8">
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
              Traditional mock platforms read static scripts. InternPrep evaluates your live spoken answers, interrogates your unstated assumptions, and dynamically introduces real-world constraints.
            </p>

            {/* Track Switcher */}
            <div className="space-y-2">
              <div className="text-xs font-mono-tech text-zinc-500 uppercase">Select Target Domain</div>
              <div className="space-y-2">
                {TRACKS.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrack(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all text-xs font-mono-tech flex items-center justify-between ${
                      activeTrack === idx
                        ? "bg-[#16181D] border-emerald-500/50 text-white shadow-sm"
                        : "bg-[#0E1013] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-[#121316]"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-zinc-200">{t.label}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{t.persona}</div>
                    </div>
                    {activeTrack === idx && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Feature Checkpoints */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <div className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans">
                <Activity className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Voice latency under 150ms for realistic partner dialogue cadence.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans">
                <PenTool className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Integrated digital whiteboard for drawing issue trees and architecture graphs.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans">
                <Layers className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Post-session debrief rubric benchmarking against top 5% campus peers.</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/interview">
                <Button size="sm" className="h-9 px-4 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold">
                  Launch {track.label} Session
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Turn Console */}
          <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#0E1013] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2.5 bg-[#14161B] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono-tech text-zinc-400">
              <span>LIVE TRANSCRIPT INTERROGATION</span>
              <span className="text-emerald-400">{track.turnExample.rubricBadge}</span>
            </div>

            <div className="p-6 space-y-6">
              {/* Focus Banner */}
              <div className="text-xs font-mono-tech text-zinc-500">
                FOCUS AREA: <span className="text-zinc-300">{track.focus}</span>
              </div>

              {/* Turn Step: Partner Pushback */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-tech text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                  <span>PARTNER PUSHBACK (INTERRUPT AT 04:12)</span>
                </div>
                <div className="p-4 rounded-lg bg-[#14161B] border border-red-500/20 text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed">
                  "{track.turnExample.interviewer}"
                </div>
              </div>

              {/* Turn Step: Candidate Defense */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-tech text-emerald-400">
                  <Mic className="h-3.5 w-3.5" />
                  <span>CANDIDATE QUANTITATIVE RECTIFICATION</span>
                </div>
                <div className="p-4 rounded-lg bg-[#14161B] border border-emerald-500/30 text-xs sm:text-sm text-white font-sans leading-relaxed">
                  "{track.turnExample.candidate}"
                </div>
              </div>

              {/* Real-time Verdict */}
              <div className="p-3 rounded-md bg-[#121418] border border-white/[0.06] flex items-center justify-between text-xs font-mono-tech">
                <span className="text-zinc-400">EVALUATION SUMMARY</span>
                <span className="text-emerald-400 font-bold">Passed Pushback • Zero Fluff Detected</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
