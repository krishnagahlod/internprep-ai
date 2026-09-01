"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client rendering exception for diagnostic tracking
    console.error("[App Error Boundary Caught Exception]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle tech background grid */}
      <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono-tech text-destructive font-bold uppercase tracking-wider">
                [SYSTEM RUNTIME EXCEPTION]
              </div>
              <h1 className="text-lg font-bold text-foreground">
                Something went unexpectedly wrong
              </h1>
            </div>
          </div>
          {error.digest && (
            <span className="text-[11px] font-mono-tech text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
              REF: {error.digest.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Error Details */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2">
          <div className="text-xs font-mono-tech text-muted-foreground uppercase flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Diagnostic Details</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground font-mono-tech break-words line-clamp-4 leading-relaxed">
            {error.message || "An unexpected error occurred during interface rendering."}
          </p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          The application encountered an isolated client exception. Your workspace and session state remain preserved in local storage.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Recovering View
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-10 rounded-lg border-border bg-card hover:bg-muted text-foreground font-mono-tech text-xs font-semibold"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              className="w-full sm:w-auto h-10 rounded-lg text-muted-foreground hover:text-foreground font-mono-tech text-xs"
            >
              <Home className="mr-1.5 h-3.5 w-3.5" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
