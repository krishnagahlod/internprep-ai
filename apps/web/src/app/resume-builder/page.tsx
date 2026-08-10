"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { UploadCloud, CheckCircle2, ChevronRight, Save, Trash2, Edit3, MessageSquare, Plus, Activity, RefreshCw, Send, Target, Sparkles, Loader2, FileText, Copy, Edit2, Layers } from "lucide-react"

// Types
type Achievement = {
  id: string
  title: string
  section_type: string
  parent_experience: string
  timeline: string
  original_description: string
  competency_tags: string[]
  status: string
  quantified_metrics: any
  user_notes?: string
}

const ROLE_LABELS: Record<string, string> = {
  "consult": "Consulting",
  "consulting": "Consulting",
  "finance": "Finance",
  "product management": "Product Management",
  "analytics": "Data & Analytics",
  "it-software": "Software Engineering"
};
const getRoleLabel = (r: string) => ROLE_LABELS[r.toLowerCase()] || r;

const SECTION_ORDER: Record<string, number> = {
  "Scholastic Achievements": 1,
  "Professional Experience": 2,
  "Projects": 3,
  "Positions of Responsibility": 4,
  "Extracurriculars": 5,
  "Other": 6
};

interface GeneratedBullet {
  id: string;
  achievement_id: string;
  source_achievement_ids?: string[];
  target_role: string;
  bullet_text: string;
  variant_type: string;
  recruiter_notes?: string;
  is_saved?: boolean;
  generation_group_id?: string;
}

// Helper to highlight numbers and percentages in text
const highlightMetrics = (text: string) => {
  // Matches numbers with optional currency symbols, commas, decimals, and suffixes (k, M, B, +, %, x)
  const regex = /((?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+)?(?:%|x|X)?)/g;
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        if (/^(?:[\$€£₹]\s*)?\d+(?:,\d+)*(?:\.\d+)?(?:[kKmMbB]|k\+|M\+|\+)?(?:%|x|X)?$/.test(part)) {
          return <span key={i} className="font-bold text-primary">{part}</span>;
        }
        return part;
      })}
    </>
  );
};

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState("vault")
  const { user } = useAuthStore()
  const router = useRouter()
  
  // Vault State
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [pdfDocumentType, setPdfDocumentType] = useState<"resume" | "other">("resume")
  const [isExtractingPDF, setIsExtractingPDF] = useState(false)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [rawText, setRawText] = useState("")
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [extractionSuccessData, setExtractionSuccessData] = useState<{count: number, new_count: number, merged_count: number, achievements: any[]} | null>(null)
  
  // Lab State
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null)
  const [targetRole, setTargetRole] = useState("consulting")
  const [targetCompany, setTargetCompany] = useState("")
  const [benchmarkText, setBenchmarkText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBullets, setGeneratedBullets] = useState<GeneratedBullet[]>([])
  
  // Section Composer State
  const [labMode, setLabMode] = useState<"single" | "composer">("single")
  const [composerHeading, setComposerHeading] = useState<string | null>(null)
  const [composerSelectedIds, setComposerSelectedIds] = useState<string[]>([])
  const [composerNumPoints, setComposerNumPoints] = useState(3)
  const [composerResults, setComposerResults] = useState<any>(null)
  const [isComposerGenerating, setIsComposerGenerating] = useState(false)
  const [activeVariantSet, setActiveVariantSet] = useState(0)

  // Point Bank State
  const [pointBank, setPointBank] = useState<GeneratedBullet[]>([])
  const [activePointBankRole, setActivePointBankRole] = useState<string>("all")
  const [editingPointBankBullet, setEditingPointBankBullet] = useState<string | null>(null)
  const [editPointBankText, setEditPointBankText] = useState("")
  const [pointBankQuickSaveItem, setPointBankQuickSaveItem] = useState<Achievement | null>(null)
  
  const [strategyTargetCompany, setStrategyTargetCompany] = useState("")
  const [strategyJobDescription, setStrategyJobDescription] = useState("")
  const [strategyData, setStrategyData] = useState<any>(null)
  const [isStrategyLoading, setIsStrategyLoading] = useState(false)
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false)
  // Refs
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Chat State
  const [activeChatAchievement, setActiveChatAchievement] = useState<Achievement | null>(null)
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [pendingMetricsUpdate, setPendingMetricsUpdate] = useState<any>(null)
  const [pendingContextSummary, setPendingContextSummary] = useState("")
  
  // API Base
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000"

  const [mounted, setMounted] = useState(false)
  
  // Fetch initial data
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch initial data
  useEffect(() => {
    if (mounted && user) {
      fetchAchievements()
      fetchPointBank()
    }
  }, [mounted, user])

  // Auth protection
  useEffect(() => {
    if (mounted && !user) {
      router.push("/login")
    }
  }, [mounted, user, router])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages, isChatLoading])

  if (!mounted || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const fetchAchievements = async () => {
    if (!user) return
    try {
      const res = await fetch(`${apiBase}/builder/achievements?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAchievements(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPointBank = async () => {
    if (!user) return
    try {
      const res = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setPointBank(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = async () => {
    if (!file || !user) return
    setIsExtractingPDF(true)
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("user_id", user.id)
    formData.append("document_type", pdfDocumentType)
    
    try {
      const res = await fetch(`${apiBase}/builder/extract/pdf`, {
        method: "POST",
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setExtractionSuccessData({ 
          count: data.achievements?.length || 0, 
          new_count: data.new_count || 0,
          merged_count: data.merged_count || 0,
          achievements: data.achievements || [] 
        })
        await fetchAchievements()
        setFile(null)
      }
    } catch (e) {
      console.error(e)
    }
    setIsExtractingPDF(false)
  }

  const handleTextUpload = async () => {
    if (!rawText.trim() || !user) return
    setIsExtractingText(true)
    
    try {
      const res = await fetch(`${apiBase}/builder/extract/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, text: rawText })
      })
      if (res.ok) {
        const data = await res.json()
        setExtractionSuccessData({ 
          count: data.achievements?.length || 0, 
          new_count: data.new_count || 0,
          merged_count: data.merged_count || 0,
          achievements: data.achievements || [] 
        })
        await fetchAchievements()
        setRawText("")
      }
    } catch (e) {
      console.error(e)
    }
    setIsExtractingText(false)
  }
  
  const generateVariants = async () => {
    if (!user || !selectedAchievement) return
    setIsGenerating(true)
    
    // Context-Awareness: Get bullets already saved for this project/experience
    let existing_bullets: string[] = [];
    const achievementObj = achievements.find(a => a.id === selectedAchievement);
    if (achievementObj) {
      const sibling_achievement_ids = achievements
        .filter(a => a.parent_experience === achievementObj.parent_experience)
        .map(a => a.id);
        
      existing_bullets = pointBank
        .filter(b => sibling_achievement_ids.includes(b.achievement_id))
        .map(b => b.bullet_text);
    }
    
    try {
      const res = await fetch(`${apiBase}/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: selectedAchievement,
          target_role: targetRole,
          target_company: targetCompany,
          benchmark_text: benchmarkText,
          existing_bullets: existing_bullets
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (!data || data.length === 0) {
          alert("AI generation failed or returned no results. Please try again.")
        } else {
          setGeneratedBullets(data)
        }
      } else {
        alert("Failed to connect to AI generation server. Please try again.")
      }
    } catch (e) {
      console.error(e)
    }
    setIsGenerating(false)
  }

  const generateSectionBullets = async () => {
    if (!user || composerSelectedIds.length === 0) return
    setIsComposerGenerating(true)
    try {
      const heading = composerHeading || ""
      const res = await fetch(`${apiBase}/builder/generate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_ids: composerSelectedIds,
          parent_experience: heading,
          target_role: targetRole,
          num_points: composerNumPoints,
          target_company: targetCompany || undefined,
          benchmark_text: benchmarkText || undefined
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (!data || !data.variant_sets) {
          alert("AI generation failed or returned no results. Please try again.")
        } else {
          setComposerResults(data)
          setActiveVariantSet(0)
        }
      } else {
        alert("Failed to connect to AI generation server. Please try again.")
      }
    } catch (e) { 
      console.error(e) 
    }
    setIsComposerGenerating(false)
  }
  
  const saveBullet = async (bullet: GeneratedBullet, generationGroupId?: string) => {
    if (!user) return
    try {
      const bodyPayload: any = {
        user_id: user.id,
        achievement_id: bullet.achievement_id || bullet.source_achievement_ids?.[0] || composerSelectedIds[0] || "",
        target_role: targetRole,
        bullet_text: bullet.bullet_text,
        variant_type: bullet.variant_type,
        recruiter_notes: bullet.recruiter_notes
      }
      if (generationGroupId) {
        bodyPayload.generation_group_id = generationGroupId
      }
      const res = await fetch(`${apiBase}/builder/save-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      })
      if (res.ok) {
        // Mark locally as saved
        setGeneratedBullets(prev => prev.map(b => b.id === bullet.id ? {...b, is_saved: true} : b))
        fetchPointBank()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleEditAchievementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAchievement) return
    try {
      const res = await fetch(`${apiBase}/builder/achievements/${editingAchievement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAchievement)
      })
      if (res.ok) {
        await fetchAchievements()
        setEditingAchievement(null)
      }
    } catch (error) {
      console.error("Failed to edit achievement", error)
    }
  }

  const deleteAchievement = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/achievements/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAchievements(prev => prev.filter(a => a.id !== id))
        if (selectedAchievement === id) setSelectedAchievement(null)
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  const deletePointBankItem = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/point-bank/${id}`, { method: "DELETE" })
      if (res.ok) {
        setPointBank(prev => prev.filter(b => b.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSavePointBankEdit = async (bulletId: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/point-bank/${bulletId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet_text: editPointBankText })
      })
      if (res.ok) {
        setPointBank(pointBank.map(b => b.id === bulletId ? { ...b, bullet_text: editPointBankText } : b))
        setEditingPointBankBullet(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const generateStrategy = async () => {
    if (!user) return
    setIsStrategyLoading(true)
    
    // Determine the role to run strategy for (using the currently selected point bank domain)
    const availableRoles = Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))));
    const displayRole = activePointBankRole === "all" ? (availableRoles[0] || "all") : getRoleLabel(activePointBankRole);

    try {
      const res = await fetch(`${apiBase}/resume-builder/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          target_role: displayRole,
          target_company: strategyTargetCompany || undefined,
          job_description: strategyJobDescription || undefined
        })
      })
      if (res.ok) {
        setStrategyData(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
    setIsStrategyLoading(false)
  }

  const handleQuickSave = async (domain: string) => {
    if (!user || !pointBankQuickSaveItem) return
    setPointBankQuickSaveItem(null) // optimistically close
    try {
      const res = await fetch(`${apiBase}/resume-builder/save-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: pointBankQuickSaveItem.id,
          target_role: domain.toLowerCase(),
          bullet_text: pointBankQuickSaveItem.original_description,
          variant_type: "raw_extraction"
        })
      })
      if (res.ok) {
        const savedBullet = await res.json()
        setPointBank(prev => [savedBullet, ...prev])
      }
    } catch (e) {
      console.error("Failed to quick save:", e)
    }
  }

  // Effect to load point bank
  const sendChatMessage = async (forceStart = false) => {
    if (!activeChatAchievement || (!chatInput.trim() && !forceStart) || !user) return
    
    const newMessages = chatInput.trim() ? [...chatMessages, { role: "user", content: chatInput }] : chatMessages
    setChatMessages(newMessages)
    setChatInput("")
    setIsChatLoading(true)
    
    try {
      const res = await fetch(`${apiBase}/builder/metric-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievement_id: activeChatAchievement.id,
          messages: newMessages
        })
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages([...newMessages, { role: "assistant", content: data.response }])
        
        if (data.extracted_metrics_update && Object.keys(data.extracted_metrics_update).length > 0) {
          setPendingMetricsUpdate(data.extracted_metrics_update)
        }
        if (data.new_context_summary) {
          setPendingContextSummary(data.new_context_summary)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setIsChatLoading(false)
  }

  const applyMetricsToVault = async () => {
    if (!activeChatAchievement) return
    setIsChatLoading(true)
    
    try {
      const existingMetrics = activeChatAchievement.quantified_metrics || {}
      const updatedMetrics = { ...existingMetrics, ...(pendingMetricsUpdate || {}) }
      
      // Compute new user notes
      const existingNotes = activeChatAchievement.user_notes || ""
      const newNotes = pendingContextSummary ? (existingNotes ? `${existingNotes}\n${pendingContextSummary}` : pendingContextSummary) : existingNotes
      
      const updateData: any = { quantified_metrics: updatedMetrics }
      if (newNotes) updateData.user_notes = newNotes

      const res = await fetch(`${apiBase}/builder/achievements/${activeChatAchievement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })
      if (res.ok) {
        await fetchAchievements()
        setActiveChatAchievement(null)
        setPendingMetricsUpdate(null)
        setPendingContextSummary("")
      }
    } catch (e) {
      console.error(e)
    }
    setIsChatLoading(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Placement Focus
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Resume Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Specifically focusing on placements. Store your raw achievements once, and let our AI generate perfectly benchmarked bullet variants tailored for top-tier roles.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full space-y-8">
        <TabsList className="flex flex-col sm:flex-row w-full h-auto bg-muted/30 p-1.5 rounded-xl shadow-sm border border-border/50">
          <TabsTrigger value="vault" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <UploadCloud className="w-4 h-4 mr-2" /> Achievement Vault
          </TabsTrigger>
          <TabsTrigger value="lab" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <Activity className="w-4 h-4 mr-2" /> Bullet Laboratory
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <Save className="w-4 h-4 mr-2" /> Point Bank & Strategy
          </TabsTrigger>
        </TabsList>

        {/* VAULT TAB */}
        <TabsContent value="vault" className="space-y-8 animate-in fade-in-50 duration-500">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  Extract from PDF
                </CardTitle>
                <CardDescription className="text-sm mt-2">Upload your old resume. We'll automatically parse and extract your achievements into the vault.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex flex-col gap-5">
                  <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button 
                      className={`flex-1 text-sm py-2 px-3 rounded-md font-medium transition-all ${pdfDocumentType === 'resume' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setPdfDocumentType('resume')}
                    >
                      Old Resume
                    </button>
                    <button 
                      className={`flex-1 text-sm py-2 px-3 rounded-md font-medium transition-all ${pdfDocumentType === 'other' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setPdfDocumentType('other')}
                    >
                      Other Document
                    </button>
                  </div>
                  {pdfDocumentType === 'other' && (
                    <div className="text-[12.5px] text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-lg flex items-start gap-2.5">
                      <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="leading-snug">Supported: College transcripts, project reports, internship presentations, completion certificates, GitHub READMEs, etc.</p>
                    </div>
                  )}

                  <div className="relative group/input">
                    <Input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label="Upload PDF Document"
                    />
                    <div className={`flex items-center justify-between border-2 border-dashed rounded-xl p-4 transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border group-hover/input:border-primary/50 group-hover/input:bg-muted/30'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className={`h-6 w-6 flex-shrink-0 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium truncate text-foreground/80">
                          {file ? file.name : "Click or drag PDF here to upload"}
                        </span>
                      </div>
                      {file && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                    </div>
                  </div>
                  <Button onClick={handleFileUpload} disabled={!file || isExtractingPDF} className="w-full h-12 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5">
                    {isExtractingPDF ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2"/>}
                    {isExtractingPDF ? "Extracting achievements..." : "Auto-Extract Achievements"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  Extract from Raw Text
                </CardTitle>
                <CardDescription className="text-sm mt-2">Paste rough project descriptions or unformatted notes to extract structured achievements.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-5">
                <Textarea 
                  placeholder="E.g., I worked on a machine learning model to predict churn. It improved retention by 15%..." 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="h-[74px] resize-none rounded-xl border-border focus-visible:ring-primary/30 focus-visible:border-primary/50 text-[15px] p-3 shadow-sm"
                  aria-label="Raw text for extraction"
                />
                <Button onClick={handleTextUpload} disabled={!rawText.trim() || isExtractingText} className="w-full h-12 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5" variant="secondary">
                  {isExtractingText ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Plus className="h-5 w-5 mr-2"/>}
                  {isExtractingText ? "Extracting text..." : "Add to Vault manually"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Your Vault <Badge variant="secondary" className="text-sm px-2 rounded-full">{achievements.length}</Badge>
              </h2>
            </div>
            
            {achievements.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed rounded-xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <Activity className="h-8 w-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Your vault is empty</h3>
                <p>Upload a resume or paste notes above to extract your first achievement.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {(() => {
                  const sectionOrder = ["Scholastic Achievements", "Professional Experience", "Positions of Responsibility", "Projects", "Extracurriculars"];
                  const groupedAchievements = achievements.reduce((acc, ach) => {
                    const section = ach.section_type || "Experience";
                    if (!acc[section]) acc[section] = {};
                    
                    const parent = ach.parent_experience || "Other";
                    if (!acc[section][parent]) acc[section][parent] = [];
                    
                    acc[section][parent].push(ach);
                    return acc;
                  }, {} as Record<string, Record<string, Achievement[]>>);

                  const sortedSections = Object.keys(groupedAchievements).sort((a, b) => {
                    const indexA = sectionOrder.indexOf(a);
                    const indexB = sectionOrder.indexOf(b);
                    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                  });

                  return sortedSections.map(section => (
                    <div key={section} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                      <h3 className="text-xl font-bold text-foreground/90 border-b border-border/50 pb-2 flex items-center gap-2">
                        <div className="w-2 h-6 bg-primary rounded-full"></div>
                        {section}
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(groupedAchievements[section]).map(([parent, achs]) => (
                          <details key={parent} className="group border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors select-none">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shadow-sm">
                                  {parent.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg leading-tight">{parent}</h4>
                                  <p className="text-sm text-muted-foreground font-medium">{achs.length} achievement{achs.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform duration-300" />
                              </div>
                            </summary>
                            <div className="p-4 pt-0 border-t border-border/30 bg-muted/5">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
                                {achs.map(ach => (
                                  <Card key={ach.id} className="flex flex-col overflow-hidden border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group/card bg-background">
                          <CardHeader className="pb-3 bg-muted/20 border-b border-border/30 relative">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); setPointBankQuickSaveItem(ach); }} title="Quick Save to Point Bank">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); setEditingAchievement(ach); }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteAchievement(ach.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="pr-20">
                              <CardTitle className="text-lg font-semibold leading-tight mb-1 group-hover:text-primary transition-colors">{ach.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 font-medium">
                                <span className="text-muted-foreground">{ach.timeline || "N/A"}</span>
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 pt-4">
                            <p className="text-sm text-foreground/80 leading-relaxed mb-5 whitespace-pre-wrap">
                              {ach.original_description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {ach.competency_tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold bg-primary/5 text-primary border border-primary/10">
                                  {tag.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0 flex gap-3 justify-between p-4 bg-muted/10 border-t border-border/30 mt-auto">
                            <Button variant="outline" size="sm" className="flex-1 h-9 bg-background shadow-sm hover:bg-primary/5 hover:text-primary border-primary/20" onClick={() => {
                              setActiveChatAchievement(ach)
                              setChatMessages([])
                              setPendingMetricsUpdate(null)
                              setPendingContextSummary("")
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Metrics Chat
                            </Button>
                            <Button size="sm" className="flex-1 h-9 shadow-sm" onClick={() => {
                              setSelectedAchievement(ach.id);
                              setActiveTab("lab");
                            }}>
                              Go to Lab <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))
        })()}
      </div>
    )}
  </div>
          
          {/* Chat Modal */}
          {activeChatAchievement && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-background w-full max-w-3xl rounded-xl shadow-xl flex flex-col h-[85vh] max-h-[800px]">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Metric Reconstruction</h3>
                    <p className="text-xs text-muted-foreground truncate">{activeChatAchievement.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveChatAchievement(null)}>Close</Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-muted/10">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground p-10 bg-background rounded-xl border shadow-sm">
                      <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Metrics Discovery</h4>
                      <p className="text-sm mb-6 max-w-sm mx-auto">Start an interview with our AI consultant to uncover hidden metrics and impact in this achievement.</p>
                      <Button onClick={() => {
                        sendChatMessage(true) // Send empty to trigger greeting
                      }} size="lg" className="rounded-full shadow-md">
                        <Sparkles className="h-4 w-4 mr-2" /> Start Interview
                      </Button>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 text-[15px] shadow-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-background border rounded-bl-sm'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background border rounded-2xl rounded-bl-sm p-4 text-[15px] shadow-sm flex gap-3 items-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> AI is thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatScrollRef} />
                </div>
                
                <div className="p-4 border-t bg-background">
                  {(pendingMetricsUpdate || pendingContextSummary) ? (
                    <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                      <div>
                        <p className="text-sm font-semibold text-primary flex items-center gap-1.5"><Sparkles className="h-4 w-4"/> New details discovered!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pendingContextSummary ? "Context notes ready. " : ""} 
                          {pendingMetricsUpdate && Object.keys(pendingMetricsUpdate).length > 0 ? `Found: ${Object.keys(pendingMetricsUpdate).join(", ")}.` : ""}
                        </p>
                      </div>
                      <Button onClick={applyMetricsToVault} disabled={isChatLoading} size="sm" className="shadow-sm whitespace-nowrap ml-4">
                        {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Apply to Vault
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex gap-3 relative">
                    <Textarea 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      placeholder="Type your answer here..." 
                      className="resize-none pr-14 min-h-[60px] rounded-xl focus-visible:ring-primary/30 text-[15px]"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendChatMessage()
                        }
                      }}
                    />
                    <Button 
                      onClick={() => sendChatMessage()} 
                      disabled={isChatLoading || !chatInput.trim()}
                      className="absolute right-2 top-2 h-11 w-11 rounded-lg"
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line.</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* LABORATORY TAB */}
        <TabsContent value="lab" className="space-y-8 animate-in fade-in-50 duration-500">
          <Card className="border-border/60 shadow-md bg-gradient-to-b from-background to-muted/10">
            <CardHeader className="border-b bg-muted/5 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" /> Bullet Laboratory
              </CardTitle>
              <CardDescription className="text-base">Mix and match your raw achievements into perfectly crafted, role-specific bullet points tailored to golden benchmarks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="flex justify-center mb-2">
                <div className="bg-muted/50 p-1 rounded-xl flex items-center gap-1 shadow-inner border border-border/50">
                  <Button variant={labMode === "single" ? "default" : "ghost"} size="sm" onClick={() => setLabMode("single")} className="px-6 rounded-lg font-semibold">Single Achievement</Button>
                  <Button variant={labMode === "composer" ? "default" : "ghost"} size="sm" onClick={() => setLabMode("composer")} className="px-6 rounded-lg font-semibold">Section Composer</Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3 col-span-1 md:col-span-2">
                  {labMode === "single" ? (
                    <>
                      <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="achievement-select">
                        Select Achievement Source
                      </label>
                      <div className="relative">
                        <select 
                          id="achievement-select"
                          className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                          value={selectedAchievement || ""}
                          onChange={(e) => setSelectedAchievement(e.target.value)}
                          aria-label="Select an achievement"
                        >
                          <option value="" disabled>-- Select an achievement from your vault --</option>
                          {(() => {
                            const sectionOrder = ["Scholastic Achievements", "Professional Experience", "Positions of Responsibility", "Projects", "Extracurriculars"];
                            const grouped = achievements.reduce((acc, ach) => {
                              const section = ach.section_type || "Experience";
                              if (!acc[section]) acc[section] = {};
                              const parent = ach.parent_experience || "Other";
                              if (!acc[section][parent]) acc[section][parent] = [];
                              acc[section][parent].push(ach);
                              return acc;
                            }, {} as Record<string, Record<string, Achievement[]>>);
                            
                            const sorted = Object.keys(grouped).sort((a, b) => {
                              const idxA = sectionOrder.indexOf(a);
                              const idxB = sectionOrder.indexOf(b);
                              if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                              if (idxA === -1) return 1;
                              if (idxB === -1) return -1;
                              return idxA - idxB;
                            });
                            
                            return sorted.map(section => (
                              Object.entries(grouped[section]).map(([parent, achs]) => (
                                <optgroup key={`${section}-${parent}`} label={`${section} • ${parent}`}>
                                  {achs.map(ach => (
                                    <option key={ach.id} value={ach.id}>{ach.title}</option>
                                  ))}
                                </optgroup>
                              ))
                            ));
                          })()}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                          <ChevronRight className="h-5 w-5 rotate-90" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="heading-select">
                          Select Section Heading
                        </label>
                        <div className="relative">
                          <select 
                            id="heading-select"
                            className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                            value={composerHeading || ""}
                            onChange={(e) => {
                              const heading = e.target.value;
                              setComposerHeading(heading);
                              const achs = achievements.filter(a => a.parent_experience === heading).map(a => a.id);
                              setComposerSelectedIds(achs);
                            }}
                          >
                            <option value="" disabled>-- Select a heading from your vault --</option>
                            {Array.from(new Set(achievements.filter(a => a.parent_experience).map(a => a.parent_experience))).map(heading => (
                              <option key={heading} value={heading}>{heading}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                            <ChevronRight className="h-5 w-5 rotate-90" />
                          </div>
                        </div>
                      </div>
                      
                      {composerHeading && (
                        <div className="space-y-3 p-4 bg-muted/5 border border-border/50 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-foreground">Select Achievements to Include</label>
                            <Button 
                              variant="ghost" size="sm" className="h-7 text-xs"
                              onClick={() => {
                                const allIds = achievements.filter(a => a.parent_experience === composerHeading).map(a => a.id);
                                if (composerSelectedIds.length === allIds.length) {
                                  setComposerSelectedIds([]);
                                } else {
                                  setComposerSelectedIds(allIds);
                                }
                              }}
                            >
                              {composerSelectedIds.length === achievements.filter(a => a.parent_experience === composerHeading).length ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {achievements.filter(a => a.parent_experience === composerHeading).map(ach => (
                              <label key={ach.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20 cursor-pointer transition-colors bg-background shadow-sm">
                                <input 
                                  type="checkbox" 
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={composerSelectedIds.includes(ach.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setComposerSelectedIds([...composerSelectedIds, ach.id]);
                                    } else {
                                      setComposerSelectedIds(composerSelectedIds.filter(id => id !== ach.id));
                                    }
                                  }}
                                />
                                <div>
                                  <div className="font-semibold text-[13px] leading-tight">{ach.title}</div>
                                  <div className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{ach.original_description}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="role-select">
                    Select Target Industry Role
                  </label>
                  <div className="relative">
                    <select 
                      id="role-select"
                      className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      aria-label="Select target role"
                    >
                      <option value="consult">Management Consulting</option>
                      <option value="finance">Finance / Investment Banking</option>
                      <option value="product management">Product Management</option>
                      <option value="analytics">Data & Analytics</option>
                      <option value="it-software">Software Engineering / IT</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                      <ChevronRight className="h-5 w-5 rotate-90" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="target-company">
                    Target Company (Optional)
                  </label>
                  <input
                    id="target-company"
                    placeholder="e.g. McKinsey, Google, Goldman Sachs"
                    className="flex h-14 w-full rounded-xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/60"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                  />
                </div>
                
                <div className="space-y-3 col-span-1 md:col-span-2">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="benchmark-text">
                        Benchmark Bullet (Optional)
                      </label>
                      <Textarea
                        id="benchmark-text"
                        placeholder="Paste a point from your LaTeX template. AI will strictly match its character length."
                        className="min-h-[80px] w-full rounded-xl border border-input/60 bg-muted/5 px-4 py-3 text-[15px] shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none placeholder:text-muted-foreground/60"
                        value={benchmarkText}
                        onChange={(e) => setBenchmarkText(e.target.value)}
                      />
                    </div>
                    {labMode === "composer" && (
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="num-points">
                          Number of Bullets to Generate
                        </label>
                        <div className="flex items-center h-[80px] gap-4 bg-muted/5 px-4 rounded-xl border border-input/60 shadow-sm">
                          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setComposerNumPoints(Math.max(1, composerNumPoints - 1))}>-</Button>
                          <div className="text-2xl font-bold w-12 text-center text-primary">{composerNumPoints}</div>
                          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setComposerNumPoints(Math.min(8, composerNumPoints + 1))}>+</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                {labMode === "single" ? (
                  <Button 
                    className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all" 
                    onClick={generateVariants} 
                    disabled={!selectedAchievement || isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-3" /> Synthesizing variants using AI...</>
                    ) : (
                      <><Sparkles className="h-5 w-5 mr-3" /> Generate Benchmarked Variants</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all" 
                    onClick={generateSectionBullets} 
                    disabled={composerSelectedIds.length === 0 || isComposerGenerating}
                  >
                    {isComposerGenerating ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-3" /> Composing section using AI...</>
                    ) : (
                      <><Sparkles className="h-5 w-5 mr-3" /> Compose Resume Section</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {labMode === "single" && generatedBullets.length > 0 && (
            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="text-xl font-bold px-2">Generated Variants</h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <div className="flex flex-col gap-5">
                {generatedBullets.map((bullet, idx) => (
                  <Card key={idx} className="border border-border shadow-sm hover:shadow-md transition-all bg-card overflow-hidden">
                    <div className="p-5 md:p-7 flex flex-col">
                      
                      {/* Top Row: Tag & Copy Button */}
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold tracking-widest text-[10px] px-3 py-1.5 uppercase border-0">
                          {bullet.variant_type.replace('_', ' ')}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium h-8 px-3"
                          onClick={() => navigator.clipboard.writeText(bullet.bullet_text)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>

                      {/* Middle: Bullet Text */}
                      <p className="text-[16px] md:text-[17px] font-medium leading-relaxed text-foreground text-left w-full">
                        {highlightMetrics(bullet.bullet_text)}
                      </p>
                      
                      {/* Character Limit Checker */}
                      {benchmarkText && (
                        <div className="flex items-center gap-3 mt-4 w-full md:w-2/3">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${bullet.bullet_text.length > benchmarkText.length + 5 ? 'bg-red-500' : 'bg-primary'}`} 
                              style={{ width: `${Math.min((bullet.bullet_text.length / benchmarkText.length) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-[12px] font-bold ${bullet.bullet_text.length > benchmarkText.length + 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {bullet.bullet_text.length} / {benchmarkText.length} chars
                          </span>
                        </div>
                      )}

                      {/* Bottom Row: AI Coach Suggestions & Save Button */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-6 gap-4 border-t border-border/50 pt-5">
                        <div className="flex-1 w-full max-w-4xl">
                          {bullet.recruiter_notes ? (
                            <div className="rounded-xl bg-muted/30 border border-border/50 p-3.5">
                              <details className="group">
                                <summary className="flex items-center cursor-pointer list-none text-[13px] font-bold text-foreground/80 hover:text-primary transition-colors">
                                  <Sparkles className="h-4 w-4 mr-2 text-primary" /> 
                                  AI Coach Suggestions
                                  <ChevronRight className="h-4 w-4 ml-auto transition-transform group-open:rotate-90 text-muted-foreground" />
                                </summary>
                                <p className="text-[13.5px] text-muted-foreground mt-3 leading-relaxed pl-3 border-l-2 border-primary/30">
                                  {bullet.recruiter_notes}
                                </p>
                              </details>
                            </div>
                          ) : (
                            <div></div>
                          )}
                        </div>

                        <Button 
                          size="default" 
                          variant={bullet.is_saved ? "secondary" : "default"}
                          className={`font-medium min-w-[120px] shadow-sm transition-all ${bullet.is_saved ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' : ''}`}
                          onClick={() => saveBullet(bullet)}
                          disabled={bullet.is_saved}
                        >
                          {bullet.is_saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          {bullet.is_saved ? "Saved" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {labMode === "composer" && composerResults && composerResults.variant_sets && (
            <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="text-xl font-bold px-2">Generated Section Variants</h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <div className="flex justify-center gap-4">
                {composerResults.variant_sets.map((vSet: any, idx: number) => (
                  <Button 
                    key={idx} 
                    variant={activeVariantSet === idx ? "default" : "outline"} 
                    className="flex flex-col h-auto py-3 px-6"
                    onClick={() => setActiveVariantSet(idx)}
                  >
                    <span className="font-bold">{vSet.set_label}</span>
                    <span className="text-xs opacity-80 font-normal max-w-xs whitespace-normal">{vSet.set_description}</span>
                  </Button>
                ))}
              </div>

              {composerResults.variant_sets[activeVariantSet] && (
                <div className="space-y-6">
                  {/* The bullets list */}
                  <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
                    <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                      <h4 className="font-bold text-foreground">Drafted Points</h4>
                      <Button 
                        size="sm"
                        onClick={async () => {
                          const groupId = crypto.randomUUID();
                          const bullets = composerResults.variant_sets[activeVariantSet].bullets;
                          for (const bullet of bullets) {
                             await saveBullet(bullet, groupId);
                          }
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" /> Save Set to Point Bank
                      </Button>
                    </div>
                    <div className="divide-y divide-border/50">
                      {composerResults.variant_sets[activeVariantSet].bullets.map((bullet: any, idx: number) => (
                        <div key={idx} className="p-5 flex flex-col gap-3 hover:bg-muted/10 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 text-[16px] md:text-[17px] font-medium leading-relaxed text-foreground">
                              <span className="text-muted-foreground font-bold mr-2">•</span>
                              {highlightMetrics(bullet.bullet_text)}
                            </div>
                            <Button 
                              variant="ghost" size="sm"
                              className="text-muted-foreground hover:text-foreground shrink-0"
                              onClick={async () => {
                                const groupId = crypto.randomUUID();
                                await saveBullet(bullet, groupId);
                              }}
                            >
                              <Save className="h-4 w-4 mr-2" /> Save Single
                            </Button>
                          </div>
                          <div className="pl-6 text-[13px] text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="italic">{bullet.merge_explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Excluded achievements */}
                  {composerResults.variant_sets[activeVariantSet].excluded_achievements && composerResults.variant_sets[activeVariantSet].excluded_achievements.length > 0 && (
                    <div className="bg-muted/20 border border-border/50 rounded-xl p-5">
                      <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> Achievements Excluded from this Draft
                      </h4>
                      <div className="space-y-3">
                        {composerResults.variant_sets[activeVariantSet].excluded_achievements.map((excl: any, idx: number) => (
                          <div key={idx} className="text-[13px]">
                            <span className="font-semibold">{excl.title}: </span>
                            <span className="text-muted-foreground">{excl.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* POINT BANK TAB */}
        <TabsContent value="bank" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="border-b bg-muted/5 pb-5">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Save className="h-6 w-6 text-primary" /> Point Bank
                  </CardTitle>
                  <CardDescription className="text-base">Your curated collection of saved, role-specific bullet points ready to be pasted into your resume template.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {pointBank.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed rounded-xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center">
                      <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                        <Save className="h-8 w-8 text-primary/40" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Your bank is empty</h3>
                      <p>Go to the Laboratory to generate and save your best bullets here.</p>
                      <Button className="mt-6" variant="outline" onClick={() => setActiveTab("lab")}>Go to Laboratory</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-3 mb-8 border-b border-border/50 pb-5 items-center justify-between">
                        <div className="flex flex-wrap gap-3">
                          {Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role)))).map(role => {
                            const isActive = activePointBankRole === role || (activePointBankRole === "all" && Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))))[0] === role) || getRoleLabel(activePointBankRole) === role;
                            return (
                              <button
                                key={role} 
                                onClick={() => setActivePointBankRole(role)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide capitalize transition-all ${
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-md scale-105" 
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                        <Button 
                          onClick={() => {
                            setIsStrategyModalOpen(true);
                            setStrategyData(null);
                          }}
                          className="font-semibold shadow-sm"
                        >
                          <Target className="h-4 w-4 mr-2" /> Generate Strategy Report
                        </Button>
                      </div>

                      {(() => {
                        const availableRoles = Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))));
                        const displayRole = activePointBankRole === "all" ? (availableRoles[0] || "all") : getRoleLabel(activePointBankRole);
                        const roleBullets = pointBank.filter(b => getRoleLabel(b.target_role) === displayRole);
                        
                        // Group by section type then parent experience
                        const grouped: Record<string, Record<string, typeof roleBullets>> = {};
                        roleBullets.forEach(bullet => {
                          const ach = achievements.find(a => a.id === bullet.achievement_id);
                          const section = ach?.section_type || "Other";
                          const parent = ach?.parent_experience || "General";
                          if (!grouped[section]) grouped[section] = {};
                          if (!grouped[section][parent]) grouped[section][parent] = [];
                          grouped[section][parent].push(bullet);
                        });

                        return (
                          <div className="space-y-10">
                            {Object.entries(grouped)
                              .sort(([secA], [secB]) => (SECTION_ORDER[secA] || 99) - (SECTION_ORDER[secB] || 99))
                              .map(([section, parents]) => (
                              <div key={section} className="space-y-6">
                                <h3 className="text-xl font-extrabold text-foreground border-b-2 border-primary/20 pb-2 inline-block pr-8 uppercase tracking-wider">{section}</h3>
                                <div className="space-y-8 pl-1 md:pl-2">
                                  {Object.entries(parents).map(([parent, bullets]) => (
                                    <div key={parent} className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-lg text-foreground/90 flex items-center gap-2">
                                          <Target className="h-5 w-5 text-primary" /> {parent}
                                        </h4>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-xs h-8 text-primary hover:bg-primary/10"
                                          onClick={() => navigator.clipboard.writeText(bullets.map(b => `• ${b.bullet_text}`).join('\n'))}
                                        >
                                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Section
                                        </Button>
                                      </div>
                                      <ul className="space-y-3">
                                        {bullets.map(bullet => (
                                          <li key={bullet.id} className="group relative rounded-xl border border-border/40 bg-background hover:bg-muted/10 hover:border-border/80 hover:shadow-sm transition-all overflow-hidden">
                                            {editingPointBankBullet === bullet.id ? (
                                              <div className="p-4 flex flex-col gap-3">
                                                <Textarea
                                                  value={editPointBankText}
                                                  onChange={(e) => setEditPointBankText(e.target.value)}
                                                  className="min-h-[100px] w-full text-[15px] resize-none border-primary/40 focus:ring-primary/20"
                                                  autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <Button variant="ghost" size="sm" onClick={() => setEditingPointBankBullet(null)}>Cancel</Button>
                                                  <Button size="sm" onClick={() => handleSavePointBankEdit(bullet.id)}>Save Edit</Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="p-4 pr-16 flex gap-4 items-start">
                                                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0"></div>
                                                <div className="flex flex-col gap-1 w-full">
                                                  <div className="text-[15px] leading-relaxed text-foreground/90">{bullet.bullet_text}</div>
                                                  {bullet.generation_group_id && (
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/30 px-2 py-0.5 rounded-sm w-fit mt-1">
                                                      <Layers className="h-3 w-3" /> Group Generated
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {/* Action Buttons Overlay */}
                                                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-background via-background to-transparent pl-8 pr-2">
                                                  <Button variant="ghost" size="icon" onClick={() => {setEditingPointBankBullet(bullet.id); setEditPointBankText(bullet.bullet_text);}} className="h-8 w-8 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-full shadow-sm">
                                                    <Edit3 className="h-4 w-4" />
                                                  </Button>
                                                  <Button variant="ghost" size="icon" onClick={() => deletePointBankItem(bullet.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-muted-foreground rounded-full shadow-sm">
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
        </TabsContent>
        
        {/* Strategy Engine Modal */}
        <Dialog open={isStrategyModalOpen} onOpenChange={setIsStrategyModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-primary">
                <Target className="h-6 w-6" /> Strategy Engine
              </DialogTitle>
              <DialogDescription>
                Analyze your vault and point bank against top-tier placement standards for {
                  (() => {
                    const availableRoles = Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))));
                    return activePointBankRole === "all" ? (availableRoles[0] || "all") : getRoleLabel(activePointBankRole);
                  })()
                }.
              </DialogDescription>
            </DialogHeader>
            
            {!strategyData ? (
              <div className="space-y-5 py-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground" htmlFor="strategy-company">Target Company (Optional)</label>
                  <Input 
                    id="strategy-company"
                    placeholder="e.g. McKinsey, Google, Goldman Sachs"
                    value={strategyTargetCompany}
                    onChange={(e) => setStrategyTargetCompany(e.target.value)}
                    className="h-12 border-input/60 bg-muted/5 shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground" htmlFor="strategy-jd">Job Description snippet (Optional)</label>
                  <Textarea 
                    id="strategy-jd"
                    placeholder="Paste key responsibilities or requirements here..."
                    value={strategyJobDescription}
                    onChange={(e) => setStrategyJobDescription(e.target.value)}
                    className="min-h-[100px] border-input/60 bg-muted/5 shadow-sm resize-none"
                  />
                </div>
                
                <Button className="w-full h-12 shadow-sm font-medium mt-4" onClick={generateStrategy} disabled={isStrategyLoading}>
                  {isStrategyLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2"/>}
                  {isStrategyLoading ? "Analyzing..." : "Generate Strategy Report"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border shadow-sm">
                  <span className="text-sm font-medium text-muted-foreground mb-2">Overall Readiness</span>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${strategyData.overall_readiness_score > 70 ? "text-green-600" : strategyData.overall_readiness_score > 40 ? "text-amber-500" : "text-destructive"}`}>
                      {strategyData.overall_readiness_score}
                    </span>
                    <span className="text-muted-foreground font-medium mb-1">/100</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                    <CheckCircle2 className="h-4 w-4" /> Key Strengths
                  </h4>
                  <ul className="text-sm space-y-2 pl-2">
                    {strategyData.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-green-500 font-bold">•</span><span className="text-foreground/80 leading-snug">{s}</span></li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
                    <AlertTitle className="m-0 text-sm h-4 w-4" /> Critical Gaps
                  </h4>
                  <ul className="text-sm space-y-2 pl-2">
                    {strategyData.critical_gaps?.map((g: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-destructive font-bold">•</span><span className="text-foreground/80 leading-snug">{g}</span></li>
                    ))}
                  </ul>
                </div>

                {strategyData.action_plan && strategyData.action_plan.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary bg-primary/10 px-3 py-1.5 rounded-md">
                      <Target className="h-4 w-4" /> Recommended Action Plan
                    </h4>
                    <ul className="text-sm space-y-2 pl-2">
                      {strategyData.action_plan.map((action: string, i: number) => (
                        <li key={i} className="flex gap-2"><span className="text-primary font-bold">•</span><span className="text-foreground/80 leading-snug">{action}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {strategyData.vault_recommendations && strategyData.vault_recommendations.length > 0 && (
                  <div className="space-y-3 mt-6 border-t pt-5">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <Sparkles className="h-4 w-4 text-amber-500" /> Vault Extraction Recommendations
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">We found these existing achievements in your vault that perfectly match your critical gaps. Generate bullets for them in the Laboratory!</p>
                    <div className="space-y-3">
                      {strategyData.vault_recommendations.map((rec: any, i: number) => {
                        const ach = achievements.find(a => a.id === rec.achievement_id);
                        if (!ach) return null;
                        return (
                          <div key={i} className="bg-muted/30 border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">{ach.title}</span>
                              <Badge variant="outline" className="text-[10px]">{ach.parent_experience}</Badge>
                            </div>
                            <p className="text-[13px] text-primary/80 font-medium mt-2"><span className="text-muted-foreground font-normal">Why:</span> {rec.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Button 
                  className="w-full mt-4" 
                  variant="outline" 
                  onClick={() => setStrategyData(null)}
                >
                  Generate New Strategy
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </Tabs>

      {/* Edit Achievement Dialog */}
      <Dialog open={!!editingAchievement} onOpenChange={(open) => !open && setEditingAchievement(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Achievement</DialogTitle>
            <DialogDescription>Modify your extracted achievement details below.</DialogDescription>
          </DialogHeader>
          {editingAchievement && (
            <form onSubmit={handleEditAchievementSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Section Type</label>
                <Input value={editingAchievement.section_type || ""} onChange={(e) => setEditingAchievement({...editingAchievement, section_type: e.target.value})} placeholder="Professional Experience" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Heading / Company (Parent Experience)</label>
                <Input value={editingAchievement.parent_experience || ""} onChange={(e) => setEditingAchievement({...editingAchievement, parent_experience: e.target.value})} placeholder="Accenture" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Title</label>
                  <Input value={editingAchievement.title || ""} onChange={(e) => setEditingAchievement({...editingAchievement, title: e.target.value})} placeholder="Data Pipeline" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Timeline</label>
                  <Input value={editingAchievement.timeline || ""} onChange={(e) => setEditingAchievement({...editingAchievement, timeline: e.target.value})} placeholder="May 2024 - Jul 2024" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Description</label>
                <Textarea value={editingAchievement.original_description || ""} onChange={(e) => setEditingAchievement({...editingAchievement, original_description: e.target.value})} className="min-h-[120px]" required />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingAchievement(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Extraction Success Dialog */}
      <Dialog open={!!extractionSuccessData} onOpenChange={(open) => !open && setExtractionSuccessData(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl">
          <div className={`p-6 pb-4 border-b ${extractionSuccessData?.count === 0 ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                {extractionSuccessData?.count === 0 ? (
                  <Activity className="h-6 w-6 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {extractionSuccessData?.count === 0 ? "No New Achievements Extracted" : "Extraction Complete!"}
              </DialogTitle>
              <DialogDescription className="text-[15px] pt-1">
                {extractionSuccessData?.count === 0 
                  ? "We couldn't confidently extract any distinct, non-overlapping professional achievements from the document you provided. You may need to add them manually or try a different document."
                  : `We successfully extracted ${extractionSuccessData?.new_count} new achievements and updated ${extractionSuccessData?.merged_count} existing achievements with additional context.`}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
            {extractionSuccessData?.count === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Nothing found to extract.</p>
                <p className="text-sm text-muted-foreground/80 mt-1 max-w-sm">Make sure the text contains clear action-oriented bullets with professional context.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {extractionSuccessData?.achievements.map((ach, i) => (
                  <div key={i} className="bg-background border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/60 transition-colors"></div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="font-bold text-[16px] text-foreground leading-snug">{ach.title || "Achievement"}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={ach._is_merged ? "default" : "secondary"} className={`text-[10px] uppercase tracking-wider font-semibold ${ach._is_merged ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : 'bg-primary/10 text-primary'}`}>
                          {ach._is_merged ? 'Updated' : 'New'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{ach.section_type}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50 ml-1 rounded-full bg-green-50/50" onClick={() => setPointBankQuickSaveItem(ach)} title="Quick Save to Point Bank">
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Target className="h-3.5 w-3.5"/> {ach.parent_experience}</p>
                    <p className="text-[14px] text-foreground/80 leading-relaxed line-clamp-3 bg-muted/30 p-3 rounded-lg">{ach.original_description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-background flex justify-end">
            <Button onClick={() => setExtractionSuccessData(null)} className="w-full sm:w-auto font-medium px-8" size="lg">Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Save to Point Bank Dialog */}
      <Dialog open={!!pointBankQuickSaveItem} onOpenChange={(open) => !open && setPointBankQuickSaveItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary text-xl">
              <Save className="h-5 w-5" /> Save to Point Bank
            </DialogTitle>
            <DialogDescription>
              Select the target domain to save this raw achievement under in your Point Bank.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {Array.from(new Set(Object.values(ROLE_LABELS))).map(domain => (
              <Button 
                key={domain} 
                variant="outline" 
                className="h-12 justify-start font-medium hover:bg-primary hover:text-primary-foreground border-primary/20 shadow-sm" 
                onClick={() => handleQuickSave(domain)}
              >
                {domain}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
