"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Sparkles, ShieldCheck, Zap, CreditCard, GraduationCap } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    category: "ai",
    categoryLabel: "AI Architecture",
    icon: Zap,
    question: "How does the Cerebras engine differ from standard ChatGPT?",
    answer: "Standard conversational LLMs have 3 to 8 seconds of latency, which breaks the pressure of a live interview. InternPrep runs on Cerebras ultra-fast inference hardware (~1000 tokens/sec, <150ms latency), allowing for natural speech rhythm and instant edge-case probing without awkward pauses.",
    tag: "<150ms Cerebras Llama-3.3"
  },
  {
    id: "faq-2",
    category: "credits",
    categoryLabel: "Credits & Passes",
    icon: CreditCard,
    question: "Do my 1-Time Top-Up Passes ever expire?",
    answer: "No. Top-Up Passes (such as the ₹49 Resume Pass, ₹79 Mock Pass, or ₹199 Sprint Pack) never expire. Credits remain permanently in your account balance until you use them for an interview or resume scan.",
    tag: "Permanent Non-Expiring"
  },
  {
    id: "faq-3",
    category: "guest",
    categoryLabel: "Free Sandbox",
    icon: Sparkles,
    question: "Can I try the platform without an account or credit card?",
    answer: "Yes! You can interact with the live Sandbox directly on this page or click 'Launch Free Interactive Sandbox' to start a complete guest session without providing any card details.",
    tag: "No Card Required"
  },
  {
    id: "faq-4",
    category: "resume",
    categoryLabel: "Resume RAG",
    icon: HelpCircle,
    question: "How does the Adaptive RAG resume engine evaluate my bullets?",
    answer: "The engine extracts every achievement from your PDF and computes high-dimensional vector embeddings to compare against verified Day 1 placement resumes. It identifies missing metrics and outputs line-by-line Google XYZ formula rewrites.",
    tag: "Google XYZ Benchmarking"
  },
  {
    id: "faq-5",
    category: "iitb",
    categoryLabel: "IIT Bombay Access",
    icon: GraduationCap,
    question: "Is access free for IIT Bombay students?",
    answer: "Yes! Students with an active @iitb.ac.in email address receive 100% free unlocked access to all mock interviews, resume diagnostics, and ATS tools upon single sign-on.",
    tag: "100% Free @iitb.ac.in"
  },
  {
    id: "faq-6",
    category: "privacy",
    categoryLabel: "Data Privacy",
    icon: ShieldCheck,
    question: "Is my uploaded resume kept private and secure?",
    answer: "Yes. All PDF resumes are parsed in isolated, transient sandbox containers with 256-bit encryption. We never sell or share candidate data with third-party recruiters without explicit opt-in.",
    tag: "TLS 256-Bit Encrypted"
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
          <span className="text-xs font-mono-tech text-muted-foreground">KNOWLEDGE BASE & ARCHITECTURE</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl">
              Everything you need to know about the platform.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl font-sans">
              Clear answers regarding latency, credits validity, data privacy, and domain tracks.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-muted/60 border border-border">
            {[
              { id: "all", label: "All Questions" },
              { id: "credits", label: "Credits & Passes" },
              { id: "ai", label: "AI Latency" },
              { id: "iitb", label: "IITB Access" },
              { id: "privacy", label: "Privacy" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono-tech transition-all ${
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

        {/* 2-Column Bento FAQ Grid */}
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
                    <div className="flex items-center justify-between text-xs font-mono-tech">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Icon className="h-4 w-4" />
                        <span>{faq.categoryLabel}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border text-[10px]">
                        {faq.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {faq.question}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 text-[11px] font-mono-tech text-muted-foreground flex items-center justify-between">
                    <span>STATUS: VERIFIED DIRECTIVE</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ACTIVE</span>
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
