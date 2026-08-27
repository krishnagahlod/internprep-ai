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
import { FeedbackButton } from "@/components/creator-badge"

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
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/30"
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
          <span className={`text-3xl font-black font-mono-tech tracking-tight ${colors.text}`}>{score}</span>
          <span className="text-[9px] font-bold font-mono-tech uppercase tracking-widest text-muted-foreground">OUT OF 100</span>
        </div>
      </div>

      <div className="space-y-2 min-w-0 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Badge className={`px-2.5 py-0.5 font-semibold font-mono-tech text-[11px] border ${colors.badge}`}>
            {tier}
          </Badge>
          <span className="text-[11px] font-mono-tech text-muted-foreground uppercase flex items-center gap-1">
            {mode === "iitb_placement" ? (
              <><GraduationCap className="h-3.5 w-3.5 text-primary" /> IITB Day 1 Standard</>
            ) : (
              <><Building2 className="h-3.5 w-3.5 text-primary" /> Corporate ATS Standard</>
            )}
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {score >= 85 
            ? "Elite Placement Candidate Profile" 
            : score >= 72 
            ? "Strong Shortlist Contender" 
            : score >= 58 
            ? "Moderate Alignment — Key Gaps" 
            : "Formatting & Content Adjustments Required"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
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
    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
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
        <Badge className={`text-[10px] font-mono-tech px-2 py-0.5 border ${getStatusBadge()}`}>
          {score}% • {status}
        </Badge>
      </div>
    </div>
  );
};

// Sub-Tracks Mapping per Domain
const SUB_TRACKS_BY_ROLE: Record<string, { id: string; label: string }[]> = {
  software: [
    { id: "sde_generalist", label: "Full-Stack / General SDE" },
    { id: "frontend", label: "Frontend & Web Architecture" },
    { id: "backend", label: "Backend & Distributed Systems" },
    { id: "ai_ml", label: "AI/ML Engineering & LLMOps" },
    { id: "devops", label: "DevOps & Cloud Infrastructure" },
  ],
  consulting: [
    { id: "general_strategy", label: "General Strategy & Advisory" },
    { id: "operations", label: "Operations & Supply Chain" },
    { id: "esg", label: "ESG & Sustainability" },
    { id: "digital_ai", label: "Digital & AI Strategy" },
  ],
  product_management: [
    { id: "b2b_tech", label: "Technical & B2B SaaS PM" },
    { id: "b2c_growth", label: "Growth & B2C Product" },
  ],
  finance: [
    { id: "ib_pe", label: "Investment Banking & Private Equity" },
    { id: "quant_trading", label: "Quantitative Research & Trading" },
  ],
  analytics: [
    { id: "ml_ai", label: "Machine Learning & AI Modeling" },
    { id: "data_engineering", label: "Data Engineering & Big Data" },
    { id: "bi_analytics", label: "Business Intelligence & Product Analytics" },
  ],
};

export default function ATSCheckerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  
  // ATS Config
  const [targetRole, setTargetRole] = useState("software")
  const [subTrack, setSubTrack] = useState("sde_generalist")
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

  const handleRoleChange = (newRole: string) => {
    setTargetRole(newRole);
    const subTracks = SUB_TRACKS_BY_ROLE[newRole] || [];
    if (subTracks.length > 0) {
      setSubTrack(subTracks[0].id);
    }
  };

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

  const handleRunATS = async (overrideRole?: string, overrideSubTrack?: string, overrideMode?: "iitb_placement" | "global_ats", overrideJD?: string) => {
    if (!file && !atsReport) return;

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
      }

      formData.append("target_role", overrideRole || targetRole);
      formData.append("sub_track", overrideSubTrack || subTrack);
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

      {/* Sticky Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard")} 
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs font-mono-tech"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Dashboard
            </Button>
            <span className="text-border">/</span>
            <span className="text-xs font-mono-tech text-muted-foreground">ATS SCORE CHECKER & AUDITOR</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/resume")} 
              className="hidden sm:flex items-center gap-1.5 border-border text-foreground hover:bg-muted text-xs font-mono-tech h-8"
            >
              <Brain className="h-3.5 w-3.5 text-primary" /> Resume Workshop
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className={`container mx-auto px-4 sm:px-6 relative z-10 ${!atsReport ? 'py-8 max-w-4xl' : 'py-6 max-w-[1600px] flex-1 flex flex-col'}`}>
        
        {/* Banner Title */}
        <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [DAY 1 PLACEMENT CALIBRATED]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">DUAL-CALIBRATED NEURAL AUDITOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              ATS & Placement Score Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-sans">
              Comprehensive evaluation calibrated for IIT Bombay campus placement shortlisting and enterprise ATS systems (Workday, Greenhouse, Taleo).
            </p>
          </div>

          {atsReport && (
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowReasoningModal(true)} 
                className="text-xs font-mono-tech border-border hover:bg-muted h-8"
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-primary" /> Scoring Methodology
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setAtsReport(null); setFile(null); setPdfUrl(null); }} 
                className="text-xs font-mono-tech border-border hover:bg-muted h-8"
              >
                <UploadCloud className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Scan Another Resume
              </Button>
            </div>
          )}
        </div>

        {/* Pre-flight Architectural Cards when No Report */}
        {!atsReport && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
                <span>DUAL BENCHMARKS</span>
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-base font-bold font-mono-tech text-foreground">IITB & Corporate</div>
              <div className="text-[10px] text-muted-foreground">Day 1 policy vs Enterprise ATS</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
                <span>5 AUDIT PILLARS</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-base font-bold font-mono-tech text-foreground">100-Point Rubric</div>
              <div className="text-[10px] text-muted-foreground">Parse, Relevance, Verbs, Metrics, Budget</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
                <span>LINE HAZARD ENGINE</span>
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-base font-bold font-mono-tech text-foreground">Visual Overflows</div>
              <div className="text-[10px] text-muted-foreground">Fix orphan words eating line budget</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
              <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
                <span>DOMAIN TAXONOMY</span>
                <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-base font-bold font-mono-tech text-foreground">5 Roles / 14 Tracks</div>
              <div className="text-[10px] text-muted-foreground">Exact keyword & tool requirements</div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* INGESTION & CONFIGURATION FORM                                          */}
        {/* ----------------------------------------------------------------------- */}
        {!atsReport ? (
          <div className="rounded-2xl p-6 md:p-8 border border-border bg-card shadow-xs space-y-6">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 font-mono-tech">
                Evaluation Benchmark Standard
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    atsMode === 'iitb_placement' 
                      ? 'bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/30' 
                      : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                  onClick={() => setAtsMode('iitb_placement')}
                  disabled={isScanning}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider font-mono-tech">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    IIT Bombay Placement Standard
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-sans">
                    1-Page & 2-Page line budget, CPI & AP grade format, overview lines, Day-1 shortlisting rules.
                  </p>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    atsMode === 'global_ats' 
                      ? 'bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/30' 
                      : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                  onClick={() => setAtsMode('global_ats')}
                  disabled={isScanning}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider font-mono-tech">
                    <Building2 className="h-4 w-4 text-primary" />
                    Enterprise ATS (Workday / Greenhouse)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-sans">
                    Single-stream OCR parseability, exact skill taxonomy matching, power verbs & custom JD alignment.
                  </p>
                </button>
              </div>
            </div>

            {/* Target Role & Sub-Track Dual Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 font-mono-tech">Target Role Domain</label>
                <div className="relative">
                  <select 
                    className="appearance-none flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold shadow-xs hover:border-primary/40 focus:border-primary outline-none transition-all cursor-pointer text-foreground font-mono-tech"
                    value={targetRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={isScanning}
                  >
                    <option value="software">Software Engineering / IT (Google, Microsoft, Uber)</option>
                    <option value="consulting">Management Consulting (McKinsey, BCG, Bain)</option>
                    <option value="product_management">Product Management (Flipkart, Swiggy, Uber)</option>
                    <option value="finance">Finance & Quant (Goldman Sachs, Citadel, MS)</option>
                    <option value="analytics">Data Science & Analytics (Fractal, Tiger, EXL)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 font-mono-tech">Specialized Sub-Track</label>
                <div className="relative">
                  <select 
                    className="appearance-none flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold shadow-xs hover:border-primary/40 focus:border-primary outline-none transition-all cursor-pointer text-foreground font-mono-tech"
                    value={subTrack}
                    onChange={(e) => setSubTrack(e.target.value)}
                    disabled={isScanning}
                  >
                    {(SUB_TRACKS_BY_ROLE[targetRole] || []).map((st) => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Custom JD Matcher Drawer */}
            <div className="rounded-xl border border-border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono-tech">Target Company Job Description (Optional)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowJDInput(!showJDInput)} 
                  className="text-xs text-primary hover:bg-primary/10 h-7 font-mono-tech"
                >
                  {showJDInput ? "Hide JD Box" : "+ Match Custom JD"}
                </Button>
              </div>
              {showJDInput && (
                <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                  <p className="text-[11px] text-muted-foreground">
                    Paste the target job description to calculate exact core vs preferred skill match percentage and uncover missing critical qualifications.
                  </p>
                  <textarea
                    className="w-full h-28 p-3 rounded-xl border border-border bg-background text-xs shadow-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar font-mono-tech"
                    placeholder="Paste Job Description responsibilities and requirements here..."
                    value={customJD}
                    onChange={(e) => setCustomJD(e.target.value)}
                    disabled={isScanning}
                  />
                </div>
              )}
            </div>

            {/* 100% PDF-First Resume Dropzone */}
            <div className="pt-2 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-tech">Upload Resume PDF</span>
                <span className="text-[11px] font-mono-tech text-primary flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> PyMuPDF Geometry & Font Inspector
                </span>
              </div>

              <div className="relative border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-8 text-center transition-all bg-primary/5 cursor-pointer">
                <UploadCloud className="h-9 w-9 text-primary mx-auto mb-2.5 animate-pulse" />
                <p className="font-semibold text-foreground text-sm mb-1 font-mono-tech">Click or drag & drop your Resume PDF</p>
                <p className="text-xs text-muted-foreground">Supports LaTeX & Word-generated PDFs (1-Page & 2-Page Master Resumes)</p>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={isScanning}
                />
                {file && (
                  <div className="mt-4 px-4 py-1.5 bg-background rounded-full inline-flex items-center gap-2 text-xs font-mono-tech border border-border shadow-xs text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                )}
              </div>
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
                <div className="flex justify-between text-xs font-mono-tech text-muted-foreground">
                  <span>Evaluating 5 Pillars & Semantic Intelligence for {targetRole.toUpperCase()}...</span>
                  <span>{Math.floor(scanProgress)}%</span>
                </div>
                <Progress value={scanProgress} className="h-2 bg-muted" />
              </div>
            )}

            <Button 
              className="w-full h-11 text-xs font-bold font-mono-tech bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all" 
              onClick={() => handleRunATS()} 
              disabled={!file || isScanning}
            >
              {isScanning ? "Running Neural Parser & Placement Auditor..." : "Execute Comprehensive ATS Evaluation"}
            </Button>
            
            <div className="p-3 bg-muted/20 border border-border rounded-xl text-center">
              <p className="text-[11px] font-medium text-muted-foreground font-mono-tech">
                <ShieldCheck className="inline-block w-3.5 h-3.5 mr-1.5 text-primary mb-0.5" />
                Privacy First: Your document is processed strictly in-memory and is never permanently stored or shared.
              </p>
            </div>

          </div>
        ) : (
          /* ----------------------------------------------------------------------- */
          /* SCORECARD RESULTS VIEW                                                  */
          /* ----------------------------------------------------------------------- */
          <div className="flex flex-1 min-h-0 border-t border-border mt-2 pt-4">
            
            {/* PDF Viewer Panel - Desktop Only */}
            <div className="hidden lg:flex w-[35%] flex-col pr-4 border-r border-border">
              <div className="w-full h-full rounded-2xl overflow-hidden border border-border bg-card p-2 flex flex-col shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground font-mono-tech">
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Source Resume Preview</span>
                  <Badge variant="outline" className="text-[10px] font-mono-tech">
                    {atsReport.pillars?.formatting_layout?.page_count || 1}-Page Resume
                  </Badge>
                </div>
                <div className="flex-1 mt-2 rounded-xl overflow-hidden bg-muted/20 flex items-center justify-center">
                  {pdfUrl ? (
                    <iframe src={pdfUrl} className="w-full h-full rounded-xl border-none" />
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      PDF visual preview loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main Scorecard Content */}
            <div className="flex-1 overflow-y-auto px-2 lg:pl-6 custom-scrollbar pb-20 space-y-6 animate-in fade-in duration-500">
              
              {/* Benchmark Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 font-mono-tech">Standard:</span>
                  <button
                    onClick={() => { setAtsMode("iitb_placement"); handleRunATS(targetRole, subTrack, "iitb_placement"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-tech transition-all flex items-center gap-1.5 ${atsMode === "iitb_placement" ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> IITB Day 1
                  </button>
                  <button
                    onClick={() => { setAtsMode("global_ats"); handleRunATS(targetRole, subTrack, "global_ats"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-tech transition-all flex items-center gap-1.5 ${atsMode === "global_ats" ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Corporate ATS
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold font-mono-tech text-foreground outline-none cursor-pointer"
                    value={targetRole}
                    onChange={(e) => { 
                      const newRole = e.target.value;
                      setTargetRole(newRole); 
                      const defaultSub = SUB_TRACKS_BY_ROLE[newRole]?.[0]?.id || "";
                      setSubTrack(defaultSub);
                      handleRunATS(newRole, defaultSub, atsMode); 
                    }}
                  >
                    <option value="software">Software Engineering</option>
                    <option value="consulting">Management Consulting</option>
                    <option value="product_management">Product Management</option>
                    <option value="finance">Finance / Quant</option>
                    <option value="analytics">Data Science & Analytics</option>
                  </select>

                  <select 
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold font-mono-tech text-foreground outline-none cursor-pointer"
                    value={subTrack}
                    onChange={(e) => { 
                      const newSub = e.target.value;
                      setSubTrack(newSub); 
                      handleRunATS(targetRole, newSub, atsMode); 
                    }}
                  >
                    {(SUB_TRACKS_BY_ROLE[targetRole] || []).map((st) => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJDInput(!showJDInput)}
                    className="h-8 px-2.5 text-xs font-mono-tech border-border hover:bg-muted"
                  >
                    <Search className="h-3.5 w-3.5 mr-1 text-primary" />
                    {atsReport.is_custom_jd ? "Edit JD" : "Match JD"}
                  </Button>
                </div>
              </div>

              {/* Custom JD Drawer */}
              {showJDInput && (
                <div className="p-4 rounded-xl bg-card border border-border space-y-3 animate-in fade-in duration-300 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-mono-tech">
                      <Sparkles className="h-3.5 w-3.5" /> Target Job Description Matcher
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-mono-tech">Extracts required tools & computes exact skill match %</span>
                  </div>
                  <textarea
                    className="w-full h-28 p-3 rounded-xl border border-border bg-background text-xs shadow-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar font-mono-tech"
                    placeholder="Paste the target job description here..."
                    value={customJD}
                    onChange={(e) => setCustomJD(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setCustomJD(""); handleRunATS(targetRole, subTrack, atsMode, ""); }} 
                      className="h-8 text-xs font-mono-tech text-muted-foreground"
                    >
                      Reset to Domain Preset
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleRunATS(targetRole, subTrack, atsMode, customJD)} 
                      disabled={isScanning || !customJD.trim()}
                      className="h-8 text-xs font-mono-tech bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      {isScanning ? "Matching Skills..." : "Calculate JD Match %"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Master Split Hero: Gauge on Left + Quick Wins Roadmap on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left: Master Gauge Card */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border shadow-xs flex items-center">
                  <MasterScoreGauge 
                    score={atsReport.overall_score} 
                    tier={atsReport.tier} 
                    mode={atsReport.mode} 
                    roleLabel={atsReport.target_role_label}
                  />
                </div>

                {/* Right: Quick Wins Roadmap Card */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 font-mono-tech">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Immediate Score Roadmap
                      </span>
                      <span className="text-[11px] font-mono-tech text-muted-foreground">High-Yield Priorities</span>
                    </div>

                    <div className="space-y-2">
                      {atsReport.quick_wins?.map((qw: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-muted/20 border border-border flex items-center justify-between gap-3 hover:border-primary/30 transition-all">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono-tech shrink-0">
                                {qw.impact_pts}
                              </Badge>
                              <p className="text-xs font-bold text-foreground truncate">{qw.title}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-sans">{qw.hint}</p>
                          </div>

                          {qw.action_type === "inject_keyword" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setActiveSubTab("keywords")} 
                              className="h-6 px-2 text-[10px] font-mono-tech text-primary hover:bg-primary/10 shrink-0"
                            >
                              View Skills <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                          {qw.action_type === "trim_line_wrap" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setActiveSubTab("line_wrap")} 
                              className="h-6 px-2 text-[10px] font-mono-tech text-primary hover:bg-primary/10 shrink-0"
                            >
                              Trim Lines <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
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
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                      <div className="ml-2">
                        <AlertTitle className="font-bold text-xs font-mono-tech text-rose-700 dark:text-rose-400">
                          {alert.title}
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1 leading-relaxed text-rose-900/80 dark:text-rose-200/90 font-sans">
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
                <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5 font-mono-tech"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Parseability</span>
                      <span className="font-mono-tech font-bold text-foreground">{atsReport.pillars?.parseability?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.parseability?.score} className="h-1.5 mb-2" />
                    <p className="text-[11px] text-muted-foreground font-sans">
                      Layout structure & entity extraction hygiene.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
                    <span>Text Stream</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Parsed</span>
                  </div>
                </div>

                {/* Pillar 2: Keyword Match */}
                <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5 font-mono-tech"><Target className="h-3.5 w-3.5 text-primary" /> Skill Match</span>
                      <span className="font-mono-tech font-bold text-foreground">{atsReport.pillars?.keyword_match?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.keyword_match?.score} className="h-1.5 mb-2" />
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.keyword_match?.found_critical_count} of {atsReport.pillars?.keyword_match?.total_critical_count} skills matched.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
                    <span>Domain</span>
                    <span className="font-semibold text-primary truncate max-w-[100px]">{atsReport.target_role_label}</span>
                  </div>
                </div>

                {/* Pillar 3: Quantification */}
                <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5 font-mono-tech"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Quantification</span>
                      <span className="font-mono-tech font-bold text-foreground">{atsReport.pillars?.quantification?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.quantification?.score} className="h-1.5 mb-2" />
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.quantification?.quantification_ratio}% bullets have metrics.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
                    <span>Benchmark</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">&gt;75% Target</span>
                  </div>
                </div>

                {/* Pillar 4: Action Verbs */}
                <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5 font-mono-tech"><Zap className="h-3.5 w-3.5 text-primary" /> Action Verbs</span>
                      <span className="font-mono-tech font-bold text-foreground">{atsReport.pillars?.action_verbs?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.action_verbs?.score} className="h-1.5 mb-2" />
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.action_verbs?.weak_verb_count} weak verbs detected.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
                    <span>Voice</span>
                    <span className="font-semibold text-primary">Active Voice</span>
                  </div>
                </div>

                {/* Pillar 5: Formatting & Budget */}
                <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5 font-mono-tech"><SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Line Budget</span>
                      <span className="font-mono-tech font-bold text-foreground">{atsReport.pillars?.formatting_layout?.score}%</span>
                    </div>
                    <Progress value={atsReport.pillars?.formatting_layout?.score} className="h-1.5 mb-2" />
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.formatting_layout?.word_count} words ({atsReport.pillars?.formatting_layout?.page_count || 1}-Page).
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
                    <span>Visual Wraps</span>
                    <span className={`font-semibold ${atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length || 0} Orphan Flags
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-view Navigation Tabs: Sleek Segmented Switcher */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-muted/30 border border-border text-xs font-mono-tech">
                <button
                  onClick={() => setActiveSubTab("overview")}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === "overview" ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  1. Pillar Health & Checks
                </button>
                <button
                  onClick={() => setActiveSubTab("sections")}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === "sections" ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  2. Section Quality
                </button>
                <button
                  onClick={() => setActiveSubTab("keywords")}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === "keywords" ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  3. Skill & Keyword Matrix
                  <Badge className="h-4 px-1 text-[9px] font-mono-tech bg-primary/20 text-primary border-none">
                    {atsReport.pillars?.keyword_match?.found_critical_count} / {atsReport.pillars?.keyword_match?.total_critical_count}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveSubTab("line_wrap")}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === "line_wrap" ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  4. Line-Wrap Hazards
                  {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 && (
                    <Badge className="h-4 px-1 text-[9px] font-mono-tech bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none">
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveSubTab("raw_stream")}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    activeSubTab === "raw_stream" ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  5. ATS Bot Stream
                </button>
              </div>

              {/* Sub-view 1: Overview & Checks */}
              {activeSubTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  {/* Parseability & Formatting Checks */}
                  <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono-tech">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Technical & Parseability Verification
                      </h4>
                      <span className="text-[11px] font-mono-tech text-primary font-semibold">
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
                  <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono-tech">
                        <Target className="h-4 w-4 text-primary" /> Quantification & Language Health
                      </h4>
                      <span className="text-[11px] font-mono-tech text-primary font-semibold">
                        Score: {atsReport.pillars?.quantification?.score}%
                      </span>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground font-mono-tech">Metrics Diversity Breakdown</span>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech">
                          {atsReport.pillars?.quantification?.metric_types_found?.length || 0} Categories Present
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {atsReport.pillars?.quantification?.metric_types_found?.map((mt: string, i: number) => (
                          <Badge key={i} className="text-[10px] font-mono-tech bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                            <Check className="h-3 w-3 mr-1 inline" /> {mt}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {atsReport.pillars?.action_verbs?.repetitive_verbs?.length > 0 && (
                      <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground font-mono-tech">Repetitive Action Verbs</span>
                          <span className="text-[10px] text-amber-500 font-mono-tech">Variety Advisory</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans">
                          Repeating opening verbs reduces impact. Detected:{" "}
                          <span className="font-mono-tech font-bold text-amber-500">
                            {atsReport.pillars?.action_verbs?.repetitive_verbs.join(", ")}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Tier-1 Benchmark Bullet Structure (ACR Anatomy) Inspector */}
                    {atsReport.pillars?.quantification?.xyz_deconstruction?.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 font-mono-tech">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> Tier-1 Benchmark Bullet Structure (ACR Anatomy):
                        </span>
                        {atsReport.pillars?.quantification?.xyz_deconstruction.slice(0, 3).map((xyz: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-muted/20 border border-border space-y-1.5">
                            <p className="text-xs font-mono-tech text-foreground line-clamp-1 italic">"{xyz.bullet_text}"</p>
                            <div className="flex flex-wrap gap-1 text-[9px] font-mono-tech">
                              <Badge className={`px-1.5 py-0 ${xyz.has_action_verb ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                                {xyz.has_action_verb ? "Action: Strong" : "Action: Weak"}
                              </Badge>
                              <Badge className={`px-1.5 py-0 ${
                                xyz.is_causal_metric 
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold" 
                                  : xyz.has_metric_y 
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              }`}>
                                {xyz.is_causal_metric ? "Outcome: Quantified Metric" : xyz.has_metric_y ? "Metric: Activity / Scope" : "Outcome Metric: Missing"}
                              </Badge>
                              <Badge className={`px-1.5 py-0 ${xyz.has_mechanism_z ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                                {xyz.has_mechanism_z ? "Context/Method: Clear" : "Context/Method: Add Context"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-view: Multi-Dimensional Section Quality Diagnostics */}
              {activeSubTab === "sections" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 font-mono-tech">
                        <Sparkles className="h-4 w-4" /> Multi-Dimensional Section Quality Diagnostics
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans">
                        Audited across 4 standardized industry & campus placement benchmarks (25% weight each) with realistic score calibration.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono-tech border-border text-foreground w-fit">
                      5 Key Sections Audited
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Section 1: Work Experience Card */}
                    {atsReport.section_health?.experience && (
                      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/30 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Briefcase className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-foreground font-mono-tech">{atsReport.section_health.experience.name}</h5>
                                <span className="text-[10px] text-muted-foreground font-mono-tech">{atsReport.section_health.experience.bullets_count} Points Audited</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`font-mono-tech text-xs px-2.5 py-0.5 border ${
                                atsReport.section_health.experience.score >= 82 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : atsReport.section_health.experience.score >= 72
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                {atsReport.section_health.experience.score}% • {atsReport.section_health.experience.status}
                              </Badge>
                            </div>
                          </div>

                          {/* 4-Dimension Sub-Metric Progress Bars */}
                          <div className="space-y-2.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-tech">
                              Standardized Evaluation Dimensions (25% Each)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {atsReport.section_health.experience.dimensions?.map((dim: any, dIdx: number) => (
                                <div key={dIdx} className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-foreground truncate">{dim.name}</span>
                                    <span className="font-mono-tech font-bold text-primary shrink-0 ml-1">{dim.score}%</span>
                                  </div>
                                  <Progress value={dim.score} className="h-1.5" />
                                  <span className="text-[9px] text-muted-foreground font-mono-tech block truncate">Criteria: {dim.benchmark}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* AI Strengths */}
                          {atsReport.section_health.experience.strengths?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono-tech">
                                <Check className="h-3 w-3" /> Key Highlights & Strengths
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.experience.strengths.map((str: string, sIdx: number) => (
                                  <p key={sIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40 font-sans">
                                    {str}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Targeted Recommendations */}
                          {atsReport.section_health.experience.gaps?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono-tech">
                                  <Sparkles className="h-3 w-3" /> Targeted Recommendation
                                </span>
                                <button
                                  onClick={() => { setFixType("power_verb"); setBulletToFix({ bullet_text: "" }); }}
                                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 font-mono-tech"
                                >
                                  + Launch AI Fix
                                </button>
                              </div>
                              <div className="space-y-1">
                                {atsReport.section_health.experience.gaps.map((gap: string, gIdx: number) => (
                                  <p key={gIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans">
                                    {gap}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 2: Technical Projects Card */}
                    {atsReport.section_health?.projects && (
                      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/30 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <FolderGit2 className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-foreground font-mono-tech">{atsReport.section_health.projects.name}</h5>
                                <span className="text-[10px] text-muted-foreground font-mono-tech">{atsReport.section_health.projects.bullets_count} Points Audited</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`font-mono-tech text-xs px-2.5 py-0.5 border ${
                                atsReport.section_health.projects.score >= 82 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : atsReport.section_health.projects.score >= 72
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                {atsReport.section_health.projects.score}% • {atsReport.section_health.projects.status}
                              </Badge>
                            </div>
                          </div>

                          {/* 4-Dimension Sub-Metric Progress Bars */}
                          <div className="space-y-2.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-tech">
                              Standardized Evaluation Dimensions (25% Each)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {atsReport.section_health.projects.dimensions?.map((dim: any, dIdx: number) => (
                                <div key={dIdx} className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-foreground truncate">{dim.name}</span>
                                    <span className="font-mono-tech font-bold text-primary shrink-0 ml-1">{dim.score}%</span>
                                  </div>
                                  <Progress value={dim.score} className="h-1.5" />
                                  <span className="text-[9px] text-muted-foreground font-mono-tech block truncate">Criteria: {dim.benchmark}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* AI Strengths */}
                          {atsReport.section_health.projects.strengths?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono-tech">
                                <Check className="h-3 w-3" /> Key Highlights & Strengths
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.projects.strengths.map((str: string, sIdx: number) => (
                                  <p key={sIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40 font-sans">
                                    {str}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Targeted Recommendations */}
                          {atsReport.section_health.projects.gaps?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono-tech">
                                  <Sparkles className="h-3 w-3" /> Targeted Recommendation
                                </span>
                                <button
                                  onClick={() => { setFixType("quantify"); setBulletToFix({ bullet_text: "" }); }}
                                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 font-mono-tech"
                                >
                                  + Launch AI Fix
                                </button>
                              </div>
                              <div className="space-y-1">
                                {atsReport.section_health.projects.gaps.map((gap: string, gIdx: number) => (
                                  <p key={gIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans">
                                    {gap}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Scholastic Achievements & Education */}
                    {atsReport.section_health?.education && (
                      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/30 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <GraduationCap className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-foreground font-mono-tech">{atsReport.section_health.education.name}</h5>
                                <span className="text-[10px] text-muted-foreground font-mono-tech">Academic Verification</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`font-mono-tech text-xs px-2.5 py-0.5 border ${
                                atsReport.section_health.education.score >= 80 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                {atsReport.section_health.education.score}% • {atsReport.section_health.education.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-tech">
                              Standardized Evaluation Dimensions (25% Each)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {atsReport.section_health.education.dimensions?.map((dim: any, dIdx: number) => (
                                <div key={dIdx} className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-foreground truncate">{dim.name}</span>
                                    <span className="font-mono-tech font-bold text-primary shrink-0 ml-1">{dim.score}%</span>
                                  </div>
                                  <Progress value={dim.score} className="h-1.5" />
                                  <span className="text-[9px] text-muted-foreground font-mono-tech block truncate">Criteria: {dim.benchmark}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {atsReport.section_health.education.strengths?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono-tech">
                                <Check className="h-3 w-3" /> Key Highlights & Strengths
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.education.strengths.map((str: string, sIdx: number) => (
                                  <p key={sIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40 font-sans">
                                    {str}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {atsReport.section_health.education.gaps?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono-tech">
                                <Sparkles className="h-3 w-3" /> Targeted Recommendation
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.education.gaps.map((gap: string, gIdx: number) => (
                                  <p key={gIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans">
                                    {gap}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 4: Technical Skills Matrix */}
                    {atsReport.section_health?.skills && (
                      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/30 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Wrench className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-foreground font-mono-tech">{atsReport.section_health.skills.name}</h5>
                                <span className="text-[10px] text-muted-foreground font-mono-tech">Taxonomy Structure</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`font-mono-tech text-xs px-2.5 py-0.5 border ${
                                atsReport.section_health.skills.score >= 80 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                {atsReport.section_health.skills.score}% • {atsReport.section_health.skills.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-tech">
                              Standardized Evaluation Dimensions (25% Each)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {atsReport.section_health.skills.dimensions?.map((dim: any, dIdx: number) => (
                                <div key={dIdx} className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-foreground truncate">{dim.name}</span>
                                    <span className="font-mono-tech font-bold text-primary shrink-0 ml-1">{dim.score}%</span>
                                  </div>
                                  <Progress value={dim.score} className="h-1.5" />
                                  <span className="text-[9px] text-muted-foreground font-mono-tech block truncate">Criteria: {dim.benchmark}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {atsReport.section_health.skills.strengths?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono-tech">
                                <Check className="h-3 w-3" /> Key Highlights & Strengths
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.skills.strengths.map((str: string, sIdx: number) => (
                                  <p key={sIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40 font-sans">
                                    {str}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {atsReport.section_health.skills.gaps?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono-tech">
                                <Sparkles className="h-3 w-3" /> Targeted Recommendation
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.skills.gaps.map((gap: string, gIdx: number) => (
                                  <p key={gIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans">
                                    {gap}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 5: Leadership & PoR */}
                    {atsReport.section_health?.leadership && (
                      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/30 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-foreground font-mono-tech">{atsReport.section_health.leadership.name}</h5>
                                <span className="text-[10px] text-muted-foreground font-mono-tech">{atsReport.section_health.leadership.bullets_count} Points Audited</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`font-mono-tech text-xs px-2.5 py-0.5 border ${
                                atsReport.section_health.leadership.score >= 80 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}>
                                {atsReport.section_health.leadership.score}% • {atsReport.section_health.leadership.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-tech">
                              Standardized Evaluation Dimensions (25% Each)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {atsReport.section_health.leadership.dimensions?.map((dim: any, dIdx: number) => (
                                <div key={dIdx} className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1.5">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-foreground truncate">{dim.name}</span>
                                    <span className="font-mono-tech font-bold text-primary shrink-0 ml-1">{dim.score}%</span>
                                  </div>
                                  <Progress value={dim.score} className="h-1.5" />
                                  <span className="text-[9px] text-muted-foreground font-mono-tech block truncate">Criteria: {dim.benchmark}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {atsReport.section_health.leadership.strengths?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono-tech">
                                <Check className="h-3 w-3" /> Key Highlights & Strengths
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.leadership.strengths.map((str: string, sIdx: number) => (
                                  <p key={sIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40 font-sans">
                                    {str}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {atsReport.section_health.leadership.gaps?.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono-tech">
                                <Sparkles className="h-3 w-3" /> Targeted Recommendation
                              </span>
                              <div className="space-y-1">
                                {atsReport.section_health.leadership.gaps.map((gap: string, gIdx: number) => (
                                  <p key={gIdx} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans">
                                    {gap}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-view 2: Categorized Competencies & Skill Matrix */}
              {activeSubTab === "keywords" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Custom JD Match Overview if Present */}
                  {atsReport.pillars?.keyword_match?.jd_match_info && (
                    <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 font-mono-tech">
                          <Target className="h-4 w-4" /> Target Job Description Skill Match: {atsReport.pillars?.keyword_match?.jd_match_info?.match_rate}%
                        </h4>
                        <Badge className="bg-primary text-primary-foreground font-mono-tech text-xs">
                          {atsReport.pillars?.keyword_match?.jd_match_info?.found} / {atsReport.pillars?.keyword_match?.jd_match_info?.total} Skills
                        </Badge>
                      </div>

                      {atsReport.pillars?.keyword_match?.jd_match_info?.core_skills && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                          <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Core Mandatory Skills (70% Weight)
                              </span>
                              <Badge className="text-[10px] font-mono-tech bg-primary/10 text-primary border-primary/20">
                                {atsReport.pillars.keyword_match.jd_match_info.core_found?.length || 0} / {atsReport.pillars.keyword_match.jd_match_info.core_skills?.length || 0}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {atsReport.pillars.keyword_match.jd_match_info.core_found?.map((s: string, i: number) => (
                                <Badge key={i} className="text-[10px] font-mono-tech bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Check className="h-3 w-3 mr-1" /> {s}
                                </Badge>
                              ))}
                              {atsReport.pillars.keyword_match.jd_match_info.core_missing?.map((s: string, i: number) => (
                                <Badge key={i} className="text-[10px] font-mono-tech bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <AlertCircle className="h-3 w-3 mr-1" /> {s}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Preferred & Secondary Tools (30% Weight)
                              </span>
                              <Badge className="text-[10px] font-mono-tech bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                {atsReport.pillars.keyword_match.jd_match_info.pref_found?.length || 0} / {atsReport.pillars.keyword_match.jd_match_info.pref_skills?.length || 0}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {atsReport.pillars.keyword_match.jd_match_info.pref_found?.map((s: string, i: number) => (
                                <Badge key={i} className="text-[10px] font-mono-tech bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Check className="h-3 w-3 mr-1" /> {s}
                                </Badge>
                              ))}
                              {atsReport.pillars.keyword_match.jd_match_info.pref_missing?.map((s: string, i: number) => (
                                <Badge key={i} className="text-[10px] font-mono-tech bg-muted text-muted-foreground border border-border">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Missing High-Yield Competencies Box */}
                  {atsReport.pillars?.keyword_match?.missing_critical?.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2 font-mono-tech">
                          <AlertTriangle className="h-4 w-4" /> Recommended High-Priority Competencies ({atsReport.pillars?.keyword_match?.missing_critical?.length})
                        </h4>
                        <span className="text-[11px] font-mono-tech text-muted-foreground">Click any skill to launch 1-Click AI Bullet Injector</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {atsReport.pillars?.keyword_match?.missing_critical.map((kw: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => { setMissingKeywordToInject(kw); setFixType("inject_keyword"); setBulletToFix({ bullet_text: "" }); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-mono-tech bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                          >
                            <span className="text-rose-500 font-bold">+</span> {kw}
                            <span className="text-[9px] opacity-70 underline ml-0.5">Inject</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorized Matrix Breakdown */}
                  {atsReport.pillars?.keyword_match?.categorized_matrix ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {atsReport.pillars?.keyword_match?.categorized_matrix.map((cat: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                              {cat.category}
                              {cat.is_priority_subtrack && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono-tech px-1.5 py-0">
                                  Sub-Track Priority
                                </Badge>
                              )}
                            </h5>
                            <Badge variant="outline" className="text-[10px] font-mono-tech">
                              {cat.matched?.length} / {(cat.matched?.length || 0) + (cat.missing?.length || 0)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {cat.matched?.map((m: any, mi: number) => (
                              <div key={mi} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-tech flex items-center justify-between gap-2">
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 truncate">
                                  <Check className="h-3 w-3 shrink-0" /> {m.name}
                                </span>
                                {m.is_implicit ? (
                                  <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 shrink-0 font-mono-tech flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5" /> AI Inferred
                                  </Badge>
                                ) : (
                                  <span className="text-[9px] font-mono-tech text-muted-foreground opacity-70 truncate max-w-[90px] shrink-0">
                                    via "{m.matched_via}"
                                  </span>
                                )}
                              </div>
                            ))}

                            {cat.missing?.map((ms: string, msi: number) => (
                              <div key={msi} className="p-2 rounded-lg bg-muted/20 border border-dashed border-border text-xs font-mono-tech flex items-center justify-between">
                                <span className="text-muted-foreground">{ms}</span>
                                <button 
                                  onClick={() => { setMissingKeywordToInject(ms); setFixType("inject_keyword"); setBulletToFix({ bullet_text: "" }); }}
                                  className="text-[10px] text-primary font-bold hover:underline font-mono-tech"
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
                  <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1 font-mono-tech">
                      Visual Geometry & Line Budget Inspector ({atsReport.pillars?.formatting_layout?.page_count || 1}-Page Resume)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      Uses PDF visual line bounding-box analysis to detect genuine orphan line wraps (where a point renders across multiple lines and spills only 1–3 trailing words onto the final line, leaving excessive empty margin space).
                    </p>
                  </div>

                  {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 ? (
                    <div className="space-y-3">
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards.map((hazard: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3 hover:border-amber-500/40 transition-all">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 font-mono-tech">
                                {hazard.section} • {hazard.char_length} Chars
                              </Badge>
                              {hazard.visual_lines && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono-tech">
                                  {hazard.visual_lines} Visual Lines
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] font-mono-tech text-rose-500 font-semibold">
                              Trim ~{hazard.chars_to_trim} chars to eliminate orphan line
                            </span>
                          </div>

                          <p className="text-xs font-mono-tech text-foreground/90 bg-muted/20 p-3 rounded-lg border border-border leading-relaxed">
                            "{hazard.bullet_text}"
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-muted-foreground font-sans">{hazard.reason}</span>
                            <Button 
                              size="sm" 
                              onClick={() => { setBulletToFix(hazard); setFixType("trim_line_wrap"); }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono-tech font-semibold h-8"
                            >
                              <Sparkles className="h-3 w-3 mr-1" /> 1-Click AI Trim
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-card border border-border text-center space-y-2 shadow-xs">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-foreground font-mono-tech">Zero Visual Orphan Hazards Detected</h4>
                      <p className="text-xs text-muted-foreground font-sans">
                        All points render with clean single lines or well-filled multi-lines across your {atsReport.pillars?.formatting_layout?.page_count || 1}-page placement document.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-view 4: Raw ATS Text Preview */}
              {activeSubTab === "raw_stream" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs text-muted-foreground font-mono-tech shadow-xs">
                    <span>Plain Text Stream parsed by automated ATS scrapers (Workday, Greenhouse, Portal Bots)</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(atsReport.pillars?.parseability?.raw_text_preview || "", "raw")} className="h-7 text-xs font-mono-tech text-primary hover:bg-primary/10">
                      {copiedBullet === "raw" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copiedBullet === "raw" ? "Copied!" : "Copy Text"}
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border text-foreground font-mono-tech text-xs leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    <pre className="whitespace-pre-wrap">{atsReport.pillars?.parseability?.raw_text_preview || "No raw text stream available."}</pre>
                  </div>
                </div>
              )}

              {/* Bottom Placement Feedback (Only shown at the end of audit scorecard) */}
              <div className="mt-8 p-5 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono-tech">
                    ATS Audit & Rubric Feedback
                  </h5>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    Have suggestions on this audit score, pillar rubrics, or missing role keywords?
                  </p>
                </div>
                <FeedbackButton context="ATS Scorecard Studio" label="Share Audit Feedback" />
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Scoring Methodology & Reasoning Modal */}
      {showReasoningModal && atsReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-2xl w-full border border-border shadow-xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-foreground font-mono-tech">
                  <Brain className="h-5 w-5 text-primary" />
                  Detailed Scoring Methodology & Reasoning
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                  Calibrated mathematical weights and evaluation backing for {atsReport.target_role_label}.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowReasoningModal(false)} className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-primary text-[11px] font-mono-tech">Pillar Weight Distribution</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono-tech">
                  <div className="p-2.5 rounded-lg bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">Skill Alignment</span>
                    <strong className="text-foreground text-sm">30% Weight</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">Quantification</span>
                    <strong className="text-foreground text-sm">25% Weight</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">Parseability</span>
                    <strong className="text-foreground text-sm">15% Weight</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">Action Verbs</span>
                    <strong className="text-foreground text-sm">15% Weight</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border">
                    <span className="text-muted-foreground block text-[10px]">Line Budget</span>
                    <strong className="text-foreground text-sm">15% Weight</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] font-mono-tech">Evaluation Standards</h4>
                
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Technical & Parseability (15%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed font-sans">
                    Evaluates single-stream text layer extraction and standard category hierarchy. In IIT Bombay placement mode, contact headers (phone, email, github) are managed by the campus placement portal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                    <Target className="h-3.5 w-3.5 text-primary" /> Role & Skill Alignment (30%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed font-sans">
                    Compares bullet text against comprehensive domain taxonomies ({atsReport.target_role_label}) and custom Job Descriptions using deterministic synonym mapping combined with deep AI semantic inference.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Quantification & Impact Index (25%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed font-sans">
                    Measures the percentage of bullets containing hard metrics (%, currencies, scale, latencies) and rewards metric diversity across sections (&gt;75% benchmark).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                    <Zap className="h-3.5 w-3.5 text-primary" /> Action Verbs & Voice (15%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed font-sans">
                    Penalizes passive fillers (e.g., "helped with", "worked on") and excessive repetition of the same opening verb, prioritizing executive action verbs.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <strong className="text-foreground flex items-center gap-1.5 font-mono-tech">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Visual Line Budget & Margins (15%)
                  </strong>
                  <p className="text-muted-foreground leading-relaxed font-sans">
                    Uses PyMuPDF visual bounding box analysis on rendered PDF pages. Only flags genuine orphan lines that leave excessive empty margins.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button size="sm" onClick={() => setShowReasoningModal(false)} className="bg-primary text-primary-foreground font-semibold text-xs h-8 font-mono-tech">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced 1-Click AI Bullet Optimizer Modal with 3 Strategic Options + LaTeX Copy */}
      {bulletToFix && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 max-w-2xl w-full border border-border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground font-mono-tech">
                <Sparkles className="h-4 w-4 text-primary" />
                Context-Aware AI Bullet Optimizer
              </h3>
              <Button variant="ghost" size="icon" onClick={() => { setBulletToFix(null); setFixedBulletResult(null); }} className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono-tech">Original Bullet</span>
                <p className="text-xs font-mono-tech p-3 rounded-xl bg-muted/20 text-foreground border border-border mt-1 leading-relaxed">
                  "{bulletToFix.bullet_text || bulletToFix.original_bullet}"
                </p>
                <span className="text-[10px] text-muted-foreground block mt-1 font-mono-tech">Length: {(bulletToFix.bullet_text || bulletToFix.original_bullet || "").length} characters</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block font-mono-tech">Optimization Goal</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setFixType("power_verb")}
                    className={`p-2 rounded-xl text-xs font-medium font-mono-tech border text-left transition-all ${fixType === "power_verb" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-border text-muted-foreground"}`}
                  >
                    Action Verb Upgrade
                  </button>
                  <button
                    onClick={() => setFixType("quantify")}
                    className={`p-2 rounded-xl text-xs font-medium font-mono-tech border text-left transition-all ${fixType === "quantify" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-border text-muted-foreground"}`}
                  >
                    Metric Brackets
                  </button>
                  <button
                    onClick={() => setFixType("inject_keyword")}
                    className={`p-2 rounded-xl text-xs font-medium font-mono-tech border text-left transition-all ${fixType === "inject_keyword" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-border text-muted-foreground"}`}
                  >
                    Inject Keyword
                  </button>
                  <button
                    onClick={() => setFixType("trim_line_wrap")}
                    className={`p-2 rounded-xl text-xs font-medium font-mono-tech border text-left transition-all ${fixType === "trim_line_wrap" ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-border text-muted-foreground"}`}
                  >
                    Line-Wrap Trim
                  </button>
                </div>
              </div>

              {fixType === "inject_keyword" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 font-mono-tech">Keyword to Weave In</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-mono-tech text-foreground outline-none focus:border-primary"
                    placeholder="e.g. System Design, Market Sizing, PyTorch..."
                    value={missingKeywordToInject}
                    onChange={(e) => setMissingKeywordToInject(e.target.value)}
                  />
                </div>
              )}

              {/* 3 Strategic Options Display */}
              {fixedBulletResult && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-mono-tech">
                    <Sparkles className="h-3.5 w-3.5" /> 3 AI Strategic Rewrite Options
                  </span>

                  {fixedBulletResult.options?.map((opt: any, optIdx: number) => (
                    <div key={optIdx} className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-2 hover:border-primary/40 transition-all shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold font-mono-tech">
                            {opt.title}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono-tech">{opt.focus}</span>
                        </div>
                        <span className="text-[10px] font-mono-tech text-muted-foreground">{opt.length} chars</span>
                      </div>

                      <p className="text-xs font-mono-tech font-medium text-foreground leading-relaxed bg-background p-3 rounded-lg border border-border">
                        {opt.text}
                      </p>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(opt.latex_item || `\\item ${opt.text}`, `latex-${optIdx}`)}
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground font-mono-tech"
                        >
                          {copiedBullet === `latex-${optIdx}` ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <FileText className="h-3 w-3 mr-1" />}
                          {copiedBullet === `latex-${optIdx}` ? "Copied LaTeX!" : "Copy as LaTeX \\item"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(opt.text, `opt-${optIdx}`)}
                          className="h-7 text-xs border-border hover:bg-muted font-mono-tech font-semibold"
                        >
                          {copiedBullet === `opt-${optIdx}` ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                          {copiedBullet === `opt-${optIdx}` ? "Copied Plain Text!" : "Copy Text"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setBulletToFix(null); setFixedBulletResult(null); }}
                className="text-xs font-mono-tech font-semibold"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteBulletFix}
                disabled={isFixingBullet}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono-tech font-semibold"
              >
                {isFixingBullet ? "Generating 3 AI Options..." : fixedBulletResult ? "Regenerate Options" : "Generate 3 AI Options"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
