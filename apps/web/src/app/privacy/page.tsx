import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, FileText, UserCheck, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | InternPrep AI",
  description: "Learn how InternPrep AI collects, processes, and protects your personal data, resumes, and interview transcripts in compliance with India's DPDP Act 2023 and GDPR.",
  alternates: {
    canonical: "https://internprep.ai/privacy",
  },
};

export default function PrivacyPolicyPage() {
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
            <Shield className="h-4 w-4" />
            <span>DPDP ACT 2023 & GDPR COMPLIANT</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono-tech">
            LEGAL ARCHITECTURE & REGULATORY DISCLOSURES
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono-tech">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground font-mono-tech">
            Effective Date: January 1, 2026 • Last Updated: September 13, 2026 • Version 2.1
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 leading-relaxed font-sans text-muted-foreground">
          {/* Executive Notice */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-foreground font-mono-tech block">
                Executive Privacy Summary
              </span>
              <p>
                InternPrep AI ("Platform", "we", "us", or "our"), operated by <strong>Krishna Gahlod</strong> (Founder & Operator), respects your fundamental right to data privacy. We strictly process uploaded resumes, audio transcripts, and interview responses solely for automated diagnostic scoring and candidate feedback. <strong>We do not sell candidate data to recruitment brokers or use private candidate records to train public foundation models.</strong>
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech flex items-center gap-2">
              <span>1. Operator Identity & Data Fiduciary</span>
            </h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023 (DPDPA 2023) of India and applicable global regulations (including the EU General Data Protection Regulation / GDPR), the Data Fiduciary responsible for personal data processing is:
            </p>
            <div className="p-4 rounded-lg bg-card border border-border text-xs space-y-1 font-mono-tech text-foreground">
              <p><strong>Platform Operator:</strong> Krishna Gahlod (Founder & Operator of InternPrep AI)</p>
              <p><strong>Operational Location:</strong> Mumbai, Maharashtra, India</p>
              <p><strong>Primary Support Contact:</strong> krishnagahlod@gmail.com</p>
              <p><strong>Direct Turnaround Time (TAT):</strong> 24–48 business hours</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              2. Personal Data We Collect
            </h2>
            <p>We process only data strictly necessary to provide real-time interview simulations and resume diagnostics:</p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Identity & Account Credentials:</strong> Name, academic/work email address, university affiliation (e.g. IIT Bombay email domain verification), password hash (managed securely via Supabase Auth with salted bcrypt/Argon2).
              </li>
              <li>
                <strong>Candidate Professional Materials:</strong> PDF/DOCX resumes, CVs, bullet point drafts, work history, and target role preferences uploaded for parsing and scoring.
              </li>
              <li>
                <strong>Simulation & Diagnostic Telemetry:</strong> Case transcript text, spoken audio recordings (transiently transcribed and processed in memory), evaluation scorecards, and scratchpad notes.
              </li>
              <li>
                <strong>Billing & Transaction Metadata:</strong> Order IDs, pass purchases, subscription statuses, and invoice references. <em>Note: Credit card, debit card, and UPI credentials are processed directly by our PCI-DSS Level 1 compliant gateway (Razorpay) and are never stored or seen by our servers.</em>
              </li>
              <li>
                <strong>Technical Telemetry:</strong> IP addresses, anonymized browser user-agents, device fingerprints, and diagnostic crash reports (processed via Sentry with automated PII redaction).
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              3. Purpose & Legal Basis for Processing
            </h2>
            <p>
              We process personal data under lawful grounds recognized by Section 4 and Section 7 of the DPDP Act 2023 and Article 6 of the GDPR:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li><strong>Performance of Contract:</strong> Generating real-time interview questions, dynamic case evaluations, and tailored resume optimization suggestions requested by you.</li>
              <li><strong>Affirmative Consent:</strong> Processing resumes and audio inputs provided explicitly during user sessions. You may withdraw consent at any time.</li>
              <li><strong>Legitimate Interests:</strong> Preventing Denial-of-Wallet (DoW) abuse, rate limit enforcement, detecting fraudulent payment claims, and ensuring platform security.</li>
              <li><strong>Legal Compliance:</strong> Complying with statutory financial reporting, tax (GST) mandates, and lawful government requests.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              4. AI Transparency & No-Training Guarantee
            </h2>
            <div className="p-4 rounded-lg bg-card border border-border text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono-tech font-semibold">
                <Lock className="h-4 w-4" />
                <span>Zero Retention & Zero Model Training</span>
              </div>
              <p>
                InternPrep AI enforces strict enterprise data confidentiality agreements with our AI inference providers (including Cerebras Systems, Groq Inc., and Google Cloud). Your resume text and interview transcripts are processed via stateless API calls that guarantee:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your candidate data is <strong>never used to train, fine-tune, or calibrate public AI models</strong>.</li>
                <li>Inputs and outputs are purged from inference provider memory immediately upon completion of response streaming.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              5. Authorized Sub-Processors
            </h2>
            <p>We work with vetted cloud infrastructure sub-processors who comply with industry security standards (SOC 2 Type II, ISO 27001):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border rounded-lg font-mono-tech">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-2.5">Sub-Processor</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Supabase Inc.</td>
                    <td className="p-2.5">AWS Mumbai (ap-south-1)</td>
                    <td className="p-2.5">User Authentication & Relational Database</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Razorpay Software Pvt. Ltd.</td>
                    <td className="p-2.5">India</td>
                    <td className="p-2.5">Payment Gateway (PCI-DSS Level 1)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Cerebras / Groq / Google</td>
                    <td className="p-2.5">United States / Global</td>
                    <td className="p-2.5">Stateless LLM Inference & Case Generation</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Vercel Inc.</td>
                    <td className="p-2.5">Global Edge Network</td>
                    <td className="p-2.5">Frontend Web Hosting & CDN Delivery</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">PostHog Inc.</td>
                    <td className="p-2.5">United States</td>
                    <td className="p-2.5">Opt-In Product Telemetry & Performance Monitoring</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Functional Software (Sentry)</td>
                    <td className="p-2.5">United States</td>
                    <td className="p-2.5">Application Error Logging (with Automated PII Redaction)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              6. Your Rights Under DPDP Act 2023 & GDPR
            </h2>
            <p>Every registered user retains comprehensive autonomy over their personal data:</p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li><strong>Right to Access & Summary:</strong> Request an export of all resumes, transcripts, and account profile records held by us.</li>
              <li><strong>Right to Correction & Completion:</strong> Update obsolete contact details or academic affiliations directly in your profile settings.</li>
              <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request complete deletion of your account, resumes, and session archives.</li>
              <li><strong>Right to Grievance Redressal:</strong> Direct complaints to our appointed Grievance Redressal Officer.</li>
              <li><strong>Right to Nominate:</strong> Designate a nominee to exercise data rights in the event of death or incapacity.</li>
            </ul>
            <p className="text-xs">
              To trigger automated self-service data export or account erasure, navigate to your <strong>Dashboard Settings &gt; Data Rights</strong>, or email our Data Compliance Desk at <a href="mailto:krishnagahlod@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline">krishnagahlod@gmail.com</a>.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              7. Grievance Redressal Officer (GRO)
            </h2>
            <p>
              In accordance with Section 13 of the DPDP Act 2023 and Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, our designated Grievance Redressal Officer is:
            </p>
            <div className="p-4 rounded-lg bg-card border border-border text-xs space-y-1 font-mono-tech text-foreground">
              <p><strong>Designation:</strong> Grievance Redressal Officer & Data Protection Lead</p>
              <p><strong>Officer Name:</strong> Krishna Gahlod</p>
              <p><strong>Official Contact Email:</strong> krishnagahlod@gmail.com</p>
              <p><strong>Location:</strong> Mumbai, Maharashtra, India</p>
              <p><strong>Statutory Response Timeline:</strong> Initial acknowledgment within 48 hours; full resolution within 30 calendar days.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              8. Retention & Deletion Schedule
            </h2>
            <p>
              We retain personal data only as long as your account remains active. Resumes and session transcripts can be deleted at any time by the user. If an account remains inactive for 24 continuous months, all associated resume artifacts and interview logs are queued for automated cryptographic purging.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
