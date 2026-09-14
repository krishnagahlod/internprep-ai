import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, CheckCircle2, Shield, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | InternPrep AI",
  description: "Learn about how InternPrep AI uses cookies and browser storage for authentication, security, and optional product telemetry.",
  alternates: {
    canonical: "https://internprep.ai/cookies",
  },
};

export default function CookiePolicyPage() {
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
            <Cookie className="h-4 w-4" />
            <span>TRANSPARENT COOKIE GOVERNANCE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono-tech">
            BROWSER STORAGE & TELEMETRY DISCLOSURE
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono-tech">
            Cookie Policy
          </h1>
          <p className="text-xs text-muted-foreground font-mono-tech">
            Effective Date: January 1, 2026 • Last Updated: September 13, 2026
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 leading-relaxed font-sans text-muted-foreground">
          <p>
            InternPrep AI ("we", "us", or "our") uses cookies and related browser storage technologies (such as <code>localStorage</code> and <code>sessionStorage</code>) to keep your authenticated session secure, remember interface preferences, and analyze anonymized platform performance. This document details each category of cookie deployed across our web application.
          </p>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              1. What Are Cookies and Local Storage?
            </h2>
            <p className="text-xs">
              Cookies are compact text files stored on your computer or mobile device by websites you visit. Browser Local Storage enables web applications to store key-value data persistently without expiring at the end of a single browsing session. We utilize these tools strictly to fulfill functionality you request (such as keeping you logged in).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              2. Categories of Storage Deployed
            </h2>

            {/* Essential Category */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-mono-tech font-semibold text-sm">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Strictly Essential / Authentication Storage</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ALWAYS ACTIVE
                </span>
              </div>
              <p className="text-xs">
                These tokens are mandatory for the application to function. They authenticate your account, maintain active interview session state, and protect against Cross-Site Request Forgery (CSRF). They cannot be disabled without breaking platform functionality.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono-tech border border-border rounded">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Provider</th>
                      <th className="p-2">Purpose</th>
                      <th className="p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-2 font-semibold text-foreground">sb-*-auth-token</td>
                      <td className="p-2">Supabase</td>
                      <td className="p-2">Stores JWT credentials for authenticated candidate accounts</td>
                      <td className="p-2">Session / 1 Year</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-foreground">internprep_cookie_consent</td>
                      <td className="p-2">InternPrep AI</td>
                      <td className="p-2">Records user choice on analytics cookie preferences</td>
                      <td className="p-2">180 Days</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-foreground">theme</td>
                      <td className="p-2">NextThemes</td>
                      <td className="p-2">Preserves user dark/light display preference</td>
                      <td className="p-2">Persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Category */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-mono-tech font-semibold text-sm">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Performance & Product Telemetry (Opt-In)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech bg-muted text-muted-foreground border border-border">
                  USER-CONTROLLED
                </span>
              </div>
              <p className="text-xs">
                With your consent, we use PostHog to gather aggregated, anonymized metrics on feature usage, latency spikes, and page navigation flows. This data helps us optimize AI latency and diagnose UI bottlenecks. <strong>No raw resume text, passwords, or payment cards are ever transmitted to our analytics providers.</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono-tech border border-border rounded">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Provider</th>
                      <th className="p-2">Purpose</th>
                      <th className="p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-2 font-semibold text-foreground">ph_*_posthog</td>
                      <td className="p-2">PostHog</td>
                      <td className="p-2">Anonymized session interaction and feature performance measurement</td>
                      <td className="p-2">1 Year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              3. Managing Your Cookie Preferences
            </h2>
            <p className="text-xs">
              When you first visit our platform, our Cookie Consent Banner allows you to accept or decline non-essential telemetry cookies. If you wish to change your preference at any time:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs">
              <li>
                <strong>Browser Settings:</strong> You can configure your browser (Chrome, Firefox, Safari, Edge) to block or delete cookies. Blocking strictly essential cookies will prevent you from logging into your account.
              </li>
              <li>
                <strong>Reset Preferences:</strong> You can clear <code>internprep_cookie_consent</code> from your browser storage to re-trigger the consent banner on your next page reload.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground font-mono-tech">
              4. Contact Our Privacy Team
            </h2>
            <p className="text-xs">
              If you have any questions about our use of cookies or telemetry tracking, please email our Data Compliance Desk at <a href="mailto:krishnagahlod@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline">krishnagahlod@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
