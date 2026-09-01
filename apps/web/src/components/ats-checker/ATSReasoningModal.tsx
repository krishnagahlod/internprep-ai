"use client";

import { Button } from "@/components/ui/button";
import { Brain, X, ShieldCheck, Target, TrendingUp, Zap, SlidersHorizontal } from "lucide-react";

interface ATSReasoningModalProps {
  open: boolean;
  onClose: () => void;
  atsReport: any;
}

export function ATSReasoningModal({
  open,
  onClose,
  atsReport,
}: ATSReasoningModalProps) {
  if (!open || !atsReport) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-border shadow-xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground font-mono-tech font-display">
              <Brain className="h-5 w-5 text-primary" />
              Detailed Scoring Methodology & Reasoning
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
              Calibrated mathematical weights and evaluation backing for {atsReport.target_role_label}.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-primary text-[11px] font-mono-tech">
              Pillar Weight Distribution
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono-tech">
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Skill Alignment</span>
                <strong className="text-foreground text-sm">30% Weight</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Quantification</span>
                <strong className="text-foreground text-sm">25% Weight</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Parseability</span>
                <strong className="text-foreground text-sm">15% Weight</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Action Verbs</span>
                <strong className="text-foreground text-sm">15% Weight</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Line Budget</span>
                <strong className="text-foreground text-sm">15% Weight</strong>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] font-mono-tech">
              Evaluation Standards
            </h4>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Technical & Parseability (15%)
              </strong>
              <p className="text-muted-foreground leading-relaxed font-sans">
                Evaluates single-stream text layer extraction and standard category hierarchy. In IIT Bombay placement mode, contact headers (phone, email, github) are managed by the campus placement portal.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                <Target className="h-3.5 w-3.5 text-primary" /> Role & Skill Alignment (30%)
              </strong>
              <p className="text-muted-foreground leading-relaxed font-sans">
                Compares bullet text against comprehensive domain taxonomies ({atsReport.target_role_label}) and custom Job Descriptions using deterministic synonym mapping combined with deep AI semantic inference.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Quantification & Impact Index (25%)
              </strong>
              <p className="text-muted-foreground leading-relaxed font-sans">
                Measures the percentage of bullets containing hard metrics (%, currencies, scale, latencies) and rewards metric diversity across sections (&gt;75% benchmark).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                <Zap className="h-3.5 w-3.5 text-primary" /> Action Verbs & Voice (15%)
              </strong>
              <p className="text-muted-foreground leading-relaxed font-sans">
                Penalizes passive fillers (e.g., "helped with", "worked on") and excessive repetition of the same opening verb, prioritizing executive action verbs.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Visual Line Budget & Margins (15%)
              </strong>
              <p className="text-muted-foreground leading-relaxed font-sans">
                Uses PyMuPDF visual bounding box analysis on rendered PDF pages. Only flags genuine orphan lines that leave excessive empty margins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            size="sm"
            onClick={onClose}
            className="bg-primary text-primary-foreground font-semibold text-xs h-8 font-mono-tech rounded-xl cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
