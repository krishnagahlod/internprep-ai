"use client";

import Marquee from "react-fast-marquee";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const COMPANIES = [
  { name: "McKinsey & Company" },
  { name: "Boston Consulting Group" },
  { name: "Bain & Company" },
  { name: "Goldman Sachs" },
  { name: "Morgan Stanley" },
  { name: "Google" },
  { name: "Microsoft" },
  { name: "Uber" },
  { name: "Hindustan Unilever" },
  { name: "ITC" },
  { name: "Kearney" },
  { name: "Oliver Wyman" },
];

export function CompanyMarquee() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");

  return (
    <section className="py-12 md:py-16 bg-background overflow-hidden border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">
          Trusted by candidates who secured offers at
        </p>
      </div>

      <div className="relative">
        {/* Left/Right Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <Marquee
          gradient={false}
          speed={40}
          pauseOnHover={true}
          autoFill={true}
          className="py-4"
        >
          {COMPANIES.map((company, idx) => (
            <div
              key={idx}
              className="mx-8 md:mx-12 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default"
            >
              {/* Since we don't have SVGs for these logos right now, we use clean typography */}
              <span className="text-lg md:text-xl font-bold text-foreground font-outfit tracking-tight">
                {company.name}
              </span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
