"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MilestoneProgressProps {
  milestones: string[];
  currentMilestoneIndex: number;
  percentage: number;
  label?: string;
}

export function MilestoneProgress({
  milestones,
  currentMilestoneIndex,
  percentage,
  label = "Processing Analysis..."
}: MilestoneProgressProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3 font-mono-tech text-xs shadow-xs transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {label}
        </span>
        <span className="text-primary font-bold">{Math.floor(percentage)}%</span>
      </div>

      <Progress value={percentage} className="h-1.5 bg-muted" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px]">
        {milestones.map((m, idx) => {
          const isDone = idx < currentMilestoneIndex;
          const isCurrent = idx === currentMilestoneIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                isDone
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-medium"
                  : isCurrent
                  ? "text-foreground font-semibold bg-muted border border-border"
                  : "text-muted-foreground opacity-60"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <span className="h-2 w-2 rounded-full bg-primary animate-ping shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
              )}
              <span className="truncate">{m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
