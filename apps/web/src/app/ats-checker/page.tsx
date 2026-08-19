"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  UploadCloud, AlertCircle, CheckCircle2, ArrowLeft,
  Target, Copy, Lightbulb, ChevronDown, 
  Brain, FileText, Zap, AlertTriangle, ShieldCheck, 
  Search, Check, GraduationCap, Building2, SlidersHorizontal, 
  TrendingUp, Cpu, Sparkles, X, Info, HelpCircle, ArrowUpRight,
  Briefcase, FolderGit2, Award, Wrench, Users
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreatorBadge } from "@/components/creator-badge"

// Master Radial Gauge Component for ATS Score
const MasterScoreGauge = ({ score, tier, mode, roleLabel }: { score: number, tier: string, mode: string, roleLabel: string }) => {
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
    <div className="flex items-center gap-6">
      <div className="relative flex items-center justify-center shrink-0">
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
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-black tracking-tight ${colors.text}`}>{score}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">OUT OF 100</span>
        </div>
      </div>

      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`px-2.5 py-0.5 font-semibold text-[11px] border ${colors.badge}`}>
            {tier}
          </Badge>
          <span className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-1">
            {mode === "iitb_placement" ? (
              <><GraduationCap className="h-3 w-3 text-primary" /> IITB Day 1 Standard</>
            ) : (
              <><Building2 className="h-3 w-3 text-primary" /> Corporate ATS Standard</>
            )}
          </span>
        </div>
        <h3 className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
          {score >= 85 
            ? "Elite Placement Candidate Profile" 
            : score >= 72 
            ? "Strong Shortlist Contender" 
            : score >= 58 
            ? "Moderate Alignment — Key Gaps" 
            : "Formatting & Content Adjustments Required"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {mode === "iitb_placement" 
            ? `Calibrated for ${roleLabel} campus shortlisting: multi-tiered semantic competency density, line budget, and scholastic highlights.`
            : `Calibrated for corporate enterprise ATS systems (Workday, Greenhouse, Eightfold): OCR extractability and semantic skill match for ${roleLabel}.`}
        </p>
      </div>
    </div>
  );
};

// Check Row Component with Full Title, Status Pill and Mini Progress Bar (Zero Truncation)
const CheckRow = ({ name, score, status, passed }: { name: string, score: number, status: string, passed: boolean }) => {
  const getStatusBadge = () => {
    if (score >= 85 || passed) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (score >= 70) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 border border-black/5 dark:border-white/5 hover:border-primary/20 transition-all">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {passed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        )}
        <span className="text-xs font-semibold text-foreground">{name}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="w-16 sm:w-24 hidden sm:block">
          <Progress value={score} className="h-1.5" />
        </div>
        <Badge className={`text-[10px] font-mono px-2 py-0.5 border ${getStatusBadge()}`}>
          {score}% • {status}
        </Badge>
      </div>
    </div>
  );
};

export default function ATSCheckerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [rawText, setRawText] = useState("")
  const [inputMode, setInputMode] = useState<"file" | "text">("file")
  
  // ATS Config
  const [targetRole, setTargetRole] = useState("software")
  const [atsMode, setAtsMode] = useState<"iitb_placement" | "global_ats">("iitb_placement")
  const [customJD, setCustomJD] = useState("")
  const [showJDInput, setShowJDInput] = useState(false)
  const [showReasoningModal, setShowReasoningModal] = useState(false)
  
  // Results & Loading
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [atsReport, setAtsReport] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "sections" | "keywords" | "line_wrap" | "raw_stream">("overview")
  
  // 1-Click Bullet Fix State
  const [bulletToFix, setBulletToFix] = useState<any | null>(null)
  const [fixType, setFixType] = useState<string>("power_verb")
  const [missingKeywordToInject, setMissingKeywordToInject] = useState<string>("")
  const [isFixingBullet, setIsFixingBullet] = useState(false)
  const [fixedBulletResult, setFixedBulletResult] = useState<any | null>(null)
  const [copiedBullet, setCopiedBullet] = useState<string | null>(null)

  const { isGuest, guestResumeCount, incrementGuestResume } = useAuthStore()
  const router = useRouter()

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

  const handleRunATS = async (overrideRole?: string, overrideMode?: "iitb_placement" | "global_ats", overrideJD?: string) => {
    const textAvailable = rawText.trim() || atsReport?.raw_text || atsReport?.pillars?.parseability?.raw_text_preview;
    if (inputMode === "file" && !file && !textAvailable) return;
    if (inputMode === "text" && !textAvailable) return;

    setIsScanning(true);
    setError(null);
    setScanProgress(10);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + (prev < 50 ? 12 : 3);
      });
    }, 600);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (textAvailable) {
        formData.append("raw_text", textAvailable);
      }

      formData.append("target_role", overrideRole || targetRole);
      formData.append("mode", overrideMode || atsMode);
      
      const jdToSend = overrideJD !== undefined ? overrideJD : customJD;
      if (jdToSend && jdToSend.trim()) {
        formData.append("job_description", jdToSend.trim());
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/resume/ats-check`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to evaluate ATS score");
      }

      const data = await response.json();
      clearInterval(progressInterval);
      setAtsReport(data);
      setScanProgress(100);
      if (isGuest && !atsReport) {
        incrementGuestResume();
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "An unexpected error occurred during ATS evaluation.");
      setScanProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsScanning(false);
    }
  };

  const handleExecuteBulletFix = async () => {
    if (!bulletToFix) return
    setIsFixingBullet(true)
    setFixedBulletResult(null)
    setCopiedBullet(null)

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBullet(id);
    setTimeout(() => setCopiedBullet(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 left-1/3 w-[550px] h-[550px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-black/5 dark:border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Command Center
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/resume")} 
              className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold"
            >
              <Brain className="h-3.5 w-3.5" /> Resume Review & Workshop
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className={`container mx-auto px-4 md:px-8 relative z-10 ${!atsReport ? 'py-12 max-w-3xl' : 'py-6 max-w-[1600px] flex-1 flex flex-col'}`}>
        
        {/* Banner Title */}
        <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Dual-Calibrated Neural Scoring & Placement Engine
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">ATS & Placement Score Studio</h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive evaluation calibrated for IIT Bombay placement season and global enterprise ATS platforms.
            </p>
          </div>

          {atsReport && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowReasoningModal(true)} 
                className="text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 h-9"
              >
                <HelpCircle className="h-4 w-4 mr-1.5" /> Scoring Methodology
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setAtsReport(null); setFile(null); setRawText(""); }} 
                className="text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 h-9"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" /> Scan Another Resume
              </Button>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* INGESTION & CONFIGURATION FORM                                          */}
        {/* ----------------------------------------------------------------------- */}
        {!atsReport ? (
          <div className="glass-panel dark:bg-neutral-900/40 rounded-3xl p-6 md:p-8 border border-black/5 dark:border-white/10 shadow-xl space-y-6">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                Evaluation Benchmark Standard
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    atsMode === 'iitb_placement' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                      : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                  }`}
                  onClick={() => setAtsMode('iitb_placement')}
                  disabled={isScanning}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="h-4 w-4" />
                    IIT Bombay Placement Standard
                  </div>
                  <p className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    1-Page & 2-Page Master line budget, CPI & AP grade notice, overview lines, Day-1 shortlisting rules.
                  </p>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                    atsMode === 'global_ats' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                      : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                  }`}
                  onClick={() => setAtsMode('global_ats')}
                  disabled={isScanning}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    <Building2 className="h-4 w-4" />
                    Enterprise ATS (Workday / Greenhouse)
                  </div>
                  <p className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    Single-stream OCR parseability, exact skill taxonomy matching, power verbs & custom JD alignment.
                  </p>
                </button>
              </div>
            </div>

            {/* Target Role Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Target Role Domain</label>
              <div className="relative">
                <select 
                  className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/20 focus:bg-background focus:border-primary outline-none transition-all cursor-pointer text-foreground"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isScanning}
                >
                  <option value="software">Software Engineering / IT (Google, Microsoft, Amazon, Uber)</option>
                  <option value="consulting">Management Consulting (McKinsey, BCG, Bain, Kearney)</option>
                  <option value="product_management">Product Management (Flipkart, Swiggy, Razorpay, Uber)</option>
                  <option value="finance">Finance & Quant (Goldman Sachs, Morgan Stanley, Citadel)</option>
                  <option value="analytics">Data Science & Analytics (Fractal, Tiger, EXL)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                  <ChevronDown className="h-5 w-5 opacity-50" />
                </div>
              </div>
            </div>

            {/* Optional Custom JD Matcher Drawer */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 p-4 bg-muted/15">
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
                  {showJDInput ? "Hide JD Box" : "+ Match Custom JD"}
                </Button>
              </div>
              {showJDInput && (
                <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                  <p className="text-[11px] text-muted-foreground">
                    Paste the target job description to calculate exact keyword match percentage and uncover missing critical qualifications.
                  </p>
                  <textarea
                    className="w-full h-28 p-3 rounded-xl border border-input/60 bg-background text-xs shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar"
                    placeholder="Paste Job Description responsibilities and requirements here..."
                    value={customJD}
                    onChange={(e) => setCustomJD(e.target.value)}
                    disabled={isScanning}
                  />
                </div>
              )}
            </div>

            {/* Input Mode: File vs Text */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-4">
              <div className="flex border-b border-black/5 dark:border-white/5">
                <button
                  type="button"
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    inputMode === 'file' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setInputMode('file')}
                  disabled={isScanning}
                >
                  Upload PDF Resume
                </button>
                <button
                  type="button"
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    inputMode === 'text' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setInputMode('text')}
                  disabled={isScanning}
                >
                  Paste Plain Text
                </button>
              </div>

              {inputMode === 'file' ? (
                <div className="relative border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl p-8 text-center transition-all bg-primary/5 cursor-pointer">
                  <UploadCloud className="h-10 w-10 text-primary mx-auto mb-3 animate-pulse" />
                  <p className="font-semibold text-foreground text-sm mb-1">Click or drag & drop your Resume PDF</p>
                  <p className="text-xs text-muted-foreground">Supports LaTeX & Word-generated PDFs (1-Page & 2-Page Master Resumes)</p>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    disabled={isScanning}
                  />
                  {file && (
                    <div className="mt-4 px-4 py-2 bg-background rounded-full inline-flex items-center gap-2 text-xs font-mono border border-primary/30 shadow-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    className="w-full h-36 p-4 rounded-xl border border-input/60 bg-muted/5 text-xs shadow-sm hover:bg-muted/20 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-foreground custom-scrollbar"
                    placeholder="Paste full resume text stream here..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    disabled={isScanning}
                  />
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Scan Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>Evaluating 5 Pillars & Semantic Intelligence for {targetRole.toUpperCase()}...</span>
                  <span>{Math.floor(scanProgress)}%</span>
                </div>
                <Progress value={scanProgress} className="h-2 bg-black/10 dark:bg-white/10" />
              </div>
            )}

            <Button 
              className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all" 
              onClick={() => handleRunATS()} 
              disabled={(inputMode === 'file' ? !file : !rawText.trim()) || isScanning}
            >
              {isScanning ? "Running Neural Parser & Placement Auditor..." : "Execute Comprehensive ATS Evaluation"}
            </Button>
            
            <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-center">
              <p className="text-[11px] font-medium text-primary">
                <ShieldCheck className="inline-block w-4 h-4 mr-1.5 mb-0.5" />
                Privacy First: Your document is processed strictly in-memory and is never permanently stored or shared.
              </p>
            </div>

          </div>
        ) : (
          /* ----------------------------------------------------------------------- */
          /* SCORECARD RESULTS VIEW                                                  */
          /* ----------------------------------------------------------------------- */
          <div className="flex flex-1 min-h-0 border-t border-black/10 dark:border-white/10 mt-2 pt-4">
            
            {/* PDF Viewer Panel - Desktop Only */}
            <div className="hidden lg:flex w-[35%] flex-col pr-4 border-r border-black/10 dark:border-white/10">
              <div className="w-full h-full glass-card dark:bg-neutral-900/40 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 p-2 flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Source Resume Preview</span>
                  <Badge variant="outline" className="text-[10px]">
                    {atsReport.pillars?.formatting_layout?.page_count || 1}-Page Resume
                  </Badge>
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
            
            {/* Main Scorecard Content */}
            <div className="flex-1 overflow-y-auto px-2 lg:pl-6 custom-scrollbar pb-20 space-y-6 animate-in fade-in duration-500">
              
              {/* Benchmark Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-muted/25 border border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">Standard:</span>
                  <button
                    onClick={() => { setAtsMode("iitb_placement"); handleRunATS(targetRole, "iitb_placement"); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${atsMode === "iitb_placement" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> IITB Placement Day 1
                  </button>
                  <button
                    onClick={() => { setAtsMode("global_ats"); handleRunATS(targetRole, "global_ats"); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${atsMode === "global_ats" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Corporate ATS Engine
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground outline-none cursor-pointer"
                    value={targetRole}
                    onChange={(e) => { setTargetRole(e.target.value); handleRunATS(e.target.value, atsMode); }}
                  >
                    <option value="software">Software Engineering / IT</option>
                    <option value="consulting">Management Consulting</option>
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

              {/* Custom JD Drawer */}
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
                      onClick={() => { setCustomJD(""); handleRunATS(targetRole, atsMode, ""); }} 
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Reset to Domain Preset
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleRunATS(targetRole, atsMode, customJD)} 
                      disabled={isScanning || !customJD.trim()}
                      className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      {isScanning ? "Matching Skills..." : "Calculate JD Match %"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Master Split Hero: Gauge on Left + Quick Wins Roadmap on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left: Master Gauge Card */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20 shadow-md flex items-center">
                  <MasterScoreGauge 
                    score={atsReport.overall_score} 
                    tier={atsReport.tier} 
                    mode={atsReport.mode} 
                    roleLabel={atsReport.target_role_label}
                  />
                </div>

                {/* Right: Quick Wins Roadmap Card */}
                <div className="lg:col-span-5 p-5 rounded-3xl bg-muted/20 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Immediate Score Roadmap
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">High-Yield Priorities</span>
                    </div>

                    <div className="space-y-2">
                      {atsReport.quick_wins?.map((qw: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-background/80 border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 hover:border-primary/20 transition-all">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono shrink-0">
                                {qw.impact_pts}
                              </Badge>
                              <p className="text-xs font-bold text-foreground truncate">{qw.title}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{qw.hint}</p>
                          </div>

                          {qw.action_type === "inject_keyword" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setActiveSubTab("keywords")} 
                              className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 shrink-0"
                            >
                              View Skills <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                          {qw.action_type === "trim_line_wrap" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setActiveSubTab("line_wrap")} 
                              className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 shrink-0"
                            >
                              Trim Lines <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Target: 85+ (Placement Ready)</span>
                    <span className="font-semibold text-primary">Est. Gain: +15-25 pts</span>
                  </div>
                </div>

              </div>

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
                      <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Parseability</span>
                      <span className="font-mono font-bold text-foreground">{atsReport.pillars?.parseability?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.parseability?.score} className="h-1.5 mb-2.5" />
                    <p className="text-[11px] text-muted-foreground">
                      Layout structure & entity extraction hygiene.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Text Stream</span>
                    <span className="font-semibold text-emerald-500">100% Parsed</span>
                  </div>
                </div>

                {/* Pillar 2: Keyword Match */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> Skill Match</span>
                      <span className="font-mono font-bold text-foreground">{atsReport.pillars?.keyword_match?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.keyword_match?.score} className="h-1.5 mb-2.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {atsReport.pillars?.keyword_match?.found_critical_count} of {atsReport.pillars?.keyword_match?.total_critical_count} competencies matched.
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
                      <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Quantification</span>
                      <span className="font-mono font-bold text-foreground">{atsReport.pillars?.quantification?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.quantification?.score} className="h-1.5 mb-2.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {atsReport.pillars?.quantification?.quantification_ratio}% bullets have hard metrics.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Benchmark</span>
                    <span className="font-semibold text-emerald-500">&gt;75% Quantified</span>
                  </div>
                </div>

                {/* Pillar 4: Action Verbs */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Action Verbs</span>
                      <span className="font-mono font-bold text-foreground">{atsReport.pillars?.action_verbs?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.action_verbs?.score} className="h-1.5 mb-2.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {atsReport.pillars?.action_verbs?.weak_verb_count} weak verbs detected.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Voice</span>
                    <span className="font-semibold text-primary">Active Voice</span>
                  </div>
                </div>

                {/* Pillar 5: Formatting & Budget */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Line Budget</span>
                      <span className="font-mono font-bold text-foreground">{atsReport.pillars?.formatting_layout?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.formatting_layout?.score} className="h-1.5 mb-2.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {atsReport.pillars?.formatting_layout?.word_count} words ({atsReport.pillars?.formatting_layout?.page_count || 1}-Page Density).
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Visual Wraps</span>
                    <span className={`font-semibold ${atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length || 0} Orphan Flags
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-view Navigation Tabs */}
              <div className="border-b border-black/5 dark:border-white/5 flex flex-wrap gap-4">
                <button
                  onClick={() => setActiveSubTab("overview")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeSubTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pillar Health & Checks
                </button>
                <button
                  onClick={() => setActiveSubTab("sections")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeSubTab === "sections" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Section Quality Diagnostics
                </button>
                <button
                  onClick={() => setActiveSubTab("keywords")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeSubTab === "keywords" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Target className="h-3.5 w-3.5" />
                  Competency & Skill Matrix
                  <Badge className="h-4 px-1 text-[9px] bg-primary/20 text-primary border-none">
                    {atsReport.pillars?.keyword_match?.found_critical_count} / {atsReport.pillars?.keyword_match?.total_critical_count} Matched
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveSubTab("line_wrap")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeSubTab === "line_wrap" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Visual Line-Wrap Inspector
                  {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 && (
                    <Badge className="h-4 px-1 text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none">
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length} Flags
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveSubTab("raw_stream")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeSubTab === "raw_stream" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  ATS Bot Parser Preview
                </button>
              </div>

              {/* Sub-view 1: Overview & Checks */}
              {activeSubTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  {/* Parseability & Formatting Checks */}
                  <div className="p-5 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Technical & Parseability Verification
                      </h4>
                      <span className="text-[11px] font-mono text-primary font-semibold">
                        Score: {atsReport.pillars?.parseability?.score}%
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {atsReport.pillars?.parseability?.checks?.map((chk: any, i: number) => (
                        <CheckRow 
                          key={i} 
                          name={chk.name} 
                          score={chk.score ?? (chk.passed ? 100 : 50)} 
                          status={chk.status ?? (chk.passed ? "Optimal" : "Check")} 
                          passed={chk.passed} 
                        />
                      ))}
                      {atsReport.pillars?.formatting_layout?.layout_checks?.map((chk: any, i: number) => (
                        <CheckRow 
                          key={`layout-${i}`} 
                          name={chk.name} 
                          score={chk.score ?? (chk.passed ? 100 : 60)} 
                          status={chk.status ?? (chk.passed ? "Optimal" : "Check")} 
                          passed={chk.passed} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quantification & Action Verbs Deep Dive */}
                  <div className="p-5 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" /> Quantification & Language Health
                      </h4>
                      <span className="text-[11px] font-mono text-primary font-semibold">
                        Score: {atsReport.pillars?.quantification?.score}%
                      </span>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-background/80 border border-black/5 dark:border-white/5 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">Metrics Diversity Breakdown</span>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-mono">
                          {atsReport.pillars?.quantification?.metric_types_found?.length || 0} Categories Present
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {atsReport.pillars?.quantification?.metric_types_found?.map((mt: string, i: number) => (
                          <Badge key={i} className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                            <Check className="h-3 w-3 mr-1 inline" /> {mt}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {atsReport.pillars?.action_verbs?.repetitive_verbs?.length > 0 && (
                      <div className="p-4 rounded-xl bg-background/80 border border-black/5 dark:border-white/5 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground">Repetitive Action Verbs</span>
                          <span className="text-[10px] text-amber-500 font-mono">Variety Advisory</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Repeating opening verbs reduces impact. Detected:{" "}
                          <span className="font-mono font-bold text-amber-500">
                            {atsReport.pillars?.action_verbs?.repetitive_verbs.join(", ")}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Google X-Y-Z Anatomy Inspector */}
                    {atsReport.pillars?.quantification?.xyz_deconstruction?.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> Google X-Y-Z Bullet Quality Sample:
                        </span>
                        {atsReport.pillars?.quantification?.xyz_deconstruction.slice(0, 2).map((xyz: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-background/90 border border-black/5 dark:border-white/5 space-y-1.5">
                            <p className="text-xs font-mono text-foreground line-clamp-1 italic">"{xyz.bullet_text}"</p>
                            <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                              <Badge className={`px-1.5 py-0 ${xyz.has_action_verb ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                                {xyz.has_action_verb ? "Action: Strong" : "Action: Weak"}
                              </Badge>
                              <Badge className={`px-1.5 py-0 ${xyz.has_metric_y ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                                {xyz.has_metric_y ? "Metric (Y): Quantified" : "Metric (Y): Missing"}
                              </Badge>
                              <Badge className={`px-1.5 py-0 ${xyz.has_mechanism_z ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                                {xyz.has_mechanism_z ? "Mechanism (Z): Clear" : "Mechanism (Z): Add Context"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-view: Section Quality Diagnostics */}
              {activeSubTab === "sections" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-muted/20 border border-black/5 dark:border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Section-by-Section Quality & Depth Diagnostics
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Evaluates content depth, role ownership, quantifiable business outcomes, and formatting structure across each key section of your placement profile.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Experience Section Card */}
                    <div className="p-4 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4 text-primary" /> Work Experience
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-bold">
                            {atsReport.section_health?.experience?.score}%
                          </Badge>
                        </div>
                        <Progress value={atsReport.section_health?.experience?.score} className="h-1.5 mb-2" />
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p>• {atsReport.section_health?.experience?.bullets_count} Experience points detected.</p>
                          <p>• {atsReport.section_health?.experience?.quantified_ratio}% of experience points contain metrics.</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] w-fit font-mono">
                        Status: {atsReport.section_health?.experience?.status}
                      </Badge>
                    </div>

                    {/* Projects Section Card */}
                    <div className="p-4 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <FolderGit2 className="h-4 w-4 text-primary" /> Technical Projects
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-bold">
                            {atsReport.section_health?.projects?.score}%
                          </Badge>
                        </div>
                        <Progress value={atsReport.section_health?.projects?.score} className="h-1.5 mb-2" />
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p>• {atsReport.section_health?.projects?.bullets_count} Project points detected.</p>
                          <p>• Production & Deployment Proof: {atsReport.section_health?.projects?.has_production_proof ? "Verified (Live / Active)" : "Academic / Prototype"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] w-fit font-mono">
                        Status: {atsReport.section_health?.projects?.status}
                      </Badge>
                    </div>

                    {/* Education & Scholastic Card */}
                    <div className="p-4 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4 text-primary" /> Scholastic & Education
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-bold">
                            {atsReport.section_health?.education?.score}%
                          </Badge>
                        </div>
                        <Progress value={atsReport.section_health?.education?.score} className="h-1.5 mb-2" />
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p>• CPI/GPA Header Status: {atsReport.section_health?.education?.has_cpi ? "Verified" : "Missing"}</p>
                          <p>• Honors / AP Grades: {atsReport.section_health?.education?.has_honors ? "Recognized" : "Standard"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] w-fit font-mono">
                        Status: {atsReport.section_health?.education?.status}
                      </Badge>
                    </div>

                    {/* Technical Skills Card */}
                    <div className="p-4 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Wrench className="h-4 w-4 text-primary" /> Skills Categorization
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-bold">
                            {atsReport.section_health?.skills?.score}%
                          </Badge>
                        </div>
                        <Progress value={atsReport.section_health?.skills?.score} className="h-1.5 mb-2" />
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p>• Table Categories: {atsReport.section_health?.skills?.is_categorized ? "Structured (Languages/Frameworks/Tools)" : "Uncategorized Block"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] w-fit font-mono">
                        Status: {atsReport.section_health?.skills?.status}
                      </Badge>
                    </div>

                    {/* Leadership & PoR Card */}
                    <div className="p-4 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-primary" /> Positions of Responsibility
                          </span>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-bold">
                            {atsReport.section_health?.leadership?.score}%
                          </Badge>
                        </div>
                        <Progress value={atsReport.section_health?.leadership?.score} className="h-1.5 mb-2" />
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <p>• Leadership Proof: {atsReport.section_health?.leadership?.present ? "Detected (Lead/Manager/Secretary)" : "Optional"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] w-fit font-mono">
                        Status: {atsReport.section_health?.leadership?.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-view 2: Categorized Competencies & Skill Matrix */}
              {activeSubTab === "keywords" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Custom JD Match Overview if Present */}
                  {atsReport.pillars?.keyword_match?.jd_match_info && (
                    <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                          <Target className="h-4 w-4" /> Target Job Description Skill Match: {atsReport.pillars?.keyword_match?.jd_match_info?.match_rate}%
                        </h4>
                        <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                          {atsReport.pillars?.keyword_match?.jd_match_info?.found} / {atsReport.pillars?.keyword_match?.jd_match_info?.total} Skills
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Missing High-Yield Competencies Box */}
                  {atsReport.pillars?.keyword_match?.missing_critical?.length > 0 && (
                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Recommended High-Priority Competencies ({atsReport.pillars?.keyword_match?.missing_critical?.length})
                        </h4>
                        <span className="text-[11px] text-muted-foreground">Click any skill to launch 1-Click AI Bullet Injector</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {atsReport.pillars?.keyword_match?.missing_critical.map((kw: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => { setMissingKeywordToInject(kw); setFixType("inject_keyword"); setBulletToFix({ bullet_text: "" }); }}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                          >
                            <span className="text-rose-500 font-bold">+</span> {kw}
                            <span className="text-[9px] opacity-70 underline ml-1">Inject</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorized Matrix Breakdown */}
                  {atsReport.pillars?.keyword_match?.categorized_matrix ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {atsReport.pillars?.keyword_match?.categorized_matrix.map((cat: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-muted/15 border border-black/5 dark:border-white/10 space-y-3">
                          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                            <h5 className="text-xs font-bold text-foreground">{cat.category}</h5>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {cat.matched?.length} / {(cat.matched?.length || 0) + (cat.missing?.length || 0)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {cat.matched?.map((m: any, mi: number) => (
                              <div key={mi} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2">
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 truncate">
                                  <Check className="h-3 w-3 shrink-0" /> {m.name}
                                </span>
                                {m.is_implicit ? (
                                  <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 shrink-0 font-mono flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5" /> AI Inferred
                                  </Badge>
                                ) : (
                                  <span className="text-[9px] font-mono text-muted-foreground opacity-70 truncate max-w-[90px] shrink-0">
                                    via "{m.matched_via}"
                                  </span>
                                )}
                              </div>
                            ))}

                            {cat.missing?.map((ms: string, msi: number) => (
                              <div key={msi} className="p-2 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/30 text-xs flex items-center justify-between">
                                <span className="text-muted-foreground">{ms}</span>
                                <button 
                                  onClick={() => { setMissingKeywordToInject(ms); setFixType("inject_keyword"); setBulletToFix({ bullet_text: "" }); }}
                                  className="text-[10px] text-primary font-bold hover:underline"
                                >
                                  + Inject
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Sub-view 3: Line-Wrap Hazards & Fixer */}
              {activeSubTab === "line_wrap" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-muted/20 border border-black/5 dark:border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                      Visual Geometry & Line Budget Inspector ({atsReport.pillars?.formatting_layout?.page_count || 1}-Page Resume)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Uses PDF visual line bounding-box analysis to detect genuine orphan line wraps (where a point renders across multiple lines and spills only 1–3 trailing words onto the final line, leaving excessive empty margin space).
                    </p>
                  </div>

                  {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 ? (
                    <div className="space-y-3">
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards.map((hazard: any, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-background border border-amber-500/25 shadow-sm space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                                {hazard.section} • {hazard.char_length} Chars
                              </Badge>
                              {hazard.visual_lines && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                  {hazard.visual_lines} Visual Lines
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-rose-500 font-semibold">
                              Trim ~{hazard.chars_to_trim} chars to eliminate orphan line
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
                              <Sparkles className="h-3 w-3 mr-1" /> 1-Click AI Trim
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-foreground">Zero Visual Orphan Hazards Detected</h4>
                      <p className="text-xs text-muted-foreground">
                        All points render with clean single lines or well-filled multi-lines across your {atsReport.pillars?.formatting_layout?.page_count || 1}-page placement document.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-view 4: Raw ATS Text Preview */}
              {activeSubTab === "raw_stream" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Plain Text Stream parsed by automated ATS scrapers (Workday, Greenhouse, Portal Bots)</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(atsReport.pillars?.parseability?.raw_text_preview || "", "raw")} className="h-6 text-xs text-primary">
                      {copiedBullet === "raw" ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copiedBullet === "raw" ? "Copied!" : "Copy Text"}
                    </Button>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-200 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto custom-scrollbar border border-neutral-800">
                    <pre className="whitespace-pre-wrap">{atsReport.pillars?.parseability?.raw_text_preview || "No raw text stream available."}</pre>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Scoring Methodology & Reasoning Modal */}
      {showReasoningModal && atsReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel dark:bg-neutral-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                  <Brain className="h-5 w-5 text-primary" />
                  Detailed Scoring Methodology & Reasoning
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calibrated mathematical weights and evaluation backing for {atsReport.target_role_label}.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowReasoningModal(false)} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-primary text-[11px]">Pillar Weight Distribution</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded-lg bg-background border border-black/5 dark:border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Skill Alignment</span>
                    <strong className="text-foreground text-sm">30% Weight</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-black/5 dark:border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Quantification</span>
                    <strong className="text-foreground text-sm">25% Weight</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-black/5 dark:border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Parseability</span>
                    <strong className="text-foreground text-sm">15% Weight</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-black/5 dark:border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Action Verbs</span>
                    <strong className="text-foreground text-sm">15% Weight</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-black/5 dark:border-white/5">
                    <span className="text-muted-foreground block text-[10px]">Line Budget</span>
                    <strong className="text-foreground text-sm">15% Weight</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Evaluation Standards</h4>
                
                <div className="p-3.5 rounded-xl bg-background border border-black/5 dark:border-white/5 space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Technical & Parseability (15%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Evaluates single-stream text layer extraction and standard category hierarchy. In IIT Bombay placement mode, contact headers (phone, email, github) are managed by the campus placement portal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-black/5 dark:border-white/5 space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" /> Role & Skill Alignment (30%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Compares bullet text against comprehensive domain taxonomies ({atsReport.target_role_label}) and custom Job Descriptions using deterministic synonym mapping combined with deep AI semantic inference.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-black/5 dark:border-white/5 space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Quantification & Impact Index (25%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Measures the percentage of bullets containing hard metrics (%, currencies, scale, latencies) and rewards metric diversity across sections (&gt;75% benchmark).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-black/5 dark:border-white/5 space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" /> Action Verbs & Voice (15%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Penalizes passive fillers (e.g., "helped with", "worked on") and excessive repetition of the same opening verb, prioritizing executive action verbs.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-black/5 dark:border-white/5 space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Visual Line Budget & Margins (15%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Uses PyMuPDF visual bounding box analysis on rendered PDF pages. Only flags genuine orphan lines that leave excessive empty margins.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-black/5 dark:border-white/10">
              <Button size="sm" onClick={() => setShowReasoningModal(false)} className="bg-primary text-primary-foreground font-semibold text-xs h-8">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced 1-Click AI Bullet Optimizer Modal with 3 Strategic Options */}
      {bulletToFix && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel dark:bg-neutral-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Context-Aware AI Bullet Optimizer
              </h3>
              <Button variant="ghost" size="icon" onClick={() => { setBulletToFix(null); setFixedBulletResult(null); }} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Original Bullet</span>
                <p className="text-xs font-mono p-3 rounded-xl bg-muted/40 text-foreground border border-black/5 dark:border-white/5 mt-1 leading-relaxed">
                  "{bulletToFix.bullet_text || bulletToFix.original_bullet}"
                </p>
                <span className="text-[10px] text-muted-foreground block mt-1">Length: {(bulletToFix.bullet_text || bulletToFix.original_bullet || "").length} characters</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Optimization Goal</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setFixType("power_verb")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "power_verb" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    Action Verb Upgrade
                  </button>
                  <button
                    onClick={() => setFixType("quantify")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "quantify" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    Metric Brackets
                  </button>
                  <button
                    onClick={() => setFixType("inject_keyword")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "inject_keyword" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    Inject Keyword
                  </button>
                  <button
                    onClick={() => setFixType("trim_line_wrap")}
                    className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${fixType === "trim_line_wrap" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-transparent text-muted-foreground"}`}
                  >
                    Line-Wrap Trim
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

              {/* 3 Strategic Options Display */}
              {fixedBulletResult && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> 3 AI Strategic Rewrite Options
                  </span>

                  {fixedBulletResult.options?.map((opt: any, optIdx: number) => (
                    <div key={optIdx} className="p-3.5 rounded-2xl bg-muted/20 border border-black/5 dark:border-white/10 space-y-2 hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                            {opt.title}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{opt.focus}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{opt.length} chars</span>
                      </div>

                      <p className="text-xs font-mono font-medium text-foreground leading-relaxed bg-background/80 p-3 rounded-xl border border-black/5 dark:border-white/5">
                        {opt.text}
                      </p>

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(opt.text, `opt-${optIdx}`)}
                          className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                        >
                          {copiedBullet === `opt-${optIdx}` ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                          {copiedBullet === `opt-${optIdx}` ? "Copied to Clipboard!" : "Copy This Option"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setBulletToFix(null); setFixedBulletResult(null); }}
                className="text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteBulletFix}
                disabled={isFixingBullet}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
              >
                {isFixingBullet ? "Generating 3 AI Options..." : fixedBulletResult ? "Regenerate Options" : "Generate 3 AI Options"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-black/5 dark:border-white/5 text-center">
        <CreatorBadge />
      </footer>
    </div>
  )
}
