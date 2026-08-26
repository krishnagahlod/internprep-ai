"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function FinalCta() {
  const router = useRouter();
  const { user, setGuestMode } = useAuthStore();

  const handleStartPractice = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      setGuestMode();
      router.push("/dashboard");
    }
  };

  return (
    <section className="py-20 bg-background transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-xl border border-border bg-card p-8 sm:p-14 text-center relative overflow-hidden shadow-sm">
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            {/* Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border text-xs font-mono-tech text-emerald-600 dark:text-emerald-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>INTERVIEW SIMULATION ENGINE ONLINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Ready to walk into Day 1 placement rounds fully calibrated?
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
              Eliminate generic ChatGPT advice. Practice with the only simulation engine calibrated to actual partner rubrics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                onClick={handleStartPractice}
                size="lg"
                className="w-full sm:w-auto h-11 px-6 rounded-md bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all group"
              >
                Launch Free Sandbox
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>

              <Link href="#pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 rounded-md border-border bg-card hover:bg-muted text-foreground text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
                >
                  View Placement Plans
                </Button>
              </Link>
            </div>

            <div className="text-[11px] font-mono-tech text-muted-foreground pt-2">
              No credit card required • Instant guest mode • Permanent credit balances
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
