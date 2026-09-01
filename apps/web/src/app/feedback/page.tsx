"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Brain,
  Target,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  CommandHero,
  SegmentedTabs,
  KpiMetricGrid,
  KpiMetricCard,
} from "@/components/shared";
import {
  FeedbackHeader,
  FeedbackScoreGrid,
  FeedbackTimelineReplay,
  FeedbackActionItems,
  FeedbackRecommendedDrills,
} from "@/components/feedback";

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "drills">("overview");

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!sessionId) {
        setError("No session ID provided.");
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/feedback/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setFeedback(data.feedback);
        } else {
          setError("Evaluating interview... Compiling Recruiter Rubric.");
          setTimeout(async () => {
            const retryResp = await fetch(`${API_URL}/feedback/${sessionId}`);
            if (retryResp.ok) {
              const data = await retryResp.json();
              setFeedback(data.feedback);
              setError(null);
            } else {
              setError("Feedback generation took longer than expected. Please review from History tab.");
            }
          }, 6000);
        }
      } catch (err) {
        setError("Failed to connect to feedback server.");
      }
    };

    fetchFeedback();
  }, [sessionId]);

  const handlePrintScorecard = () => {
    window.print();
  };

  if (error && !feedback) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm rounded-3xl border border-border bg-card p-8 shadow-xl">
          {error.includes("Evaluating") ? (
            <div className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}
          <h3 className="text-base font-bold text-foreground font-display">
            {error.includes("Evaluating") ? "Synthesizing Evaluation" : "Notice"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="font-mono-tech text-xs cursor-pointer rounded-xl mt-2"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const overallVerdict = feedback?.overall_verdict || "Evaluated";
  const candidateLevel = feedback?.candidate_level || "Consulting Candidate";
  const executiveSummary = feedback?.executive_summary || feedback?.overall_summary || "";
  const dimensionNotes = feedback?.dimension_notes || feedback?.rubric_breakdown || {};
  const fixNext = feedback?.fix_next || feedback?.key_takeaways || [];
  const timelineData = feedback?.timeline_data || feedback?.turn_evaluations || [];
  const suggestedResources = feedback?.suggested_resources || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <FeedbackHeader
        verdict={overallVerdict}
        candidateLevel={candidateLevel}
        onPrint={handlePrintScorecard}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Command Hero */}
        <CommandHero
          variant="card"
          watermark="SCORECARD"
          badge="[RECRUITER RUBRIC & PERFORMANCE DOSSIER]"
          statusBadge={overallVerdict.toUpperCase()}
          statusVariant="emerald"
          title="Interview Performance Evaluation"
          subtitle={
            executiveSummary ||
            "Dimensional evaluation against McKinsey, BCG, and Bain Case Interview rubrics with 7 fixed qualitative criteria."
          }
          actions={
            <div className="p-1 rounded-2xl bg-card border border-border/80 shadow-xs">
              <SegmentedTabs
                tabs={[
                  { id: "overview", label: "Dimensional Rubric", icon: Layers },
                  {
                    id: "timeline",
                    label: "Turn-by-Turn Replay",
                    icon: BarChart3,
                    count: timelineData.length,
                  },
                  { id: "drills", label: "Targeted Drills", icon: Target },
                ]}
                activeTab={activeTab}
                onChange={(tab) => setActiveTab(tab as any)}
              />
            </div>
          }
        />

        {/* Priority Action Items Banner */}
        <FeedbackActionItems actionItems={fixNext} />

        {/* TAB 1: DIMENSIONAL RUBRIC SCORE GRID */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground font-display">
                  7-Dimension Qualitative Evaluation
                </h3>
                <p className="text-xs text-muted-foreground font-sans">
                  Constructive feedback structured by interview competence areas.
                </p>
              </div>
            </div>

            <FeedbackScoreGrid dimensionNotes={dimensionNotes} />
          </div>
        )}

        {/* TAB 2: TURN-BY-TURN TIMELINE REPLAY */}
        {activeTab === "timeline" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground font-display">
                  Moment-by-Moment Turn Analysis
                </h3>
                <p className="text-xs text-muted-foreground font-sans">
                  Detailed transcript breakdown showing strength trajectory and coach interventions.
                </p>
              </div>
            </div>

            <FeedbackTimelineReplay timelineData={timelineData} />
          </div>
        )}

        {/* TAB 3: TARGETED DRILLS */}
        {activeTab === "drills" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <FeedbackRecommendedDrills resources={suggestedResources} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-xs font-mono-tech text-muted-foreground">CALIBRATING SCORECARD...</p>
          </div>
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
