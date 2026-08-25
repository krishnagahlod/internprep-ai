"use client";

import { motion } from "framer-motion";
import { UploadCloud, MessageSquare, Award } from "lucide-react";

const STEPS = [
  {
    step: "01",
    tag: "RESUME AUDIT",
    title: "Upload & Audit Your Resume",
    description: "Upload your PDF draft. The system extracts your bullet points, benchmarks each line against verified placement examples, and flags weak verbs.",
    icon: UploadCloud,
    codePreview: "[SCAN] 24 bullets parsed • Vector similarity match: 94% • 3 diff rewrites generated"
  },
  {
    step: "02",
    tag: "LIVE SIMULATION",
    title: "Train in Conversational Mock Mocks",
    description: "Engage in live mock interviews. The AI assumes an MBB Partner persona, pushing back on your logic and challenging your calculation napkin math.",
    icon: MessageSquare,
    codePreview: "[SIMULATOR] Cerebras Llama-3.3 • Latency: 138ms • Partner pushback triggered"
  },
  {
    step: "03",
    tag: "DEBRIEF & DRILL",
    title: "Review Scorecards & Iterate",
    description: "Inspect your post-session scorecard across MECE structuring, communication, and business logic to eliminate weaknesses before the real interview.",
    icon: Award,
    codePreview: "[SCORECARD] Structuring: 9.6/10 • Business Logic: 9.2/10 • Verdict: Strong Hire"
  }
];

export function HowItWorks() {
  return (
    <section className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [WORKFLOW]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">HOW IT WORKS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Three structured stages from first draft to Day 1 offer.
        </h2>

        {/* 3-Step Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card p-6 space-y-5 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">STEP {s.step}</span>
                    <span>{s.tag}</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground leading-snug">
                    {s.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                    {s.description}
                  </p>
                </div>

                {/* Console Log Preview */}
                <div className="p-2.5 rounded bg-muted/50 border border-border text-[11px] font-mono-tech text-muted-foreground truncate">
                  {s.codePreview}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
