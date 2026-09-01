"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface ATSRawStreamTabProps {
  atsReport: any;
  copiedBullet: string | null;
  onCopyText: (text: string, id: string) => void;
}

export function ATSRawStreamTab({
  atsReport,
  copiedBullet,
  onCopyText,
}: ATSRawStreamTabProps) {
  const rawText =
    atsReport.pillars?.parseability?.raw_text_preview || "No raw text stream available.";

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between text-xs text-muted-foreground font-mono-tech shadow-xs">
        <span>Plain Text Stream parsed by automated ATS scrapers (Workday, Greenhouse, Portal Bots)</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopyText(rawText, "raw")}
          className="h-7 text-xs font-mono-tech text-primary hover:bg-primary/10 rounded-xl cursor-pointer"
        >
          {copiedBullet === "raw" ? (
            <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1" />
          )}
          {copiedBullet === "raw" ? "Copied!" : "Copy Text"}
        </Button>
      </div>
      <div className="p-4 rounded-2xl bg-muted/20 border border-border text-foreground font-mono-tech text-xs leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
        <pre className="whitespace-pre-wrap">{rawText}</pre>
      </div>
    </div>
  );
}
