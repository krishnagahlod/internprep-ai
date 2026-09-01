"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { DOMAIN_OPTIONS, getRoleLabel } from "./types";

interface ResumeDomainPivotModalProps {
  open: boolean;
  onClose: () => void;
  sourceRole: string;
  setSourceRole: (r: string) => void;
  targetRole: string;
  setTargetRole: (r: string) => void;
  targetCompany: string;
  setTargetCompany: (c: string) => void;
  selectedSections: string[];
  setSelectedSections: React.Dispatch<React.SetStateAction<string[]>>;
  availableSections: string[];
  isConverting: boolean;
  onSubmit: () => void;
}

export function ResumeDomainPivotModal({
  open,
  onClose,
  sourceRole,
  setSourceRole,
  targetRole,
  setTargetRole,
  targetCompany,
  setTargetCompany,
  selectedSections,
  setSelectedSections,
  availableSections,
  isConverting,
  onSubmit,
}: ResumeDomainPivotModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-display">
                Cross-Domain Point Pivot Engine
              </DialogTitle>
              <DialogDescription className="font-mono-tech text-xs">
                Reframes your existing bullet points from one industry domain into another while preserving character budgets and quantitative rigor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4 font-mono-tech">
          {/* Source & Target Role Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Source Domain (From)</Label>
              <select
                value={sourceRole}
                onChange={(e) => setSourceRole(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl bg-card border border-border text-foreground outline-none focus:border-primary cursor-pointer"
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Target Domain (To)</Label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl bg-card border border-border text-foreground outline-none focus:border-primary cursor-pointer"
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Company (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="pivot-company">Target Recruiter / Company (Optional)</Label>
            <Input
              id="pivot-company"
              placeholder="e.g. McKinsey, Google, Goldman Sachs"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          {/* Section Selector */}
          {availableSections.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <Label>Select Sections to Pivot</Label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSections.length === availableSections.length) {
                      setSelectedSections([]);
                    } else {
                      setSelectedSections(availableSections);
                    }
                  }}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  {selectedSections.length === availableSections.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {availableSections.map((sec) => (
                  <label
                    key={sec}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(sec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSections((prev) => [...prev, sec]);
                        } else {
                          setSelectedSections((prev) =>
                            prev.filter((s) => s !== sec)
                          );
                        }
                      }}
                      className="rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="truncate">{sec}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between items-center pt-3 border-t font-mono-tech">
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
            onClick={onSubmit}
            disabled={isConverting || sourceRole === targetRole}
            className="font-bold cursor-pointer"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reframing Points...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Execute Domain Pivot <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
