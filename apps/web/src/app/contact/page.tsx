import type { Metadata } from "next";
import Link from "next/link";
import { 
  Mail, Clock, ShieldCheck, MapPin, 
  ArrowLeft, MessageSquare, HelpCircle, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact & Grievance Redressal — InternPrep AI",
  description: "Official support channels, customer service turnaround times, and statutory Grievance Redressal Officer contact details for InternPrep AI.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to InternPrep.ai</span>
          </Link>

          <div className="space-y-2 border-b border-border pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono-tech font-bold">
              <Mail className="h-3.5 w-3.5" />
              <span>OFFICIAL SUPPORT DESK</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono-tech">
              Contact & Grievance Desk
            </h1>
            <p className="text-sm text-muted-foreground">
              Direct communication channels for candidate inquiries, payment support, and statutory data grievance redressal.
            </p>
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Support Email Card */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-foreground font-mono-tech">Customer Support</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For purchase assistance, billing receipts, account access, or mock simulator queries.
            </p>
            <div className="pt-2">
              <a
                href="mailto:krishnagahlod@gmail.com"
                className="text-xs font-mono-tech font-semibold text-emerald-600 dark:text-emerald-400 hover:underline break-all"
              >
                krishnagahlod@gmail.com
              </a>
            </div>
          </div>

          {/* Turnaround Time Card */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-foreground font-mono-tech">Response Timelines</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Direct founder assistance with committed resolution service-level agreements.
            </p>
            <div className="text-xs font-mono-tech text-foreground/90 space-y-0.5 pt-2">
              <div>• Support TAT: <strong>24–48 hours</strong></div>
              <div>• Operational: <strong>Mon–Sat 9:30–18:30 IST</strong></div>
            </div>
          </div>

          {/* Location Card */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-bold text-foreground font-mono-tech">Operational Base</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Independent engineering and AI interview platform operated out of Maharashtra.
            </p>
            <div className="text-xs font-mono-tech text-foreground/90 pt-2">
              Mumbai, Maharashtra, India
            </div>
          </div>

        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

          {/* Grievance Redressal (DPDP Act) */}
          <section className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-mono-tech font-bold text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>Statutory Grievance Redressal (DPDPA 2023)</span>
            </div>
            <p className="text-xs">
              Under Section 13 of India’s Digital Personal Data Protection Act, 2023 and the Information Technology (Intermediary Guidelines) Rules, candidates have the right to register formal data grievances regarding personal data processing, correction, or erasure requests.
            </p>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs font-mono-tech space-y-2 text-foreground">
              <div><strong>Grievance Redressal Officer:</strong> Krishna Gahlod</div>
              <div><strong>Designation:</strong> Platform Founder & Data Protection Lead</div>
              <div><strong>Direct Contact:</strong> <a href="mailto:krishnagahlod@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline">krishnagahlod@gmail.com</a></div>
              <div><strong>Location:</strong> Mumbai, Maharashtra, India</div>
              <div><strong>Statutory Resolution Timeline:</strong> Acknowledged within 48 business hours; fully resolved within 30 calendar days.</div>
            </div>
          </section>

          {/* Refund & Billing Disputes */}
          <section className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-mono-tech font-bold text-base">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <span>Payment & Refund Assistance</span>
            </div>
            <p className="text-xs">
              If you experience a failed transaction where money was debited but credits were not updated, or wish to request an unconsumed credit refund under our{" "}
              <Link href="/refund" className="text-emerald-600 dark:text-emerald-400 underline">
                7-Day Refund Guarantee
              </Link>
              , please include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs font-mono-tech text-foreground/90">
              <li>Your registered account email address</li>
              <li>Razorpay Payment ID (e.g. <code>pay_xxxxxx</code>)</li>
              <li>Brief description of the issue encountered</li>
            </ul>
          </section>

        </div>

      </main>
    </div>
  );
}
