"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  UploadCloud, AlertCircle, CheckCircle2, ArrowRight, 
  ArrowLeft, MessageSquare, X, Send, Activity, 
  ShieldAlert, Target, Copy, Lightbulb, ChevronDown, 
  ChevronUp, Brain, Columns, List, Crown, Lock, Sparkles, RefreshCw, Loader2 
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { MilestoneProgress } from "@/components/ui/milestone-progress"
import { PaywallModal } from "@/components/paywall-modal"

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
  
  const size = 180;
  const center = size / 2;
  const radius = size * 0.38;
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
        {[0.2, 0.4, 0.6, 0.8, 1].map((factor, idx) => (
          <polygon 
            key={idx}
            points={metrics.map((_, i) => {
              const {x, y} = getCoordinates(factor * 100, i);
              return `${x},${y}`;
            }).join(" ")}
            fill="none" 
            stroke="currentColor" 
            className="text-border"
          />
        ))}
        {metrics.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return <line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" className="text-border" />
        })}
        <polygon points={points} fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={2} className="text-emerald-500" />
        {metrics.map((m, i) => {
          const { x, y } = getCoordinates(m.value, i);
          return <circle key={`dot-${i}`} cx={x} cy={y} r={3.5} fill="currentColor" className="text-emerald-500" />
        })}
      </svg>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[11px] font-mono-tech text-muted-foreground w-full">
        {metrics.map((m, i) => (
          <div key={i} className="p-1 rounded bg-muted/40 border border-border">
            <span className="block font-bold text-foreground">{m.value}%</span>
            <span className="truncate block">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("consult")
  const [resumePhase, setResumePhase] = useState<"internship" | "placement">("placement")
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentMilestone, setCurrentMilestone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"section" | "severity">("section")
  const [mobileView, setMobileView] = useState<"pdf" | "report">("report")
  
  // Section Analysis State
  const [analysisMode, setAnalysisMode] = useState<"full" | "section">("full")
  const [sectionText, setSectionText] = useState("")
  const [sectionType, setSectionType] = useState("experience")
  const [isSectionOnly, setIsSectionOnly] = useState(false)

  // Workshop State
  const [activeWorkshopBullet, setActiveWorkshopBullet] = useState<any | null>(null)
  const [workshopMessages, setWorkshopMessages] = useState<{role: string, content: string}[]>([])
  const [workshopInput, setWorkshopInput] = useState("")
  const [isWorkshopLoading, setIsWorkshopLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedVaultId, setSavedVaultId] = useState<string | null>(null)
  const [expandedBulletDetails, setExpandedBulletDetails] = useState<Record<string, boolean>>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { setResumeText, user, isGuest, guestResumeCount, incrementGuestResume } = useAuthStore()
  const router = useRouter()

  // Paywall Modal State
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallMeta, setPaywallMeta] = useState<{
    title?: string
    description?: string
    limit?: number
    used?: number
    resetAt?: string
    featureKey?: string
  }>({})
  const [entitlement, setEntitlement] = useState<any | null>(null)

  useEffect(() => {
    import("@/lib/billing-api").then(({ fetchUserEntitlement }) => {
      fetchUserEntitlement()
        .then((res) => {
          if (res?.entitlement) {
            setEntitlement(res.entitlement);
          }
        })
        .catch(() => {});
    });
  }, [user]);

  const isProUser = Boolean(
    entitlement?.plan_key?.startsWith("pro") ||
    entitlement?.plan_key === "lifetime" ||
    entitlement?.plan_key === "admin" ||
    entitlement?.is_admin ||
    entitlement?.is_iitb
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [workshopMessages])

  // Initialize expanded sections
  useEffect(() => {
    if (analysisResult?.section_summaries) {
      const initial: Record<string, boolean> = {};
      Object.keys(analysisResult.section_summaries).forEach(sec => {
        initial[sec] = true;
      });
      setExpandedSections(initial);
    }
  }, [analysisResult])

  const toggleSection = (sec: string) => {
    setExpandedSections(prev => ({...prev, [sec]: !prev[sec]}));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.")
        setFile(null)
        setPdfUrl(null)
      } else {
        setFile(selectedFile)
        setPdfUrl(URL.createObjectURL(selectedFile))
        setError(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    if (isGuest && guestResumeCount >= 2) {
      setError("You've reached your free guest limit (2 resumes). Please sign up to continue using InternPrep AI.")
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress(5)
    setCurrentMilestone(0)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const next = prev + (prev < 35 ? 4 : prev < 70 ? 2 : 0.6);
        if (next > 65) setCurrentMilestone(2);
        else if (next > 30) setCurrentMilestone(1);
        return next;
      })
    }, 1200)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target_role", targetRole)
      formData.append("resume_phase", resumePhase)
      if (user?.id) {
        formData.append("user_id", user.id)
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/resume/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === 'object' ? errorData.detail : {}
          setPaywallMeta({
            title: "Resume Analysis Limit Reached",
            description: detail.message || "You have reached your monthly quota for resume analyses. Upgrade to Pro for 30 analyses/month.",
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at
          })
          setPaywallOpen(true)
          clearInterval(progressInterval)
          setIsUploading(false)
          setProgress(0)
          return
        }
        throw new Error(typeof errorData.detail === "string" ? errorData.detail : "Failed to analyze resume")
      }

      const data = await response.json()
      clearInterval(progressInterval)
      setResumeText(data.raw_text)
      setAnalysisResult(data.analysis)
      setIsSectionOnly(data.is_section_only || false)
      setProgress(100)
      setCurrentMilestone(2)
      if (isGuest) {
        incrementGuestResume()
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      setError(err.message || "An unexpected error occurred.")
      setProgress(0)
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
    }
  }

  const handleAnalyzeText = async () => {
    if (!sectionText.trim()) {
      setError("Please paste some text to analyze.")
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress(15)

    try {
      const payload = {
        text: sectionText,
        target_role: targetRole,
        resume_phase: resumePhase,
        section_type: sectionType,
        user_id: user?.id || null
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/resume/analyze-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze text section")
      }

      const data = await response.json()
      setResumeText(data.raw_text)
      setAnalysisResult(data.analysis)
      setIsSectionOnly(data.is_section_only || false)
      setProgress(100)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsUploading(false)
    }
  }

  const startWorkshop = (bullet: any) => {
    setActiveWorkshopBullet(bullet)
    setWorkshopMessages([])
    setWorkshopInput("")
    sendWorkshopMessage("Hi, I need help upgrading this bullet point to match Day 1 standards.", bullet, [])
  }

  const sendWorkshopMessage = async (content: string, bullet = activeWorkshopBullet, history = workshopMessages) => {
    if (!content.trim() || !bullet) return
    
    const newHistory = [...history, { role: "user", content }]
    if (content !== "Hi, I need help upgrading this bullet point to match Day 1 standards.") {
      setWorkshopMessages(newHistory)
      setWorkshopInput("")
    }
    
    setIsWorkshopLoading(true)
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/resume/workshop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_bullet: bullet.original_bullet,
          section_type: bullet.section_type || "experience",
          target_role: targetRole,
          resume_phase: resumePhase,
          messages: newHistory
        })
      })
      
      if (!res.ok) throw new Error("Workshop request failed")
      
      const data = await res.json()
      setWorkshopMessages(prev => [...prev, { role: "model", content: data.response }])
    } catch (err) {
      setWorkshopMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsWorkshopLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToVault = (bullet: any, id: string) => {
    setSavedVaultId(id);
    setTimeout(() => setSavedVaultId(null), 2000);
  };

  const toggleBulletDetails = (key: string) => {
    setExpandedBulletDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getSeverityConfig = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical':
        return {
          label: 'CRITICAL FIX REQUIRED',
          cardBorder: 'border-l-4 border-l-red-500',
          badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          draftBg: 'bg-red-500/5 dark:bg-red-500/10 border-red-500/25 text-foreground',
          draftLabel: 'RAW DRAFT (NEEDS CRITICAL REVISION):',
          draftLabelColor: 'text-red-600 dark:text-red-400',
          isGood: false
        };
      case 'major':
        return {
          label: 'MAJOR UPGRADE SUGGESTED',
          cardBorder: 'border-l-4 border-l-amber-500',
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          draftBg: 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/25 text-foreground',
          draftLabel: 'RAW DRAFT (HIGH IMPACT POTENTIAL):',
          draftLabelColor: 'text-amber-600 dark:text-amber-400',
          isGood: false
        };
      case 'minor':
        return {
          label: 'MINOR POLISH RECOMMENDED',
          cardBorder: 'border-l-4 border-l-blue-500',
          badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          draftBg: 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 text-foreground',
          draftLabel: 'RAW DRAFT (MINOR TWEAKS SUGGESTED):',
          draftLabelColor: 'text-blue-600 dark:text-blue-400',
          isGood: false
        };
      default:
        return {
          label: 'VERIFIED STRONG - DAY 1 PASS',
          cardBorder: 'border-l-4 border-l-emerald-500',
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          draftBg: 'bg-muted/30 border-border/80 text-foreground',
          draftLabel: 'ORIGINAL BULLET (DAY 1 BENCHMARK PASSED):',
          draftLabelColor: 'text-emerald-600 dark:text-emerald-400',
          isGood: true
        };
    }
  };

  // Calculate stats
  const totalBullets = analysisResult?.bullets?.length || 0
  const metricsCount = analysisResult?.bullets?.filter((b: any) => b.severity === 'good' || !b.metrics_hint).length || 0
  const structuralIssues = analysisResult?.bullets?.reduce((acc: number, b: any) => acc + (b.structural_issues?.length || 0), 0) || 0
  const healthScore = analysisResult?.radar_scores ? Math.round(Object.values(analysisResult.radar_scores as Record<string, number>).reduce((a: any, b: any) => a + b, 0) / 6) : 0

  const groupedBullets = analysisResult?.bullets?.reduce((acc: any, bullet: any) => {
    const key = viewMode === "section" ? (bullet.section_type || "other") : (bullet.severity || "good");
    if (!acc[key]) acc[key] = [];
    acc[key].push(bullet);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col transition-colors">
      
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

          {analysisResult && (
            <div className="flex md:hidden p-0.5 rounded-md bg-muted border border-border text-[11px] font-mono-tech">
              <button
                onClick={() => setMobileView("report")}
                className={`px-2.5 py-1 rounded transition-all ${mobileView === "report" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"}`}
              >
                Scorecard
              </button>
              <button
                onClick={() => setMobileView("pdf")}
                className={`px-2.5 py-1 rounded transition-all ${mobileView === "pdf" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"}`}
              >
                Source PDF
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/ats-checker")}
              className="hidden sm:flex text-xs h-8 font-mono-tech border-border"
            >
              Open ATS Checker →
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`container mx-auto px-4 sm:px-6 relative z-10 ${!analysisResult ? 'py-12 max-w-3xl' : 'py-6 max-w-[1600px] flex-1 flex flex-col'}`}>
        
        {/* Title */}
        <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [RESUME AUDIT]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">ADAPTIVE RAG BENCHMARKING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Resume Intelligence & Diagnostics
            </h1>
          </div>

          {analysisResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setAnalysisResult(null); setFile(null); setPdfUrl(null); }}
              className="text-xs font-mono-tech h-8 border-border self-start sm:self-auto"
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Analyze Another PDF
            </Button>
          )}
        </div>

        {/* Upload Form */}
        {!analysisResult ? (
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Upload Candidate Resume</h2>
              <p className="text-xs text-muted-foreground">Supported format: PDF up to 5MB. Evaluated against Day 1 placement cohorts.</p>
            </div>

            {/* Target Role & Phase */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground mb-1.5 block">Target Domain Benchmark</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isUploading}
                >
                  <option value="consult">Management Consulting (McKinsey, BCG, Bain)</option>
                  <option value="finance">Finance & Quantitative Trading</option>
                  <option value="product management">Product Management</option>
                  <option value="analytics">Data Science & Analytics</option>
                  <option value="it-software">Software Engineering & Systems</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground mb-1.5 block">Placement Stage</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResumePhase("internship")}
                    className={`h-10 rounded-lg text-xs font-mono-tech font-semibold border transition-all ${resumePhase === "internship" ? "bg-muted text-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    Internship Drive
                  </button>
                  <button
                    onClick={() => setResumePhase("placement")}
                    className={`h-10 rounded-lg text-xs font-mono-tech font-semibold border transition-all ${resumePhase === "placement" ? "bg-muted text-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    Final Placement
                  </button>
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center transition-colors bg-muted/20 cursor-pointer">
              <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-semibold text-xs text-foreground mb-1">Click or drag & drop PDF resume here</p>
              <p className="text-[11px] text-muted-foreground">Standard 1-page or 2-page formats supported</p>
              <input 
                type="file" 
                accept="application/pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {file && (
                <div className="mt-3 px-3 py-1.5 bg-card border border-border rounded-md inline-flex items-center gap-2 text-xs font-mono-tech text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              )}
            </div>

            {/* Milestone Progress Loading State */}
            {isUploading && (
              <MilestoneProgress 
                milestones={[
                  "Ingesting layout & text geometry",
                  "Vector matching Day 1 rubrics",
                  "Generating Google XYZ diffs"
                ]}
                currentMilestoneIndex={currentMilestone}
                percentage={progress}
                label="Executing Deep Multimodal Analysis"
              />
            )}

            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              className="w-full h-11 text-xs font-semibold font-mono-tech bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all"
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? "Processing Neural Audit..." : "Run Comprehensive Resume Analysis →"}
            </Button>
          </div>
        ) : (
          /* Results View */
          <div className="flex flex-1 min-h-0 border-t border-border pt-4 gap-6">
            
            {/* PDF Viewer Panel (Desktop or Active Mobile) */}
            <div className={`w-full lg:w-[38%] flex-col border-r border-border pr-4 ${mobileView === "pdf" ? "flex" : "hidden lg:flex"}`}>
              <div className="w-full h-full rounded-xl border border-border bg-card overflow-hidden p-2 flex flex-col">
                <div className="text-xs font-mono-tech text-muted-foreground pb-2 px-2 border-b border-border flex justify-between">
                  <span>SOURCE PDF PREVIEW</span>
                  <span className="text-foreground font-semibold">100% Extracted</span>
                </div>
                <div className="flex-1 mt-2 rounded-lg overflow-hidden bg-muted/40">
                  {pdfUrl ? (
                    <iframe src={pdfUrl} className="w-full h-full border-0" title="Resume PDF" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs font-mono-tech text-muted-foreground">
                      PDF Preview Unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Report */}
            <div className={`flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-16 ${mobileView === "report" ? "block" : "hidden lg:block"}`}>
              
              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border text-center shadow-xs">
                  <Activity className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                  <div className="text-2xl font-bold font-mono-tech text-foreground">{healthScore}%</div>
                  <div className="text-[10px] font-mono-tech uppercase text-muted-foreground">Overall Health</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center shadow-xs">
                  <Target className="h-5 w-5 mx-auto mb-1.5 text-emerald-500" />
                  <div className="text-2xl font-bold font-mono-tech text-foreground">{metricsCount} / {totalBullets}</div>
                  <div className="text-[10px] font-mono-tech uppercase text-muted-foreground">Quantified</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center shadow-xs">
                  <AlertCircle className="h-5 w-5 mx-auto mb-1.5 text-amber-500" />
                  <div className="text-2xl font-bold font-mono-tech text-amber-600 dark:text-amber-400">{structuralIssues}</div>
                  <div className="text-[10px] font-mono-tech uppercase text-muted-foreground">Structural Gaps</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center shadow-xs">
                  <ShieldAlert className="h-5 w-5 mx-auto mb-1.5 text-red-500" />
                  <div className="text-2xl font-bold font-mono-tech text-red-600 dark:text-red-400">{totalBullets - metricsCount}</div>
                  <div className="text-[10px] font-mono-tech uppercase text-muted-foreground">Vague Bullets</div>
                </div>
              </div>

              {/* Radar Chart & Architecture Grid */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="p-5 rounded-xl bg-card border border-border flex flex-col justify-between shadow-xs">
                  <div className="text-xs font-mono-tech text-muted-foreground uppercase mb-2">Competence Radar Matrix</div>
                  <RadarChart scores={analysisResult.radar_scores} />
                </div>

                <div className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono-tech text-muted-foreground uppercase mb-1">Architecture Feedback</div>
                    <p className="text-xs text-foreground leading-relaxed font-sans">{analysisResult.overall_feedback}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs">
                    <div className="font-mono-tech text-[10px] text-muted-foreground uppercase">Day 1 Placement Comparison</div>
                    <p className="text-xs text-foreground italic mt-1 font-sans">{analysisResult.day1_comparison}</p>
                  </div>
                </div>
              </div>

              {/* Deep Bullet Diffs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-sm font-bold font-mono-tech uppercase text-foreground">
                    Deep Bullet-by-Bullet Analysis
                  </h3>
                  <div className="flex gap-2 text-xs font-mono-tech">
                    <button
                      onClick={() => setViewMode("section")}
                      className={`px-2 py-1 rounded text-[11px] ${viewMode === "section" ? "bg-card border border-border text-foreground font-bold" : "text-muted-foreground"}`}
                    >
                      By Section
                    </button>
                    <button
                      onClick={() => setViewMode("severity")}
                      className={`px-2 py-1 rounded text-[11px] ${viewMode === "severity" ? "bg-card border border-border text-foreground font-bold" : "text-muted-foreground"}`}
                    >
                      By Severity
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedBullets).map(([sectionName, bullets]: [string, any]) => (
                    <div key={sectionName} className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                      <div 
                        className="p-3.5 bg-muted/40 flex items-center justify-between cursor-pointer text-xs font-mono-tech text-foreground"
                        onClick={() => toggleSection(sectionName)}
                      >
                        <span className="font-bold uppercase">{sectionName} ({bullets.length})</span>
                        {expandedSections[sectionName] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>

                      {expandedSections[sectionName] && (
                        <div className="p-4 space-y-4">
                          {bullets.map((b: any, idx: number) => {
                            const isBlurred = !isProUser && idx > 0;
                            const config = getSeverityConfig(b.severity);
                            const rewriteText = b.suggested_rewrite || "";
                            const bulletKey = `${sectionName}-${idx}`;
                            const isCopied = copiedId === bulletKey;
                            const isSaved = savedVaultId === bulletKey;
                            const isExpanded = Boolean(expandedBulletDetails[bulletKey]);

                            return (
                              <div 
                                key={idx} 
                                className={`p-5 rounded-xl border border-border bg-card space-y-3.5 relative transition-all hover:border-border/80 shadow-xs ${config.cardBorder} ${
                                  isBlurred ? "filter blur-[5px] select-none pointer-events-none opacity-40" : ""
                                }`}
                              >
                                {/* Header Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold border border-border text-[10px] uppercase">
                                      {b.section_type || sectionName}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${config.badgeBg}`}>
                                      {config.label}
                                    </span>
                                    {b.action_verb_rating && (
                                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                                        b.action_verb_rating === 'weak' 
                                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                                          : b.action_verb_rating === 'moderate'
                                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      }`}>
                                        VERB: {b.action_verb_rating.toUpperCase()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {config.isGood && (
                                      <button
                                        onClick={() => handleCopy(b.original_bullet, bulletKey)}
                                        className={`px-2.5 py-1 rounded text-xs font-mono-tech flex items-center gap-1 transition-all ${
                                          isCopied
                                            ? "bg-emerald-600 text-white font-bold"
                                            : "bg-card hover:bg-muted text-foreground border border-border"
                                        }`}
                                      >
                                        {isCopied ? (
                                          <>
                                            <CheckCircle2 className="h-3 w-3" /> Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3" /> Copy Point
                                          </>
                                        )}
                                      </button>
                                    )}

                                    <button
                                      onClick={() => startWorkshop(b)}
                                      className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono-tech flex items-center gap-1 border border-emerald-500/20 font-semibold transition-colors"
                                    >
                                      <Brain className="h-3.5 w-3.5" /> AI Rewrite Workshop →
                                    </button>
                                  </div>
                                </div>

                                {/* Raw / Original Bullet Display */}
                                <div className={`p-3.5 rounded-lg border text-xs font-sans space-y-1 ${config.draftBg}`}>
                                  <span className={`text-[10px] font-mono-tech block font-bold tracking-wider ${config.draftLabelColor}`}>
                                    {config.draftLabel}
                                  </span>
                                  <p className="leading-relaxed">{b.original_bullet}</p>
                                </div>

                                {/* Rule Breaks & Structural Issues (for items needing fix) */}
                                {((b.structural_issues && b.structural_issues.length > 0) || (b.best_practice_violations && b.best_practice_violations.length > 0)) && (
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {b.structural_issues?.map((issue: string, i: number) => (
                                      <span key={`struct-${i}`} className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-mono-tech font-semibold flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {issue}
                                      </span>
                                    ))}
                                    {b.best_practice_violations?.map((violation: string, i: number) => (
                                      <span key={`viol-${i}`} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-mono-tech flex items-center gap-1">
                                        <ShieldAlert className="h-3 w-3" /> {violation}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Benchmark Golden Rewrite (Directly visible for non-good points, or if rewrite differs) */}
                                {rewriteText && !config.isGood && (
                                  <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-mono-tech">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> TIER-1 BENCHMARK REWRITE:
                                      </span>
                                      
                                      {/* Action Buttons: Copy & Save */}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleCopy(rewriteText, bulletKey)}
                                          className={`px-2.5 py-1 rounded text-xs font-mono-tech flex items-center gap-1 transition-all ${
                                            isCopied
                                              ? "bg-emerald-600 text-white font-bold"
                                              : "bg-card hover:bg-muted text-foreground border border-border"
                                          }`}
                                        >
                                          {isCopied ? (
                                            <>
                                              <CheckCircle2 className="h-3 w-3" /> Copied!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3 w-3" /> Copy Point
                                            </>
                                          )}
                                        </button>

                                        <button
                                          onClick={() => handleSaveToVault(b, bulletKey)}
                                          className={`p-1 rounded text-xs transition-all ${
                                            isSaved
                                              ? "bg-blue-600 text-white"
                                              : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                                          }`}
                                          title="Save to Point Vault"
                                        >
                                          <Sparkles className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <p className="font-medium text-foreground leading-relaxed">{rewriteText}</p>
                                  </div>
                                )}

                                {/* Collapsible Toggle for Deep Details & Critique */}
                                <div>
                                  <button
                                    onClick={() => toggleBulletDetails(bulletKey)}
                                    className="text-[11px] font-mono-tech text-muted-foreground hover:text-foreground flex items-center gap-1 pt-1 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="h-3.5 w-3.5" /> Hide Diagnostic Details
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-3.5 w-3.5" /> View Diagnostic Details & Reasoning
                                      </>
                                    )}
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-border/60 space-y-3 animate-in fade-in-50 duration-150">
                                      {/* Diagnostic Critique */}
                                      {b.critique && (
                                        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                                          <span className="font-mono-tech font-semibold text-foreground">[DIAGNOSTIC CRITIQUE]</span> {b.critique}
                                        </p>
                                      )}

                                      {/* Action Verb Power Alternatives */}
                                      {b.action_verb_alternatives && b.action_verb_alternatives.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono-tech">
                                          <span className="text-muted-foreground text-[11px]">POWER VERB ALTERNATIVES:</span>
                                          {b.action_verb_alternatives.map((verb: string, vIdx: number) => (
                                            <span key={vIdx} className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px] font-bold border border-border">
                                              {verb}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* Metric Guidance Hint */}
                                      {b.metrics_hint && (
                                        <div className="p-2.5 rounded-md bg-muted/40 border border-border text-xs font-sans text-muted-foreground flex items-start gap-2">
                                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                          <span><strong className="font-mono-tech text-foreground text-[11px]">METRIC GUIDANCE:</strong> {b.metrics_hint}</span>
                                        </div>
                                      )}

                                      {/* Benchmark Alignment Quote (if present) */}
                                      {b.golden_comparison && (
                                        <div className="p-2.5 rounded-md bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-muted-foreground">
                                          <strong className="font-mono-tech text-emerald-600 dark:text-emerald-400 text-[11px] block mb-0.5">DAY 1 BENCHMARK ALIGNMENT:</strong>
                                          <span className="text-foreground">{b.golden_comparison}</span>
                                        </div>
                                      )}

                                      {/* Predicted Interviewer Question */}
                                      {b.predicted_questions && b.predicted_questions.length > 0 && (
                                        <div className="p-3 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs font-mono-tech text-foreground space-y-1">
                                          <div className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                                            <ShieldAlert className="h-3.5 w-3.5" /> PREDICTED INTERVIEWER CROSS-QUESTION
                                          </div>
                                          <p className="text-muted-foreground font-sans text-xs">
                                            "{b.predicted_questions[0]}"
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>    )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* AI Workshop Drawer */}
      {activeWorkshopBullet && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between text-xs font-mono-tech text-foreground">
            <span className="font-bold flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-primary" /> Bullet Co-Pilot Workshop
            </span>
            <button onClick={() => setActiveWorkshopBullet(null)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs font-sans">
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
              <div className="text-[10px] font-mono-tech text-muted-foreground uppercase">Target Original Bullet</div>
              <p className="text-foreground italic">"{activeWorkshopBullet.original_bullet}"</p>
            </div>

            {workshopMessages.map((m, idx) => (
              <div key={idx} className={`p-3 rounded-lg text-xs ${m.role === 'user' ? 'bg-primary/10 text-foreground border border-primary/20 ml-4' : 'bg-muted/40 text-foreground border border-border mr-4'}`}>
                {m.content}
              </div>
            ))}

            {isWorkshopLoading && (
              <div className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synthesizing rewrite...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              placeholder="Suggest metric or clarify context..."
              value={workshopInput}
              onChange={(e) => setWorkshopInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendWorkshopMessage(workshopInput)}
              className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-xs text-foreground outline-none focus:border-primary"
            />
            <Button size="sm" onClick={() => sendWorkshopMessage(workshopInput)} className="h-9 px-3 text-xs bg-primary text-primary-foreground">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {paywallOpen && (
        <PaywallModal 
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          title={paywallMeta.title}
          description={paywallMeta.description}
          limit={paywallMeta.limit}
          used={paywallMeta.used}
          resetAt={paywallMeta.resetAt}
        />
      )}
    </div>
  )
}
