"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Target,
  Brain,
  Download,
  GraduationCap,
  Briefcase,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { CommandNav, CommandHero, SegmentedTabs } from "@/components/shared";
import { PaywallModal } from "@/components/paywall-modal";
import {
  ResumeRadarChart,
  ResumeUploadZone,
  ResumeBulletHeatmap,
  ResumeProbingChat,
  BulletAnalysis,
} from "@/components/resume";

const TARGET_ROLE_OPTIONS = [
  { value: "consult", label: "Management Consulting (McKinsey, BCG, Bain, Accenture)" },
  { value: "it-software", label: "Software Engineering & Systems (Google, Microsoft, Uber)" },
  { value: "product management", label: "Product Management & Strategy (Flipkart, Swiggy, Razorpay)" },
  { value: "analytics", label: "Data Science & Analytics (WorldQuant, EXL, American Express)" },
  { value: "finance", label: "Finance / Investment Banking / Private Equity (Goldman, Morgan Stanley)" },
  { value: "core", label: "Core Engineering & Manufacturing (Tata, Schlumberger, ITC)" },
];

export default function ResumePage() {
  const router = useRouter();
  const { setResumeText, user, isGuest, guestResumeCount, incrementGuestResume } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  const [resumePhase, setResumePhase] = useState<"internship" | "placement">("internship");
  const [targetRole, setTargetRole] = useState("consult");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"heatmap" | "radar" | "chat">("heatmap");

  // Paywall Modal State
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallMeta, setPaywallMeta] = useState<{
    title?: string;
    description?: string;
    limit?: number;
    used?: number;
    resetAt?: string;
    featureKey?: string;
  }>({});

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setError("Please upload a PDF format resume.");
      toast.error("Please upload a PDF format resume.");
      return;
    }

    if (isGuest && guestResumeCount >= 2) {
      setPaywallMeta({
        title: "Guest Resume Limit Reached",
        description: "You have reviewed 2 resumes in guest mode. Sign up or log in to continue auditing unlimited resumes.",
        featureKey: "resume_audit",
      });
      setPaywallOpen(true);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("target_role", targetRole);
    formData.append("resume_phase", resumePhase);
    if (user?.id) {
      formData.append("user_id", user.id);
    } else {
      formData.append("user_id", "guest");
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/resume/analyze`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
        if (data.raw_text) {
          setResumeText(data.raw_text);
        }
        if (isGuest) {
          incrementGuestResume();
        }
        toast.success("Resume analyzed successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === "object" ? errorData.detail : {};
          setPaywallMeta({
            title: "Resume Evaluation Quota Reached",
            description: detail.message || "Upgrade to Pro for full AI resume audits and claim defense simulations.",
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at,
            featureKey: "resume_audit",
          });
          setPaywallOpen(true);
          return;
        }
        setError(errorData.detail || "Failed to analyze resume. Please try again.");
        toast.error("Failed to analyze resume.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error while communicating with analysis server.");
      toast.error("Network error while analyzing resume.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setFile(null);
    setError(null);
  };

  const currentRoleLabel =
    TARGET_ROLE_OPTIONS.find((r) => r.value === targetRole)?.label || targetRole;

  const radarScores = analysisResult?.scores || analysisResult?.radar_scores || null;
  const bulletAnalyses: BulletAnalysis[] =
    analysisResult?.bullet_analyses || analysisResult?.flagged_bullets || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
      {/* Paywall Gate */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title={paywallMeta.title}
        description={paywallMeta.description}
        limit={paywallMeta.limit}
        used={paywallMeta.used}
        resetAt={paywallMeta.resetAt}
        featureKey={paywallMeta.featureKey}
      />

      {/* Top Header */}
      <CommandNav
        backHref="/dashboard"
        backLabel="Dashboard"
        breadcrumb="RESUME INTELLIGENCE & HEATMAP"
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Command Hero */}
        <CommandHero
          variant="card"
          watermark="DIAGNOSTIC"
          badge="[IIT BOMBAY // RESUME INTELLIGENCE]"
          statusBadge={analysisResult ? `SCORE: ${analysisResult.overall_score || 85}/100` : undefined}
          statusVariant="emerald"
          title="Resume Heatmap & Probing Intelligence"
          subtitle="Pinpoint vague or inflated claims, quantify bullet impact, and simulate recruiter follow-up questions before walking into the interview room."
          actions={
            analysisResult && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetAnalysis}
                  className="font-mono-tech text-xs rounded-2xl flex items-center gap-1.5 border-border hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Audit Another Resume</span>
                </Button>
                <div className="p-1 rounded-2xl bg-card border border-border/80 shadow-xs">
                  <SegmentedTabs
                    tabs={[
                      {
                        id: "heatmap",
                        label: "Bullet Heatmap",
                        icon: ShieldAlert,
                        count: bulletAnalyses.length,
                      },
                      { id: "radar", label: "6-Axis Radar", icon: Activity },
                      { id: "chat", label: "Claim Defense", icon: Target },
                    ]}
                    activeTab={activeTab}
                    onChange={(tab) => setActiveTab(tab as any)}
                  />
                </div>
              </div>
            )
          }
        />

        {/* Upload & Track Configuration Zone (when no analysis loaded) */}
        {!analysisResult && (
          <div className="space-y-4">
            {/* Step 1: Calibration Track & Domain Selector */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Step 1: Calibrate Recruitment Track & Target Domain
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    Configure your recruitment cycle and target role benchmark so AI analyzes bullet points against Day-1 offer standards.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono-tech border-border self-start sm:self-auto bg-muted/60">
                  IIT Bombay Rubric Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Recruitment Cycle: Summer Internship vs Final Placement */}
                <div className="space-y-2">
                  <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    <span>Recruitment Cycle</span>
                    <span className="text-destructive font-mono-tech text-[10px]">*Required</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/40 border border-border">
                    <button
                      type="button"
                      onClick={() => setResumePhase("internship")}
                      disabled={isUploading}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono-tech font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        resumePhase === "internship"
                          ? "bg-background text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Summer Internship</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResumePhase("placement")}
                      disabled={isUploading}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono-tech font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        resumePhase === "placement"
                          ? "bg-background text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Final Placement</span>
                    </button>
                  </div>
                </div>

                {/* Target Role Benchmark (Domain Selection) */}
                <div className="space-y-2">
                  <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    <span>Target Role Benchmark (Domain)</span>
                    <span className="text-destructive font-mono-tech text-[10px]">*Required</span>
                  </label>
                  <div className="relative">
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      disabled={isUploading}
                      className="appearance-none w-full h-[46px] px-4 py-2 rounded-2xl border border-border bg-background text-xs font-sans text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer font-medium pr-10"
                    >
                      {TARGET_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Upload Zone */}
            <div className="space-y-2">
              <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold px-1">
                Step 2: Upload PDF Resume
              </label>
              <ResumeUploadZone
                uploading={isUploading}
                onFileSelect={handleFileSelect}
                fileName={file?.name}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono-tech">
            {error}
          </div>
        )}

        {/* Analysis Results View */}
        {analysisResult && (
          <div className="space-y-6 pt-2">
            {/* Active Calibration Banner */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-tech">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground uppercase">Calibrated Benchmark:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  {resumePhase === "internship" ? "SUMMER INTERNSHIP" : "FINAL PLACEMENT"}
                </span>
                <span className="text-foreground font-semibold">
                  {currentRoleLabel}
                </span>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {bulletAnalyses.length} bullets audited
              </span>
            </div>

            {/* TAB 1: BULLET HEATMAP */}
            {activeTab === "heatmap" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-display">
                      Identified Bullet Risk Profile
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      Color-coded risk analysis highlighting potential interviewer traps.
                    </p>
                  </div>
                </div>

                <ResumeBulletHeatmap bullets={bulletAnalyses} />
              </div>
            )}

            {/* TAB 2: 6-AXIS RADAR */}
            {activeTab === "radar" && (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-foreground font-display">
                    Multi-Dimensional Competency Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    Quantification, STAR format compliance, and action verb strength benchmarks.
                  </p>
                </div>

                <ResumeRadarChart scores={radarScores} size={240} />
              </div>
            )}

            {/* TAB 3: PROBING CHAT */}
            {activeTab === "chat" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <ResumeProbingChat resumeId={analysisResult.id} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
