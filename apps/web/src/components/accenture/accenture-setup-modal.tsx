"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Layers,
  Brain,
  ShieldAlert,
  Users,
  Timer,
  ArrowRight,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileText,
  Lock,
  LogIn,
  AlertCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { AccenturePracticeMode } from "./types";

interface AccentureSetupModalProps {
  open: boolean;
  onClose: () => void;
  selectedMode: AccenturePracticeMode;
  setSelectedMode: (mode: AccenturePracticeMode) => void;
  onStartSession: () => void;
  isInitializing: boolean;
}

const MODES: Array<{
  id: AccenturePracticeMode;
  title: string;
  duration: string;
  badge: string;
  icon: any;
  description: string;
  topics: string[];
}> = [
  {
    id: "full_simulation",
    title: "Full 25-Min Simulation",
    duration: "25 Mins",
    badge: "RECOMMENDED",
    icon: Layers,
    description:
      "End-to-end Accenture trajectory: Intro, Resume deep dive, Consulting Case, GenAI strategy, and Fit.",
    topics: ["Resume Metric Probing", "Consulting Case", "GenAI Client ROI", "Behavioral Fit"],
  },
  {
    id: "case_ai_drill",
    title: "Case & GenAI Strategy Drill",
    duration: "15 Mins",
    badge: "FOCUSED DRILL",
    icon: Brain,
    description:
      "MECE problem solving, retail/EV market sizing, and translating GenAI tech into client ROI.",
    topics: ["Retail/EV Sizing", "RAG vs Fine-tuning", "Executive Synthesis"],
  },
  {
    id: "resume_defense_drill",
    title: "Resume Claim Defense Drill",
    duration: "10 Mins",
    badge: "STRESS PROBING",
    icon: ShieldAlert,
    description:
      "Direct probing on project metric baselines, architecture choices, and academic domain pushback.",
    topics: ["Baseline Verification", "Tradeoff Defense", "Domain Pushback"],
  },
  {
    id: "behavioral_fit_drill",
    title: "Behavioral & Accenture Fit Drill",
    duration: "10 Mins",
    badge: "CULTURE FIT",
    icon: Users,
    description:
      "STAR-method drill on 'Why Consulting', 'Why Accenture', team conflict, and navigating ambiguity.",
    topics: ["Why Consulting & IIT", "Why Accenture", "Handling Ambiguity"],
  },
];

export function AccentureSetupModal({
  open,
  onClose,
  selectedMode,
  setSelectedMode,
  onStartSession,
  isInitializing,
}: AccentureSetupModalProps) {
  const router = useRouter();
  const { user, isGuest, resumeText, setResumeText, setResumePdfUrl } = useAuthStore();
  const supabase = createClient();

  const [resumes, setResumes] = useState<Array<{ id: string; file_name: string; raw_text?: string; file_url?: string }>>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [activeFileName, setActiveFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = Boolean(user && !isGuest);

  useEffect(() => {
    async function loadResumes() {
      if (user && !isGuest) {
        try {
          const { data } = await supabase
            .from("resumes")
            .select("id, file_name, raw_text, file_url, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (data && data.length > 0) {
            setResumes(data);
            setSelectedResumeId(data[0].id);
            setActiveFileName(data[0].file_name || "Primary Resume.pdf");
            if (data[0].raw_text && !resumeText) {
              setResumeText(data[0].raw_text);
            }
            if (data[0].file_url) {
              setResumePdfUrl(data[0].file_url);
            }
          }
        } catch {
          // Graceful fallback
        }
      }
    }
    if (open) {
      loadResumes();
    }
  }, [user, isGuest, open]);

  const handleResumeSelect = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    const selected = resumes.find((r) => r.id === resumeId);
    if (selected) {
      setActiveFileName(selected.file_name || "Selected Resume");
      if (selected.raw_text) {
        setResumeText(selected.raw_text);
      }
      if (selected.file_url) {
        setResumePdfUrl(selected.file_url);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a standard PDF resume file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds 5MB limit.");
      return;
    }

    setUploadingResume(true);
    setUploadError("");

    const localPdfUrl = URL.createObjectURL(file);
    setResumePdfUrl(localPdfUrl);

    const formData = new FormData();
    formData.append("file", file);
    if (user) {
      formData.append("user_id", user.id);
    } else {
      formData.append("user_id", "guest");
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/resume/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setActiveFileName(file.name);
      if (data.raw_text) {
        setResumeText(data.raw_text);
      }
      if (data.file_url) {
        setResumePdfUrl(data.file_url);
      }

      const newEntry = { id: data.id, file_name: file.name, raw_text: data.raw_text, file_url: data.file_url || localPdfUrl };
      setResumes((prev) => [newEntry, ...prev]);
      setSelectedResumeId(data.id);
    } catch {
      setUploadError("Failed to parse PDF resume layout. Please try again.");
    } finally {
      setUploadingResume(false);
    }
  };

  const hasResume = Boolean(resumeText && resumeText.trim().length > 50);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono-tech uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                ACCENTURE // STRATEGY & CONSULTING
              </span>
              <Badge variant="outline" className="text-[10px] font-mono-tech border-border bg-muted/60">
                IIT Bombay 2028 Cohort Calibration
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">
              Configure Accenture Mock Interview
            </h2>
            <p className="text-xs text-muted-foreground font-sans">
              Calibrate your live mock interview trajectory modeled on manager debriefs at premier IITs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Gate for Non-Registered / Guest Users */}
        {!isAuthenticated ? (
          <div className="py-8 px-4 text-center space-y-5">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold font-display text-foreground">
                Registered Candidate Access Only
              </h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                The Accenture Management Consulting simulation requires an authenticated account to sync your interview transcripts, attach your resume for metric probing, and generate your partner-level 6-dimension readiness report.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto font-mono-tech text-xs rounded-xl"
              >
                Return to Dashboard
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/login?redirect=/interview/accenture")}
                className="w-full sm:w-auto font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In / Create Free Account</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step 1: Mode Selection Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold">
                  Step 1: Select Practice Track
                </label>
                <span className="text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold">
                  Manager Persona Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedMode === mode.id;

                  return (
                    <div
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40 shadow-sm"
                          : "border-border bg-card/60 hover:border-emerald-500/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <h4 className="text-xs font-bold text-foreground font-display flex items-center gap-1.5">
                              {mode.title}
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            {mode.duration}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                          {mode.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1">
                        {mode.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Mandatory Resume Context */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                  <span>Step 2: Candidate Resume Context</span>
                  <span className="text-destructive font-mono-tech text-[10px]">*Required</span>
                </label>
                {hasResume && (
                  <span className="text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ready for Project Probing
                  </span>
                )}
              </div>

              {resumes.length > 1 && (
                <div className="space-y-1">
                  <select
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    value={selectedResumeId}
                    onChange={(e) => handleResumeSelect(e.target.value)}
                    disabled={uploadingResume}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.file_name || "Resume PDF"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload & Active Resume Card */}
              <div
                className={`border border-dashed rounded-2xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  hasResume
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                    : "border-border hover:border-emerald-500/40 hover:bg-muted/40"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingResume ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono-tech text-xs py-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Parsing resume layout and project metrics...</span>
                  </div>
                ) : hasResume ? (
                  <div className="flex items-center gap-3 text-left w-full justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-foreground font-mono-tech block truncate">
                          ✓ Attached: {activeFileName || "Resume Attached"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Projects, metric baselines, and academic major loaded into AI context
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 font-semibold">
                      Replace PDF ↑
                    </span>
                  </div>
                ) : (
                  <div className="py-1.5 space-y-1">
                    <UploadCloud className="h-5 w-5 text-muted-foreground mx-auto mb-0.5" />
                    <span className="text-xs font-bold text-foreground block">
                      Upload PDF Resume
                    </span>
                    <span className="text-[11px] text-muted-foreground block max-w-sm">
                      Required for the AI Manager to probe your specific project metrics and major.
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf,.pdf"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>

              {uploadError && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <span className="text-[11px] font-sans text-muted-foreground">
                {hasResume ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Ready to launch manager simulation
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠ Please attach a resume to proceed
                  </span>
                )}
              </span>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                  className="font-mono-tech text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isInitializing || !hasResume || uploadingResume}
                  onClick={onStartSession}
                  className={`font-mono-tech text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer ${
                    hasResume
                      ? "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Calibrating Manager Persona...</span>
                    </>
                  ) : hasResume ? (
                    <>
                      <span>Launch Accenture Simulation</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <span>Attach Resume to Begin</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
