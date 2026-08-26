"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Terminal, ShieldCheck, Layers, Sparkles, CheckCircle2 } from "lucide-react";
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
    <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between pt-8 pb-12 md:pt-12 md:pb-16 overflow-hidden bg-background text-foreground transition-colors">
      {/* Subtle Technical Grid Background */}
      <div className="absolute inset-0 tech-grid opacity-70 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-1 flex flex-col justify-center">
        
        {/* Top Multi-Domain Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-xs font-mono-tech text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>ENGINEERED FOR DAY 1 PLACEMENTS</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-card text-[11px] sm:text-xs font-mono-tech text-foreground font-semibold shadow-xs">
            <span>CONSULTING</span>
            <span className="text-muted-foreground">•</span>
            <span>SOFTWARE</span>
            <span className="text-muted-foreground">•</span>
            <span>ANALYTICS</span>
            <span className="text-muted-foreground">•</span>
            <span>FINANCE</span>
            <span className="text-muted-foreground">•</span>
            <span>PRODUCT</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-5xl mx-auto mb-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Rigorous interview simulation and resume intelligence.
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed font-sans">
            Practice conversational technical & case interviews tailored to your role, defend your logic against live edge-case probing, and audit your resume against verified Day 1 benchmarks.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8 max-w-lg mx-auto w-full">
          <Button
            onClick={handleStartPractice}
            size="lg"
            className="w-full sm:w-auto h-12 px-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-bold text-sm shadow-md transition-all group font-mono-tech"
          >
            Launch Free Interactive Sandbox
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Link href="/resume" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-7 rounded-lg border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-all font-mono-tech"
            >
              <FileText className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Upload Resume for Audit
            </Button>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono-tech text-muted-foreground mb-8">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>NO CREDIT CARD REQUIRED</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span>INSTANT GUEST ACCESS</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>5 DOMAIN TRACKS ACTIVE</span>
          </div>
        </div>

        {/* Embedded Interactive Sandbox Widget */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full"
        >
          <InteractiveHeroWidget />
        </motion.div>

      </div>
    </section>
  );
}
