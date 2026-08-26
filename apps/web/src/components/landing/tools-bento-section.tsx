"use client";

import { motion } from "framer-motion";
import { FileCheck, BarChart2, ArrowRight, ShieldCheck, CheckCircle2, Zap, Sparkles, TrendingUp, Layers } from "lucide-react";
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

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Panel 1: ATS Checker & Studio (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-mono-tech">ATS Checker & Resume Studio</h3>
                    <p className="text-xs text-muted-foreground">Pre-screen layout & keyword density before campus portal upload</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono-tech font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> 100% Parser Compliant
                </span>
              </div>

              {/* Visual ATS Parser Metric Breakdown */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <div className="text-[11px] font-mono-tech text-muted-foreground">PARSER COMPATIBILITY</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono-tech">99.4%</div>
                  <div className="text-[10px] text-muted-foreground">Standard single-column geometry</div>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <div className="text-[11px] font-mono-tech text-muted-foreground">ACTION VERB RIGOR</div>
                  <div className="text-2xl font-bold text-foreground font-mono-tech">94.8%</div>
                  <div className="text-[10px] text-muted-foreground">High-agency action keywords</div>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <div className="text-[11px] font-mono-tech text-muted-foreground">QUANTIFICATION DENSITY</div>
                  <div className="text-2xl font-bold text-foreground font-mono-tech">96.2%</div>
                  <div className="text-[10px] text-muted-foreground">Google XYZ formula verified</div>
                </div>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["LaTeX Export Compatible", "Instant Keyword Extraction", "Point Vault", "Section Balancer"].map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-muted text-[11px] font-mono-tech text-muted-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>

            </div>

            <div className="pt-6 border-t border-border mt-6 flex items-center justify-between">
              <Link 
                href="/ats-checker" 
                className="inline-flex items-center text-xs font-mono-tech font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Launch ATS Checker <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
              <Link 
                href="/resume-builder" 
                className="text-xs font-mono-tech text-muted-foreground hover:text-foreground"
              >
                Open Resume Studio →
              </Link>
            </div>
          </div>

          {/* Panel 2: Analytics & Progression (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground font-mono-tech">Progression Analytics</h3>
                  <p className="text-xs text-muted-foreground">Track rubric growth across mock sessions</p>
                </div>
              </div>

              {/* Visual Performance Progression Graphic */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 font-mono-tech">
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
                  <span>DIMENSION</span>
                  <span>CURRENT / TARGET</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-foreground">MECE & Problem Structuring</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">9.6 / 10</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-foreground">Technical Rigor & Defensibility</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">9.2 / 10</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-foreground">Synthesis & Executive Delivery</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">9.4 / 10</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "94%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-border mt-6">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center text-xs font-mono-tech font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Candidate Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
