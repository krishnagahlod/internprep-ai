"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, FileText, Bot, Loader2, Calendar } from "lucide-react"

export default function HistoryPage() {
  const { user, isGuest } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  const [resumeHistory, setResumeHistory] = useState<any[]>([])
  const [interviewHistory, setInterviewHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isGuest || !user) {
      router.push("/login")
      return
    }

    const fetchHistory = async () => {
      try {
        // Fetch resumes
        const { data: resumes } = await supabase
          .from("resume_analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (resumes) setResumeHistory(resumes)

        // Fetch interviews
        const { data: interviews } = await supabase
          .from("interview_sessions")
          .select("*, session_feedback(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (interviews) setInterviewHistory(interviews)

      } catch (err) {
        console.error("Failed to fetch history:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
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
          <h1 className="text-4xl font-extrabold tracking-tight font-outfit">Your History</h1>
          <p className="text-muted-foreground mt-2">Review your past resume analyses and mock interviews to track your progress.</p>
        </div>

        <Tabs defaultValue="resumes" className="w-full">
          <TabsList className="mb-8 p-1 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-slate-200 dark:border-neutral-800 rounded-xl inline-flex shadow-sm">
            <TabsTrigger value="resumes" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <FileText className="h-4 w-4 mr-2" /> Resume Scans
            </TabsTrigger>
            <TabsTrigger value="interviews" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Bot className="h-4 w-4 mr-2" /> Mock Interviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="space-y-6">
            {resumeHistory.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-300 dark:border-neutral-800 rounded-3xl bg-white/30 dark:bg-neutral-900/20">
                <Clock className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold">No resumes analyzed yet</h3>
                <p className="text-muted-foreground mt-1">Upload a resume to get started.</p>
                <Button className="mt-6" onClick={() => router.push("/resume")}>Analyze Resume</Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {resumeHistory.map((scan) => (
                  <Card key={scan.id} className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            {new Date(scan.created_at).toLocaleDateString()}
                          </CardTitle>
                          <CardDescription className="mt-1 uppercase tracking-widest text-[10px] font-bold text-primary/70">
                            TARGET: {scan.target_role}
                          </CardDescription>
                        </div>
                        {scan.analysis_data?.radar_scores && (
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                            Score: {scan.analysis_data.radar_scores.formatting || 0}/100
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {scan.analysis_data?.overall_feedback || "No feedback generated."}
                      </p>
                      <Button variant="outline" className="w-full text-xs" onClick={() => {
                        alert("Detailed view coming soon! For now, refer to the summary above.")
                      }}>
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            {interviewHistory.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-300 dark:border-neutral-800 rounded-3xl bg-white/30 dark:bg-neutral-900/20">
                <Clock className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold">No interviews completed</h3>
                <p className="text-muted-foreground mt-1">Start a mock case interview to practice.</p>
                <Button className="mt-6" onClick={() => router.push("/interview")}>Start Interview</Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {interviewHistory.map((interview) => (
                  <Card key={interview.id} className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm border-slate-200/60 dark:border-neutral-800 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            {new Date(interview.created_at).toLocaleDateString()}
                          </CardTitle>
                          <CardDescription className="mt-1 uppercase tracking-widest text-[10px] font-bold text-primary/70">
                            PHASE: {interview.case_state?.current_phase || "Unknown"}
                          </CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${interview.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full text-xs" onClick={() => {
                        alert("Detailed transcript view coming soon!")
                      }}>
                        View Transcript
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
