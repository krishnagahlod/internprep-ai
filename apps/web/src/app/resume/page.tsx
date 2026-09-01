"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
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

export default function ResumePage() {
  const router = useRouter();
  const { setResumeText, user, isGuest, guestResumeCount, incrementGuestResume } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
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
            )
          }
        />

        {/* Upload Zone */}
        <ResumeUploadZone
          uploading={isUploading}
          onFileSelect={handleFileSelect}
          fileName={file?.name}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono-tech">
            {error}
          </div>
        )}

        {/* Analysis Results View */}
        {analysisResult && (
          <div className="space-y-6 pt-2">
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
