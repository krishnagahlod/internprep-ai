"use client";

import { motion } from "framer-motion";
import { FileSearch, Activity, FileCheck, ArrowRight, TrendingUp, AlertCircle, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DIMENSIONS = [
  { name: "Impact & Action", score: 92, color: "bg-violet-500" },
  { name: "Brevity & Clarity", score: 85, color: "bg-cyan-500" },
  { name: "Quantifiability", score: 98, color: "bg-emerald-500" },
  { name: "Technical Depth", score: 76, color: "bg-blue-500" },
  { name: "Leadership", score: 88, color: "bg-amber-500" },
  { name: "Format & Grammar", score: 100, color: "bg-rose-500" },
];

export function ResumeIntelligenceSection() {
  return (
    <section id="resume-intelligence" className="py-24 relative overflow-hidden bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Left */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <FileSearch className="w-3.5 h-3.5" />
              Resume Intelligence Engine
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground leading-[1.1]">
              Stop guessing what <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-premium">recruiters want.</span>
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our ATS parser doesn't just check for keywords. It analyzes the structural integrity of every bullet point, grades them across 6 dimensions, and predicts the exact cross-questions a Partner will ask you on Day 1.
            </p>

            <ul className="space-y-4">
              {[
                { icon: Zap, text: "Sub-second 1-click bullet rewrites to MBB standards" },
                { icon: Target, text: "Job Description match scoring to expose keyword gaps" },
                { icon: Activity, text: "6-Dimension Radar audit (Impact, Brevity, Quantifiability)" },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-1 rounded-md text-primary shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-foreground font-medium">{item.text}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link href="/login">
                <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-8">
                  Audit My Resume Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Right (Radar & Critique Demo) */}
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-3xl -z-10 rounded-full" />
            
            <div className="glass-panel bg-white/70 dark:bg-zinc-950/70 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-premium rounded-xl flex items-center justify-center shadow-inner">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">ATS Diagnostic Report</h4>
                    <p className="text-xs text-muted-foreground">johndoe_resume_v4.pdf</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-500 font-outfit">84<span className="text-sm text-muted-foreground">/100</span></div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Strong Match</p>
                </div>
              </div>

              {/* 6-Dimension Bars */}
              <div className="space-y-4 mb-6">
                <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">6-Axis Evaluation</h5>
                {DIMENSIONS.map((dim, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-32 text-xs font-medium text-foreground truncate">{dim.name}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${dim.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + (idx * 0.1), ease: "easeOut" }}
                        className={`h-full ${dim.color} rounded-full`}
                      />
                    </div>
                    <div className="w-8 text-right text-xs font-bold text-muted-foreground">{dim.score}</div>
                  </div>
                ))}
              </div>

              {/* Recruiter Cross-Question Preview */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Red Flag Detected (Bullet 3)</span>
                </div>
                <p className="text-sm font-medium text-foreground italic mb-2">
                  "Led a team of 5 to redesign the internal dashboard..."
                </p>
                <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border">
                  <strong className="text-foreground">Predicted Recruiter Question:</strong> "You said you 'led' the redesign, but what specific technical or product contribution did you make vs the other 4 team members?"
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
