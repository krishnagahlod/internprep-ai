"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const DOMAINS = [
  { id: "consulting", label: "Consulting" },
  { id: "tech", label: "Software & SWE" },
  { id: "analytics", label: "Data Analytics" },
  { id: "finance", label: "Finance & Quant" },
  { id: "product", label: "Product" }
];

export function FinalCta() {
  const router = useRouter();
  const { user, setGuestMode } = useAuthStore();
  const [selectedDomain, setSelectedDomain] = useState("consulting");

  const handleStartPractice = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      setGuestMode();
      router.push("/dashboard");
    }
  };

  return (
    <section className="py-24 bg-background transition-colors border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-14 text-center relative overflow-hidden shadow-xl">
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />

          <div className="relative z-10 space-y-7 max-w-3xl mx-auto">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>DAY 1 PLACEMENT CALIBRATION SUITE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Walk into Day 1 placement rounds fully calibrated.
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed max-w-2xl mx-auto">
              Simulate realistic interviews across 5 specialized domains, challenge your assumptions under pressure, and benchmark your resume against top-tier offers.
            </p>

            {/* Interactive Domain Track Selector */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono-tech text-muted-foreground uppercase">Select Target Domain</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(d.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tech transition-all ${
                      selectedDomain === d.id
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 font-bold shadow-xs"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Button
                onClick={handleStartPractice}
                size="lg"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-bold text-sm shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all group font-mono-tech"
              >
                Launch Free {DOMAINS.find(d => d.id === selectedDomain)?.label} Session
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Link href="#pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 rounded-lg border-border bg-background hover:bg-muted text-foreground text-sm font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all font-mono-tech"
                >
                  View All-in-One Pricing
                </Button>
              </Link>
            </div>

            {!user && (
              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono-tech transition-colors py-1 px-2 rounded-md hover:bg-muted/40"
                >
                  <span>Already have an account?</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-4">
                    Sign in to your candidate account →
                  </span>
                </Link>
              </div>
            )}

            {/* Trust Footer */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono-tech text-muted-foreground pt-4 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Permanent Non-Expiring Passes</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Instant Guest Access</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
