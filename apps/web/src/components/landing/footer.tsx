"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, ShieldCheck, Sparkles, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function Footer() {
  const [modalType, setModalType] = useState<"privacy" | "terms" | "methodology" | null>(null);

  return (
    <footer className="border-t border-border bg-card text-muted-foreground text-xs py-14 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-foreground font-mono-tech font-bold text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded w-fit"
            >
              <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="tracking-tight text-foreground">
                InternPrep<span className="text-emerald-600 dark:text-emerald-400">.ai</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm text-xs leading-relaxed font-sans">
              The interview simulation and resume intelligence engine calibrated to top-tier campus placement and corporate hiring standards.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono-tech text-muted-foreground pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-foreground font-medium">5 Domain Simulation Engines Active</span>
            </div>
          </div>

          {/* 5 Domains */}
          <div className="space-y-3 font-sans">
            <div className="font-mono-tech text-foreground text-xs font-semibold uppercase">5 Domains</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/interview" className="hover:text-foreground transition-colors">Management Consulting</Link></li>
              <li><Link href="/interview" className="hover:text-foreground transition-colors">Software & Systems SWE</Link></li>
              <li><Link href="/interview" className="hover:text-foreground transition-colors">Data Science & Analytics</Link></li>
              <li><Link href="/interview" className="hover:text-foreground transition-colors">Finance & Valuation</Link></li>
              <li><Link href="/interview" className="hover:text-foreground transition-colors">Product Management</Link></li>
            </ul>
          </div>

          {/* Tools & Features */}
          <div className="space-y-3 font-sans">
            <div className="font-mono-tech text-foreground text-xs font-semibold uppercase">Suite</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/resume" className="hover:text-foreground transition-colors">Resume Intelligence</Link></li>
              <li><Link href="/ats-checker" className="hover:text-foreground transition-colors">ATS Scorecard Studio</Link></li>
              <li><Link href="/resume-builder" className="hover:text-foreground transition-colors">Achievement Vault</Link></li>
              <li><Link href="/interview" className="hover:text-foreground transition-colors">Live Case Whiteboard</Link></li>
              <li><Link href="#pricing" className="hover:text-foreground transition-colors">Transparent Passes</Link></li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-3 font-sans">
            <div className="font-mono-tech text-foreground text-xs font-semibold uppercase">Trust & Policies</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <button 
                  onClick={() => setModalType("privacy")} 
                  className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setModalType("terms")} 
                  className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setModalType("methodology")} 
                  className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded transition-colors text-left"
                >
                  Evaluation Methodology
                </button>
              </li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">IIT Bombay Single Sign-On</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-tech text-muted-foreground">
          <div>
            © {new Date().getFullYear()} InternPrep AI. Engineered for competitive placements.
          </div>
          <div className="flex items-center gap-4">
            <span>IIT BOMBAY PLACEMENTS EDITION</span>
            <span>•</span>
            <span>SECURE 256-BIT SSL CHECKOUT</span>
          </div>
        </div>

      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={modalType === "privacy"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border text-foreground p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground font-mono-tech">Privacy Policy</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Effective as of 2026. Last updated February 2026.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed max-h-[60vh] overflow-y-auto pr-2 font-sans">
            <p>
              InternPrep AI ("we", "us", "our") takes user data privacy with extreme seriousness. This policy outlines how user resumes, audio transcripts, and session telemetry are processed.
            </p>
            <h4 className="font-semibold text-foreground font-mono-tech">1. Data Ingestion & Resume Parsing</h4>
            <p>
              PDF resumes uploaded to the platform are processed exclusively in isolated, transient execution environments. We do not sell your personal data or resume records to third-party recruiters without your explicit affirmative opt-in.
            </p>
            <h4 className="font-semibold text-foreground font-mono-tech">2. Mock Session Processing</h4>
            <p>
              Mock interview transcripts are evaluated against calibration rubrics. User interview responses are not used to train public foundation models.
            </p>
            <h4 className="font-semibold text-foreground font-mono-tech">3. Security & Payments</h4>
            <p>
              Payment processing for top-up passes and subscriptions is handled by Razorpay with 256-bit TLS encryption. We never store credit card numbers on our servers.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={modalType === "terms"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border text-foreground p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground font-mono-tech">Terms of Service</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Applicable to all users and campus accounts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed max-h-[60vh] overflow-y-auto pr-2 font-sans">
            <h4 className="font-semibold text-foreground font-mono-tech">1. Credit Validity & Top-Up Passes</h4>
            <p>
              1-Time Top-Up Passes (including Single Resume Audits and Single Mock Passes) do not expire and remain accessible in your account balance permanently.
            </p>
            <h4 className="font-semibold text-foreground font-mono-tech">2. Platform Usage</h4>
            <p>
              InternPrep AI is an educational interview simulation tool. While calibrated to rigorous partner rubrics, actual placement outcomes depend on individual candidate performance during official campus placement rounds.
            </p>
            <h4 className="font-semibold text-foreground font-mono-tech">3. Cancellation & Refunds</h4>
            <p>
              Unused top-up credits are eligible for refunds within 7 days of purchase upon contacting support if technical issues prevented session completion.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Methodology Dialog */}
      <Dialog open={modalType === "methodology"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border text-foreground p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground font-mono-tech">Evaluation Methodology</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">How InternPrep AI scores candidate turns.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed max-h-[60vh] overflow-y-auto pr-2 font-sans">
            <h4 className="font-semibold text-foreground font-mono-tech">1. MECE & Technical Structuring Calibration</h4>
            <p>
              Cases and system architecture questions are evaluated based on Mutually Exclusive, Collectively Exhaustive principles. Sub-branches are graded on logical completeness, root-cause depth, and numerical defensibility.
            </p>
            <h4 className="font-semibold text-foreground font-mono-tech">2. Action-Impact Quantification for Resumes</h4>
            <p>
              Bullet points are scored on high-agency action verbs, metric density, and quantified business impact. Missing scale or unquantified claims trigger diagnostic flags and auto-suggest benchmark enrichments.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
