"use client";

import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, CheckCircle2, MessageSquare } from "lucide-react";

const IITB_TESTIMONIALS = [
  {
    initials: "RV",
    name: "Rahul V.",
    dept: "IIT Bombay (B.Tech Mechanical '25)",
    role: "Consulting & Case Prep",
    quote: "The live edge-case probing was surprisingly realistic. Having the AI interrupt when my contribution margin napkin math didn't add up forced me to be much more rigorous in my actual consulting round."
  },
  {
    initials: "SS",
    name: "Siddharth S.",
    dept: "IIT Bombay (Dual Degree CSE '25)",
    role: "Software Systems Track",
    quote: "The resume scanner flagged that my distributed systems bullet lacked quantifiable throughput metrics. Rewriting it according to the Google XYZ diff format gave it a much stronger technical punch."
  },
  {
    initials: "AG",
    name: "Ananya G.",
    dept: "IIT Bombay (B.Tech Electrical '25)",
    role: "Analytics & Quant Track",
    quote: "The 7-dimension post-interview rubric was super helpful for spotting logic gaps in my causal experimentation framework before our campus Day 1 shortlist interviews."
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [CAMPUS PILOT]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">IIT BOMBAY STUDENT FEEDBACK</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Early feedback from IIT Bombay candidates.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans">
              Tested by campus students preparing for competitive placement & internship shortlists.
            </p>
          </div>
        </div>

        {/* 3 Clean Compact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {IITB_TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between shadow-xs hover:border-emerald-500/30 transition-all space-y-4"
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono-tech">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      {item.initials}
                    </div>
                    <div>
                      <div className="text-foreground font-bold text-xs">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">{item.dept}</div>
                    </div>
                  </div>
                </div>

                {/* Track Badge */}
                <div className="inline-block px-2 py-0.5 rounded bg-muted text-emerald-600 dark:text-emerald-400 text-[11px] font-mono-tech font-semibold border border-border">
                  {item.role}
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans italic">
                  "{item.quote}"
                </p>
              </div>

              {/* Verified Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-emerald-600 dark:text-emerald-400 pt-3 border-t border-border/50">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified @iitb.ac.in Student</span>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Stats Bar */}
        <div className="p-5 rounded-xl border border-border bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono-tech shadow-xs">
          <div>
            <div className="text-2xl font-bold text-foreground">500+</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 uppercase">Campus Resumes Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">&lt; 150ms</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 uppercase">Average Voice Latency</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">5</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 uppercase">Domain Prep Tracks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">100% Free</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 uppercase">For @iitb.ac.in Students</div>
          </div>
        </div>

      </div>
    </section>
  );
}
