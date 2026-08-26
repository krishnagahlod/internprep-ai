"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Clock, FileText, Bot, Loader2, Calendar } from "lucide-react"

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
        const { data: resumes } = await supabase
          .from("resume_analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (resumes) setResumeHistory(resumes)

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
      <div className="min-h-screen flex items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p>FETCHING SESSION ARCHIVES...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors">
      
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard")} 
            className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs font-mono-tech"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Command Center
          </Button>

          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10 space-y-8">
        
        <div className="pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
              [ARCHIVES]
            </span>
            <span className="text-xs font-mono-tech text-muted-foreground">TELEMETRY & LOGS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Interview & Resume History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
            Review past transcripts, radar scores, and performance growth over time.
          </p>
        </div>

        <Tabs defaultValue="resumes" className="w-full space-y-6">
          <div className="flex justify-start">
            <TabsList className="p-1 rounded-lg bg-muted/60 border border-border inline-flex font-mono-tech text-xs">
              <TabsTrigger value="resumes" className="rounded-md px-4 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Resume Scans ({resumeHistory.length})
              </TabsTrigger>
              <TabsTrigger value="interviews" className="rounded-md px-4 py-1.5 text-xs">
                <Bot className="h-3.5 w-3.5 mr-1.5" /> Mock Interviews ({interviewHistory.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-xs min-h-[350px]">
            {/* Resumes Tab */}
            <TabsContent value="resumes" className="mt-0 space-y-4">
              {resumeHistory.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div className="text-sm font-bold text-foreground">No resume analyses found</div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">Upload a resume to run your first diagnostic.</p>
                  <Button size="sm" onClick={() => router.push("/resume")} className="h-8 text-xs font-mono-tech">
                    Analyze Resume
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {resumeHistory.map((scan) => (
                    <div key={scan.id} className="p-4 rounded-lg border border-border bg-background hover:border-primary/40 transition-all space-y-3 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono-tech mb-2">
                          <span className="flex items-center gap-1.5 text-foreground font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {new Date(scan.created_at).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] uppercase font-bold">
                            {scan.target_role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans line-clamp-2">
                          {scan.analysis_data?.overall_feedback || "Analysis completed."}
                        </p>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/history/resume/${scan.id}`)}
                        className="w-full h-8 text-xs font-mono-tech border-border"
                      >
                        View Scorecard <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Interviews Tab */}
            <TabsContent value="interviews" className="mt-0 space-y-4">
              {interviewHistory.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div className="text-sm font-bold text-foreground">No mock interviews completed</div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">Start a mock interview session to build your history.</p>
                  <Button size="sm" onClick={() => router.push("/interview")} className="h-8 text-xs font-mono-tech">
                    Start Mock Session
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {interviewHistory.map((interview) => (
                    <div key={interview.id} className="p-4 rounded-lg border border-border bg-background hover:border-primary/40 transition-all space-y-3 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono-tech mb-2">
                          <span className="flex items-center gap-1.5 text-foreground font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {new Date(interview.created_at).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/20">
                            {interview.interview_type === 'domain' ? 'Domain Interview' : 'Case Interview'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans line-clamp-2">
                          Phase: {interview.case_state?.current_phase || "Complete"} • Role: {interview.domain || "Consulting"}
                        </p>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/interview?id=${interview.id}`)}
                        className="w-full h-8 text-xs font-mono-tech border-border"
                      >
                        {interview.status === 'completed' ? 'View Transcript' : 'Resume Session'} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

      </main>
    </div>
  )
}
