"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Fatal Error Boundary Caught Exception]:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#08090A] text-[#F4F4F5] font-sans antialiased flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0F1013] p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
              [CRITICAL APPLICATION ERROR]
            </div>
            <h1 className="text-xl font-bold text-white">
              Application Crashed
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              A critical layout-level error occurred. Please try reloading the root application.
            </p>
          </div>

          {error.digest && (
            <div className="text-[11px] font-mono text-zinc-500 bg-zinc-900/80 p-2 rounded border border-white/5">
              Correlation Digest: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Application
            </button>
            <a
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Home className="h-3.5 w-3.5" />
              Go to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
