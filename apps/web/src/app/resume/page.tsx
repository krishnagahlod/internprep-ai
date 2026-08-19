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
  Brain, Columns, List, Sparkles, FileText, CheckSquare, Zap, ShieldCheck, 
  Gauge, Layers, SlidersHorizontal, Check
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

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("consult")
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

  // Workshop State
  const [activeWorkshopBullet, setActiveWorkshopBullet] = useState<any | null>(null)
  const [workshopMessages, setWorkshopMessages] = useState<{role: string, content: string}[]>([])
  const [workshopInput, setWorkshopInput] = useState("")
  const [isWorkshopLoading, setIsWorkshopLoading] = useState(false)
  const [finalWorkshopBullet, setFinalWorkshopBullet] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { setResumeText, user, isGuest, guestResumeCount, incrementGuestResume } = useAuthStore()
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
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/resume/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to analyze resume")
      }

      const data = await response.json()
      clearInterval(progressInterval)
      setResumeText(data.raw_text)
      setAnalysisResult(data.analysis)
      setIsSectionOnly(data.is_section_only || false)
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

  // Calculate stats
  const totalBullets = analysisResult?.bullets?.length || 0
  const metricsCount = analysisResult?.bullets?.filter((b: any) => b.severity === 'good' || !b.metrics_hint).length || 0
  const structuralIssues = analysisResult?.bullets?.reduce((acc: number, b: any) => acc + (b.structural_issues?.length || 0), 0) || 0
  const ruleViolations = analysisResult?.bullets?.reduce((acc: number, b: any) => acc + (b.best_practice_violations?.length || 0), 0) || 0
  const healthScore = analysisResult?.radar_scores ? Math.round(Object.values(analysisResult.radar_scores as Record<string, number>).reduce((a: any, b: any) => a + b, 0) / 6) : 0

  // Group bullets
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
                onClick={() => router.push("/ats-checker")} 
                className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold"
              >
                <Gauge className="h-3.5 w-3.5" /> ATS Scorecard Studio
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className={`container mx-auto px-4 md:px-8 relative z-10 ${!analysisResult ? 'py-12 max-w-3xl' : 'py-6 max-w-[1600px] h-[calc(100vh-56px)] flex flex-col'}`}>
          <div className="mb-8 shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold">
                STAR Framework & Deep Critique
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Resume Intelligence & Diagnostic</h1>
            <p className="text-muted-foreground text-sm">
              Upload your PDF to extract text, benchmark against Day 1 standards, and rewrite bullets in an interactive AI workshop.
            </p>
          </div>

          {!analysisResult ? (
            <div className="glass-panel dark:bg-neutral-900/40 rounded-3xl p-8 max-w-2xl mx-auto border-black/5 dark:border-white/10 shadow-xl space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">Initialize Resume Diagnostic</h2>
                <p className="text-muted-foreground text-xs">Calibrated for IIT Bombay placement and internship standards.</p>
              </div>
              
              <div className="space-y-6">
                {/* Resume Phase Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Resume Phase</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
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
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                        resumePhase === 'placement' 
                          ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/20' 
                          : 'bg-muted/10 border-input text-muted-foreground hover:bg-muted/20'
                      }`}
                      onClick={() => setResumePhase('placement')}
                      disabled={isUploading}
                    >
                      Placement Season
                    </button>
                  </div>
                </div>

                {/* Target Role Benchmark */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Target Role Benchmark</label>
                  <div className="relative">
                    <select 
                      className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/20 focus:bg-background focus:border-primary outline-none transition-all cursor-pointer text-foreground"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      disabled={isUploading}
                    >
                      <option value="consult">Management Consulting (McKinsey, BCG, Bain, Kearney)</option>
                      <option value="software">Software Engineering / IT (Google, Microsoft, Amazon, Uber)</option>
                      <option value="product">Product Management (Flipkart, Swiggy, Razorpay, Uber)</option>
                      <option value="finance">Finance & Quant (Goldman Sachs, Morgan Stanley, Citadel)</option>
                      <option value="analytics">Data Science & Analytics (Fractal, Tiger, EXL)</option>
                      <option value="fmcg">FMCG & Operations (HUL, P&G, ITC)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                      <ChevronDown className="h-5 w-5 opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Mode Switcher: Full PDF vs Section text */}
                <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex border-b border-black/5 dark:border-white/5">
                    <button
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        analysisMode === 'full' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setAnalysisMode('full')}
                      disabled={isUploading}
                    >
                      Upload 1-Page PDF
                    </button>
                    <button
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
                      <p className="text-xs text-muted-foreground">Strictly PDF format. Max 5MB.</p>
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
              </div>

              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Analysis Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Adaptive RAG & Multi-Pass Neural Engine Active...</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-black/10 dark:bg-white/10" />
                </div>
              )}

              <Button 
                className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all" 
                onClick={analysisMode === 'full' ? handleUpload : handleAnalyzeText} 
                disabled={(analysisMode === 'full' ? !file : !sectionText.trim()) || isUploading}
              >
                {isUploading ? "Executing Deep Analysis (~2 mins)..." : "Analyze Document & Generate Critiques"}
              </Button>
              
              <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-center">
                <p className="text-[11px] font-medium text-primary">
                  <ShieldAlert className="inline-block w-4 h-4 mr-1.5 mb-0.5" />
                  Privacy First: Your resume is processed in real-time and is never permanently stored or shared.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 border-t border-black/10 dark:border-white/10 mt-2 pt-6">
              
              {/* PDF Viewer Panel - Desktop Only */}
              <div className="hidden md:flex w-[40%] flex-col pr-4 border-r border-black/10 dark:border-white/10">
                <div className="w-full h-full glass-card dark:bg-neutral-900/40 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 p-2 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Source Resume Preview</span>
                    <Button variant="ghost" size="sm" onClick={() => { setAnalysisResult(null); setFile(null); }} className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                      Upload New
                    </Button>
                  </div>
                  <div className="flex-1 mt-2 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
                    {pdfUrl ? (
                      <iframe src={pdfUrl} className="w-full h-full rounded-xl border border-black/10 dark:border-white/10" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">PDF Preview Unavailable</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Analysis Content */}
              <div className="flex-1 overflow-y-auto px-2 md:pl-4 custom-scrollbar">
                <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                  {!isSectionOnly ? (
                    <>
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

                      {/* Scoring Dashboard */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-5 flex flex-col items-center justify-center">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">Competency Radar Analysis</h3>
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
                              <span>Target Domain: <strong className="text-foreground">{targetRole.toUpperCase()}</strong></span>
                              <span>Phase: <strong className="text-foreground">{resumePhase.toUpperCase()}</strong></span>
                            </div>
                          </div>

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
                    </>
                  ) : null}

                  {/* Bullet Critique List */}
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
                                            <span>Recommended Rewrite</span>
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
                  <div className="flex justify-center pb-8">
                    <CreatorBadge />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
