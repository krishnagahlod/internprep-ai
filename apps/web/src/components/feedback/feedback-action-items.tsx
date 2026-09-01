"use client";

import React from "react";
import { CheckCircle2, ArrowRight, Target } from "lucide-react";

interface FeedbackActionItemsProps {
  actionItems?: string[];
}

export function FeedbackActionItems({ actionItems = [] }: FeedbackActionItemsProps) {
  if (!actionItems || actionItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 p-6 sm:p-8 space-y-4 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground font-display">
            Priority Action Items: "Fix This Next"
          </h3>
          <p className="text-xs text-muted-foreground font-sans">
            Targeted adjustments to implement in your next mock interview session.
          </p>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {actionItems.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 bg-card/80 border border-border/80 rounded-2xl p-4 text-xs font-sans text-foreground shadow-xs"
          >
            <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 font-mono-tech text-[10px] font-bold">
              {index + 1}
            </div>
            <p className="leading-relaxed flex-1">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
