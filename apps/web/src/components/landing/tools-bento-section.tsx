"use client";

import { motion } from "framer-motion";
import { FileCheck, BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ToolsBentoSection() {
  return (
    <section id="tools" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [PLATFORM SUITE]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">STUDIO & ANALYTICS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 max-w-3xl">
          Everything you need between your first draft and final round.
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Panel 1: ATS Checker & Resume Studio */}
          <div className="rounded-xl border border-border bg-card p-7 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="h-9 w-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">ATS Checker & Resume Studio</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Evaluate your resume layout against strict corporate ATS parsers. Access our built-in studio to format sections, test action verbs, and export clean PDFs.
                </p>
              </div>

              {/* Feature Points */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-foreground">Strict ATS Format & Column Extraction</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Parser Compliant</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-foreground">Interactive Bullet Writing Workshop</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">AI Co-Pilot</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-foreground">Target Role Calibration (5 Domain Tracks)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Adaptive</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center gap-4">
              <Link 
                href="/ats-checker" 
                className="inline-flex items-center text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
              >
                Launch ATS Checker <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
              <span className="text-border">•</span>
              <Link 
                href="/resume-builder" 
                className="inline-flex items-center text-xs font-mono-tech text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
              >
                Open Resume Studio
              </Link>
            </div>
          </div>

          {/* Panel 2: Dashboard & Progression History */}
          <div className="rounded-xl border border-border bg-card p-7 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="h-9 w-9 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">History & Progression Dashboard</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Track your growth across every mock interview session. Review past transcripts, compare radar scores over time, and identify lingering logical bottlenecks.
                </p>
              </div>

              {/* Metrics Table */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3 font-mono-tech text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border text-muted-foreground text-[11px]">
                  <span>TRACKED PERFORMANCE DIMENSION</span>
                  <span>STATUS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Session Transcript Archives</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Full Logs Saved</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Historical Radar Scorecards</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tracked MoM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Domain Role Benchmarking</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">5 Tracks Active</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center text-xs font-mono-tech text-blue-600 dark:text-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
              >
                Explore Candidate Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
