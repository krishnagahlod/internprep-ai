"use client";

import React from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { InterviewPhase } from "./types";

interface InterviewPhaseTrackerProps {
  phases: InterviewPhase[];
  currentPhase: string;
}

export function InterviewPhaseTracker({
  phases,
  currentPhase,
}: InterviewPhaseTrackerProps) {
  const activeIdx = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div
      role="navigation"
      aria-label="Interview Phase Progression"
      className="border-b border-border/70 bg-card/40 px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar shrink-0"
    >
      {phases.map((phase, idx) => {
        const isCompleted = activeIdx > idx;
        const isActive = activeIdx === idx || (activeIdx === -1 && idx === 0);

        return (
          <React.Fragment key={phase.id}>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-tech whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30"
                  : isCompleted
                  ? "text-muted-foreground line-through opacity-70"
                  : "text-muted-foreground/60"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                  }`}
                />
              )}
              <span>{phase.label}</span>
            </div>
            {idx < phases.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
