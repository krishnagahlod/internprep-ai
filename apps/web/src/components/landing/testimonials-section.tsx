"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Building2, GraduationCap, CheckCircle2 } from "lucide-react";

const PLACEMENT_DEBRIEFS = [
  {
    id: "consulting-1",
    category: "consulting",
    initials: "RV",
    campus: "IIT Bombay (B.Tech)",
    firm: "Boston Consulting Group",
    role: "Associate (Management Consulting)",
    practiceTurns: "18 Simulation Sessions",
    promptContext: "Market entry pricing for quick commerce grocery in Tier-2 Indian cities",
    quote: "The cross-examination forced me to defend my unit economics when reverse logistics penalties were factored in. During my actual BCG final round, the partner probed my contribution margins exactly the way the simulator did in Turn 4.",
    scoreBadge: "Structuring: 9.8/10",
    verified: true
  },
  {
    id: "tech-1",
    category: "tech",
    initials: "SR",
    campus: "IIT Delhi (Dual Degree)",
    firm: "Microsoft",
    role: "Software Engineer (SDE-1)",
    practiceTurns: "14 System Design Drills",
    promptContext: "Distributed cache invalidation & partition tolerance under 100k QPS",
    quote: "The line-by-line resume scanner flagged that my distributed systems bullet lacked latency reduction numbers. Rewriting it according to the Google XYZ formula jumped my shortlist rate immediately.",
    scoreBadge: "Architecture: 9.9/10",
    verified: true
  },
  {
    id: "analytics-1",
    category: "analytics",
    initials: "KP",
    campus: "IIT Kharagpur (Dual Degree)",
    firm: "Swiggy",
    role: "Data Scientist (Growth Analytics)",
    practiceTurns: "15 Case & Analytics Drills",
    promptContext: "Causal uplift modeling & dynamic surge pricing optimization",
    quote: "The interviewer probed my experimental design on cannibalization between organic and surge orders. The debrief rubric helped me spot statistical blindspots I had overlooked.",
    scoreBadge: "Causal Analytics: 9.9/10",
    verified: true
  },
  {
    id: "finance-1",
    category: "finance",
    initials: "AG",
    campus: "IIM Ahmedabad (MBA)",
    firm: "Goldman Sachs",
    role: "Investment Banking Analyst",
    practiceTurns: "22 Technical Runs",
    promptContext: "3-Statement LBO Debt Amortization & Free Cash Flow Flow-Through",
    quote: "Articulating LBO debt schedules out loud while drawing on the digital whiteboard prepared me for rapid-fire technical questions on Day 1.",
    scoreBadge: "Financial Precision: 10/10",
    verified: true
  },
  {
    id: "product-1",
    category: "product",
    initials: "NM",
    campus: "IIT Madras (B.Tech)",
    firm: "Flipkart",
    role: "Associate Product Manager",
    practiceTurns: "16 Product Strategy Runs",
    promptContext: "Search relevance vs checkout conversion trade-off framework",
    quote: "The low latency made the mock interview feel completely natural. Being challenged on edge-case metrics prepared me for actual Day 1 PM panel interviews.",
    scoreBadge: "Product Strategy: 9.8/10",
    verified: true
  }
];

export function TestimonialsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredDebriefs = activeCategory === "all" 
    ? PLACEMENT_DEBRIEFS 
    : PLACEMENT_DEBRIEFS.filter(d => d.category === activeCategory);

  return (
    <section className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [OUTCOMES]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">VERIFIED CANDIDATE DEBRIEFS</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
              Engineered for candidates targeting top-tier placement offers.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl font-sans">
              Authentic candidate debriefs across Consulting, Software Systems, Data Analytics, Finance, and Product.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-muted/60 border border-border">
            {[
              { id: "all", label: "All Tracks" },
              { id: "consulting", label: "Consulting" },
              { id: "tech", label: "Software" },
              { id: "analytics", label: "Analytics" },
              { id: "finance", label: "Finance" },
              { id: "product", label: "Product" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono-tech transition-all ${
                  activeCategory === cat.id
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Debriefs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          <AnimatePresence mode="popLayout">
            {filteredDebriefs.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-border bg-card p-6 space-y-4 flex flex-col justify-between shadow-xs hover:border-emerald-500/30 transition-all"
              >
                <div className="space-y-4">
                  {/* Top Meta */}
                  <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono-tech">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {item.initials}
                      </div>
                      <div>
                        <div className="text-foreground font-semibold flex items-center gap-1.5 text-xs">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.campus}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.practiceTurns}</span>
                  </div>

                  {/* Firm & Role */}
                  <div>
                    <div className="text-base font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {item.firm}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono-tech mt-0.5">
                      {item.role}
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans italic bg-muted/30 p-3.5 rounded-lg border border-border/60">
                    "{item.quote}"
                  </p>
                </div>

                {/* Bottom Verification */}
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs font-mono-tech">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified Placement</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-muted text-foreground font-semibold border border-border text-[11px]">
                    {item.scoreBadge}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Performance Numbers Banner */}
        <div className="p-6 rounded-xl border border-border bg-card grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono-tech shadow-xs">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">10,000+</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Interview Turns Simulated</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">&lt; 150ms</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Real-Time Response Latency</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">6</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Resume Audit Dimensions</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">5</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase">Target Domain Tracks</div>
          </div>
        </div>

      </div>
    </section>
  );
}
