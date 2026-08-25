"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveHeroWidget } from "./InteractiveHeroWidget";
import { useAuthStore } from "@/stores/auth-store";

export function Hero() {
  const router = useRouter();
  const { user, setGuestMode } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const handleStartPractice = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      setGuestMode();
      router.push("/dashboard");
    }
  };

  return (
    <section 
      ref={containerRef} 
      className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden"
    >
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 blur-[100px] rounded-full mix-blend-screen dark:mix-blend-color-dodge animate-pulse duration-3000" />
      </div>

      <motion.div 
        style={{ opacity, y }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Social Proof Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border backdrop-blur-sm mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            <strong className="text-foreground">⚡ Over 10,000+</strong> Mock Turns Simulated
          </span>
          <span className="hidden sm:inline-block w-px h-3 bg-border" />
          <span className="hidden sm:inline-block text-xs sm:text-sm text-muted-foreground">
            Engineered for Placements
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground font-outfit leading-[1.1] mb-6 max-w-4xl mx-auto"
        >
          Master the Interview. <br />
          <span className="text-transparent bg-clip-text bg-gradient-premium">
            Built for Day 1.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          A battle-tested AI copilot for Consulting Cases, Tech System Design, Finance, and Product. Voice-enabled practice, digital whiteboard integration, and recruiter-grade resume intelligence.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            onClick={handleStartPractice}
            size="lg"
            className="w-full sm:w-auto text-base h-14 px-8 rounded-full bg-gradient-premium text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all hover:-translate-y-1 group"
          >
            Try Instant Guest Mode
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Link href="#resume-intelligence" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base h-14 px-8 rounded-full font-semibold border-2 hover:bg-muted/50 transition-all"
            >
              <Zap className="mr-2 w-5 h-5 text-amber-500" />
              Upload Resume for Audit
            </Button>
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-16"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>Starts in 2 Seconds</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Interactive Live Product Showcase Widget */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="relative z-20 px-4 sm:px-6 lg:px-8"
      >
        <InteractiveHeroWidget />
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none" />
    </section>
  );
}
