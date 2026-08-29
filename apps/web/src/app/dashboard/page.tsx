"use client"

import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { 
  LayoutDashboard, FileText, Briefcase, ExternalLink, 
  Sparkles, LogOut, TrendingUp, Compass, Clock, 
  Users, Loader2, UploadCloud, Menu, X, Gauge, 
  Building2, CreditCard, Crown, ArrowRight, ShieldCheck, CheckCircle2, LogIn 
} from "lucide-react"
import { motion, Variants } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { QuotaBadge } from "@/components/quota-badge"

export default function DashboardPage() {
  const { isGuest, user, clearState, setUser } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  const isAdmin =
    user?.email?.toLowerCase() === "krishnagahlod@gmail.com" ||
    user?.email?.toLowerCase() === "creator@internprep.ai" ||
    user?.email?.toLowerCase().includes("admin")

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
    
    setUploadingResume(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/start_domain`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          domain: selectedDomain,
          company: targetCompanyName,
          resume_id: selectedResumeId,
          user_id: user?.id || (isGuest ? "guest" : undefined)
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
          <p className="text-xs text-muted-foreground font-mono-tech">INITIALIZING WORKSPACE...</p>
        </div>
      </div>
    )
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden transition-colors">
      
      {/* Domain Setup Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl border border-border relative">
            <button 
              onClick={() => setShowDomainModal(false)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Configure Domain Interview</h2>
                <p className="text-xs text-muted-foreground">Tailored role & company simulation environment.</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6 text-xs">
              <div>
                <label className="font-semibold mb-1.5 block text-foreground uppercase tracking-wider font-mono-tech text-[11px]">Domain Track</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs text-foreground cursor-pointer"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  {["Analytics", "Consult", "Core", "Finance", "FMCG", "Quant", "Software"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold mb-1.5 block text-foreground uppercase tracking-wider font-mono-tech text-[11px]">Target Company (Optional)</label>
                <Input 
                  placeholder="e.g. McKinsey, Google, Goldman Sachs" 
                  value={targetCompanyName}
                  onChange={(e) => setTargetCompanyName(e.target.value)}
                  className="rounded-lg h-9 text-xs border-border bg-background"
                />
              </div>
              
              <div>
                <label className="font-semibold mb-1.5 block text-foreground uppercase tracking-wider font-mono-tech text-[11px]">Select Resume</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs text-foreground mb-2.5 cursor-pointer"
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
                  className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingResume ? (
                    <div className="flex items-center gap-2 text-primary font-mono-tech text-xs">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Parsing layout geometry...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-5 w-5 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-semibold text-foreground">Upload new PDF resume</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">Extracts bullet points & experience automatically.</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="application/pdf,.pdf" ref={fileInputRef} onChange={handleFileUpload} />
                </div>
                {uploadError && <p className="text-xs text-destructive mt-1.5 font-medium">{uploadError}</p>}
              </div>
            </div>
            
            <Button 
              onClick={handleStartDomainInterview} 
              className="w-full h-10 text-xs font-semibold font-mono-tech bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all"
              disabled={uploadingResume || !selectedResumeId}
            >
              {uploadingResume ? "Initializing Session..." : "Launch Domain Session →"}
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl hidden lg:flex flex-col p-5 z-20 transition-colors">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight font-mono-tech text-foreground">
            InternPrep<span className="text-primary">.ai</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1.5 text-xs font-medium" aria-label="Command Center Navigation">
          <Button variant="secondary" className="w-full justify-start text-xs font-semibold bg-muted text-foreground border border-border shadow-xs">
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-primary" />
            Command Center
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/resume")}>
            <FileText className="mr-2.5 h-4 w-4" />
            Resume Review
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/ats-checker")}>
            <Gauge className="mr-2.5 h-4 w-4 text-primary" />
            ATS Scorecard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/resume-builder")}>
            <UploadCloud className="mr-2.5 h-4 w-4" />
            Resume Builder
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/interview")}>
            <Briefcase className="mr-2.5 h-4 w-4" />
            Interviews
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/dashboard/analytics")}>
            <TrendingUp className="mr-2.5 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/history")}>
            <Clock className="mr-2.5 h-4 w-4" />
            History
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => router.push("/billing")}>
            <CreditCard className="mr-2.5 h-4 w-4 text-primary" />
            Subscriptions & Quotas
          </Button>

          {isAdmin && (
            <div className="pt-2 space-y-1">
              <div className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-3 py-1 flex items-center gap-1.5">
                <Crown className="h-3 w-3" /> Admin Studio
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                onClick={() => router.push("/admin")}
              >
                <Crown className="mr-2.5 h-4 w-4 text-purple-500" />
                Admin Console
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
                onClick={() => {
                  localStorage.setItem("iitb_placement_verified", "true")
                  localStorage.setItem("iitb_placement_admin", "true")
                  router.push("/placement-analysis")
                }}
              >
                <Building2 className="mr-2.5 h-4 w-4 text-amber-500" />
                Placement Intelligence
                <Badge className="ml-auto bg-amber-500/20 text-amber-700 dark:text-amber-300 border-none text-[9px] py-0 px-1">
                  VIP
                </Badge>
              </Button>
            </div>
          )}

          <div className="pt-3 pb-1">
            <div className="h-px bg-border w-full" />
          </div>
          
          <a href="https://reach.gymkhana.iitb.ac.in/internships" target="_blank" rel="noopener noreferrer" className="w-full block">
            <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
              <Compass className="mr-2.5 h-4 w-4" />
              IITB Resources
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          </a>
        </nav>

        {/* User Footer */}
        <div className="mt-auto pt-3 border-t border-border">
          {isGuest || !user ? (
            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono-tech font-bold text-amber-600 dark:text-amber-400 text-xs shrink-0">
                  G
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-foreground block truncate">Guest Sandbox</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Local storage only</span>
                </div>
              </div>
              <Link href="/login" className="block w-full">
                <Button size="sm" className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 flex items-center justify-center gap-1.5 shadow-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In to Sync
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-foreground p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors" onClick={handleLogout}>
              <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center font-mono-tech font-bold text-foreground text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate flex-1 font-medium">{user?.email}</span>
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card shadow-xl flex flex-col p-5 transition-transform duration-200 ease-in-out lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold font-mono-tech text-foreground">InternPrep.ai</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 text-xs overflow-y-auto custom-scrollbar pr-1">
          <Button variant="secondary" className="w-full justify-start text-xs font-semibold bg-muted text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-primary" />
            Command Center
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/resume"); setIsMobileMenuOpen(false); }}>
            <FileText className="mr-2.5 h-4 w-4" />
            Resume Review
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/ats-checker"); setIsMobileMenuOpen(false); }}>
            <Gauge className="mr-2.5 h-4 w-4 text-primary" />
            ATS Scorecard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/resume-builder"); setIsMobileMenuOpen(false); }}>
            <UploadCloud className="mr-2.5 h-4 w-4" />
            Resume Builder
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/interview"); setIsMobileMenuOpen(false); }}>
            <Briefcase className="mr-2.5 h-4 w-4" />
            Interviews
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/dashboard/analytics"); setIsMobileMenuOpen(false); }}>
            <TrendingUp className="mr-2.5 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/history"); setIsMobileMenuOpen(false); }}>
            <Clock className="mr-2.5 h-4 w-4" />
            History
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { router.push("/billing"); setIsMobileMenuOpen(false); }}>
            <CreditCard className="mr-2.5 h-4 w-4 text-primary" />
            Subscriptions & Quotas
          </Button>

          {isAdmin && (
            <div className="pt-2 space-y-1">
              <div className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-3 py-1 flex items-center gap-1.5">
                <Crown className="h-3 w-3" /> Admin Studio
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
                onClick={() => { router.push("/admin"); setIsMobileMenuOpen(false); }}
              >
                <Crown className="mr-2.5 h-4 w-4 text-purple-500" />
                Admin Console
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
                onClick={() => {
                  localStorage.setItem("iitb_placement_verified", "true")
                  localStorage.setItem("iitb_placement_admin", "true")
                  router.push("/placement-analysis")
                  setIsMobileMenuOpen(false)
                }}
              >
                <Building2 className="mr-2.5 h-4 w-4 text-amber-500" />
                Placement Intelligence
                <Badge className="ml-auto bg-amber-500/20 text-amber-700 dark:text-amber-300 border-none text-[9px] py-0 px-1">
                  VIP
                </Badge>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile User Footer */}
        <div className="mt-auto pt-3 border-t border-border">
          {isGuest || !user ? (
            <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono-tech font-bold text-amber-600 dark:text-amber-400 text-xs shrink-0">
                  G
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-foreground block truncate">Guest Sandbox</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Session stored locally</span>
                </div>
              </div>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full">
                <Button size="sm" className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 flex items-center justify-center gap-1.5 shadow-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In / Create Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-foreground p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors" onClick={handleLogout}>
              <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center font-mono-tech font-bold text-foreground text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate flex-1 font-medium">{user?.email}</span>
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold font-mono-tech text-foreground">InternPrep.ai</span>
          </div>
          <div className="flex items-center gap-2">
            {isGuest || !user ? (
              <Link href="/login">
                <Button
                  size="sm"
                  className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-mono-tech text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            ) : (
              <QuotaBadge />
            )}
            <ThemeToggle />
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full z-10 space-y-6">
          
          {/* Greeting & Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                  [COMMAND CENTER]
                </span>
                <span className="text-xs font-mono-tech text-muted-foreground">ACTIVE CALIBRATION</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {isGuest ? 'Guest' : 'Candidate'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Select an interview engine or resume diagnostic module to continue your prep.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {(isGuest || !user) && (
                <Link href="/login">
                  <Button size="sm" className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-mono-tech text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              )}
              <QuotaBadge />
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Guest Mode Callout Banner */}
          {(isGuest || !user) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground font-mono-tech">
                      EXPLORING IN GUEST SANDBOX
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                      Free Preview
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Resumes and practice sessions in this session are stored locally in your browser. Sign in or create a free account to permanently save your progress and sync across devices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-mono-tech shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In / Register
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
          
          {/* Bento Box Layout */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
          >
            
            {/* Full Interview Simulator Card (Spans 2 cols) */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-emerald-500/40 shadow-xs transition-all"
              onClick={() => setShowDomainModal(true)}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono-tech font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    DOMAIN FOCUS
                  </span>
                </div>
                
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Full Interview Simulator
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-sans">
                  Tailored technical and behavioral interviews. Upload your resume and practice for specific roles across Software, Consulting, Finance, and Quant.
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono-tech text-foreground font-semibold flex items-center gap-1 group-hover:underline">
                  Configure Session <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </span>
                <span className="text-[11px] font-mono-tech text-muted-foreground">7 Tracks Active</span>
              </div>
            </motion.div>

            {/* Mock Case Simulator Card (Spans 2 cols) */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-blue-500/40 shadow-xs transition-all"
              onClick={() => router.push("/interview")}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono-tech font-semibold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                    CORE CASE ENGINE
                  </span>
                </div>
                
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Mock Case Simulator
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-sans">
                  Engage in a hyper-realistic case interview with MBB Partner pushbacks. Work through calculations and frameworks on the live Excalidraw scratchpad.
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono-tech text-foreground font-semibold flex items-center gap-1 group-hover:underline">
                  Initialize Session <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </span>
                <span className="text-[11px] font-mono-tech text-muted-foreground">&lt; 150ms Latency</span>
              </div>
            </motion.div>

            {/* Resume Diagnostics Card */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-primary/40 shadow-xs transition-all"
              onClick={() => router.push("/resume")}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono-tech text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                    DIAGNOSTICS
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Resume Intelligence
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Deep STAR compliance critiques, competence radar, Day 1 placement benchmark diffs, and interactive AI workshop.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border text-xs font-mono-tech text-primary font-medium flex items-center gap-1">
                Analyze PDF <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

            {/* ATS Scorecard Studio Card */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-primary/40 shadow-xs transition-all"
              onClick={() => router.push("/ats-checker")}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono-tech text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                    ATS SUITE
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  ATS & Placement Score
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  5-Pillar score (0–100), 1-page LaTeX line-wrap auditor, IITB policy compliance check, and custom JD matcher.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border text-xs font-mono-tech text-primary font-medium flex items-center gap-1">
                Run ATS Evaluation <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

            {/* Resume Builder Card */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-primary/40 shadow-xs transition-all"
              onClick={() => router.push("/resume-builder")}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono-tech text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                    STUDIO
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Resume Builder & Vault
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Turn raw experiences into high-impact, placement-focused bullets using the Achievement Vault & Domain Pivot.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border text-xs font-mono-tech text-primary font-medium flex items-center gap-1">
                Open Builder <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

            {/* History & Analytics Combined Card */}
            <motion.div 
              variants={itemVariants} 
              className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between group cursor-pointer bg-card border border-border hover:border-primary/40 shadow-xs transition-all"
              onClick={() => router.push("/history")}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono-tech text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                    TELEMETRY
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  History & Session Logs
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Track your growth across every mock session. Review past interview transcripts and historical radar charts.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border text-xs font-mono-tech text-primary font-medium flex items-center gap-1">
                View Past Transcripts <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  )
}
