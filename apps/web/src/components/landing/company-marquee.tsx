"use client";

import Marquee from "react-fast-marquee";

const FIRMS = [
  "McKinsey & Company",
  "Boston Consulting Group",
  "Bain & Company",
  "Goldman Sachs",
  "Morgan Stanley",
  "Google",
  "Microsoft",
  "Hindustan Unilever",
  "ITC Limited",
  "Amazon"
];

export function CompanyMarquee() {
  return (
    <section className="py-8 border-y border-white/[0.06] bg-[#0A0C0E]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <p className="text-center text-[11px] font-mono-tech uppercase tracking-wider text-zinc-500">
          Interview Rubrics Calibrated Against Top Hiring Bar Standards
        </p>
      </div>

      <div className="relative">
        <Marquee speed={32} pauseOnHover gradient={false}>
          <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
            {FIRMS.map((firm, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-400/70 hover:text-zinc-200 transition-colors uppercase font-mono-tech select-none"
              >
                {firm}
              </span>
            ))}
          </div>
        </Marquee>
      </div>
    </section>
  );
}
