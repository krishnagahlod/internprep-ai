"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Bot, User, Sparkles } from "lucide-react";
import { TimelineTurn } from "./types";

interface FeedbackTimelineReplayProps {
  timelineData?: TimelineTurn[];
}

export function FeedbackTimelineReplay({
  timelineData = [],
}: FeedbackTimelineReplayProps) {
  const [expandedTurns, setExpandedTurns] = useState<Record<number, boolean>>({});

  const toggleTurn = (turnNum: number) => {
    setExpandedTurns((prev) => ({ ...prev, [turnNum]: !prev[turnNum] }));
  };

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/40">
        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
        <p className="text-xs font-mono-tech text-muted-foreground">
          Turn-by-turn trajectory log is being generated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timelineData.map((turn, i) => {
        const turnNumber = turn.turn_number || i + 1;
        const isExpanded = !!expandedTurns[turnNumber];
        const isPositive = turn.trajectory === "positive";
        const isNegative = turn.trajectory === "negative";

        return (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-xs"
          >
            {/* Turn Header Bar */}
            <button
              type="button"
              onClick={() => toggleTurn(turnNumber)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-6 w-6 rounded-lg bg-muted border border-border text-[10px] font-mono-tech font-bold flex items-center justify-center text-foreground shrink-0">
                  #{turnNumber}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground font-mono-tech truncate">
                      {turn.phase || `Turn ${turnNumber}`}
                    </span>
                    <span
                      className={`text-[9px] font-mono-tech px-2 py-0.2 rounded-full border ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                          : isNegative
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {turn.trajectory ? turn.trajectory.toUpperCase() : "EVALUATED"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-xl font-sans mt-0.5">
                    {turn.question}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-muted-foreground">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Expandable Turn Details */}
            {isExpanded && (
              <div className="p-4 border-t border-border/70 bg-muted/20 space-y-3">
                {/* Candidate Response */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-muted-foreground uppercase">
                    <User className="h-3 w-3" />
                    <span>Candidate Answer</span>
                  </div>
                  <div className="text-xs font-sans bg-card border border-border/80 rounded-xl p-3 text-foreground whitespace-pre-wrap leading-relaxed">
                    {turn.candidate_response}
                  </div>
                </div>

                {/* Evaluator Notes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 uppercase">
                    <Bot className="h-3 w-3" />
                    <span>Evaluator Feedback</span>
                  </div>
                  <div className="text-xs font-sans bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-foreground leading-relaxed">
                    {turn.evaluator_feedback}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
