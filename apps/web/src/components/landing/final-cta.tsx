"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function FinalCta() {
  const router = useRouter();
  const { user, setGuestMode } = useAuthStore();

  const handleStartPractice = () => {
    // Trigger confetti
    const end = Date.now() + 1.5 * 1000;
    const colors = ["#8b5cf6", "#06b6d4", "#10b981"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Navigate after a short delay to let confetti play
    setTimeout(() => {
      if (user) {
        router.push("/dashboard");
      } else {
        setGuestMode();
        router.push("/dashboard");
      }
    }, 800);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[2.5rem] overflow-hidden relative p-10 md:p-16 text-center"
        >
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 bg-zinc-950 dark:bg-zinc-900" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-zinc-950 to-cyan-600/40 opacity-80" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-violet-500/20 to-transparent blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <span className="text-sm font-semibold text-white tracking-wide">Join 10,000+ candidates</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-extrabold font-outfit tracking-tight text-white mb-6">
              Ready to secure your <br /> Day 1 offer?
            </h2>
            
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop practicing with generic chatbots. Train with the only platform calibrated to actual MBB and FAANG rubrics.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={handleStartPractice}
                size="lg"
                className="w-full sm:w-auto text-base h-14 px-8 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 font-bold shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 group"
              >
                Start Free Practice Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="#pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base h-14 px-8 rounded-full font-semibold border-white/20 text-white hover:bg-white/10 backdrop-blur-md transition-all"
                >
                  Browse Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
