"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, X, Sparkles, Target, ChevronRight } from "lucide-react";

interface PlacementComparisonModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  comparisonData: any;
  onSelectCompany: (slug: string) => void;
  formatINRAmount: (amount: number) => string;
}

export function PlacementComparisonModal({
  open,
  onClose,
  loading,
  comparisonData,
  onSelectCompany,
  formatINRAmount,
}: PlacementComparisonModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-purple-500/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary/20 text-primary">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground font-display">
                Side-by-Side Company Comparison Studio
              </h2>
              <p className="text-xs text-muted-foreground">
                Comprehensive compensation benchmarks, hiring difficulty, and selection hurdles comparison.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 custom-scrollbar">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
              <p className="text-xs text-muted-foreground font-mono-tech">
                Generating side-by-side comparison matrix...
              </p>
            </div>
          ) : comparisonData?.companies_compared ? (
            <div className="space-y-6">
              {comparisonData.shared_skills && comparisonData.shared_skills.length > 0 && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
                    <Sparkles className="h-4 w-4" /> Common In-Demand Skills Across Selected Companies:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {comparisonData.shared_skills.map((sk: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs bg-primary/15 text-primary border-primary/30 font-mono-tech"
                      >
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {comparisonData.companies_compared.map((comp: any) => (
                  <div
                    key={comp.slug}
                    className="rounded-3xl border border-border/70 bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-extrabold text-lg text-foreground font-display">
                            {comp.name}
                          </h3>
                          <span className="text-xs text-muted-foreground font-medium">
                            {comp.primary_sector}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold font-mono-tech">
                          {comp.tier_category || "Standard"}
                        </Badge>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5 font-mono-tech">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Highest CTC</span>
                          <span className="font-extrabold text-foreground text-sm">
                            {formatINRAmount(comp.highest_ctc_inr)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Fixed Base Component</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {comp.highest_inhand_inr >= 100000
                              ? formatINRAmount(comp.highest_inhand_inr)
                              : "Standard"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] pt-1 border-t border-border/40">
                          <span className="text-muted-foreground">Hiring Difficulty</span>
                          <span className="font-bold text-amber-500 flex items-center gap-1">
                            <Target className="h-3 w-3" /> {comp.difficulty_score}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block font-mono-tech">
                          Primary Selection Hurdle:
                        </span>
                        <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 leading-relaxed">
                          {comp.selection_hurdle}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block font-mono-tech">
                          Top Core Competencies:
                        </span>
                        <div className="flex flex-wrap gap-1 font-mono-tech">
                          {comp.top_skills?.slice(0, 5).map((sk: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-foreground"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t border-border/40 font-mono-tech">
                        <div>
                          <strong>Locations:</strong> {comp.locations?.join(", ")}
                        </div>
                        <div>
                          <strong>Roles ({comp.roles_count}):</strong> {comp.available_roles?.join(", ")}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onSelectCompany(comp.slug);
                      }}
                      className="w-full h-9 text-xs font-semibold mt-3 font-mono-tech cursor-pointer"
                    >
                      View Full Dossier <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
