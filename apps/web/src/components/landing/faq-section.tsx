"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    question: "How does the voice pushback engine differ from standard ChatGPT voice mode?",
    answer: "Standard conversational LLMs are designed to be agreeable and pleasant. InternPrep is explicitly trained on McKinsey, BCG, and FAANG partner rubrics. It interrupts weak logic, rejects unquantified claims, interrogates missing unit economics, and forces you to defend your framework under time pressure."
  },
  {
    question: "Do my top-up credits ever expire?",
    answer: "No. 1-Time Top-Up Passes (such as the ₹79 Voice Mock Pass or ₹199 Sprint Pack) remain permanently credited to your account until used. You can purchase them weeks before placement season and consume them when your interviews are scheduled."
  },
  {
    question: "Can I test the platform without an account or credit card?",
    answer: "Yes. The Interactive Sandbox at the top of this page is fully functional. You can also click 'Launch Free Sandbox' to start a complete guest session in under 2 seconds without entering any payment or login credentials."
  },
  {
    question: "How does the Excalidraw digital whiteboard sync during case interviews?",
    answer: "When practicing cases that require visual structuring (e.g., market sizing trees, profit trees, system architecture diagrams), the whiteboard is embedded directly alongside the voice channel. The AI analyzes your visual breakdown and prompts you to walk through your nodes."
  },
  {
    question: "Is my uploaded resume kept private and secure?",
    answer: "Yes. Uploaded PDF resumes are parsed in isolated secure memory, evaluated against placement rubrics, and are never used to train public machine learning models or sold to third-party recruiters without your explicit permission."
  },
  {
    question: "How are the 400+ campus casebooks compiled?",
    answer: "Our casebook vault is curated from verified placement transcripts at IIT Bombay, IIM Ahmedabad, and ISB over the past 5 placement cycles, complete with actual numerical data, interviewer prompts, and top-percentile candidate responses."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [FAQ]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">TECHNICAL SPECIFICATIONS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-16 max-w-3xl">
          Frequently asked questions.
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-lg border border-white/[0.08] bg-[#0E1013] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className="font-semibold text-sm sm:text-base text-zinc-200">
                    {faq.question}
                  </span>
                  <div className="shrink-0 ml-4 text-zinc-400">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4 text-zinc-500" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans border-t border-white/[0.04]">
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
