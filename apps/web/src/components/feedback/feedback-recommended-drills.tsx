"use client";

import React from "react";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";

interface FeedbackRecommendedDrillsProps {
  resources?: Array<{
    title: string;
    url?: string;
    description: string;
    category?: string;
  }>;
}

export function FeedbackRecommendedDrills({
  resources = [],
}: FeedbackRecommendedDrillsProps) {
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold text-foreground font-display">
          Targeted Practice Drills & Case Studies
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              {res.category && (
                <span className="text-[10px] font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                  [{res.category}]
                </span>
              )}
              <h4 className="text-xs font-bold text-foreground font-display">
                {res.title}
              </h4>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                {res.description}
              </p>
            </div>

            {res.url && (
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline pt-2"
              >
                <span>Launch Practice Module</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
