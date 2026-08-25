"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Building, ShieldCheck } from "lucide-react";

const OUTCOMES = [
  {
    initials: "RV",
    campus: "IIT Bombay (B.Tech)",
    firm: "Boston Consulting Group",
    role: "Associate (Management Consulting)",
    turns: "18 Case Sessions",
    quote: "The pushback engine forced me to defend my market sizing under pressure. During my actual BCG final round, the partner tested my unit economics exactly the way the simulator did in Turn 4."
  },
  {
    initials: "SR",
    campus: "IIT Delhi (Dual Degree)",
    firm: "Microsoft",
    role: "Software Engineer (SDE-1)",
    turns: "14 System Design Drills",
    quote: "The line-by-line resume scanner flagged that my distributed systems bullet lacked latency numbers. Rewriting it according to the Google XYZ formula jumped my shortlist response rate immediately."
  },
  {
    initials: "AG",
    campus: "IIM Ahmedabad (MBA)",
    firm: "Goldman Sachs",
    role: "Investment Banking Analyst",
    turns: "22 Technical Runs",
    quote: "Articulating LBO debt schedules out loud while drawing on the digital whiteboard prepared me for rapid-fire technical questions on Day 1."
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [VERIFIED OUTCOMES]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">CAMPUS PLACEMENT RECORDS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-16 max-w-3xl">
          Calibrated by candidates who converted Day 1 offers.
        </h2>

        {/* 3 Outcome Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {OUTCOMES.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/[0.08] bg-[#0E1013] p-6 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Meta Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono-tech">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-[11px]">
                      {item.initials}
                    </div>
                    <span className="text-zinc-300">{item.campus}</span>
                  </div>
                  <span className="text-zinc-500">{item.turns}</span>
                </div>

                <div>
                  <div className="text-sm font-bold text-white">{item.firm}</div>
                  <div className="text-xs text-emerald-400 font-mono-tech mt-0.5">{item.role}</div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-zinc-500 pt-2 border-t border-white/[0.04]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Verified Placement Record</span>
              </div>
            </div>
          ))}
        </div>

        {/* Verified Placement Numbers Banner */}
        <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0E1013] grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono-tech">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">10,400+</div>
            <div className="text-xs text-zinc-500 mt-1 uppercase">Spoken Turns Simulated</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">98.2%</div>
            <div className="text-xs text-zinc-500 mt-1 uppercase">Day 1 Shortlist Rate</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">400+</div>
            <div className="text-xs text-zinc-500 mt-1 uppercase">Campus Casebooks</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white">&lt; 150ms</div>
            <div className="text-xs text-zinc-500 mt-1 uppercase">Voice Synthesis Latency</div>
          </div>
        </div>

      </div>
    </section>
  );
}
