"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck, Check, Zap } from "lucide-react";
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
      "Complete ATS parser compatibility breakdown",
      "Line-by-line Google XYZ formula rewrites",
      "Interviewer cross-question prediction",
      "PDF export with highlighted score tags"
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
      "Integrated Excalidraw digital whiteboard",
      "Comprehensive transcript & rubric debrief"
    ],
    cta: "Purchase Mock Pass",
    isPopular: true
  },
  {
    name: "Placement Sprint Pack",
    price: "₹199",
    billing: "One-time payment",
    badge: "Save 45%",
    credits: "3 Mock Passes + 5 Resume Audits",
    highlights: [
      "3 Full 45-minute Voice Mock Sessions",
      "5 Complete Resume Intelligence Audits",
      "Permanent non-expiring credit balance",
      "Access to Top 50 Campus Case Solutions"
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
      "10 Voice Mock Interview Passes / month",
      "Full Campus Casebook Vault access",
      "Historical progression analytics"
    ],
    cta: "Start Monthly",
    isPopular: false
  },
  {
    name: "Placement Season Pass",
    price: "₹699",
    billing: "Billed for 3 months",
    badge: "Campus Favorite",
    credits: "Unlimited Resumes + 35 Mocks Total",
    highlights: [
      "Unlimited Resume Intelligence Audits",
      "35 Voice Mock Sessions total",
      "Complete 400+ Campus Casebook Directory",
      "Peer cohort percentile benchmarking",
      "Valid throughout placement semester"
    ],
    cta: "Get Season Pass",
    isPopular: true
  }
];

export function PricingSection() {
  const [pricingMode, setPricingMode] = useState<"passes" | "subscription">("passes");
  const plans = pricingMode === "passes" ? MICRO_PASSES : SUBSCRIPTION_PLANS;

  return (
    <section id="pricing" className="py-24 border-b border-white/[0.08] bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-400 font-bold">
            [TRANSPARENT PRICING]
          </span>
          <span className="text-xs font-mono-tech text-zinc-500">NO HIDDEN SUBSCRIPTION TRAPS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6 max-w-3xl">
          Purchase exact credits when you need them, or activate a Season Pass.
        </h2>

        <p className="text-sm sm:text-base text-zinc-400 mb-12 max-w-2xl font-sans">
          Top-up passes never expire. Your credits remain in your account permanently until used.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2 mb-12">
          <div className="p-1 rounded-lg bg-[#0E1013] border border-white/[0.08] inline-flex">
            <button
              onClick={() => setPricingMode("passes")}
              className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all ${
                pricingMode === "passes"
                  ? "bg-white/10 text-white font-semibold border border-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              1-Time Top-Up Passes
            </button>
            <button
              onClick={() => setPricingMode("subscription")}
              className={`px-4 py-1.5 rounded-md text-xs font-mono-tech transition-all ${
                pricingMode === "subscription"
                  ? "bg-white/10 text-white font-semibold border border-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Semester Subscriptions
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-6 ${pricingMode === "passes" ? "md:grid-cols-3" : "md:grid-cols-2 max-w-4xl"}`}>
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
                p.isPopular
                  ? "bg-[#121418] border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.1)]"
                  : "bg-[#0E1013] border-white/[0.08]"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between text-xs font-mono-tech mb-4">
                  <span className="text-zinc-400 font-semibold uppercase">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${
                    p.isPopular
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                  }`}>
                    {p.badge}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-3xl sm:text-4xl font-bold text-white font-mono-tech">{p.price}</div>
                  <div className="text-xs text-zinc-500 font-mono-tech mt-1">{p.billing}</div>
                </div>

                {/* Credit Summary */}
                <div className="p-2.5 rounded bg-[#16181D] border border-white/[0.04] text-xs font-mono-tech text-emerald-400 font-medium mb-6">
                  {p.credits}
                </div>

                {/* Feature Checklist */}
                <div className="space-y-2.5 mb-8 text-xs text-zinc-300 font-sans">
                  {p.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link href="/billing" className="w-full">
                <Button
                  size="sm"
                  className={`w-full h-10 rounded-md text-xs font-semibold font-mono-tech transition-all ${
                    p.isPopular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Security & Lifetime Guarantee */}
        <div className="mt-12 p-4 rounded-lg bg-[#0E1013] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tech text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Razorpay Secure Encrypted 256-Bit Checkout</span>
          </div>
          <div className="text-zinc-500">
            Micro top-up credits remain valid permanently with zero expiry.
          </div>
        </div>

      </div>
    </section>
  );
}
