"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Info, ArrowRight, Zap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const PASSES = [
  {
    name: "Single Resume Scan",
    price: "49",
    credits: "1 Resume Intelligence Audit",
    features: [
      "Full ATS parser breakdown",
      "6-dimension radar scoring",
      "Instant bullet rewrites",
      "Cross-question prediction"
    ],
    isPopular: false
  },
  {
    name: "Single Mock Pass",
    price: "79",
    credits: "1 Voice Mock Interview",
    features: [
      "Any track (Consulting/Tech/Fin)",
      "45-minute simulated pressure test",
      "Excalidraw whiteboard integration",
      "Detailed rubric debrief"
    ],
    isPopular: true
  },
  {
    name: "The Hustler Pack",
    price: "199",
    credits: "3 Mocks + 5 Resumes",
    features: [
      "3 Full Mock Interviews",
      "5 Resume Intelligence Audits",
      "Non-expiring credits",
      "Priority AI processing"
    ],
    isPopular: false
  }
];

const SUBSCRIPTIONS = [
  {
    name: "1 Month Cram",
    price: "299",
    period: "per month",
    features: [
      "Unlimited Resume Audits",
      "10 Mock Interviews / month",
      "Full Casebook access",
      "Historical analytics"
    ],
    isPopular: false
  },
  {
    name: "3 Month Sprint",
    price: "699",
    period: "for 3 months",
    features: [
      "Unlimited Resume Audits",
      "35 Mock Interviews total",
      "Full Casebook access",
      "Interview replay recordings",
      "Best for Placement Season"
    ],
    isPopular: true
  },
  {
    name: "1 Year Mastery",
    price: "1,499",
    period: "per year",
    features: [
      "Unlimited Resume Audits",
      "Unlimited Mock Interviews",
      "All Casebooks & Frameworks",
      "1-on-1 Human Expert Review (1x)",
      "Guaranteed early access to new features"
    ],
    isPopular: false
  }
];

export function PricingSection() {
  const [billingType, setBillingType] = useState<"passes" | "subscription">("passes");

  const plans = billingType === "passes" ? PASSES : SUBSCRIPTIONS;

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground mb-4">
            Transparent Pricing. <span className="text-transparent bg-clip-text bg-gradient-premium">No Traps.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Buy exactly what you need with non-expiring top-up passes, or go all-in with a subscription.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center p-1 bg-background rounded-full border border-border shadow-sm">
            <button
              onClick={() => setBillingType("passes")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                billingType === "passes"
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1-Time Top-Up Passes
            </button>
            <button
              onClick={() => setBillingType("subscription")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                billingType === "subscription"
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Full Subscriptions
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400">
                SAVE 40%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 ${
                plan.isPopular
                  ? "bg-gradient-to-b from-violet-500/5 to-transparent border-2 border-violet-500 shadow-xl shadow-violet-500/10 scale-105 z-10"
                  : "bg-white dark:bg-zinc-950 border border-border hover:border-violet-500/50"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-premium text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-violet-500/25">
                    <Zap className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight font-outfit">₹{plan.price}</span>
                  {'period' in plan && <span className="text-sm font-medium text-muted-foreground">/ {plan.period}</span>}
                </div>
                {'credits' in plan && (
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">
                    {plan.credits}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-muted-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={plan.isPopular ? "default" : "outline"} 
                className={`w-full rounded-xl py-6 font-semibold group ${
                  plan.isPopular ? "bg-foreground text-background hover:bg-foreground/90" : ""
                }`}
              >
                {billingType === "passes" ? "Get Top-Up Pass" : "Start Subscription"}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center flex flex-col items-center justify-center gap-2">
           <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-background px-4 py-2 rounded-full border border-border">
              <ShieldAlert className="w-4 h-4 text-violet-500" />
              Top-up passes <strong className="text-foreground">never expire</strong> and remain in your account permanently.
           </div>
        </div>

      </div>
    </section>
  );
}
