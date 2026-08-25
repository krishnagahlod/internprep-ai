"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, BookOpen, Target, BarChart3, ChevronRight, PenTool } from "lucide-react";
import Link from "next/link";

export function ToolsBentoSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground mb-4">
            The Complete <span className="text-transparent bg-clip-text bg-gradient-premium">Placement Ecosystem.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need from your first draft to your final round. All powered by a unified AI intelligence layer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 auto-rows-[280px]">
          
          {/* Bento Box 1: Resume Builder (Large - 2 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 glass-panel bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-violet-500/30 transition-colors"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-violet-500/20 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-outfit">Resume Builder Studio</h3>
              </div>
              <p className="text-muted-foreground max-w-md mb-6">
                Placement-compliant, LaTeX-grade single-page templates. Real-time AI bullet copilot and instant high-res PDF generation that passes every ATS check.
              </p>
              
              <div className="mt-auto flex items-end justify-between">
                <Link href="/resume" className="inline-flex items-center text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500">
                  Try the Builder <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                
                {/* Visual Decorative Element */}
                <div className="hidden sm:flex bg-background border border-border rounded-lg shadow-lg p-3 w-48 opacity-70 group-hover:opacity-100 transition-opacity rotate-2 translate-y-4">
                  <div className="space-y-2 w-full">
                    <div className="h-2 bg-muted rounded w-1/3" />
                    <div className="h-1.5 bg-muted rounded w-full" />
                    <div className="h-1.5 bg-muted rounded w-5/6" />
                    <div className="h-1.5 bg-muted rounded w-4/6" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bento Box 2: ATS Checker (Small - 1 col) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-colors flex flex-col"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-500" />
             
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-outfit">Quick ATS Match</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                Paste any job description and your resume to get an instant keyword gap analysis. Don't let the ATS filter you out before human review.
              </p>
              
              <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500">
                  Scan Now <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
          </motion.div>

          {/* Bento Box 3: Casebook Library (Small - 1 col) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors flex flex-col"
          >
             <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500" />
             
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-outfit">Casebook Ecosystem</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-1 relative z-10">
                A highly curated library of IIT/IIM casebooks, MBB frameworks, and market sizing cheat sheets to supplement your mock practice.
              </p>
              
              <Link href="/casebooks" className="inline-flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 relative z-10">
                  Browse Cases <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
          </motion.div>

          {/* Bento Box 4: Performance Analytics (Large - 2 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 glass-panel bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-amber-500/30 transition-colors"
          >
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-outfit">Performance Analytics</h3>
              </div>
              <p className="text-muted-foreground max-w-md mb-6">
                Track your historical score charts, session replays, and weakness diagnostic heatmaps. See exactly when you are ready to face the real interview.
              </p>
              
              <div className="mt-auto flex items-end justify-between">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500">
                  View Analytics <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                
                {/* Visual Decorative Element */}
                <div className="hidden sm:flex items-end gap-2 h-20 opacity-70 group-hover:opacity-100 transition-opacity mr-4">
                  <div className="w-6 bg-amber-500/40 rounded-t-sm h-[40%]" />
                  <div className="w-6 bg-amber-500/60 rounded-t-sm h-[60%]" />
                  <div className="w-6 bg-amber-500/80 rounded-t-sm h-[80%]" />
                  <div className="w-6 bg-amber-500 rounded-t-sm h-[100%]" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
