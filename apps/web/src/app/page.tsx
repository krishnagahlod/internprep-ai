"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, BrainCircuit, FileText, ChevronRight, Users } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { setGuestMode } = useAuthStore();

  const handleGuestEntry = () => {
    setGuestMode();
    router.push("/dashboard");
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      {/* Background ambient glow - Light Theme Mesh */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-400/20 blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/4 right-1/4 w-[800px] h-[800px] rounded-full bg-cyan-400/20 blur-[120px]" 
        />
      </div>

      <header className="container mx-auto flex items-center justify-between py-6 px-4 md:px-8 z-10">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-premium p-[1px] flex items-center justify-center shadow-sm">
            <div className="h-full w-full bg-white rounded-[11px] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-outfit)" }}>InternPrep AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" className="hover:bg-black/5 text-muted-foreground font-medium">Log in</Button>
          </Link>
          <Button onClick={handleGuestEntry} className="bg-foreground text-background hover:bg-foreground/90 font-medium rounded-full px-6 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
            Start Practice
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-start pt-20 pb-32 z-10">
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto flex flex-col items-center text-center px-4 md:px-8"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Engineered for IIT Bombay Placements
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="max-w-4xl text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl mb-6 text-foreground drop-shadow-sm">
            Master the Interview.<br className="hidden sm:block" />
            <span className="text-gradient">Engineered for Day 1.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="max-w-[42rem] leading-relaxed text-muted-foreground sm:text-xl sm:leading-8 mb-10">
            A state-of-the-art AI copilot tailored for Consulting, Finance, FMCG, and Analytics. Train with precise intelligence.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row w-full max-w-md mx-auto justify-center">
            <Button size="lg" className="h-14 px-8 text-base bg-gradient-premium hover:opacity-90 text-white shadow-[0_8px_30px_rgba(139,92,246,0.3)] transition-all duration-300 group rounded-full border-0" onClick={handleGuestEntry}>
              Try as Guest <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 w-full sm:w-auto px-8 text-base glass-card hover:bg-white/60 rounded-full border-black/5 text-foreground font-medium shadow-sm">
                Create Account
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        {/* Feature Cards (Scroll Reveal) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="w-full max-w-6xl mx-auto px-4 mt-24 grid md:grid-cols-3 gap-8"
        >
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-8 flex flex-col items-start text-left relative overflow-hidden group cursor-default">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-violet-400/20 transition-colors duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-6 text-violet-600 shadow-sm border border-violet-200 group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-outfit">Resume Intelligence</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Upload your PDF. Our engine generates a precise heatmap flagging vague claims and predicting exact cross-questions a Partner would ask.
            </p>
            <div className="mt-auto flex items-center text-sm font-semibold text-violet-600 group-hover:text-violet-700">
              Explore Module <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-8 flex flex-col items-start text-left relative overflow-hidden group cursor-default">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-cyan-400/20 transition-colors duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-cyan-100 flex items-center justify-center mb-6 text-cyan-600 shadow-sm border border-cyan-200 group-hover:scale-110 transition-transform duration-300">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-outfit">Mock Case Simulator</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Engage in hyper-realistic, voice-enabled mock interviews. Work through problems on a live digital scratchpad evaluated in real-time.
            </p>
            <div className="mt-auto flex items-center text-sm font-semibold text-cyan-600 group-hover:text-cyan-700">
              Explore Module <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-8 flex flex-col items-start text-left relative overflow-hidden group cursor-default">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-400/20 transition-colors duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 text-blue-600 shadow-sm border border-blue-200 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-outfit">Full Interview Simulator</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Tailored technical and behavioral interviews. Upload your resume and practice for specific roles across various domains like Finance, SWE, and Consulting.
            </p>
            <div className="mt-auto flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
              Explore Module <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
