"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Wand2, Check } from "lucide-react";
import { highlightMetrics } from "./types";

interface ResumeRefineBulletModalProps {
  refineTarget: any;
  onClose: () => void;
  refineInstruction: string;
  setRefineInstruction: (val: string) => void;
  refineHistory: Array<{
    instruction: string;
    result: string;
    explanation?: string;
  }>;
  isRefining: boolean;
  onRefineSubmit: (e: React.FormEvent) => void;
  onAcceptRefinement: () => void;
}

export function ResumeRefineBulletModal({
  refineTarget,
  onClose,
  refineInstruction,
  setRefineInstruction,
  refineHistory,
  isRefining,
  onRefineSubmit,
  onAcceptRefinement,
}: ResumeRefineBulletModalProps) {
  if (!refineTarget) return null;

  const isFinal = refineTarget.isFinalResume || false;
  const currentText =
    refineHistory.length > 0
      ? refineHistory[refineHistory.length - 1].result
      : refineTarget.text;
  const originalCharLength = refineTarget.charLength || refineTarget.text.length;

  return (
    <Dialog open={!!refineTarget} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-display">
                AI Bullet In-Place Refiner
              </DialogTitle>
              <DialogDescription className="font-mono-tech text-xs">
                Refine this bullet point with custom natural language instructions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Current Working Point */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground uppercase tracking-wider font-mono-tech">
                {refineHistory.length > 0 ? "Latest Refined Version:" : "Current Bullet Point:"}
              </span>
              <div className="flex items-center gap-2 font-mono-tech">
                {isFinal && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  >
                    Length-Locked (1-Page Fit)
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground font-mono">
                  {currentText.length} chars
                  {isFinal && ` / ~${originalCharLength} target`}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 text-[15px] font-medium leading-relaxed font-sans">
              {highlightMetrics(currentText)}
            </div>
          </div>

          {/* Refinement History Trail */}
          {refineHistory.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono-tech">
                Refinement History ({refineHistory.length}):
              </span>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {refineHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-background border border-border/60 text-xs space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-primary font-bold font-mono-tech">
                      <Wand2 className="h-3 w-3" /> "{item.instruction}"
                    </div>
                    {item.explanation && (
                      <p className="text-muted-foreground text-[11.5px] italic">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refine Instruction Input Form */}
          <form onSubmit={onRefineSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground font-mono-tech">
                Instruction for AI:
              </label>
              <Textarea
                placeholder="e.g. 'Make it more aggressive on business revenue impact', 'Shorten by 10 characters', 'Add stronger action verb'..."
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                className="min-h-[70px] resize-none text-sm font-sans"
                autoFocus
              />
            </div>

            {/* Quick Refine Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1 font-mono-tech">
              {[
                "Make it more action-oriented",
                "Emphasize technical difficulty",
                "Shorten to fit exactly 1 line",
                "Front-load quantitative metrics",
                "Make tone more executive & strategic",
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRefineInstruction(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              disabled={isRefining || !refineInstruction.trim()}
              className="w-full h-10 font-bold font-mono-tech cursor-pointer"
            >
              {isRefining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Refining Point...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Refinement
                </>
              )}
            </Button>
          </form>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between items-center pt-2 border-t font-mono-tech">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onAcceptRefinement}
            disabled={refineHistory.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Accept & Apply Refined Point
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
