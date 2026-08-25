"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    question: "How does the Cerebras case interview engine differ from standard ChatGPT?",
    answer: "Standard conversational LLMs often experience 3 to 8 seconds of latency, breaking the pressure and natural rhythm of a case interview. InternPrep runs on specialized Cerebras inference hardware generating ~1000 tokens/sec (<150ms latency). Furthermore, it is explicitly programmed with strict MBB Partner personas to interrupt weak logic, question missing unit economics, and force you to defend your framework."
  },
  {
    question: "Do my top-up credits ever expire?",
    answer: "No. 1-Time Top-Up Passes (such as the ₹79 Mock Pass or ₹199 Sprint Pack) remain permanently credited to your account balance until used. You can purchase them in advance and use them whenever your campus interview shortlist is announced."
  },
  {
    question: "Can I try the platform without an account or credit card?",
    answer: "Yes. The Interactive Sandbox on this page is fully functional. You can also click 'Launch Free Sandbox' to start a complete guest session immediately without entering payment details or signing up."
  },
  {
    question: "How does the Adaptive RAG resume engine evaluate my bullet points?",
    answer: "Using Google Gemini multimodal vision and text extraction, the system parses each achievement in your uploaded PDF. It computes vector embeddings for every bullet to match against verified, successful past placement resumes, then generates line-by-line diff rewrites following the Google XYZ formula (Accomplished [X], as measured by [Y], by doing [Z])."
  },
  {
    question: "Is my uploaded resume kept private and secure?",
    answer: "Yes. Uploaded PDF resumes are parsed in isolated, transient execution environments. We do not sell your personal data or resume records to third-party recruiters without your explicit affirmative opt-in."
  },
  {
    question: "What target domains are supported for domain-specific mocks?",
    answer: "We support specialized mock interviews for Management Consulting (Case Interviews), Software Engineering (Systems & Architecture), Quantitative Finance (Valuation & LBOs), and Product Management."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [FAQ]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">FREQUENTLY ASKED QUESTIONS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Everything you need to know about the platform.
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card overflow-hidden transition-colors shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className="font-semibold text-sm sm:text-base text-foreground">
                    {faq.question}
                  </span>
                  <div className="shrink-0 ml-4 text-muted-foreground">
                    {isOpen ? <Minus className="w-4 h-4 text-foreground" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans border-t border-border/50">
                        <p className="pt-3">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
