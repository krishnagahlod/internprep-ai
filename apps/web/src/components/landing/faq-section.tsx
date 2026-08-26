"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, CreditCard, Sparkles, FileText, GraduationCap, Users } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    category: "interviews",
    categoryLabel: "Interview Simulation",
    icon: MessageSquare,
    question: "How do the conversational mock interview simulations work?",
    answer: "InternPrep AI simulates realistic, multi-turn interview rounds across 5 specialized domains. The AI evaluates your problem structuring, pushes back on flawed assumptions, and probes your edge-case calculations in real time without awkward delays. After each session, you receive a full transcript and 7-dimension performance rubric."
  },
  {
    id: "faq-2",
    category: "credits",
    categoryLabel: "Credits & Validity",
    icon: CreditCard,
    question: "Do my 1-Time Top-Up Passes ever expire?",
    answer: "No. Top-up passes (such as the ₹49 Single Resume Pass, ₹79 Single Mock Pass, or ₹199 Sprint Pack) never expire. Credits remain permanently in your account balance until you use them for an interview session or resume audit."
  },
  {
    id: "faq-3",
    category: "resume",
    categoryLabel: "Resume Intelligence",
    icon: FileText,
    question: "How does the resume intelligence engine evaluate my bullets?",
    answer: "The engine extracts every achievement from your uploaded PDF and benchmarks it against verified Day 1 placement resumes. It identifies missing scale, flags passive verbs, and generates line-by-line Google XYZ formula rewrites (Accomplished [X], measured by [Y], by doing [Z])."
  },
  {
    id: "faq-4",
    category: "domains",
    categoryLabel: "Domain Tracks",
    icon: Sparkles,
    question: "What 5 domain tracks are available on the platform?",
    answer: "We support tailored interview simulations and resume scoring for Management Consulting (Case Interviews), Software & Systems Engineering, Data Science & Analytics, Quantitative Finance & Valuation, and Product Management."
  },
  {
    id: "faq-5",
    category: "iitb",
    categoryLabel: "IIT Bombay Verification",
    icon: GraduationCap,
    question: "Is InternPrep AI free for IIT Bombay students?",
    answer: "Yes! Students with an active @iitb.ac.in email address receive 100% free unlocked access to all interview tracks, resume diagnostics, ATS checkers, and point bank tools upon single sign-on."
  },
  {
    id: "faq-6",
    category: "access",
    categoryLabel: "General Access",
    icon: Users,
    question: "Can off-campus and other college candidates use the platform?",
    answer: "Yes. Candidates from all universities can sign up and use our free interactive sandbox or purchase non-expiring micro-passes starting at ₹49 to prepare for their upcoming corporate placement drives and internship rounds."
  }
];

export function FaqSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredFaqs = selectedCategory === "all"
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter(f => f.category === selectedCategory);

  return (
    <section id="faq" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [FAQ]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">FREQUENTLY ASKED QUESTIONS</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
              Everything you need to know about the platform.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl font-sans">
              Clear answers regarding interview simulation, credit validity, domain coverage, and access.
            </p>
          </div>

          {/* Clean Single-Row Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border overflow-x-auto max-w-full custom-scrollbar">
            {[
              { id: "all", label: "All Questions" },
              { id: "interviews", label: "Interviews" },
              { id: "credits", label: "Credits & Passes" },
              { id: "resume", label: "Resume RAG" },
              { id: "domains", label: "5 Domains" },
              { id: "iitb", label: "IITB Access" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono-tech whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modern 2-Column Bento FAQ Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.map((faq) => {
              const Icon = faq.icon;
              return (
                <motion.div
                  key={faq.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-border bg-card p-6 space-y-4 flex flex-col justify-between shadow-xs hover:border-emerald-500/30 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs font-mono-tech">
                      <Icon className="h-4 w-4" />
                      <span>{faq.categoryLabel}</span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {faq.question}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/50 text-[11px] font-mono-tech text-muted-foreground flex items-center justify-between">
                    <span>InternPrep Knowledge Base</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
