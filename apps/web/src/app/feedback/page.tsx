"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, Home, Zap, ExternalLink } from "lucide-react"
import { CreatorBadge } from "@/components/creator-badge"

function FeedbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [feedback, setFeedback] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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
          // If not found, maybe generate it? The backend should handle generation on end_session, so here we just poll or error
          setError("Evaluating interview... Please wait.")
          
          // Poll once after a few seconds in case it's still generating
          setTimeout(async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const retryResp = await fetch(`${API_URL}/feedback/${sessionId}`)
            if (retryResp.ok) {
              const data = await retryResp.json()
              setFeedback(data.feedback)
              setError(null)
            } else {
              setError("Feedback could not be loaded. Please try again later.")
            }
          }, 10000)
        }
      } catch (err) {
        setError("Failed to connect to the server.")
      }
    }

    fetchFeedback()
  }, [sessionId])

  if (error && !feedback) {
     return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-center">
            {error.includes("Evaluating") ? (
              <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            )}
            <p className="text-sm text-muted-foreground font-mono">{error}</p>
            {!error.includes("Evaluating") && (
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Return to Dashboard
              </Button>
            )}
          </div>
        </div>
      )
  }

  if (!feedback) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Compiling Feedback Rubric...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <div className="font-mono text-sm text-muted-foreground">EVALUATION_REPORT</div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4 mr-2" /> Return to Hub
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4 md:px-8 max-w-5xl relative z-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Performance Rubric</h1>
            <p className="text-muted-foreground text-lg">Detailed breakdown across 7 core consulting dimensions.</p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8 auto-rows-min">
          
          {/* Overall Score (Col 1, spans 2 rows) */}
          <div className="md:col-span-1 glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden glow-accent group">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Aggregate Score</h3>
            
            <div className="relative mb-6">
              {/* Fake circular gauge bg */}
              <div className="absolute inset-0 rounded-full border-[8px] border-black/5 dark:border-white/5" />
              {/* Fake circular gauge fill */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${(feedback.overall_score / 5) * 289} 289`} className="text-primary transition-all duration-1000 ease-out" />
              </svg>
              
              <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-md">
                <div className="text-5xl font-extrabold">{feedback.overall_score.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground mt-1">/ 5.0</div>
              </div>
            </div>
            
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Zap className="h-4 w-4 mr-2" /> {feedback.final_verdict}
            </div>
          </div>
          
          {/* Strengths & Improvements (Col 2 & 3) */}
          <div className="md:col-span-2 glass-panel rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6">AI Executive Summary</h3>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-sm mb-4 flex items-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Top Strengths
                </h4>
                <ul className="space-y-4">
                  {feedback.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 glass-card bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                      <span className="shrink-0 mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-sm text-foreground/90">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-4 flex items-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 mr-2" /> Growth Areas
                </h4>
                <ul className="space-y-4">
                  {feedback.improvements.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 glass-card bg-black/5 dark:bg-white/5 p-3 rounded-xl border-amber-500/10">
                      <span className="shrink-0 mt-0.5 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      <span className="text-sm text-foreground/90">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategic Advice (New) */}
            {feedback.strategic_advice && (
              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <h4 className="font-semibold text-sm mb-2 text-primary">Strategic Advice</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Day 1 Readiness</div>
                    <div className="text-lg font-bold">{feedback.strategic_advice.day1_readiness_score}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recommended Next Practice</div>
                    <div className="text-sm font-semibold">{feedback.strategic_advice.recommended_next_case_type}</div>
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary mt-1" onClick={() => router.push("/interview")}>
                      Practice {feedback.strategic_advice.recommended_next_case_type} <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7-Dimension Breakdown */}
        <div className="glass-panel rounded-3xl p-8 mb-8">
          <h3 className="text-xl font-bold mb-8">Dimension Analysis</h3>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            {feedback.dimensions.map((dim: any, i: number) => (
              <div key={i} className="space-y-3 group">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground/90 group-hover:text-primary transition-colors">{dim.name}</h4>
                  </div>
                  <div className="font-mono text-sm font-bold">{dim.score.toFixed(1)}</div>
                </div>
                {/* Custom Progress Bar */}
                <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out relative"
                    style={{ width: `${(dim.score / 5) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{dim.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline View (New) */}
        {feedback.timeline_data && feedback.timeline_data.length > 0 && (
          <div className="glass-panel rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-8">Interview Timeline</h3>
            <div className="space-y-4">
              {feedback.timeline_data.map((event: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${event.strength === 'strong' ? 'bg-emerald-500' : event.strength === 'weak' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    {i !== feedback.timeline_data.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{event.phase}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${event.strength === 'strong' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : event.strength === 'weak' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                        {event.strength}
                      </span>
                    </div>
                    <p className="text-sm">{event.annotation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CreatorBadge />
      </main>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" /></div>}>
      <FeedbackContent />
    </Suspense>
  )
}
