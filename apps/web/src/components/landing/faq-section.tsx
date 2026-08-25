"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    question: "How realistic is the AI case interviewer compared to human peer mocks?",
    answer: "Extremely realistic. Our engine doesn't just read a script; it dynamically generates follow-up questions based on your specific responses, tests your assumptions, and forces you to defend your logic. It's calibrated specifically to mimic the pressure of an MBB Partner or FAANG Staff Engineer."
  },
  {
    question: "Do unused top-up credits expire?",
    answer: "No. Unlike traditional subscriptions where you lose what you don't use, our 1-Time Top-Up Passes (like the ₹79 Mock Pass) remain in your account permanently. Use them whenever your interview gets scheduled."
  },
  {
    question: "Can I practice without signing up or adding a credit card?",
    answer: "Yes! We offer a 1-click 'Guest Practice' mode. You can launch a free mock interview session in under 2 seconds without creating an account or entering any payment details."
  },
  {
    question: "How does the digital whiteboard work during mocks?",
    answer: "We've integrated an Excalidraw-powered canvas directly into the interview interface. As you speak to the AI, you can draw issue trees, structural diagrams, or system architectures. The AI will prompt you to explain your structure just like in a real case interview."
  },
  {
    question: "Is my resume kept private and secure?",
    answer: "Absolutely. We do not sell your data or share your resume with third-party recruiters without your explicit opt-in. Resumes uploaded for AI auditing are parsed temporarily and are never used to train public LLM models."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your monthly or yearly subscription at any time from your billing settings. Your access will remain active until the end of your current billing cycle."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative bg-muted/20 border-t border-border/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-premium">Questions.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about InternPrep AI.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`glass-panel border rounded-2xl overflow-hidden transition-colors duration-300 ${
                  isOpen ? "bg-white dark:bg-zinc-900 border-violet-500/30 shadow-md" : "bg-white/50 dark:bg-zinc-950/50 border-black/5 dark:border-white/5 hover:border-border"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className={`font-semibold text-base md:text-lg transition-colors ${isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 ml-4 p-1.5 rounded-full transition-colors ${isOpen ? "bg-violet-500/10 text-violet-600" : "bg-muted text-muted-foreground"}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
