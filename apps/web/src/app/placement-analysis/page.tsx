"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  CommandNav,
  CommandHero,
  KpiMetricGrid,
  KpiMetricCard,
  SegmentedTabs,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton, CardListSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Building2,
  BookmarkCheck,
  BarChart3,
  Flame,
  Award,
  Briefcase,
  Globe,
  CheckCircle2,
  Key,
} from "lucide-react";
import {
  Company,
  PlacementRole,
  CRMCompanyItem,
  CRMMilestone,
  PlatformStats,
  WhitelistedUser,
  ResumeMatchResult,
  SalaryBreakdownResult,
  PlacementLockGate,
  PlacementAdminModal,
  PlacementFilterBar,
  PlacementCompanyCard,
  PlacementTableView,
  PlacementComparisonDock,
  PlacementComparisonModal,
  PlacementDossierModal,
  PlacementCRMView,
  PlacementAnalyticsView,
} from "@/components/placement-analysis";

export default function PlacementAnalysisPage() {
  const router = useRouter();
  const { user, setTargetCompany } = useAuthStore();

  // Top Section Switcher
  const [activeMainTab, setActiveMainTab] = useState<"directory" | "crm" | "analytics">("directory");

  // Authorization state
  const [isIITBVerified, setIsIITBVerified] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [invitePasscode, setInvitePasscode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Admin Modal & Management State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsers, setAdminUsers] = useState<WhitelistedUser[]>([]);
  const [adminInviteCodes, setAdminInviteCodes] = useState<string[]>([]);
  const [newGrantEmail, setNewGrantEmail] = useState("");
  const [newGrantNotes, setNewGrantNotes] = useState("");
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Macro Trends Analytics state
  const [macroAnalytics, setMacroAnalytics] = useState<any | null>(null);
  const [loadingMacro, setLoadingMacro] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedSkill, setSelectedSkill] = useState("All Skills");
  const [selectedSession, setSelectedSession] = useState<"all" | "25-26_p1" | "25-26_p2" | "25-26" | "24-25">("all");
  const [selectedTier, setSelectedTier] = useState<"all" | "C1" | "C2" | "C3">("all");
  const [selectedDaySlot, setSelectedDaySlot] = useState<string>("All Slots");
  const [isInternationalOnly, setIsInternationalOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"highest_ctc" | "median_ctc" | "roles_count" | "name">("highest_ctc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected Company Dossier Modal
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<"roles" | "keywords" | "resumematch" | "selection" | "roadmap">("roles");
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  // Comparison State
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Resume Matcher State
  const [customResumeText, setCustomResumeText] = useState("");
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(null);
  const [matchingResume, setMatchingResume] = useState(false);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);
  const [copiedJd, setCopiedJd] = useState(false);
  const [isJdExpanded, setIsJdExpanded] = useState(false);

  // Salary Breakdown State
  const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdownResult | null>(null);

  // CRM State
  const [crmItems, setCrmItems] = useState<CRMCompanyItem[]>([]);
  const [crmFilterMilestone, setCrmFilterMilestone] = useState<string>("all");
  const [editingNotesSlug, setEditingNotesSlug] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  // Load CRM state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iitb_placement_crm_items");
      if (saved) {
        setCrmItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load CRM items from localStorage", err);
    }
  }, []);

  // Save CRM state to localStorage
  const saveCrmItems = (items: CRMCompanyItem[]) => {
    setCrmItems(items);
    try {
      localStorage.setItem("iitb_placement_crm_items", JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save CRM items", err);
    }
  };

  // Toggle Bookmark / Add to CRM
  const handleToggleCRM = (comp: Company, priority: "dream" | "target" | "backup" = "target") => {
    const existing = crmItems.find((x) => x.slug === comp.slug);
    if (existing) {
      const updated = crmItems.filter((x) => x.slug !== comp.slug);
      saveCrmItems(updated);
    } else {
      const effectiveCTC = comp.display_highest_ctc_inr || comp.highest_ctc_inr;
      const newItem: CRMCompanyItem = {
        slug: comp.slug,
        company_name: comp.name,
        sector: comp.primary_sector,
        tier: comp.tier_category,
        highest_ctc_inr: effectiveCTC,
        priority: priority,
        milestone: "interested",
        notes: "",
        added_at: new Date().toISOString(),
      };
      saveCrmItems([newItem, ...crmItems]);
    }
  };

  // Update CRM Milestone
  const handleUpdateCRMMilestone = (slug: string, milestone: CRMMilestone) => {
    const updated = crmItems.map((item) => {
      if (item.slug === slug) {
        return { ...item, milestone };
      }
      return item;
    });
    saveCrmItems(updated);
  };

  // Update CRM Notes
  const handleSaveCRMNotes = (slug: string) => {
    const updated = crmItems.map((item) => {
      if (item.slug === slug) {
        return { ...item, notes: tempNotes };
      }
      return item;
    });
    saveCrmItems(updated);
    setEditingNotesSlug(null);
  };

  const handleDeleteCRMItem = (slug: string) => {
    const updated = crmItems.filter((x) => x.slug !== slug);
    saveCrmItems(updated);
  };

  // Check IITB verification from user profile / localStorage
  useEffect(() => {
    const checkAuth = () => {
      if (user?.email) {
        const email = user.email.toLowerCase();
        if (
          email === "krishnagahlod@gmail.com" ||
          email === "creator@internprep.ai" ||
          email.includes("admin")
        ) {
          setIsIITBVerified(true);
          setIsAdmin(true);
          return;
        }
      }

      const savedAdmin = localStorage.getItem("iitb_placement_admin");
      const savedVerification = localStorage.getItem("iitb_placement_verified");
      if (savedAdmin === "true") {
        setIsIITBVerified(true);
        setIsAdmin(true);
        return;
      }
      if (savedVerification === "true") {
        setIsIITBVerified(true);
        return;
      }

      setIsIITBVerified(false);
    };

    checkAuth();
  }, [user]);

  // Deterministic in-hand monthly salary extractor / calculator
  const getSalaryBreakdownForRole = (role: any): SalaryBreakdownResult | null => {
    if (!role) return null;
    const ctc = role.compensation?.ctc_inr_equivalent || 0;
    const sb = role.compensation?.salary_breakdown;
    if (sb) {
      return {
        ctc_inr: sb.ctc_inr || ctc,
        base_pay_annual: sb.base_annual_inr || Math.round(ctc * 0.7),
        variable_bonus_annual: sb.variable_annual_inr || 0,
        esops_annual: sb.esop_annual_inr || 0,
        estimated_monthly_gross:
          sb.monthly_gross_inr || Math.round((sb.base_annual_inr || ctc * 0.7) / 12),
        estimated_monthly_net_inhand:
          sb.monthly_inhand_inr || Math.round((ctc * 0.65) / 12),
        estimated_annual_tax: sb.annual_tax_inr || 0,
        estimated_annual_epf: sb.annual_epf_inr || 21600,
        vesting_schedule: "Standard 4-year equal vesting with 1-year cliff",
      };
    }
    const base =
      role.compensation?.inhand_inr_equivalent > 0
        ? role.compensation.inhand_inr_equivalent
        : Math.round(ctc * 0.7);
    const monthlyNet = Math.round((base * 0.85) / 12);
    return {
      ctc_inr: ctc,
      base_pay_annual: base,
      variable_bonus_annual: Math.round(ctc * 0.15),
      esops_annual: Math.max(0, ctc - base - Math.round(ctc * 0.15)),
      estimated_monthly_gross: Math.round(base / 12),
      estimated_monthly_net_inhand: monthlyNet,
      estimated_annual_tax: Math.round(base * 0.15),
      estimated_annual_epf: 21600,
      vesting_schedule: "Standard 4-year equal vesting with 1-year cliff",
    };
  };

  // Fetch placement data from API (Single initial load, filtered instantly in client memory)
  const fetchPlacementData = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const statsRes = await fetch(`${API_URL}/placement-analysis/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const companiesRes = await fetch(
        `${API_URL}/placement-analysis/companies?page=1&page_size=1000&sort_by=highest_ctc`
      );
      if (!companiesRes.ok) throw new Error("Failed to load placement companies.");

      const compData = await companiesRes.json();
      setCompanies(compData.companies || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to placement intelligence server.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Macro Analytics
  const fetchMacroAnalytics = async () => {
    setLoadingMacro(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/placement-analysis/analytics/macro-trends`);
      if (res.ok) {
        const data = await res.json();
        setMacroAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load macro analytics", err);
    } finally {
      setLoadingMacro(false);
    }
  };

  // Initial fetch on verified status
  useEffect(() => {
    if (isIITBVerified && companies.length === 0) {
      fetchPlacementData();
    }
    if (isIITBVerified && activeMainTab === "analytics" && !macroAnalytics) {
      fetchMacroAnalytics();
    }
  }, [isIITBVerified, activeMainTab]);

  // Fetch Company Dossier when modal opens
  useEffect(() => {
    if (!selectedCompanySlug) {
      setCompanyDetails(null);
      setMatchResult(null);
      setSalaryBreakdown(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/placement-analysis/company/${selectedCompanySlug}`);
        if (res.ok) {
          const data = await res.json();
          setCompanyDetails(data);
          setSelectedRoleIndex(0);

          if (data.roles && data.roles[0]) {
            setSalaryBreakdown(getSalaryBreakdownForRole(data.roles[0]));
          }
        }
      } catch (err) {
        console.error("Error fetching company details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedCompanySlug]);

  // Instant Salary Breakdown for selected role
  const fetchSalaryBreakdown = (roleId: string) => {
    if (companyDetails?.roles) {
      const targetRole =
        companyDetails.roles.find((r: any) => r.id === roleId) || companyDetails.roles[0];
      if (targetRole) {
        setSalaryBreakdown(getSalaryBreakdownForRole(targetRole));
      }
    }
  };

  // Handle Resume Matching
  const handleMatchResume = async (roleId: string) => {
    setMatchingResume(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/placement-analysis/match-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: roleId,
          resume_text:
            customResumeText.trim() ||
            "Designed and optimized scalable systems with Python, C++, SQL, Kafka, Docker and A/B testing.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchResult(data);
      }
    } catch (err) {
      console.error("Failed to match resume:", err);
    } finally {
      setMatchingResume(false);
    }
  };

  // Handle Compare Toggle
  const handleToggleCompare = (slug: string) => {
    setComparedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, slug];
      }
    });
  };

  // Open Comparison Modal
  const handleOpenComparison = async () => {
    if (comparedSlugs.length < 2) return;
    setLoadingComparison(true);
    setShowCompareModal(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${API_URL}/placement-analysis/compare?slugs=${comparedSlugs.join(",")}`
      );
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
      }
    } catch (err) {
      console.error("Failed to load comparison data:", err);
    } finally {
      setLoadingComparison(false);
    }
  };

  // Fetch Admin Users list
  const fetchAdminData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const adminKey = user?.email || "krishnagahlod@gmail.com";
      const res = await fetch(
        `${API_URL}/placement-analysis/admin/users?admin_key=${encodeURIComponent(adminKey)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.whitelisted_users || []);
        setAdminInviteCodes(data.invite_codes || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  useEffect(() => {
    if (showAdminModal && isAdmin) {
      fetchAdminData();
    }
  }, [showAdminModal, isAdmin]);

  // Redeem Invite / Admin Key
  const handleRedeemInviteOrAdmin = async () => {
    setVerificationError("");
    const code = invitePasscode.trim();
    if (!code) {
      setVerificationError("Please enter an invite code or admin master key.");
      return;
    }

    setVerifying(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/placement-analysis/redeem-invite-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.is_iitb_verified) {
        localStorage.setItem("iitb_placement_verified", "true");
        localStorage.setItem("iitb_verified_email", data.email);
        if (data.is_admin || code.toUpperCase().includes("ADMIN")) {
          localStorage.setItem("iitb_placement_admin", "true");
          setIsAdmin(true);
        }
        setIsIITBVerified(true);
      } else {
        setVerificationError(data.detail || "Invalid code. Please check and try again.");
      }
    } catch (err) {
      setVerificationError("Verification service temporarily unavailable.");
    } finally {
      setVerifying(false);
    }
  };

  // Admin Actions: Grant Access
  const handleAdminGrantAccess = async () => {
    if (!newGrantEmail.trim() || !newGrantEmail.includes("@")) {
      setAdminActionMsg("Please enter a valid email address.");
      return;
    }

    setAdminActionLoading(true);
    setAdminActionMsg("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const adminKey = user?.email || "krishnagahlod@gmail.com";
      const res = await fetch(`${API_URL}/placement-analysis/admin/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email_or_key: adminKey,
          target_email: newGrantEmail.trim().toLowerCase(),
          notes: newGrantNotes.trim() || "Granted by Admin",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionMsg(`Access granted to ${newGrantEmail}!`);
        setNewGrantEmail("");
        setNewGrantNotes("");
        fetchAdminData();
      } else {
        setAdminActionMsg(data.detail || "Failed to grant access.");
      }
    } catch (err) {
      setAdminActionMsg("Error granting access.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Admin Actions: Revoke Access
  const handleAdminRevokeAccess = async (targetEmail: string) => {
    setAdminActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const adminKey = user?.email || "krishnagahlod@gmail.com";
      const res = await fetch(`${API_URL}/placement-analysis/admin/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email_or_key: adminKey,
          target_email: targetEmail,
        }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Admin Actions: Generate Invite Code
  const handleAdminGenerateCode = async () => {
    setAdminActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const adminKey = user?.email || "krishnagahlod@gmail.com";
      const res = await fetch(`${API_URL}/placement-analysis/admin/create-invite-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email_or_key: adminKey }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invite passcode copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Copy Bullet Point
  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIdx(idx);
    toast.success("Bullet point copied to clipboard!");
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  // 1-Click Printable / Shareable PDF Export
  const handlePrintDossierPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Format INR Currency
  const formatINRAmount = (amt: number) => {
    if (!amt || amt <= 0) return "N/A";
    if (amt >= 10000000) {
      return `₹${(amt / 10000000).toFixed(2)} Cr`;
    } else {
      return `₹${(amt / 100000).toFixed(1)} LPA`;
    }
  };

  // Format Original Currency
  const formatOriginalSalary = (role: PlacementRole) => {
    const comp = role.compensation;
    const curr = comp.original_currency;
    const med = comp.ctc_median;
    if (!med || med <= 0) return "Not Disclosed";

    if (curr === "INR") {
      return formatINRAmount(med);
    } else if (curr === "USD") {
      return `$${med.toLocaleString()} USD`;
    } else if (curr === "JPY") {
      return `¥${(med / 1000000).toFixed(2)}M JPY`;
    } else if (curr === "EUR") {
      return `€${med.toLocaleString()} EUR`;
    } else if (curr === "GBP") {
      return `£${med.toLocaleString()} GBP`;
    } else if (curr === "SGD") {
      return `S$${med.toLocaleString()} SGD`;
    } else if (curr === "AED") {
      return `${med.toLocaleString()} AED`;
    }
    return `${med.toLocaleString()} ${curr}`;
  };

  // Filtered & Sorted Companies (100% Client-Side Instant Evaluation)
  const filteredCompanies = useMemo(() => {
    const list = companies.filter((c) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName =
          c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
        const matchSector = c.primary_sector.toLowerCase().includes(q);
        const matchLoc = c.locations?.some((l) => l.toLowerCase().includes(q));
        const matchRole =
          (c.role_offers || []).some(
            (r) =>
              r.job_title.toLowerCase().includes(q) ||
              r.location.toLowerCase().includes(q)
          ) || (c.available_roles || []).some((r) => r.toLowerCase().includes(q));
        const matchSkill =
          c.top_skills?.some((s) => s.toLowerCase().includes(q)) ||
          (c.role_offers || []).some((r) =>
            r.required_skills?.some((sk) => sk.toLowerCase().includes(q))
          );
        if (!matchName && !matchSector && !matchLoc && !matchRole && !matchSkill)
          return false;
      }

      // 2. Sector filter
      if (selectedSector !== "All Sectors") {
        const secLower = selectedSector.toLowerCase();
        const matchCompSector =
          c.primary_sector &&
          (c.primary_sector.toLowerCase() === secLower ||
            c.primary_sector.toLowerCase().includes(secLower));
        const matchRoleSector = (c.role_offers || []).some(
          (r) =>
            r.primary_sector &&
            (r.primary_sector.toLowerCase() === secLower ||
              r.primary_sector.toLowerCase().includes(secLower))
        );
        if (!matchCompSector && !matchRoleSector) {
          return false;
        }
      }

      // 3. Session filter
      if (selectedSession !== "all") {
        if (selectedSession === "24-25") {
          const match24 =
            c.has_24_25 ||
            c.is_hiring_24_25 ||
            (c.role_offers || []).some(
              (r) =>
                r.session_sheet?.includes("24-25") ||
                r.session_label?.includes("2024")
            );
          if (!match24) return false;
        }
        if (selectedSession === "25-26") {
          const match25 =
            c.has_phase_1 ||
            c.has_phase_2 ||
            c.is_hiring_25_26 ||
            (c.role_offers || []).some(
              (r) =>
                r.session_sheet?.includes("25-26") ||
                r.session_label?.includes("2025")
            );
          if (!match25) return false;
        }
        if (selectedSession === "25-26_p1") {
          const matchP1 =
            c.has_phase_1 ||
            (c.role_offers || []).some(
              (r) =>
                r.session_sheet?.includes("25-26 s1") ||
                r.session_label?.toLowerCase().includes("phase 1")
            );
          if (!matchP1) return false;
        }
        if (selectedSession === "25-26_p2") {
          const matchP2 =
            c.has_phase_2 ||
            (c.role_offers || []).some(
              (r) =>
                r.session_sheet?.includes("25-26 s2") ||
                r.session_label?.toLowerCase().includes("phase 2")
            );
          if (!matchP2) return false;
        }
      }

      // 4. In-Demand Skill filter
      if (selectedSkill !== "All Skills") {
        const sk = selectedSkill.toLowerCase();
        const hasSkill = c.top_skills?.some((s) => s.toLowerCase().includes(sk));
        const inRoleSkills = (c.role_offers || []).some(
          (r) =>
            r.required_skills?.some((rsk) => rsk.toLowerCase().includes(sk)) ||
            r.job_title.toLowerCase().includes(sk)
        );
        const inOverview = c.ai_overview?.toLowerCase().includes(sk);
        const inAvailableRoles = (c.available_roles || []).some((ar) =>
          ar.toLowerCase().includes(sk)
        );
        if (!hasSkill && !inRoleSkills && !inOverview && !inAvailableRoles)
          return false;
      }

      // 5. Tier filter
      if (selectedTier !== "all") {
        const tUpper = selectedTier.toUpperCase();
        const compTier = (c.tier_category || "").toUpperCase();
        const roleTier = (c.role_offers || []).some((r) =>
          (r.category_tier || "").toUpperCase().includes(tUpper)
        );
        if (!compTier.includes(tUpper) && !roleTier) return false;
      }

      // 6. International filter
      if (isInternationalOnly && !c.has_international_offers) return false;

      // 7. Day Slotting filter
      if (selectedDaySlot !== "All Slots") {
        const slot = (
          c.placement_slot ||
          c.hiring_funnel_intelligence?.placement_slot ||
          ""
        ).toLowerCase();
        const recordedSlots = (
          c.hiring_funnel_intelligence?.slots_recorded || []
        )
          .map((s: string) => s.toLowerCase())
          .join(" ");
        const fullSlotText = `${slot} ${recordedSlots}`;

        if (selectedDaySlot === "Day 1.1" && !fullSlotText.includes("day 1.1"))
          return false;
        if (selectedDaySlot === "Day 1.2" && !fullSlotText.includes("day 1.2"))
          return false;
        if (selectedDaySlot === "Day 2.1" && !fullSlotText.includes("day 2.1"))
          return false;
        if (selectedDaySlot === "Day 2.2" && !fullSlotText.includes("day 2.2"))
          return false;
        if (selectedDaySlot === "Day 2" && !fullSlotText.includes("day 2"))
          return false;
        if (
          (selectedDaySlot === "Day 3–5" || selectedDaySlot === "Day 3-5") &&
          !(
            fullSlotText.includes("day 3") ||
            fullSlotText.includes("day 4") ||
            fullSlotText.includes("day 5")
          )
        )
          return false;
        if (
          selectedDaySlot === "Day 6+" &&
          !/day\s*(6|7|8|9|10|11|12|13|14|15)/i.test(fullSlotText)
        )
          return false;
      }

      return true;
    });

    // 8. Sort
    return list.sort((a, b) => {
      if (sortBy === "highest_ctc") {
        const aCtc = a.display_highest_ctc_inr || a.highest_ctc_inr || 0;
        const bCtc = b.display_highest_ctc_inr || b.highest_ctc_inr || 0;
        return bCtc - aCtc;
      } else if (sortBy === "median_ctc") {
        return (b.median_ctc_inr || 0) - (a.median_ctc_inr || 0);
      } else if (sortBy === "roles_count") {
        return (b.roles_count || 0) - (a.roles_count || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [
    companies,
    searchQuery,
    selectedSector,
    selectedSession,
    selectedSkill,
    selectedTier,
    selectedDaySlot,
    isInternationalOnly,
    sortBy,
  ]);

  // Filtered CRM Items
  const filteredCrmItems = useMemo(() => {
    if (crmFilterMilestone === "all") return crmItems;
    return crmItems.filter((item) => item.milestone === crmFilterMilestone);
  }, [crmItems, crmFilterMilestone]);

  // Launch Tailored Mock Interview Hand-off
  const handleLaunchMockInterview = async (
    company: Company,
    role?: PlacementRole
  ) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/placement-analysis/launch-mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_slug: company.slug,
          role_id: role?.id,
          interview_type: "comprehensive",
        }),
      });

      if (res.ok) {
        const blueprint = await res.json();
        setTargetCompany(company.name);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "custom_mock_blueprint",
            JSON.stringify(blueprint)
          );
        }
        router.push(
          `/interview?company=${encodeURIComponent(
            company.name
          )}&sector=${encodeURIComponent(company.primary_sector)}`
        );
      }
    } catch (err) {
      console.error("Failed to prepare tailored interview:", err);
      router.push(`/interview?company=${encodeURIComponent(company.name)}`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSector("All Sectors");
    setSelectedSkill("All Skills");
    setSelectedSession("all");
    setSelectedTier("all");
    setIsInternationalOnly(false);
    setSelectedDaySlot("All Slots");
  };

  // 1. INSTITUTIONAL LOCK SCREEN (IF NOT VERIFIED)
  if (!isIITBVerified) {
    return (
      <PlacementLockGate
        invitePasscode={invitePasscode}
        setInvitePasscode={setInvitePasscode}
        verifying={verifying}
        verificationError={verificationError}
        onUnlock={handleRedeemInviteOrAdmin}
      />
    );
  }

  // 2. MAIN VERIFIED PLACEMENT ANALYSIS STUDIO
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
                className="h-8 text-xs font-mono-tech font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 rounded-xl cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" /> Admin Console
              </Button>
            )}
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono-tech font-semibold flex items-center gap-1.5 px-2.5 py-1"
            >
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
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech text-[10px] font-bold flex items-center gap-1.5 px-2.5 py-0.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                627 VERIFIED RECRUITERS
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-mono-tech text-[10px] font-medium px-2.5 py-0.5"
              >
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
                  {
                    id: "crm",
                    label: "Placement CRM",
                    icon: BookmarkCheck,
                    count: crmItems.length,
                  },
                  { id: "analytics", label: "Macro Trends", icon: BarChart3 },
                ]}
                activeTab={activeMainTab}
                onChange={(k) =>
                  setActiveMainTab(k as "directory" | "crm" | "analytics")
                }
              />
            </div>
          }
        />

        {/* METRIC COUNTERS GRID */}
        <KpiMetricGrid columns={6}>
          <KpiMetricCard
            label={
              selectedSector !== "All Sectors"
                ? "Sector Highest CTC"
                : "Highest CTC Offer"
            }
            value={
              stats?.highest_ctc_inr
                ? formatINRAmount(stats.highest_ctc_inr)
                : "₹2.51 Cr"
            }
            subtext="Dual-Currency Peak"
            icon={Flame}
            badge="Day 1 Peak"
            badgeVariant="amber"
            accentColor="amber"
          />
          <KpiMetricCard
            label={
              selectedSector !== "All Sectors"
                ? "Sector Median CTC"
                : "Median Campus CTC"
            }
            value={
              stats?.median_ctc_inr
                ? formatINRAmount(stats.median_ctc_inr)
                : "₹18.0 LPA"
            }
            subtext="IITB Campus Median"
            icon={Award}
            badge="Benchmark"
            badgeVariant="emerald"
            accentColor="emerald"
          />
          <KpiMetricCard
            label={
              selectedSector !== "All Sectors"
                ? `${selectedSector} Firms`
                : "Verified Firms"
            }
            value={stats ? stats.total_companies : "627+"}
            subtext="Day 1 to Phase 2"
            icon={Building2}
            badge="Directory"
            badgeVariant="blue"
            accentColor="blue"
          />
          <KpiMetricCard
            label={
              selectedSector !== "All Sectors"
                ? `${selectedSector} Roles`
                : "Total JAF Roles"
            }
            value={stats ? stats.total_roles.toLocaleString() : "2,246"}
            subtext="Across All Sectors"
            icon={Briefcase}
            badge="JAFs"
            badgeVariant="indigo"
            accentColor="indigo"
          />
          <KpiMetricCard
            label="International Roles"
            value={
              stats ? `${stats.international_offers_count} Offers` : "182 Offers"
            }
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

        {/* VIEW 1: COMPANY DIRECTORY & JAFS */}
        {activeMainTab === "directory" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PlacementFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              selectedSkill={selectedSkill}
              setSelectedSkill={setSelectedSkill}
              selectedSession={selectedSession}
              setSelectedSession={setSelectedSession}
              selectedTier={selectedTier}
              setSelectedTier={setSelectedTier}
              selectedDaySlot={selectedDaySlot}
              setSelectedDaySlot={setSelectedDaySlot}
              isInternationalOnly={isInternationalOnly}
              setIsInternationalOnly={setIsInternationalOnly}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              matchCount={filteredCompanies.length}
              onResetFilters={handleResetFilters}
            />

            {loading ? (
              viewMode === "grid" ? (
                <CardListSkeleton count={6} />
              ) : (
                <TableSkeleton rows={8} cols={6} />
              )
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-dashed border-border/80 bg-card/40 p-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold text-foreground">
                  No matching companies found
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4 font-mono-tech">
                  Try adjusting your search keywords, sector selection, or skill filters.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="font-mono-tech cursor-pointer"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCompanies.map((comp) => (
                  <PlacementCompanyCard
                    key={comp.id}
                    company={comp}
                    selectedSector={selectedSector}
                    isCompared={comparedSlugs.includes(comp.slug)}
                    isBookmarked={crmItems.some((x) => x.slug === comp.slug)}
                    onSelectCompany={setSelectedCompanySlug}
                    onToggleCRM={handleToggleCRM}
                    onToggleCompare={handleToggleCompare}
                    formatINRAmount={formatINRAmount}
                  />
                ))}
              </div>
            ) : (
              <PlacementTableView
                companies={filteredCompanies}
                selectedSector={selectedSector}
                comparedSlugs={comparedSlugs}
                crmItems={crmItems}
                onSelectCompany={setSelectedCompanySlug}
                onToggleCRM={handleToggleCRM}
                onToggleCompare={handleToggleCompare}
                formatINRAmount={formatINRAmount}
              />
            )}
          </div>
        )}

        {/* VIEW 2: PERSONAL PLACEMENT CRM */}
        {activeMainTab === "crm" && (
          <PlacementCRMView
            crmItems={crmItems}
            filteredCrmItems={filteredCrmItems}
            crmFilterMilestone={crmFilterMilestone}
            setCrmFilterMilestone={setCrmFilterMilestone}
            editingNotesSlug={editingNotesSlug}
            setEditingNotesSlug={setEditingNotesSlug}
            tempNotes={tempNotes}
            setTempNotes={setTempNotes}
            onSelectCompany={setSelectedCompanySlug}
            onUpdateMilestone={handleUpdateCRMMilestone}
            onSaveNotes={handleSaveCRMNotes}
            onDeleteCRMItem={handleDeleteCRMItem}
            onGoToDirectory={() => setActiveMainTab("directory")}
            formatINRAmount={formatINRAmount}
          />
        )}

        {/* VIEW 3: MACRO PLACEMENT ANALYTICS */}
        {activeMainTab === "analytics" && (
          <PlacementAnalyticsView
            macroAnalytics={macroAnalytics}
            loadingMacro={loadingMacro}
            onSelectCompany={setSelectedCompanySlug}
            formatINRAmount={formatINRAmount}
          />
        )}
      </main>

      {/* FLOATING COMPARISON DOCK */}
      <PlacementComparisonDock
        comparedSlugs={comparedSlugs}
        companies={companies}
        onClear={() => setComparedSlugs([])}
        onOpenModal={handleOpenComparison}
      />

      {/* SIDE-BY-SIDE COMPARISON MODAL */}
      <PlacementComparisonModal
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        loading={loadingComparison}
        comparisonData={comparisonData}
        onSelectCompany={setSelectedCompanySlug}
        formatINRAmount={formatINRAmount}
      />

      {/* ADMIN ACCESS CONTROL MODAL */}
      <PlacementAdminModal
        open={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        adminUsers={adminUsers}
        adminInviteCodes={adminInviteCodes}
        newGrantEmail={newGrantEmail}
        setNewGrantEmail={setNewGrantEmail}
        newGrantNotes={newGrantNotes}
        setNewGrantNotes={setNewGrantNotes}
        adminActionLoading={adminActionLoading}
        adminActionMsg={adminActionMsg}
        copiedCode={copiedCode}
        onGrantAccess={handleAdminGrantAccess}
        onRevokeAccess={handleAdminRevokeAccess}
        onGenerateCode={handleAdminGenerateCode}
        onCopyCode={handleCopyCode}
      />

      {/* COMPANY DOSSIER MODAL */}
      <PlacementDossierModal
        selectedCompanySlug={selectedCompanySlug}
        onClose={() => setSelectedCompanySlug(null)}
        loadingDetails={loadingDetails}
        companyDetails={companyDetails}
        activeDossierTab={activeDossierTab}
        setActiveDossierTab={setActiveDossierTab}
        selectedRoleIndex={selectedRoleIndex}
        setSelectedRoleIndex={setSelectedRoleIndex}
        salaryBreakdown={salaryBreakdown}
        fetchSalaryBreakdown={fetchSalaryBreakdown}
        matchingResume={matchingResume}
        matchResult={matchResult}
        handleMatchResume={handleMatchResume}
        copiedBulletIdx={copiedBulletIdx}
        handleCopyBullet={handleCopyBullet}
        copiedJd={copiedJd}
        setCopiedJd={setCopiedJd}
        isJdExpanded={isJdExpanded}
        setIsJdExpanded={setIsJdExpanded}
        handlePrintDossierPDF={handlePrintDossierPDF}
        handleLaunchMockInterview={handleLaunchMockInterview}
        formatINRAmount={formatINRAmount}
        formatOriginalSalary={formatOriginalSalary}
      />
    </div>
  );
}
