"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal, ShieldCheck } from "lucide-react";
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
    <section className="py-24 bg-[#08090A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-xl border border-white/[0.12] bg-[#0E1013] p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            {/* Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono-tech text-emerald-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>CORE EVALUATION ENGINE ONLINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to walk into Day 1 placement rounds fully calibrated?
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 font-sans leading-relaxed">
              Eliminate generic ChatGPT advice. Practice with the only simulation engine calibrated to actual partner rubrics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                onClick={handleStartPractice}
                size="lg"
                className="w-full sm:w-auto h-11 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all group"
              >
                Launch Free Sandbox
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>

              <Link href="#pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 rounded-md border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 text-sm font-medium transition-all"
                >
                  View Placement Plans
                </Button>
              </Link>
            </div>

            <div className="text-[11px] font-mono-tech text-zinc-500 pt-2">
              No credit card required • Instant guest mode • Permanent credit balances
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
