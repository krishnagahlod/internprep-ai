"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
    <section className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [EXPERIENCE]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">STUDENT FEEDBACK</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Designed for candidates preparing for competitive Day 1 rounds.
        </h2>

        {/* 3 Outcome Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {OUTCOMES.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-6 space-y-5 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-4">
                {/* Meta Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono-tech">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      {item.initials}
                    </div>
                    <span className="text-foreground">{item.campus}</span>
                  </div>
                  <span className="text-muted-foreground">{item.turns}</span>
                </div>

                <div>
                  <div className="text-sm font-bold text-foreground">{item.firm}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono-tech mt-0.5">{item.role}</div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-muted-foreground pt-2 border-t border-border">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Placement Record</span>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Numbers Banner */}
        <div className="p-6 rounded-xl border border-border bg-card grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono-tech shadow-xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">10,000+</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Interview Turns Simulated</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">&lt; 150ms</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">AI Response Latency</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">6</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Resume Audit Dimensions</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">4</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Target Domain Tracks</div>
          </div>
        </div>

      </div>
    </section>
  );
}
