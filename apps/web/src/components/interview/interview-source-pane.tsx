"use client";

import React from "react";
import { FileText, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterviewSourcePaneProps {
  caseContext?: string;
  caseSource?: string;
  pageNumber?: number;
}

export function InterviewSourcePane({
  caseContext,
  caseSource,
  pageNumber = 1,
}: InterviewSourcePaneProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="h-full flex flex-col bg-card/40 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          <h4 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground">
            Original Case Reference
          </h4>
        </div>
        {caseSource && (
          <a
            href={`${API_URL}/casebooks/${caseSource}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Open PDF (p. {pageNumber})</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-xs font-sans leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {caseContext || "No supplementary case documentation attached to this session."}
      </div>
    </div>
  );
}
