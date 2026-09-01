"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, CheckCircle2, XCircle, GraduationCap, ShieldCheck, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  featureKey?: string;
  limit?: number;
  used?: number;
  resetAt?: string;
}

export function PaywallModal({
  isOpen,
  onClose,
  title = "Unlock Unlimited Interview Preparation",
  description = "You've reached the free tier quota for this feature. Upgrade to InternPrep Pro for full AI resume reviews, live case interviewer turns, and priority AI speeds.",
  featureKey,
  limit,
  used,
  resetAt,
}: PaywallModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push("/billing");
  };

  const handleIITBLogin = () => {
    onClose();
    router.push("/login?hint=iitb");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Container */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-2xl bg-card border border-primary/20 shadow-2xl rounded-2xl overflow-hidden z-10"
        >
          {/* Top Gradient Banner */}
          <div className="bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-600/20 px-6 py-5 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-sm">
                <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 inline-block mb-1">
                  Placement Power Pass
                </span>
                <h3 id="paywall-title" className="text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close paywall modal"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Description & Quota Status */}
            <div className="bg-muted/40 rounded-xl p-4 border border-border/60 flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  {description}
                </p>
                {limit !== undefined && used !== undefined && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <span>Usage: {used} / {limit} consumed</span>
                    {resetAt && (
                      <span className="text-muted-foreground">
                        • Resets on {new Date(resetAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Free Tier */}
              <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h4 className="font-semibold text-sm text-foreground">Free Starter Tier</h4>
                  <span className="text-xs text-muted-foreground font-mono">₹0</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>2 Resume Reviews / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>1 Practice Mock Session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>10 Bullet Refinements / month</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <span>Live Voice Interview Engine</span>
                  </li>
                </ul>
              </div>

              {/* Pro Tier */}
              <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wide">
                  Recommended
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                  <h4 className="font-bold text-sm text-primary">InternPrep Pro</h4>
                  <span className="text-xs font-bold text-primary">₹299 / mo</span>
                </div>
                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>30</strong> Resume Reviews / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>15</strong> Full Mock Interviews / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>200</strong> AI Bullet Variants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Priority Low-Latency AI Access</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* IIT Bombay Special Note */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Are you an IIT Bombay Student?
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Log in with your <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">@iitb.ac.in</span> email for 100% free full access!
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleIITBLogin}
                className="text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2"
              >
                Sign in @iitb
              </Button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md gap-2"
            >
              <span>View Plans & Upgrade (₹299)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
