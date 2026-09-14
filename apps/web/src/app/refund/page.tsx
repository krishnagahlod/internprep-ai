import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Clock, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | InternPrep AI",
  description: "Read InternPrep AI's transparent Refund and Cancellation Policy for single-use mock interview passes and subscription plans.",
  alternates: {
    canonical: "https://internprep.ai/refund",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Top Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>BACK TO HOME</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono-tech text-emerald-600 dark:text-emerald-400">
            <RefreshCw className="h-4 w-4" />
            <span>RAZORPAY VERIFIED POLICY</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono-tech">
            TRANSPARENT BILLING & CONSUMER PROTECTION
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono-tech">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-muted-foreground font-mono-tech">
            Effective Date: January 1, 2026 • Last Updated: September 13, 2026 • Version 2.0
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 leading-relaxed font-sans text-muted-foreground">
          {/* Highlight Card */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-foreground font-mono-tech block">
                7-Day Unused Credit Refund Guarantee
              </span>
              <p>
                At <strong>InternPrep AI</strong> (operated by <strong>Krishna Gahlod</strong>), we want you to feel completely confident in your preparation. If you purchase any top-up pass (such as a Single Mock Pass or Single Resume Audit) and do not use the credit, you are entitled to a 100% no-questions-asked refund within <strong>7 days of purchase</strong>.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              1. Digital Compute Consumption Rules
            </h2>
            <p className="text-xs">
              Because InternPrep AI provisions dedicated high-performance neural compute resources (via specialized AI inference hardware) in real-time upon session launch:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Unconsumed Credits:</strong> Any pass or credit unit that has not been initiated into an interview session or resume audit is fully refundable within 7 days of payment.
              </li>
              <li>
                <strong>Consumed Credits:</strong> Once an interview session commences (the candidate sends their initial turn or prompt) or a full resume ATS audit PDF is generated and downloaded, the digital compute allocation is deemed fulfilled and that specific credit is non-refundable.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              2. Technical Outage & System Error Protection
            </h2>
            <div className="p-4 rounded-lg bg-card border border-border text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono-tech font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>Zero-Loss Guarantee on System Failures</span>
              </div>
              <p>
                If a platform technical error, server timeout, or speech-to-text failure interrupts your mock interview or causes an ATS scorecard to fail during generation:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We will automatically re-credit your account balance immediately.</li>
                <li>Alternatively, you may request a direct monetary refund if you prefer not to re-take the session.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              3. Subscription Cancellation Terms
            </h2>
            <p className="text-xs">
              For recurring subscription passes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                You can cancel your subscription renewal at any moment directly from your <strong>Dashboard &gt; Billing & Passes</strong> tab.
              </li>
              <li>
                Upon cancellation, you will retain full access to all plan features until the end of your current paid billing period. No further charges will be made.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              4. Refund Processing Timelines & Methods
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono-tech">
              <div className="p-4 rounded-lg bg-card border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span>Processing Window</span>
                </div>
                <p className="font-sans text-muted-foreground">
                  Refund requests are validated within <strong>24 to 48 business hours</strong>. Approved refunds reflect in your account within <strong>5 to 7 business days</strong>.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  <span>Original Payment Route</span>
                </div>
                <p className="font-sans text-muted-foreground">
                  All refunds are issued strictly back to the original method of payment (UPI ID, Credit Card, Debit Card, or Net Banking) via Razorpay.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              5. How to Initiate a Refund Request
            </h2>
            <p className="text-xs">
              To request a refund or report a disrupted interview session, send an email to <a href="mailto:krishnagahlod@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline font-semibold">krishnagahlod@gmail.com</a> with:
            </p>
            <div className="p-4 rounded-lg bg-card border border-border text-xs font-mono-tech space-y-1 text-foreground">
              <p>• Subject: <code>Refund Request - [Your Registered Email]</code></p>
              <p>• Razorpay Payment / Order ID (found on your payment receipt email)</p>
              <p>• Reason for request (e.g. accidental purchase, technical platform error)</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              6. Merchant Information
            </h2>
            <div className="p-4 rounded-lg bg-card border border-border text-xs space-y-1 font-mono-tech text-foreground">
              <p><strong>Merchant / Platform Operator:</strong> Krishna Gahlod (InternPrep AI)</p>
              <p><strong>Operating Location:</strong> Mumbai, Maharashtra, India</p>
              <p><strong>Support & Dispute Email:</strong> krishnagahlod@gmail.com</p>
              <p><strong>Turnaround Time (TAT):</strong> Initial response within 24–48 hours; processed within 5–7 banking days</p>
              <p><strong>Customer Support Hours:</strong> Monday – Saturday, 9:30 AM to 6:30 PM IST</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
