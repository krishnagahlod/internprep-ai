"use client";

import { motion } from "framer-motion";
import { FileText, Mic, Medal } from "lucide-react";

const STEPS = [
  {
    title: "Audit & Refine Your Resume",
    description: "Upload your existing PDF. Our AI evaluates every bullet against 6 key dimensions, highlights red flags, and instantly rewrites generic phrases into quantified, high-impact statements.",
    icon: FileText,
    color: "violet"
  },
  {
    title: "Train in High-Stakes Mocks",
    description: "Launch a live, voice-activated mock interview. The AI acts as a Partner, pushing back on your assumptions while you structure your thoughts on the integrated digital whiteboard.",
    icon: Mic,
    color: "cyan"
  },
  {
    title: "Debrief & Walk In Confident",
    description: "Review your post-interview scorecard. Identify exactly where your logic failed, track your progress over time, and practice targeted drills before the real thing.",
    icon: Medal,
    color: "emerald"
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground mb-4">
            From Draft to <span className="text-transparent bg-clip-text bg-gradient-premium">Offer Letter.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A battle-tested 3-step pipeline designed to secure Day 1 placements.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 md:left-[50%] top-8 bottom-8 w-px bg-border -translate-x-[0.5px]" />
          
          <div className="space-y-16">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isEven = idx % 2 === 0;
              
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={`relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16`}
                >
                  {/* Timeline Node */}
                  <div className={`absolute left-6 md:left-[50%] top-6 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-background bg-${step.color}-500 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(var(--color-${step.color}-500),0.5)]`}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Content Box */}
                  <div className={`ml-16 md:ml-0 md:w-1/2 ${isEven ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-${step.color}-500/10 text-${step.color}-500 mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 md:hidden">
                       <span className="text-sm font-black text-muted-foreground">STEP 0{idx + 1}</span>
                    </div>
                    <div className={`hidden md:flex items-center gap-3 mb-2 ${isEven ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-sm font-black text-muted-foreground">STEP 0{idx + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 font-outfit">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Empty space for the other half */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
