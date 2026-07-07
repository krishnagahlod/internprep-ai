"use client"

import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { LayoutDashboard, FileText, Briefcase, ExternalLink, Sparkles, LogOut, TrendingUp, Compass, Settings } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardPage() {
  const { isGuest, user, clearState, setUser } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      if (!isGuest && !user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        } else {
          router.push("/")
        }
      }
      setLoading(false)
    }
    
    checkUser()
  }, [isGuest, user, router, supabase.auth, setUser])

  const handleLogout = async () => {
    if (!isGuest) {
      await supabase.auth.signOut()
    }
    clearState()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Initializing Workspace...</p>
        </div>
      </div>
    )
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-white/40 dark:bg-neutral-950/40 backdrop-blur-3xl hidden lg:flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-8 w-8 rounded-lg bg-gradient-premium p-[1px] flex items-center justify-center shadow-sm">
            <div className="h-full w-full bg-white dark:bg-neutral-950 rounded-[7px] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </div>
          <span className="text-xl font-bold font-outfit tracking-tight">InternPrep</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Button variant="secondary" className="w-full justify-start shadow-sm bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-foreground border border-black/5 dark:border-white/5">
            <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
            Command Center
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/resume")}>
            <FileText className="mr-3 h-4 w-4" />
            Resumes
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/interview")}>
            <Briefcase className="mr-3 h-4 w-4" />
            Interviews
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50">
            <TrendingUp className="mr-3 h-4 w-4" />
            Analytics
          </Button>
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={handleLogout}>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-neutral-700">
              {isGuest ? "G" : user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="truncate flex-1">{isGuest ? "Guest User" : user?.email}</span>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-border bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50 flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold tracking-tight">InternPrep</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-end justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 font-outfit text-foreground drop-shadow-sm">Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {isGuest ? 'Guest' : 'Candidate'}</h1>
              <p className="text-muted-foreground text-lg">Your AI copilot is ready. What are we practicing today?</p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <ThemeToggle />

            </div>
          </motion.div>
          
          {/* Bento Box Layout */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 auto-rows-[220px]"
          >
            
            {/* Resume Card (Spans 2 columns) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-card dark:bg-neutral-900/40 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden" onClick={() => router.push("/resume")}>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100/50 dark:from-violet-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
              <div className="flex items-start justify-between relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center border border-violet-100 dark:border-violet-900 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-800/50">MODULE 01</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-violet-700 transition-colors font-outfit">Resume Intelligence</h2>
                <p className="text-muted-foreground text-sm line-clamp-2 max-w-sm">
                  Upload your PDF. We'll generate a precise heatmap flagging vague claims and predicting cross-questions.
                </p>
              </div>
            </motion.div>

            {/* Interview Engine Card (Spans 2 cols, 2 rows) */}
            <motion.div variants={itemVariants} className="md:col-span-2 row-span-2 glass-panel dark:bg-neutral-900/80 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden shadow-lg border-white dark:border-neutral-800" onClick={() => router.push("/interview")}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/50 dark:bg-cyan-900/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 group-hover:bg-cyan-200/50 dark:group-hover:bg-cyan-800/30 transition-colors duration-500 z-0" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-premium flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-white bg-black/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">CORE ENGINE</span>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h2 className="text-3xl font-extrabold mb-3 group-hover:text-cyan-700 transition-colors font-outfit">Mock Case Simulator</h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-sm">
                  Engage in a hyper-realistic, voice-enabled mock interview. Work through problems on a live digital scratchpad evaluated in real-time.
                </p>
                <div className="inline-flex items-center text-white bg-primary px-5 py-2.5 rounded-full font-medium text-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  Initialize Session <ExternalLink className="ml-2 h-4 w-4" />
                </div>
              </div>
            </motion.div>

            {/* Resources Card */}
            <motion.div variants={itemVariants} className="md:col-span-1 glass-card dark:bg-neutral-900/40 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors" onClick={() => window.open("https://reach.gymkhana.iitb.ac.in/internships", "_blank")}>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-neutral-800 flex items-center justify-center border border-gray-200 dark:border-neutral-700 group-hover:bg-gray-100 dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                  <Compass className="h-6 w-6 text-gray-700" />
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1 font-outfit">IITB Resources</h2>
                <p className="text-muted-foreground text-xs">Official Gymkhana DB</p>
              </div>
            </motion.div>

            {/* Settings/Progress Placeholder */}
            <motion.div variants={itemVariants} className="md:col-span-1 glass-card rounded-3xl p-6 flex flex-col justify-between border-dashed border-gray-300 dark:border-neutral-700 bg-transparent hover:bg-white/30 dark:hover:bg-slate-800/40 cursor-pointer group transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-white/50 dark:bg-neutral-800/50 flex items-center justify-center border border-gray-200 dark:border-neutral-700 shadow-sm group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1 font-outfit">Preferences</h2>
                <p className="text-muted-foreground text-xs">Configure AI copilot</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  )
}
