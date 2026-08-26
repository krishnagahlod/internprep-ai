"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowRight, Activity, Layers, MessageSquare, Sparkles, Volume2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRACKS = [
  {
    id: "consulting",
    label: "Management Consulting",
    tag: "Strategy & Case",
    focus: "MECE Structuring & Margin Turnaround",
    turnExample: {
      interviewer: "You assumed a 20% operating margin, but logistics in Tier-2 Indian cities carry a 40% higher return-to-origin cost. How does that reshape your unit economics?",
      candidate: "Factoring in a 14% RTO rate and ₹65 reverse logistics penalty, the break-even threshold shifts from 3.2 to 4.8 orders per active user.",
      score: "9.8",
      metric: "MECE Structuring"
    }
  },
  {
    id: "tech",
    label: "Systems & SWE",
    tag: "Architecture & Scale",
    focus: "Distributed Concurrency & Caching SLAs",
    turnExample: {
      interviewer: "Your caching layer avoids database contention, but what prevents cache stampede when the 100k flash sale keys expire simultaneously at midnight?",
      candidate: "I'll implement probabilistic early expiration with mutex locks and jittered TTLs, ensuring only one background thread computes the key while replicas serve traffic.",
      score: "9.9",
      metric: "System Architecture"
    }
  },
  {
    id: "analytics",
    label: "Data Analytics",
    tag: "Causal Inference",
    focus: "A/B Testing & Attribution Frameworks",
    turnExample: {
      interviewer: "Your attribution model shows a 20% lift in 90-day retention, but paid CAC rose 15%. How do you mathematically verify incremental contribution margin?",
      candidate: "I'll construct a difference-in-differences quasi-experiment controlling for regional seasonality before computing incremental Net Present Value (iNPV).",
      score: "9.8",
      metric: "Causal Inference"
    }
  },
  {
    id: "finance",
    label: "Finance & Quant",
    tag: "Valuation & LBO",
    focus: "3-Statement Mechanics & Cash Flow",
    turnExample: {
      interviewer: "If Capex is $10M higher than Depreciation, how does this flow through the three financial statements and impact Unlevered Free Cash Flow?",
      candidate: "Income Statement is unchanged. Cash Flow: CFO flat, CFI down $10M. Balance Sheet: Cash down $10M, PP&E up $10M. UFCF decreases by $10M.",
      score: "10.0",
      metric: "Financial Precision"
    }
  },
  {
    id: "product",
    label: "Product Management",
    tag: "Strategy & Metrics",
    focus: "User Journey & Trade-Off Frameworks",
    turnExample: {
      interviewer: "If DAU increases by 12% following the recommendation rollout but session duration drops by 18%, is this feature successful?",
      candidate: "I will segment transactional queries (where faster task completion is positive) from exploratory browsing feeds to verify true utility vs drop-off.",
      score: "9.7",
      metric: "Product Acumen"
    }
  }
];

export function MockInterviewSection() {
  const [activeTrack, setActiveTrack] = useState(0);
  const track = TRACKS[activeTrack];

  return (
    <section id="simulator" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [CORE MODULE 01]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">INTERVIEW SIMULATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
              Conversational simulation that probes your assumptions in real time.
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground bg-muted/60 px-3.5 py-1.5 rounded-full border border-border shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time voice & text evaluation</span>
          </div>
        </div>

        {/* Horizontal 5-Track Segment Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/50 border border-border mb-8 overflow-x-auto max-w-full custom-scrollbar">
          {TRACKS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setActiveTrack(idx)}
              className={`px-4 py-2 rounded-lg text-xs font-mono-tech whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTrack === idx
                  ? "bg-card text-foreground font-bold shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                activeTrack === idx ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold" : "bg-muted text-muted-foreground"
              }`}>
                {t.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Balanced 2-Column Interactive Workspace */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Visual Speech & Telemetry Station */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono-tech">
                <span className="text-muted-foreground">ENGINE TELEMETRY</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">&lt; 150MS LATENCY</span>
              </div>

              {/* Animated Audio Speech Waveform Graphic */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Mic className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Live Speech Synthesis
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                </div>

                {/* Simulated Animated Waveform Bars */}
                <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                  {[40, 65, 85, 30, 95, 70, 45, 90, 60, 100, 75, 40, 80, 55, 35, 90, 65, 45, 80, 30].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.3}%`] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: i * 0.05,
                        ease: "easeInOut"
                      }}
                      className="w-1 bg-emerald-500/80 rounded-full"
                    />
                  ))}
                </div>

                <div className="text-[11px] font-mono-tech text-muted-foreground text-center">
                  Zero awkward pauses • Continuous conversational flow
                </div>
              </div>

              {/* Scorecard Gauge Preview */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between font-mono-tech">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">{track.turnExample.metric}</div>
                  <div className="text-xl font-bold text-foreground mt-0.5">{track.turnExample.score} / 10</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  PASS
                </div>
              </div>

            </div>

            {/* Action CTA */}
            <div className="pt-6 border-t border-border">
              <Link href="/interview" className="block w-full">
                <Button 
                  size="lg" 
                  className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-bold font-mono-tech shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
                >
                  Launch Live {track.label} Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Dialogue Console */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
                <span>SIMULATED DIALOGUE • TURN 02</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{track.focus}</span>
              </div>

              <div className="p-6 space-y-5">
                {/* Interviewer Pushback */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono-tech text-amber-600 dark:text-amber-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span>INTERVIEWER PROBING TURN</span>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                    "{track.turnExample.interviewer}"
                  </div>
                </div>

                {/* Candidate Defense */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Mic className="h-3.5 w-3.5" />
                    <span>CANDIDATE LOGICAL DEFENSE</span>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                    "{track.turnExample.candidate}"
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Evaluation Banner */}
            <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between text-xs font-mono-tech">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Probe Defended Successfully</span>
              </div>
              <span className="text-muted-foreground">Calibration: Day 1 Benchmark</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
