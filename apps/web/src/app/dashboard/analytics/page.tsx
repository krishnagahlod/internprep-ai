"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, TrendingUp, BarChart, Target, Activity } from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from "recharts"

export default function AnalyticsPage() {
  const { user, isGuest } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalResumes: 0,
    totalInterviews: 0,
  })
  const [trendData, setTrendData] = useState<any[]>([])
  const [radarData, setRadarData] = useState<any[]>([])

  useEffect(() => {
    if (isGuest || !user) {
      router.push("/login")
      return
    }

    const fetchAnalytics = async () => {
      try {
        // Fetch resumes
        const { data: resumes } = await supabase
          .from("resume_analyses")
          .select("created_at, analysis_data")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })

        // Fetch interviews
        const { count: interviewCount } = await supabase
          .from("interview_sessions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        setStats({
          totalResumes: resumes?.length || 0,
          totalInterviews: interviewCount || 0,
        })

        if (resumes && resumes.length > 0) {
          // Process trend data (overall scores over time)
          const trends = resumes.map((r, i) => {
            const analysis_data = r.analysis_data as any
            const scores: Record<string, number> = analysis_data?.radar_scores || {}
            // Average of all scores to get a single performance metric
            const avgScore = Object.values(scores).reduce((a: number, b: number) => a + b, 0) / (Object.keys(scores).length || 1)
            
            return {
              name: `Scan ${i + 1}`,
              score: Math.round(avgScore),
              date: new Date(r.created_at).toLocaleDateString()
            }
          })
          setTrendData(trends)

          // Process weakness heatmap (average of latest 5 resumes)
          const recentResumes = resumes.slice(-5)
          const categorySums: Record<string, number> = {
            "Quantification": 0,
            "Action Verbs": 0,
            "Structure": 0,
            "Balance": 0,
            "STAR Format": 0,
            "Formatting": 0
          }
          
          let validCount = 0
          recentResumes.forEach(r => {
            const analysis_data = r.analysis_data as any
            const scores = analysis_data?.radar_scores
            if (scores) {
              categorySums["Quantification"] += scores.quantification || 0
              categorySums["Action Verbs"] += scores.action_verbs || 0
              categorySums["Structure"] += scores.structure || 0
              categorySums["Balance"] += scores.section_balance || 0
              categorySums["STAR Format"] += scores.star_compliance || 0
              categorySums["Formatting"] += scores.formatting || 0
              validCount++
            }
          })

          if (validCount > 0) {
            const radar = Object.keys(categorySums).map(key => ({
              subject: key,
              A: Math.round(categorySums[key] / validCount),
              fullMark: 100
            }))
            setRadarData(radar)
          }
        }

      } catch (err) {
        console.error("Failed to fetch analytics:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, isGuest, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <Button variant="ghost" className="mb-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight font-outfit">Performance Analytics</h1>
          <p className="text-muted-foreground mt-2">Track your engagement, overall trends, and structural weaknesses.</p>
        </div>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Resumes Scanned</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-outfit">{stats.totalResumes}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mock Interviews Done</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-outfit">{stats.totalInterviews}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Resume Score</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-outfit text-emerald-600 dark:text-emerald-400">
                {trendData.length > 0 ? trendData[trendData.length - 1].score : 0}/100
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {trendData.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Performance Trend */}
            <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Score Progression</CardTitle>
                <CardDescription>Overall resume quality over time (deterministic)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weakness Heatmap */}
            <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-lg"><BarChart className="mr-2 h-5 w-5 text-primary" /> Weakness Heatmap</CardTitle>
                <CardDescription>Structural analysis based on your recent resumes</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#888" strokeOpacity={0.3} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-slate-300 dark:border-neutral-800 rounded-3xl bg-white/30 dark:bg-neutral-900/20">
            <Activity className="h-10 w-10 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Not enough data</h3>
            <p className="text-muted-foreground mt-1">Upload a resume to see your performance trends and heatmap.</p>
          </div>
        )}

      </main>
    </div>
  )
}

function FileText(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
}
