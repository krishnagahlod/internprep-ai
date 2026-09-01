"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Building2 } from "lucide-react";

interface MasterScoreGaugeProps {
  score: number;
  tier: string;
  mode: string;
  roleLabel: string;
}

export function MasterScoreGauge({
  score,
  tier,
  mode,
  roleLabel,
}: MasterScoreGaugeProps) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 85)
      return {
        stroke: "stroke-emerald-500",
        text: "text-emerald-500",
        badge:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    if (score >= 72)
      return {
        stroke: "stroke-blue-500",
        text: "text-blue-500",
        badge:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    if (score >= 58)
      return {
        stroke: "stroke-amber-500",
        text: "text-amber-500",
        badge:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    return {
      stroke: "stroke-rose-500",
      text: "text-rose-500",
      badge:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    };
  };

  const colors = getColor();

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/30"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span
            className={`text-3xl font-black font-mono-tech tracking-tight ${colors.text}`}
          >
            {score}
          </span>
          <span className="text-[9px] font-bold font-mono-tech uppercase tracking-widest text-muted-foreground">
            OUT OF 100
          </span>
        </div>
      </div>

      <div className="space-y-2 min-w-0 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Badge
            className={`px-2.5 py-0.5 font-semibold font-mono-tech text-[11px] border ${colors.badge}`}
          >
            {tier}
          </Badge>
          <span className="text-[11px] font-mono-tech text-muted-foreground uppercase flex items-center gap-1">
            {mode === "iitb_placement" ? (
              <>
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> IITB Day 1
                Standard
              </>
            ) : (
              <>
                <Building2 className="h-3.5 w-3.5 text-primary" /> Corporate ATS
                Standard
              </>
            )}
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground font-display">
          {score >= 85
            ? "Elite Placement Candidate Profile"
            : score >= 72
            ? "Strong Shortlist Contender"
            : score >= 58
            ? "Moderate Alignment — Key Gaps"
            : "Formatting & Content Adjustments Required"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
          {mode === "iitb_placement"
            ? `Calibrated for ${roleLabel} campus shortlisting: multi-tiered semantic competency density, line budget, and scholastic highlights.`
            : `Calibrated for corporate enterprise ATS systems (Workday, Greenhouse, Eightfold): OCR extractability and semantic skill match for ${roleLabel}.`}
        </p>
      </div>
    </div>
  );
}
