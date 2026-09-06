"use client";

import React from "react";
import { Monitor, ArrowLeftFromLine, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PresentationPlaceholderProps {
  onReturn: () => void;
  isMockMode?: boolean;
}

/**
 * Polished placeholder shown in the right panel when the workspace
 * has been presented on an external display.
 */
export function PresentationPlaceholder({
  onReturn,
  isMockMode = false,
}: PresentationPlaceholderProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)]" />

      {/* Main content card */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm px-6">
        {/* Animated monitor icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-xl scale-150 animate-pulse" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-emerald-500/20 shadow-lg">
            <Monitor className="h-9 w-9 text-emerald-500" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h3 className="text-base font-mono-tech font-bold text-foreground tracking-tight">
            Workspace Presented
          </h3>
          <p className="text-xs font-sans text-muted-foreground leading-relaxed">
            Your workspace is currently open on the external display.
            The interview remains active here.
          </p>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono-tech font-semibold text-emerald-600 dark:text-emerald-400">
            External Display Connected
          </span>
        </div>

        {/* Mock mode indicator */}
        {isMockMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Wifi className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-mono-tech font-semibold text-amber-600 dark:text-amber-400">
              Dev Mock Mode
            </span>
          </div>
        )}

        {/* Return button */}
        <Button
          onClick={onReturn}
          variant="outline"
          className="mt-2 px-5 py-2.5 h-auto rounded-xl font-mono-tech font-semibold text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 cursor-pointer transition-all gap-2"
        >
          <ArrowLeftFromLine className="h-3.5 w-3.5" />
          Return Workspace
        </Button>

        {/* Hint text */}
        <p className="text-[10px] font-mono-tech text-muted-foreground/60 text-center">
          Closing the external window will also return the workspace here.
        </p>
      </div>
    </div>
  );
}
