"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  CheckSquare
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
  roles_count: number
  available_roles?: string[]
  highest_ctc_inr: number
  highest_inhand_inr: number
  median_ctc_inr: number
  dominant_currency: string
  has_international_offers: boolean
  locations: string[]
  top_skills?: string[]
  roles: string[]
  selection_insights: SelectionInsights | null
  ai_overview: string
  difficulty_score?: number
  difficulty_tier?: string
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

export default function PlacementAnalysisPage() {
  const router = useRouter()
  const { user, setTargetCompany } = useAuthStore()

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

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSector, setSelectedSector] = useState("All Sectors")
  const [selectedSkill, setSelectedSkill] = useState("All Skills")
  const [selectedSession, setSelectedSession] = useState<"all" | "25-26" | "24-25">("all")
  const [selectedTier, setSelectedTier] = useState<"all" | "C1" | "C2" | "C3">("all")
  const [isInternationalOnly, setIsInternationalOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"highest_ctc" | "median_ctc" | "roles_count" | "name">("highest_ctc")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Selected Company Dossier Modal
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string | null>(null)
  const [companyDetails, setCompanyDetails] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeDossierTab, setActiveDossierTab] = useState<"roles" | "keywords" | "selection" | "roadmap">("roles")
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0)

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
        if (email.endsWith("@iitb.ac.in")) {
          setIsIITBVerified(true)
          return
        }
      }

      const savedVerification = localStorage.getItem("iitb_placement_verified")
      const savedAdmin = localStorage.getItem("iitb_placement_admin")
      if (savedVerification === "true") {
        setIsIITBVerified(true)
        if (savedAdmin === "true") {
          setIsAdmin(true)
        }
        return
      }

      setIsIITBVerified(false)
    }

    checkAuth()
  }, [user])

  // Fetch placement data from API
  const fetchPlacementData = async () => {
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const statsRes = await fetch(`${API_URL}/placement-analysis/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      const companiesRes = await fetch(`${API_URL}/placement-analysis/companies?page=1&page_size=700&sort_by=${sortBy}`)
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

  useEffect(() => {
    if (isIITBVerified) {
      fetchPlacementData()
    }
  }, [isIITBVerified, sortBy])

  // Fetch Company Dossier when modal opens
  useEffect(() => {
    if (!selectedCompanySlug) {
      setCompanyDetails(null)
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
        }
      } catch (err) {
        console.error("Error fetching company details:", err)
      } finally {
        setLoadingDetails(false)
      }
    }

    fetchDetails()
  }, [selectedCompanySlug])

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

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = c.name.toLowerCase().includes(q)
        const matchSector = c.primary_sector.toLowerCase().includes(q)
        const matchLoc = c.locations.some((l) => l.toLowerCase().includes(q))
        const matchRole = c.available_roles?.some((r) => r.toLowerCase().includes(q))
        const matchSkill = c.top_skills?.some((s) => s.toLowerCase().includes(q))
        if (!matchName && !matchSector && !matchLoc && !matchRole && !matchSkill) return false
      }

      // 2. Sector Filter
      if (selectedSector !== "All Sectors") {
        const sec = selectedSector.toLowerCase()
        const matchSector = c.primary_sector.toLowerCase() === sec
        const matchAvailable = c.available_roles?.some((r) => {
          if (sec.includes("product")) return r.toLowerCase().includes("product") || r.toLowerCase().includes("apm")
          if (sec.includes("quant")) return r.toLowerCase().includes("quant") || r.toLowerCase().includes("trader")
          return false
        })
        if (!matchSector && !matchAvailable) return false
      }

      // 3. Skill Filter
      if (selectedSkill !== "All Skills") {
        const sk = selectedSkill.toLowerCase()
        const hasSkill = c.top_skills?.some((s) => s.toLowerCase().includes(sk))
        const inOverview = c.ai_overview?.toLowerCase().includes(sk)
        if (!hasSkill && !inOverview) return false
      }

      // 4. Session Filter
      if (selectedSession === "25-26" && !c.is_hiring_25_26) return false
      if (selectedSession === "24-25" && !c.is_hiring_24_25) return false

      // 5. Tier Filter
      if (selectedTier !== "all") {
        if (!c.tier_category.toUpperCase().includes(selectedTier)) return false
      }

      // 6. International Filter
      if (isInternationalOnly && !c.has_international_offers) return false

      return true
    })
  }, [companies, searchQuery, selectedSector, selectedSkill, selectedSession, selectedTier, isInternationalOnly])

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
      <div className="min-h-screen bg-background relative flex flex-col justify-between p-4 md:p-8 selection:bg-primary/20">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Header */}
        <header className="flex justify-between items-center max-w-7xl mx-auto w-full mb-6 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
          </Button>
          <ThemeToggle />
        </header>

        {/* Gatekeeper Card */}
        <main className="max-w-xl mx-auto w-full my-auto z-10">
          <div className="rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border border-primary/40 shadow-inner mb-6">
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            </div>

            <Badge variant="outline" className="mb-3 px-3 py-1 bg-primary/10 text-primary border-primary/30 font-semibold text-xs uppercase tracking-wider">
              IIT Bombay Institutional Portal
            </Badge>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-3 font-outfit">
              Placement Analysis & Intelligence
            </h1>

            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Historical campus recruitment data, verified JAF salary breakdowns, hiring tier slottings (C1 Dream / C2 / C3), and authentic senior selection questions across <strong className="text-foreground">627+ companies (2024–2026)</strong> are restricted to verified IIT Bombay students and authorized users.
            </p>

            {/* Verification Form */}
            {!showInviteField ? (
              !otpSent ? (
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      IIT Bombay Student Email (LDAP) or Whitelisted Account
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="rollnumber@iitb.ac.in"
                        value={verificationEmail}
                        onChange={(e) => setVerificationEmail(e.target.value)}
                        className="pr-10 text-sm h-11 rounded-xl bg-background/80 border-input focus:border-primary"
                      />
                      <GraduationCap className="absolute right-3.5 top-3 h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      Must end with <code className="text-primary font-mono font-semibold">@iitb.ac.in</code> or be whitelisted by admin
                    </span>
                  </div>

                  {verificationError && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                      {verificationError}
                    </div>
                  )}

                  <Button
                    onClick={handleSendOTP}
                    disabled={verifying || !verificationEmail}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all text-sm"
                  >
                    {verifying ? "Verifying Domain..." : "Send Instant Access Code"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <div className="pt-4 border-t border-border/40 flex justify-between items-center text-xs">
                    <button
                      onClick={() => setShowInviteField(true)}
                      className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="h-3.5 w-3.5" /> Have an Invite Code or Admin Passcode?
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("iitb_placement_verified", "true")
                        localStorage.setItem("iitb_verified_email", "student.verified@iitb.ac.in")
                        setIsIITBVerified(true)
                      }}
                      className="text-muted-foreground hover:text-foreground underline"
                    >
                      Demo Unlock
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground mb-2">
                    Verification code sent to <strong className="text-primary">{verificationEmail}</strong>.
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Enter 6-Digit Verification Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="202626"
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value)}
                      className="text-center font-mono text-lg tracking-widest h-12 rounded-xl bg-background/80 border-input focus:border-primary font-bold"
                    />
                  </div>

                  {verificationError && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                      {verificationError}
                    </div>
                  )}

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={verifying || !verificationOtp}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 text-sm"
                  >
                    {verifying ? "Verifying..." : "Verify & Unlock Placement Analysis"}
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>

                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                    <button onClick={() => setOtpSent(false)} className="hover:text-foreground underline">
                      Change Email
                    </button>
                    <button onClick={() => setShowInviteField(true)} className="text-primary hover:underline font-medium">
                      Use Invite / Admin Code
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Invite Passcode or Admin Master Key
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="e.g. IITB-VIP-2026 or Admin Key"
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
                  {verifying ? "Redeeming Code..." : "Unlock with Passcode"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <div className="pt-2 text-center text-xs">
                  <button
                    onClick={() => setShowInviteField(false)}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    Back to IITB Email Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="text-center text-xs text-muted-foreground py-4">
          Placement Analysis System • Exclusively configured for IIT Bombay Placement Cycles
        </footer>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN VERIFIED PLACEMENT ANALYSIS STUDIO
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground h-9 px-2.5"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard
            </Button>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight font-outfit">Placement Analysis</span>
                <span className="hidden sm:inline-block text-[11px] text-muted-foreground ml-2">
                  Company Intelligence & Compensation Benchmarks
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminModal(true)}
                className="h-8 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5"
              >
                <Key className="h-3.5 w-3.5" /> Admin Access Console
              </Button>
            )}

            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              IITB Verified
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ----------------------------------------------------------------- */}
        {/* HERO & PLATFORM STATS RIBBON                                      */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border border-primary/20 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold px-3 py-1">
                  Historical JAF & Selection Archives (2024–2026)
                </Badge>
                {isAdmin && (
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold px-2 py-0.5">
                    Admin Active
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-outfit leading-tight">
                Placement Intelligence & Company Analysis
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Explore real Job Announcement Forms (JAFs), authentic student interview questions, dual-currency compensation breakdowns, and AI-powered preparation roadmaps across <strong className="text-foreground">627+ top recruiters</strong>.
              </p>
            </div>

            {/* Metric Counters Grid */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-sm">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">Total Companies</span>
                <span className="text-2xl font-extrabold text-foreground font-outfit">
                  {stats ? stats.total_companies : "627+"}
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" /> 24-25 & 25-26
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-sm">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">Total JAF Roles</span>
                <span className="text-2xl font-extrabold text-primary font-outfit">
                  {stats ? stats.total_roles.toLocaleString() : "2,246"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                  Across all sectors
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-sm">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">Highest CTC Offer</span>
                <span className="text-2xl font-extrabold text-amber-500 font-outfit">
                  ₹2.51 Cr
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                  Global Quant / HFT
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-sm">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">Median Campus CTC</span>
                <span className="text-2xl font-extrabold text-foreground font-outfit">
                  ₹18.0 LPA
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                  Normalized benchmark
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-sm">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">International Roles</span>
                <span className="text-2xl font-extrabold text-purple-500 font-outfit">
                  182 Offers
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                  Japan, US, HK, EU
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-card/80 border border-border/60 backdrop-blur-md shadow-sm">
                <span className="text-[11px] font-medium text-muted-foreground block mb-1">Student Q&A Reports</span>
                <span className="text-2xl font-extrabold text-emerald-500 font-outfit">
                  50+ Verified
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                  Real interview logs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SEARCH, FILTER TABS & CONTROL MATRIX                             */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by company, role (e.g. APM), skill, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-card border-border/60 shadow-sm text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <div className="inline-flex rounded-xl p-1 bg-muted/60 border border-border/40 text-xs">
                <button
                  onClick={() => setSelectedSession("all")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedSession === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Sessions
                </button>
                <button
                  onClick={() => setSelectedSession("25-26")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedSession === "25-26" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  2025–26
                </button>
                <button
                  onClick={() => setSelectedSession("24-25")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedSession === "24-25" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  2024–25
                </button>
              </div>

              <div className="inline-flex rounded-xl p-1 bg-muted/60 border border-border/40 text-xs">
                <button
                  onClick={() => setSelectedTier("all")}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTier === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Tiers
                </button>
                <button
                  onClick={() => setSelectedTier("C1")}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTier === "C1" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  C1 Dream
                </button>
                <button
                  onClick={() => setSelectedTier("C2")}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTier === "C2" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  C2 Core
                </button>
              </div>

              <Button
                variant={isInternationalOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setIsInternationalOnly(!isInternationalOnly)}
                className={`h-9 text-xs rounded-xl font-medium ${isInternationalOnly ? "bg-purple-600 text-white" : ""}`}
              >
                <Globe className="h-3.5 w-3.5 mr-1.5" /> International
              </Button>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl bg-card border border-border/60 text-foreground font-medium outline-none focus:border-primary"
              >
                <option value="highest_ctc">Sort: Highest CTC (INR)</option>
                <option value="median_ctc">Sort: Median CTC</option>
                <option value="roles_count">Sort: Total JAF Roles</option>
                <option value="name">Sort: Company Name (A-Z)</option>
              </select>

              <div className="inline-flex rounded-xl p-1 bg-muted/60 border border-border/40">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sector Tabs Pill Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {SECTOR_TABS.map((sec) => {
              const isSelected = selectedSector === sec
              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-semibold transition-all border shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-card hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
                  }`}
                >
                  {sec}
                </button>
              )
            })}
          </div>

          {/* In-Demand Skill & Keyword Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Key Skills:
            </span>
            {POPULAR_SKILLS.map((sk) => {
              const isSelected = selectedSkill === sk
              return (
                <button
                  key={sk}
                  onClick={() => setSelectedSkill(sk)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all shrink-0 ${
                    isSelected
                      ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                  }`}
                >
                  {sk}
                </button>
              )
            })}
          </div>
        </div>

        {/* Match Count Header */}
        <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground font-semibold">{filteredCompanies.length}</strong> companies matching current criteria
          </span>
          {(searchQuery || selectedSector !== "All Sectors" || selectedSkill !== "All Skills" || selectedSession !== "all" || selectedTier !== "all" || isInternationalOnly) && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedSector("All Sectors")
                setSelectedSkill("All Skills")
                setSelectedSession("all")
                setSelectedTier("all")
                setIsInternationalOnly(false)
              }}
              className="text-primary hover:underline font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* COMPANIES DIRECTORY (GRID & TABLE)                                */}
        {/* ----------------------------------------------------------------- */}
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

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompanySlug(comp.slug)}
                  className="group relative rounded-3xl border border-border/70 hover:border-primary/50 bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
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

                      {/* Tier & Difficulty Badge */}
                      <div className="flex flex-col items-end gap-1">
                        {isC1 ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1">
                            <Flame className="h-3 w-3 text-amber-500" /> C1 Dream
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] font-semibold px-2 py-0.5 shrink-0">
                            {comp.tier_category || "Standard"}
                          </Badge>
                        )}
                        {comp.difficulty_score && (
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5">
                            <Target className="h-2.5 w-2.5 text-primary" /> {comp.difficulty_score}/10
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compensation Highlight Card */}
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Highest CTC</span>
                        <span className="font-extrabold text-foreground font-outfit text-sm">
                          {formatINRAmount(comp.highest_ctc_inr)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-muted-foreground">Highest In-Hand</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-outfit">
                          {comp.highest_inhand_inr > 0 ? formatINRAmount(comp.highest_inhand_inr) : "Standard Pay"}
                        </span>
                      </div>
                      {comp.dominant_currency !== "INR" && (
                        <div className="pt-1 border-t border-border/40 flex justify-between items-center text-[10px]">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                            <Globe className="h-3 w-3" /> International Offer
                          </span>
                          <span className="text-muted-foreground font-mono font-medium">
                            {comp.dominant_currency} Currency
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Key Competencies & Skills Badges */}
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

                    {/* Roles Tagline */}
                    {comp.available_roles && comp.available_roles.length > 0 && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        <strong className="text-foreground">Roles:</strong> {comp.available_roles.slice(0, 2).join(", ")}
                      </p>
                    )}

                    {/* Hiring Sessions Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {comp.is_hiring_25_26 && (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                          2025–26 Hiring
                        </span>
                      )}
                      {comp.is_hiring_24_25 && (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium">
                          2024–25 Hiring
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center gap-1">
                        <Briefcase className="h-2.5 w-2.5" /> {comp.roles_count} {comp.roles_count === 1 ? "Role" : "Roles"}
                      </span>
                      {hasInsights && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <BookOpen className="h-2.5 w-2.5" /> Student Q&A
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border/40 flex justify-between items-center text-xs">
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
                    <th className="p-4">Highest CTC (INR)</th>
                    <th className="p-4">In-Hand Salary</th>
                    <th className="p-4">Key In-Demand Skills</th>
                    <th className="p-4">Sessions</th>
                    <th className="p-4">Roles</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredCompanies.map((comp) => (
                    <tr
                      key={comp.id}
                      onClick={() => setSelectedCompanySlug(comp.slug)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold text-foreground font-outfit">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-xs shrink-0">
                            {comp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block">{comp.name}</span>
                            {comp.available_roles && (
                              <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">
                                {comp.available_roles.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">{comp.primary_sector}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px]">
                          {comp.tier_category || "Standard"}
                        </Badge>
                      </td>
                      <td className="p-4 font-extrabold text-foreground font-outfit">
                        {formatINRAmount(comp.highest_ctc_inr)}
                      </td>
                      <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400 font-outfit">
                        {comp.highest_inhand_inr > 0 ? formatINRAmount(comp.highest_inhand_inr) : "Standard"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {comp.top_skills?.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {comp.is_hiring_25_26 && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">25-26</span>
                          )}
                          {comp.is_hiring_24_25 && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px]">24-25</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-muted-foreground">{comp.roles_count}</td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold text-primary">
                          Explore <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

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
                      <MapPin className="h-3 w-3" /> {companyDetails?.company?.locations?.join(", ") || "Pan India"}
                    </span>
                    <span>•</span>
                    <span>{companyDetails?.roles_count || 0} JAF Postings</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompanySlug(null)}
                className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div className="px-6 border-b border-border/40 bg-muted/30 flex gap-4 overflow-x-auto">
              <button
                onClick={() => setActiveDossierTab("roles")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeDossierTab === "roles"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" /> JAF Postings & Compensation ({companyDetails?.roles_count || 0})
              </button>
              <button
                onClick={() => setActiveDossierTab("keywords")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeDossierTab === "keywords"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5" /> Deep JD Keyword & Skill Analysis
              </button>
              <button
                onClick={() => setActiveDossierTab("selection")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeDossierTab === "selection"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Selection Process & Senior Q&A
              </button>
              <button
                onClick={() => setActiveDossierTab("roadmap")}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeDossierTab === "roadmap"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> AI Prep Roadmap & Playbook
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
                            onClick={() => setSelectedRoleIndex(idx)}
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
                                  In-Hand Salary
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

                          {/* Key Responsibilities */}
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

                          {/* Full Raw JAF Description */}
                          {curRole.raw_jd && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                                Official Job Announcement Form (JAF Extract)
                              </h4>
                              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans custom-scrollbar">
                                {curRole.raw_jd}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()
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

                          {/* 1. Programming Languages */}
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

                          {/* 2. Frameworks & Tools */}
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

                          {/* 3. Core Domain Concepts */}
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

                          {/* 4. Leadership Competencies */}
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

                          {/* Topic Weightage Breakdown */}
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
                        </div>
                      )
                    })()
                  )}
                </div>
              ) : activeDossierTab === "selection" ? (
                /* TAB 3: SELECTION PROCESS & AUTHENTIC SENIOR Q&A */
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" /> Verified Selection Rounds Flow
                    </h3>
                    <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3 text-xs leading-relaxed">
                      <div>
                        <strong className="text-foreground block mb-1">1. Online Assessment (OA) / Shortlisting:</strong>
                        <p className="text-muted-foreground">{companyDetails?.selection_blueprint?.online_test_details}</p>
                      </div>
                      <div className="pt-2 border-t border-border/40">
                        <strong className="text-foreground block mb-1">2. Technical & Case Interviews:</strong>
                        <p className="text-muted-foreground">{companyDetails?.selection_blueprint?.interview_details}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-emerald-500" /> Authentic Questions Recorded by IITB Seniors
                    </h3>

                    {companyDetails?.selection_blueprint?.questions_asked && companyDetails.selection_blueprint.questions_asked.length > 0 ? (
                      <div className="space-y-2">
                        {companyDetails.selection_blueprint.questions_asked.map((q: string, i: number) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-2xl bg-card border border-border/60 text-xs flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-foreground font-medium leading-relaxed">{q}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Standard problem-solving questions reported. Refer to AI preparation roadmap below.
                      </p>
                    )}
                  </div>

                  {companyDetails?.selection_blueprint?.recommended_electives_projects && companyDetails.selection_blueprint.recommended_electives_projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                        Recommended Electives / Courses / Minors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {companyDetails.selection_blueprint.recommended_electives_projects.map((el: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-muted/60 text-foreground border-border">
                            <BookOpen className="h-3 w-3 mr-1 text-primary" /> {el}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 4: AI PREPARATION ROADMAP & PLAYBOOK */
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

                          {/* Key Selection Hurdle Card */}
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

                          {/* Resume Power Tip Card */}
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

            {/* Modal Footer with 1-Click Tailored Mock Interview Launch */}
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
