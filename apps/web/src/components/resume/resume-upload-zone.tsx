"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResumeUploadZoneProps {
  uploading: boolean;
  onFileSelect: (file: File) => void;
  fileName?: string | null;
}

export function ResumeUploadZone({
  uploading,
  onFileSelect,
  fileName,
}: ResumeUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasConsent, setHasConsent] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasConsent) {
      toast.error("Affirmative consent required", {
        description: "Please check the DPDPA 2023 processing consent box before submitting your resume.",
      });
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const handleTriggerBrowse = (e: React.MouseEvent) => {
    if (!hasConsent) {
      toast.error("Affirmative consent required", {
        description: "Please check the DPDPA 2023 processing consent box before submitting your resume.",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative rounded-3xl border-2 border-dashed transition-all p-8 sm:p-12 text-center ${
        hasConsent 
          ? "border-border/80 hover:border-emerald-500/50 bg-card/40 cursor-pointer" 
          : "border-border/60 bg-muted/20 cursor-default"
      } group`}
      onClick={handleTriggerBrowse}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center transition-transform shadow-sm ${
          hasConsent 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105" 
            : "bg-muted border-border text-muted-foreground"
        }`}>
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <UploadCloud className="h-7 w-7" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground font-display">
            {uploading
              ? "Parsing Resume Content & Generating Heatmap..."
              : fileName
              ? `Selected: ${fileName}`
              : "Upload Resume PDF for AI Evaluation"}
          </h3>
          <p className="text-xs text-muted-foreground font-sans max-w-md mx-auto leading-relaxed">
            Drag & drop your 1-page IIT Bombay format PDF here, or click to browse. Max 5MB.
          </p>
        </div>

        <Button
          size="sm"
          disabled={uploading}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerBrowse(e);
          }}
          className={`mt-2 font-mono-tech text-xs font-semibold rounded-xl shadow-xs transition-all ${
            hasConsent
              ? "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950"
              : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
          }`}
        >
          {uploading ? "Analyzing..." : "Browse Files"}
        </Button>

        {/* Affirmative Opt-In Checkbox (DPDPA 2023 Section 6) */}
        <div
          className="pt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono-tech max-w-md mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            id="resume-consent-check"
            type="checkbox"
            checked={hasConsent}
            onChange={(e) => setHasConsent(e.target.checked)}
            className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer shrink-0"
          />
          <label htmlFor="resume-consent-check" className="cursor-pointer text-left leading-tight">
            I consent to automated processing of my resume content for interview calibration and ATS scoring under DPDPA 2023. Zero public model training.
          </label>
        </div>
      </div>
    </div>
  );
}
