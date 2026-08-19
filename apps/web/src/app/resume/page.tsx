"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  UploadCloud, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, MessageSquare, 
  X, Send, Activity, ShieldAlert, Target, Copy, Lightbulb, ChevronDown, ChevronUp, 
  Brain, Columns, List, Sparkles, FileText, CheckSquare, Zap, AlertTriangle, 
  ShieldCheck, Gauge, Layers, Info, ExternalLink, RefreshCw, Check, Search, Wand2
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreatorBadge } from "@/components/creator-badge"

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

// Master Radial Gauge Component for ATS Score
const MasterScoreGauge = ({ score, tier, mode }: { score: number, tier: string, mode: string }) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 85) return { stroke: "stroke-emerald-500", text: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
    if (score >= 72) return { stroke: "stroke-blue-500", text: "text-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" };
    if (score >= 58) return { stroke: "stroke-amber-500", text: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" };
    return { stroke: "stroke-rose-500", text: "text-rose-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" };
  };

  const colors = getColor();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20 shadow-sm">
      <div className="relative flex items-center justify-center">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            className="text-black/5 dark:text-white/10"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tracking-tight ${colors.text}`}>{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OUT OF 100</span>
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Badge className={`px-3 py-1 font-semibold text-xs border ${colors.badge}`}>
            {tier}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {mode === "iitb_placement" ? "🎓 IITB Placement Day 1 Standard" : "🏢 Global Corporate ATS Standard"}
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {score >= 85 
            ? "Exceptional Resume Profile — High Shortlist Potential" 
            : score >= 72 
            ? "Solid Foundation — Target Polish Recommended" 
            : score >= 58 
            ? "Moderate Alignment — Key Fixes Needed" 
            : "Significant Formatting & Metric Gaps Detected"}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {mode === "iitb_placement" 
            ? "Calibrated for IIT Bombay placement shortlisting: evaluating 1-page line budget, CPI & scholastic spikes, metric density, and domain-specific section weighting."
            : "Calibrated for Enterprise ATS systems (Workday, Greenhouse, Eightfold): evaluating text extractability, keyword semantic match, power verbs, and structural hygiene."}
        </p>
      </div>
    </div>
  );
};

export default function ResumePage() {
  // Primary Goal Selector at Start
  const [primaryIntent, setPrimaryIntent] = useState<"improve" | "ats">("improve")

  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("consulting")
  const [resumePhase, setResumePhase] = useState<"internship" | "placement">("placement")
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"section" | "severity">("section")
  
  // Section Analysis State
  const [analysisMode, setAnalysisMode] = useState<"full" | "section">("full")
  const [sectionText, setSectionText] = useState("")
  const [sectionType, setSectionType] = useState("experience")
  const [isSectionOnly, setIsSectionOnly] = useState(false)

  // ATS Studio State
  const [activeTab, setActiveTab] = useState<"diagnostic" | "ats">("diagnostic")
  const [atsMode, setAtsMode] = useState<"iitb_placement" | "global_ats">("iitb_placement")
  const [atsReport, setAtsReport] = useState<any | null>(null)
  const [isATSLoading, setIsATSLoading] = useState(false)
  const [customJD, setCustomJD] = useState("")
  const [showJDInput, setShowJDInput] = useState(false)
  const [atsSubView, setAtsSubView] = useState<"overview" | "keywords" | "line_wrap" | "raw_text">("overview")
  
  // 1-Click Bullet Fix State
  const [bulletToFix, setBulletToFix] = useState<any | null>(null)
  const [fixType, setFixType] = useState<string>("trim_line_wrap")
  const [missingKeywordToInject, setMissingKeywordToInject] = useState<string>("")
  const [isFixingBullet, setIsFixingBullet] = useState(false)
  const [fixedBulletResult, setFixedBulletResult] = useState<any | null>(null)
  const [copiedBullet, setCopiedBullet] = useState<boolean>(false)

  // Workshop State
  const [activeWorkshopBullet, setActiveWorkshopBullet] = useState<any | null>(null)
  const [workshopMessages, setWorkshopMessages] = useState<{role: string, content: string}[]>([])
  const [workshopInput, setWorkshopInput] = useState("")
  const [isWorkshopLoading, setIsWorkshopLoading] = useState(false)
  const [finalWorkshopBullet, setFinalWorkshopBullet] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { resumeText, setResumeText, user, isGuest, guestResumeCount, incrementGuestResume } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [workshopMessages])

  // Initialize expanded sections when analysis is loaded
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

  // Unified Analysis & ATS Checker Runner
  const handleUpload = async () => {
    if (!file) return

    if (isGuest && guestResumeCount >= 2) {
      setError("You've reached your free guest limit (2 resumes). Please sign up to continue using InternPrep AI.")
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress(5)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const increment = prev < 40 ? 5 : prev < 75 ? 2 : 0.5;
        return prev + increment;
      })
    }, 2000)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target_role", targetRole)
      formData.append("resume_phase", resumePhase)
      if (user?.id) {
        formData.append("user_id", user.id)
      }

      const atsFormData = new FormData()
      atsFormData.append("file", file)
      atsFormData.append("target_role", targetRole)
      atsFormData.append("mode", atsMode)
      if (customJD.trim()) {
        atsFormData.append("job_description", customJD.trim())
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      // Run Deep Diagnostic & ATS Check in parallel
      const [diagRes, atsRes] = await Promise.allSettled([
        fetch(`${API_URL}/resume/analyze`, { method: "POST", body: formData }),
        fetch(`${API_URL}/resume/ats-check`, { method: "POST", body: atsFormData })
      ])

      clearInterval(progressInterval)

      if (diagRes.status === "fulfilled" && diagRes.value.ok) {
        const data = await diagRes.value.json()
        setResumeText(data.raw_text)
        setAnalysisResult(data.analysis)
        setIsSectionOnly(data.is_section_only || false)
      }

      if (atsRes.status === "fulfilled" && atsRes.value.ok) {
        const atsData = await atsRes.value.json()
        setAtsReport(atsData)
      } else if (diagRes.status === "rejected" || !diagRes.value.ok) {
        throw new Error("Failed to process resume. Please try again.")
      }

      // Default active tab based on user's primary intent
      setActiveTab(primaryIntent === "ats" ? "ats" : "diagnostic")
      setProgress(100)
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

  // Standalone ATS Re-Checker (for Mode Switch or JD Match)
  const handleRerunATS = async (newRole?: string, newMode?: "iitb_placement" | "global_ats", newJD?: string) => {
    setIsATSLoading(true)
    try {
      const formData = new FormData()
      if (file) {
        formData.append("file", file)
      } else if (resumeText) {
        formData.append("raw_text", resumeText)
      } else {
        return
      }

      formData.append("target_role", newRole || targetRole)
      formData.append("mode", newMode || atsMode)
      const jdToSend = newJD !== undefined ? newJD : customJD
      if (jdToSend.trim()) {
        formData.append("job_description", jdToSend.trim())
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/resume/ats-check`, {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setAtsReport(data)
      }
    } catch (e) {
      console.error("Error re-running ATS check:", e)
    } finally {
      setIsATSLoading(false)
    }
  }

  // 1-Click AI Bullet Refiner Handler
  const handleExecuteBulletFix = async () => {
    if (!bulletToFix) return
    setIsFixingBullet(true)
    setFixedBulletResult(null)
    setCopiedBullet(false)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const payload = {
        bullet_text: bulletToFix.bullet_text || bulletToFix,
        fix_type: fixType,
        target_role: targetRole,
        mode: atsMode,
        missing_keyword: missingKeywordToInject || undefined,
        target_length: bulletToFix.target_trim_chars || undefined
      }

      const res = await fetch(`${API_URL}/resume/ats-fix-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        setFixedBulletResult(data)
      }
    } catch (e) {
      console.error("Error refining bullet:", e)
    } finally {
      setIsFixingBullet(false)
    }
  }

  const handleAnalyzeText = async () => {
    if (!sectionText.trim()) {
      setError("Please paste some text to analyze.")
      return
    }

    if (isGuest && guestResumeCount >= 2) {
      setError("You've reached your free guest limit (2 resumes). Please sign up to continue using InternPrep AI.")
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress(5)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const increment = prev < 40 ? 5 : prev < 75 ? 2 : 0.5;
        return prev + increment;
      })
    }, 2000)

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
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to analyze section")
      }

      const data = await response.json()
      clearInterval(progressInterval)
      setResumeText(data.raw_text)
      setAnalysisResult(data.analysis)
      setIsSectionOnly(true)

      // Also generate ATS report for this section
      const atsFormData = new FormData()
      atsFormData.append("raw_text", sectionText)
      atsFormData.append("target_role", targetRole)
      atsFormData.append("mode", atsMode)
      
      fetch(`${API_URL}/resume/ats-check`, { method: "POST", body: atsFormData })
        .then(r => r.ok ? r.json() : null)
        .then(atsData => { if (atsData) setAtsReport(atsData) })

      setActiveTab(primaryIntent === "ats" ? "ats" : "diagnostic")
      setProgress(100)
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

  const startWorkshop = (bullet: any, isOverall = false) => {
    setActiveWorkshopBullet(bullet)
    setWorkshopMessages([])
    setFinalWorkshopBullet(null)
    setWorkshopInput("")
    
    const initialPrompt = isOverall 
      ? "Let's optimize your overall resume. What specific area or target industry would you like to discuss?" 
      : `Let's optimize this bullet point: "${bullet.original_bullet}". What additional context or metrics can you provide?`;
    
    setWorkshopMessages([{ role: "assistant", content: initialPrompt }])
  }

  const sendWorkshopMessage = async (userMsg: string, bullet: any, currentMessages: any[], overallCtx: any = null) => {
    if (!userMsg.trim()) return;
    
    const newMessages = [...currentMessages, { role: "user", content: userMsg }];
    setWorkshopMessages(newMessages);
    setWorkshopInput("");
    setIsWorkshopLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const payload = {
        original_bullet: bullet.original_bullet,
        section_type: bullet.section_type || "experience",
        target_role: targetRole,
        resume_phase: resumePhase,
        messages: newMessages,
        overall_context: overallCtx
      };
      
      const response = await fetch(`${API_URL}/resume/workshop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Workshop turn failed");
      
      const data = await response.json();
      setWorkshopMessages([...newMessages, { role: "assistant", content: data.reply }]);
      if (data.final_bullet) {
        setFinalWorkshopBullet(data.final_bullet);
      }
    } catch (err) {
      console.error(err);
      setWorkshopMessages([...newMessages, { role: "assistant", content: "Sorry, I had trouble connecting to the workshop engine. Please try again." }]);
    } finally {
      setIsWorkshopLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-foreground/90">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const getSeverityColors = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-800 dark:text-red-400', edge: 'bg-red-500' };
      case 'major': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-800 dark:text-amber-400', edge: 'bg-amber-500' };
      case 'minor': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-800 dark:text-yellow-400', edge: 'bg-yellow-400' };
      case 'good': 
      default: return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-800 dark:text-green-400', edge: 'bg-green-500' };
    }
  }

  const getVerbColors = (rating: string) => {
    switch(rating?.toLowerCase()) {
      case 'strong': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'moderate': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'weak': 
      default: return 'bg-red-500/20 text-red-700 dark:text-red-400';
    }
  }

  // Calculate stats for Diagnostic
  const totalBullets = analysisResult?.bullets?.length || 0
  const metricsCount = analysisResult?.bullets?.filter((b: any) => b.severity === 'good' || !b.metrics_hint).length || 0
  const structuralIssues = analysisResult?.bullets?.reduce((acc: number, b: any) => acc + (b.structural_issues?.length || 0), 0) || 0
  const ruleViolations = analysisResult?.bullets?.reduce((acc: number, b: any) => acc + (b.best_practice_violations?.length || 0), 0) || 0
  const healthScore = analysisResult?.radar_scores ? Math.round(Object.values(analysisResult.radar_scores as Record<string, number>).reduce((a: any, b: any) => a + b, 0) / 6) : 0

  // Group bullets for Diagnostic
  const groupedBullets = analysisResult?.bullets?.reduce((acc: any, bullet: any) => {
    const key = viewMode === "section" 
      ? (bullet.section_type || "other") 
      : (bullet.severity || "good");
    if (!acc[key]) acc[key] = [];
    acc[key].push(bullet);
    return acc;
  }, {}) || {};

  const severityOrder = ["critical", "major", "minor", "good"];
  const sortedGroupKeys = Object.keys(groupedBullets || {}).sort((a, b) => {
    if (viewMode === "severity") {
      return severityOrder.indexOf(a) - severityOrder.indexOf(b);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className={`flex-1 transition-all duration-300 ${activeWorkshopBullet ? 'mr-[400px]' : ''}`}>
        <header className="border-b border-black/5 dark:border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Command Center
            </Button>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/resume-builder")} 
                className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Sparkles className="h-4 w-4" /> Point Bank & Studio
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className={`container mx-auto px-4 md:px-8 relative z-10 ${!analysisResult && !atsReport ? 'py-10 max-w-4xl' : 'py-6 max-w-[1600px] h-[calc(100vh-56px)] flex flex-col'}`}>
          
          {/* Header Title Banner */}
          <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold">
                  Placement & AI Intelligence Suite
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Resume Intelligence & Scoring Center</h1>
              <p className="text-muted-foreground text-sm">
                Get comprehensive line-by-line critiques, AI bullet rewrites, and dual-calibrated ATS shortlisting scores.
              </p>
            </div>

            {/* Results Switcher Tabs */}
            {(analysisResult || atsReport) && (
              <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/10">
                <button
                  onClick={() => setActiveTab("diagnostic")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "diagnostic" 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  🔍 Deep Diagnostic & Workshop
                </button>
                <button
                  onClick={() => setActiveTab("ats")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "ats" 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Gauge className="h-4 w-4" />
                  🎯 ATS & Placement Scorecard
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* INITIAL STATE: TWO CLEAN CARDS ASKING WHAT THE USER WANTS TO DO           */}
          {/* ========================================================================= */}
          {!analysisResult && !atsReport ? (
            <div className="space-y-8 max-w-3xl mx-auto">
              
              {/* Step 1: 2 Prominent Intent Selection Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                  Select What You Want To Do
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Improve & Diagnose Resume */}
                  <button
                    type="button"
                    onClick={() => setPrimaryIntent("improve")}
                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      primaryIntent === "improve"
                        ? "bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary shadow-lg ring-2 ring-primary/20"
                        : "glass-panel hover:border-primary/40 bg-muted/10 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${primaryIntent === "improve" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Wand2 className="h-5 w-5" />
                        </div>
                        {primaryIntent === "improve" && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold">
                            Active
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">
                        🔍 Improve & Polish My Resume
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Full diagnostic with line-by-line STAR critiques, radar competencies, Day-1 placement comparison, and live interactive AI bullet workshop.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center text-[11px] font-semibold text-primary">
                      <span>Phase Selection + Deep Diagnostic</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </div>
                  </button>

                  {/* Card 2: ATS & Placement Scorecard */}
                  <button
                    type="button"
                    onClick={() => setPrimaryIntent("ats")}
                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      primaryIntent === "ats"
                        ? "bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary shadow-lg ring-2 ring-primary/20"
                        : "glass-panel hover:border-primary/40 bg-muted/10 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${primaryIntent === "ats" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Gauge className="h-5 w-5" />
                        </div>
                        {primaryIntent === "ats" && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold">
                            Active
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">
                        🎯 Check ATS & Placement Score
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        5-Pillar ATS scoring (0–100), 1-page LaTeX line wrap overflow auditor, IITB policy compliance check, and custom Job Description skill matcher.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center text-[11px] font-semibold text-primary">
                      <span>Dual ATS Benchmark + Line Wrap Auditor</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </div>
                  </button>

                </div>
              </div>

              {/* Step 2: Dedicated Form for the Selected Option */}
              <div className="glass-panel dark:bg-neutral-900/40 rounded-3xl p-6 md:p-8 border border-black/5 dark:border-white/10 shadow-xl space-y-6">
                
                {/* ------------------------------------------------------------------ */}
                {/* FORM A: RESUME IMPROVEMENT FLOW (Exact Previous Clean Form)        */}
                {/* ------------------------------------------------------------------ */}
                {primaryIntent === "improve" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-black/5 dark:border-white/5 pb-4">
                      <h3 className="text-lg font-bold text-foreground">Configure Resume Diagnostic</h3>
                      <p className="text-xs text-muted-foreground">Select your current stage and role to calibrate placement suggestions.</p>
                    </div>

                    {/* Resume Phase Selection (Preserved as requested) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Resume Phase</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                            resumePhase === 'internship' 
                              ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                              : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                          }`}
                          onClick={() => setResumePhase('internship')}
                          disabled={isUploading}
                        >
                          Internship Season
                        </button>
                        <button
                          type="button"
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                            resumePhase === 'placement' 
                              ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                              : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                          }`}
                          onClick={() => setResumePhase('placement')}
                          disabled={isUploading}
                        >
                          Final Placement Season (Day 1 / Day 2)
                        </button>
                      </div>
                    </div>

                    {/* Target Role Benchmark */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Target Role Benchmark</label>
                      <div className="relative">
                        <select 
                          className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer text-foreground"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          disabled={isUploading}
                        >
                          <option value="consulting">Management Consulting (McKinsey, BCG, Bain, AT Kearney)</option>
                          <option value="software">Software Engineering / IT (Google, Microsoft, Amazon, Uber)</option>
                          <option value="product_management">Product Management (Flipkart, Swiggy, Razorpay, Uber)</option>
                          <option value="finance">Finance & Quant (Goldman Sachs, Morgan Stanley, Citadel, JP Morgan)</option>
                          <option value="analytics">Data Science & Analytics (Fractal, Tiger, EXL, American Express)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                          <ChevronDown className="h-5 w-5 opacity-50" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* FORM B: ATS SCORECARD FLOW                                         */}
                {/* ------------------------------------------------------------------ */}
                {primaryIntent === "ats" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-black/5 dark:border-white/5 pb-4">
                      <h3 className="text-lg font-bold text-foreground">Configure ATS & Placement Audit</h3>
                      <p className="text-xs text-muted-foreground">Select evaluation standard and optionally match against a target company JD.</p>
                    </div>

                    {/* ATS Standard Toggle */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Evaluation Benchmark Standard</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                            atsMode === 'iitb_placement' 
                              ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                              : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                          }`}
                          onClick={() => setAtsMode('iitb_placement')}
                          disabled={isUploading}
                        >
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            🎓 IITB Placement Standard
                          </span>
                          <span className="text-[11px] opacity-80 mt-1">1-Page LaTeX budget, CPI notice, overview lines & Day 1 rules</span>
                        </button>
                        <button
                          type="button"
                          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                            atsMode === 'global_ats' 
                              ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                              : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                          }`}
                          onClick={() => setAtsMode('global_ats')}
                          disabled={isUploading}
                        >
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            🏢 Corporate ATS & JD Match
                          </span>
                          <span className="text-[11px] opacity-80 mt-1">Workday/Eightfold parser hygiene, exact skill match & custom JD</span>
                        </button>
                      </div>
                    </div>

                    {/* Target Domain */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Target Domain</label>
                      <div className="relative">
                        <select 
                          className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer text-foreground"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          disabled={isUploading}
                        >
                          <option value="consulting">Management Consulting</option>
                          <option value="software">Software Engineering / IT</option>
                          <option value="product_management">Product Management</option>
                          <option value="finance">Finance / Quant</option>
                          <option value="analytics">Data Science & Analytics</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                          <ChevronDown className="h-5 w-5 opacity-50" />
                        </div>
                      </div>
                    </div>

                    {/* Optional Custom JD Drawer */}
                    <div className="rounded-xl border border-black/5 dark:border-white/10 p-4 bg-muted/15">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Target Company Job Description (Optional)</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowJDInput(!showJDInput)} 
                          className="text-xs text-primary hover:bg-primary/10 h-7"
                        >
                          {showJDInput ? "Hide JD Box" : "+ Paste Target JD"}
                        </Button>
                      </div>
                      {showJDInput && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[11px] text-muted-foreground">
                            Paste the full JD to get exact keyword match percentage and JD-specific keyword recommendations.
                          </p>
                          <textarea
                            className="w-full h-28 p-3 rounded-xl border border-input/60 bg-background text-xs shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar"
                            placeholder="Paste Job Description requirements, qualifications, and role responsibilities here..."
                            value={customJD}
                            onChange={(e) => setCustomJD(e.target.value)}
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Input Mode (Full PDF vs Paste Section) */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex border-b border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        analysisMode === 'full' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setAnalysisMode('full')}
                      disabled={isUploading}
                    >
                      Upload 1-Page PDF
                    </button>
                    <button
                      type="button"
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        analysisMode === 'section' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setAnalysisMode('section')}
                      disabled={isUploading}
                    >
                      Paste Text / Single Section
                    </button>
                  </div>

                  {analysisMode === 'full' ? (
                    <div className="relative border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl p-8 text-center transition-all bg-primary/5 cursor-pointer">
                      <UploadCloud className="h-10 w-10 text-primary mx-auto mb-3 animate-pulse" />
                      <p className="font-semibold text-foreground text-sm mb-1">Click or drag & drop your Resume PDF</p>
                      <p className="text-xs text-muted-foreground">Supports LaTeX & Word-generated PDFs (Max 5MB)</p>
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                      {file && (
                        <div className="mt-4 px-4 py-2 bg-background rounded-full inline-flex items-center gap-2 text-xs font-mono border border-primary/30 shadow-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {primaryIntent === "improve" && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Section Type</label>
                          <div className="relative">
                            <select 
                              className="appearance-none flex h-11 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-xs font-medium shadow-sm hover:bg-muted/20 focus:bg-background focus:border-primary outline-none cursor-pointer text-foreground"
                              value={sectionType}
                              onChange={(e) => setSectionType(e.target.value)}
                              disabled={isUploading}
                            >
                              <option value="experience">Experience / Internships</option>
                              <option value="project">Projects</option>
                              <option value="por">Positions of Responsibility</option>
                              <option value="scholastic">Scholastic Achievements</option>
                              <option value="extracurricular">Extracurriculars</option>
                              <option value="all">Mixed / Unknown</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Paste Text</label>
                        <textarea
                          className="w-full h-36 p-4 rounded-xl border border-input/60 bg-muted/5 text-xs shadow-sm hover:bg-muted/20 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-foreground custom-scrollbar"
                          placeholder="Paste a single bullet or an entire section from your resume here..."
                          value={sectionText}
                          onChange={(e) => setSectionText(e.target.value)}
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Execution Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground">
                      <span>{primaryIntent === 'improve' ? "Running Deep STAR Diagnostic & Benchmark Engine..." : "Evaluating 5 ATS Pillars & Line Wrap Margins..."}</span>
                      <span>{Math.floor(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-black/10 dark:bg-white/10" />
                  </div>
                )}

                {/* Primary Action Button */}
                <Button 
                  className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all" 
                  onClick={analysisMode === 'full' ? handleUpload : handleAnalyzeText} 
                  disabled={(analysisMode === 'full' ? !file : !sectionText.trim()) || isUploading}
                >
                  {isUploading 
                    ? "Executing Neural Analysis (~1-2 mins)..." 
                    : primaryIntent === "improve" 
                    ? "✨ Analyze Resume & Start Improvement" 
                    : "🎯 Scan Resume & Generate ATS Score"}
                </Button>
                
                <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-center">
                  <p className="text-[11px] font-medium text-primary">
                    <ShieldCheck className="inline-block w-4 h-4 mr-1.5 mb-0.5" />
                    Privacy First: Your document is processed strictly in-memory and is never permanently stored or shared.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* ========================================================================= */
            /* RESULTS VIEW: SPLIT SCREEN (PDF PREVIEW + TABBED RESULTS)                 */
            /* ========================================================================= */
            <div className="flex flex-1 min-h-0 border-t border-black/10 dark:border-white/10 mt-2 pt-4">
              
              {/* PDF Viewer Panel - Desktop Only */}
              <div className="hidden lg:flex w-[35%] flex-col pr-4 border-r border-black/10 dark:border-white/10">
                <div className="w-full h-full glass-card dark:bg-neutral-900/40 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 p-2 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Source Document Preview</span>
                    <Button variant="ghost" size="sm" onClick={() => { setAnalysisResult(null); setAtsReport(null); setFile(null); }} className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                      Upload New
                    </Button>
                  </div>
                  <div className="flex-1 mt-2 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
                    {pdfUrl ? (
                      <iframe src={pdfUrl} className="w-full h-full rounded-xl border-none" />
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Text analysis mode active. PDF visual preview unavailable.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Main Analysis / ATS Content Panel */}
              <div className="flex-1 overflow-y-auto px-2 lg:pl-6 custom-scrollbar pb-20">
                
                {/* --------------------------------------------------------------------- */}
                {/* TAB 1: DEEP DIAGNOSTIC & WORKSHOP (Exact Previous Rich Experience)     */}
                {/* --------------------------------------------------------------------- */}
                {activeTab === "diagnostic" && analysisResult && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-4 text-center">
                        <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xl font-bold">{healthScore}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Health Score</p>
                      </div>
                      <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-4 text-center">
                        <Target className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                        <p className="text-xl font-bold">{metricsCount} <span className="text-xs font-normal text-muted-foreground">/ {totalBullets}</span></p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quantified</p>
                      </div>
                      <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-4 text-center">
                        <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                        <p className="text-xl font-bold text-amber-500">{structuralIssues}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Structural Issues</p>
                      </div>
                      <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-4 text-center">
                        <ShieldAlert className="h-5 w-5 mx-auto mb-1 text-rose-500" />
                        <p className="text-xl font-bold text-rose-500">{ruleViolations}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rule Breaks</p>
                      </div>
                    </div>

                    {/* Radar Chart & Day 1 Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-5 flex flex-col items-center justify-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">Competency Radar</h3>
                        <RadarChart scores={analysisResult.radar_scores} />
                        {analysisResult.radar_scores_reasoning && (
                          <details className="mt-4 w-full p-3 bg-primary/5 rounded-lg border border-primary/10 group cursor-pointer">
                            <summary className="flex items-center gap-2 outline-none font-semibold text-xs text-primary list-none">
                              <Brain className="h-3.5 w-3.5" />
                              AI Evaluation Reasoning
                              <span className="ml-auto transform transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <ul className="text-xs text-foreground/80 leading-relaxed mt-3 pt-3 border-t border-primary/10 cursor-text space-y-1.5 list-disc pl-4">
                              {Array.isArray(analysisResult.radar_scores_reasoning) 
                                ? analysisResult.radar_scores_reasoning.map((reason: string, i: number) => (
                                    <li key={i}>{reason}</li>
                                  ))
                                : <li>{analysisResult.radar_scores_reasoning}</li>}
                            </ul>
                          </details>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Sparkles className="h-4 w-4" /> Day 1 Placement Benchmark
                              </h3>
                              <span className="text-xs font-bold text-primary font-mono">{analysisResult.day1_comparison?.score || 75}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {analysisResult.day1_comparison?.summary || "Your profile exhibits strong technical fundamentals. Elevating metric quantification and leadership scale will enhance Day 1 shortlisting probability."}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Target: <strong className="text-foreground">{targetRole.toUpperCase()}</strong></span>
                            <span>Phase: <strong className="text-foreground">{resumePhase.toUpperCase()}</strong></span>
                          </div>
                        </div>

                        {/* Section Summaries */}
                        {analysisResult.section_summaries && (
                          <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-5 space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/70 mb-2">Section Health Overview</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(analysisResult.section_summaries).map(([sec, sum]: [string, any], i: number) => (
                                <div key={i} className="p-2.5 rounded-xl bg-muted/20 border border-black/5 dark:border-white/5">
                                  <span className="font-bold uppercase text-[10px] text-primary block mb-0.5">{sec}</span>
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">{sum.overview || sum.summary || "Well structured"}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grouped Bullets Line-by-Line Critique */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Bullet-by-Bullet Deep Critique</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant={viewMode === "section" ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => setViewMode("section")}
                            className="h-7 text-xs"
                          >
                            <Columns className="h-3 w-3 mr-1" /> By Section
                          </Button>
                          <Button 
                            variant={viewMode === "severity" ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => setViewMode("severity")}
                            className="h-7 text-xs"
                          >
                            <List className="h-3 w-3 mr-1" /> By Severity
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {sortedGroupKeys.map((groupKey) => {
                          const bulletsInGroup = groupedBullets[groupKey] || [];
                          if (bulletsInGroup.length === 0) return null;
                          const isExpanded = expandedSections[groupKey] ?? true;

                          return (
                            <div key={groupKey} className="rounded-2xl border border-black/10 dark:border-white/10 bg-muted/10 overflow-hidden">
                              <button
                                onClick={() => toggleSection(groupKey)}
                                className="w-full flex items-center justify-between p-4 bg-muted/20 text-left hover:bg-muted/30 transition-all"
                              >
                                <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
                                  {groupKey.toUpperCase()} ({bulletsInGroup.length})
                                </span>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>

                              {isExpanded && (
                                <div className="p-4 space-y-4">
                                  {bulletsInGroup.map((bullet: any, idx: number) => {
                                    const colors = getSeverityColors(bullet.severity);
                                    return (
                                      <div key={idx} className={`p-4 rounded-xl border ${colors.border} ${colors.bg} space-y-3 relative overflow-hidden`}>
                                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${colors.edge}`} />
                                        
                                        <div className="flex items-start justify-between gap-4">
                                          <p className="text-xs font-mono text-foreground leading-relaxed flex-1">
                                            "{bullet.original_bullet}"
                                          </p>
                                          <Badge className={`text-[10px] uppercase font-bold shrink-0 ${getVerbColors(bullet.action_verb_rating)}`}>
                                            Verb: {bullet.action_verb_rating}
                                          </Badge>
                                        </div>
                                        
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                          <strong className="text-foreground">Critique:</strong> {bullet.critique}
                                        </p>

                                        {bullet.metrics_hint && (
                                          <div className="p-2 rounded-lg bg-background/80 border border-primary/20 text-[11px] text-primary flex items-center gap-2">
                                            <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                                            <span><strong>Suggested Metric:</strong> {bullet.metrics_hint}</span>
                                          </div>
                                        )}

                                        {/* Suggested Rewrite */}
                                        {bullet.suggested_rewrite && (
                                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                              <span>✨ Recommended Rewrite</span>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 text-[11px] px-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                                                onClick={() => copyToClipboard(bullet.suggested_rewrite)}
                                              >
                                                <Copy className="h-3 w-3 mr-1" /> Copy
                                              </Button>
                                            </div>
                                            <p className="text-xs font-mono text-foreground leading-relaxed">
                                              {bullet.suggested_rewrite}
                                            </p>
                                          </div>
                                        )}

                                        {/* Benchmark Inspiration */}
                                        {bullet.golden_comparison && (
                                          <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-1.5 opacity-80">
                                              <Target className="h-3 w-3" />
                                              Day 1 Benchmark Inspiration
                                            </p>
                                            <p className="text-[11px] text-primary/80 italic font-mono leading-relaxed">"{bullet.golden_comparison}"</p>
                                          </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-1">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startWorkshop(bullet)}
                                            className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                          >
                                            <MessageSquare className="h-3 w-3 mr-1" /> Open in Workshop
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 pb-8">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="h-11 px-6 border-primary/20 text-primary hover:bg-primary/5 font-semibold text-xs" 
                        onClick={() => startWorkshop({original_bullet: "Overall Resume", section_type: "overall"}, true)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Overall Strategy Session
                      </Button>
                      <Button size="lg" className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs" onClick={() => router.push("/dashboard")}>
                        Continue to Mock Interview <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                  </div>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* TAB 2: ATS & PLACEMENT SCORECARD (Dedicated Scoring Suite)             */}
                {/* --------------------------------------------------------------------- */}
                {activeTab === "ats" && atsReport && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* Mode Switcher & Re-score Control Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-muted/25 border border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">Standard:</span>
                        <button
                          onClick={() => { setAtsMode("iitb_placement"); handleRerunATS(targetRole, "iitb_placement"); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${atsMode === "iitb_placement" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                          🎓 IITB Placement Day 1
                        </button>
                        <button
                          onClick={() => { setAtsMode("global_ats"); handleRerunATS(targetRole, "global_ats"); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${atsMode === "global_ats" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                          🏢 Corporate ATS Engine
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select 
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground outline-none cursor-pointer"
                          value={targetRole}
                          onChange={(e) => { setTargetRole(e.target.value); handleRerunATS(e.target.value, atsMode); }}
                        >
                          <option value="consulting">Management Consulting</option>
                          <option value="software">Software Engineering / IT</option>
                          <option value="product_management">Product Management</option>
                          <option value="finance">Finance / Quant</option>
                          <option value="analytics">Data Science & Analytics</option>
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowJDInput(!showJDInput)}
                          className="h-8 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <Search className="h-3.5 w-3.5 mr-1" />
                          {atsReport.is_custom_jd ? "Edit Custom JD" : "Match JD"}
                        </Button>
                      </div>
                    </div>

                    {/* Custom JD Match Drawer */}
                    {showJDInput && (
                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Target Job Description Matcher
                          </h4>
                          <span className="text-[11px] text-muted-foreground">Extracts required tools & computes exact skill match %</span>
                        </div>
                        <textarea
                          className="w-full h-28 p-3 rounded-xl border border-input bg-background text-xs shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar"
                          placeholder="Paste the target job description here..."
                          value={customJD}
                          onChange={(e) => setCustomJD(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setCustomJD(""); handleRerunATS(targetRole, atsMode, ""); }} 
                            className="h-8 text-xs text-muted-foreground"
                          >
                            Reset to Domain Preset
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleRerunATS(targetRole, atsMode, customJD)} 
                            disabled={isATSLoading || !customJD.trim()}
                            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            {isATSLoading ? "Matching Skills..." : "Calculate JD Match %"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Master Gauge Card */}
                    <MasterScoreGauge 
                      score={atsReport.overall_score} 
                      tier={atsReport.tier} 
                      mode={atsReport.mode} 
                    />

                    {/* IITB Policy Alerts (e.g. Prohibited JEE Rank Mentions) */}
                    {atsReport.policy_alerts && atsReport.policy_alerts.length > 0 && (
                      <div className="space-y-3">
                        {atsReport.policy_alerts.map((alert: any, idx: number) => (
                          <Alert key={idx} className="bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300">
                            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                            <div className="ml-2">
                              <AlertTitle className="font-bold text-sm text-rose-700 dark:text-rose-400">
                                {alert.title}
                              </AlertTitle>
                              <AlertDescription className="text-xs mt-1 leading-relaxed text-rose-900/80 dark:text-rose-200/90">
                                {alert.message}
                              </AlertDescription>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* 5-Pillar Score Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      
                      {/* Pillar 1: Parseability */}
                      <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                            <span>🛡️ Parseability</span>
                            <span className="font-mono font-bold text-foreground">{atsReport.pillars?.parseability?.score}%</span>
                          </div>
                          <Progress value={atsReport.pillars?.parseability?.score} className="h-1.5 mb-3" />
                          <p className="text-[11px] text-muted-foreground">
                            {atsReport.pillars?.parseability?.status} OCR & Entity extraction hygiene.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Text Stream</span>
                          <span className="font-semibold text-emerald-500">100% Clean</span>
                        </div>
                      </div>

                      {/* Pillar 2: Keyword Match */}
                      <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                            <span>🎯 Keyword Match</span>
                            <span className="font-mono font-bold text-foreground">{atsReport.pillars?.keyword_match?.score}%</span>
                          </div>
                          <Progress value={atsReport.pillars?.keyword_match?.score} className="h-1.5 mb-3" />
                          <p className="text-[11px] text-muted-foreground">
                            {atsReport.pillars?.keyword_match?.found_critical_count} of {atsReport.pillars?.keyword_match?.total_critical_count} critical tools found.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Domain</span>
                          <span className="font-semibold text-primary">{atsReport.target_role_label}</span>
                        </div>
                      </div>

                      {/* Pillar 3: Quantification */}
                      <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                            <span>📊 Quantification</span>
                            <span className="font-mono font-bold text-foreground">{atsReport.pillars?.quantification?.score}%</span>
                          </div>
                          <Progress value={atsReport.pillars?.quantification?.score} className="h-1.5 mb-3" />
                          <p className="text-[11px] text-muted-foreground">
                            {atsReport.pillars?.quantification?.quantification_ratio}% bullets have hard metrics.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Target</span>
                          <span className="font-semibold text-emerald-500">&gt;75% Quantified</span>
                        </div>
                      </div>

                      {/* Pillar 4: Action Verbs */}
                      <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                            <span>⚡ Action Verbs</span>
                            <span className="font-mono font-bold text-foreground">{atsReport.pillars?.action_verbs?.score}%</span>
                          </div>
                          <Progress value={atsReport.pillars?.action_verbs?.score} className="h-1.5 mb-3" />
                          <p className="text-[11px] text-muted-foreground">
                            {atsReport.pillars?.action_verbs?.weak_verb_count} weak verbs detected.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Tone</span>
                          <span className="font-semibold text-primary">Active Voice</span>
                        </div>
                      </div>

                      {/* Pillar 5: Formatting & Budget */}
                      <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                            <span>📐 Line Budget</span>
                            <span className="font-mono font-bold text-foreground">{atsReport.pillars?.formatting_layout?.score}%</span>
                          </div>
                          <Progress value={atsReport.pillars?.formatting_layout?.score} className="h-1.5 mb-3" />
                          <p className="text-[11px] text-muted-foreground">
                            {atsReport.pillars?.formatting_layout?.word_count} words (1-Page Density).
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Wrap Hazards</span>
                          <span className={`font-semibold ${atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                            {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length || 0} Points
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-view Navigation Tabs */}
                    <div className="border-b border-black/5 dark:border-white/10 flex gap-4">
                      <button
                        onClick={() => setAtsSubView("overview")}
                        className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${atsSubView === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      >
                        🔍 Health & Checks
                      </button>
                      <button
                        onClick={() => setAtsSubView("keywords")}
                        className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${atsSubView === "keywords" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      >
                        🎯 Keyword Matrix
                        <Badge className="h-4 px-1 text-[9px] bg-primary/20 text-primary border-none">
                          {atsReport.pillars?.keyword_match?.found_keywords?.length || 0} Found
                        </Badge>
                      </button>
                      <button
                        onClick={() => setAtsSubView("line_wrap")}
                        className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${atsSubView === "line_wrap" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      >
                        📐 Line-Wrap Hazards & Fixes
                        {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 && (
                          <Badge className="h-4 px-1 text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none">
                            {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length} Flags
                          </Badge>
                        )}
                      </button>
                      <button
                        onClick={() => setAtsSubView("raw_text")}
                        className={`pb-2.5 text-xs font-bold border-b-2 transition-all ${atsSubView === "raw_text" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      >
                        🤖 ATS Bot Stream Preview
                      </button>
                    </div>

                    {/* Sub-view 1: Overview & Checks */}
                    {atsSubView === "overview" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {/* Parseability & Formatting Checks */}
                        <div className="p-5 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" /> Technical & Parseability Verification
                          </h4>
                          <div className="space-y-3">
                            {atsReport.pillars?.parseability?.checks?.map((chk: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-black/5 dark:border-white/5">
                                {chk.passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className="text-xs font-bold text-foreground">{chk.name}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{chk.detail}</p>
                                </div>
                              </div>
                            ))}
                            {atsReport.pillars?.formatting_layout?.layout_checks?.map((chk: any, i: number) => (
                              <div key={`layout-${i}`} className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-black/5 dark:border-white/5">
                                {chk.passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className="text-xs font-bold text-foreground">{chk.name}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{chk.detail}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quantification & Action Verbs Deep Dive */}
                        <div className="p-5 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" /> Quantification & Language Health
                          </h4>
                          
                          <div className="p-3.5 rounded-xl bg-background/60 border border-black/5 dark:border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-foreground">Metrics Diversity Found</span>
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                                {atsReport.pillars?.quantification?.metric_types_found?.length || 0} Categories
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {atsReport.pillars?.quantification?.metric_types_found?.map((mt: string, i: number) => (
                                <Badge key={i} className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  ✓ {mt}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {atsReport.pillars?.action_verbs?.repetitive_verbs?.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-background/60 border border-black/5 dark:border-white/5 space-y-1">
                              <span className="text-xs font-semibold text-foreground">Repetitive Action Verbs</span>
                              <p className="text-[11px] text-muted-foreground">
                                Repeating the same opening verb weakens impact. Detected:{" "}
                                <span className="font-mono text-amber-500">
                                  {atsReport.pillars?.action_verbs?.repetitive_verbs.join(", ")}
                                </span>
                              </p>
                            </div>
                          )}

                          {atsReport.pillars?.quantification?.weak_unquantified_bullets?.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-xs font-semibold text-muted-foreground">Unquantified Points Needing Metrics:</span>
                              {atsReport.pillars?.quantification?.weak_unquantified_bullets.slice(0, 2).map((b: string, i: number) => (
                                <div key={i} className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-3">
                                  <p className="text-[11px] text-foreground/80 line-clamp-1 italic font-mono">"{b}"</p>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => { setBulletToFix({ bullet_text: b }); setFixType("quantify"); }}
                                    className="h-6 px-2 text-[10px] text-primary border-primary/30 shrink-0"
                                  >
                                    ✨ Add Metrics
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-view 2: Keywords Matrix */}
                    {atsSubView === "keywords" && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Missing Critical Keywords Box */}
                        {atsReport.pillars?.keyword_match?.missing_critical?.length > 0 && (
                          <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Missing High-Priority Domain Keywords ({atsReport.pillars?.keyword_match?.missing_critical?.length})
                              </h4>
                              <span className="text-[11px] text-muted-foreground">Crucial for ranking in automated shortlists</span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {atsReport.pillars?.keyword_match?.missing_critical.map((kw: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => { setMissingKeywordToInject(kw); setFixType("inject_keyword"); setBulletToFix({ bullet_text: analysisResult?.bullets?.[0]?.original_bullet || "" }); }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                                >
                                  <span className="text-rose-500 font-bold">+</span> {kw}
                                  <span className="text-[9px] opacity-70 underline ml-1">Inject</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Found Keywords */}
                        <div className="p-5 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Successfully Detected Keywords & Competencies ({atsReport.pillars?.keyword_match?.found_keywords?.length})
                          </h4>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {atsReport.pillars?.keyword_match?.found_keywords?.map((kw: string, i: number) => (
                              <Badge key={i} className="px-3 py-1 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                ✓ {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        {atsReport.pillars?.keyword_match?.suggestions?.length > 0 && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <Lightbulb className="h-4 w-4" /> Placement Optimization Suggestions:
                            </span>
                            <ul className="text-xs text-foreground/80 space-y-1.5 list-disc pl-4">
                              {atsReport.pillars?.keyword_match?.suggestions.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-view 3: Line-Wrap Hazards & Fixer */}
                    {atsSubView === "line_wrap" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="p-4 rounded-xl bg-muted/20 border border-black/5 dark:border-white/10">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                            LaTeX & Word 1-Page Line Budget Auditor
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            In 1-page placement resumes, points containing 115–140 characters spill 1–3 orphan words into line 2, wasting vertical margin budget and risking overflow into a 2nd page.
                          </p>
                        </div>

                        {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 ? (
                          <div className="space-y-3">
                            {atsReport.pillars?.formatting_layout?.line_wrap_hazards.map((hazard: any, i: number) => (
                              <div key={i} className="p-4 rounded-2xl bg-background border border-amber-500/25 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                                    {hazard.section} • {hazard.char_length} Chars
                                  </Badge>
                                  <span className="text-[11px] font-mono text-rose-500 font-semibold">
                                    Trim ~{hazard.chars_to_trim} chars to fit 1 line
                                  </span>
                                </div>

                                <p className="text-sm font-mono text-foreground/90 bg-muted/30 p-3 rounded-xl border border-black/5 dark:border-white/5">
                                  "{hazard.bullet_text}"
                                </p>

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[11px] text-muted-foreground">{hazard.reason}</span>
                                  <Button 
                                    size="sm" 
                                    onClick={() => { setBulletToFix(hazard); setFixType("trim_line_wrap"); }}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8"
                                  >
                                    ✨ 1-Click AI Trim
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                            <h4 className="font-bold text-sm text-foreground">Zero Line-Wrap Hazards Detected</h4>
                            <p className="text-xs text-muted-foreground">All bullets comfortably fit within single or double line placement margins.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-view 4: Raw ATS Text Preview */}
                    {atsSubView === "raw_text" && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="p-3.5 rounded-xl bg-muted/20 border border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Plain Text Stream parsed by automated ATS scrapers (Workday, Greenhouse, Portal Bots)</span>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(atsReport.pillars?.parseability?.raw_text_preview || "")} className="h-6 text-xs text-primary">
                            <Copy className="h-3 w-3 mr-1" /> Copy Text
                          </Button>
                        </div>
                        <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-200 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto custom-scrollbar border border-neutral-800">
                          <pre className="whitespace-pre-wrap">{atsReport.pillars?.parseability?.raw_text_preview || "No raw text stream available."}</pre>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Bullet Fix Modal */}
      {bulletToFix && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel dark:bg-neutral-900 rounded-3xl p-6 max-w-xl w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                1-Click AI Bullet Optimizer
              </h3>
              <Button variant="ghost" size="icon" onClick={() => { setBulletToFix(null); setFixedBulletResult(null); }} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Original Bullet</span>
                <p className="text-xs font-mono p-3 rounded-xl bg-muted/40 text-foreground border border-black/5 dark:border-white/5 mt-1">
                  "{bulletToFix.bullet_text || bulletToFix.original_bullet}"
                </p>
                <span className="text-[10px] text-muted-foreground block mt-1">Length: {(bulletToFix.bullet_text || bulletToFix.original_bullet || "").length} characters</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Optimization Strategy</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFixType("trim_line_wrap")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "trim_line_wrap" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    📐 Trim Line-Wrap Overflow
                  </button>
                  <button
                    onClick={() => setFixType("power_verb")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "power_verb" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    ⚡ Strong Action Verb
                  </button>
                  <button
                    onClick={() => setFixType("inject_keyword")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "inject_keyword" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    🎯 Inject Keyword
                  </button>
                  <button
                    onClick={() => setFixType("quantify")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "quantify" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    📊 Add Metric Brackets
                  </button>
                </div>
              </div>

              {fixType === "inject_keyword" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Keyword to Weave In</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground outline-none focus:border-primary"
                    placeholder="e.g. System Design, Market Sizing, PyTorch..."
                    value={missingKeywordToInject}
                    onChange={(e) => setMissingKeywordToInject(e.target.value)}
                  />
                </div>
              )}

              {fixedBulletResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>✨ AI Refined Output</span>
                    <span className="font-mono text-[11px]">{fixedBulletResult.new_length} chars ({fixedBulletResult.char_diff > 0 ? `+${fixedBulletResult.char_diff}` : fixedBulletResult.char_diff})</span>
                  </div>
                  <p className="text-xs font-mono font-medium text-foreground leading-relaxed bg-background/80 p-3 rounded-xl border border-emerald-500/20">
                    {fixedBulletResult.refined_bullet}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{fixedBulletResult.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              {fixedBulletResult ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      copyToClipboard(fixedBulletResult.refined_bullet);
                      setCopiedBullet(true);
                      setTimeout(() => setCopiedBullet(false), 2000);
                    }}
                    className="text-xs font-semibold"
                  >
                    {copiedBullet ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedBullet ? "Copied!" : "Copy Refined Point"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setBulletToFix(null); setFixedBulletResult(null); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                  >
                    Done
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleExecuteBulletFix}
                  disabled={isFixingBullet}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold w-full"
                >
                  {isFixingBullet ? "Optimizing..." : "Execute AI Fix"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Workshop Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[400px] bg-background border-l border-black/10 dark:border-white/10 shadow-2xl transition-transform duration-500 z-50 flex flex-col ${activeWorkshopBullet ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-14 flex items-center justify-between px-6 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            Strategic Bullet Workshop
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setActiveWorkshopBullet(null)} className="rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Focus Bullet</p>
          <p className="text-xs font-mono text-foreground/80 line-clamp-3">"{activeWorkshopBullet?.original_bullet}"</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background custom-scrollbar">
          {workshopMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                  : 'bg-muted/40 border border-black/10 dark:border-white/10 text-foreground rounded-tl-sm shadow-sm'
              }`}>
                {renderFormattedText(msg.content)}
              </div>
            </div>
          ))}
          
          {isWorkshopLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/40 border border-black/10 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}

          {finalWorkshopBullet && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-2 shadow-sm animate-in fade-in duration-500">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Final Polished Bullet
              </p>
              <p className="text-xs font-medium mb-3 text-foreground leading-relaxed">{renderFormattedText(finalWorkshopBullet)}</p>
              <Button 
                size="sm" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-xs h-8"
                onClick={() => copyToClipboard(finalWorkshopBullet)}
              >
                Copy to Clipboard
              </Button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3.5 border-t border-black/10 dark:border-white/10 bg-background shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendWorkshopMessage(workshopInput, activeWorkshopBullet, workshopMessages);
            }} 
            className="relative"
          >
            <input
              type="text"
              value={workshopInput}
              onChange={(e) => setWorkshopInput(e.target.value)}
              placeholder="Type your metric or context..."
              disabled={isWorkshopLoading || !activeWorkshopBullet}
              className="w-full bg-muted/40 border border-black/10 dark:border-white/10 text-foreground rounded-full pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!workshopInput.trim() || isWorkshopLoading}
              className="absolute right-1 top-1 bottom-1 h-auto rounded-full w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
