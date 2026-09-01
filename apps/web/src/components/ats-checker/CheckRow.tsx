"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface CheckRowProps {
  name: string;
  score: number;
  status: string;
  passed: boolean;
}

export function CheckRow({ name, score, status, passed }: CheckRowProps) {
  const getStatusBadge = () => {
    if (score >= 85 || passed)
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (score >= 70)
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (score >= 50)
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {passed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        )}
        <span className="text-xs font-semibold text-foreground font-sans truncate">{name}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="w-16 sm:w-24 hidden sm:block">
          <Progress value={score} className="h-1.5" />
        </div>
        <Badge
          className={`text-[10px] font-mono-tech px-2 py-0.5 border ${getStatusBadge()}`}
        >
          {score}% • {status}
        </Badge>
      </div>
    </div>
  );
}
