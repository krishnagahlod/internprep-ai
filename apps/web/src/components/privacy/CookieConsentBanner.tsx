"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("internprep_cookie_consent");
    if (!consent) {
      // Small timeout so it doesn't jarringly shift layout on initial paint
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("internprep_cookie_consent", "granted");
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("internprep_cookie_consent", "denied");
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl text-card-foreground">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground font-mono-tech">
                Cookie & Telemetry Preferences
              </span>
              <span className="text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                DPDPA & GDPR
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed font-sans">
              We use strictly essential cookies for secure authentication. With your permission, we also use anonymized telemetry to improve our AI case scoring latency. We never sell your data or train AI models on your resumes.
            </p>
            <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono-tech">
              <Link href="/cookies" className="text-foreground hover:underline">
                Cookie Policy
              </Link>
              <span>•</span>
              <Link href="/privacy" className="text-foreground hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
          <Button
            onClick={handleDecline}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-mono-tech border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            REJECT NON-ESSENTIAL
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="h-8 text-xs font-mono-tech bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            ACCEPT ALL
          </Button>
        </div>
      </div>
    </div>
  );
}
