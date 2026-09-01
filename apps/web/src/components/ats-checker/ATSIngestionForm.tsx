"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Search,
  GraduationCap,
  Building2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { SUB_TRACKS_BY_ROLE } from "./types";

interface ATSIngestionFormProps {
  atsMode: "iitb_placement" | "global_ats";
  setAtsMode: (mode: "iitb_placement" | "global_ats") => void;
  targetRole: string;
  onRoleChange: (role: string) => void;
  subTrack: string;
  setSubTrack: (st: string) => void;
  showJDInput: boolean;
  setShowJDInput: (show: boolean) => void;
  customJD: string;
  setCustomJD: (jd: string) => void;
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isScanning: boolean;
  scanProgress: number;
  error: string | null;
  onRunATS: () => void;
}

export function ATSIngestionForm({
  atsMode,
  setAtsMode,
  targetRole,
  onRoleChange,
  subTrack,
  setSubTrack,
  showJDInput,
  setShowJDInput,
  customJD,
  setCustomJD,
  file,
  onFileChange,
  isScanning,
  scanProgress,
  error,
  onRunATS,
}: ATSIngestionFormProps) {
  return (
    <div className="rounded-3xl p-6 md:p-8 border border-border bg-card shadow-xs space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 font-mono-tech">
          Evaluation Benchmark Standard
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              atsMode === "iitb_placement"
                ? "bg-primary/10 border-primary text-foreground shadow-2xs ring-1 ring-primary/30"
                : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            onClick={() => setAtsMode("iitb_placement")}
            disabled={isScanning}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider font-mono-tech">
              <GraduationCap className="h-4 w-4 text-primary" />
              IIT Bombay Placement Standard
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-sans">
              1-Page & 2-Page line budget, CPI & AP grade format, overview lines, Day-1 shortlisting rules.
            </p>
          </button>
          <button
            type="button"
            className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              atsMode === "global_ats"
                ? "bg-primary/10 border-primary text-foreground shadow-2xs ring-1 ring-primary/30"
                : "bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            onClick={() => setAtsMode("global_ats")}
            disabled={isScanning}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider font-mono-tech">
              <Building2 className="h-4 w-4 text-primary" />
              Enterprise ATS (Workday / Greenhouse)
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-sans">
              Single-stream OCR parseability, exact skill taxonomy matching, power verbs & custom JD alignment.
            </p>
          </button>
        </div>
      </div>

      {/* Target Role & Sub-Track Dual Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 font-mono-tech">
            Target Role Domain
          </label>
          <div className="relative">
            <select
              className="appearance-none flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold shadow-2xs hover:border-primary/40 focus:border-primary outline-none transition-all cursor-pointer text-foreground font-mono-tech"
              value={targetRole}
              onChange={(e) => onRoleChange(e.target.value)}
              disabled={isScanning}
            >
              <option value="software">Software Engineering / IT (Google, Microsoft, Uber)</option>
              <option value="consulting">Management Consulting (McKinsey, BCG, Bain)</option>
              <option value="product_management">Product Management (Flipkart, Swiggy, Uber)</option>
              <option value="finance">Finance & Quant (Goldman Sachs, Citadel, MS)</option>
              <option value="analytics">Data Science & Analytics (Fractal, Tiger, EXL)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
              <ChevronDown className="h-4 w-4 opacity-60" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 font-mono-tech">
            Specialized Sub-Track
          </label>
          <div className="relative">
            <select
              className="appearance-none flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold shadow-2xs hover:border-primary/40 focus:border-primary outline-none transition-all cursor-pointer text-foreground font-mono-tech"
              value={subTrack}
              onChange={(e) => setSubTrack(e.target.value)}
              disabled={isScanning}
            >
              {(SUB_TRACKS_BY_ROLE[targetRole] || []).map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
              <ChevronDown className="h-4 w-4 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Optional Custom JD Matcher Drawer */}
      <div className="rounded-2xl border border-border p-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono-tech">
              Target Company Job Description (Optional)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowJDInput(!showJDInput)}
            className="text-xs text-primary hover:bg-primary/10 h-7 font-mono-tech cursor-pointer"
          >
            {showJDInput ? "Hide JD Box" : "+ Match Custom JD"}
          </Button>
        </div>
        {showJDInput && (
          <div className="mt-3 space-y-2 animate-in fade-in duration-200">
            <p className="text-[11px] text-muted-foreground">
              Paste the target job description to calculate exact core vs preferred skill match percentage and uncover missing critical qualifications.
            </p>
            <textarea
              className="w-full h-28 p-3 rounded-xl border border-border bg-background text-xs shadow-2xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar font-mono-tech"
              placeholder="Paste Job Description responsibilities and requirements here..."
              value={customJD}
              onChange={(e) => setCustomJD(e.target.value)}
              disabled={isScanning}
            />
          </div>
        )}
      </div>

      {/* 100% PDF-First Resume Dropzone */}
      <div className="pt-2 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-tech">
            Upload Resume PDF
          </span>
          <span className="text-[11px] font-mono-tech text-primary flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> PyMuPDF Geometry & Font Inspector
          </span>
        </div>

        <div className="relative border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl p-8 text-center transition-all bg-primary/5 cursor-pointer">
          <UploadCloud className="h-9 w-9 text-primary mx-auto mb-2.5 animate-pulse" />
          <p className="font-semibold text-foreground text-sm mb-1 font-mono-tech">
            Click or drag & drop your Resume PDF
          </p>
          <p className="text-xs text-muted-foreground">
            Supports LaTeX & Word-generated PDFs (1-Page & 2-Page Master Resumes)
          </p>
          <input
            type="file"
            accept="application/pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFileChange}
            disabled={isScanning}
          />
          {file && (
            <div className="mt-4 px-4 py-1.5 bg-background rounded-full inline-flex items-center gap-2 text-xs font-mono-tech border border-border shadow-2xs text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Scan Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono-tech text-muted-foreground">
            <span>
              Evaluating 5 Pillars & Semantic Intelligence for {targetRole.toUpperCase()}...
            </span>
            <span>{Math.floor(scanProgress)}%</span>
          </div>
          <Progress value={scanProgress} className="h-2 bg-muted" />
        </div>
      )}

      <Button
        className="w-full h-11 text-xs font-bold font-mono-tech bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all rounded-xl cursor-pointer"
        onClick={onRunATS}
        disabled={!file || isScanning}
      >
        {isScanning
          ? "Running Neural Parser & Placement Auditor..."
          : "Execute Comprehensive ATS Evaluation"}
      </Button>

      <div className="p-3 bg-muted/20 border border-border rounded-xl text-center">
        <p className="text-[11px] font-medium text-muted-foreground font-mono-tech">
          <ShieldCheck className="inline-block w-3.5 h-3.5 mr-1.5 text-primary mb-0.5" />
          Privacy First: Your document is processed strictly in-memory and is never permanently stored or shared.
        </p>
      </div>
    </div>
  );
}
