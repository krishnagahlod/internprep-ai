"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, FileText, Check, Copy } from "lucide-react";

interface ATSBulletFixModalProps {
  bulletToFix: any;
  onClose: () => void;
  fixType: string;
  setFixType: (type: string) => void;
  missingKeywordToInject: string;
  setMissingKeywordToInject: (kw: string) => void;
  isFixingBullet: boolean;
  fixedBulletResult: any;
  copiedBullet: string | null;
  onExecuteFix: () => void;
  onCopyText: (text: string, id: string) => void;
}

export function ATSBulletFixModal({
  bulletToFix,
  onClose,
  fixType,
  setFixType,
  missingKeywordToInject,
  setMissingKeywordToInject,
  isFixingBullet,
  fixedBulletResult,
  copiedBullet,
  onExecuteFix,
  onCopyText,
}: ATSBulletFixModalProps) {
  if (!bulletToFix) return null;

  const originalBulletText =
    bulletToFix.bullet_text || bulletToFix.original_bullet || "";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-foreground font-mono-tech font-display">
            <Sparkles className="h-4 w-4 text-primary" />
            Context-Aware AI Bullet Optimizer
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono-tech">
              Original Bullet
            </span>
            <p className="text-xs font-mono-tech p-3 rounded-2xl bg-muted/20 text-foreground border border-border mt-1 leading-relaxed font-sans">
              "{originalBulletText}"
            </p>
            <span className="text-[10px] text-muted-foreground block mt-1 font-mono-tech">
              Length: {originalBulletText.length} characters
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block font-mono-tech">
              Optimization Goal
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tech">
              <button
                onClick={() => setFixType("power_verb")}
                className={`p-2.5 rounded-2xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  fixType === "power_verb"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                    : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Action Verb Upgrade
              </button>
              <button
                onClick={() => setFixType("quantify")}
                className={`p-2.5 rounded-2xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  fixType === "quantify"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                    : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Metric Brackets
              </button>
              <button
                onClick={() => setFixType("inject_keyword")}
                className={`p-2.5 rounded-2xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  fixType === "inject_keyword"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                    : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Inject Keyword
              </button>
              <button
                onClick={() => setFixType("trim_line_wrap")}
                className={`p-2.5 rounded-2xl text-xs font-medium border text-left transition-all cursor-pointer ${
                  fixType === "trim_line_wrap"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                    : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Line-Wrap Trim
              </button>
            </div>
          </div>

          {fixType === "inject_keyword" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 font-mono-tech">
                Keyword to Weave In
              </label>
              <input
                type="text"
                className="w-full p-2.5 rounded-2xl border border-border bg-background text-xs font-mono-tech text-foreground outline-none focus:border-primary"
                placeholder="e.g. System Design, Market Sizing, PyTorch..."
                value={missingKeywordToInject}
                onChange={(e) => setMissingKeywordToInject(e.target.value)}
              />
            </div>
          )}

          {/* 3 Strategic Options Display */}
          {fixedBulletResult && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-mono-tech">
                <Sparkles className="h-3.5 w-3.5" /> 3 AI Strategic Rewrite Options
              </span>

              {fixedBulletResult.options?.map((opt: any, optIdx: number) => (
                <div
                  key={optIdx}
                  className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2 hover:border-primary/40 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                        {opt.title}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-sans">
                        {opt.focus}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {opt.length} chars
                    </span>
                  </div>

                  <p className="text-xs font-mono-tech font-medium text-foreground leading-relaxed bg-background p-3 rounded-xl border border-border font-sans">
                    {opt.text}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 font-mono-tech">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onCopyText(
                          opt.latex_item || `\\item ${opt.text}`,
                          `latex-${optIdx}`
                        )
                      }
                      className="h-7 text-[11px] text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                    >
                      {copiedBullet === `latex-${optIdx}` ? (
                        <Check className="h-3 w-3 mr-1 text-emerald-500" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1" />
                      )}
                      {copiedBullet === `latex-${optIdx}`
                        ? "Copied LaTeX!"
                        : "Copy as LaTeX \\item"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopyText(opt.text, `opt-${optIdx}`)}
                      className="h-7 text-xs border-border hover:bg-muted font-semibold rounded-xl cursor-pointer"
                    >
                      {copiedBullet === `opt-${optIdx}` ? (
                        <Check className="h-3 w-3 mr-1 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedBullet === `opt-${optIdx}`
                        ? "Copied Plain Text!"
                        : "Copy Text"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border font-mono-tech">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold rounded-xl cursor-pointer"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={onExecuteFix}
            disabled={isFixingBullet}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer"
          >
            {isFixingBullet
              ? "Generating 3 AI Options..."
              : fixedBulletResult
              ? "Regenerate Options"
              : "Generate 3 AI Options"}
          </Button>
        </div>
      </div>
    </div>
  );
}
