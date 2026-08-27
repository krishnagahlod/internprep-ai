"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, AlertTriangle, Home, Zap, ExternalLink, Download, 
  ArrowLeft, Brain, Target, MessageSquare, Award, Clock, ArrowRight,
  TrendingUp, Sparkles, Check, AlertCircle, HelpCircle, Layers, ShieldCheck,
  ChevronDown, ChevronUp, BarChart3, BookOpen, Quote
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { FeedbackButton } from "@/components/creator-badge"

function FeedbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [feedback, setFeedback] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "diagnostics" | "drills">("overview")
  const [expandedTimelineTurns, setExpandedTimelineTurns] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!sessionId) {
        setError("No session ID provided.")
        return
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(`${API_URL}/feedback/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setFeedback(data.feedback)
        } else {
          setError("Evaluating interview... Compiling Recruiter Rubric.")
          setTimeout(async () => {
            const retryResp = await fetch(`${API_URL}/feedback/${sessionId}`)
            if (retryResp.ok) {
              const data = await retryResp.json()
              setFeedback(data.feedback)
              setError(null)
            } else {
              setError("Feedback generation took longer than expected. Please review from History tab.")
            }
          }, 6000)
        }
      } catch (err) {
        setError("Failed to connect to feedback server.")
      }
    }

    fetchFeedback()
  }, [sessionId])

  const toggleTimelineTurn = (turnId: number) => {
    setExpandedTimelineTurns(prev => ({ ...prev, [turnId]: !prev[turnId] }))
  }

  const handlePrintScorecard = () => {
    window.print()
  }

  const getVerdictStyle = (verdict: string = "") => {
    const v = verdict.toLowerCase()
    if (v.includes("strong hire") || v.includes("partner track")) {
      return {
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        scoreColor: "text-emerald-600 dark:text-emerald-400",
        barColor: "bg-emerald-500"
      }
    }
    if (v.includes("hire")) {
      return {
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        scoreColor: "text-blue-600 dark:text-blue-400",
        barColor: "bg-blue-500"
      }
    }
    if (v.includes("borderline") || v.includes("split")) {
      return {
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        scoreColor: "text-amber-600 dark:text-amber-400",
        barColor: "bg-amber-500"
      }
    }
    return {
      badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      scoreColor: "text-red-600 dark:text-red-400",
      barColor: "bg-red-500"
    }
  }

  const getTurnStatusBadge = (status: string = "") => {
    switch (status.toLowerCase()) {
      case "strong":
        return {
          label: "STRONG EXECUTION",
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2
        }
      case "acceptable":
        return {
          label: "ACCEPTABLE / BASELINE",
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: Check
        }
      case "missed":
        return {
          label: "MISSED OPPORTUNITY",
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: AlertTriangle
        }
      default:
        return {
          label: "CRITICAL GAP / ERROR",
          className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
          icon: AlertCircle
        }
    }
  }

  if (error && !feedback) {
     return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
            {error.includes("Evaluating") ? (
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-destructive" />
            )}
            <p className="text-xs font-mono-tech text-muted-foreground">{error}</p>
            {!error.includes("Evaluating") && (
              <Button size="sm" onClick={() => router.push("/dashboard")} className="mt-2 text-xs font-mono-tech">
                Return to Dashboard
              </Button>
            )}
          </div>
        </div>
      )
  }

  if (!feedback) return (
    <div className="flex h-screen items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p>SYNTHESIZING RECRUITER RUBRIC & BEHAVIORAL DIAGNOSTICS...</p>
      </div>
    </div>
  )

  const verdictStyle = getVerdictStyle(feedback.final_verdict)
  const readinessScore = feedback.strategic_advice?.day1_readiness_score || Math.round((feedback.overall_score || 3.5) * 20)

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors">
      
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs font-mono-tech">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Dashboard
            </Button>
            <span className="text-border">/</span>
            <span className="text-xs font-mono-tech text-muted-foreground">INTERVIEW EVALUATION & RUBRIC</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrintScorecard} 
              className="text-xs font-mono-tech h-8 border-border"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export PDF Scorecard
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-6 max-w-5xl relative z-10 space-y-8">
        
        {/* Title Header */}
        <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [DEBRIEF COMPLETE]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">TIER-1 RECRUITER BENCHMARK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Candidate Performance Evaluation
            </h1>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border text-xs font-mono-tech">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "overview" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              Executive Overview
            </button>
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "diagnostics" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              Style & Depth Audit
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "timeline" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              Turn-by-Turn Timeline
            </button>
            <button
              onClick={() => setActiveTab("drills")}
              className={`px-3 py-1.5 rounded-md transition-all ${activeTab === "drills" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              Actionable Drills
            </button>
          </div>
        </div>

        {/* Master Score & Placement Calibration Cards */}
        <div className="grid md:grid-cols-12 gap-5">
          
          {/* Aggregate Score Card */}
          <div className="md:col-span-4 rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-xs space-y-4">
            <div className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground">
              Aggregate Performance Score
            </div>
            
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-muted flex flex-col items-center justify-center bg-background shadow-xs">
                <div className={`text-4xl font-extrabold font-mono-tech ${verdictStyle.scoreColor}`}>
                  {feedback.overall_score ? feedback.overall_score.toFixed(1) : "3.5"}
                </div>
                <div className="text-[10px] font-mono-tech text-muted-foreground mt-0.5">OUT OF 5.0</div>
              </div>
            </div>
            
            <div className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-mono-tech font-bold ${verdictStyle.badge}`}>
              <Zap className="h-3.5 w-3.5 mr-1.5" /> {feedback.final_verdict || "Borderline / Split Decision"}
            </div>

            <div className="w-full pt-3 border-t border-border flex justify-between text-[11px] font-mono-tech text-muted-foreground">
              <span>DAY 1 CALIBRATION</span>
              <span className="font-bold text-foreground">{readinessScore}% READY</span>
            </div>
          </div>
          
          {/* Executive Assessment & Quick Stats */}
          <div className="md:col-span-8 rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-5 shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Partner Executive Synthesis
                </h3>
                <span className="text-[10px] font-mono-tech text-muted-foreground">
                  TARGET: TIER-1 PLACEMENT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed">
                {feedback.executive_summary || "The candidate demonstrated solid fundamental understanding of the core problem statement and established good rapport. However, structured top-down delivery (BLUF) and proactive hypothesis testing will be critical to secure Day 1 shortlists."}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-xs font-mono-tech">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="text-[10px] text-muted-foreground">RECOMMENDED NEXT TRACK</div>
                <div className="font-bold text-foreground truncate">
                  {feedback.strategic_advice?.recommended_next_case_type || "Profitability & Operations"}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="text-[10px] text-muted-foreground">ESTIMATED PRACTICE</div>
                <div className="font-bold text-foreground">
                  {feedback.strategic_advice?.estimated_hours_remaining || 6} Hours
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <div className="text-[10px] text-muted-foreground">HESITATION / FILLERS</div>
                <div className="font-bold text-foreground">
                  {feedback.communication_style_analysis?.filler_and_hesitation_rating || "Moderate"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Executive Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* Top Strengths & Growth Areas Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Strengths */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-mono-tech font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Top Strengths (Citing Turns)
                  </span>
                  <span className="text-[10px] font-mono-tech text-muted-foreground">Placement Validated</span>
                </div>
                <ul className="space-y-3 text-xs">
                  {(feedback.strengths || ["Demonstrated initial framework clarity", "Solid clarifying questions"]).map((s: string, i: number) => (
                    <li key={i} className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-foreground leading-relaxed font-sans space-y-1">
                      <div className="font-mono-tech text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        STRENGTH 0{i + 1}
                      </div>
                      <p>{s}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-mono-tech font-bold text-xs uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Priority Growth Areas
                  </span>
                  <span className="text-[10px] font-mono-tech text-muted-foreground">Action Required</span>
                </div>
                <ul className="space-y-3 text-xs">
                  {(feedback.improvements || ["Improve precision in business vocabulary", "Proactively suggest analytical metrics"]).map((s: string, i: number) => (
                    <li key={i} className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-foreground leading-relaxed font-sans space-y-1">
                      <div className="font-mono-tech text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                        REMEDIATION 0{i + 1}
                      </div>
                      <p>{s}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 7-Dimension Rubric Scoring */}
            {feedback.dimensions && feedback.dimensions.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    7-Dimension Recruiter Competency Matrix
                  </h3>
                  <span className="text-[10px] font-mono-tech text-muted-foreground">
                    1.0 – 5.0 CALIBRATION SCALE
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {feedback.dimensions.map((dim: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono-tech">
                          <span className="font-bold text-foreground">{dim.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{dim.score?.toFixed(1)} / 5.0</span>
                            {dim.level && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-background border border-border text-muted-foreground font-semibold">
                                {dim.level}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                          {dim.comment}
                        </p>
                      </div>

                      {dim.key_takeaway && (
                        <div className="p-2.5 rounded-lg bg-background border border-border/80 text-[11px] font-mono-tech text-foreground/90 space-y-1">
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center gap-1">
                            <Zap className="h-3 w-3" /> KEY RULE OF THUMB:
                          </div>
                          <p className="font-sans text-xs text-muted-foreground">{dim.key_takeaway}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Style & Depth Audit */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Communication & Delivery Audit */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Verbatim Style & Delivery Diagnostics
                </h3>
                <span className="text-[10px] font-mono-tech text-muted-foreground">Tone & Structure Audit</span>
              </div>

              <div className="grid md:grid-cols-2 gap-5 text-xs">
                {/* Structure & Delivery */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> Top-Down (BLUF) Structuring
                  </div>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {feedback.communication_style_analysis?.structure_and_delivery || "Candidate frequently used conversational prose rather than structured top-down bulleting. State your overarching recommendation in the first 10 seconds before detailing supporting pillars."}
                  </p>
                </div>

                {/* Language Precision & Slang */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground flex items-center gap-1.5">
                    <Quote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Language Precision & Jargon
                  </div>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {feedback.communication_style_analysis?.language_precision || "Imprecise vocabulary noted in later turns. Replace conversational descriptions (e.g. 'family incom people') with precise corporate terminology ('median household disposable income', 'RevPAR', 'EBITDA margin')."}
                  </p>
                </div>

                {/* Tone & Presence */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Poise Under Partner Pushbacks
                  </div>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {feedback.communication_style_analysis?.tone_and_presence || "Maintained professional composure. When pushed on mathematical assumptions, aim to defend the initial hypothesis with data before conceding revisions."}
                  </p>
                </div>

                {/* Hesitation Index */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Cadence & Filler Frequency
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded bg-background border border-border font-mono-tech text-xs font-bold text-foreground">
                      {feedback.communication_style_analysis?.filler_and_hesitation_rating || "Moderate"} Hesitation Level
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Depth & Rigor Audit */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-primary" />
                  Analytical Depth & Mathematical Correctness
                </h3>
                <span className="text-[10px] font-mono-tech text-muted-foreground">Correctness & Rigor</span>
              </div>

              <div className="grid md:grid-cols-3 gap-5 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground">Framework Customization</div>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {feedback.depth_and_rigor_audit?.framework_depth_and_tailoring || "Framework showed understanding of the business model but missed operational capacity and regulatory cost drivers."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground">Quantitative Precision</div>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {feedback.depth_and_rigor_audit?.quantitative_math_accuracy || "Mental math was directional but lacked proactive sanity checks against total market capacity."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-mono-tech font-bold text-foreground">2nd-Order Depth & Risks</div>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    {feedback.depth_and_rigor_audit?.edge_case_and_2nd_order_depth || "Did not proactively evaluate cannibalization risks or competitor counter-reactions."}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Turn-by-Turn Timeline */}
        {activeTab === "timeline" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Chronological Turn-by-Turn Diagnostic Timeline
                </h3>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Granular review of key decision points, candidate replies, and recruiter model answers.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {(feedback.timeline_data || [
                {
                  turn_id: 1,
                  phase: "Clarification",
                  candidate_quote: "Could you clarify the client's primary objective—is it maximizing short-term EBITDA or long-term market share?",
                  status: "strong",
                  annotation: "Strong strategic kickoff establishing client boundaries.",
                  model_answer: "Perfect alignment with standard MBB partner kickoff."
                },
                {
                  turn_id: 3,
                  phase: "Structuring",
                  candidate_quote: "I want to look at revenue from room rentals and value-added amenities...",
                  status: "acceptable",
                  annotation: "Logical split, but missed occupancy rates and RevPAR metrics.",
                  model_answer: "Structure as: Total Revenue = Available Rooms × Occupancy Rate × ADR + Ancillary Spend per Guest."
                },
                {
                  turn_id: 5,
                  phase: "Quantitative Analysis",
                  candidate_quote: "Looking at the segments for family incom people...",
                  status: "missed",
                  annotation: "Imprecise vocabulary and missed opportunities to calculate contribution margin per segment.",
                  model_answer: "Segment by Household Income brackets (High Net Worth vs Middle Income) and compute Contribution Margin per occupied night."
                }
              ]).map((turn: any, i: number) => {
                const statusBadge = getTurnStatusBadge(turn.status || turn.strength)
                const isExpanded = expandedTimelineTurns[turn.turn_id || i]
                const StatusIcon = statusBadge.icon

                return (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono-tech font-bold text-foreground">
                          TURN {turn.turn_id || i + 1}
                        </span>
                        <span className="text-xs font-mono-tech text-muted-foreground uppercase">
                          {turn.phase || "Discussion"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold border ${statusBadge.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleTimelineTurn(turn.turn_id || i)}
                          className="h-6 px-2 text-[10px] font-mono-tech text-muted-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {turn.candidate_quote && (
                      <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground/90 font-sans italic space-y-1">
                        <div className="text-[10px] text-muted-foreground font-mono-tech uppercase not-italic">
                          Candidate Verbatim Statement:
                        </div>
                        <p>"{turn.candidate_quote}"</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground font-sans">
                      <strong className="text-foreground font-mono-tech text-xs">Evaluator Observation: </strong>
                      {turn.annotation}
                    </div>

                    {isExpanded && turn.model_answer && (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs font-sans space-y-1.5 animate-in fade-in">
                        <div className="font-mono-tech text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> TOP 1% BENCHMARK RESPONSE:
                        </div>
                        <p className="text-foreground leading-relaxed">{turn.model_answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Actionable Drills */}
        {activeTab === "drills" && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Personalized Remediation Drills
                </h3>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Targeted exercises calibrated to eliminate the specific bottlenecks identified during this session.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {(feedback.actionable_drills || [
                {
                  title: "Unit Economics & Capacity Drill",
                  duration: "20 mins",
                  priority: "High",
                  objective: "Practice calculating RevPAR, ADR, and Breakeven Occupancy across 3 scenario variations."
                },
                {
                  title: "Executive BLUF Synthesis Drill",
                  duration: "15 mins",
                  priority: "High",
                  objective: "Practice structuring 60-second partner debriefs using the Recommendation-Pillars-Risks-NextSteps format."
                },
                {
                  title: "Business Nomenclature Workshop",
                  duration: "15 mins",
                  priority: "Medium",
                  objective: "Eliminate filler hesitations and replace informal descriptions with formal corporate nomenclature."
                }
              ]).map((drill: any, i: number) => (
                <div key={i} className="p-5 rounded-xl bg-muted/40 border border-border space-y-3 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-tech">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        drill.priority === "High" 
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}>
                        {drill.priority || "High"} Priority
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3" /> {drill.duration || "15 mins"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground font-mono-tech">
                      {drill.title}
                    </h4>

                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {drill.objective}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => router.push("/interview")} 
                      className="w-full h-8 text-xs font-mono-tech bg-foreground text-background hover:bg-foreground/90"
                    >
                      Launch Practice Round <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ending Scorecard & Simulation Feedback */}
        <div className="mt-8 p-5 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h4 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground">
              Scorecard & Evaluation Feedback
            </h4>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Was this simulation evaluation accurate to your practice? Share your observations with our engineering team.
            </p>
          </div>
          <FeedbackButton context="Interview Scorecard" label="Share Evaluation Feedback" />
        </div>

      </main>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">COMPILING RECRUITER RUBRIC...</div>}>
      <FeedbackContent />
    </Suspense>
  )
}
