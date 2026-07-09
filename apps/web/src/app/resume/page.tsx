"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, MessageSquare, X, Send, Activity, ShieldAlert, Target, Copy, Lightbulb, ChevronDown, ChevronUp, Brain, Columns, List } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreatorBadge } from "@/components/creator-badge"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { BulletDiff } from "@/components/resume/bullet-diff"

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
  const [targetRole, setTargetRole] = useState("consulting")
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"section" | "severity">("section")
  
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
        initial[sec] = true; // all expanded by default
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

    // Simulate gradual progress since analysis can take a few minutes
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        // slow down as it gets closer to 95
        const increment = prev < 40 ? 5 : prev < 75 ? 2 : 0.5;
        return prev + increment;
      })
    }, 2000)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target_role", targetRole)
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
    
    if (isOverall) {
      const overallCtx = JSON.stringify({
        radar: analysisResult.radar_scores,
        summaries: analysisResult.section_summaries,
        day1: analysisResult.day1_comparison
      });
      sendWorkshopMessage("Hi, I want a comprehensive review and strategy for my entire resume.", bullet, [], overallCtx)
    } else {
      sendWorkshopMessage("Hi, I need help upgrading this bullet point to match Day 1 standards.", bullet, [])
    }
  }

  const sendWorkshopMessage = async (content: string, bullet = activeWorkshopBullet, history = workshopMessages, overallContext: string | null = null) => {
    if (!content.trim() || !bullet) return
    
    const newHistory = [...history, { role: "user", content }]
    
    // Only add visible messages to state
    if (content !== "Hi, I need help upgrading this bullet point to match Day 1 standards." && content !== "Hi, I want a comprehensive review and strategy for my entire resume.") {
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
          messages: newHistory,
          overall_context: overallContext
        })
      })
      
      if (!res.ok) throw new Error("Workshop failed")
      
      const data = await res.json()
      setWorkshopMessages(prev => [...prev, { role: "model", content: data.response }])
      
      if (data.is_final_bullet && data.final_bullet) {
        setFinalWorkshopBullet(data.final_bullet)
      }
    } catch (err) {
      setWorkshopMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsWorkshopLoading(false)
    }
  }

  const renderFormattedText = (text: string | null) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  const copyToClipboard = (text: string) => {
    const cleanText = text.replace(/\*\*/g, '');
    navigator.clipboard.writeText(cleanText);
    // Could add toast here
  }

  const getSeverityColors = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-800 dark:text-red-400', edge: 'bg-red-500' };
      case 'major': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-800 dark:text-amber-400', edge: 'bg-amber-500' };
      case 'minor': return { bg: 'bg-yellow-500/10', border: 'bg-yellow-500/20', text: 'text-yellow-800 dark:text-yellow-400', edge: 'bg-yellow-400' };
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

  // If in severity mode, sort the keys so critical is first
  const severityOrder = ["critical", "major", "minor", "good"];
  const sortedGroupKeys = Object.keys(groupedBullets || {}).sort((a, b) => {
    if (viewMode === "severity") {
      return severityOrder.indexOf(a) - severityOrder.indexOf(b);
    }
    return 0; // Keep original section order
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
            <ThemeToggle />
          </div>
        </header>

        <div className={`container mx-auto px-4 md:px-8 relative z-10 ${!analysisResult ? 'py-12 max-w-4xl' : 'py-6 max-w-[1600px] h-[calc(100vh-56px)] flex flex-col'}`}>
          <div className="mb-8 shrink-0">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Resume Intelligence</h1>
            <p className="text-muted-foreground text-lg">
              Upload your PDF. Our engine extracts text, analyzes structuring against Day 1 benchmarks, and helps you rewrite.
            </p>
          </div>

          {!analysisResult ? (
            <div className="glass-panel dark:bg-neutral-900/40 rounded-3xl p-8 max-w-2xl mx-auto border-black/5 dark:border-white/10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Initialize Analysis</h2>
                <p className="text-muted-foreground text-sm">Strictly PDF format. Max 5MB.</p>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Target Role Benchmark</label>
                <select 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isUploading}
                >
                  <option value="consulting">Management Consulting (McKinsey, Bain, BCG)</option>
                  <option value="finance">Finance / PE / IB</option>
                  <option value="product">Product Management</option>
                  <option value="fmcg">FMCG / General Management</option>
                  <option value="analytics">Data & Analytics</option>
                </select>
              </div>

              <div className="relative group mb-8">
                <div className={`absolute inset-0 bg-primary/20 rounded-2xl blur-xl transition-opacity duration-500 ${isUploading ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-50'}`} />
                <div className="relative border-2 border-dashed border-black/20 dark:border-white/20 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <UploadCloud className={`h-12 w-12 mb-4 transition-colors ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium mb-1">Drag & drop your file here</p>
                  <p className="text-xs text-muted-foreground mb-4">or click to browse local files</p>
                  
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  
                  {file && (
                    <div className="mt-4 px-4 py-2 bg-white/10 rounded-full flex items-center gap-2 text-sm border border-black/10 dark:border-white/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <span className="font-mono text-xs">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Upload Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Adaptive RAG & Multi-Pass Neural Engine Active...</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-black/10 dark:bg-white/10" />
                </div>
              )}

              <Button 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all" 
                onClick={handleUpload} 
                disabled={!file || isUploading}
              >
                {isUploading ? "Executing Deep Analysis (~2 mins)" : "Analyze Document"}
              </Button>
              
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                <p className="text-sm font-medium text-primary">
                  <ShieldAlert className="inline-block w-4 h-4 mr-2 mb-0.5" />
                  Privacy First: Your resume is processed in real-time and is never permanently stored or shared.
                </p>
              </div>
            </div>
          ) : (
            <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 border-t border-black/10 dark:border-white/10 mt-2 pt-6">
              
              {/* PDF Viewer Panel */}
              <ResizablePanel defaultSize={40} minSize={25} className="pr-4 hidden md:block">
                <div className="w-full h-full glass-card dark:bg-neutral-900/40 rounded-2xl overflow-hidden border-black/10 dark:border-white/10 p-2">
                  {pdfUrl ? (
                    <iframe src={pdfUrl} className="w-full h-full rounded-xl border border-black/10 dark:border-white/10" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">PDF Preview Unavailable</div>
                  )}
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="w-2 cursor-col-resize flex items-center justify-center group hidden md:flex" />

              <ResizablePanel defaultSize={60} className="pl-4 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-5 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{healthScore}%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Health Score</p>
                </div>
                <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-5 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-500 dark:text-green-400" />
                  <p className="text-2xl font-bold">{metricsCount} <span className="text-sm font-normal text-muted-foreground">/ {totalBullets}</span></p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantified</p>
                </div>
                <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-5 text-center">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 text-amber-500 dark:text-amber-400" />
                  <p className="text-2xl font-bold text-amber-400">{structuralIssues}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Structural Issues</p>
                </div>
                <div className="glass-card dark:bg-neutral-900/40 rounded-xl p-5 text-center">
                  <ShieldAlert className="h-6 w-6 mx-auto mb-2 text-red-500 dark:text-red-400" />
                  <p className="text-2xl font-bold text-red-400">{ruleViolations}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Rule Breaks</p>
                </div>
              </div>

              {/* Scoring Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70 mb-6">Radar Analysis</h3>
                  <RadarChart scores={analysisResult.radar_scores} />
                  {analysisResult.radar_scores_reasoning && (
                    <details className="mt-6 w-full p-4 bg-primary/5 rounded-lg border border-primary/10 group cursor-pointer">
                      <summary className="flex items-center gap-2 outline-none font-semibold text-sm text-primary list-none">
                        <Brain className="h-4 w-4" />
                        AI Evaluation Reasoning
                        <span className="ml-auto transform transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <ul className="text-sm text-foreground/80 leading-relaxed mt-4 pt-4 border-t border-primary/10 cursor-text space-y-2 list-disc pl-4">
                        {Array.isArray(analysisResult.radar_scores_reasoning) 
                          ? analysisResult.radar_scores_reasoning.map((reason, i) => (
                              <li key={i}>{reason}</li>
                            ))
                          : <li>{analysisResult.radar_scores_reasoning}</li>}
                      </ul>
                    </details>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-6 border-l-4 border-l-primary flex-1">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Overall Architecture</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm mb-4">{analysisResult.overall_feedback}</p>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Day 1 Benchmark</h3>
                    <p className="text-muted-foreground text-sm italic">{analysisResult.day1_comparison}</p>
                  </div>
                  
                  <div className="glass-card dark:bg-neutral-900/40 rounded-2xl p-6 border-l-4 border-l-amber-500">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-2">Section Strategy</h3>
                    <p className="text-muted-foreground text-sm">{analysisResult.section_ordering_advice}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-2xl font-bold">Deep Bullet Analysis</h2>
                  
                  {/* View Mode Toggle */}
                  <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10">
                    <button
                      onClick={() => setViewMode("section")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${viewMode === "section" ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Columns className="w-3 h-3" /> Group by Section
                    </button>
                    <button
                      onClick={() => setViewMode("severity")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${viewMode === "severity" ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <List className="w-3 h-3" /> Triage by Severity
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs font-mono mb-6">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Major</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Minor</span>
                </div>
                
                <div className="space-y-8">
                  {Object.entries(groupedBullets || {}).map(([section, bullets]: [string, any]) => {
                    const isExpanded = expandedSections[section];
                    const summary = analysisResult.section_summaries?.[section];
                    
                    return (
                      <div key={section} className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5">
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          onClick={() => toggleSection(section)}
                        >
                          <div>
                            <h3 className="font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                              {section} 
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{bullets.length}</span>
                              {summary && (
                                <span className="text-xs ml-2 text-muted-foreground">Score: {summary.score}/100</span>
                              )}
                            </h3>
                            {summary && <p className="text-sm text-muted-foreground mt-1">{summary.summary}</p>}
                          </div>
                          {isExpanded ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
                        </div>
                        
                        {isExpanded && (
                          <div className="p-4 pt-0 space-y-4">
                            {bullets.map((bullet: any, idx: number) => {
                              const sev = getSeverityColors(bullet.severity);
                              const verbColor = getVerbColors(bullet.action_verb_rating);
                              
                              return (
                                <div key={idx} className="glass-card dark:bg-neutral-900/60 rounded-xl overflow-hidden relative group transition-all">
                                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sev.edge}`} />
                                  
                                  <div className="p-5 pl-6">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                      <p className="font-mono text-sm leading-relaxed text-foreground/90 flex-1">"{bullet.original_bullet}"</p>
                                      
                                      <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sev.bg} ${sev.text} ${sev.border} border`}>
                                          {bullet.severity} Priority
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {Math.round(bullet.confidence * 100)}% Confidence
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${verbColor}`}>
                                        Verb: {bullet.action_verb_rating}
                                      </span>
                                      {bullet.action_verb_alternatives?.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          Try: {bullet.action_verb_alternatives.join(", ")}
                                        </span>
                                      )}
                                    </div>

                                    {(bullet.structural_issues?.length > 0 || bullet.best_practice_violations?.length > 0) && (
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {bullet.structural_issues?.map((issue: string, i: number) => (
                                          <span key={`struct-${i}`} className="px-2 py-1 bg-black/10 dark:bg-white/10 text-foreground/70 text-[10px] uppercase tracking-wider rounded font-semibold">
                                            {issue}
                                          </span>
                                        ))}
                                        {bullet.best_practice_violations?.map((violation: string, i: number) => (
                                          <span key={`rule-${i}`} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-800 dark:text-red-400 text-[10px] uppercase tracking-wider rounded font-semibold">
                                            Rule Break: {violation}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className={`p-4 rounded-xl mb-4 border ${sev.bg} ${sev.border} ${sev.text}`}>
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm"><strong>Critique:</strong> {bullet.critique}</p>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="ml-4 shrink-0 bg-background/50 hover:bg-background border-black/10 dark:border-white/10"
                                          onClick={() => startWorkshop(bullet)}
                                        >
                                          <MessageSquare className="h-4 w-4 mr-2" /> Workshop
                                        </Button>
                                      </div>
                                    </div>

                                    {bullet.metrics_hint && (
                                      <div className="p-3 rounded-lg mb-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-500 flex items-start gap-2">
                                        <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                                        <p className="text-sm"><strong>Quantification Hint:</strong> {bullet.metrics_hint}</p>
                                      </div>
                                    )}
                                    
                                    {bullet.suggested_rewrite && (
                                      <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                                            <Lightbulb className="h-4 w-4" /> Day 1 Rewrite Strategy
                                          </div>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 text-xs px-2"
                                            onClick={() => navigator.clipboard.writeText(bullet.suggested_rewrite)}
                                          >
                                            <Copy className="h-3 w-3 mr-1" /> Copy Text
                                          </Button>
                                        </div>
                                        <BulletDiff original={bullet.original_bullet} rewrite={bullet.suggested_rewrite} />
                                      </div>
                                    )}

                                    {bullet.golden_comparison && (
                                      <div className="p-4 rounded-xl mb-4 bg-primary/5 border border-primary/20">
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Day 1 Structural Benchmark
                                        </p>
                                        <p className="text-sm text-primary/80 mb-3 italic">"{bullet.golden_comparison}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4 pb-12">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-12 px-8 border-primary/20 text-primary hover:bg-primary/5 font-semibold" 
                  onClick={() => startWorkshop({original_bullet: "Overall Resume", section_type: "overall"}, true)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Overall Strategy Session
                </Button>
                <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={() => router.push("/dashboard")}>
                  Continue to Mock Interview <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
                <div className="flex justify-center pb-8">
                  <CreatorBadge />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          )}
        </div>
      </div>

      {/* Interactive Workshop Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[400px] bg-background border-l border-black/10 dark:border-white/10 shadow-2xl transition-transform duration-500 z-50 flex flex-col ${activeWorkshopBullet ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-14 flex items-center justify-between px-6 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <h3 className="font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Strategic Workshop
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setActiveWorkshopBullet(null)} className="rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Focus Area</p>
          <p className="text-sm font-mono text-foreground/80">"{activeWorkshopBullet?.original_bullet}"</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
          {workshopMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                  : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground rounded-tl-sm shadow-sm'
              }`}>
                {renderFormattedText(msg.content)}
              </div>
            </div>
          ))}
          
          {isWorkshopLoading && (
            <div className="flex justify-start">
              <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-4 flex gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}

          {finalWorkshopBullet && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mt-4 shadow-sm animate-in fade-in duration-500">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Final Polished Bullet
              </p>
              <p className="text-sm font-medium mb-4 text-foreground leading-relaxed">{renderFormattedText(finalWorkshopBullet)}</p>
              <Button 
                size="sm" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                onClick={() => {
                  copyToClipboard(finalWorkshopBullet)
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-black/10 dark:border-white/10 bg-background shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const fullOverallCtx = analysisResult ? JSON.stringify({
                radar: analysisResult.radar_scores,
                summaries: analysisResult.section_summaries,
                day1: analysisResult.day1_comparison
              }) : null;
              sendWorkshopMessage(workshopInput, activeWorkshopBullet, workshopMessages, activeWorkshopBullet?.section_type === "overall" ? fullOverallCtx : null);
            }} 
            className="relative"
          >
            <input
              type="text"
              value={workshopInput}
              onChange={(e) => setWorkshopInput(e.target.value)}
              placeholder="Type your response..."
              disabled={isWorkshopLoading || !!finalWorkshopBullet}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!workshopInput.trim() || isWorkshopLoading || !!finalWorkshopBullet}
              className="absolute right-1 top-1 bottom-1 h-auto rounded-full w-10 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
