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
    <section className="relative pt-14 pb-18 md:pt-20 md:pb-24 overflow-hidden bg-background text-foreground transition-colors">
      {/* Subtle Technical Grid Background */}
      <div className="absolute inset-0 tech-grid opacity-70 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Chip */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-xs font-mono-tech text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>ENGINEERED FOR DAY 1 PLACEMENTS</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Rigorous interview simulation and resume intelligence.
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-sans">
            Simulate 4-phase consulting cases with sub-150ms Cerebras response speeds, test logic against partner pushbacks, and audit your resume using adaptive vector benchmarks.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 max-w-md mx-auto">
          <Button
            onClick={handleStartPractice}
            size="lg"
            className="w-full sm:w-auto h-11 px-6 rounded-md bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-sm shadow-sm transition-all group"
          >
            Launch Free Sandbox
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          <Link href="/resume" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-11 px-6 rounded-md border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-all"
            >
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              Upload Resume for Audit
            </Button>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 text-xs font-mono-tech text-muted-foreground mb-12">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>NO CREDIT CARD REQUIRED</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>INSTANT GUEST ACCESS</span>
          </div>
        </div>

        {/* Embedded Interactive Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <InteractiveHeroWidget />
        </motion.div>

      </div>
    </section>
  );
}
