"use client";

import React from "react";
import { diffWords } from "diff";
import { Plus, Minus } from "lucide-react";

interface BulletDiffProps {
  original: string;
  rewrite: string;
}

export function BulletDiff({ original, rewrite }: BulletDiffProps) {
  const differences = diffWords(original, rewrite);

  return (
    <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words border border-black/10 dark:border-white/10 rounded-lg p-4 bg-background">
      {differences.map((part, index) => {
        if (part.added) {
          return (
            <span
              key={index}
              className="inline-flex items-center bg-green-500/20 text-green-800 dark:text-green-400 font-bold px-1 mx-0.5 rounded"
            >
              <Plus className="w-3 h-3 mr-0.5 inline-block shrink-0" />
              {part.value}
            </span>
          );
        }
        
        if (part.removed) {
          return (
            <span
              key={index}
              className="inline-flex items-center bg-red-500/20 text-red-800 dark:text-red-400 line-through decoration-red-500/50 px-1 mx-0.5 rounded opacity-70"
            >
              <Minus className="w-3 h-3 mr-0.5 inline-block shrink-0" />
              {part.value}
            </span>
          );
        }

        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}
