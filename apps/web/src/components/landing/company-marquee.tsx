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
    <section className="py-7 border-y border-border bg-muted/30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
        <p className="text-center text-[11px] font-mono-tech uppercase tracking-wider text-muted-foreground">
          Calibrated for Competitive Campus Placements Across Top Firms
        </p>
      </div>

      <div className="relative">
        <Marquee speed={30} pauseOnHover gradient={false}>
          <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
            {FIRMS.map((firm, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm font-semibold tracking-wide text-muted-foreground/70 hover:text-foreground transition-colors uppercase font-mono-tech select-none"
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
