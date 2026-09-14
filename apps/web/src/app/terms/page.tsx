import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | InternPrep AI",
  description: "Read the Terms of Service governing your use of InternPrep AI's interview simulation platform, resume intelligence tools, and payment passes.",
  alternates: {
    canonical: "https://internprep.ai/terms",
  },
};

export default function TermsOfServicePage() {
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
            <Scale className="h-4 w-4" />
            <span>TERMS OF SERVICE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono-tech">
            LEGAL AGREEMENT & ACCEPTABLE USE POLICY
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono-tech">
            Terms of Service
          </h1>
          <p className="text-xs text-muted-foreground font-mono-tech">
            Effective Date: January 1, 2026 • Last Updated: September 13, 2026 • Version 2.1
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 leading-relaxed font-sans text-muted-foreground">
          {/* Statutory Placement Outcome Disclaimer */}
          <div className="p-4 rounded-xl bg-card border border-amber-500/30 dark:border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-foreground font-mono-tech block">
                1. Critical Placement Outcome & Employment Disclaimer
              </span>
              <p>
                InternPrep AI is an automated educational simulation and diagnostic analysis platform designed to assist candidates with self-directed interview preparation. <strong>InternPrep AI does not guarantee employment, campus placement shortlists, job offers, hiring rounds advancement, or compensation outcomes.</strong> Evaluation rubrics, simulated interviewer responses, and ATS scores are algorithmic estimates calibrated to public industry benchmarks and do not represent formal recruitment decisions of any third-party employer.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              2. Acceptance & Eligibility
            </h2>
            <p>
              By accessing, browsing, registering for an account, or purchasing credits on InternPrep AI ("Platform"), you enter into a legally binding agreement with <strong>Krishna Gahlod</strong> (Founder & Operator of InternPrep AI, "we", "us"). If you are under 18 years of age, you represent that you are accessing this Platform with parental or legal guardian consent.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              3. User Accounts & Security
            </h2>
            <p>
              You agree to provide accurate, current, and complete registration information. You are solely responsible for maintaining the confidentiality of your credentials. Single Sign-On (SSO) options (such as IIT Bombay domain email validation) grant role-specific access tiers that are non-transferable. You must notify us immediately at <a href="mailto:krishnagahlod@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline">krishnagahlod@gmail.com</a> upon discovering any unauthorized session or security breach.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              4. Credit Entitlements & Purchases
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Pay-As-You-Go Passes:</strong> Single Mock Passes and Resume Audit credits are non-expiring units linked directly to your authenticated user account.
              </li>
              <li>
                <strong>Compute Consumption:</strong> Units are consumed immediately upon initiation of an AI diagnostic scan, resume parsing execution, or interview session turn.
              </li>
              <li>
                <strong>Currency & Taxes:</strong> All transaction fees are quoted in Indian Rupees (INR) or US Dollars (USD) as displayed, inclusive of applicable Goods and Services Tax (GST) unless specified.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              5. Intellectual Property Rights
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono-tech">
              <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Candidate Ownership
                </span>
                <p className="font-sans text-muted-foreground">
                  You retain 100% intellectual property ownership of your uploaded resumes, academic records, portfolio work, and personal interview transcripts. We claim no ownership over your career materials.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Platform Proprietary Assets
                </span>
                <p className="font-sans text-muted-foreground">
                  InternPrep AI retains exclusive rights over all proprietary evaluation rubrics, prompt architectures, software code, user interface designs, trademarks, and synthesized benchmarks.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              6. Acceptable Use Policy & Platform Integrity
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>Deploy automated scripts, bots, spiders, or scrapers to extract case interview questions, rubrics, or candidate statistics.</li>
              <li>Perform prompt injection attacks, jailbreaks, or adversarial inputs intended to manipulate underlying inference engines.</li>
              <li>Attempt to bypass rate limiters, payload size restrictions, or identity verification mechanisms.</li>
              <li>Reverse engineer, decompile, or disassemble any portion of the frontend or backend application code.</li>
              <li>Share subscription access or authenticated session tokens with multiple third parties.</li>
            </ul>
            <p className="text-xs">
              Violations will result in immediate permanent account termination and potential legal recourse under the Information Technology Act, 2000.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              7. Limitation of Liability
            </h2>
            <p className="text-xs">
              To the maximum extent permitted under applicable law, Krishna Gahlod, InternPrep AI, and affiliated contributors shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, career opportunities, or placement outcomes arising out of or related to your use or inability to use the Platform. Our aggregate cumulative liability shall not exceed the amount actually paid by you to InternPrep AI in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              8. Governing Law & Dispute Resolution
            </h2>
            <p className="text-xs">
              These Terms and any dispute arising from them shall be governed by and construed in accordance with the laws of the Republic of India. The courts located in <strong>Mumbai, Maharashtra, India</strong> shall have exclusive jurisdiction over any legal proceedings arising hereunder.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              9. Contact Information
            </h2>
            <p className="text-xs">
              For questions regarding these Terms of Service, contact us directly at <a href="mailto:krishnagahlod@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline">krishnagahlod@gmail.com</a> or write to:
            </p>
            <div className="p-3 rounded bg-card border border-border text-xs font-mono-tech text-foreground">
              Krishna Gahlod • Founder & Operator of InternPrep AI • Mumbai, Maharashtra, India
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
