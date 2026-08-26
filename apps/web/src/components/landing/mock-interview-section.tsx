"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowRight, Activity, Layers, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRACKS = [
  {
    id: "consulting",
    label: "Management Consulting",
    persona: "Tier-1 Strategy & Case Engine",
    focus: "Clarification, MECE Structuring, Napkin Math, Synthesis",
    turnExample: {
      interviewer: "You assumed a 20% operating margin, but logistics in Tier-2 Indian cities carry a 40% higher return-to-origin cost. How does that reshape your unit economics?",
      candidate: "Factoring in a 14% RTO rate and ₹65 reverse logistics penalty, the break-even threshold shifts from 3.2 to 4.8 orders per active user.",
      rubricBadge: "MECE Score: 9.8/10",
    }
  },
  {
    id: "tech",
    label: "Systems & SWE",
    persona: "Engineering & Architecture Track",
    focus: "Distributed Concurrency, Caching SLAs, Failure Modes",
    turnExample: {
      interviewer: "Your caching layer avoids database contention, but what prevents cache stampede when the 100k-key flash sale cache expires simultaneously at midnight?",
      candidate: "I'll implement probabilistic early expiration with mutex locks and jittered TTLs, ensuring only one background thread computes the cache while others read the replica.",
      rubricBadge: "System Architecture: 9.9/10",
    }
  },
  {
    id: "finance",
    label: "Finance & Analytics",
    persona: "Investment Banking & Quant Track",
    focus: "Financial Statements, LBO Cash Flows, Working Capital",
    turnExample: {
      interviewer: "If Capex is $10M higher than Depreciation, how does this flow through the three financial statements and impact Unlevered Free Cash Flow?",
      candidate: "Income Statement is unchanged initially. Cash Flow: CFO flat, CFI down $10M. Balance Sheet: Cash down $10M, PP&E up $10M. UFCF decreases by $10M.",
      rubricBadge: "Financial Precision: 10/10",
    }
  }
];

export function MockInterviewSection() {
  const [activeTrack, setActiveTrack] = useState(0);
  const track = TRACKS[activeTrack];

  return (
    <section id="simulator" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [CORE MODULE 01]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">INTERVIEW SIMULATOR</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Conversational simulation that challenges your assumptions in real time.
        </h2>

        {/* 2-Column Deep Dive */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Feature Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans">
              Powered by Cerebras Llama-3.3 running at ~1000 tokens/sec. The AI guides you through authentic technical and case rounds, probing logical leaps and testing your defensibility.
            </p>

            {/* Track Switcher */}
            <div className="space-y-2">
              <div className="text-xs font-mono-tech text-muted-foreground uppercase">Target Placement Track</div>
              <div className="space-y-2">
                {TRACKS.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrack(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all text-xs font-mono-tech flex items-center justify-between focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                      activeTrack === idx
                        ? "bg-card border-emerald-500/50 text-foreground shadow-xs"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.persona}</div>
                    </div>
                    {activeTrack === idx && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Points */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-sans">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero awkward pauses: instant AI interviewer responses preserve natural conversation flow.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-sans">
                <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Interrogates your logic during calculation, system design, and final synthesis.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-sans">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Comprehensive debrief grading communication, structuring, and numerical defensibility.</span>
              </div>
            </div>

            <div className="pt-2">
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

          {/* Right Column: Console Preview */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
              <span>LIVE TRANSCRIPT INTERACTION</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{track.turnExample.rubricBadge}</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-xs font-mono-tech text-muted-foreground">
                PHASE FOCUS: <span className="text-foreground font-medium">{track.focus}</span>
              </div>

              {/* Pushback Turn */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-tech text-amber-600 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  <span>INTERVIEWER CROSS-EXAMINATION & PROBING</span>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                  "{track.turnExample.interviewer}"
                </div>
              </div>

              {/* Candidate Turn */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-tech text-emerald-600 dark:text-emerald-400">
                  <Mic className="h-3.5 w-3.5" />
                  <span>CANDIDATE LOGICAL DEFENSE</span>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-foreground font-sans leading-relaxed">
                  "{track.turnExample.candidate}"
                </div>
              </div>

              {/* Verdict */}
              <div className="p-3 rounded-md bg-muted/60 border border-border flex items-center justify-between text-xs font-mono-tech">
                <span className="text-muted-foreground">EVALUATION</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passed Probe • Strict Logic Verified</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
