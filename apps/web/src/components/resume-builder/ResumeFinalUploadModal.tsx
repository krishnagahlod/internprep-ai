"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { DOMAIN_OPTIONS } from "./types";

interface ResumeFinalUploadModalProps {
  open: boolean;
  onClose: () => void;
  uploadMode: "pdf" | "text";
  setUploadMode: (mode: "pdf" | "text") => void;
  file: File | null;
  setFile: (f: File | null) => void;
  text: string;
  setText: (t: string) => void;
  role: string;
  setRole: (r: string) => void;
  isExtracting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResumeFinalUploadModal({
  open,
  onClose,
  uploadMode,
  setUploadMode,
  file,
  setFile,
  text,
  setText,
  role,
  setRole,
  isExtracting,
  onSubmit,
}: ResumeFinalUploadModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold font-display">
                  Upload Finalized Domain Resume
                </DialogTitle>
                <DialogDescription className="font-mono-tech text-xs">
                  Import your approved 1-page domain resume to extract verified bullet points into the Point Bank.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Target Role Selector */}
            <div className="space-y-1.5 font-mono-tech">
              <Label htmlFor="upload-role">Select Target Domain Role</Label>
              <select
                id="upload-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl bg-card border border-border text-foreground outline-none focus:border-primary cursor-pointer"
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-muted/50 p-1 rounded-xl font-mono-tech text-xs">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  uploadMode === "pdf"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setUploadMode("pdf")}
              >
                PDF Resume Upload
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  uploadMode === "text"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setUploadMode("text")}
              >
                Raw Text / LaTeX
              </button>
            </div>

            {uploadMode === "pdf" ? (
              <div className="relative group/input">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`flex items-center justify-between border-2 border-dashed rounded-2xl p-5 transition-colors ${
                    file
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border group-hover/input:border-emerald-500/50 group-hover/input:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText
                      className={`h-6 w-6 shrink-0 ${
                        file ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium truncate text-foreground font-mono-tech">
                      {file ? file.name : "Click or drag your 1-page PDF resume here"}
                    </span>
                  </div>
                  {file && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 font-mono-tech">
                <Label htmlFor="final-text">Paste Resume Text or LaTeX Source</Label>
                <Textarea
                  id="final-text"
                  placeholder="Paste raw resume bullet points or Overleaf LaTeX source..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[140px] resize-none text-xs font-mono-tech"
                />
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
              type="submit"
              disabled={isExtracting || (uploadMode === "pdf" ? !file : !text.trim())}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Extracting Points...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Import to Point Bank
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
