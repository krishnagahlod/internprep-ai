"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface ATSLineHazardTabProps {
  atsReport: any;
  onFixHazard: (hazard: any) => void;
}

export function ATSLineHazardTab({ atsReport, onFixHazard }: ATSLineHazardTabProps) {
  const hazards = atsReport.pillars?.formatting_layout?.line_wrap_hazards || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1 font-mono-tech">
          Visual Geometry & Line Budget Inspector ({atsReport.pillars?.formatting_layout?.page_count || 1}-Page Resume)
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
          Uses PDF visual line bounding-box analysis to detect genuine orphan line wraps (where a point renders across multiple lines and spills only 1–3 trailing words onto the final line, leaving excessive empty margin space).
        </p>
      </div>

      {hazards.length > 0 ? (
        <div className="space-y-3">
          {hazards.map((hazard: any, i: number) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono-tech">
                  <Badge
                    variant="outline"
                    className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
                  >
                    {hazard.section} • {hazard.char_length} Chars
                  </Badge>
                  {hazard.visual_lines && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      {hazard.visual_lines} Visual Lines
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] font-mono-tech text-rose-500 font-semibold">
                  Trim ~{hazard.chars_to_trim} chars to eliminate orphan line
                </span>
              </div>

              <p className="text-xs font-mono-tech text-foreground/90 bg-muted/20 p-3 rounded-xl border border-border leading-relaxed font-sans">
                "{hazard.bullet_text}"
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground font-sans">
                  {hazard.reason}
                </span>
                <Button
                  size="sm"
                  onClick={() => onFixHazard(hazard)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono-tech font-semibold h-8 rounded-xl cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 mr-1" /> 1-Click AI Trim
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-2 shadow-xs">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-sm text-foreground font-mono-tech font-display">
            Zero Visual Orphan Hazards Detected
          </h4>
          <p className="text-xs text-muted-foreground font-sans">
            All points render with clean single lines or well-filled multi-lines across your{" "}
            {atsReport.pillars?.formatting_layout?.page_count || 1}-page placement document.
          </p>
        </div>
      )}
    </div>
  );
}
