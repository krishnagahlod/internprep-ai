"use client";

import { motion } from "framer-motion";
import { UploadCloud, Mic2, Award } from "lucide-react";

const STEPS = [
  {
    step: "01",
    tag: "RESUME AUDIT",
    title: "Ingest and Audit Your Resume",
    description: "Upload your current PDF draft. The system evaluates every line against 6 recruiter dimensions, flags unquantified claims, and predicts partner cross-questions.",
    icon: UploadCloud,
    codePreview: "[SCAN] 18 bullet points parsed • 4 passive verbs detected • 3 metrics quantified"
  },
  {
    step: "02",
    tag: "LIVE SIMULATION",
    title: "Train in Voice-First Pressure Mocks",
    description: "Engage in live voice-enabled mock interviews. The AI assumes a McKinsey Partner or FAANG Staff Engineer persona, interrupting and testing your logic in real time.",
    icon: Mic2,
    codePreview: "[VOICE] Latency: 142ms • Interruption at Turn 04 • Whiteboard sync: Active"
  },
  {
    step: "03",
    tag: "DEBRIEF & OFFER",
    title: "Debrief Against Placement Rubrics",
    description: "Review your comprehensive post-session scorecard. Identify structural weaknesses, review transcript highlights, and walk into Day 1 placement rounds fully calibrated.",
    icon: Award,
    codePreview: "[SCORE] MECE: 9.6/10 • Business Acumen: 9.2/10 • Verdict: Strong Hire"
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [WORKFLOW]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">METHODOLOGY</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-16 max-w-3xl">
          Three structured stages from unquantified draft to Day 1 offer.
        </h2>

        {/* 3-Step Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.08] bg-[#0E1013] p-6 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-500">
                    <span className="text-emerald-400 font-bold">STEP {s.step}</span>
                    <span>{s.tag}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">
                    {s.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                    {s.description}
                  </p>
                </div>

                {/* Console Log Preview */}
                <div className="p-2.5 rounded bg-[#14161B] border border-white/[0.04] text-[11px] font-mono-tech text-zinc-400 truncate">
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
