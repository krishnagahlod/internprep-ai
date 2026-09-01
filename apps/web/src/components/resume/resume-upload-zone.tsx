"use client";

import React, { useRef } from "react";
import { UploadCloud, FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
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
      className="relative rounded-3xl border-2 border-dashed border-border/80 hover:border-emerald-500/50 bg-card/40 p-8 sm:p-12 text-center transition-all cursor-pointer group"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
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
          className="mt-2 font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs"
        >
          {uploading ? "Analyzing..." : "Browse Files"}
        </Button>
      </div>
    </div>
  );
}
