"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Terminal, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { InteractiveHeroWidget } from "@/components/landing/InteractiveHeroWidget";

export function Hero() {
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
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-[#08090A] text-white">
      {/* Subtle Technical Grid Background */}
      <div className="absolute inset-0 tech-grid opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono-tech text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>ENGINEERED FOR DAY 1 CAMPUS PLACEMENTS</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            The interview engine calibrated to actual partner rubrics.
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-sans">
            Practice high-stakes case interviews with voice-activated partner pushback, real-time MECE rubrics, and line-by-line resume intelligence.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 max-w-md mx-auto">
          <Button
            onClick={handleStartPractice}
            size="lg"
            className="w-full sm:w-auto h-11 px-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all group"
          >
            Launch Free Sandbox
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          <Link href="/resume" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-11 px-6 rounded-md border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 text-sm font-medium transition-all"
            >
              <FileText className="mr-2 h-4 w-4 text-zinc-400" />
              Upload Resume for Audit
            </Button>
          </Link>
        </div>

        {/* Trust micro-bar */}
        <div className="flex items-center justify-center gap-6 text-xs font-mono-tech text-zinc-500 mb-14">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>NO CREDIT CARD REQUIRED</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-zinc-400" />
            <span>INSTANT GUEST ACCESS</span>
          </div>
        </div>

        {/* Embedded Interactive Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <InteractiveHeroWidget />
        </motion.div>

      </div>
    </section>
  );
}
