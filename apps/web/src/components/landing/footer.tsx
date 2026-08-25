"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function Footer() {
  const [modalType, setModalType] = useState<"privacy" | "terms" | "methodology" | null>(null);

  return (
    <footer className="border-t border-white/[0.08] bg-[#060709] text-zinc-400 text-xs py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm">
              <div className="h-6 w-6 rounded bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span>InternPrep.ai</span>
            </Link>
            <p className="text-zinc-500 max-w-sm text-xs leading-relaxed font-sans">
              The interview intelligence engine calibrated to McKinsey, BCG, and FAANG hiring rubrics. Built for Day 1 placement prep.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono-tech text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>All evaluation pipelines operating at &lt; 150ms latency</span>
            </div>
          </div>

          {/* Core Modules */}
          <div className="space-y-3 font-sans">
            <div className="font-mono-tech text-zinc-200 text-xs font-semibold uppercase">Platform</div>
            <ul className="space-y-2 text-zinc-500">
              <li><Link href="#simulator" className="hover:text-zinc-300 transition-colors">Voice Simulator</Link></li>
              <li><Link href="#resume-intelligence" className="hover:text-zinc-300 transition-colors">Resume Intelligence</Link></li>
              <li><Link href="/resume" className="hover:text-zinc-300 transition-colors">Resume Studio</Link></li>
              <li><Link href="#casebooks" className="hover:text-zinc-300 transition-colors">Campus Casebooks</Link></li>
              <li><Link href="#pricing" className="hover:text-zinc-300 transition-colors">Pricing & Credits</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3 font-sans">
            <div className="font-mono-tech text-zinc-200 text-xs font-semibold uppercase">Resources</div>
            <ul className="space-y-2 text-zinc-500">
              <li><Link href="#faq" className="hover:text-zinc-300 transition-colors">FAQ & Specs</Link></li>
              <li><Link href="/interview" className="hover:text-zinc-300 transition-colors">Live Drill Console</Link></li>
              <li><Link href="/casebooks" className="hover:text-zinc-300 transition-colors">IIT Bombay Casebook</Link></li>
              <li><Link href="/casebooks" className="hover:text-zinc-300 transition-colors">IIM Ahmedabad Vault</Link></li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-3 font-sans">
            <div className="font-mono-tech text-zinc-200 text-xs font-semibold uppercase">Trust & Legal</div>
            <ul className="space-y-2 text-zinc-500">
              <li>
                <button onClick={() => setModalType("privacy")} className="hover:text-zinc-300 transition-colors text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setModalType("terms")} className="hover:text-zinc-300 transition-colors text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setModalType("methodology")} className="hover:text-zinc-300 transition-colors text-left">
                  Evaluation Methodology
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-tech text-zinc-600">
          <div>
            © {new Date().getFullYear()} InternPrep AI Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>IIT BOMBAY PLACEMENTS EDITION</span>
            <span>•</span>
            <span>SECURE RAZORPAY SSL</span>
          </div>
        </div>

      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={modalType === "privacy"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl bg-[#0E1013] border border-white/15 text-zinc-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white font-mono-tech">Privacy Policy</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">Effective as of 2026. Last updated February 2026.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <p>
              InternPrep AI ("we", "us", "our") takes user data privacy with extreme seriousness. This policy outlines how user resumes, audio transcripts, and session telemetry are processed.
            </p>
            <h4 className="font-semibold text-white">1. Data Ingestion & Resume Parsing</h4>
            <p>
              PDF resumes uploaded to the platform are processed exclusively in isolated, transient execution environments. We do not sell your personal data or resume records to third-party recruiters without your explicit affirmative opt-in.
            </p>
            <h4 className="font-semibold text-white">2. Voice Transcripts & LLM Processing</h4>
            <p>
              Live voice recordings are transcribed via secure low-latency speech APIs and evaluated against calibration rubrics. User interview audio is not used to train public foundation models.
            </p>
            <h4 className="font-semibold text-white">3. Security & Payments</h4>
            <p>
              Payment processing for top-up passes and subscriptions is handled by Razorpay with 256-bit TLS encryption. We never store credit card numbers on our servers.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={modalType === "terms"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl bg-[#0E1013] border border-white/15 text-zinc-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white font-mono-tech">Terms of Service</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">Applicable to all users and campus accounts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <h4 className="font-semibold text-white">1. Credit Validity & Top-Up Passes</h4>
            <p>
              1-Time Top-Up Passes (including Single Resume Audits and Single Mock Passes) do not expire and remain accessible in your account balance permanently.
            </p>
            <h4 className="font-semibold text-white">2. Platform Usage</h4>
            <p>
              InternPrep AI is an educational interview simulation tool. While calibrated to rigorous partner rubrics, actual placement outcomes depend on individual candidate performance during official campus placement rounds.
            </p>
            <h4 className="font-semibold text-white">3. Cancellation & Refunds</h4>
            <p>
              Unused top-up credits are eligible for refunds within 7 days of purchase upon contacting support if technical issues prevented session completion.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Methodology Dialog */}
      <Dialog open={modalType === "methodology"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl bg-[#0E1013] border border-white/15 text-zinc-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white font-mono-tech">Evaluation Methodology</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">How InternPrep AI scores candidate turns.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <h4 className="font-semibold text-white">1. MECE Structuring Calibration</h4>
            <p>
              Cases are evaluated based on Mutually Exclusive, Collectively Exhaustive principles. Sub-branches are graded on logical completeness, root-cause depth, and numerical defensibility.
            </p>
            <h4 className="font-semibold text-white">2. Google XYZ Formula for Resumes</h4>
            <p>
              Bullet points are scored on: Accomplished [X], as measured by [Y], by doing [Z]. Missing scale or unquantified claims trigger low-confidence flags and auto-suggest metric enrichments.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
