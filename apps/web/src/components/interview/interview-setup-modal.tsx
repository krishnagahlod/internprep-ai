"use client";

import React from "react";
import { Play, Sparkles, X, Briefcase, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InterviewSetupModalProps {
  open: boolean;
  onClose: () => void;
  selectedCaseType: string;
  setSelectedCaseType: (t: string) => void;
  onStartSession: () => void;
  isInitializing: boolean;
  targetCompany?: string | null;
}

const CASE_TYPES = [
  "Random Casebook Mix",
  "Market Entry Strategy",
  "Profitability & Cost Reduction",
  "M&A and Synergy Valuation",
  "Pricing & Product Launch",
  "GTM Strategy",
];

export function InterviewSetupModal({
  open,
  onClose,
  selectedCaseType,
  setSelectedCaseType,
  onStartSession,
  isInitializing,
  targetCompany,
}: InterviewSetupModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech text-[10px] font-bold"
              >
                IIT BOMBAY // CASE SIMULATOR
              </Badge>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground font-display">
              Configure Mock Interview
            </h3>
            <p className="text-xs text-muted-foreground font-sans">
              {targetCompany
                ? `Calibrating simulation specifically for ${targetCompany} recruiting rounds.`
                : "Select a casebook domain or framework to practice with progressive disclosure."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Case Type Grid */}
        <div className="space-y-2">
          <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold">
            Select Case Topic / Framework
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CASE_TYPES.map((type) => {
              const isSelected = selectedCaseType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedCaseType(type)}
                  className={`p-3 rounded-xl border text-left text-xs font-mono-tech transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                      : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{type}</span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <Button
          type="button"
          disabled={isInitializing}
          onClick={onStartSession}
          className="w-full h-11 rounded-xl font-mono-tech text-xs font-bold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>{isInitializing ? "Calibrating AI Persona..." : "Begin Live Mock Interview"}</span>
        </Button>
      </div>
    </div>
  );
}
