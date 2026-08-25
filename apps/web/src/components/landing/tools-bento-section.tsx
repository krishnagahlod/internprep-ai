"use client";

import { motion } from "framer-motion";
import { BookOpen, BarChart3, ArrowRight, Database, TrendingUp, Check } from "lucide-react";
import Link from "next/link";

const CASEBOOKS = [
  { name: "IIT Bombay Consult Club Casebook", cases: "48 Solved Cases", tag: "FMCG / Tech / PE" },
  { name: "IIM Ahmedabad Placement Compendium", cases: "64 Solved Cases", tag: "Market Entry & M&A" },
  { name: "IIT Delhi Strategy & Operations Vault", cases: "42 Solved Cases", tag: "Supply Chain & Pricing" },
  { name: "ISB Hyderabad PE / Due Diligence Pack", cases: "38 Solved Cases", tag: "Growth Equity & Turnaround" }
];

export function ToolsBentoSection() {
  return (
    <section id="casebooks" className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [ECOSYSTEM 03]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">PLACEMENTS KNOWLEDGE VAULT</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-16 max-w-3xl">
          Historical campus casebooks and cohort placement benchmarks.
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Panel 1: Casebook Vault */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0E1013] p-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-9 w-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Campus Casebook Ecosystem</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                  Access 400+ real interview cases asked during Day 1 placements at IIT Bombay, IIM Ahmedabad, and ISB. Interactive step-by-step solutions with partner rubrics.
                </p>
              </div>

              {/* Casebook Items */}
              <div className="space-y-2 pt-2">
                {CASEBOOKS.map((cb, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#14161B] border border-white/[0.04] flex items-center justify-between text-xs font-mono-tech"
                  >
                    <div>
                      <div className="text-zinc-200 font-semibold">{cb.name}</div>
                      <div className="text-zinc-500 text-[11px]">{cb.tag}</div>
                    </div>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {cb.cases}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <Link href="/casebooks" className="inline-flex items-center text-xs font-mono-tech text-emerald-400 hover:text-emerald-300">
                Browse Full Casebook Directory <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Panel 2: Cohort Analytics */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0E1013] p-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-9 w-9 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Placement Cohort Analytics</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                  Benchmark your performance against thousands of past candidate turns. Know exactly where your structuring, speed, and technical depth rank before Day 1.
                </p>
              </div>

              {/* Metric Breakdown Table */}
              <div className="p-4 rounded-lg bg-[#14161B] border border-white/[0.04] space-y-3 font-mono-tech text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-zinc-500 text-[11px]">
                  <span>METRIC CRITERIA</span>
                  <span>YOUR PERFORMANCE</span>
                  <span>TOP 5% BENCHMARK</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Case Structuring Speed</span>
                  <span className="text-emerald-400 font-bold">1m 14s</span>
                  <span className="text-zinc-400">1m 30s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Math Calculation Error Rate</span>
                  <span className="text-emerald-400 font-bold">0.0%</span>
                  <span className="text-zinc-400">&lt; 4.0%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Pushback Retention</span>
                  <span className="text-emerald-400 font-bold">96%</span>
                  <span className="text-zinc-400">88%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#121418] border border-white/[0.06] text-xs font-mono-tech text-zinc-400 flex items-center justify-between">
                <span>PROJECTED DAY 1 SHORTLIST PROBABILITY</span>
                <span className="text-emerald-400 font-bold text-sm">94.8% (Tier-1 Ready)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <Link href="/dashboard/analytics" className="inline-flex items-center text-xs font-mono-tech text-blue-400 hover:text-blue-300">
                View Placement Analytics Demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
