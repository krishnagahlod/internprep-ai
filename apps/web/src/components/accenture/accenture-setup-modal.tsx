"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Layers,
  Brain,
  ShieldAlert,
  Users,
  Timer,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { AccenturePracticeMode } from "./types";

interface AccentureSetupModalProps {
  open: boolean;
  onClose: () => void;
  selectedMode: AccenturePracticeMode;
  setSelectedMode: (mode: AccenturePracticeMode) => void;
  onStartSession: () => void;
  isInitializing: boolean;
}

const MODES: Array<{
  id: AccenturePracticeMode;
  title: string;
  duration: string;
  badge: string;
  icon: any;
  description: string;
  topics: string[];
}> = [
  {
    id: "full_simulation",
    title: "Full 25-Min Realistic Simulation",
    duration: "25 Mins",
    badge: "RECOMMENDED",
    icon: Layers,
    description:
      "Complete end-to-end Accenture Management Consulting trajectory from opening walkthrough to partner closing.",
    topics: ["Resume Metric Probing", "Consulting Mini-Case", "GenAI Client Strategy", "Behavioral & Fit"],
  },
  {
    id: "case_ai_drill",
    title: "Consulting Case & GenAI Drill",
    duration: "15 Mins",
    badge: "FOCUSED DRILL",
    icon: Brain,
    description:
      "High-yield practice on business problem decomposition (MECE), revenue/margin diagnosis, and GenAI client ROI.",
    topics: ["Retail/EV Case Study", "RAG vs Fine-tuning Strategy", "Executive Synthesis"],
  },
  {
    id: "resume_defense_drill",
    title: "Resume Claim Defense Drill",
    duration: "10 Mins",
    badge: "STRESS PROBING",
    icon: ShieldAlert,
    description:
      "Direct probing on project metric baselines, architecture choices, and personal contribution ownership.",
    topics: ["Baseline Verification", "Tradeoff Defense", "Edge-Case Handling"],
  },
  {
    id: "behavioral_fit_drill",
    title: "Behavioral & Accenture Fit Drill",
    duration: "10 Mins",
    badge: "CULTURE FIT",
    icon: Users,
    description:
      "STAR-method drill on 'Why Consulting', 'Why Accenture', managing team conflicts, and navigating ambiguity.",
    topics: ["Why Consulting & IIT Story", "Why Accenture vs MBB", "Handling Ambiguity"],
  },
];

export function AccentureSetupModal({
  open,
  onClose,
  selectedMode,
  setSelectedMode,
  onStartSession,
  isInitializing,
}: AccentureSetupModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border p-6 sm:p-8 rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-tech uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              [ACCENTURE // STRATEGY & CONSULTING]
            </span>
            <Badge variant="outline" className="text-[10px] font-mono-tech">
              IIT Bombay Summer Internship 2028 Cohort
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold font-display text-foreground">
            Accenture Consulting Simulation Setup
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-sans">
            Calibrate your mock interview trajectory modeled directly on manager-level interview patterns at premier IITs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                    : "border-border bg-card/60 hover:border-emerald-500/40 hover:bg-muted/30"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {mode.duration}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-foreground font-display flex items-center gap-1.5">
                      {mode.title}
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed mt-1">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1">
                  {mode.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono-tech px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="font-mono-tech text-xs rounded-xl"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isInitializing}
            onClick={onStartSession}
            className="font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Calibrating Manager Persona...</span>
              </>
            ) : (
              <>
                <span>Launch Accenture Simulation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
