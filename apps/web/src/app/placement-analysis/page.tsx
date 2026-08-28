"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CommandNav,
  CommandHero,
  KpiMetricCard,
  KpiMetricGrid,
  SegmentedTabs,
  FilterPills,
} from "@/components/shared"
import {
  Building2,
  Search,
  SlidersHorizontal,
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingUp,
  Briefcase,
  DollarSign,
  Globe,
  CheckCircle2,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Award,
  BookOpen,
  HelpCircle,
  Clock,
  MapPin,
  FileText,
  Compass,
  ArrowUpRight,
  X,
  Check,
  Zap,
  Filter,
  Users,
  Grid,
  List,
  Flame,
  ArrowLeft,
  Key,
  UserPlus,
  UserX,
  Copy,
  Plus,
  Code,
  Wrench,
  BrainCircuit,
  Target,
  BarChart3,
  CheckSquare,
  Scale,
  Percent,
  Calculator,
  FileCheck,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Printer,
  Share2,
  PieChart,
  Calendar,
  Send,
  Trash2,
  Edit3,
  Kanban
} from "lucide-react"

// Types
interface Compensation {
  original_currency: string
  ctc_min: number
  ctc_max: number
  ctc_median: number
  inhand_median: number
  ctc_inr_equivalent: number
  inhand_inr_equivalent: number
  is_international: boolean
}

interface CategorizedKeywords {
  all: string[]
  languages: string[]
  frameworks_and_tools: string[]
  core_concepts: string[]
  leadership: string[]
}

interface RoleIntelligence {
  difficulty_score: number
  difficulty_tier: string
  key_selection_hurdle: string
  resume_power_tip: string
  topic_weightage: {
    dsa_and_problem_solving: number
    system_and_domain_design: number
    case_and_business_sense: number
    resume_and_leadership_fit: number
  }
}

interface RoleOffer {
  id: string
  job_title: string
  primary_sector: string
  raw_job_sector?: string
  session_sheet: string
  session_label: string
  ctc_inr: number
  inhand_inr: number
  currency: string
  is_international: boolean
  location: string
  category_tier?: string
  selection_rounds_count: number
  required_skills: string[]
}

interface PlacementRole {
  id: string
  company_name: string
  company_slug: string
  job_title: string
  session_sheet: string
  session_label: string
  primary_sector: string
  raw_job_sector: string
  location: string
  category_tier: string
  currency: string
  compensation: Compensation
  role_summary: string
  required_skills: string[]
  categorized_keywords?: CategorizedKeywords
  responsibilities: string[]
  selection_rounds: string[]
  perks_and_benefits: string[]
  additional_info_raw: string
  raw_jd: string
  intelligence?: RoleIntelligence
}

interface SelectionInsights {
  matched_company_name: string
  domain: string
  test_details: string
  interview_details: string
  questions_asked: string[]
  recommended_electives_projects: string[]
}

interface Company {
  id: string
  name: string
  slug: string
  primary_sector: string
  tier_category: string
  is_hiring_24_25: boolean
  is_hiring_25_26: boolean
  has_phase_1?: boolean
  has_phase_2?: boolean
  has_24_25?: boolean
  roles_count: number
  available_roles?: string[]
  highest_ctc_inr: number
  highest_inhand_inr: number
  display_highest_ctc_inr?: number
  display_highest_inhand_inr?: number
  sector_roles_count?: number
  role_offers?: RoleOffer[]
  median_ctc_inr: number
  dominant_currency: string
  has_international_offers: boolean
  locations: string[]
  top_skills?: string[]
  roles: string[]
  selection_insights: SelectionInsights | null
  has_authentic_insights?: boolean
  selection_blueprint?: {
    has_authentic_student_data: boolean
    online_test_details: string
    interview_details: string
    questions_asked: string[]
    recommended_electives_projects: string[]
  }
  hiring_funnel_intelligence?: HiringFunnelIntelligence | null
  placement_slot?: string | null
  slot_timing?: string | null
  has_assignment_deck_round?: boolean
  assignment_details?: string | null
  has_group_discussion?: boolean
  gd_details?: string | null
  bond_applicable?: boolean | null
  bond_details?: string | null
  ai_overview: string
  difficulty_score?: number
  difficulty_tier?: string
}

interface HiringFunnelIntelligence {
  slug: string
  company_name: string
  total_updates: number
  hiring_phases: string[]
  slots_recorded: string[]
  has_walkins: boolean
  placement_slot?: string | null
  slot_timing?: string | null
  has_assignment_deck_round?: boolean
  assignment_details?: string | null
  has_group_discussion?: boolean
  gd_details?: string | null
  bond_applicable?: boolean | null
  bond_details?: string | null
  cpi_criteria: {
    cutoff_stated: string
    bonus_jaf_allowed: boolean
  }
  online_assessment: {
    platform: string
    mode: string
    venue?: string | null
    duration_minutes: number | null
    test_format?: string
    special_instructions: string[]
  }
  conversion_funnel: {
    oa_shortlisted_count: number
    interview_shortlisted_count: number
    final_selected_count: number
    walkin_extended_shortlists_count: number
    oa_to_interview_conversion_pct: number | null
    interview_to_offer_conversion_pct: number | null
  }
  demographics: {
    branch_distribution: Record<string, number>
    degree_distribution: Record<string, number>
    cluster_breakdown: Record<string, number>
  }
  recruitment_timeline: Array<{
    date: string
    phase?: string
    stage: string
    headline: string
  }>
}

interface PlatformStats {
  total_companies: number
  total_roles: number
  highest_ctc_inr: number
  median_ctc_inr: number
  international_offers_count: number
  sectors_breakdown: Record<string, {
    companies_count: number
    roles_count: number
    median_ctc_inr: number
    highest_ctc_inr: number
  }>
}

interface WhitelistedUser {
  email: string
  role: string
  notes?: string
  granted_at?: string
  granted_by?: string
}

interface ResumeMatchResult {
  match_score: number
  match_rating: string
  matched_skills: string[]
  missing_critical_skills: string[]
  tailored_resume_bullets: string[]
}

interface SalaryBreakdownResult {
  ctc_inr: number
  base_pay_annual: number
  variable_bonus_annual: number
  esops_annual: number
  estimated_monthly_gross: number
  estimated_monthly_net_inhand: number
  estimated_annual_tax: number
  estimated_annual_epf: number
  vesting_schedule: string
}

// CRM Item
type CRMMilestone = 
  | "interested"
  | "jaf_filled"
  | "oa_submitted"
  | "interview_shortlisted"
  | "offer_received"

interface CRMCompanyItem {
  slug: string
  company_name: string
  sector: string
  tier: string
  highest_ctc_inr: number
  priority: "dream" | "target" | "backup"
  milestone: CRMMilestone
  notes: string
  added_at: string
}

const MILESTONE_CONFIG: Record<CRMMilestone, { label: string; badgeClass: string; icon: string }> = {
  interested: { label: "Interested", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: "📌" },
  jaf_filled: { label: "JAF Filled", badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", icon: "📝" },
  oa_submitted: { label: "OA / Test Submitted", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: "⚡" },
  interview_shortlisted: { label: "Interview Shortlist", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: "🎯" },
  offer_received: { label: "Offer Received", badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 font-bold", icon: "🏆" }
}

const SECTOR_TABS = [
  "All Sectors",
  "Product Management",
  "Software & Engineering",
  "Finance & Quant",
  "Consulting & Strategy",
  "AI, ML & Data Science",
  "Core Engineering & Technology",
  "FMCG & Operations",
  "Design & UI/UX"
]

const POPULAR_SKILLS = [
  "All Skills",
  "Product Roadmap",
  "PRD Writing",
  "A/B Testing",
  "Python",
  "C++",
  "Low-Latency",
  "Distributed Systems",
  "PyTorch",
  "System Design",
  "SQL",
  "Statistical Arbitrage",
  "Guesstimates",
  "Kafka",
  "Docker",
  "VLSI Design"
]

const DAY_SLOT_OPTIONS = [
  "All Slots",
  "Day 1.1",
  "Day 1.2",
  "Day 2",
  "Day 3–5",
  "Day 6+"
]

export default function PlacementAnalysisPage() {
  const router = useRouter()
  const { user, setTargetCompany } = useAuthStore()

  // Top Section Switcher
  const [activeMainTab, setActiveMainTab] = useState<"directory" | "crm" | "analytics">("directory")

  // Authorization state
  const [isIITBVerified, setIsIITBVerified] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationOtp, setVerificationOtp] = useState("")
  const [invitePasscode, setInvitePasscode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [showInviteField, setShowInviteField] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [verifying, setVerifying] = useState(false)

  // Admin Modal & Management State
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminUsers, setAdminUsers] = useState<WhitelistedUser[]>([])
  const [adminInviteCodes, setAdminInviteCodes] = useState<string[]>([])
  const [newGrantEmail, setNewGrantEmail] = useState("")
  const [newGrantNotes, setNewGrantNotes] = useState("")
  const [adminActionLoading, setAdminActionLoading] = useState(false)
  const [adminActionMsg, setAdminActionMsg] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Data states
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Macro Trends Analytics state
  const [macroAnalytics, setMacroAnalytics] = useState<any | null>(null)
  const [loadingMacro, setLoadingMacro] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSector, setSelectedSector] = useState("All Sectors")
  const [selectedSkill, setSelectedSkill] = useState("All Skills")
  const [selectedSession, setSelectedSession] = useState<"all" | "25-26_p1" | "25-26_p2" | "25-26" | "24-25">("all")
  const [selectedTier, setSelectedTier] = useState<"all" | "C1" | "C2" | "C3">("all")
  const [selectedDaySlot, setSelectedDaySlot] = useState<string>("All Slots")
  const [isInternationalOnly, setIsInternationalOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"highest_ctc" | "median_ctc" | "roles_count" | "name">("highest_ctc")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Selected Company Dossier Modal
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string | null>(null)
  const [companyDetails, setCompanyDetails] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeDossierTab, setActiveDossierTab] = useState<"roles" | "keywords" | "resumematch" | "selection" | "roadmap">("roles")
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0)

  // Comparison State
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [comparisonData, setComparisonData] = useState<any | null>(null)
  const [loadingComparison, setLoadingComparison] = useState(false)

  // Resume Matcher State
  const [customResumeText, setCustomResumeText] = useState("")
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(null)
  const [matchingResume, setMatchingResume] = useState(false)
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null)
  const [copiedJd, setCopiedJd] = useState(false)
  const [isJdExpanded, setIsJdExpanded] = useState(false)

  // Salary Breakdown State
  const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdownResult | null>(null)
  const [loadingSalary, setLoadingSalary] = useState(false)

  // CRM State
  const [crmItems, setCrmItems] = useState<CRMCompanyItem[]>([])
  const [crmFilterMilestone, setCrmFilterMilestone] = useState<string>("all")
  const [editingNotesSlug, setEditingNotesSlug] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState("")

  // Load CRM state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iitb_placement_crm_items")
      if (saved) {
        setCrmItems(JSON.parse(saved))
      }
    } catch (err) {
      console.error("Failed to load CRM items from localStorage", err)
    }
  }, [])

  // Save CRM state to localStorage
  const saveCrmItems = (items: CRMCompanyItem[]) => {
    setCrmItems(items)
    try {
      localStorage.setItem("iitb_placement_crm_items", JSON.stringify(items))
    } catch (err) {
      console.error("Failed to save CRM items", err)
    }
  }

  // Toggle Bookmark / Add to CRM
  const handleToggleCRM = (comp: Company, priority: "dream" | "target" | "backup" = "target") => {
    const existing = crmItems.find((x) => x.slug === comp.slug)
    if (existing) {
      const updated = crmItems.filter((x) => x.slug !== comp.slug)
      saveCrmItems(updated)
    } else {
      const effectiveCTC = comp.display_highest_ctc_inr || comp.highest_ctc_inr
      const newItem: CRMCompanyItem = {
        slug: comp.slug,
        company_name: comp.name,
        sector: comp.primary_sector,
        tier: comp.tier_category,
        highest_ctc_inr: effectiveCTC,
        priority: priority,
        milestone: "interested",
        notes: "",
        added_at: new Date().toISOString()
      }
      saveCrmItems([newItem, ...crmItems])
    }
  }

  // Update CRM Milestone
  const handleUpdateCRMMilestone = (slug: string, milestone: CRMMilestone) => {
    const updated = crmItems.map((item) => {
      if (item.slug === slug) {
        return { ...item, milestone }
      }
      return item
    })
    saveCrmItems(updated)
  }

  // Update CRM Notes
  const handleSaveCRMNotes = (slug: string) => {
    const updated = crmItems.map((item) => {
      if (item.slug === slug) {
        return { ...item, notes: tempNotes }
      }
      return item
    })
    saveCrmItems(updated)
    setEditingNotesSlug(null)
  }

  // Check IITB verification from user profile / localStorage
  useEffect(() => {
    const checkAuth = () => {
      if (user?.email) {
        const email = user.email.toLowerCase()
        if (email === "krishnagahlod@gmail.com" || email === "creator@internprep.ai" || email.includes("admin")) {
          setIsIITBVerified(true)
          setIsAdmin(true)
          return
        }
      }

      const savedAdmin = localStorage.getItem("iitb_placement_admin")
      const savedVerification = localStorage.getItem("iitb_placement_verified")
      if (savedAdmin === "true") {
        setIsIITBVerified(true)
        setIsAdmin(true)
        return
      }
      if (savedVerification === "true") {
        setIsIITBVerified(true)
        return
      }

      setIsIITBVerified(false)
    }

    checkAuth()
  }, [user])

  // Deterministic in-hand monthly salary extractor / calculator
  const getSalaryBreakdownForRole = (role: any): SalaryBreakdownResult | null => {
    if (!role) return null
    const ctc = role.compensation?.ctc_inr_equivalent || 0
    const sb = role.compensation?.salary_breakdown
    if (sb) {
      return {
        ctc_inr: sb.ctc_inr || ctc,
        base_pay_annual: sb.base_annual_inr || Math.round(ctc * 0.7),
        variable_bonus_annual: sb.variable_annual_inr || 0,
        esops_annual: sb.esop_annual_inr || 0,
        estimated_monthly_gross: sb.monthly_gross_inr || Math.round((sb.base_annual_inr || ctc * 0.7) / 12),
        estimated_monthly_net_inhand: sb.monthly_inhand_inr || Math.round((ctc * 0.65) / 12),
        estimated_annual_tax: sb.annual_tax_inr || 0,
        estimated_annual_epf: sb.annual_epf_inr || 21600,
        vesting_schedule: "Standard 4-year equal vesting with 1-year cliff"
      }
    }
    const base = role.compensation?.inhand_inr_equivalent > 0 ? role.compensation.inhand_inr_equivalent : Math.round(ctc * 0.70)
    const monthlyNet = Math.round(base * 0.85 / 12)
    return {
      ctc_inr: ctc,
      base_pay_annual: base,
      variable_bonus_annual: Math.round(ctc * 0.15),
      esops_annual: Math.max(0, ctc - base - Math.round(ctc * 0.15)),
      estimated_monthly_gross: Math.round(base / 12),
      estimated_monthly_net_inhand: monthlyNet,
      estimated_annual_tax: Math.round(base * 0.15),
      estimated_annual_epf: 21600,
      vesting_schedule: "Standard 4-year equal vesting with 1-year cliff"
    }
  }

  // Fetch placement data from API (Single initial load, filtered instantly in client memory)
  const fetchPlacementData = async () => {
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const statsRes = await fetch(`${API_URL}/placement-analysis/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      const companiesRes = await fetch(`${API_URL}/placement-analysis/companies?page=1&page_size=1000&sort_by=highest_ctc`)
      if (!companiesRes.ok) throw new Error("Failed to load placement companies.")
      
      const compData = await companiesRes.json()
      setCompanies(compData.companies || [])
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError("Unable to connect to placement intelligence server.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch Macro Analytics
  const fetchMacroAnalytics = async () => {
    setLoadingMacro(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/analytics/macro-trends`)
      if (res.ok) {
        const data = await res.json()
        setMacroAnalytics(data)
      }
    } catch (err) {
      console.error("Failed to load macro analytics", err)
    } finally {
      setLoadingMacro(false)
    }
  }

  // Initial fetch on verified status - no re-fetching on filter toggles!
  useEffect(() => {
    if (isIITBVerified && companies.length === 0) {
      fetchPlacementData()
    }
    if (isIITBVerified && activeMainTab === "analytics" && !macroAnalytics) {
      fetchMacroAnalytics()
    }
  }, [isIITBVerified, activeMainTab])

  // Fetch Company Dossier when modal opens
  useEffect(() => {
    if (!selectedCompanySlug) {
      setCompanyDetails(null)
      setMatchResult(null)
      setSalaryBreakdown(null)
      return
    }

    const fetchDetails = async () => {
      setLoadingDetails(true)
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const res = await fetch(`${API_URL}/placement-analysis/company/${selectedCompanySlug}`)
        if (res.ok) {
          const data = await res.json()
          setCompanyDetails(data)
          setSelectedRoleIndex(0)
          
          if (data.roles && data.roles[0]) {
            setSalaryBreakdown(getSalaryBreakdownForRole(data.roles[0]))
          }
        }
      } catch (err) {
        console.error("Error fetching company details:", err)
      } finally {
        setLoadingDetails(false)
      }
    }

    fetchDetails()
  }, [selectedCompanySlug])

  // Instant Salary Breakdown for selected role without network lag
  const fetchSalaryBreakdown = (roleId: string) => {
    if (companyDetails?.roles) {
      const targetRole = companyDetails.roles.find((r: any) => r.id === roleId) || companyDetails.roles[0]
      if (targetRole) {
        setSalaryBreakdown(getSalaryBreakdownForRole(targetRole))
        return
      }
    }
  }

  // Handle Resume Matching
  const handleMatchResume = async (roleId: string) => {
    setMatchingResume(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/match-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: roleId,
          resume_text: customResumeText.trim() || "Designed and optimized scalable systems with Python, C++, SQL, Kafka, Docker and A/B testing."
        })
      })
      if (res.ok) {
        const data = await res.json()
        setMatchResult(data)
      }
    } catch (err) {
      console.error("Failed to match resume:", err)
    } finally {
      setMatchingResume(false)
    }
  }

  // Handle Compare Toggle
  const handleToggleCompare = (slug: string) => {
    setComparedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug)
      } else {
        if (prev.length >= 3) return prev
        return [...prev, slug]
      }
    })
  }

  // Open Comparison Modal
  const handleOpenComparison = async () => {
    if (comparedSlugs.length < 2) return
    setLoadingComparison(true)
    setShowCompareModal(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/compare?slugs=${comparedSlugs.join(",")}`)
      if (res.ok) {
        const data = await res.json()
        setComparisonData(data)
      }
    } catch (err) {
      console.error("Failed to load comparison data:", err)
    } finally {
      setLoadingComparison(false)
    }
  }

  // Fetch Admin Users list
  const fetchAdminData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const adminKey = user?.email || "krishnagahlod@gmail.com"
      const res = await fetch(`${API_URL}/placement-analysis/admin/users?admin_key=${encodeURIComponent(adminKey)}`)
      if (res.ok) {
        const data = await res.json()
        setAdminUsers(data.whitelisted_users || [])
        setAdminInviteCodes(data.invite_codes || [])
      }
    } catch (err) {
      console.error("Failed to load admin data:", err)
    }
  }

  useEffect(() => {
    if (showAdminModal && isAdmin) {
      fetchAdminData()
    }
  }, [showAdminModal, isAdmin])

  // Verification Handlers
  const handleSendOTP = async () => {
    setVerificationError("")
    const email = verificationEmail.trim().toLowerCase()
    if (!email) {
      setVerificationError("Please enter your IIT Bombay email address.")
      return
    }

    setVerifying(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/verify-iitb-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send_otp" })
      })
      const data = await res.json()
      if (res.ok) {
        setOtpSent(true)
        if (data.demo_code) {
          setVerificationOtp(data.demo_code)
        }
        if (data.is_admin) {
          setIsAdmin(true)
        }
      } else {
        setVerificationError(data.detail || "Failed to send verification code.")
      }
    } catch (err) {
      setVerificationError("Verification service temporarily unavailable.")
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyOTP = async () => {
    setVerificationError("")
    if (!verificationOtp.trim()) {
      setVerificationError("Please enter the 6-digit verification code.")
      return
    }

    setVerifying(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/verify-iitb-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationEmail.trim().toLowerCase(),
          otp: verificationOtp.trim(),
          action: "verify_otp"
        })
      })
      const data = await res.json()
      if (res.ok && data.is_iitb_verified) {
        localStorage.setItem("iitb_placement_verified", "true")
        localStorage.setItem("iitb_verified_email", verificationEmail.trim().toLowerCase())
        if (data.is_admin || verificationEmail.includes("admin") || verificationEmail === "krishnagahlod@gmail.com") {
          localStorage.setItem("iitb_placement_admin", "true")
          setIsAdmin(true)
        }
        setIsIITBVerified(true)
      } else {
        setVerificationError(data.detail || "Invalid code. Please try again.")
      }
    } catch (err) {
      setVerificationError("Failed to verify code. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  // Redeem Invite / Admin Key
  const handleRedeemInviteOrAdmin = async () => {
    setVerificationError("")
    const code = invitePasscode.trim()
    if (!code) {
      setVerificationError("Please enter an invite code or admin master key.")
      return
    }

    setVerifying(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/redeem-invite-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (res.ok && data.is_iitb_verified) {
        localStorage.setItem("iitb_placement_verified", "true")
        localStorage.setItem("iitb_verified_email", data.email)
        if (data.is_admin || code.toUpperCase().includes("ADMIN")) {
          localStorage.setItem("iitb_placement_admin", "true")
          setIsAdmin(true)
        }
        setIsIITBVerified(true)
      } else {
        setVerificationError(data.detail || "Invalid code. Please check and try again.")
      }
    } catch (err) {
      setVerificationError("Verification service temporarily unavailable.")
    } finally {
      setVerifying(false)
    }
  }

  // Admin Actions: Grant Access
  const handleAdminGrantAccess = async () => {
    if (!newGrantEmail.trim() || !newGrantEmail.includes("@")) {
      setAdminActionMsg("Please enter a valid email address.")
      return
    }

    setAdminActionLoading(true)
    setAdminActionMsg("")
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const adminKey = user?.email || "krishnagahlod@gmail.com"
      const res = await fetch(`${API_URL}/placement-analysis/admin/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email_or_key: adminKey,
          target_email: newGrantEmail.trim().toLowerCase(),
          notes: newGrantNotes.trim() || "Granted by Admin"
        })
      })
      const data = await res.json()
      if (res.ok) {
        setAdminActionMsg(`Access granted to ${newGrantEmail}!`)
        setNewGrantEmail("")
        setNewGrantNotes("")
        fetchAdminData()
      } else {
        setAdminActionMsg(data.detail || "Failed to grant access.")
      }
    } catch (err) {
      setAdminActionMsg("Error granting access.")
    } finally {
      setAdminActionLoading(false)
    }
  }

  // Admin Actions: Revoke Access
  const handleAdminRevokeAccess = async (targetEmail: string) => {
    setAdminActionLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const adminKey = user?.email || "krishnagahlod@gmail.com"
      const res = await fetch(`${API_URL}/placement-analysis/admin/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email_or_key: adminKey,
          target_email: targetEmail
        })
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdminActionLoading(false)
    }
  }

  // Admin Actions: Generate Invite Code
  const handleAdminGenerateCode = async () => {
    setAdminActionLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const adminKey = user?.email || "krishnagahlod@gmail.com"
      const res = await fetch(`${API_URL}/placement-analysis/admin/create-invite-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email_or_key: adminKey })
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdminActionLoading(false)
    }
  }

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Copy Bullet Point
  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedBulletIdx(idx)
    setTimeout(() => setCopiedBulletIdx(null), 2000)
  }

  // 1-Click Printable / Shareable PDF Export
  const handlePrintDossierPDF = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  // Format INR Currency
  const formatINRAmount = (amt: number) => {
    if (!amt || amt <= 0) return "N/A"
    if (amt >= 10000000) {
      return `₹${(amt / 10000000).toFixed(2)} Cr`
    } else {
      return `₹${(amt / 100000).toFixed(1)} LPA`
    }
  }

  // Format Original Currency
  const formatOriginalSalary = (role: PlacementRole) => {
    const comp = role.compensation
    const curr = comp.original_currency
    const med = comp.ctc_median
    if (!med || med <= 0) return "Not Disclosed"

    if (curr === "INR") {
      return formatINRAmount(med)
    } else if (curr === "USD") {
      return `$${med.toLocaleString()} USD`
    } else if (curr === "JPY") {
      return `¥${(med / 1000000).toFixed(2)}M JPY`
    } else if (curr === "EUR") {
      return `€${med.toLocaleString()} EUR`
    } else if (curr === "GBP") {
      return `£${med.toLocaleString()} GBP`
    } else if (curr === "SGD") {
      return `S$${med.toLocaleString()} SGD`
    } else if (curr === "AED") {
      return `${med.toLocaleString()} AED`
    }
    return `${med.toLocaleString()} ${curr}`
  }

  // Filtered & Sorted Companies (100% Client-Side Instant Evaluation)
  const filteredCompanies = useMemo(() => {
    const list = companies.filter((c) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
        const matchSector = c.primary_sector.toLowerCase().includes(q)
        const matchLoc = c.locations?.some((l) => l.toLowerCase().includes(q))
        const matchRole = (c.role_offers || []).some((r) => r.job_title.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)) ||
                          (c.available_roles || []).some((r) => r.toLowerCase().includes(q))
        const matchSkill = c.top_skills?.some((s) => s.toLowerCase().includes(q)) ||
                           (c.role_offers || []).some((r) => r.required_skills?.some((sk) => sk.toLowerCase().includes(q)))
        if (!matchName && !matchSector && !matchLoc && !matchRole && !matchSkill) return false
      }

      // 2. Sector filter (Instant client-side)
      if (selectedSector !== "All Sectors") {
        if (c.primary_sector !== selectedSector && !c.primary_sector.toLowerCase().includes(selectedSector.toLowerCase())) {
          return false
        }
      }

      // 3. Session filter (Instant client-side)
      if (selectedSession !== "all") {
        if (selectedSession === "24-25" && !c.is_hiring_24_25) return false
        if (selectedSession === "25-26" && !c.is_hiring_25_26) return false
        if (selectedSession === "25-26_p1" && !c.is_hiring_25_26) return false
        if (selectedSession === "25-26_p2" && !c.is_hiring_25_26) return false
      }

      // 4. In-Demand Skill filter
      if (selectedSkill !== "All Skills") {
        const sk = selectedSkill.toLowerCase()
        const hasSkill = c.top_skills?.some((s) => s.toLowerCase().includes(sk))
        const inRoleSkills = (c.role_offers || []).some((r) => r.required_skills?.some((rsk) => rsk.toLowerCase().includes(sk)))
        const inOverview = c.ai_overview?.toLowerCase().includes(sk)
        if (!hasSkill && !inRoleSkills && !inOverview) return false
      }

      // 5. Tier filter
      if (selectedTier !== "all") {
        if (!c.tier_category.toUpperCase().includes(selectedTier)) return false
      }

      // 6. International filter
      if (isInternationalOnly && !c.has_international_offers) return false

      // 7. Day Slotting filter
      if (selectedDaySlot !== "All Slots") {
        const slot = (c.placement_slot || c.hiring_funnel_intelligence?.placement_slot || "").toLowerCase()
        if (selectedDaySlot === "Day 1.1" && !slot.includes("day 1.1")) return false
        if (selectedDaySlot === "Day 1.2" && !slot.includes("day 1.2")) return false
        if (selectedDaySlot === "Day 2" && !slot.includes("day 2")) return false
        if (selectedDaySlot === "Day 3–5" && !(slot.includes("day 3") || slot.includes("day 4") || slot.includes("day 5"))) return false
        if (selectedDaySlot === "Day 6+" && !/day\s*(6|7|8|9|10|11|12|13|14|15)/.test(slot)) return false
      }

      return true
    })

    // 7. Sort (Instant client-side)
    return list.sort((a, b) => {
      if (sortBy === "highest_ctc") {
        const aCtc = a.display_highest_ctc_inr || a.highest_ctc_inr || 0
        const bCtc = b.display_highest_ctc_inr || b.highest_ctc_inr || 0
        return bCtc - aCtc
      } else if (sortBy === "median_ctc") {
        return (b.median_ctc_inr || 0) - (a.median_ctc_inr || 0)
      } else if (sortBy === "roles_count") {
        return (b.roles_count || 0) - (a.roles_count || 0)
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [companies, searchQuery, selectedSector, selectedSession, selectedSkill, selectedTier, isInternationalOnly, sortBy])

  // Filtered CRM Items
  const filteredCrmItems = useMemo(() => {
    if (crmFilterMilestone === "all") return crmItems
    return crmItems.filter((item) => item.milestone === crmFilterMilestone)
  }, [crmItems, crmFilterMilestone])

  // Launch Tailored Mock Interview Hand-off
  const handleLaunchMockInterview = async (company: Company, role?: PlacementRole) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const res = await fetch(`${API_URL}/placement-analysis/launch-mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_slug: company.slug,
          role_id: role?.id,
          interview_type: "comprehensive"
        })
      })

      if (res.ok) {
        const blueprint = await res.json()
        setTargetCompany(company.name)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("custom_mock_blueprint", JSON.stringify(blueprint))
        }
        router.push(`/interview?company=${encodeURIComponent(company.name)}&sector=${encodeURIComponent(company.primary_sector)}`)
      }
    } catch (err) {
      console.error("Failed to prepare tailored interview:", err)
      router.push(`/interview?company=${encodeURIComponent(company.name)}`)
    }
  }

  // ---------------------------------------------------------------------------
  // 1. INSTITUTIONAL LOCK SCREEN (IF NOT VERIFIED)
  // ---------------------------------------------------------------------------
  if (!isIITBVerified) {
    return (
      <div className="min-h-screen bg-background relative flex flex-col justify-between selection:bg-primary/20">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

        <CommandNav
          backHref="/dashboard"
          backLabel="Dashboard"
          breadcrumb="PLACEMENT ACCESS GATE"
        />

        <main className="max-w-xl mx-auto w-full my-auto z-10">
          <div className="rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border border-primary/40 shadow-inner mb-6">
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            </div>

            <Badge variant="outline" className="mb-3 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-xs uppercase tracking-wider">
              Private Preview • Invite Only
            </Badge>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-3 font-outfit">
              Placement Analysis & Intelligence
            </h1>

            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              This module is currently in private preview and hidden from general access. Early access is granted directly by the system administrator to authorized candidates.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Admin Master Key or Authorized Invite Passcode
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter admin key or invite passcode"
                    value={invitePasscode}
                    onChange={(e) => setInvitePasscode(e.target.value)}
                    className="pr-10 text-sm font-mono tracking-wider h-11 rounded-xl bg-background/80 border-input focus:border-primary"
                  />
                  <Key className="absolute right-3.5 top-3 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {verificationError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                  {verificationError}
                </div>
              )}

              <Button
                onClick={handleRedeemInviteOrAdmin}
                disabled={verifying || !invitePasscode}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 text-sm"
              >
                {verifying ? "Verifying Access..." : "Unlock Studio with Passcode"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <div className="pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
                Need access? Contact your platform administrator to request early preview credentials.
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-muted-foreground py-4">
          Placement Intelligence Studio • Private Admin Preview
        </footer>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN VERIFIED PLACEMENT ANALYSIS STUDIO
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <CommandNav
        backHref="/dashboard"
        backLabel="Dashboard"
        breadcrumb="PLACEMENT INTELLIGENCE & JAFS"
        actions={
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminModal(true)}
                className="h-8 text-xs font-mono-tech font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 rounded-xl"
              >
                <Key className="h-3.5 w-3.5" /> Admin Console
              </Button>
            )}
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono-tech font-semibold flex items-center gap-1.5 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              IITB Verified
            </Badge>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* HERO & PLATFORM TELEMETRY */}
        <CommandHero
          variant="card"
          watermark="IITB // 2026"
          badge="[CAMPUS RECRUITING & JAF ARCHIVES (2024–2026)]"
          statusBadge={isAdmin ? "ADMIN ACTIVE" : undefined}
          statusVariant="amber"
          badges={
            <>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech text-[10px] font-bold flex items-center gap-1.5 px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                627 VERIFIED RECRUITERS
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-mono-tech text-[10px] font-medium px-2.5 py-0.5">
                PHASE 1 & 2 ARCHIVES
              </Badge>
            </>
          }
          title="Placement Intelligence & Recruiter JAF Vault"
          subtitle="Explore authentic Job Announcement Forms (JAFs), student interview questions, dual-currency compensation benchmarks, and AI preparation roadmaps across 627+ top recruiters."
          actions={
            <div className="p-1 rounded-2xl bg-card border border-border/80 shadow-xs">
              <SegmentedTabs
                tabs={[
                  { id: "directory", label: "Company Directory", icon: Building2 },
                  { id: "crm", label: "Placement CRM", icon: BookmarkCheck, count: crmItems.length },
                  { id: "analytics", label: "Macro Trends", icon: BarChart3 },
                ]}
                activeTab={activeMainTab}
                onChange={(k) => setActiveMainTab(k as "directory" | "crm" | "analytics")}
              />
            </div>
          }
        />

        {/* METRIC COUNTERS GRID */}
        <KpiMetricGrid columns={6}>
          <KpiMetricCard
            label={selectedSector !== "All Sectors" ? "Sector Highest CTC" : "Highest CTC Offer"}
            value={stats?.highest_ctc_inr ? formatINRAmount(stats.highest_ctc_inr) : "₹2.51 Cr"}
            subtext="Dual-Currency Peak"
            icon={Flame}
            badge="Day 1 Peak"
            badgeVariant="amber"
            accentColor="amber"
          />
          <KpiMetricCard
            label={selectedSector !== "All Sectors" ? "Sector Median CTC" : "Median Campus CTC"}
            value={stats?.median_ctc_inr ? formatINRAmount(stats.median_ctc_inr) : "₹18.0 LPA"}
            subtext="IITB Campus Median"
            icon={Award}
            badge="Benchmark"
            badgeVariant="emerald"
            accentColor="emerald"
          />
          <KpiMetricCard
            label={selectedSector !== "All Sectors" ? `${selectedSector} Firms` : "Verified Firms"}
            value={stats ? stats.total_companies : "627+"}
            subtext="Day 1 to Phase 2"
            icon={Building2}
            badge="Directory"
            badgeVariant="blue"
            accentColor="blue"
          />
          <KpiMetricCard
            label={selectedSector !== "All Sectors" ? `${selectedSector} Roles` : "Total JAF Roles"}
            value={stats ? stats.total_roles.toLocaleString() : "2,246"}
            subtext="Across All Sectors"
            icon={Briefcase}
            badge="JAFs"
            badgeVariant="indigo"
            accentColor="indigo"
          />
          <KpiMetricCard
            label="International Roles"
            value={stats ? `${stats.international_offers_count} Offers` : "182 Offers"}
            subtext="US, EU, JP, SG, UAE"
            icon={Globe}
            badge="Global"
            badgeVariant="purple"
            accentColor="purple"
          />
          <KpiMetricCard
            label="Student Q&A Logs"
            value="50+ Verified"
            subtext="Authentic Interview Logs"
            icon={CheckCircle2}
            badge="Field Intel"
            badgeVariant="teal"
            accentColor="teal"
          />
        </KpiMetricGrid>

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 1: COMPANY DIRECTORY & JAFS                                  */}
        {/* ----------------------------------------------------------------- */}
        {activeMainTab === "directory" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SEARCH & FILTERS CONSOLE DECK */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by company, role (e.g. APM), skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-xl bg-background border-border text-foreground font-mono-tech text-xs shadow-xs focus-visible:ring-primary/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
                  {/* Descending Chronology Year & Phase Selector */}
                  <div className="inline-flex rounded-xl p-1 bg-muted/40 border border-border text-xs font-mono-tech flex-wrap gap-0.5">
                    <button
                      onClick={() => setSelectedSession("all")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        selectedSession === "all" ? "bg-card text-foreground shadow-xs font-bold border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All Sessions
                    </button>
                    <button
                      onClick={() => setSelectedSession("25-26_p1")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        selectedSession === "25-26_p1" ? "bg-primary text-primary-foreground shadow-xs font-bold" : "text-primary hover:bg-primary/10"
                      }`}
                      title="2025–26 Phase 1 (December Day 1–7 Placements)"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedSession === "25-26_p1" ? "bg-white" : "bg-primary"} animate-pulse`} />
                      2025–26 P1
                    </button>
                    <button
                      onClick={() => setSelectedSession("25-26_p2")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        selectedSession === "25-26_p2" ? "bg-primary text-primary-foreground shadow-xs font-bold" : "text-primary hover:bg-primary/10"
                      }`}
                      title="2025–26 Phase 2 (Spring Placement Cycle)"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedSession === "25-26_p2" ? "bg-white" : "bg-primary"}`} />
                      2025–26 P2
                    </button>
                    <button
                      onClick={() => setSelectedSession("24-25")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        selectedSession === "24-25" ? "bg-card text-foreground shadow-xs font-bold border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="2024–25 Complete Master Cycle"
                    >
                      2024–25 Master
                    </button>
                  </div>

                  <div className="inline-flex rounded-xl p-1 bg-muted/40 border border-border text-xs font-mono-tech">
                    <button
                      onClick={() => setSelectedTier("all")}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                        selectedTier === "all" ? "bg-card text-foreground shadow-xs font-bold border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All Tiers
                    </button>
                    <button
                      onClick={() => setSelectedTier("C1")}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                        selectedTier === "C1" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      C1 Dream
                    </button>
                    <button
                      onClick={() => setSelectedTier("C2")}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                        selectedTier === "C2" ? "bg-card text-foreground shadow-xs font-bold border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      C2 Core
                    </button>
                  </div>

                  <Button
                    variant={isInternationalOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsInternationalOnly(!isInternationalOnly)}
                    className={`h-9 text-xs rounded-xl font-mono-tech ${isInternationalOnly ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    <Globe className="h-3.5 w-3.5 mr-1.5" /> International
                  </Button>

                  <select
                    value={selectedDaySlot}
                    onChange={(e: any) => setSelectedDaySlot(e.target.value)}
                    className="h-9 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-mono-tech outline-none focus:border-primary cursor-pointer"
                  >
                    {DAY_SLOT_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        Slot: {slot}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="h-9 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-mono-tech outline-none focus:border-primary"
                  >
                    <option value="highest_ctc">Sort: Highest CTC</option>
                    <option value="median_ctc">Sort: Median CTC</option>
                    <option value="roles_count">Sort: Total Roles</option>
                    <option value="name">Sort: Name (A-Z)</option>
                  </select>

                  <div className="inline-flex rounded-xl p-1 bg-muted/40 border border-border">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"}`}
                      title="Grid View"
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"}`}
                      title="Table View"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 space-y-2.5">
                {/* Sector Filter Pills */}
                <div className="space-y-1">
                  <FilterPills
                    options={SECTOR_TABS}
                    selected={selectedSector}
                    onSelect={setSelectedSector}
                  />
                </div>

                {/* In-Demand Skills Cloud */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  <span className="text-[10px] font-bold font-mono-tech text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Key Skills:
                  </span>
                  <FilterPills
                    options={POPULAR_SKILLS}
                    selected={selectedSkill}
                    onSelect={setSelectedSkill}
                  />
                </div>
              </div>
            </div>

            {/* Match Count Header */}
            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
              <span>
                Showing <strong className="text-foreground font-semibold">{filteredCompanies.length}</strong> companies matching current criteria
              </span>
              {(searchQuery || selectedSector !== "All Sectors" || selectedSkill !== "All Skills" || selectedSession !== "all" || selectedTier !== "all" || isInternationalOnly || selectedDaySlot !== "All Slots") && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedSector("All Sectors")
                    setSelectedSkill("All Skills")
                    setSelectedSession("all")
                    setSelectedTier("all")
                    setIsInternationalOnly(false)
                    setSelectedDaySlot("All Slots")
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* COMPANIES DIRECTORY GRID / TABLE */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4" />
                <p className="text-sm text-muted-foreground">Loading verified placement intelligence dataset...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-dashed border-border/80 bg-card/40 p-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold text-foreground">No matching companies found</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Try adjusting your search keywords, sector selection, or skill filters.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedSector("All Sectors")
                    setSelectedSkill("All Skills")
                    setSelectedSession("all")
                    setSelectedTier("all")
                    setIsInternationalOnly(false)
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCompanies.map((comp) => {
                  const isC1 = comp.tier_category.includes("C1")
                  const hasInsights = !!comp.selection_insights
                  const isCompared = comparedSlugs.includes(comp.slug)
                  const isBookmarked = crmItems.some((x) => x.slug === comp.slug)
                  const effectiveCTC = comp.display_highest_ctc_inr || comp.highest_ctc_inr
                  const roleInHandList = (comp.role_offers || [])
                    .map((r: any) => r.inhand_inr || 0)
                    .filter((v: number) => v > 0)
                  const maxRoleInHand = roleInHandList.length > 0 ? Math.max(...roleInHandList) : 0
                  const rawInHand = comp.display_highest_inhand_inr || maxRoleInHand || comp.highest_inhand_inr || 0
                  const effectiveInHand = rawInHand >= 100000 ? rawInHand : 0

                  return (
                    <div
                      key={comp.id}
                      className="group relative rounded-3xl border border-border/70 hover:border-primary/50 bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                    >
                      <div className="space-y-4">
                        {/* Company Header Row */}
                        <div className="flex justify-between items-start gap-3">
                          <div
                            onClick={() => setSelectedCompanySlug(comp.slug)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-purple-500/10 border border-primary/20 flex items-center justify-center font-outfit font-extrabold text-lg text-primary group-hover:scale-105 transition-transform shadow-xs">
                              {comp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-base text-foreground font-outfit group-hover:text-primary transition-colors line-clamp-1">
                                {comp.name}
                              </h3>
                              <span className="text-xs text-muted-foreground font-medium line-clamp-1">
                                {comp.primary_sector}
                              </span>
                            </div>
                          </div>

                          {/* Tier, Compare & Bookmark Buttons */}
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5">
                              {isC1 ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-amber-500" /> C1 Dream
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] font-semibold px-2 py-0.5 shrink-0">
                                  {comp.tier_category || "Standard"}
                                </Badge>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleCRM(comp)
                                }}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isBookmarked
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                    : "bg-muted hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 border-border"
                                }`}
                                title={isBookmarked ? "Remove from Shortlist" : "Bookmark to Target List"}
                              >
                                {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 fill-current" /> : <Bookmark className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleCompare(comp.slug)
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                  isCompared
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border-border"
                                }`}
                                title="Add to Compare"
                              >
                                {isCompared ? "✓" : "+ Compare"}
                              </button>
                            </div>
                            {comp.difficulty_score && (
                              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5">
                                <Target className="h-2.5 w-2.5 text-primary" /> Difficulty: {comp.difficulty_score}/10
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dual Compensation & Senior Intel Card */}
                        <div
                          onClick={() => setSelectedCompanySlug(comp.slug)}
                          className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-2 cursor-pointer hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-primary" />
                              {selectedSector !== "All Sectors" ? `${selectedSector} CTC` : "Annual Peak CTC"}
                            </span>
                            <span className="font-extrabold text-foreground font-outfit text-sm">
                              {formatINRAmount(effectiveCTC)}
                            </span>
                          </div>
                          {effectiveInHand > 0 ? (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                Fixed Base Component
                              </span>
                              <span className="font-semibold text-foreground font-outfit">
                                {formatINRAmount(effectiveInHand)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-muted-foreground">Available Roles</span>
                              <span className="font-semibold text-foreground">
                                {comp.roles_count || 1} JAF Roles
                              </span>
                            </div>
                          )}
                          {comp.has_authentic_insights && (
                            <div className="pt-1.5 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>Verified IITB Senior Interview Questions</span>
                            </div>
                          )}
                          {comp.hiring_funnel_intelligence && (
                            <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {comp.hiring_funnel_intelligence.conversion_funnel?.interview_shortlisted_count > 0
                                  ? `${comp.hiring_funnel_intelligence.conversion_funnel.interview_shortlisted_count} Shortlisted for Interviews`
                                  : `${comp.hiring_funnel_intelligence.conversion_funnel?.oa_shortlisted_count || 0} Test Shortlists`}
                              </span>
                              {comp.hiring_funnel_intelligence.has_walkins && (
                                <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px]">
                                  Day Walk-ins
                                </span>
                              )}
                            </div>
                          )}
                          {(comp.placement_slot || comp.has_assignment_deck_round || comp.has_group_discussion || comp.bond_applicable) && (
                            <div className="pt-1.5 border-t border-border/40 flex flex-wrap gap-1 items-center">
                              {comp.placement_slot && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] border border-indigo-500/30 flex items-center gap-0.5">
                                  <Zap className="h-2.5 w-2.5" /> {comp.placement_slot}
                                </span>
                              )}
                              {comp.has_assignment_deck_round && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[9px] border border-purple-500/30 flex items-center gap-0.5">
                                  <FileText className="h-2.5 w-2.5" /> Deck / Case Round
                                </span>
                              )}
                              {comp.has_group_discussion && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px] border border-amber-500/30 flex items-center gap-0.5">
                                  <Users className="h-2.5 w-2.5" /> GD Round
                                </span>
                              )}
                              {comp.bond_applicable && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[9px] border border-rose-500/30 flex items-center gap-0.5">
                                  <Lock className="h-2.5 w-2.5" /> Service Bond
                                </span>
                              )}
                            </div>
                          )}
                          {comp.dominant_currency !== "INR" && (
                            <div className="pt-1 border-t border-border/40 flex justify-between items-center text-[10px]">
                              <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Global Pay
                              </span>
                              <span className="text-muted-foreground font-mono font-medium">
                                {comp.dominant_currency} Currency
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Role-Specific CTC Chips Container */}
                        {comp.role_offers && comp.role_offers.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              {selectedSector !== "All Sectors" ? `${selectedSector} Offers & Packages:` : "Roles & Compensation Packages:"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {comp.role_offers.slice(0, 3).map((role, rIdx) => {
                                const isMatchSector = selectedSector !== "All Sectors" && (role.primary_sector.toLowerCase() === selectedSector.toLowerCase() || selectedSector.toLowerCase().includes(role.primary_sector.toLowerCase()))
                                const isPhase1 = role.session_sheet.includes("25-26 s1") || role.session_label.toLowerCase().includes("phase 1")
                                const isPhase2 = role.session_sheet.includes("25-26 s2") || role.session_label.toLowerCase().includes("phase 2")
                                
                                return (
                                  <div
                                    key={role.id || rIdx}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedCompanySlug(comp.slug)
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isMatchSector
                                        ? "bg-primary/15 text-primary border-primary/40 shadow-xs scale-[1.01]"
                                        : "bg-muted/50 hover:bg-muted text-foreground border-border/60"
                                    }`}
                                    title={`${role.job_title} | CTC: ${formatINRAmount(role.ctc_inr)} | Base: ${formatINRAmount(role.inhand_inr)} | ${role.session_label}`}
                                  >
                                    <span className="truncate max-w-[130px]">{role.job_title}</span>
                                    <span className="font-extrabold font-outfit text-foreground shrink-0">
                                      {formatINRAmount(role.ctc_inr)}
                                    </span>
                                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold shrink-0 ${
                                      isPhase1 ? "bg-purple-500/20 text-purple-600 dark:text-purple-300" :
                                      isPhase2 ? "bg-blue-500/20 text-blue-600 dark:text-blue-300" :
                                      "bg-muted text-muted-foreground"
                                    }`}>
                                      {isPhase1 ? "P1" : isPhase2 ? "P2" : "24-25"}
                                    </span>
                                  </div>
                                )
                              })}
                              {comp.role_offers.length > 3 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCompanySlug(comp.slug)
                                  }}
                                  className="px-2 py-1 rounded-xl text-[10px] font-bold bg-muted/40 hover:bg-muted text-primary cursor-pointer border border-border/40 self-center"
                                >
                                  +{comp.role_offers.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* In-Demand Skills Badges */}
                        {comp.top_skills && comp.top_skills.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {comp.top_skills.slice(0, 4).map((sk, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-card border border-border/60 text-[10px] font-semibold text-foreground">
                                  {sk}
                                </span>
                              ))}
                              {comp.top_skills.length > 4 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                                  +{comp.top_skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Chronological Phase Timeline Pills & Student Data */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {comp.has_phase_1 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                              2025–26 Phase 1
                            </span>
                          )}
                          {comp.has_phase_2 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              2025–26 Phase 2
                            </span>
                          )}
                          {comp.has_24_25 && (
                            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium border border-border/60">
                              2024–25 Master
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center gap-1">
                            <Briefcase className="h-2.5 w-2.5" /> {comp.sector_roles_count || comp.roles_count} {comp.roles_count === 1 ? "Role" : "Roles"}
                          </span>
                          {hasInsights && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/20">
                              <BookOpen className="h-2.5 w-2.5" /> Student Q&A
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        onClick={() => setSelectedCompanySlug(comp.slug)}
                        className="mt-5 pt-3.5 border-t border-border/40 flex justify-between items-center text-xs cursor-pointer"
                      >
                        <span className="text-muted-foreground text-[11px] line-clamp-1">
                          {comp.locations.slice(0, 2).join(", ")}
                        </span>
                        <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Intelligence <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-border/70 bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-4">Company Name</th>
                        <th className="p-4">Sector</th>
                        <th className="p-4">Hiring Tier</th>
                        <th className="p-4">{selectedSector !== "All Sectors" ? `${selectedSector} Highest CTC` : "Highest CTC"}</th>
                        <th className="p-4">Fixed Base</th>
                        <th className="p-4">Role Offers & Packages</th>
                        <th className="p-4">Hiring Phases</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredCompanies.map((comp) => {
                        const isCompared = comparedSlugs.includes(comp.slug)
                        const isBookmarked = crmItems.some((x) => x.slug === comp.slug)
                        const effectiveCTC = comp.display_highest_ctc_inr || comp.highest_ctc_inr
                        const roleInHandList = (comp.role_offers || [])
                          .map((r: any) => r.inhand_inr || 0)
                          .filter((v: number) => v > 0)
                        const maxRoleInHand = roleInHandList.length > 0 ? Math.max(...roleInHandList) : 0
                        const rawInHand = comp.display_highest_inhand_inr || maxRoleInHand || comp.highest_inhand_inr || 0
                        const effectiveInHand = rawInHand >= 100000 ? rawInHand : 0

                        return (
                          <tr
                            key={comp.id}
                            className="hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            <td
                              onClick={() => setSelectedCompanySlug(comp.slug)}
                              className="p-4 font-bold text-foreground font-outfit"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-xs shrink-0">
                                  {comp.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="block">{comp.name}</span>
                                    {comp.has_authentic_insights && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20" title="Verified Senior Interview Questions Available">
                                        Senior Q&A
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">
                                    {comp.locations.slice(0, 2).join(", ")}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td onClick={() => setSelectedCompanySlug(comp.slug)} className="p-4 text-muted-foreground font-medium">{comp.primary_sector}</td>
                            <td onClick={() => setSelectedCompanySlug(comp.slug)} className="p-4">
                              <Badge variant="outline" className="text-[10px]">
                                {comp.tier_category || "Standard"}
                              </Badge>
                            </td>
                            <td onClick={() => setSelectedCompanySlug(comp.slug)} className="p-4 font-extrabold text-foreground font-outfit">
                              {formatINRAmount(effectiveCTC)}
                            </td>
                            <td onClick={() => setSelectedCompanySlug(comp.slug)} className="p-4 font-semibold text-foreground font-outfit">
                              {effectiveInHand > 0 ? formatINRAmount(effectiveInHand) : "Standard"}
                            </td>
                            <td onClick={() => setSelectedCompanySlug(comp.slug)} className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-[260px]">
                                {comp.role_offers?.slice(0, 2).map((r, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-semibold text-foreground flex items-center gap-1 border border-border/40">
                                    <span>{r.job_title}</span>
                                    <span className="font-bold text-primary font-outfit">{formatINRAmount(r.ctc_inr)}</span>
                                  </span>
                                ))}
                                {comp.role_offers && comp.role_offers.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground font-semibold">
                                    +{comp.role_offers.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td onClick={() => setSelectedCompanySlug(comp.slug)} className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {comp.has_phase_1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold border border-purple-500/20">25–26 P1</span>
                                )}
                                {comp.has_phase_2 && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold border border-blue-500/20">25–26 P2</span>
                                )}
                                {comp.has_24_25 && (
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] border border-border/40">24–25</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleCRM(comp)
                                  }}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isBookmarked
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                      : "bg-muted hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 border-border"
                                  }`}
                                  title="Bookmark to Target List"
                                >
                                  {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 fill-current" /> : <Bookmark className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleCompare(comp.slug)
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                                    isCompared
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border-border"
                                  }`}
                                >
                                  {isCompared ? "✓ Compared" : "+ Compare"}
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedCompanySlug(comp.slug)}
                                  className="h-8 text-xs font-semibold text-primary"
                                >
                                  View <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 2: PERSONAL PLACEMENT CRM & APPLICATION PIPELINE             */}
        {/* ----------------------------------------------------------------- */}
        {activeMainTab === "crm" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground font-outfit flex items-center gap-2">
                    <BookmarkCheck className="h-6 w-6 text-primary" /> My Target Companies & Application Pipeline
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your bookmarked campus target list, recruitment milestones, and private prep notes.
                  </p>
                </div>

                {/* Milestone Filter Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCrmFilterMilestone("all")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                      crmFilterMilestone === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    All ({crmItems.length})
                  </button>
                  {(Object.keys(MILESTONE_CONFIG) as CRMMilestone[]).map((m) => {
                    const count = crmItems.filter((x) => x.milestone === m).length
                    const conf = MILESTONE_CONFIG[m]
                    return (
                      <button
                        key={m}
                        onClick={() => setCrmFilterMilestone(m)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 ${
                          crmFilterMilestone === m
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <span>{conf.icon}</span> {conf.label} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {crmItems.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border/80 p-8 space-y-3">
                  <Bookmark className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                  <h3 className="text-base font-bold text-foreground">No companies bookmarked yet</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Browse the <strong>Company Directory</strong> and click the <strong>Bookmark Icon (🔖)</strong> on any company card to build your personalized placement shortlist!
                  </p>
                  <Button size="sm" onClick={() => setActiveMainTab("directory")} className="text-xs font-bold">
                    Explore Directory
                  </Button>
                </div>
              ) : filteredCrmItems.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  No companies found in this specific milestone.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {filteredCrmItems.map((item) => {
                    const conf = MILESTONE_CONFIG[item.milestone]
                    const isEditing = editingNotesSlug === item.slug

                    return (
                      <div
                        key={item.slug}
                        className="rounded-3xl border border-border/70 bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3
                                onClick={() => setSelectedCompanySlug(item.slug)}
                                className="font-extrabold text-base text-foreground font-outfit hover:text-primary cursor-pointer transition-colors"
                              >
                                {item.company_name}
                              </h3>
                              <span className="text-xs text-muted-foreground font-medium">
                                {item.sector} • {formatINRAmount(item.highest_ctc_inr)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                const updated = crmItems.filter((x) => x.slug !== item.slug)
                                saveCrmItems(updated)
                              }}
                              className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                              title="Remove from Shortlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Milestone Stage Switcher */}
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                              Current Recruitment Milestone:
                            </span>
                            <select
                              value={item.milestone}
                              onChange={(e) => handleUpdateCRMMilestone(item.slug, e.target.value as CRMMilestone)}
                              className="w-full h-8 px-2.5 text-xs font-bold rounded-xl bg-muted/60 border border-border/60 text-foreground outline-none focus:border-primary cursor-pointer"
                            >
                              <option value="interested">📌 Interested / Researching</option>
                              <option value="jaf_filled">📝 JAF Filled</option>
                              <option value="oa_submitted">⚡ OA / Test / Assignment Submitted</option>
                              <option value="interview_shortlisted">🎯 Interview Shortlist Received</option>
                              <option value="offer_received">🏆 Offer Received</option>
                            </select>
                          </div>

                          {/* Private Notes */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Prep Notes:
                              </span>
                              {!isEditing && (
                                <button
                                  onClick={() => {
                                    setEditingNotesSlug(item.slug)
                                    setTempNotes(item.notes || "")
                                  }}
                                  className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                                >
                                  <Edit3 className="h-2.5 w-2.5" /> Edit Notes
                                </button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="e.g. Talked to senior, revise Graph DP & multithreading..."
                                  className="w-full h-20 p-2.5 text-xs rounded-xl bg-background border border-primary text-foreground outline-none resize-none"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingNotesSlug(null)}
                                    className="h-6 text-[10px]"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveCRMNotes(item.slug)}
                                    className="h-6 text-[10px] font-bold"
                                  >
                                    Save Notes
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 min-h-[44px] leading-relaxed italic">
                                {item.notes || "No private notes added yet. Click 'Edit Notes' to jot down senior tips & reminders."}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCompanySlug(item.slug)}
                          className="w-full h-8 text-xs font-semibold mt-2"
                        >
                          Open Dossier <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 3: MACRO PLACEMENT ANALYTICS & SECTOR TRENDS                 */}
        {/* ----------------------------------------------------------------- */}
        {activeMainTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {loadingMacro ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4" />
                <p className="text-sm text-muted-foreground">Synthesizing macro placement trends and salary distributions...</p>
              </div>
            ) : macroAnalytics ? (
              <div className="space-y-8">
                {/* Branch Placement Velocity & Trajectory Reality */}
                {macroAnalytics.placement_velocity && (
                  <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h2 className="text-xl font-extrabold text-foreground font-outfit flex items-center gap-2">
                          <TrendingUp className="h-6 w-6 text-primary" /> Phase 1 Placement Velocity & Department Trajectories
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Cumulative Day 1 to Day 15 hiring progression reconstructed from {macroAnalytics.placement_velocity.total_phase1_placed_candidates} verified Phase 1 selections across departments.
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-bold font-mono">
                        {macroAnalytics.placement_velocity.total_phase1_placed_candidates} Selections Tracked
                      </Badge>
                    </div>

                    {/* Cumulative Velocity Milestones Steps */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Cumulative Phase 1 Campus Placement Progression:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {macroAnalytics.placement_velocity.overall_cumulative_velocity?.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1 relative overflow-hidden"
                          >
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                              {m.milestone}
                            </div>
                            <div className="text-lg font-black text-foreground font-outfit">
                              {m.cumulative_percentage}%
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              +{m.placed_in_window} placed
                            </div>
                            <div className="text-[9px] text-muted-foreground font-mono">
                              ({m.cumulative_placed} total)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Department Trajectories Grid */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-emerald-500" /> When Do Different Branches Get Placed?
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          Circuital peaks in first 48 hours • Mechanical & Civil peak in Days 3–5
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {macroAnalytics.placement_velocity.department_trajectories?.map((dept: any, dIdx: number) => (
                          <div
                            key={dIdx}
                            className="p-4.5 rounded-2xl bg-muted/30 border border-border/60 space-y-3 shadow-2xs hover:border-border transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-extrabold text-xs text-foreground font-outfit line-clamp-1">
                                {dept.department}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold shrink-0 ${
                                  dept.peak_hiring_window.includes("Days 1")
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                    : dept.peak_hiring_window.includes("Days 3")
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                }`}
                              >
                                {dept.peak_hiring_window}
                              </Badge>
                            </div>

                            {/* 3-Window Velocity Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Days 1–2: <strong>{dept.day1_2_pct}%</strong></span>
                                <span>Days 3–5: <strong>{dept.day3_5_pct}%</strong></span>
                                <span>Days 6–15: <strong>{dept.day6_15_pct}%</strong></span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                                <div style={{ width: `${dept.day1_2_pct}%` }} className="bg-blue-500 h-full" title={`Days 1-2: ${dept.day1_2_pct}%`} />
                                <div style={{ width: `${dept.day3_5_pct}%` }} className="bg-amber-500 h-full" title={`Days 3-5: ${dept.day3_5_pct}%`} />
                                <div style={{ width: `${dept.day6_15_pct}%` }} className="bg-purple-500 h-full" title={`Days 6-15: ${dept.day6_15_pct}%`} />
                              </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed bg-card/60 p-2.5 rounded-xl border border-border/40">
                              💡 {dept.strategic_advice}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sector Compensation Distributions & Base/Bonus Split */}
                <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground font-outfit flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-primary" /> Sector-wise Compensation & Fixed Base Benchmarks
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Median CTC, 75th/90th percentiles, and Guaranteed Base vs Bonus vs ESOP splits.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {macroAnalytics.sector_benchmarks?.map((sec: any) => (
                      <div
                        key={sec.sector_name}
                        className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-3 shadow-xs"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-extrabold text-sm text-foreground font-outfit">
                            {sec.sector_name}
                          </h3>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {sec.companies_count} Companies ({sec.roles_count} Roles)
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Median CTC:</span>
                            <span className="font-extrabold text-foreground font-outfit">{formatINRAmount(sec.median_ctc_inr)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Median Fixed Base:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-outfit">{formatINRAmount(sec.median_inhand_inr)}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Top 10% (P90) CTC:</span>
                            <span className="font-bold text-amber-500 font-outfit">{formatINRAmount(sec.p90_ctc_inr)}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Highest Offer:</span>
                            <span className="font-extrabold text-purple-500 font-outfit">{formatINRAmount(sec.highest_ctc_inr)}</span>
                          </div>
                        </div>

                        {/* Visual Base vs Bonus vs ESOP Bar */}
                        <div className="space-y-1 pt-1 border-t border-border/40">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Base: {sec.base_pay_pct}%</span>
                            <span>Bonus: {sec.variable_bonus_pct}%</span>
                            <span>ESOPs: {sec.esop_equity_pct}%</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
                            <div style={{ width: `${sec.base_pay_pct}%` }} className="bg-emerald-500 h-full" title={`Base Pay: ${sec.base_pay_pct}%`} />
                            <div style={{ width: `${sec.variable_bonus_pct}%` }} className="bg-amber-500 h-full" title={`Variable Bonus: ${sec.variable_bonus_pct}%`} />
                            <div style={{ width: `${sec.esop_equity_pct}%` }} className="bg-purple-500 h-full" title={`ESOPs / Equity: ${sec.esop_equity_pct}%`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* International Recruitment Destinations */}
                <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground font-outfit flex items-center gap-2">
                      <Globe className="h-6 w-6 text-purple-500" /> International Recruitment Hubs
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Global offers across Japan, USA, Europe, Singapore, UAE, and East Asia.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(macroAnalytics.international_breakdown || {}).map(([country, data]: any) => (
                      <div
                        key={country}
                        className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-foreground font-outfit">{country}</span>
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                            {data.count} Offers
                          </Badge>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Highest Package: </span>
                          <strong className="text-amber-500 font-outfit">{formatINRAmount(data.highest_ctc_inr)}</strong>
                        </div>
                        {data.sample_companies && data.sample_companies.length > 0 && (
                          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                            <strong>Recruiters:</strong> {data.sample_companies.slice(0, 3).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top CTC & Bulk Hiring Leaderboards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Highest Paying */}
                  <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
                    <h3 className="text-base font-extrabold text-foreground font-outfit flex items-center gap-2">
                      <Flame className="h-5 w-5 text-amber-500" /> Top Highest Paying Recruiters (Day 1 / Dream)
                    </h3>
                    <div className="divide-y divide-border/40 border border-border/60 rounded-2xl bg-muted/20 overflow-hidden">
                      {macroAnalytics.top_ctc_companies?.map((c: any, i: number) => (
                        <div
                          key={c.slug}
                          onClick={() => setSelectedCompanySlug(c.slug)}
                          className="p-3 flex justify-between items-center text-xs hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-[10px]">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-bold text-foreground block">{c.name}</span>
                              <span className="text-[10px] text-muted-foreground">{c.sector}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-foreground font-outfit block">{formatINRAmount(c.highest_ctc_inr)}</span>
                            <span className="text-[10px] text-muted-foreground">{c.currency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Volume Bulk Recruiters */}
                  <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
                    <h3 className="text-base font-extrabold text-foreground font-outfit flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" /> Top Recruiters by JAF Role Volume
                    </h3>
                    <div className="divide-y divide-border/40 border border-border/60 rounded-2xl bg-muted/20 overflow-hidden">
                      {macroAnalytics.top_volume_recruiters?.map((c: any, i: number) => (
                        <div
                          key={c.slug}
                          onClick={() => setSelectedCompanySlug(c.slug)}
                          className="p-3 flex justify-between items-center text-xs hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-bold text-foreground block">{c.name}</span>
                              <span className="text-[10px] text-muted-foreground">{c.sector}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-primary font-outfit block">{c.roles_count} Roles</span>
                            <span className="text-[10px] text-muted-foreground">Max: {formatINRAmount(c.highest_ctc_inr)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* PERSISTENT FLOATING COMPARISON TRAY                                 */}
      {/* ------------------------------------------------------------------- */}
      {comparedSlugs.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4 animate-in slide-in-from-bottom-6 duration-300">
          <div className="p-4 rounded-3xl bg-card/95 backdrop-blur-xl border border-primary/40 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary/15 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Comparing {comparedSlugs.length} of 3 Companies
                </span>
                <div className="flex gap-1.5 mt-0.5">
                  {comparedSlugs.map((slug) => {
                    const c = companies.find((x) => x.slug === slug)
                    return (
                      <span key={slug} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-foreground">
                        {c?.name || slug}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparedSlugs([])}
                className="text-xs text-muted-foreground hover:text-foreground underline px-2"
              >
                Clear
              </button>
              <Button
                size="sm"
                disabled={comparedSlugs.length < 2}
                onClick={handleOpenComparison}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                Compare Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* SIDE-BY-SIDE COMPANY COMPARISON MODAL                               */}
      {/* ------------------------------------------------------------------- */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-purple-500/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-primary/20 text-primary">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground font-outfit">
                    Side-by-Side Company Comparison Studio
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive compensation benchmarks, hiring difficulty, and selection hurdles comparison.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 custom-scrollbar">
              {loadingComparison ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
                  <p className="text-xs text-muted-foreground">Generating side-by-side comparison matrix...</p>
                </div>
              ) : comparisonData?.companies_compared ? (
                <div className="space-y-6">
                  {comparisonData.shared_skills && comparisonData.shared_skills.length > 0 && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                      <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Common In-Demand Skills Across Selected Companies:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.shared_skills.map((sk: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-primary/15 text-primary border-primary/30">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {comparisonData.companies_compared.map((comp: any) => (
                      <div
                        key={comp.slug}
                        className="rounded-3xl border border-border/70 bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-extrabold text-lg text-foreground font-outfit">
                                {comp.name}
                              </h3>
                              <span className="text-xs text-muted-foreground font-medium">
                                {comp.primary_sector}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {comp.tier_category || "Standard"}
                            </Badge>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Highest CTC</span>
                              <span className="font-extrabold text-foreground font-outfit text-sm">
                                {formatINRAmount(comp.highest_ctc_inr)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-muted-foreground">Fixed Base Component</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-outfit">
                                {comp.highest_inhand_inr >= 100000 ? formatINRAmount(comp.highest_inhand_inr) : "Standard"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-border/40">
                              <span className="text-muted-foreground">Hiring Difficulty</span>
                              <span className="font-bold text-amber-500 flex items-center gap-1">
                                <Target className="h-3 w-3" /> {comp.difficulty_score}/10
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Primary Selection Hurdle:
                            </span>
                            <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 leading-relaxed">
                              {comp.selection_hurdle}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Top Core Competencies:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {comp.top_skills?.slice(0, 5).map((sk: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-foreground">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t border-border/40">
                            <div><strong>Locations:</strong> {comp.locations?.join(", ")}</div>
                            <div><strong>Roles ({comp.roles_count}):</strong> {comp.available_roles?.join(", ")}</div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setShowCompareModal(false)
                            setSelectedCompanySlug(comp.slug)
                          }}
                          className="w-full h-9 text-xs font-semibold mt-3"
                        >
                          View Full Dossier <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN ACCESS MANAGEMENT MODAL                                       */}
      {/* ------------------------------------------------------------------- */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground font-outfit">Admin Access Control</h2>
                  <p className="text-xs text-muted-foreground">Whitelist users and manage invite passcodes for Placement Analysis.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-primary" /> Grant User Access (Whitelist Email)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <Input
                  type="email"
                  placeholder="student@iitb.ac.in or external@gmail.com"
                  value={newGrantEmail}
                  onChange={(e) => setNewGrantEmail(e.target.value)}
                  className="sm:col-span-7 h-10 text-xs rounded-xl bg-card"
                />
                <Input
                  type="text"
                  placeholder="Notes (e.g. Collaborator)"
                  value={newGrantNotes}
                  onChange={(e) => setNewGrantNotes(e.target.value)}
                  className="sm:col-span-3 h-10 text-xs rounded-xl bg-card"
                />
                <Button
                  onClick={handleAdminGrantAccess}
                  disabled={adminActionLoading || !newGrantEmail}
                  className="sm:col-span-2 h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Grant
                </Button>
              </div>
              {adminActionMsg && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">{adminActionMsg}</span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-500" /> Active Invite Passcodes
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAdminGenerateCode}
                  disabled={adminActionLoading}
                  className="h-7 text-xs font-semibold"
                >
                  <Plus className="h-3 w-3 mr-1" /> Generate New Code
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {adminInviteCodes.map((code) => (
                  <div
                    key={code}
                    onClick={() => handleCopyCode(code)}
                    className="px-3 py-1.5 rounded-xl bg-card border border-border/70 text-xs font-mono font-bold text-foreground flex items-center gap-2 cursor-pointer hover:border-primary transition-colors"
                  >
                    <span>{code}</span>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                    {copiedCode === code && <span className="text-[10px] text-emerald-500 font-sans">Copied!</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-500" /> Authorized / Whitelisted Accounts ({adminUsers.length})
              </h3>
              <div className="max-h-48 overflow-y-auto divide-y divide-border/40 border border-border/60 rounded-2xl bg-card custom-scrollbar">
                {adminUsers.map((u) => (
                  <div key={u.email} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{u.email}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">({u.role})</span>
                      {u.notes && <span className="text-[10px] text-muted-foreground block">{u.notes}</span>}
                    </div>
                    {u.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAdminRevokeAccess(u.email)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" /> Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setShowAdminModal(false)} className="h-10 text-xs font-semibold">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* UPGRADED COMPANY INTELLIGENCE DOSSIER MODAL                         */}
      {/* ------------------------------------------------------------------- */}
      {selectedCompanySlug && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-purple-500/10 flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-xl font-extrabold text-primary font-outfit shrink-0 shadow-sm">
                  {companyDetails?.company?.name?.substring(0, 2).toUpperCase() || "CP"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-outfit">
                      {companyDetails?.company?.name || "Company Intelligence"}
                    </h2>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-bold">
                      {companyDetails?.company?.tier_category || "C1"}
                    </Badge>
                    {companyDetails?.company?.difficulty_score && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold flex items-center gap-1">
                        <Target className="h-3 w-3" /> Difficulty: {companyDetails.company.difficulty_score}/10
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span>{companyDetails?.company?.primary_sector}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {Array.from(new Set((companyDetails?.company?.locations || []).map((l: string) => l.trim()))).slice(0, 3).join(", ") || "Pan India"}
                    </span>
                    <span>•</span>
                    <span>{companyDetails?.roles_count || companyDetails?.roles?.length || 0} JAF Postings</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrintDossierPDF}
                  className="h-8 text-xs font-bold flex items-center gap-1.5"
                  title="Print or Save 2-Page Prep Sheet PDF"
                >
                  <Printer className="h-3.5 w-3.5" /> Share / PDF
                </Button>
                <button
                  onClick={() => setSelectedCompanySlug(null)}
                  className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Dossier Tabs - 3 Student-Focused Briefing Sections */}
            <div className="px-6 border-b border-border/40 bg-muted/30 flex gap-4 overflow-x-auto">
              <button
                onClick={() => setActiveDossierTab("roles")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeDossierTab === "roles"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" /> JAF Roles & Job Profiles ({companyDetails?.roles_count || companyDetails?.roles?.length || 0})
              </button>
              <button
                onClick={() => setActiveDossierTab("selection")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeDossierTab === "selection"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Selection Gauntlet & Senior Q&A {companyDetails?.selection_blueprint?.questions_asked?.length ? `(${companyDetails.selection_blueprint.questions_asked.length})` : ""}
              </button>
              <button
                onClick={() => {
                  setActiveDossierTab("keywords")
                  if (companyDetails?.roles?.[selectedRoleIndex] && !matchResult) {
                    handleMatchResume(companyDetails.roles[selectedRoleIndex].id)
                  }
                }}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeDossierTab === "keywords" || activeDossierTab === "resumematch" || activeDossierTab === "roadmap"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Skills & 1-Click Resume Fit
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[62vh] space-y-6 custom-scrollbar">
              {loadingDetails ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
                  <p className="text-xs text-muted-foreground">Synthesizing complete company intelligence...</p>
                </div>
              ) : activeDossierTab === "roles" ? (
                <div className="space-y-6">
                  {/* Role Selector */}
                  {companyDetails?.roles && companyDetails.roles.length > 1 && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                        Select Target Job Announcement Form (JAF):
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {companyDetails.roles.map((r: PlacementRole, idx: number) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setSelectedRoleIndex(idx)
                              fetchSalaryBreakdown(r.id)
                            }}
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left shrink-0 border transition-all ${
                              selectedRoleIndex === idx
                                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.01]"
                                : "bg-card hover:bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            <span className="block font-bold truncate max-w-[220px]">{r.job_title}</span>
                            <span className="text-[10px] opacity-80 block">{r.session_label} • {r.primary_sector}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {companyDetails?.roles && companyDetails.roles[selectedRoleIndex] && (
                    (() => {
                      const curRole: PlacementRole = companyDetails.roles[selectedRoleIndex]
                      return (
                        <div className="space-y-6">
                          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 space-y-4">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                                  {curRole.session_label} • {curRole.category_tier} Tier • {curRole.primary_sector}
                                </span>
                                <h3 className="text-lg font-extrabold text-foreground font-outfit mt-0.5">
                                  {curRole.job_title}
                                </h3>
                              </div>
                              <Badge variant="outline" className="bg-background text-xs font-semibold">
                                {curRole.location}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40">
                              <div className="p-3 rounded-xl bg-card border border-border/60">
                                <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                                  Original CTC ({curRole.currency})
                                </span>
                                <span className="text-base font-extrabold text-foreground font-outfit">
                                  {formatOriginalSalary(curRole)}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-card border border-border/60">
                                <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                                  INR Converted Benchmark
                                </span>
                                <span className="text-base font-extrabold text-amber-500 font-outfit">
                                  {formatINRAmount(curRole.compensation.ctc_inr_equivalent)}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-card border border-border/60">
                                <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                                  Fixed Base Salary
                                </span>
                                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-outfit">
                                  {curRole.compensation.inhand_median > 0
                                    ? formatINRAmount(curRole.compensation.inhand_inr_equivalent)
                                    : "Standard Pay"}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-card border border-border/60">
                                <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                                  Currency Type
                                </span>
                                <span className="text-base font-extrabold text-purple-500 font-outfit">
                                  {curRole.compensation.is_international ? "International" : "Domestic (INR)"}
                                </span>
                              </div>
                            </div>

                            {/* Compensation Structure Visualizer (Annual Fixed vs Variable vs ESOPs) */}
                            {salaryBreakdown && (
                              <div className="p-4.5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                                      Compensation Structure: Fixed Base vs Variable vs ESOPs
                                    </h4>
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-bold px-2.5 py-1">
                                    Total CTC: {formatINRAmount(salaryBreakdown.ctc_inr)}
                                  </Badge>
                                </div>

                                {/* Visual Composition Progress Bar */}
                                <div className="space-y-1.5">
                                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                                    <div
                                      style={{ width: `${Math.min(100, Math.round((salaryBreakdown.base_pay_annual / (salaryBreakdown.ctc_inr || 1)) * 100))}%` }}
                                      className="bg-emerald-500 h-full"
                                      title={`Fixed Base: ₹${salaryBreakdown.base_pay_annual.toLocaleString()}`}
                                    />
                                    <div
                                      style={{ width: `${Math.min(100, Math.round((salaryBreakdown.variable_bonus_annual / (salaryBreakdown.ctc_inr || 1)) * 100))}%` }}
                                      className="bg-amber-500 h-full"
                                      title={`Variable Bonus: ₹${salaryBreakdown.variable_bonus_annual.toLocaleString()}`}
                                    />
                                    <div
                                      style={{ width: `${Math.min(100, Math.round((salaryBreakdown.esops_annual / (salaryBreakdown.ctc_inr || 1)) * 100))}%` }}
                                      className="bg-purple-500 h-full"
                                      title={`ESOPs: ₹${salaryBreakdown.esops_annual.toLocaleString()}`}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-muted-foreground flex-wrap gap-2">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Fixed Annual Base ({Math.round((salaryBreakdown.base_pay_annual / (salaryBreakdown.ctc_inr || 1)) * 100)}%)</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /> Variable Bonus ({Math.round((salaryBreakdown.variable_bonus_annual / (salaryBreakdown.ctc_inr || 1)) * 100)}%)</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> ESOPs / Equity ({Math.round((salaryBreakdown.esops_annual / (salaryBreakdown.ctc_inr || 1)) * 100)}%)</span>
                                  </div>
                                </div>

                                {/* 4 Clean Metric Tiles */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/40">
                                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Total CTC</span>
                                    <span className="text-sm font-extrabold text-foreground font-outfit">
                                      {formatINRAmount(salaryBreakdown.ctc_inr)}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mb-0.5">Fixed Base Component</span>
                                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-outfit">
                                      {formatINRAmount(salaryBreakdown.base_pay_annual)}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Variable Bonus</span>
                                    <span className="text-sm font-extrabold text-amber-500 font-outfit">
                                      {salaryBreakdown.variable_bonus_annual > 0 ? formatINRAmount(salaryBreakdown.variable_bonus_annual) : "Included in Base"}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                    <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">ESOPs / Stocks</span>
                                    <span className="text-sm font-extrabold text-purple-500 font-outfit">
                                      {salaryBreakdown.esops_annual > 0 ? formatINRAmount(salaryBreakdown.esops_annual) : "No ESOPs"}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  Official compensation breakdown derived from the company's Job Announcement Form (JAF), detailing guaranteed annual fixed compensation versus performance-based incentives and long-term equity.
                                </p>
                              </div>
                            )}

                            {curRole.perks_and_benefits && curRole.perks_and_benefits.length > 0 && (
                              <div className="pt-2 border-t border-border/40">
                                <span className="text-xs font-semibold text-foreground mb-1.5 block">
                                  Compensation Perks & Bonuses:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {curRole.perks_and_benefits.map((p, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                      <Zap className="h-3 w-3 mr-1" /> {p}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {curRole.additional_info_raw && (
                              <div className="text-xs text-muted-foreground bg-background/60 p-3 rounded-xl border border-border/40 italic">
                                "{curRole.additional_info_raw}"
                              </div>
                            )}
                          </div>

                          {/* Responsibilities */}
                          {curRole.responsibilities && curRole.responsibilities.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                                Core Responsibilities
                              </h4>
                              <ul className="space-y-1.5">
                                {curRole.responsibilities.map((r, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Official Job Announcement Form (JAF) & Detailed Description */}
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-primary" /> Official Job Announcement Form (JAF & Job Description)
                              </h4>
                              <div className="flex items-center gap-2">
                                {curRole.raw_jd && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      navigator.clipboard.writeText(curRole.raw_jd)
                                      setCopiedJd(true)
                                      setTimeout(() => setCopiedJd(false), 2000)
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold text-primary flex items-center gap-1"
                                  >
                                    {copiedJd ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copiedJd ? "Copied JD!" : "Copy Full JD"}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsJdExpanded(!isJdExpanded)}
                                  className="h-7 px-2.5 text-[11px] font-semibold text-muted-foreground"
                                >
                                  {isJdExpanded ? "Collapse" : "Expand Full View"}
                                </Button>
                              </div>
                            </div>
                            <div className={`p-4.5 rounded-2xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans custom-scrollbar transition-all ${
                              isJdExpanded ? "max-h-[600px]" : "max-h-72"
                            }`}>
                              {curRole.raw_jd || curRole.role_summary || companyDetails?.company?.ai_overview || "Detailed Job Announcement Form specifications currently on file."}
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  )}

                  {/* Fallback if company has no roles list populated */}
                  {(!companyDetails?.roles || companyDetails.roles.length === 0) && (
                    <div className="p-8 rounded-2xl bg-muted/20 border border-dashed border-border/80 text-center space-y-3">
                      <Briefcase className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                      <h4 className="text-sm font-bold text-foreground">
                        Job Announcement Form (JAF Profile)
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {companyDetails?.company?.ai_overview || "Detailed JAF specifications and hiring parameters for this recruiter."}
                      </p>
                      {companyDetails?.company?.available_roles && (
                        <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto">
                          {companyDetails.company.available_roles.map((r: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeDossierTab === "keywords" ? (
                /* TAB 2: DEEP JD KEYWORD & COMPETENCY ANALYSIS */
                <div className="space-y-6">
                  {companyDetails?.roles && companyDetails.roles[selectedRoleIndex] && (
                    (() => {
                      const curRole: PlacementRole = companyDetails.roles[selectedRoleIndex]
                      const kw: CategorizedKeywords = curRole.categorized_keywords || {
                        all: curRole.required_skills || [],
                        languages: [],
                        frameworks_and_tools: [],
                        core_concepts: [],
                        leadership: []
                      }

                      return (
                        <div className="space-y-6">
                          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1.5">
                            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <BrainCircuit className="h-4 w-4 text-primary" /> Multi-Dimensional Skill Taxonomy Extraction
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Extracted directly from the official Job Announcement Form (JAF) for <strong>{curRole.job_title}</strong>.
                            </p>
                          </div>

                          {kw.languages && kw.languages.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Code className="h-4 w-4 text-blue-500" /> Core Programming Languages
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {kw.languages.map((l, i) => (
                                  <span key={i} className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold shadow-2xs">
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {kw.frameworks_and_tools && kw.frameworks_and_tools.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Wrench className="h-4 w-4 text-purple-500" /> Frameworks, Libraries & Developer Tools
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {kw.frameworks_and_tools.map((t, i) => (
                                  <span key={i} className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold shadow-2xs">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {kw.core_concepts && kw.core_concepts.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Target className="h-4 w-4 text-amber-500" /> Domain Architecture & Methodologies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {kw.core_concepts.map((c, i) => (
                                  <span key={i} className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shadow-2xs">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {kw.leadership && kw.leadership.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-emerald-500" /> Leadership & Problem Solving Competencies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {kw.leadership.map((l, i) => (
                                  <span key={i} className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-2xs">
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {curRole.intelligence?.topic_weightage && (
                            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3">
                              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart3 className="h-4 w-4 text-primary" /> Interview Topic Focus Distribution
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                  <span className="text-lg font-extrabold text-primary font-outfit">
                                    {curRole.intelligence.topic_weightage.dsa_and_problem_solving}%
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">Problem Solving / DSA</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                  <span className="text-lg font-extrabold text-purple-500 font-outfit">
                                    {curRole.intelligence.topic_weightage.system_and_domain_design}%
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">System & Product Design</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                  <span className="text-lg font-extrabold text-amber-500 font-outfit">
                                    {curRole.intelligence.topic_weightage.case_and_business_sense}%
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">Business & Case Sense</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                  <span className="text-lg font-extrabold text-emerald-500 font-outfit">
                                    {curRole.intelligence.topic_weightage.resume_and_leadership_fit}%
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">Resume & Cultural Fit</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Live Resume Compatibility & Keyword Gap */}
                          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex justify-between items-center flex-wrap gap-3">
                            <div>
                              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <FileCheck className="h-4 w-4 text-primary" /> Live Resume Compatibility & Keyword Gap
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Target Role: <strong>{curRole.job_title}</strong> at {curRole.company_name}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              disabled={matchingResume}
                              onClick={() => handleMatchResume(curRole.id)}
                              className="h-8 text-xs font-bold bg-primary text-primary-foreground"
                            >
                              {matchingResume ? "Analyzing Resume..." : "Re-Scan My Resume"}
                            </Button>
                          </div>

                          {matchResult && (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-5 rounded-2xl bg-card border border-border/60">
                              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/40 border border-border/40">
                                <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary/30 text-2xl font-extrabold font-outfit text-primary">
                                  {matchResult.match_score}%
                                </div>
                                <span className="text-xs font-bold text-foreground mt-2">
                                  {matchResult.match_rating}
                                </span>
                              </div>

                              <div className="sm:col-span-8 space-y-3">
                                <div>
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                                    ✓ Matched Skills ({matchResult.matched_skills.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {matchResult.matched_skills.length > 0 ? (
                                      matchResult.matched_skills.map((s, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                                          {s}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">No direct matches found in sample text.</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-xs font-bold text-destructive block mb-1">
                                    ⚠ Missing High-Yield Keywords ({matchResult.missing_critical_skills.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {matchResult.missing_critical_skills.map((s, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[11px] font-semibold">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {matchResult?.tailored_resume_bullets && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-amber-500" /> AI-Generated Tailored Resume Bullets (STAR / Google X-Y-Z):
                              </h4>
                              <div className="space-y-2">
                                {matchResult.tailored_resume_bullets.map((bullet, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 rounded-2xl bg-card border border-border/60 text-xs flex justify-between items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                                  >
                                    <span className="text-foreground leading-relaxed font-medium">{bullet}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCopyBullet(bullet, idx)}
                                      className="h-7 px-2 text-[11px] font-bold text-primary shrink-0"
                                    >
                                      {copiedBulletIdx === idx ? "Copied!" : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  )}
                </div>
              ) : activeDossierTab === "selection" ? (
                /* TAB: SELECTION PROCESS & AUTHENTIC SENIOR Q&A */
                <div className="space-y-6">
                  {/* Verified Senior Insights Banner */}
                  <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5 shadow-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          {companyDetails?.selection_blueprint?.has_authentic_student_data
                            ? "Verified IITB Senior Interview Debrief"
                            : "Campus Selection Gauntlet & Evaluation Blueprint"}
                        </h4>
                        {companyDetails?.selection_blueprint?.has_authentic_student_data && (
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                            100% Authentic Senior Data
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {companyDetails?.selection_blueprint?.has_authentic_student_data
                          ? `Authentic selection tests and interview questions directly recorded by IIT Bombay seniors who cleared shortlists at ${companyDetails?.company?.name}.`
                          : `Domain-calibrated evaluation funnel and high-yield interview questions for ${companyDetails?.company?.primary_sector} roles.`}
                      </p>
                    </div>
                  </div>

                  {/* Official 2025-26 Recruitment Gauntlet & Shortlist Reality */}
                  {(() => {
                    const funnel = companyDetails?.hiring_funnel_intelligence || companyDetails?.company?.hiring_funnel_intelligence
                    if (!funnel) return null

                    const oaCount = funnel.conversion_funnel?.oa_shortlisted_count || 0
                    const interviewCount = funnel.conversion_funnel?.interview_shortlisted_count || 0
                    const walkinCount = funnel.conversion_funnel?.walkin_extended_shortlists_count || 0
                    const convPct = funnel.conversion_funnel?.oa_to_interview_conversion_pct
                    const branches: [string, number][] = Object.entries(funnel.demographics?.branch_distribution || {}).slice(0, 5) as [string, number][]
                    const degrees: [string, number][] = Object.entries(funnel.demographics?.degree_distribution || {}).slice(0, 3) as [string, number][]

                    return (
                      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-blue-500" />
                                2025–26 Shortlist & Conversion Reality
                              </h4>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                                Verified Portal Data ({funnel.total_updates} Updates Logged)
                              </Badge>
                              {funnel.has_walkins && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                                  Day Walk-ins Offered
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Extracted from official placement announcements, test shortlists, and interview calls for the 2025–26 season.
                            </p>
                          </div>

                          {funnel.hiring_phases && funnel.hiring_phases.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {funnel.hiring_phases.map((ph: string, pIdx: number) => (
                                <span key={pIdx} className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md text-foreground">
                                  {ph}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3-Tile Funnel Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Tile 1: Assessment */}
                          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                              <span>1. Online Assessment</span>
                              <span className="text-foreground font-mono font-extrabold">{oaCount > 0 ? oaCount : "Open Pool"}</span>
                            </div>
                            <div className="text-xs font-extrabold text-foreground">
                              {funnel.online_assessment?.platform || "Standard OA Platform"}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                              <span>Mode: {funnel.online_assessment?.venue ? `Venue: ${funnel.online_assessment.venue}` : (funnel.online_assessment?.mode || "Online")}</span>
                              <span>Format: {funnel.online_assessment?.test_format || "Coding & Aptitude"}</span>
                              {funnel.online_assessment?.duration_minutes && (
                                <span>Duration: {funnel.online_assessment.duration_minutes} Mins</span>
                              )}
                            </div>
                          </div>

                          {/* Tile 2: Interviews */}
                          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                              <span>2. Interview Calls</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-sm">
                                {interviewCount > 0 ? interviewCount : "Direct Shortlist"}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-foreground">
                              {convPct !== null && convPct !== undefined ? `${convPct}% OA Clear Rate` : "Direct Shortlist Selection"}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                              {walkinCount > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  +{walkinCount} Extended / Walk-in shortlists
                                </span>
                              ) : (
                                <span>Standard Interview Rounds</span>
                              )}
                            </div>
                          </div>

                          {/* Tile 3: JAF Rules */}
                          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              3. Eligibility & Slotting
                            </div>
                            <div className="text-xs font-bold text-foreground">
                              Slot: {funnel.placement_slot || companyDetails?.company?.placement_slot || "Phase 1 / Rolling"}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                              <span>CPI Cutoff: {funnel.cpi_criteria?.cutoff_stated || "None"}</span>
                              <span>Bonus JAF: {funnel.cpi_criteria?.bonus_jaf_allowed ? "Allowed" : "Not Allowed"}</span>
                              {funnel.bond_applicable !== undefined && funnel.bond_applicable !== null && (
                                <span className={funnel.bond_applicable ? "text-rose-500 font-bold" : "text-emerald-500 font-semibold"}>
                                  Service Bond: {funnel.bond_applicable ? "Applicable" : "No Bond"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Take-Home Assignment & Case Deck Alert */}
                        {(funnel.has_assignment_deck_round || companyDetails?.company?.has_assignment_deck_round) && (
                          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5 text-xs">
                              <span className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider block text-[10px]">
                                Pre-Interview Take-Home Case Study / Deck Round Required
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {funnel.assignment_details || companyDetails?.company?.assignment_details || "Shortlisted candidates are required to submit a product problem statement, case study deck, or take-home code task prior to interviews."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Group Discussion (GD) Round Alert */}
                        {(funnel.has_group_discussion || companyDetails?.company?.has_group_discussion) && (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                              <Users className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5 text-xs">
                              <span className="font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider block text-[10px]">
                                Group Discussion (GD) Round Included
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {funnel.gd_details || companyDetails?.company?.gd_details || "This recruiter conducts a Group Discussion (GD) round to evaluate communication, structured thinking, and business logic before technical rounds."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Department Distribution Progress Bar */}
                        {branches.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <div className="flex justify-between items-center text-[11px] flex-wrap gap-1">
                              <span className="font-extrabold text-foreground flex items-center gap-1.5">
                                <PieChart className="h-3.5 w-3.5 text-primary" />
                                Verified Branch Shortlist Breakdown
                              </span>
                              <span className="text-muted-foreground text-[10px]">
                                {degrees.map(([deg, pct]) => `${deg}: ${pct}%`).join(" • ")}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                              {branches.map(([branch, pct], bIdx) => {
                                const colors = [
                                  "bg-blue-500",
                                  "bg-indigo-500",
                                  "bg-emerald-500",
                                  "bg-amber-500",
                                  "bg-purple-500",
                                ]
                                return (
                                  <div
                                    key={bIdx}
                                    style={{ width: `${pct}%` }}
                                    className={`${colors[bIdx % colors.length]} transition-all`}
                                    title={`${branch}: ${pct}%`}
                                  />
                                )
                              })}
                            </div>

                            {/* Branch Pills */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {branches.map(([branch, pct], bIdx) => (
                                <span
                                  key={bIdx}
                                  className="text-[10px] font-medium bg-muted/60 text-foreground px-2 py-0.5 rounded-md border border-border/40 flex items-center gap-1"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      bIdx === 0 ? "bg-blue-500" : bIdx === 1 ? "bg-indigo-500" : bIdx === 2 ? "bg-emerald-500" : bIdx === 3 ? "bg-amber-500" : "bg-purple-500"
                                    }`}
                                  />
                                  {branch}: <strong className="font-bold">{String(pct)}%</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recruitment Timeline Updates */}
                        {funnel.recruitment_timeline && funnel.recruitment_timeline.length > 0 && (
                          <details className="text-[11px] pt-1 cursor-pointer group">
                            <summary className="font-bold text-muted-foreground hover:text-foreground flex items-center justify-between select-none">
                              <span>View Official Season Timeline ({funnel.recruitment_timeline.length} Updates)</span>
                              <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {funnel.recruitment_timeline.map((ev: any, evIdx: number) => (
                                <div key={evIdx} className="p-2 rounded-lg bg-muted/30 border border-border/40 flex justify-between items-center text-[10px]">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="font-mono text-muted-foreground shrink-0">{ev.date}</span>
                                    <span className="font-semibold text-foreground truncate">{ev.headline}</span>
                                  </div>
                                  <Badge variant="outline" className="text-[9px] shrink-0 font-normal">
                                    {ev.stage}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )
                  })()}

                  {/* Round-by-Round Gauntlet */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" /> Round-by-Round Selection Funnel
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold shrink-0">1</span>
                          <span>Online Assessment (OA) / Shortlisting</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                          {companyDetails?.selection_blueprint?.online_test_details || "Standard Online Assessment: Coding Challenges (DSA) and Aptitude/Math."}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold shrink-0">2</span>
                          <span>Technical & Domain Interviews</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                          {companyDetails?.selection_blueprint?.interview_details || "2-3 Technical Interview rounds focusing on Core Problem Solving, System Design, and Resume Deep-Dive."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Authentic Questions Asked */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4 text-emerald-500" />
                        {companyDetails?.selection_blueprint?.has_authentic_student_data
                          ? "Actual Questions Asked in Interviews"
                          : "High-Yield Practice Questions"}
                        {companyDetails?.selection_blueprint?.questions_asked?.length ? ` (${companyDetails.selection_blueprint.questions_asked.length})` : ""}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">Click copy icon to save any question</span>
                    </div>

                    {companyDetails?.selection_blueprint?.questions_asked && companyDetails.selection_blueprint.questions_asked.length > 0 ? (
                      <div className="space-y-2.5">
                        {companyDetails.selection_blueprint.questions_asked.map((q: string, i: number) => {
                          const isCopied = copiedBulletIdx === 2000 + i
                          return (
                            <div
                              key={i}
                              className="group p-3.5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 text-xs flex justify-between items-start gap-3 shadow-2xs transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                                  Q{i + 1}
                                </span>
                                <span className="text-foreground font-medium leading-relaxed">{q}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(q)
                                  setCopiedBulletIdx(2000 + i)
                                  setTimeout(() => setCopiedBulletIdx(null), 2000)
                                }}
                                className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy Question"
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground italic">
                        Standard problem-solving and resume deep-dive questions reported for this profile.
                      </div>
                    )}
                  </div>

                  {/* Recommended Electives & Coursework */}
                  {companyDetails?.selection_blueprint?.recommended_electives_projects && companyDetails.selection_blueprint.recommended_electives_projects.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-border/40">
                      <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-primary" /> Recommended Coursework, Minors & Projects (by Seniors)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {companyDetails.selection_blueprint.recommended_electives_projects.map((el: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-muted/60 hover:bg-muted text-foreground border-border/80 py-1.5 px-3 rounded-xl font-medium">
                            <BookOpen className="h-3 w-3 mr-1.5 text-primary" /> {el}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 5: AI PREPARATION ROADMAP & PLAYBOOK */
                <div className="space-y-6">
                  {companyDetails?.roles && companyDetails.roles[selectedRoleIndex] && (
                    (() => {
                      const curRole: PlacementRole = companyDetails.roles[selectedRoleIndex]
                      const intel: RoleIntelligence | undefined = curRole.intelligence

                      return (
                        <div className="space-y-6">
                          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-purple-500/10 border border-primary/30 space-y-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                              <h3 className="text-sm font-extrabold text-foreground font-outfit">
                                AI Placement Preparation Playbook for {companyDetails?.company?.name} ({curRole.job_title})
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Customized high-yield revision topics and resume power points synthesized from historical JAF requirements and senior student interview experiences.
                            </p>
                          </div>

                          {intel?.key_selection_hurdle && (
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                              <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Target className="h-4 w-4 text-amber-500" /> Primary Selection Hurdle
                              </h4>
                              <p className="text-xs text-foreground leading-relaxed font-medium">
                                {intel.key_selection_hurdle}
                              </p>
                            </div>
                          )}

                          {intel?.resume_power_tip && (
                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                              <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Flame className="h-4 w-4 text-emerald-500" /> What Winning Resumes Highlight
                              </h4>
                              <p className="text-xs text-foreground leading-relaxed font-medium">
                                {intel.resume_power_tip}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-amber-500" /> Must-Revise Core Fundamentals
                              </h4>
                              <ul className="text-xs text-muted-foreground space-y-1.5">
                                <li>• Data Structures & Algorithms: Graphs, Dynamic Programming, Trees</li>
                                <li>• System Architecture: Scalability, Caching, DB Indexing & Concurrency</li>
                                <li>• Problem Solving: Clean Code, Edge-Case Handling, Time Complexity Analysis</li>
                              </ul>
                            </div>

                            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <CheckSquare className="h-4 w-4 text-primary" /> Interview Day Checklist
                              </h4>
                              <ul className="text-xs text-muted-foreground space-y-1.5">
                                <li>• Articulate thought process clearly before coding / solving</li>
                                <li>• Clarify constraints and edge cases proactively</li>
                                <li>• Demonstrate deep ownership of past projects and PoRs</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                Ready to practice for <strong className="text-foreground">{companyDetails?.company?.name}</strong>?
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompanySlug(null)}
                  className="w-full sm:w-auto h-10 text-xs font-semibold"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLaunchMockInterview(companyDetails?.company, companyDetails?.roles?.[selectedRoleIndex])}
                  className="w-full sm:w-auto h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" /> Practice for {companyDetails?.company?.name} with AI Coach
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
