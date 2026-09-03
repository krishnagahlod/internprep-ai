"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareHeart,
  Send,
  CheckCircle2,
  Coffee,
  Pizza,
  PartyPopper,
  Sparkles,
  Heart,
  Loader2,
  Briefcase,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface AccentureFeedbackCardProps {
  sessionId?: string;
  readinessScore?: number;
  candidateLevel?: string;
}

const REALISM_OPTIONS = [
  { id: "ultra_realistic", label: "🎯 Ultra-Realistic", desc: "Felt just like a real consulting manager round" },
  { id: "high_quality", label: "👍 High Quality", desc: "Challenging probing & MECE business case drill" },
  { id: "good_practice", label: "⚡ Good Practice", desc: "Helpful for structuring, could be slightly tougher" },
  { id: "needs_tuning", label: "🔧 Needs Tuning", desc: "Expected deeper technical / case follow-ups" },
];

const AUDIO_OPTIONS = [
  { id: "natural", label: "🎙️ Natural & Responsive", desc: "Voice made the mock feel alive and dynamic" },
  { id: "good_pacing", label: "⏱️ Good, Pacing Could Be Faster", desc: "Accurate speech with slight pause" },
  { id: "preferred_text", label: "💬 Preferred Text Mode", desc: "Liked reading prompts more than audio" },
];

const REWRITE_OPTIONS = [
  { id: "extremely_useful", label: "💡 Extremely Insightful", desc: "Showed exact baseline gaps & key levers" },
  { id: "helpful_benchmarks", label: "📈 Helpful Benchmarks", desc: "Good guidance to polish my delivery" },
  { id: "decent_summary", label: "🔍 Decent Overview", desc: "Clear assessment of overall strengths" },
];

const TREAT_OPTIONS = [
  {
    id: "chai_coffee",
    icon: Coffee,
    label: "Chai + Samosa / Cold Coffee on me!",
    desc: "Nescafe or CCD treat at campus right after shortlists!",
  },
  {
    id: "pizza_party",
    icon: Pizza,
    label: "Count on it! Full Pizza Party / Dinner!",
    desc: "Celebratory feast once the final offer letter rolls in!",
  },
  {
    id: "wing_recommendation",
    icon: PartyPopper,
    label: "Treat + Recommending to my whole wing!",
    desc: "Treat for sure, plus getting all my batchmates onto the platform!",
  },
  {
    id: "stipend_treat",
    icon: Briefcase,
    label: "First Stipend / Salary Treat locked in!",
    desc: "100% treating the creator as soon as the Accenture stipend lands!",
  },
];

export function AccentureFeedbackCard({
  sessionId,
  readinessScore,
  candidateLevel,
}: AccentureFeedbackCardProps) {
  const { user, isGuest } = useAuthStore();

  const [realismRating, setRealismRating] = useState<string>("ultra_realistic");
  const [audioRating, setAudioRating] = useState<string>("natural");
  const [rewriteRating, setRewriteRating] = useState<string>("extremely_useful");
  const [treatPledge, setTreatPledge] = useState<string>("pizza_party");
  const [customComment, setCustomComment] = useState<string>("");
  const [candidateName, setCandidateName] = useState<string>(
    user?.email?.split("@")[0] || ""
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const realismLabel = REALISM_OPTIONS.find((o) => o.id === realismRating)?.label || realismRating;
    const audioLabel = AUDIO_OPTIONS.find((o) => o.id === audioRating)?.label || audioRating;
    const rewriteLabel = REWRITE_OPTIONS.find((o) => o.id === rewriteRating)?.label || rewriteRating;
    const treatLabel = TREAT_OPTIONS.find((o) => o.id === treatPledge)?.label || treatPledge;

    const formattedMessage = [
      `[ACCENTURE INTERVIEW SIMULATION FEEDBACK]`,
      `• Candidate Readiness: ${readinessScore || "N/A"}/100 (${candidateLevel || "N/A"})`,
      `• Simulation Realism: ${realismLabel}`,
      `• Voice & Speech Experience: ${audioLabel}`,
      `• AI Rewrites & Dossier Utility: ${rewriteLabel}`,
      `• 🍕 CELEBRATORY TREAT PLEDGE: ${treatLabel}`,
      customComment.trim() ? `• Additional Suggestions: ${customComment.trim()}` : null,
      sessionId ? `• Session ID: ${sessionId}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/gratitude/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: candidateName.trim() || (isGuest ? "Anonymous IITian" : user?.email?.split("@")[0] || "Anonymous"),
          message: formattedMessage,
          user_id: isGuest ? "guest" : user?.id,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("Feedback & treat pledge recorded! Best of luck with Accenture!");
      } else {
        toast.error("Could not save feedback. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Network error while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 sm:p-8 text-center space-y-4 shadow-md animate-in fade-in zoom-in duration-300">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
          <PartyPopper className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-bold font-display text-foreground">
            Treat Pledge & Feedback Locked In! 🎉
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans max-w-lg mx-auto leading-relaxed">
            Thank you for taking the time to share your feedback. The creator will be holding you to that celebratory treat when the Accenture offer shortlist is published! Go crush your interviews!
          </p>
        </div>
        <div className="pt-2">
          <Badge
            variant="outline"
            className="text-xs font-mono-tech px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            ✓ PLEDGE LOGGED: {TREAT_OPTIONS.find((t) => t.id === treatPledge)?.label}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <span>Candidate Experience & Feedback</span>
              <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                COMMUNITY DRIVEN
              </span>
            </h3>
            <p className="text-xs text-muted-foreground font-sans">
              Help us calibrate the simulation for the batch and tell us how your practice session went.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Q1: Simulation Realism */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <span>1. How realistic was the Accenture AI Manager probing & case challenge?</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {REALISM_OPTIONS.map((opt) => {
              const isSelected = realismRating === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRealismRating(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30 text-foreground"
                      : "bg-muted/20 border-border hover:bg-muted/40 hover:border-border text-foreground"
                  }`}
                >
                  <div className="text-xs font-bold font-sans flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q2: Audio & Voice Experience */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <span>2. How was the real-time speech and conversational flow?</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {AUDIO_OPTIONS.map((opt) => {
              const isSelected = audioRating === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudioRating(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30 text-foreground"
                      : "bg-muted/20 border-border hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="text-xs font-bold font-sans flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q3: Dossier & AI Rewrites Value */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <span>3. How valuable were the question-wise rewrites and key levers?</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {REWRITE_OPTIONS.map((opt) => {
              const isSelected = rewriteRating === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRewriteRating(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30 text-foreground"
                      : "bg-muted/20 border-border hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="text-xs font-bold font-sans flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q4: The Celebratory Treat Question */}
        <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-card to-emerald-500/10 border border-amber-500/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <label className="text-xs font-mono-tech uppercase tracking-wider text-foreground font-bold">
                4. The Celebratory Offer Pledge 🍕☕
              </label>
            </div>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              If this simulation helps you crack <strong className="text-foreground">Accenture Strategy & Consulting</strong> and secure the offer, will you be treating the creator who built this platform?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {TREAT_OPTIONS.map((opt) => {
              const isSelected = treatPledge === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTreatPledge(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-foreground shadow-xs"
                      : "bg-card/80 border-border/80 hover:bg-muted/40 hover:border-border text-foreground"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-xs font-bold font-sans flex items-center justify-between">
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-tight">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q5: Additional Suggestions & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold">
              Your Name / Roll (Optional)
            </label>
            <Input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Rahul S. / 22B0900"
              className="h-10 text-xs font-sans rounded-xl bg-muted/20 border-border"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground font-bold">
              Any Specific Features or Case Types to Add? (Optional)
            </label>
            <Input
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              placeholder="e.g. More M&A cases, pricing trees, or voice speed toggles..."
              className="h-10 text-xs font-sans rounded-xl bg-muted/20 border-border"
            />
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
          <div className="text-[11px] text-muted-foreground font-mono-tech flex items-center gap-1.5 self-start sm:self-auto">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <span>Reviewed directly by the development team</span>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer h-9 px-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Recording Treat Pledge...</span>
              </>
            ) : (
              <>
                <span>Lock In Treat Pledge & Submit Feedback</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
