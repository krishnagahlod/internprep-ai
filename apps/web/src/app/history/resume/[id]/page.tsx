"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldAlert, Target, Brain } from "lucide-react"

// Helper SVG Radar Chart
const RadarChart = ({ scores }: { scores: any }) => {
  if (!scores) return null;
  const metrics = [
    { label: "Quantification", value: scores.quantification || 0 },
    { label: "Action Verbs", value: scores.action_verbs || 0 },
    { label: "Structure", value: scores.structure || 0 },
    { label: "Section Balance", value: scores.section_balance || 0 },
    { label: "STAR Compliance", value: scores.star_compliance || 0 },
    { label: "Formatting", value: scores.formatting || 0 }
  ];
  
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;
  const angleSlice = (Math.PI * 2) / metrics.length;
  
  const getCoordinates = (value: number, i: number) => {
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angleSlice * i - Math.PI / 2);
    const y = center + r * Math.sin(angleSlice * i - Math.PI / 2);
    return { x, y };
  };

  const points = metrics.map((m, i) => {
    const { x, y } = getCoordinates(m.value, i);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Web circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((factor, idx) => (
          <polygon 
            key={idx}
            points={metrics.map((_, i) => {
              const {x, y} = getCoordinates(factor * 100, i);
              return `${x},${y}`;
            }).join(" ")}
            fill="none" 
            stroke="currentColor" 
            className="text-foreground/10"
          />
        ))}
        {/* Axes */}
        {metrics.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return <line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" className="text-foreground/20" />
        })}
        {/* Data polygon */}
        <polygon points={points} fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth={2} className="text-primary" />
        {/* Dots */}
        {metrics.map((m, i) => {
          const { x, y } = getCoordinates(m.value, i);
          return <circle key={`dot-${i}`} cx={x} cy={y} r={4} fill="currentColor" className="text-primary" />
        })}
      </svg>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs text-muted-foreground w-full">
        {metrics.map((m, i) => (
          <div key={i}>
            <span className="block font-bold text-foreground">{m.value}</span>
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResumeHistoryDetail() {
  const { user, isGuest } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [resumeData, setResumeData] = useState<any>(null)

  useEffect(() => {
    if (isGuest || !user) {
      router.push("/login")
      return
    }

    const fetchResume = async () => {
      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("*")
          .eq("id", params.id)
          .single()

        if (error) throw error
        setResumeData(data)
      } catch (err) {
        console.error("Failed to fetch resume:", err)
        router.push("/history")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchResume()
    }
  }, [user, isGuest, router, params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    )
  }

  if (!resumeData) return null

  const analysis = resumeData.analysis_data

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <Button variant="ghost" className="mb-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => router.push("/history")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
        </Button>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight font-outfit">Resume Analysis</h1>
          <p className="text-muted-foreground mt-2">Scanned on {new Date(resumeData.created_at).toLocaleDateString()} for a {resumeData.target_role} role.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-200 dark:border-neutral-800 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-100/50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <CardTitle className="font-outfit text-xl flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Structural Radar
                </CardTitle>
                <CardDescription>Your performance against Day 1 benchmarks</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <RadarChart scores={analysis?.radar_scores} />
                {analysis?.radar_scores_reasoning && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-primary">AI Evaluation Reasoning</h4>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {analysis.radar_scores_reasoning}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-slate-200 dark:border-neutral-800 shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="font-outfit text-2xl">Overall Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {analysis?.overall_feedback}
                </p>
                {analysis?.day1_comparison && (
                  <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" /> Day 1 Benchmark
                    </h4>
                    <p className="text-sm text-foreground/80">{analysis.day1_comparison}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-bold font-outfit px-2 mt-8">Bullet-by-Bullet Analysis</h3>
              {analysis?.bullets?.map((bullet: any, idx: number) => {
                const getSeverityStyles = (severity: string) => {
                  switch(severity) {
                    case 'critical': return 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
                    case 'major': return 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10'
                    case 'minor': return 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10'
                    case 'good': return 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10'
                    default: return 'border-slate-200 dark:border-neutral-800'
                  }
                }
                const severityIcon = (severity: string) => {
                  if (severity === 'critical') return <ShieldAlert className="w-5 h-5 text-red-500" />
                  if (severity === 'major' || severity === 'minor') return <AlertCircle className="w-5 h-5 text-orange-500" />
                  return <CheckCircle2 className="w-5 h-5 text-green-500" />
                }

                return (
                  <Card key={idx} className={`overflow-hidden rounded-2xl border ${getSeverityStyles(bullet.severity)}`}>
                    <div className="p-5 flex gap-4">
                      <div className="shrink-0 mt-1">{severityIcon(bullet.severity)}</div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-background/50 px-2 py-1 rounded-md mb-2 inline-block">
                            {bullet.section_type || "General"}
                          </span>
                          <p className="font-medium text-foreground line-through decoration-red-500/30">
                            {bullet.original_bullet}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{bullet.critique}</p>
                        {bullet.suggested_rewrite && (
                          <div className="p-3 bg-background/50 rounded-xl border border-black/5 dark:border-white/5 relative group">
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {bullet.suggested_rewrite}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
