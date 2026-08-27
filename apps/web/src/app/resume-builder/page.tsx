"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts"

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle, AlertCircle, UploadCloud, CheckCircle2, ChevronRight, Save, Trash2, Edit3, MessageSquare, Plus, Activity, RefreshCw, Send, Target, Sparkles, Loader2, FileText, Copy, Edit2, Layers, Info, Lightbulb, Compass, ListOrdered, ArrowRight, ArrowLeft, Gauge, CheckSquare, ShieldCheck, Database, Bookmark, Check, Wand2 } from "lucide-react"
import { PaywallModal } from "@/components/paywall-modal"

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
  "product_management": "Product Management",
  "analytics": "Data & Analytics",
  "it-software": "Software Engineering",
  "software": "Software Engineering"
};
const getRoleLabel = (r: string) => { if (!r) return "Unknown"; return ROLE_LABELS[r.toLowerCase()] || r; };

const DOMAIN_OPTIONS = [
  { value: "consulting", label: "Management Consulting" },
  { value: "software", label: "Software Engineering / IT" },
  { value: "product_management", label: "Product Management" },
  { value: "finance", label: "Finance / Investment Banking" },
  { value: "analytics", label: "Data Science & Analytics" }
];


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
  achievements?: {
    title?: string;
    parent_experience?: string;
    section_type?: string;
    timeline?: string;
    original_description?: string;
  };
}

// Intelligent helper to resolve section type from bullet metadata or parent title keywords
const resolveBulletSectionType = (bullet: GeneratedBullet, fallbackAch?: Achievement): string => {
  const explicit = bullet.achievements?.section_type || fallbackAch?.section_type;
  if (explicit && explicit !== "General" && explicit !== "Other") {
    return explicit;
  }
  const title = (bullet.achievements?.parent_experience || bullet.achievements?.title || fallbackAch?.parent_experience || fallbackAch?.title || "").toLowerCase();
  if (/hyperloop|formula|project|b\.tech|btp|ddp|thesis|capstone|simulation|bot|pipeline|detection|system|model|classifier|app\b|platform|tool|engine|autonomous/i.test(title)) {
    return "Projects";
  }
  if (/coordinator|manager|secretary|convenor|lead|head|council|representative|senator|damp|alumni|convenor/i.test(title)) {
    return "Positions of Responsibility";
  }
  if (/olympiad|jee|rank|scholarship|kvpy|ntse|academic|cpi|cgpa|medal|dean/i.test(title)) {
    return "Scholastic Achievements";
  }
  if (/club|sport|football|cricket|basketball|badminton|cultural|music|dance|drama|nss|nso|ncc/i.test(title)) {
    return "Extracurricular Activities";
  }
  return explicit || "Professional Experience";
};

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

function ResumeBuilderPageContent() {
  const [activeTab, setActiveTab] = useState("vault")
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Vault State
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [vaultSectionFilter, setVaultSectionFilter] = useState<string>("all")
  const [isSyncingVault, setIsSyncingVault] = useState(false)
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null)
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
  const [singleCoachingTips, setSingleCoachingTips] = useState<string[]>([])
  const [customInstructions, setCustomInstructions] = useState("")
  
  // Section Composer State
  const [labMode, setLabMode] = useState<"single" | "composer">("single")
  const [composerHeading, setComposerHeading] = useState<string | null>(null)
  const [composerSelectedIds, setComposerSelectedIds] = useState<string[]>([])
  const [composerNumPoints, setComposerNumPoints] = useState(3)
  const [composerResults, setComposerResults] = useState<any>(null)
  const [isComposerGenerating, setIsComposerGenerating] = useState(false)
  const [activeVariantSet, setActiveVariantSet] = useState(0)
  const [customOverviewLines, setCustomOverviewLines] = useState<Record<number, string>>({})

  // Point Bank State
  const [pointBank, setPointBank] = useState<GeneratedBullet[]>([])
  const [activePointBankRole, setActivePointBankRole] = useState<string>("all")
  const [editingPointBankBullet, setEditingPointBankBullet] = useState<string | null>(null)
  const [editPointBankText, setEditPointBankText] = useState("")
  const [pointBankQuickSaveItem, setPointBankQuickSaveItem] = useState<Achievement | null>(null)
  
  // Point Bank Final Resume Upload & Filters State
  const [isFinalResumeModalOpen, setIsFinalResumeModalOpen] = useState(false)
  const [finalResumeUploadMode, setFinalResumeUploadMode] = useState<"pdf" | "text">("pdf")
  const [finalResumeFile, setFinalResumeFile] = useState<File | null>(null)
  const [finalResumeText, setFinalResumeText] = useState("")
  const [isExtractingFinalResume, setIsExtractingFinalResume] = useState(false)
  const [pointBankFilter, setPointBankFilter] = useState<"all" | "finalized" | "lab">("all")
  const [finalResumeExtractionSuccessData, setFinalResumeExtractionSuccessData] = useState<{saved_bullets_count: number, extracted_sections: number} | null>(null)
  const [finalResumeUploadRole, setFinalResumeUploadRole] = useState("consulting")
  
  // Domain Pivot Engine State
  const [isDomainPivotModalOpen, setIsDomainPivotModalOpen] = useState(false)
  const [pivotSourceRole, setPivotSourceRole] = useState("consulting")
  const [pivotTargetRole, setPivotTargetRole] = useState("software")
  const [pivotTargetCompany, setPivotTargetCompany] = useState("")
  const [pivotSelectedSections, setPivotSelectedSections] = useState<string[]>([])
  const [isPivotConverting, setIsPivotConverting] = useState(false)
  const [pivotResults, setPivotResults] = useState<any>(null)
  const [pivotAcceptedPoints, setPivotAcceptedPoints] = useState<Record<string, boolean>>({})
  const [pivotEditedPoints, setPivotEditedPoints] = useState<Record<string, string>>({})
  const [isBatchSavingPivot, setIsBatchSavingPivot] = useState(false)
  const [batchSaveSuccessMessage, setBatchSaveSuccessMessage] = useState<string | null>(null)

  const [strategyTargetRole, setStrategyTargetRole] = useState("consulting")
  const [strategyDataSource, setStrategyDataSource] = useState("both")
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
  
  // Refinement Chat State
  const [refineTarget, setRefineTarget] = useState<{ source: "bank" | "lab_single" | "lab_composer" | "pivot_review", id: string, text: string, role: string, composerSetIdx?: number, isFinalResume?: boolean, charLength?: number } | null>(null)
  const [refineInstruction, setRefineInstruction] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  const [refineHistory, setRefineHistory] = useState<{ instruction: string, result: string, explanation: string }[]>([])

  
  // API Base
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  // Paywall Modal State
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallMeta, setPaywallMeta] = useState<{
    title?: string
    description?: string
    limit?: number
    used?: number
    resetAt?: string
  }>({})

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

  // Handle URL params for Strategy page redirection to AI Refine
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);

    const refineParam = searchParams.get("refine");
    const instructionParam = searchParams.get("instruction");
    const sectionParam = searchParams.get("section");

    if (refineParam && pointBank.length > 0) {
      // Find the bullet in the point bank
      const bullet = pointBank.find(b => b.id === refineParam);
      if (bullet) {
        setRefineTarget({ 
          source: "bank", 
          id: bullet.id, 
          text: bullet.bullet_text, 
          role: bullet.target_role 
        });
        if (instructionParam) {
          setRefineInstruction(decodeURIComponent(instructionParam));
        }
        setRefineHistory([]);
        
        // Remove the params from URL so it doesn't keep triggering on re-renders
        const url = new URL(window.location.href);
        url.searchParams.delete("refine");
        url.searchParams.delete("instruction");
        if (sectionParam) url.searchParams.delete("section");
        router.replace(url.toString(), undefined);
      }
    }
  }, [searchParams, pointBank, router]);

  const rolesCovered = useMemo(() => {
    const roles = new Set<string>()
    pointBank.forEach(b => {
      if (b.target_role) roles.add(b.target_role.toLowerCase())
    })
    return roles.size
  }, [pointBank]);

  const quantifiedRate = useMemo(() => {
    if (pointBank.length === 0) return 0
    const count = pointBank.filter(b => /\d/.test(b.bullet_text)).length
    return Math.round((count / pointBank.length) * 100)
  }, [pointBank]);

  if (!mounted || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const fetchAchievements = async (retries = 3) => {
    if (!user) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`${apiBase}/builder/achievements?user_id=${user.id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setAchievements(Array.isArray(data) ? data : [])
      } else if (res.status >= 500 && retries > 1) {
        await new Promise(r => setTimeout(r, 400))
        return fetchAchievements(retries - 1)
      }
    } catch (e) {
      if (retries > 1) {
        await new Promise(r => setTimeout(r, 400))
        return fetchAchievements(retries - 1)
      }
      console.error("Error fetching achievements:", e)
    }
  }

  const fetchPointBank = async (retries = 3) => {
    if (!user) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setPointBank(Array.isArray(data) ? data : [])
      } else if (res.status >= 500 && retries > 1) {
        await new Promise(r => setTimeout(r, 400))
        return fetchPointBank(retries - 1)
      }
    } catch (e) {
      if (retries > 1) {
        await new Promise(r => setTimeout(r, 400))
        return fetchPointBank(retries - 1)
      }
      console.error("Error fetching point bank:", e)
    }
  }

  const handleSyncAll = async () => {
    setIsSyncingVault(true)
    await Promise.all([fetchAchievements(), fetchPointBank()])
    setIsSyncingVault(false)
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

  
  const handleStrategyRefine = (point_id: string, instruction: string, section?: string) => {
    const bullet = pointBank.find(b => b.id === point_id);
    if (bullet) {
      setRefineTarget({ 
        source: "bank", 
        id: bullet.id, 
        text: bullet.bullet_text, 
        role: bullet.target_role 
      });
      if (instruction) setRefineInstruction(instruction);
      if (section) setComposerHeading(section);
      setRefineHistory([]);
      setIsStrategyModalOpen(false);
      setActiveTab("bank");
    }
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
          existing_bullets: existing_bullets,
          custom_instructions: customInstructions || undefined
        })
      })
      if (res.ok) {
        const data = await res.json()
        const bullets = Array.isArray(data) ? data : (data.bullets || []);
        const tips = data.coaching_tips || (bullets[0]?.coaching_tips) || [];
        if (!bullets || bullets.length === 0) {
          alert("AI generation failed or returned no results. Please try again.")
        } else {
          bullets.forEach((b: any, bIdx: number) => {
            if (!b.id) b.id = `single-bullet-${bIdx}-${crypto.randomUUID()}`;
          });
          setGeneratedBullets(bullets)
          setSingleCoachingTips(tips)
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === 'object' ? errorData.detail : {}
          setPaywallMeta({
            title: "Bullet Generation Limit Reached",
            description: detail.message || (typeof errorData.detail === 'string' ? errorData.detail : "You have reached your quota limit for AI bullet refinements. Upgrade to Pro for 200 bullet variants/month."),
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at
          })
          setPaywallOpen(true)
          setIsGenerating(false)
          return
        }
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
          benchmark_text: benchmarkText || undefined,
          custom_instructions: customInstructions || undefined
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (!data || !data.variant_sets) {
          alert("AI generation failed or returned no results. Please try again.")
        } else {
          data.variant_sets.forEach((set: any, sIdx: number) => {
            set.bullets.forEach((b: any, bIdx: number) => {
              if (!b.id) b.id = `composer-bullet-${sIdx}-${bIdx}-${crypto.randomUUID()}`;
            });
          });
          setComposerResults(data)
          setActiveVariantSet(0)
          setCustomOverviewLines({})
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === 'object' ? errorData.detail : {}
          setPaywallMeta({
            title: "Section Generation Limit Reached",
            description: detail.message || (typeof errorData.detail === 'string' ? errorData.detail : "You have reached your quota limit for AI bullet refinements. Upgrade to Pro for 200 bullet variants/month."),
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at
          })
          setPaywallOpen(true)
          setIsComposerGenerating(false)
          return
        }
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
        
        if (composerResults) {
          const newComposerResults = { ...composerResults };
          for (let i = 0; i < newComposerResults.variant_sets.length; i++) {
            newComposerResults.variant_sets[i].bullets = newComposerResults.variant_sets[i].bullets.map((b: any) => 
              b.id === bullet.id ? { ...b, is_saved: true } : b
            );
          }
          setComposerResults(newComposerResults);
        }

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
    try {
      const res = await fetch(`${apiBase}/builder/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          target_role: strategyTargetRole,
          data_source: strategyDataSource,
          target_company: strategyTargetCompany || undefined,
          job_description: strategyJobDescription || undefined
        })
      })
      if (res.ok) {
        setStrategyData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsStrategyLoading(false)
    }
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

  const openFinalResumeModal = () => {
    const defaultRole = activePointBankRole === "all" ? targetRole : (Object.keys(ROLE_LABELS).find(k => ROLE_LABELS[k].toLowerCase() === activePointBankRole.toLowerCase()) || targetRole)
    setFinalResumeUploadRole(defaultRole)
    setIsFinalResumeModalOpen(true)
  }

  const handleFinalResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (finalResumeUploadMode === "pdf" && !finalResumeFile) {
      alert("Please select a PDF resume file.")
      return
    }
    if (finalResumeUploadMode === "text" && !finalResumeText.trim()) {
      alert("Please paste your resume text or LaTeX.")
      return
    }
    
    setIsExtractingFinalResume(true)
    try {
      const formData = new FormData()
      formData.append("user_id", user.id)
      formData.append("target_role", finalResumeUploadRole)
      if (finalResumeUploadMode === "pdf" && finalResumeFile) {
        formData.append("file", finalResumeFile)
      } else if (finalResumeUploadMode === "text") {
        formData.append("raw_text", finalResumeText)
      }
      
      const res = await fetch(`${apiBase}/builder/extract/final-resume`, {
        method: "POST",
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setFinalResumeExtractionSuccessData({
          saved_bullets_count: data.saved_bullets_count,
          extracted_sections: data.extracted_sections
        })
        setIsFinalResumeModalOpen(false)
        setFinalResumeFile(null)
        setFinalResumeText("")
        // Refresh point bank
        const bankRes = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`)
        if (bankRes.ok) {
          setPointBank(await bankRes.json())
        }
      } else {
        const err = await res.json()
        alert(err.detail || "Failed to extract resume points. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to upload and extract resume points.")
    } finally {
      setIsExtractingFinalResume(false)
    }
  }

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refineTarget || !refineInstruction.trim()) return
    setIsRefining(true)
    try {
      const isFinal = refineTarget.isFinalResume || false
      const currentText = refineHistory.length > 0 ? refineHistory[refineHistory.length - 1].result : refineTarget.text
      const res = await fetch(`${apiBase}/builder/refine-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: refineTarget.role,
          bullet_text: currentText,
          instruction: refineInstruction,
          preserve_length: isFinal,
          target_char_length: isFinal ? (refineTarget.charLength || refineTarget.text.length) : undefined
        })
      })
      if (res.ok) {
        const data = await res.json()
        setRefineHistory(prev => [...prev, { instruction: refineInstruction, result: data.refined_bullet, explanation: data.explanation }])
        setRefineInstruction("")
      }
    } catch (e) {
      console.error("Refinement failed:", e)
    } finally {
      setIsRefining(false)
    }
  }

  const acceptRefinement = async () => {
    if (!refineTarget || refineHistory.length === 0) return
    const newText = refineHistory[refineHistory.length - 1].result

    if (refineTarget.source === "bank") {
      try {
        const res = await fetch(`${apiBase}/builder/point-bank/${refineTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bullet_text: newText })
        })
        if (res.ok) {
          setPointBank(prev => prev.map(b => b.id === refineTarget.id ? { ...b, bullet_text: newText } : b))
        }
      } catch(e) {}
    } else if (refineTarget.source === "lab_single") {
      setGeneratedBullets(prev => prev.map(b => b.id === refineTarget.id ? { ...b, bullet_text: newText } : b))
    } else if (refineTarget.source === "lab_composer" && refineTarget.composerSetIdx !== undefined) {
      const newResults = { ...composerResults }
      const set = newResults.variant_sets[refineTarget.composerSetIdx]
      set.bullets = set.bullets.map((b: any) => b.id === refineTarget.id ? { ...b, bullet_text: newText } : b)
      setComposerResults(newResults)
    } else if (refineTarget.source === "pivot_review") {
      setPivotEditedPoints(prev => ({
        ...prev,
        [refineTarget.id]: newText
      }))
    }
    
    setRefineTarget(null)
    setRefineHistory([])
    setRefineInstruction("")
  }

  const openDomainPivotModal = () => {
    // Find current active role in point bank
    const availableRoles = Array.from(new Set(pointBank.map(b => b.target_role)))
    const currentRole = activePointBankRole === "all" ? (availableRoles[0] || "consulting") : (pointBank.find(b => getRoleLabel(b.target_role) === getRoleLabel(activePointBankRole))?.target_role || "consulting")
    
    setPivotSourceRole(currentRole)
    // Pick default target role that is different from source
    const otherRole = DOMAIN_OPTIONS.find(d => d.value.toLowerCase() !== currentRole.toLowerCase())?.value || "software"
    setPivotTargetRole(otherRole)
    setPivotTargetCompany("")
    
    // Extract all sections present in current source role bullets
    const sourceBullets = pointBank.filter(b => getRoleLabel(b.target_role) === getRoleLabel(currentRole))
    const sectionsSet = new Set<string>()
    sourceBullets.forEach(b => {
      const ach = achievements.find(a => a.id === b.achievement_id)
      const sec = resolveBulletSectionType(b, ach)
      sectionsSet.add(sec)
    })
    
    const allSecs = sectionsSet.size > 0 ? Array.from(sectionsSet) : ["Professional Experience", "Projects", "Positions of Responsibility"]
    setPivotSelectedSections(allSecs)
    setIsDomainPivotModalOpen(true)
  }

  const handleRunDomainPivot = async () => {
    if (!user) return
    setIsPivotConverting(true)
    try {
      // Build structured sections from current pointBank to ensure exact client-side state is sent
      const sourceBullets = pointBank.filter(b => getRoleLabel(b.target_role) === getRoleLabel(pivotSourceRole))
      const grouped: Record<string, Record<string, any[]>> = {}
      
      sourceBullets.forEach(b => {
        const ach = achievements.find(a => a.id === b.achievement_id)
        const sec = resolveBulletSectionType(b, ach)
        const parent = b.achievements?.parent_experience || b.achievements?.title || ach?.parent_experience || ach?.title || "General"
        if (!grouped[sec]) grouped[sec] = {}
        if (!grouped[sec][parent]) grouped[sec][parent] = []
        grouped[sec][parent].push({
          id: b.id,
          achievement_id: b.achievement_id,
          bullet_text: b.bullet_text,
          variant_type: b.variant_type,
          achievements: b.achievements || ach
        })
      })

      const rawSections: any[] = []
      Object.entries(grouped).forEach(([sec, parents]) => {
        // Check if user selected this section
        if (pivotSelectedSections.length === 0 || pivotSelectedSections.includes(sec)) {
          Object.entries(parents).forEach(([parent, bList]) => {
            const firstBullet = bList[0]
            const ach = achievements.find(a => a.id === firstBullet?.achievement_id)
            rawSections.push({
              section_type: sec,
              parent_experience: parent,
              timeline: firstBullet?.achievements?.timeline || ach?.timeline || "",
              overview_line: firstBullet?.achievements?.original_description || ach?.original_description || "",
              bullets: bList
            })
          })
        }
      })


      const res = await fetch(`${apiBase}/builder/convert-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          source_role: pivotSourceRole,
          target_role: pivotTargetRole,
          target_company: pivotTargetCompany,
          sections_to_convert: pivotSelectedSections,
          raw_sections: rawSections.length > 0 ? rawSections : undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        setPivotResults(data)
        
        // Initialize accepted points: default true for non-flagged points
        const initialAccepted: Record<string, boolean> = {}
        data.sections?.forEach((sec: any) => {
          sec.point_conversions?.forEach((pt: any) => {
            initialAccepted[pt.id] = !pt.is_flagged && pt.conversion_confidence !== "not_convertible"
          })
        })
        setPivotAcceptedPoints(initialAccepted)
        setPivotEditedPoints({})
        setIsDomainPivotModalOpen(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Failed to convert domain resume. Please try again.")
      }
    } catch (err) {
      console.error("Domain pivot error:", err)
      alert("An error occurred during domain conversion. Please try again.")
    } finally {
      setIsPivotConverting(false)
    }
  }

  const handleSaveAllPivotAccepted = async () => {
    if (!user || !pivotResults) return
    setIsBatchSavingPivot(true)
    try {
      const bulletsToSave: any[] = []
      
      pivotResults.sections?.forEach((sec: any) => {
        sec.point_conversions?.forEach((pt: any) => {
          if (pivotAcceptedPoints[pt.id]) {
            const textToSave = pivotEditedPoints[pt.id] || pt.converted_text || pt.original_text
            if (textToSave && textToSave.trim()) {
              bulletsToSave.push({
                achievement_id: pt.achievement_id,
                target_role: pivotResults.target_domain || pivotTargetRole,
                bullet_text: textToSave.trim(),
                variant_type: "domain_pivot",
                parent_experience: sec.parent_experience,
                section_type: sec.section_type
              })
            }
          }
        })
      })

      if (bulletsToSave.length === 0) {
        alert("No points are selected to save.")
        setIsBatchSavingPivot(false)
        return
      }

      const res = await fetch(`${apiBase}/builder/save-bullets-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          bullets: bulletsToSave
        })
      })

      if (res.ok) {
        const data = await res.json()
        setBatchSaveSuccessMessage(`Successfully saved ${data.count} points to ${getRoleLabel(pivotResults.target_domain || pivotTargetRole)} Point Bank!`)
        // Refresh Point Bank
        const bankRes = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`)
        if (bankRes.ok) {
          setPointBank(await bankRes.json())
        }
        // Switch active tab to target role
        setActivePointBankRole(getRoleLabel(pivotResults.target_domain || pivotTargetRole))
        // Clear pivot results
        setPivotResults(null)
        setTimeout(() => setBatchSaveSuccessMessage(null), 6000)
      } else {
        const err = await res.json()
        alert(err.detail || "Failed to save points to Point Bank.")
      }
    } catch (err) {
      console.error("Save batch error:", err)
      alert("Failed to save converted points.")
    } finally {
      setIsBatchSavingPivot(false)
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
            <span className="text-xs font-mono-tech text-muted-foreground">RESUME BUILDER & VAULT</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncAll} 
              disabled={isSyncingVault}
              className="text-xs font-mono-tech h-8 border-border"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${isSyncingVault ? "animate-spin" : ""}`} /> Sync Vault
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 max-w-6xl px-4 sm:px-6 space-y-8 flex-1">
        {/* Placement Command Header */}
        <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [DAY 1 PLACEMENT CALIBRATED]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">MULTI-ROLE RESUME STUDIO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Resume Builder & Achievement Vault
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-sans">
              Store your raw achievements once. Compose, benchmark, and pivot tailored bullet points across 5 placement domains with verified Day 1 quality.
            </p>
          </div>
        </div>

        {/* 4-KPI Metric Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
            <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
              <span>RAW ACHIEVEMENTS</span>
              <Database className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono-tech text-foreground">{achievements.length}</div>
            <div className="text-[10px] text-muted-foreground">Extracted across all sections</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
            <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
              <span>POINT BANK BULLETS</span>
              <Bookmark className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono-tech text-foreground">{pointBank.length}</div>
            <div className="text-[10px] text-muted-foreground">Day 1 placement-ready variants</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
            <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
              <span>ROLE COVERAGE</span>
              <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono-tech text-foreground">{rolesCovered} / 5 Roles</div>
            <div className="text-[10px] text-muted-foreground">Consulting, SDE, PM, Finance, Analytics</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
            <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center justify-between">
              <span>QUANTIFICATION RATE</span>
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono-tech text-foreground">{quantifiedRate}%</div>
            <div className="text-[10px] text-muted-foreground">Bullets with quantified metrics</div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full space-y-8">
          <TabsList className="flex flex-col sm:flex-row w-full h-auto bg-muted/40 p-1.5 rounded-xl shadow-xs border border-border">
            <TabsTrigger 
              value="vault" 
              className="flex-1 py-2.5 text-xs sm:text-sm font-semibold font-mono-tech rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-foreground transition-all"
            >
              <UploadCloud className="w-4 h-4 mr-2 text-primary" /> 1. Achievement Vault ({achievements.length})
            </TabsTrigger>
            <TabsTrigger 
              value="lab" 
              className="flex-1 py-2.5 text-xs sm:text-sm font-semibold font-mono-tech rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-foreground transition-all"
            >
              <Activity className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> 2. Bullet Laboratory & Composer
            </TabsTrigger>
            <TabsTrigger 
              value="bank" 
              className="flex-1 py-2.5 text-xs sm:text-sm font-semibold font-mono-tech rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-foreground transition-all"
            >
              <Save className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> 3. Point Bank & Strategy ({pointBank.length})
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>Your Vault Achievements</span>
                  <Badge variant="secondary" className="text-xs font-mono-tech px-2 rounded-full">{achievements.length}</Badge>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Structured raw career accomplishments categorized for AI bullet generation</p>
              </div>

              {achievements.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border text-xs font-mono-tech">
                  {[
                    { id: "all", label: "All Sections" },
                    { id: "Professional Experience", label: "Experience" },
                    { id: "Projects", label: "Projects" },
                    { id: "Positions of Responsibility", label: "POR" },
                    { id: "Scholastic Achievements", label: "Scholastic" },
                    { id: "Extracurriculars", label: "Extracurriculars" },
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setVaultSectionFilter(sec.id)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        vaultSectionFilter === sec.id 
                          ? "bg-background text-foreground font-semibold shadow-xs border border-border" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              )}
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
                  }).filter(s => vaultSectionFilter === "all" || s === vaultSectionFilter);

                  if (sortedSections.length === 0) {
                    return (
                      <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground bg-muted/5">
                        <p className="text-sm">No achievements found under <span className="font-semibold text-foreground">{vaultSectionFilter}</span>.</p>
                        <Button variant="outline" size="sm" onClick={() => setVaultSectionFilter("all")} className="mt-3 text-xs font-mono-tech">
                          View All Sections
                        </Button>
                      </div>
                    );
                  }

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
                            <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none p-1 rounded-md">
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

                {/* Custom Strategic Instructions & Comments */}
                <div className="space-y-3 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="custom-instructions">
                      <MessageSquare className="h-4 w-4 text-primary" /> Additional Instructions & Strategic Focus (Optional)
                    </label>
                    {customInstructions && (
                      <button 
                        type="button" 
                        onClick={() => setCustomInstructions("")}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Textarea
                    id="custom-instructions"
                    placeholder="e.g. 'Emphasize backend latency & high scale (15k TPS)', 'Highlight C-suite stakeholder alignment', 'Focus on 0-to-1 launch'..."
                    className="min-h-[80px] w-full rounded-xl border border-input/60 bg-muted/5 px-4 py-3 text-[14.5px] shadow-sm hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none placeholder:text-muted-foreground/60"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs text-muted-foreground flex items-center font-medium mr-1">Quick Presets:</span>
                    {[
                      { label: "💼 Business ROI & Cost", text: "Emphasize quantified financial ROI, cost optimization, and strategic business impact" },
                      { label: "⚡ Latency & High Scale", text: "Highlight distributed systems scale, latency reduction, throughput, and system reliability" },
                      { label: "👥 Cross-Functional Leadership", text: "Focus on leading cross-functional teams, stakeholder management, and initiative ownership" },
                      { label: "🚀 Massive Impact Front-Loaded", text: "Front-load massive business/user metrics using inverted impact structure" },
                      { label: "🛠️ Highlight Tech Stack", text: "Explicitly showcase key tools, modern frameworks, and architectural design choices" },
                      { label: "🎯 0-to-1 Launch", text: "Highlight zero-to-one product/initiative execution, rapid iteration, and user adoption" },
                    ].map((preset, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={`cursor-pointer text-[11px] px-2.5 py-1 rounded-lg border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all select-none ${
                          customInstructions.includes(preset.text) ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-background/80 text-foreground/80"
                        }`}
                        onClick={() => {
                          if (customInstructions === preset.text) {
                            setCustomInstructions("");
                          } else if (!customInstructions.trim()) {
                            setCustomInstructions(preset.text);
                          } else {
                            setCustomInstructions(`${customInstructions.trim()}; ${preset.text}`);
                          }
                        }}
                      >
                        {preset.label}
                      </Badge>
                    ))}
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

                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            className="font-medium shadow-sm border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => {
                              setRefineTarget({ source: "lab_single", id: bullet.id, text: bullet.bullet_text, role: targetRole });
                              setRefineInstruction("");
                              setRefineHistory([]);
                            }}
                          >
                            <Sparkles className="h-4 w-4 mr-2" /> Refine
                          </Button>
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
                    </div>
                  </Card>
                ))}
              </div>

              {/* Single Bullet Coaching Tips */}
              {singleCoachingTips && singleCoachingTips.length > 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 text-[15px] font-bold text-primary mb-3">
                    <Lightbulb className="h-5 w-5" /> Proactive Coach Recommendations for this Point
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {singleCoachingTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-background/80 p-3 rounded-xl border border-primary/10 text-[13.5px] text-foreground/90">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {labMode === "composer" && composerResults && composerResults.variant_sets && (
            <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="text-xl font-bold px-2">Generated Section Variants</h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              {composerResults.variant_sets.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 bg-muted/30 rounded-xl border border-dashed">
                  <p>AI generation returned no variants. Please try again or refine your instructions.</p>
                </div>
              ) : (
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
              )}

              {composerResults.variant_sets[activeVariantSet] && (
                <div className="space-y-6">
                  {/* Section LaTeX Header & Italicized Overview Line Showcase */}
                  <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-md rounded-2xl p-5 md:p-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-border/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold uppercase text-[10px] tracking-wider">
                            Section Top Line
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">IITB Placement Standard</span>
                        </div>
                        <h4 className="text-base font-extrabold text-foreground mt-1 flex items-center gap-2">
                          {composerHeading || "Organization / Experience Name"} 
                          <span className="font-normal text-muted-foreground text-sm font-sans">| {getRoleLabel(composerResults.target_role || targetRole)}</span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-medium border-border/70 hover:bg-muted/50"
                          onClick={() => {
                            const overview = customOverviewLines[activeVariantSet] ?? (composerResults.variant_sets[activeVariantSet]?.overview_line || composerResults.variant_sets[activeVariantSet]?.overview_line_variants?.[0]?.text || "");
                            navigator.clipboard.writeText(overview);
                            alert("Overview line copied to clipboard!");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Overview
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs font-medium shadow-sm"
                          onClick={() => {
                            const currentSet = composerResults.variant_sets[activeVariantSet];
                            const heading = composerHeading || "Organization / Experience";
                            const overview = customOverviewLines[activeVariantSet] ?? (currentSet?.overview_line || currentSet?.overview_line_variants?.[0]?.text || "");
                            const bullets = currentSet.bullets.map((b: any) => `• ${b.bullet_text}`).join('\n');
                            const fullText = `${heading} | ${getRoleLabel(composerResults.target_role || targetRole)}\n${overview ? `${overview}\n` : ''}${bullets}`;
                            navigator.clipboard.writeText(fullText);
                            alert("Full formatted section copied to clipboard!");
                          }}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" /> Copy Full Section
                        </Button>
                      </div>
                    </div>

                    {/* Italicized Overview Box */}
                    <div className="bg-background/90 p-4 rounded-xl border border-primary/15 shadow-inner space-y-2">
                      <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 text-primary font-semibold">
                          <Sparkles className="h-3.5 w-3.5" /> Italicized Overview 1-Liner:
                        </span>
                        <span className="text-[11px] opacity-70">Renders directly below heading</span>
                      </div>
                      <p className="font-serif italic text-[15px] md:text-[16px] text-foreground/95 leading-relaxed pl-3 border-l-2 border-primary/60">
                        {customOverviewLines[activeVariantSet] ?? (composerResults.variant_sets[activeVariantSet]?.overview_line || composerResults.variant_sets[activeVariantSet]?.overview_line_variants?.[0]?.text || "No overview line generated.")}
                      </p>
                    </div>

                    {/* Style / Archetype Switcher Pills */}
                    {composerResults.variant_sets[activeVariantSet]?.overview_line_variants && composerResults.variant_sets[activeVariantSet]?.overview_line_variants.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-semibold text-muted-foreground">Overview Framing Archetypes:</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {composerResults.variant_sets[activeVariantSet].overview_line_variants.map((v: any, vIdx: number) => {
                            const isSelected = (customOverviewLines[activeVariantSet] === v.text) || (!customOverviewLines[activeVariantSet] && (v.text === composerResults.variant_sets[activeVariantSet]?.overview_line || vIdx === 0));
                            return (
                              <button
                                key={vIdx}
                                type="button"
                                onClick={() => setCustomOverviewLines(prev => ({ ...prev, [activeVariantSet]: v.text }))}
                                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                                  isSelected 
                                    ? "bg-primary/15 border-primary text-primary font-semibold shadow-sm" 
                                    : "bg-background/60 border-border/60 hover:border-primary/40 text-foreground/80 hover:bg-muted/20"
                                }`}
                              >
                                <div className="font-bold flex items-center justify-between mb-1">
                                  <span>{v.label || v.type.replace('_', ' ').toUpperCase()}</span>
                                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                                </div>
                                <p className="text-[11.5px] line-clamp-2 text-muted-foreground font-normal italic">
                                  "{v.text}"
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* The bullets list */}
                  <div className="bg-card border border-border shadow-md rounded-xl overflow-hidden">
                    <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                      <h4 className="font-bold text-foreground">Drafted Points</h4>
                      {(() => {
                        const allSaved = composerResults.variant_sets[activeVariantSet].bullets.every((b: any) => b.is_saved);
                        return (
                          <Button 
                            size="sm"
                            variant={allSaved ? "secondary" : "default"}
                            className={`transition-all ${allSaved ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 font-medium' : ''}`}
                            disabled={allSaved}
                            onClick={async () => {
                              const groupId = crypto.randomUUID();
                              const bullets = composerResults.variant_sets[activeVariantSet].bullets;
                              for (const bullet of bullets) {
                                if (!bullet.is_saved) {
                                  await saveBullet(bullet, groupId);
                                }
                              }
                            }}
                          >
                            {allSaved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {allSaved ? "Set Saved" : "Save Set to Point Bank"}
                          </Button>
                        )
                      })()}
                    </div>
                    <div className="divide-y divide-border/50">
                      {composerResults.variant_sets[activeVariantSet].bullets.map((bullet: any, idx: number) => (
                        <div key={idx} className="p-5 flex flex-col gap-3 hover:bg-muted/10 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 text-[16px] md:text-[17px] font-medium leading-relaxed text-foreground">
                              <span className="text-muted-foreground font-bold mr-2">•</span>
                              {highlightMetrics(bullet.bullet_text)}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button 
                                variant="ghost" size="sm"
                                className="text-primary hover:text-primary hover:bg-primary/10 shrink-0 font-medium justify-start"
                                onClick={() => {
                                  setRefineTarget({ source: "lab_composer", id: bullet.id, text: bullet.bullet_text, role: composerResults.target_role || "finance", composerSetIdx: activeVariantSet });
                                  setRefineInstruction("");
                                  setRefineHistory([]);
                                }}
                              >
                                <Sparkles className="h-4 w-4 mr-2" /> AI Refine
                              </Button>
                              <Button 
                                variant={bullet.is_saved ? "secondary" : "ghost"} 
                                size="sm"
                                className={`shrink-0 justify-start transition-all ${bullet.is_saved ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={async () => {
                                  const groupId = crypto.randomUUID();
                                  await saveBullet(bullet, groupId);
                                }}
                                disabled={bullet.is_saved}
                              >
                                {bullet.is_saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {bullet.is_saved ? "Saved" : "Save Single"}
                              </Button>
                            </div>
                          </div>
                          <div className="pl-6 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-primary shrink-0" />
                              <span className="italic">{bullet.merge_explanation}</span>
                            </div>
                            {benchmarkText && (
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${bullet.bullet_text.length > benchmarkText.length + 6 ? 'bg-amber-500' : 'bg-primary'}`} 
                                    style={{ width: `${Math.min((bullet.bullet_text.length / benchmarkText.length) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-[11.5px] font-mono font-semibold ${bullet.bullet_text.length > benchmarkText.length + 6 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                  {bullet.bullet_text.length} / {benchmarkText.length} chars
                                </span>
                              </div>
                            )}
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

                  {/* Section Local Coaching Tips */}
                  {composerResults.local_coaching_tips && composerResults.local_coaching_tips.length > 0 && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 shadow-sm">
                      <div className="flex items-center gap-2 text-[15px] font-bold text-primary mb-3">
                        <Lightbulb className="h-5 w-5" /> Proactive Section Placement Tips
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {composerResults.local_coaching_tips.map((tip: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2.5 bg-background/80 p-3 rounded-xl border border-primary/10 text-[13.5px] text-foreground/90">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Strategy CTA */}
                  <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-bold text-[15px] flex items-center gap-2 text-primary">
                        <Target className="h-4 w-4" /> Validate Your Strategy
                      </h4>
                      <p className="text-[13px] text-muted-foreground mt-1">
                        Done generating points? Check how they align with successful senior {getRoleLabel(composerResults.target_role || "consulting")} resumes.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsStrategyModalOpen(true)}
                      size="sm"
                      className="shrink-0 shadow-sm"
                    >
                      Run Strategy Engine
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* POINT BANK TAB */}
        <TabsContent value="bank" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="border-b bg-muted/5 pb-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Save className="h-6 w-6 text-primary" /> Point Bank
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Your unified repository of saved points. Points extracted from your finalized domain resumes appear at the top, alongside points drafted in the Laboratory.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button 
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm flex items-center gap-2"
                    onClick={openFinalResumeModal}
                  >
                    <UploadCloud className="h-4 w-4" /> Upload Finalized Resume
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-primary/50 text-primary hover:bg-primary/10 font-bold shadow-sm flex items-center gap-2"
                    onClick={openDomainPivotModal}
                    disabled={pointBank.length === 0}
                    title={pointBank.length === 0 ? "Upload or save points to point bank first" : "Reframe points to another domain"}
                  >
                    <RefreshCw className="h-4 w-4" /> Pivot Domain
                  </Button>
                  <Button 
                    onClick={() => {
                      const rawRole = pointBank.find(b => getRoleLabel(b.target_role) === getRoleLabel(activePointBankRole))?.target_role || "consulting";
                      setStrategyTargetRole(rawRole);
                      setIsStrategyModalOpen(true);
                    }}
                    variant="outline"
                    className="font-semibold shadow-sm"
                  >
                    <Target className="h-4 w-4 mr-2" /> Generate Strategy Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {batchSaveSuccessMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in-50">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-sm">{batchSaveSuccessMessage}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setBatchSaveSuccessMessage(null)} className="h-7 text-xs">
                    Dismiss
                  </Button>
                </div>
              )}

              {pivotResults ? (
                <div className="space-y-8 animate-in fade-in-50 duration-500">
                  {/* Pivot Review Studio Header Banner */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-muted/30 to-background border-2 border-primary/30 shadow-md">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" /> Domain Pivot Studio
                          </Badge>
                          {pivotResults.target_company && (
                            <Badge variant="outline" className="border-primary/40 text-foreground font-medium">
                              Focus: {pivotResults.target_company}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                          <span>{pivotResults.source_domain_label || getRoleLabel(pivotResults.source_domain)}</span>
                          <ArrowRight className="h-5 w-5 text-primary" />
                          <span className="text-primary">{pivotResults.target_domain_label || getRoleLabel(pivotResults.target_domain)}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                          Review your side-by-side reframed points. Character lengths are strictly preserved for 1-page template line budgets. Unconvertible points are flagged for factual integrity.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPivotResults(null)}
                          className="font-medium shadow-sm"
                        >
                          Exit Review
                        </Button>
                        <Button
                          onClick={handleSaveAllPivotAccepted}
                          disabled={isBatchSavingPivot || Object.values(pivotAcceptedPoints).filter(Boolean).length === 0}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-2"
                        >
                          {isBatchSavingPivot ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Saving to Point Bank...</>
                          ) : (
                            <><Save className="h-4 w-4" /> Save {Object.values(pivotAcceptedPoints).filter(Boolean).length} Points to {pivotResults.target_domain_label || getRoleLabel(pivotResults.target_domain)}</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Summary KPI Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
                      <div className="p-3 bg-background/80 rounded-xl border shadow-sm">
                        <div className="text-xs text-muted-foreground font-medium">Total Points</div>
                        <div className="text-xl font-black text-foreground mt-0.5">{pivotResults.total_points}</div>
                      </div>
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-sm">
                        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Successfully Converted
                        </div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{pivotResults.converted_points_count}</div>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-sm">
                        <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Flagged / Inconvertible
                        </div>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{pivotResults.flagged_points_count}</div>
                      </div>
                      <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl shadow-sm">
                        <div className="text-xs text-primary font-semibold flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5" /> Selected to Save
                        </div>
                        <div className="text-xl font-black text-primary mt-0.5">
                          {Object.values(pivotAcceptedPoints).filter(Boolean).length} / {pivotResults.total_points}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section by Section Side-by-Side Review */}
                  <div className="space-y-8">
                    {pivotResults.sections?.map((sec: any, secIdx: number) => (
                      <Card key={secIdx} className="border-border/70 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/15 border-b pb-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-wider mb-1 bg-background">
                                {sec.section_type}
                              </Badge>
                              <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" /> {sec.parent_experience}
                                {sec.timeline && <span className="text-xs font-normal text-muted-foreground font-sans">({sec.timeline})</span>}
                              </CardTitle>
                            </div>

                            {/* Section-level toggle */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 text-primary hover:bg-primary/10"
                                onClick={() => {
                                  const next = { ...pivotAcceptedPoints };
                                  const allSecChecked = sec.point_conversions.every((pt: any) => next[pt.id]);
                                  sec.point_conversions.forEach((pt: any) => {
                                    if (!pt.is_flagged || allSecChecked) {
                                      next[pt.id] = !allSecChecked;
                                    }
                                  });
                                  setPivotAcceptedPoints(next);
                                }}
                              >
                                {sec.point_conversions.every((pt: any) => pivotAcceptedPoints[pt.id]) ? "Deselect Section" : "Select Section"}
                              </Button>
                            </div>
                          </div>

                          {/* Overview 1-Liner Comparison */}
                          {(sec.source_overview_line || sec.converted_overview_line) && (
                            <div className="mt-3 p-3 bg-background rounded-xl border border-border/60 text-xs space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-muted-foreground shrink-0 w-24">Original Overview:</span>
                                <span className="italic text-foreground/80">{sec.source_overview_line || "None"}</span>
                              </div>
                              <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                                <span className="font-bold text-primary shrink-0 w-24">Pivot Overview:</span>
                                <span className="italic font-medium text-foreground">{sec.converted_overview_line || sec.source_overview_line}</span>
                              </div>
                            </div>
                          )}
                        </CardHeader>

                        <CardContent className="pt-5 space-y-4">
                          {sec.point_conversions?.map((pt: any, ptIdx: number) => {
                            const isAccepted = !!pivotAcceptedPoints[pt.id];
                            const isFlagged = pt.is_flagged || pt.conversion_confidence === "not_convertible";
                            const currentConvertedText = pivotEditedPoints[pt.id] || pt.converted_text;
                            const charDiff = currentConvertedText ? (currentConvertedText.length - pt.original_char_length) : 0;

                            return (
                              <div
                                key={pt.id || ptIdx}
                                className={`rounded-2xl border transition-all p-4 ${
                                  isFlagged
                                    ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                                    : isAccepted
                                      ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/15 shadow-sm"
                                      : "border-border/60 bg-background hover:bg-muted/10 opacity-75"
                                }`}
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                  {/* Left: Original Point */}
                                  <div className="lg:col-span-5 space-y-2 border-b lg:border-b-0 lg:border-r border-border/60 pb-3 lg:pb-0 lg:pr-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Original ({pivotResults.source_domain_label || "Source"})
                                      </span>
                                      <span className="text-[11px] text-muted-foreground font-mono">
                                        {pt.original_char_length} chars
                                      </span>
                                    </div>
                                    <div className="text-[14px] leading-relaxed text-foreground/90 font-normal">
                                      {highlightMetrics(pt.original_text)}
                                    </div>
                                  </div>

                                  {/* Right: Converted Point */}
                                  <div className="lg:col-span-7 space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        {isFlagged ? (
                                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50 text-[10.5px] font-bold uppercase gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Flagged / Inconvertible
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50 text-[10.5px] font-bold uppercase gap-1">
                                            <Sparkles className="h-3 w-3" /> {pt.conversion_confidence || "Converted"}
                                          </Badge>
                                        )}
                                        {currentConvertedText && (
                                          <span className="text-[11px] font-mono text-muted-foreground">
                                            {currentConvertedText.length} chars (
                                            <span className={Math.abs(charDiff) <= 5 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                              {charDiff > 0 ? `+${charDiff}` : charDiff}
                                            </span>)
                                          </span>
                                        )}
                                      </div>

                                      {/* Point action buttons & accept toggle */}
                                      <div className="flex items-center gap-2">
                                        {currentConvertedText && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1"
                                            onClick={() => {
                                              setRefineTarget({
                                                source: "pivot_review",
                                                id: pt.id,
                                                text: currentConvertedText,
                                                role: pivotResults.target_domain || pivotTargetRole,
                                                isFinalResume: true,
                                                charLength: pt.original_char_length
                                              });
                                              setRefineInstruction("");
                                              setRefineHistory([]);
                                            }}
                                          >
                                            <Sparkles className="h-3.5 w-3.5" /> AI Refine
                                          </Button>
                                        )}
                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-foreground">
                                          <input
                                            type="checkbox"
                                            checked={isAccepted}
                                            onChange={(e) => {
                                              setPivotAcceptedPoints(prev => ({
                                                ...prev,
                                                [pt.id]: e.target.checked
                                              }));
                                            }}
                                            className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                                          />
                                          {isAccepted ? "Accepted" : "Include"}
                                        </label>
                                      </div>
                                    </div>

                                    {/* Converted Text Display / Flagged Notice */}
                                    {isFlagged ? (
                                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                                        <p className="font-semibold">Why this point was flagged:</p>
                                        <p className="leading-relaxed">{pt.conversion_notes}</p>
                                      </div>
                                    ) : (
                                      <div className="text-[14.5px] leading-relaxed text-foreground font-medium bg-background/60 p-2.5 rounded-xl border border-border/50">
                                        {highlightMetrics(currentConvertedText)}
                                      </div>
                                    )}

                                    {/* Conversion Framing Rationale Note */}
                                    {!isFlagged && pt.conversion_notes && (
                                      <div className="text-[11.5px] text-muted-foreground flex items-center gap-1.5 bg-muted/20 px-2.5 py-1 rounded-lg">
                                        <Info className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                        <span>{pt.conversion_notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Sticky Bottom Bar */}
                  <div className="p-4 bg-background/95 backdrop-blur-md rounded-2xl border-2 border-primary/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                      <span>
                        <strong className="text-primary">{Object.values(pivotAcceptedPoints).filter(Boolean).length}</strong> of {pivotResults.total_points} points selected for {pivotResults.target_domain_label || getRoleLabel(pivotResults.target_domain)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => setPivotResults(null)}
                        className="flex-1 sm:flex-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveAllPivotAccepted}
                        disabled={isBatchSavingPivot || Object.values(pivotAcceptedPoints).filter(Boolean).length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex-1 sm:flex-none flex items-center justify-center gap-2"
                      >
                        {isBatchSavingPivot ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-4 w-4" /> Save Accepted Points to Bank</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : pointBank.length === 0 ? (
                <div className="text-center p-16 border-2 border-dashed rounded-xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center">
                  <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                    <Save className="h-8 w-8 text-primary/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Your bank is empty</h3>
                  <p className="max-w-md text-sm">Upload your finalized domain resume to extract its points here, or generate bullets in the Laboratory.</p>
                  <div className="text-center pt-8 pb-4">
                    <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold" 
                    onClick={openFinalResumeModal}>
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Upload Finalized Resume
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("lab")}>Go to Laboratory</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Domain Selector & Filter Bar */}
                  <div className="flex flex-col gap-4 border-b border-border/50 pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2.5">
                        {Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role)))).map(role => {

                          const isActive = activePointBankRole === role || (activePointBankRole === "all" && Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))))[0] === role) || getRoleLabel(activePointBankRole) === role;
                          return (
                            <button
                              key={role} 
                              onClick={() => setActivePointBankRole(role)}
                              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold tracking-wide capitalize transition-all ${
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
                    </div>

                    {/* Source Sub-filters */}
                    {(() => {
                      const availableRoles = Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))));
                      const displayRole = activePointBankRole === "all" ? (availableRoles[0] || "all") : getRoleLabel(activePointBankRole);
                      const currentRoleBullets = pointBank.filter(b => getRoleLabel(b.target_role) === displayRole);
                      const totalCount = currentRoleBullets.length;
                      const finalCount = currentRoleBullets.filter(b => b.variant_type === "finalized_resume").length;
                      const labCount = currentRoleBullets.filter(b => b.variant_type !== "finalized_resume").length;

                      return (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Source:</span>
                          <button
                            onClick={() => setPointBankFilter("all")}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              pointBankFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            All Points ({totalCount})
                          </button>
                          <button
                            onClick={() => setPointBankFilter("finalized")}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                              pointBankFilter === "finalized" ? "bg-emerald-600 text-white shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Target className="h-3 w-3" /> Final Resume Points ({finalCount})
                          </button>
                          <button
                            onClick={() => setPointBankFilter("lab")}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                              pointBankFilter === "lab" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Sparkles className="h-3 w-3" /> Lab Saved ({labCount})
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {(() => {
                    const availableRoles = Array.from(new Set(pointBank.map(b => getRoleLabel(b.target_role))));
                    const displayRole = activePointBankRole === "all" ? (availableRoles[0] || "all") : getRoleLabel(activePointBankRole);
                    let roleBullets = pointBank.filter(b => getRoleLabel(b.target_role) === displayRole);
                    
                    if (pointBankFilter === "finalized") {
                      roleBullets = roleBullets.filter(b => b.variant_type === "finalized_resume");
                    } else if (pointBankFilter === "lab") {
                      roleBullets = roleBullets.filter(b => b.variant_type !== "finalized_resume");
                    }

                    if (roleBullets.length === 0) {
                      return (
                        <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground">
                          <p>No points match the selected filter.</p>
                        </div>
                      );
                    }
                    
                    // Group by section type then parent experience
                    const grouped: Record<string, Record<string, typeof roleBullets>> = {};
                    roleBullets.forEach(bullet => {
                      const ach = achievements.find(a => a.id === bullet.achievement_id);
                      const section = resolveBulletSectionType(bullet, ach);
                      const parent = bullet.achievements?.parent_experience || bullet.achievements?.title || ach?.parent_experience || ach?.title || "General";
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
                              {Object.entries(parents).map(([parent, bullets]) => {
                                // Sort bullets: finalized_resume points at the top
                                const sortedBullets = [...bullets].sort((a, b) => {
                                  const aIsFinal = a.variant_type === "finalized_resume" ? 1 : 0;
                                  const bIsFinal = b.variant_type === "finalized_resume" ? 1 : 0;
                                  return bIsFinal - aIsFinal;
                                });

                                return (
                                  <div key={parent} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-bold text-lg text-foreground/90 flex items-center gap-2">
                                        <Target className="h-5 w-5 text-primary" /> {parent}
                                      </h4>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-xs h-8 text-primary hover:bg-primary/10"
                                        onClick={() => navigator.clipboard.writeText(sortedBullets.map(b => `• ${b.bullet_text}`).join('\n'))}
                                      >
                                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Section
                                      </Button>
                                    </div>
                                    <ul className="space-y-3">
                                      {sortedBullets.map(bullet => {
                                        const isFinal = bullet.variant_type === "finalized_resume";
                                        return (
                                          <li 
                                            key={bullet.id} 
                                            className={`group relative rounded-xl border transition-all overflow-hidden ${
                                              isFinal 
                                                ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500/70 hover:shadow-md" 
                                                : "border-border/40 bg-background hover:bg-muted/10 hover:border-border/80 hover:shadow-sm"
                                            }`}
                                          >
                                            {editingPointBankBullet === bullet.id ? (
                                              <div className="p-4 flex flex-col gap-3">
                                                <Textarea
                                                  value={editPointBankText}
                                                  onChange={(e) => setEditPointBankText(e.target.value)}
                                                  className="min-h-[100px] w-full text-[15px] resize-none border-primary/40 focus:ring-primary/20"
                                                  autoFocus
                                                />
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                  <span>Length: {editPointBankText.length} chars</span>
                                                  <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingPointBankBullet(null)}>Cancel</Button>
                                                    <Button size="sm" onClick={() => handleSavePointBankEdit(bullet.id)}>Save Edit</Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="p-4 pr-20 flex gap-4 items-start">
                                                <div className={`mt-2 h-2 w-2 rounded-full shrink-0 ${isFinal ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-primary/60"}`}></div>
                                                <div className="flex flex-col gap-1.5 w-full">
                                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    {isFinal ? (
                                                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50 text-[10.5px] font-bold uppercase tracking-wider gap-1">
                                                        <Target className="h-3 w-3" /> Final Resume Point
                                                      </Badge>
                                                    ) : (
                                                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10.5px] font-semibold uppercase tracking-wider gap-1">
                                                        <Sparkles className="h-3 w-3" /> Lab Generated
                                                      </Badge>
                                                    )}
                                                    <span className="text-[11px] text-muted-foreground font-mono">
                                                      {bullet.bullet_text.length} chars
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="text-[15px] leading-relaxed text-foreground/95 font-normal">
                                                    {highlightMetrics(bullet.bullet_text)}
                                                  </div>
                                                  
                                                  {bullet.generation_group_id && (
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/30 px-2 py-0.5 rounded-sm w-fit mt-0.5">
                                                      <Layers className="h-3 w-3" /> Set Generated
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {/* Action Buttons Overlay */}
                                                <div className="absolute right-0 top-0 bottom-0 flex flex-row items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-gradient-to-l from-background via-background to-transparent pl-8 pr-3 md:pr-4">
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(bullet.bullet_text);
                                                      setCopiedBulletId(bullet.id);
                                                      setTimeout(() => setCopiedBulletId(null), 2000);
                                                    }} 
                                                    className={`h-8 w-8 rounded-full shadow-sm transition-all ${
                                                      copiedBulletId === bullet.id 
                                                        ? 'bg-emerald-500/15 text-emerald-600' 
                                                        : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'
                                                    }`} 
                                                    title={copiedBulletId === bullet.id ? "Copied!" : "Copy Bullet Text"}
                                                  >
                                                    {copiedBulletId === bullet.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                  </Button>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => {
                                                      setRefineTarget({ 
                                                        source: "bank", 
                                                        id: bullet.id, 
                                                        text: bullet.bullet_text, 
                                                        role: bullet.target_role,
                                                        isFinalResume: isFinal,
                                                        charLength: bullet.bullet_text.length
                                                      });
                                                      setRefineInstruction("");
                                                      setRefineHistory([]);
                                                    }} 
                                                    className={`h-8 w-8 rounded-full shadow-sm ${isFinal ? 'hover:bg-emerald-500/15 text-emerald-600 hover:text-emerald-700' : 'hover:bg-primary/10 text-primary'}`} 
                                                    title={isFinal ? "AI Refine (Length Locked)" : "Refine with AI"}
                                                  >
                                                    <Sparkles className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => {setEditingPointBankBullet(bullet.id); setEditPointBankText(bullet.bullet_text);}} 
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-full shadow-sm" 
                                                    title="Manual Edit"
                                                  >
                                                    <Edit3 className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => deletePointBankItem(bullet.id)} 
                                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-full shadow-sm"
                                                    title="Delete Point"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                );
                              })}
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
        
        <Dialog open={isStrategyModalOpen} onOpenChange={setIsStrategyModalOpen}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="container py-4 space-y-8">
            
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" /> Resume Strategy Engine
          </h1>
          <p className="text-muted-foreground">Analyze your points against top-tier senior placement standards.</p>
        </div>
      </div>

      {!strategyData ? (
        <Card className="max-w-2xl mx-auto shadow-sm border-primary/20 bg-gradient-to-b from-background to-muted/20">
          <CardHeader>
            <CardTitle>Configure Strategy Run</CardTitle>
            <CardDescription>Select the domain and data source to generate your personalized playbook.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Target Domain</label>
              <Select value={strategyTargetRole} onValueChange={(val) => val && setStrategyTargetRole(val)}>
                <SelectTrigger className="h-12 border-input/60">
                  <SelectValue placeholder="Select target role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulting">Management Consulting</SelectItem>
                  <SelectItem value="finance">Finance (IB/PE/VC)</SelectItem>
                  <SelectItem value="product_management">Product Management</SelectItem>
                  <SelectItem value="analytics">Data Science & Analytics</SelectItem>
                  <SelectItem value="software">Software Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Data Source to Analyze</label>
              <Select value={strategyDataSource} onValueChange={(val) => val && setStrategyDataSource(val)}>
                <SelectTrigger className="h-12 border-input/60">
                  <SelectValue placeholder="Select data source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="point_bank">Point Bank (Only Saved Bullets)</SelectItem>
                  <SelectItem value="vault">Achievement Vault (Raw Data)</SelectItem>
                  <SelectItem value="both">Both (Comprehensive Analysis)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <label className="text-sm font-semibold text-foreground" htmlFor="strategy-jd">Job Description Snippet (Optional)</label>
              <Textarea 
                id="strategy-jd"
                placeholder="Paste key responsibilities or requirements here..."
                value={strategyJobDescription}
                onChange={(e) => setStrategyJobDescription(e.target.value)}
                className="min-h-[100px] border-input/60 bg-muted/5 shadow-sm resize-none"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 shadow-sm font-medium" onClick={generateStrategy} disabled={isStrategyLoading}>
              {isStrategyLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2"/>}
              {isStrategyLoading ? "Analyzing 88+ Benchmark Resumes..." : "Generate Strategy Report"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Header Score & Radar Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 border-primary/20 shadow-sm flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-background text-center">
              <span className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Overall Readiness</span>
              <div className="flex items-end gap-1 justify-center">
                <span className={`text-6xl font-extrabold ${strategyData.overall_readiness_score > 70 ? "text-green-600" : strategyData.overall_readiness_score > 40 ? "text-amber-500" : "text-destructive"}`}>
                  {strategyData.overall_readiness_score}
                </span>
                <span className="text-muted-foreground font-medium mb-2">/100</span>
              </div>
              <p className="text-sm mt-4 text-foreground/80 leading-relaxed font-medium">
                {strategyData.overall_guidance}
              </p>
            </Card>

            {/* Competency Radar */}
            <Card className="col-span-1 md:col-span-2 shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Competency Coverage vs. Domain Ideal
                </CardTitle>
                <CardDescription>How your profile maps to the {getRoleLabel(strategyData.domain)} requirements</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/2 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                      strategyData.competency_coverage?.map((c: any) => ({
                        subject: c.theme.replace(/_/g, " ").replace(/\b\w/g, (l:string) => l.toUpperCase()),
                        A: Math.round(c.user_coverage * 100),
                        B: Math.round(c.domain_weight * 100),
                        fullMark: 100,
                      })) || []
                    }>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{fill: "var(--foreground)", fontSize: 10}} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Your Profile" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.6} />
                      <Radar name="Domain Ideal" dataKey="B" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  {strategyData.competency_coverage?.map((c: any, i: number) => (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold capitalize">{c.theme.replace(/_/g, " ")}</span>
                        <Badge variant={c.user_coverage >= c.domain_weight - 0.05 ? "default" : "secondary"} className="text-[10px]">
                          {Math.round(c.user_coverage * 100)}% / {Math.round(c.domain_weight * 100)}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{c.gap_assessment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Coaching Roadmap */}
          {strategyData.global_coaching_roadmap && strategyData.global_coaching_roadmap.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" /> Prioritized Next-Step Action Roadmap
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strategyData.global_coaching_roadmap.map((item: any, i: number) => (
                  <Card key={i} className="border-border/60 shadow-sm bg-gradient-to-b from-card to-muted/20 hover:border-primary/40 transition-all flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                          Step {item.step_number || i + 1}
                        </Badge>
                        <Badge variant={item.priority === 'critical' ? 'destructive' : item.priority === 'high' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold">
                          {item.priority}
                        </Badge>
                      </div>
                      <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI-Inferred Section Density Targets */}
          {strategyData.section_density_targets && strategyData.section_density_targets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" /> Target Section Density & Balance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategyData.section_density_targets.map((tgt: any, i: number) => (
                  <Card key={i} className="border-border/60 shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm capitalize">{tgt.section}</span>
                      <Badge variant={tgt.status === 'optimal' ? 'default' : tgt.status === 'needs_more' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold">
                        {tgt.status === 'needs_more' ? 'Needs More Points' : tgt.status === 'optimal' ? 'Optimal Balance' : 'Consider Trimming'}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-primary">{tgt.current_count ?? 0}</span>
                      <span className="text-xs text-muted-foreground font-medium">/ target {tgt.target_min}-{tgt.target_max} bullets</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tgt.reasoning}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Phrasing Alerts */}
          {strategyData.phrasing_alerts && strategyData.phrasing_alerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Phrasing & Structural Alerts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategyData.phrasing_alerts.map((alert: any, i: number) => (
                  <Card key={i} className="border-amber-500/30 bg-amber-500/5 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 uppercase text-[10px]">
                          {alert.issue.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{alert.detail}</p>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full text-xs h-8"
                        onClick={() => handleStrategyRefine(alert.point_id, alert.refine_instruction)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> Fix with AI Refine
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section Analysis */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Section-by-Section Playbook
            </h3>
            
            <div className="space-y-6">
              {strategyData.section_analysis?.map((section: any, i: number) => (
                <Card key={i} className="shadow-sm overflow-hidden">
                  <div className={`h-1.5 w-full ${section.priority_level === 'critical' ? 'bg-destructive' : section.priority_level === 'high' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <CardHeader className="pb-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{section.section}</CardTitle>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-bold">
                        Priority: {section.priority_level}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm font-medium text-foreground/80 bg-background/50 p-3 rounded-md border mt-2">
                      {section.domain_guidance}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {section.user_points && section.user_points.length > 0 ? (
                      <div className="divide-y">
                        {section.user_points.map((pt: any, j: number) => (
                          <div key={j} className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start hover:bg-muted/10 transition-colors">
                            <div className="md:w-[100px] shrink-0 mt-1">
                              {pt.verdict === 'keep' ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-300 w-full justify-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Keep
                                </Badge>
                              ) : pt.verdict === 'cut' ? (
                                <Badge variant="destructive" className="w-full justify-center">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Cut
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 w-full justify-center">
                                  <RefreshCw className="h-3 w-3 mr-1" /> Rework
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-sm leading-relaxed">{pt.bullet_text}</p>
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md">
                                <span className="font-semibold text-foreground">Reasoning:</span> {pt.reasoning}
                              </p>
                            </div>
                            {pt.verdict === 'needs_rework' && pt.refine_instruction && (
                              <div className="shrink-0 w-full md:w-auto">
                                <Button size="sm" variant="outline" className="w-full whitespace-nowrap" onClick={() => handleStrategyRefine(pt.point_id, pt.refine_instruction, section.section)}>
                                  <Sparkles className="h-3 w-3 mr-2" /> Fix with AI
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No points found in this section.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center pt-8 pb-12">
            <Button variant="outline" size="lg" onClick={() => setStrategyData(null)} className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Run Strategy Again
            </Button>
          </div>
        </div>
      )}
    
          </div>
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

      {/* Final Resume Extraction Success Dialog */}
      <Dialog open={!!finalResumeExtractionSuccessData} onOpenChange={(open) => !open && setFinalResumeExtractionSuccessData(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl">
          <div className="p-6 pb-4 border-b bg-emerald-50 dark:bg-emerald-950/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                Extraction Complete!
              </DialogTitle>
              <DialogDescription className="text-[15px] pt-2 text-foreground/80">
                We successfully extracted and saved <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{finalResumeExtractionSuccessData?.saved_bullets_count}</strong> finalized resume points across <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{finalResumeExtractionSuccessData?.extracted_sections}</strong> sections into your Point Bank!
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-muted/10 flex flex-col items-center justify-center text-center">
             <Target className="h-16 w-16 text-emerald-500/20 mb-4" />
             <p className="text-sm text-muted-foreground max-w-sm">
                These points are now permanently locked in length and pinned to the top of your Point Bank for easy access.
             </p>
          </div>
          
          <div className="p-4 border-t bg-background flex justify-end">
            <Button onClick={() => setFinalResumeExtractionSuccessData(null)} className="w-full sm:w-auto font-medium px-8 bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">Awesome!</Button>
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

      {/* Upload Finalized Resume Modal for Point Bank */}
      <Dialog open={isFinalResumeModalOpen} onOpenChange={setIsFinalResumeModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <UploadCloud className="h-6 w-6 text-emerald-600" /> Upload Finalized Resume
            </DialogTitle>
            <DialogDescription className="text-sm">
              Upload your finalized domain resume (PDF or text/LaTeX). All points will be extracted directly into your Point Bank and tagged on top.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFinalResumeUpload} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Target Domain</label>
              <Select value={finalResumeUploadRole} onValueChange={(v) => v && setFinalResumeUploadRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target domain" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ROLE_LABELS).map((key) => (
                    <SelectItem key={key} value={key}>{ROLE_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex p-1 bg-muted/40 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setFinalResumeUploadMode("pdf")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  finalResumeUploadMode === "pdf" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload PDF Resume
              </button>
              <button
                type="button"
                onClick={() => setFinalResumeUploadMode("text")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  finalResumeUploadMode === "text" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paste LaTeX / Text
              </button>
            </div>

            {finalResumeUploadMode === "pdf" ? (
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors bg-muted/5">
                <input
                  type="file"
                  id="final-resume-file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFinalResumeFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="final-resume-file" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-10 w-10 text-emerald-600/70" />
                  <span className="text-sm font-semibold text-foreground">
                    {finalResumeFile ? finalResumeFile.name : "Click to select your finalized PDF"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Supports 1-page standard placement PDF resumes
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Paste Resume LaTeX or Plain Text:</label>
                <Textarea
                  placeholder="Paste your section headings and bullet points here..."
                  value={finalResumeText}
                  onChange={(e) => setFinalResumeText(e.target.value)}
                  className="min-h-[160px] text-xs font-mono"
                />
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsFinalResumeModalOpen(false)} disabled={isExtractingFinalResume}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={isExtractingFinalResume}>
                {isExtractingFinalResume ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting Points...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Extract to Point Bank</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Domain Pivot Configuration Modal */}
      <Dialog open={isDomainPivotModalOpen} onOpenChange={setIsDomainPivotModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <RefreshCw className="h-5 w-5 text-primary" /> Cross-Domain Resume Pivot Engine
            </DialogTitle>
            <DialogDescription className="text-sm">
              Reframe your finalized resume points into another target industry in one pass. Point lengths are strictly preserved for your 1-page template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Source Domain Indicator */}
            <div className="p-3 bg-muted/30 border rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Source Resume Domain</span>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {getRoleLabel(pivotSourceRole)}
                </div>
              </div>
              <Badge variant="outline" className="bg-background text-primary border-primary/30 font-semibold">
                Source Domain
              </Badge>
            </div>

            {/* Target Domain Selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" /> Target Domain to Pivot Into
              </label>
              <Select value={pivotTargetRole} onValueChange={(v) => v && setPivotTargetRole(v)}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select target domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS
                    .filter(d => d.value.toLowerCase() !== pivotSourceRole.toLowerCase())
                    .map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Company Focus (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Target Company Focus <span className="text-xs text-muted-foreground font-normal">(Optional)</span></span>
              </label>
              <Input
                placeholder="e.g. Google, McKinsey, Goldman Sachs, Microsoft"
                value={pivotTargetCompany}
                onChange={(e) => setPivotTargetCompany(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Sections to Include Checkboxes */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Sections to Convert</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sourceBullets = pointBank.filter(b => getRoleLabel(b.target_role) === getRoleLabel(pivotSourceRole));
                      const allSecs = Array.from(new Set(sourceBullets.map(b => {
                        const ach = achievements.find(a => a.id === b.achievement_id);
                        return resolveBulletSectionType(b, ach);
                      })));
                      setPivotSelectedSections(allSecs);
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-xs text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() => setPivotSelectedSections([])}
                    className="text-xs font-semibold text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {(() => {
                const sourceBullets = pointBank.filter(b => getRoleLabel(b.target_role) === getRoleLabel(pivotSourceRole));
                const availableSections = Array.from(new Set(sourceBullets.map(b => {
                  const ach = achievements.find(a => a.id === b.achievement_id);
                  return resolveBulletSectionType(b, ach);
                })));

                if (availableSections.length === 0) {
                  return (
                    <div className="text-xs text-muted-foreground p-3 border rounded-lg bg-muted/10">
                      No saved sections found for {getRoleLabel(pivotSourceRole)}. Upload a finalized resume first.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/15 border rounded-xl">
                    {availableSections.map(sec => {
                      const count = sourceBullets.filter(b => {
                        const ach = achievements.find(a => a.id === b.achievement_id);
                        return resolveBulletSectionType(b, ach) === sec;
                      }).length;
                      const checked = pivotSelectedSections.includes(sec);


                      return (
                        <label key={sec} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-background/80 transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPivotSelectedSections(prev => [...prev, sec]);
                              } else {
                                setPivotSelectedSections(prev => prev.filter(s => s !== sec));
                              }
                            }}
                            className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-foreground">{sec}</span>
                          <span className="text-muted-foreground font-mono">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDomainPivotModalOpen(false)} disabled={isPivotConverting}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleRunDomainPivot} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                disabled={isPivotConverting || pivotSelectedSections.length === 0}
              >
                {isPivotConverting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Converting Resume...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Convert to {getRoleLabel(pivotTargetRole)}</>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refine Bullet Dialog */}
      <Dialog open={!!refineTarget} onOpenChange={(open) => !open && setRefineTarget(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary text-xl">
              <Sparkles className="h-5 w-5" /> Refine Point with AI
            </DialogTitle>
            <DialogDescription>
              Provide instructions to edit this point (e.g., "Make it punchier", "Focus on cross-functional leadership", "Front-load metric").
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {refineTarget?.isFinalResume && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-bold">Strict 1-Page Length Lock Active:</span>
                  <p className="mt-0.5 leading-relaxed">
                    This point is from your finalized resume ({refineTarget.charLength || refineTarget.text.length} chars). 
                    The AI will strictly match this character length to prevent line-wrapping in your 1-page template.
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/20 border rounded-lg text-sm leading-relaxed text-foreground/90 font-medium">
              {refineTarget?.text}
            </div>
            
            {refineHistory.map((item, idx) => (
              <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
                <div className="flex justify-end mb-2">
                  <div className="bg-muted p-3 rounded-xl rounded-tr-none text-sm text-foreground max-w-[80%] whitespace-pre-wrap">
                    {item.instruction}
                  </div>
                </div>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm leading-relaxed text-foreground font-medium relative">
                  <div className="absolute top-0 right-0 p-1 px-2 bg-primary/20 text-primary text-[10px] uppercase font-bold rounded-bl-lg rounded-tr-lg">New</div>
                  {item.result}
                </div>
                <div className="flex justify-between items-center text-[11.5px] text-muted-foreground px-1">
                  <span>Length: {item.result.length} characters</span>
                  {refineTarget?.charLength && (
                    <span className={`font-mono font-medium ${Math.abs(item.result.length - refineTarget.charLength) <= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                      {item.result.length === refineTarget.charLength 
                        ? "Exact Match (0 char diff)" 
                        : item.result.length > refineTarget.charLength 
                          ? `+${item.result.length - refineTarget.charLength} chars` 
                          : `-${refineTarget.charLength - item.result.length} chars`}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/30 p-2 rounded">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{item.explanation}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t mt-auto">
            <form onSubmit={handleRefineSubmit} className="space-y-3">
              <Textarea 
                placeholder="Your instructions (e.g., Emphasize latency reduction)..." 
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                className="min-h-[80px]"
                disabled={isRefining}
              />
              <Button type="submit" className="w-full" disabled={isRefining || !refineInstruction.trim()}>
                {isRefining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Refining...</> : <><Sparkles className="h-4 w-4 mr-2" /> Send to AI Coach</>}
              </Button>
            </form>
          </div>
          
          {refineHistory.length > 0 && (
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button type="button" variant="outline" onClick={() => { setRefineHistory([]); setRefineInstruction(""); }}>
                Reset Chat
              </Button>
              <Button type="button" onClick={acceptRefinement}>
                Accept & Save Latest
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title={paywallMeta.title}
        description={paywallMeta.description}
        limit={paywallMeta.limit}
        used={paywallMeta.used}
        resetAt={paywallMeta.resetAt}
      />
      </div>
    </div>
  )
}

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center p-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ResumeBuilderPageContent />
    </Suspense>
  )
}
