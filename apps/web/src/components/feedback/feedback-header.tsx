"use client";

import React from "react";
import Link from "next/link";
import { Download, Award, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandNav } from "@/components/shared";

interface FeedbackHeaderProps {
  verdict: string;
  candidateLevel?: string;
  onPrint: () => void;
}

export function FeedbackHeader({
  verdict,
  candidateLevel,
  onPrint,
}: FeedbackHeaderProps) {
  return (
    <CommandNav
      backHref="/dashboard"
      backLabel="Dashboard"
      breadcrumb="EVALUATION SCORECARD"
      actions={
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="h-8 text-xs font-mono-tech font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print Dossier</span>
          </Button>

          <Link href="/dashboard">
            <Button
              size="sm"
              className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-mono-tech text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      }
    />
  );
}
