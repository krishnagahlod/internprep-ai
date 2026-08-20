"use client"

import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import { LayoutDashboard, FileText, Briefcase, ExternalLink, Sparkles, LogOut, TrendingUp, Compass, Settings, Clock, Users, Loader2, UploadCloud, Menu, X, Gauge, Building2 } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"

export default function DashboardPage() {
  const { isGuest, user, clearState, setUser } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  // Domain Interview Modal States
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState("Software")
  const [targetCompanyName, setTargetCompanyName] = useState("")
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchResumes = async () => {
    if (user) {
      const { data } = await supabase.from("resumes").select("id, file_name, created_at").eq("user_id", user.id).order('created_at', { ascending: false })
      if (data && data.length > 0) {
        setResumes(data)
        if (!selectedResumeId) setSelectedResumeId(data[0].id)
      }
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [user])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if it's a PDF (either by type or extension)
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF file.")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File too large. Max 5MB.")
      return
    }

    setUploadingResume(true)
    setUploadError("")

    const formData = new FormData()
    formData.append("file", file)
    if (user) {
      formData.append("user_id", user.id)
    } else {
      formData.append("user_id", "guest")
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/resume/upload`, {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(await response.text())
      }
      
      const data = await response.json()
      if (user) {
        await fetchResumes()
      } else {
        setResumes((prev) => [{ id: data.id, file_name: file.name, created_at: new Date().toISOString() }, ...prev])
      }
      setSelectedResumeId(data.id)
    } catch (err: any) {
      console.error(err)
      setUploadError("Failed to upload and parse resume.")
    } finally {
      setUploadingResume(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleStartDomainInterview = async () => {
    if (!selectedResumeId) {
      setUploadError("Please select or upload a resume first.")
      return
    }
    
    // We will start the session by creating it via API, then redirect
    setUploadingResume(true) // Reuse loading state for spinner
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/start_domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomain,
          company: targetCompanyName,
          resume_id: selectedResumeId,
          user_id: user?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/interview?id=${data.session_id}`)
      } else {
        setUploadError("Failed to start session.")
        setUploadingResume(false)
      }
    } catch (err) {
      console.error(err)
      setUploadError("Connection error.")
      setUploadingResume(false)
    }
  }

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
      
      {/* Domain Setup Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200/20 dark:border-white/10 relative">
            <button onClick={() => setShowDomainModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            
            <div className="flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mx-auto mb-6">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 font-outfit">Full Interview Simulator</h2>
            <p className="text-muted-foreground text-center mb-8 text-sm">Configure your tailored interview environment.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-semibold mb-2 block">Domain</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  {["Analytics", "Consult", "Core", "Finance", "FMCG", "Quant", "Software"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Target Company (Optional)</label>
                <Input 
                  placeholder="e.g. Goldman Sachs" 
                  value={targetCompanyName}
                  onChange={(e) => setTargetCompanyName(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Select Resume</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm mb-3"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  disabled={uploadingResume}
                >
                  {resumes.length === 0 && <option value="">No resumes found...</option>}
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.file_name || 'Resume'}</option>
                  ))}
                </select>
                
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingResume ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Parsing and extracting layout...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6 text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-600 dark:text-neutral-300">Upload new resume (PDF)</span>
                      <span className="text-xs text-slate-400 mt-1">We will parse and extract it perfectly.</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="application/pdf,.pdf" ref={fileInputRef} onChange={handleFileUpload} />
                </div>
                {uploadError && <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>}
              </div>
            </div>
            
            <Button 
              onClick={handleStartDomainInterview} 
              className="w-full h-12 text-base font-bold shadow-lg hover:-translate-y-0.5 transition-all"
              disabled={uploadingResume || !selectedResumeId}
            >
              {uploadingResume ? "Initializing..." : "Start Full Interview"}
            </Button>
          </div>
        </div>
      )}

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
            Resume Review
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/ats-checker")}>
            <Gauge className="mr-3 h-4 w-4 text-primary" />
            ATS Scorecard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/resume-builder")}>
            <UploadCloud className="mr-3 h-4 w-4" />
            Resume Builder
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/placement-analysis")}>
            <Building2 className="mr-3 h-4 w-4 text-amber-500" />
            Placement Analysis
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/interview")}>
            <Briefcase className="mr-3 h-4 w-4" />
            Interviews
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/dashboard/analytics")}>
            <TrendingUp className="mr-3 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50" onClick={() => router.push("/history")}>
            <Clock className="mr-3 h-4 w-4" />
            History
          </Button>

          
          <div className="pt-4 pb-2">
            <div className="h-px bg-border/50 w-full" />
          </div>
          
          <a href="https://reach.gymkhana.iitb.ac.in/internships" target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800/50">
              <Compass className="mr-3 h-4 w-4" />
              IITB Resources
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          </a>
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-white dark:bg-neutral-950 shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-in-out lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-premium p-[1px] flex items-center justify-center shadow-sm">
              <div className="h-full w-full bg-white dark:bg-neutral-950 rounded-[7px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </div>
            <span className="text-xl font-bold font-outfit tracking-tight">InternPrep</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-2">
          <Button variant="secondary" className="w-full justify-start shadow-sm bg-white dark:bg-neutral-900 text-foreground border border-black/5 dark:border-white/5" onClick={() => setIsMobileMenuOpen(false)}>
            <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
            Command Center
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { router.push("/resume"); setIsMobileMenuOpen(false); }}>
            <FileText className="mr-3 h-4 w-4" />
            Resume Review
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { router.push("/ats-checker"); setIsMobileMenuOpen(false); }}>
            <Gauge className="mr-3 h-4 w-4 text-primary" />
            ATS Scorecard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { router.push("/resume-builder"); setIsMobileMenuOpen(false); }}>
            <UploadCloud className="mr-3 h-4 w-4" />
            Resume Builder
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { router.push("/placement-analysis"); setIsMobileMenuOpen(false); }}>
            <Building2 className="mr-3 h-4 w-4 text-amber-500" />
            Placement Analysis
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { router.push("/interview"); setIsMobileMenuOpen(false); }}>
            <Briefcase className="mr-3 h-4 w-4" />
            Interviews
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { router.push("/history"); setIsMobileMenuOpen(false); }}>
            <Clock className="mr-3 h-4 w-4" />
            History
          </Button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-border bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-30 flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Sparkles className="h-5 w-5 text-primary ml-1" />
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 font-outfit text-foreground drop-shadow-sm">Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {isGuest ? 'Guest' : 'Candidate'}</h1>
              <p className="text-muted-foreground text-lg">Your AI copilot is ready. What are we practicing today?</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://reach.gymkhana.iitb.ac.in/internships" target="_blank" rel="noopener noreferrer" className="hidden md:flex">
                <Button variant="outline" size="sm" className="rounded-full bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-dashed">
                  <Compass className="mr-2 h-4 w-4" /> IITB Resources <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </a>
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
          
          {/* Bento Box Layout */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            
            {/* Full Interview Simulator Card (Spans 2 cols) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-panel dark:bg-neutral-900/80 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden shadow-lg border-white dark:border-neutral-800" onClick={() => setShowDomainModal(true)}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 group-hover:bg-blue-200/50 dark:group-hover:bg-blue-800/30 transition-colors duration-500 z-0" />
              
              <div className="flex items-start justify-between relative z-10 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-white bg-black/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">DOMAIN FOCUS</span>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors font-outfit">Full Interview Simulator</h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 max-w-sm">
                  Tailored technical and behavioral interviews. Upload your resume and practice for specific roles across various domains.
                </p>
                <div className="inline-flex items-center text-white bg-blue-600 px-5 py-2.5 rounded-full font-medium text-sm hover:shadow-md hover:-translate-y-0.5 transition-all w-fit">
                  Configure Session <ExternalLink className="ml-2 h-4 w-4" />
                </div>
              </div>
            </motion.div>

            {/* Mock Case Simulator Card (Spans 2 cols) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-panel dark:bg-neutral-900/80 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden shadow-lg border-white dark:border-neutral-800" onClick={() => router.push("/interview")}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/50 dark:bg-cyan-900/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 group-hover:bg-cyan-200/50 dark:group-hover:bg-cyan-800/30 transition-colors duration-500 z-0" />
              
              <div className="flex items-start justify-between relative z-10 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-premium flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-white bg-black/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">CORE ENGINE</span>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-extrabold mb-3 group-hover:text-cyan-700 transition-colors font-outfit">Mock Case Simulator</h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-sm">
                  Engage in a hyper-realistic, voice-enabled mock interview. Work through problems on a live digital scratchpad evaluated in real-time.
                </p>
                <div className="inline-flex items-center text-white bg-primary px-5 py-2.5 rounded-full font-medium text-sm hover:shadow-md hover:-translate-y-0.5 transition-all w-fit">
                  Initialize Session <ExternalLink className="ml-2 h-4 w-4" />
                </div>
              </div>
            </motion.div>

            {/* Resume Diagnostic Card (Spans 2 columns) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-card dark:bg-neutral-900/40 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden" onClick={() => router.push("/resume")}>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100/50 dark:from-violet-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
              <div className="flex items-start justify-between relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center border border-violet-100 dark:border-violet-900 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-3 py-1 rounded-full border border-violet-100 dark:border-violet-800/50">DIAGNOSTICS</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-violet-700 transition-colors font-outfit">Resume Intelligence</h2>
                <p className="text-muted-foreground text-sm line-clamp-2 max-w-sm">
                  Deep STAR compliance critiques, competence radar, Day 1 benchmark comparison, and interactive AI workshop.
                </p>
              </div>
            </motion.div>

            {/* ATS Scorecard Studio Card (Spans 2 columns) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-card dark:bg-neutral-900/40 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden" onClick={() => router.push("/ats-checker")}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 dark:from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
              <div className="flex items-start justify-between relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center border border-blue-100 dark:border-blue-900 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">ATS SUITE</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-700 transition-colors font-outfit">ATS & Placement Score</h2>
                <p className="text-muted-foreground text-sm line-clamp-2 max-w-sm">
                  5-Pillar score (0–100), 1-page LaTeX line-wrap auditor, IITB policy compliance check, and custom JD matcher.
                </p>
              </div>
            </motion.div>


            {/* Resume Builder Card (Spans 2 columns) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-card dark:bg-neutral-900/40 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden" onClick={() => router.push("/resume-builder")}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 dark:from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
              <div className="flex items-start justify-between relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center border border-emerald-100 dark:border-emerald-900 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">BUILDER</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-emerald-700 transition-colors font-outfit">Resume Builder</h2>
                <p className="text-muted-foreground text-sm line-clamp-2 max-w-sm">
                  Turn raw experiences into high-impact, placement-focused bullets using the Achievement Vault.
                </p>
              </div>
            </motion.div>

            {/* Placement Analysis & Company Intelligence Card (Spans 2 columns) */}
            <motion.div variants={itemVariants} className="md:col-span-2 glass-card dark:bg-neutral-900/40 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden" onClick={() => router.push("/placement-analysis")}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 dark:from-amber-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
              <div className="flex items-start justify-between relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center border border-amber-100 dark:border-amber-900 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/50">IITB EXCLUSIVE</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-outfit">Placement Analysis</h2>
                <p className="text-muted-foreground text-sm line-clamp-2 max-w-sm">
                  627+ verified recruiters (2024–26), JAF compensation breakdowns, selection questions & round blueprints.
                </p>
              </div>
            </motion.div>

            {/* Analytics Card */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 lg:col-span-2 glass-card dark:bg-neutral-900/40 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors"
              onClick={() => router.push("/dashboard/analytics")}
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shadow-sm">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1 font-outfit">Analytics</h2>
                <p className="text-muted-foreground text-xs">Performance insights</p>
              </div>
            </motion.div>

            {/* Settings/Progress Placeholder */}
            <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 glass-card rounded-3xl p-6 flex flex-col justify-between border border-gray-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/40 hover:bg-white/80 dark:hover:bg-slate-800/60 cursor-pointer group transition-colors" onClick={() => router.push("/history")}>
              <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center border border-gray-200 dark:border-neutral-700 shadow-sm group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1 font-outfit">History</h2>
                <p className="text-muted-foreground text-xs">Track your progress</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  )
}
