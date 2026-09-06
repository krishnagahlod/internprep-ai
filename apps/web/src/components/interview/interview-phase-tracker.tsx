"use client";

import React from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { InterviewPhase } from "./types";

interface InterviewPhaseTrackerProps {
  phases: InterviewPhase[];
  currentPhase: string;
  onPhaseSelect?: (phaseId: string) => void;
  disabled?: boolean;
}

export function InterviewPhaseTracker({
  phases,
  currentPhase,
  onPhaseSelect,
  disabled = false,
}: InterviewPhaseTrackerProps) {
  const activeIdx = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div
      role="navigation"
      aria-label="Interview Phase Progression"
      className="border-b border-border/70 bg-card/40 px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar shrink-0"
    >
      <span className="hidden md:inline text-[10px] font-mono-tech text-muted-foreground uppercase tracking-wider font-bold mr-1 shrink-0">
        Phases:
      </span>
      {phases.map((phase, idx) => {
        const isCompleted = activeIdx > idx;
        const isActive = activeIdx === idx || (activeIdx === -1 && idx === 0);
        const canJump = Boolean(onPhaseSelect && !isActive && !disabled);

        return (
          <React.Fragment key={phase.id}>
            <button
              type="button"
              disabled={!canJump}
              onClick={() => canJump && onPhaseSelect?.(phase.id)}
              title={canJump ? `Jump directly to ${phase.label} section` : undefined}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-tech whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs"
                  : isCompleted
                  ? "text-muted-foreground hover:text-foreground line-through opacity-75 hover:bg-muted/50 border border-transparent hover:border-border cursor-pointer"
                  : canJump
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border cursor-pointer"
                  : "text-muted-foreground/60 cursor-default"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                  }`}
                />
              )}
              <span>{phase.label}</span>
            </button>
            {idx < phases.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
