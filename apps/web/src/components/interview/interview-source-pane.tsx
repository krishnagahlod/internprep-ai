"use client";

import React, { useState } from "react";
import { ExternalLink, BookOpen, FileText, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"pdf" | "transcript">(caseSource ? "pdf" : "transcript");
  const [showExcerpt, setShowExcerpt] = useState(false);

  const pdfUrl = caseSource
    ? `${API_URL}/casebooks/${encodeURIComponent(caseSource)}#page=${pageNumber}`
    : null;

  return (
    <div className="h-full flex flex-col bg-background border-l border-border overflow-hidden">
      {/* Top Source Toolbar */}
      <div className="h-12 border-b border-border bg-card/80 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground">
              {caseSource ? caseSource.replace(/\.pdf$/i, "") : "Casebook Document"}
            </h4>
            {pageNumber ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono-tech font-bold border border-emerald-500/20">
                Page {pageNumber}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switcher: PDF vs Transcript */}
          {caseSource && (
            <div className="flex items-center gap-1 p-0.5 bg-muted/60 border border-border rounded-lg text-xs font-mono-tech">
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono-tech transition-all cursor-pointer ${
                  viewMode === "pdf"
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PDF View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("transcript")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono-tech transition-all cursor-pointer ${
                  viewMode === "transcript"
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Problem Text
              </button>
            </div>
          )}

          {/* Open in New Window */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
              title="Open full PDF in new tab"
            >
              <span>Open Tab</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Document Content */}
      <div className="flex-1 overflow-hidden relative bg-muted/20">
        {viewMode === "pdf" && pdfUrl ? (
          <div className="w-full h-full flex flex-col relative">
            <iframe
              src={pdfUrl}
              title="Casebook PDF Document"
              className="w-full h-full border-0 bg-background"
            />
            {/* Overlay toggle to peek at case excerpt without leaving PDF */}
            {caseContext && (
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <div className="rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-lg p-2.5 transition-all">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowExcerpt(!showExcerpt)}
                  >
                    <span className="text-[11px] font-mono-tech font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-500" />
                      Problem Statement & Solution Excerpt
                    </span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground p-1"
                    >
                      {showExcerpt ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {showExcerpt && (
                    <div className="mt-2 pt-2 border-t border-border max-h-48 overflow-y-auto custom-scrollbar text-xs font-sans text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {caseContext}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-6 h-full overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-[11px] font-mono-tech font-bold uppercase tracking-wider text-muted-foreground">
                Document Context & Case Brief
              </span>
              {pdfUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode("pdf")}
                  className="text-[11px] font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Switch to PDF view →
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-xs font-sans leading-relaxed text-foreground whitespace-pre-wrap shadow-xs">
              {caseContext || "No supplementary case documentation attached to this session."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
