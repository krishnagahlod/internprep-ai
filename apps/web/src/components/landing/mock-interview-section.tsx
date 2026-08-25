"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  LineChart, 
  Code2, 
  Package, 
  Mic, 
  PenTool, 
  BrainCircuit, 
  Award,
  ChevronRight,
  PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRACKS = [
  { id: "consulting", label: "Consulting", icon: Briefcase, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: "finance", label: "Finance / IB", icon: LineChart, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "tech", label: "Software / SWE", icon: Code2, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "pm", label: "Product / FMCG", icon: Package, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
];

const FEATURES = [
  {
    id: "voice",
    title: "Voice-First Natural Latency",
    description: "Practice speaking out loud under realistic pressure. The AI interprets hesitations, tone, and pacing just like a human interviewer.",
    icon: Mic,
    demo: (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 bg-muted/30 rounded-xl border border-border">
        <div className="relative h-20 w-20 rounded-full bg-gradient-premium p-1 flex items-center justify-center animate-pulse">
          <div className="absolute inset-0 bg-violet-500 blur-xl opacity-50 rounded-full" />
          <div className="h-full w-full bg-zinc-950 rounded-full flex items-center justify-center z-10">
            <Mic className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 4, 3, 2].map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: [10, h * 10, 10] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
              className="w-1.5 bg-violet-500 rounded-full"
            />
          ))}
        </div>
        <p className="text-sm font-medium text-muted-foreground text-center">
          "Let's dive into the profitability issue..."
        </p>
      </div>
    )
  },
  {
    id: "whiteboard",
    title: "Digital Whiteboard Canvas",
    description: "Draw issue trees, structure system designs, and lay out financial formulas on an integrated Excalidraw canvas while you speak.",
    icon: PenTool,
    demo: (
      <div className="flex flex-col h-full bg-muted/30 rounded-xl border border-border overflow-hidden">
        <div className="bg-muted p-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground ml-2">Scratchpad</span>
        </div>
        <div className="p-4 flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-48 p-3 rounded-lg border-2 border-dashed border-violet-500/40 bg-violet-500/5 text-center">
            <span className="text-xs font-semibold text-foreground">Profits = Rev - Cost</span>
          </div>
          <div className="flex gap-4">
            <div className="w-20 p-2 rounded-lg border border-border bg-background text-center text-xs text-muted-foreground">Volume</div>
            <div className="w-20 p-2 rounded-lg border border-border bg-background text-center text-xs text-muted-foreground">Price</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "pushback",
    title: "Dynamic Pushback Engine",
    description: "The AI tests your assumptions, probes weak reasoning, and forces you to defend your hypotheses—just like an MBB Partner.",
    icon: BrainCircuit,
    demo: (
      <div className="flex flex-col h-full p-4 bg-muted/30 rounded-xl border border-border gap-4 justify-center">
        <div className="bg-background p-3 rounded-xl border border-border self-end max-w-[80%] rounded-tr-sm">
          <p className="text-xs text-muted-foreground">"I assume variable costs are flat..."</p>
        </div>
        <div className="bg-violet-500/10 p-3 rounded-xl border border-violet-500/20 self-start max-w-[90%] rounded-tl-sm relative">
          <div className="absolute -left-2 top-2 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
            <BrainCircuit className="w-2.5 h-2.5 text-white" />
          </div>
          <p className="text-xs font-medium text-foreground ml-2">
            "Wait, why would you assume that? If inflation is at 7%, wouldn't raw material costs increase proportionally?"
          </p>
        </div>
      </div>
    )
  },
  {
    id: "rubric",
    title: "Full Rubric Debrief",
    description: "Get turn-by-turn scoring, structured rubrics across 6 dimensions, and actionable recommended drills immediately after.",
    icon: Award,
    demo: (
      <div className="flex flex-col h-full p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 gap-3 justify-center">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Evaluation</span>
          <span className="text-xl font-bold text-foreground">9.2<span className="text-sm text-muted-foreground">/10</span></span>
        </div>
        {[
          { label: "MECE Structure", score: 95 },
          { label: "Business Sense", score: 88 },
          { label: "Communication", score: 92 },
        ].map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>{metric.label}</span>
              <span>{metric.score}%</span>
            </div>
            <div className="h-1.5 w-full bg-emerald-500/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${metric.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-emerald-500 rounded-full" 
              />
            </div>
          </div>
        ))}
      </div>
    )
  }
];

export function MockInterviewSection() {
  const [activeTrack, setActiveTrack] = useState(TRACKS[0].id);

  return (
    <section id="mock-interviews" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground mb-4">
            Practice Under <span className="text-transparent bg-clip-text bg-gradient-premium">Real Pressure.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Stop relying on generic AI chatbots. Train with a voice-first copilot that pushes back, reviews your scratchpad, and scores you on recruiter rubrics.
          </p>
        </div>

        {/* Track Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {TRACKS.map((track) => {
            const isActive = activeTrack === track.id;
            const Icon = track.icon;
            return (
              <button
                key={track.id}
                onClick={() => setActiveTrack(track.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive 
                    ? `${track.bg} ${track.border} ${track.color} border shadow-sm` 
                    : "bg-muted/50 border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {track.label}
              </button>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group flex flex-col glass-panel bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors"
              >
                <div className="h-48 p-4">
                  {feature.demo}
                </div>
                <div className="p-6 flex-1 flex flex-col border-t border-border/50 bg-background/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Banner */}
        <div className="mt-16 text-center">
          <Link href="/login">
            <Button size="lg" className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 font-semibold group">
              <PlayCircle className="mr-2 w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
              Start a Mock Session Now
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
