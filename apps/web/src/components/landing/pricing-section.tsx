"use client";

import { ArrowRight, ShieldCheck, Check, Zap, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const MICRO_PASSES = [
  {
    name: "Single Resume Audit",
    price: "₹49",
    billing: "One-time payment",
    badge: "Non-Expiring",
    credits: "1 Full Ingestion & 6-Dimension Scorecard",
    highlights: [
      "Full ATS parser compatibility report",
      "Line-by-line Google XYZ formula rewrites",
      "Interviewer cross-question prediction",
      "Interactive workshop rewrite co-pilot"
    ],
    cta: "Purchase Resume Pass",
    isPopular: false
  },
  {
    name: "Single Mock Pass",
    price: "₹79",
    billing: "One-time payment",
    badge: "Most Popular",
    credits: "1 Full 45-Min Voice Mock Session",
    highlights: [
      "Target track (Consulting / Tech / Finance / PM)",
      "Live dynamic partner pushback & interruptions",
      "Instant Cerebras response (<150ms)",
      "Comprehensive transcript & rubric debrief"
    ],
    cta: "Purchase Mock Pass",
    isPopular: true
  },
  {
    name: "Placement Sprint Pack",
    price: "₹199",
    billing: "One-time payment",
    badge: "Best Value",
    credits: "3 Mock Passes + 5 Resume Audits",
    highlights: [
      "3 Full 45-minute Voice Mock Sessions",
      "5 Complete Resume Intelligence Audits",
      "Permanent non-expiring credit balance",
      "Detailed historical scorecard tracking"
    ],
    cta: "Get Sprint Pack",
    isPopular: false
  }
];

const SUBSCRIPTION_PLANS = [
  {
    name: "Monthly Prep",
    price: "₹299",
    billing: "Billed monthly",
    badge: "Self-Paced",
    credits: "Unlimited Resumes + 10 Mocks / mo",
    highlights: [
      "Unlimited Resume Intelligence Audits",
      "10 Full Mock Interview Sessions / month",
      "ATS checker & Resume Studio access",
      "Historical progression analytics"
    ],
    cta: "Start Monthly Plan",
    isPopular: false
  },
  {
    name: "Placement Season Pass",
    price: "₹699",
    billing: "Billed for 3 months (₹233/mo)",
    badge: "Semester Favorite",
    credits: "Unlimited Resumes + 35 Mocks Total",
    highlights: [
      "Unlimited Resume Intelligence Audits",
      "35 Mock Interview Sessions total",
      "Full ATS & Resume Studio tool suite",
      "Priority API queue for instant responses",
      "Valid throughout placement semester"
    ],
    cta: "Get Season Pass",
    isPopular: true
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 border-b border-border bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
            [PRICING]
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">ALL-IN-ONE TRANSPARENT PRICING</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 max-w-3xl">
          Purchase exact credits as you need them, or activate a Season Pass.
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground mb-12 max-w-3xl font-sans">
          Zero hidden fees. Top-up passes never expire and remain permanently in your account. Subscriptions provide bulk monthly quotas for intensive placement prep.
        </p>

        {/* SECTION 1: 1-Time Top-Up Passes (Pay-as-you-go) */}
        <div className="space-y-4 mb-14">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-foreground font-bold">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="uppercase">1-Time Top-Up Credit Passes (Non-Expiring)</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {MICRO_PASSES.map((p, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
                  p.isPopular
                    ? "bg-card border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                    : "bg-card border-border shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-tech mb-4">
                    <span className="text-muted-foreground font-semibold uppercase">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      p.isPopular
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {p.badge}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-3xl sm:text-4xl font-bold text-foreground font-mono-tech">{p.price}</div>
                    <div className="text-xs text-muted-foreground font-mono-tech mt-1">{p.billing}</div>
                  </div>

                  <div className="p-2.5 rounded bg-muted/50 border border-border text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 font-medium mb-6">
                    {p.credits}
                  </div>

                  <div className="space-y-2.5 mb-8 text-xs text-muted-foreground font-sans">
                    {p.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/billing" className="w-full">
                  <Button
                    size="sm"
                    className={`w-full h-11 rounded-md text-xs font-semibold font-mono-tech focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all ${
                      p.isPopular
                        ? "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 shadow-sm"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {p.cta}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Semester Subscriptions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-foreground font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="uppercase">Placement Season Subscriptions (Bulk Value)</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {SUBSCRIPTION_PLANS.map((p, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  p.isPopular
                    ? "bg-card border-primary/50 shadow-sm ring-1 ring-primary/20"
                    : "bg-card border-border shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-tech mb-4">
                    <span className="text-muted-foreground font-semibold uppercase">{p.name}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      p.isPopular
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {p.badge}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-3xl sm:text-4xl font-bold text-foreground font-mono-tech">{p.price}</div>
                    <div className="text-xs text-muted-foreground font-mono-tech mt-1">{p.billing}</div>
                  </div>

                  <div className="p-2.5 rounded bg-muted/50 border border-border text-xs font-mono-tech text-primary font-medium mb-6">
                    {p.credits}
                  </div>

                  <div className="space-y-2.5 mb-8 text-xs text-muted-foreground font-sans">
                    {p.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/billing" className="w-full">
                  <Button
                    size="sm"
                    className="w-full h-11 rounded-md text-xs font-semibold font-mono-tech bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
                  >
                    {p.cta}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Guarantee Banner */}
        <div className="mt-12 p-4 rounded-lg bg-card border border-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tech text-muted-foreground shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Razorpay Secure Encrypted 256-Bit Checkout</span>
          </div>
          <div className="text-foreground">
            IIT Bombay (@iitb.ac.in) students receive 100% free access upon login.
          </div>
        </div>

      </div>
    </section>
  );
}
