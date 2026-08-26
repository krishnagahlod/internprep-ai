"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, Home, Zap, ExternalLink, Download, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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
          setError("Evaluating interview... Compiling Rubric.")
          setTimeout(async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
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

  const handlePrintScorecard = () => {
    window.print();
  };

  if (error && !feedback) {
     return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm rounded-xl border border-border bg-card p-8">
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
        <p>COMPILING PARTNER EVALUATION RUBRIC...</p>
      </div>
    </div>
  )

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
            <span className="text-xs font-mono-tech text-muted-foreground">SESSION EVALUATION</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrintScorecard} 
              className="text-xs font-mono-tech h-8 border-border"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export Scorecard PDF
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4 sm:px-6 max-w-5xl relative z-10 space-y-8">
        
        {/* Title */}
        <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [DEBRIEF COMPLETE]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">PARTNER RUBRIC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Candidate Performance Evaluation
            </h1>
          </div>
        </div>

        {/* Master Score & Executive Summary Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          
          {/* Aggregate Score Card */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground mb-4">
              Aggregate Case Score
            </div>
            
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-full border-4 border-muted flex flex-col items-center justify-center bg-background">
                <div className="text-4xl font-extrabold font-mono-tech text-foreground">
                  {feedback.overall_score?.toFixed(1) || "4.5"}
                </div>
                <div className="text-[10px] font-mono-tech text-muted-foreground mt-0.5">OUT OF 5.0</div>
              </div>
            </div>
            
            <div className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono-tech font-bold text-emerald-600 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5 mr-1.5" /> {feedback.final_verdict || "Strong Hire (Partner Track)"}
            </div>
          </div>
          
          {/* Strengths & Growth Areas */}
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
            <h3 className="text-sm font-bold font-mono-tech uppercase text-foreground">
              Partner Executive Assessment
            </h3>

            <div className="grid sm:grid-cols-2 gap-5 text-xs">
              {/* Strengths */}
              <div className="space-y-2.5">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono-tech">
                  <CheckCircle2 className="h-4 w-4" /> Top Strengths
                </div>
                <ul className="space-y-2">
                  {(feedback.strengths || ["Rigorous initial framework", "High numerical calculation accuracy"]).map((s: string, i: number) => (
                    <li key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-foreground leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div className="space-y-2.5">
                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-mono-tech">
                  <AlertTriangle className="h-4 w-4" /> Growth Areas
                </div>
                <ul className="space-y-2">
                  {(feedback.improvements || ["Pace when synthesizing final recommendation"]).map((s: string, i: number) => (
                    <li key={i} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-foreground leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Dimension Breakdown */}
        {feedback.dimensions && feedback.dimensions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
            <h3 className="text-sm font-bold font-mono-tech uppercase text-foreground">
              7-Dimension Rubric Scoring
            </h3>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
              {feedback.dimensions.map((dim: any, i: number) => (
                <div key={i} className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono-tech">
                    <span className="font-semibold text-foreground">{dim.name}</span>
                    <span className="font-bold text-primary">{dim.score?.toFixed(1)} / 5.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">{dim.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">COMPILING RUBRIC...</div>}>
      <FeedbackContent />
    </Suspense>
  )
}
