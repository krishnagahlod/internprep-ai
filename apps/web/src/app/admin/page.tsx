"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  CreditCard,
  Crown,
  TrendingUp,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  LogOut,
  ChevronRight,
  MoreVertical,
  Plus,
  Loader2,
  GraduationCap,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight,
  Filter,
  Check,
  Calendar,
  Layers,
  Sliders,
  DollarSign,
  UserCheck,
  Ban,
  RotateCcw,
  Building2,
  KeyRound,
  Copy,
  Trash2,
  Send,
  Lock,
  Unlock,
  ExternalLink,
  Shield,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth-store";
import { getAuthHeaders } from "@/lib/billing-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  tier_distribution: Record<string, number>;
  total_revenue_inr: number;
  total_analyses: number;
  plans: Record<string, any>;
}

interface AdminUserRecord {
  id: string;
  email: string;
  full_name?: string;
  college?: string;
  created_at?: string;
  has_placement_access?: boolean;
  placement_details?: {
    role?: string;
    notes?: string;
    granted_at?: string;
    granted_by?: string;
  };
  entitlement?: {
    plan_key: string;
    plan_name: string;
    status: string;
    is_iitb: boolean;
    is_admin: boolean;
    expires_at?: string | null;
    source?: string;
  };
  usage?: {
    resume_analysis?: { used: number; limit: number; remaining: number };
    mock_interview?: { used: number; limit: number; remaining: number };
    bullet_refine?: { used: number; limit: number; remaining: number };
    placement_intelligence?: { used: number; limit: number; remaining: number };
  };
}

interface PlacementOverview {
  total_whitelisted: number;
  total_invite_codes: number;
  whitelisted_users: Array<{
    email: string;
    role: string;
    notes?: string;
    granted_at?: string;
    granted_by?: string;
  }>;
  invite_codes: string[];
  recent_sessions: Array<{
    email: string;
    verified_at: string;
  }>;
  admin_emails: string[];
}

interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: string;
  target_user_id: string;
  details: Record<string, any>;
  timestamp?: string;
  created_at?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"users" | "placement" | "analytics" | "logs">("users");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [placementData, setPlacementData] = useState<PlacementOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isNotAdmin, setIsNotAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Grant Plan Modal State
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlan, setGrantPlan] = useState("pro_1m");
  const [grantCustomDays, setGrantCustomDays] = useState("30");
  const [grantReason, setGrantReason] = useState("Manual administrative grant");

  // Whitelist Modal State
  const [whitelistModalOpen, setWhitelistModalOpen] = useState(false);
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistRole, setWhitelistRole] = useState("authorized_user");
  const [whitelistNotes, setWhitelistNotes] = useState("");

  // New Invite Passcode State
  const [newInviteCode, setNewInviteCode] = useState("");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        searchQuery === "" ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      const planKey = u.entitlement?.plan_key || "free";
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "placement_whitelisted" && u.has_placement_access) ||
        (planFilter === "pro" && (planKey.startsWith("pro_") || planKey === "pro")) ||
        (planFilter === "iitb_free" && (planKey === "iitb_free" || u.entitlement?.is_iitb)) ||
        (planFilter === "lifetime" && planKey === "lifetime") ||
        (planFilter === "free" && planKey === "free" && !u.entitlement?.is_iitb) ||
        (planFilter === "admin" && (planKey === "admin" || u.entitlement?.is_admin));

      return matchesSearch && matchesPlan;
    });
  }, [usersList, searchQuery, planFilter]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const [statsRes, usersRes, logsRes, placementRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/users?query=${encodeURIComponent(searchQuery)}`, { headers }),
        fetch(`${API_URL}/admin/audit-logs`, { headers }),
        fetch(`${API_URL}/admin/placement/overview`, { headers }),
      ]);

      // Explicit Admin Check for Krishna
      const isAdminEmailCheck =
        user?.email?.toLowerCase() === "krishnagahlod@gmail.com" ||
        user?.email?.toLowerCase() === "creator@internprep.ai" ||
        (user?.email && user.email.toLowerCase().includes("admin")) ||
        (user?.email && user.email.toLowerCase().includes("krishna"));

      if ((statsRes.status === 401 || statsRes.status === 403) && !isAdminEmailCheck) {
        setIsNotAdmin(true);
        return;
      }

      setIsNotAdmin(false);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData.users || []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.audit_logs || []);
      }

      if (placementRes.ok) {
        const pData = await placementRes.json();
        setPlacementData(pData);
      }
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      if (user?.email?.toLowerCase() !== "krishnagahlod@gmail.com") {
        setIsNotAdmin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  const copyToClipboard = (text: string, label: string = "Passcode") => {
    navigator.clipboard.writeText(text);
    showToast("success", `${label} '${text}' copied to clipboard!`);
  };

  const launchPlacementStudio = () => {
    localStorage.setItem("iitb_placement_verified", "true");
    localStorage.setItem("iitb_placement_admin", "true");
    router.push("/placement-analysis");
  };

  // Subscription Actions
  const handleGrantPlan = async (
    userId: string,
    userEmail: string,
    planKey: string,
    customDays?: number,
    reason?: string
  ) => {
    try {
      setActionLoading(`${userId}_grant_${planKey}`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/grant`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail,
          plan_key: planKey,
          custom_days: customDays,
          reason: reason || `Admin console grant (${planKey})`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to grant entitlement");
      }

      showToast("success", `Granted ${planKey.toUpperCase()} to ${userEmail || userId}`);
      setGrantModalOpen(false);
      setGrantEmail("");
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendPlan = async (userId: string, userEmail: string, days: number = 30) => {
    try {
      setActionLoading(`${userId}_extend`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/extend`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          additional_days: days,
          reason: `Admin extension (+${days} days)`,
        }),
      });

      if (!res.ok) throw new Error("Failed to extend subscription");

      showToast("success", `Extended subscription for ${userEmail} by ${days} days`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePlan = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke paid access for ${userEmail}?`)) return;

    try {
      setActionLoading(`${userId}_revoke`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/revoke`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          reason: "Admin manual revocation",
        }),
      });

      if (!res.ok) throw new Error("Failed to revoke subscription");

      showToast("success", `Revoked paid access for ${userEmail}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetUsage = async (userId: string, userEmail: string) => {
    try {
      setActionLoading(`${userId}_reset_usage`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/reset-usage`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) throw new Error("Failed to reset usage");

      showToast("success", `Refilled and reset monthly quotas for ${userEmail}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Force sign out all active device sessions for ${userEmail}?`)) return;

    try {
      setActionLoading(`${userId}_suspend`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/suspend`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) throw new Error("Failed to suspend sessions");

      showToast("success", `Suspended all active device sessions for ${userEmail}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Placement Analysis Whitelist Actions
  const handleGrantPlacementAccess = async (targetEmail: string, notes?: string, role?: string) => {
    try {
      setActionLoading(`${targetEmail}_grant_placement`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/placement/grant`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: targetEmail,
          notes: notes || "Granted via Admin Console",
          role: role || "authorized_user",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to grant placement access");
      }

      showToast("success", `Placement Analysis access granted to ${targetEmail}`);
      setWhitelistModalOpen(false);
      setWhitelistEmail("");
      setWhitelistNotes("");
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePlacementAccess = async (targetEmail: string) => {
    if (!confirm(`Revoke Placement Analysis access for ${targetEmail}?`)) return;

    try {
      setActionLoading(`${targetEmail}_revoke_placement`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/placement/revoke`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: targetEmail }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to revoke placement access");
      }

      showToast("success", `Placement Analysis access revoked for ${targetEmail}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateInviteCode = async (customCode?: string) => {
    try {
      setActionLoading("create_code");
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/placement/invite-code`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code_name: customCode || newInviteCode || undefined }),
      });

      if (!res.ok) throw new Error("Failed to generate invite passcode");

      const data = await res.json();
      showToast("success", `Created invite passcode: ${data.code}`);
      setNewInviteCode("");
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInviteCode = async (code: string) => {
    if (!confirm(`Delete invite code '${code}'? Users will no longer be able to use it.`)) return;

    try {
      setActionLoading(`delete_code_${code}`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/placement/invite-code?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) throw new Error("Failed to delete invite code");

      showToast("success", `Removed invite code: ${code}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (isNotAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-sm text-slate-400">
            Administrative privileges required. Current account ({user?.email || "Guest"}) is not authorized.
          </p>
          <div className="pt-2 flex gap-3">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                Dashboard
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-primary/30">
      {/* Top Admin Navigation Header */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-lg"
            >
              <span>← Exit to Dashboard</span>
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">System Control Center</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] py-0 px-2">
                    SuperAdmin
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Active: {user?.email || "krishnagahlod@gmail.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Direct Link to Launch Placement Studio */}
            <Button
              onClick={launchPlacementStudio}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold h-9 px-3.5 rounded-xl shadow-lg shadow-amber-500/20 gap-1.5 border border-amber-400/30"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Launch Placement Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </Button>

            <Button
              onClick={() => setWhitelistModalOpen(true)}
              variant="outline"
              className="border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-semibold h-9 px-3.5 rounded-xl gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Whitelist Candidate</span>
            </Button>

            <Button
              onClick={() => setGrantModalOpen(true)}
              className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white text-xs font-semibold h-9 px-3.5 rounded-xl shadow-lg shadow-primary/20 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grant Subscription</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs h-9 px-3 rounded-xl gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Toast Notification Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`p-4 rounded-2xl border flex items-center justify-between text-sm shadow-xl backdrop-blur-md ${
                toastMessage.type === "success"
                  ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/70 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {toastMessage.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <span className="font-medium">{toastMessage.text}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-xs font-semibold underline opacity-70 hover:opacity-100 transition-opacity ml-4"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform Overview Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Card 1: Total Users */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Candidates</span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats?.total_users || usersList.length}
            </div>
            <span className="text-[10px] text-blue-400 font-medium">Registered Platform Fleet</span>
          </div>

          {/* Card 2: Active Paid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Paid Subscribers</span>
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Crown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-400 tracking-tight">
              {stats?.active_subscriptions || 0}
            </div>
            <span className="text-[10px] text-indigo-400 font-medium">Pro & Lifetime Plans</span>
          </div>

          {/* Card 3: Placement Whitelisted */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setActiveTab("placement")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Placement Access</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {placementData?.total_whitelisted || 0}
            </div>
            <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
              Whitelisted Accounts <ChevronRight className="h-3 w-3" />
            </span>
          </div>

          {/* Card 4: Monthly Revenue */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Processed Revenue</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              ₹{(stats?.total_revenue_inr || 0).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Razorpay Live Captured</span>
          </div>

          {/* Card 5: Resume Analyses */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">AI Deep Audits</span>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-400 tracking-tight">
              {stats?.total_analyses || 0}
            </div>
            <span className="text-[10px] text-purple-400 font-medium">LLM Synthesized</span>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "users"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Platform User Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("placement")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "placement"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4 text-amber-400" />
            <span>Placement Intelligence Gate ({placementData?.total_whitelisted || 0})</span>
            <Badge className="bg-amber-500/20 text-amber-300 border-none text-[9px] py-0 px-1">
              Private
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Financials & Tier Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "logs"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: USER DIRECTORY & ACCESS OVERRIDES */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 space-y-5 shadow-2xl">
            {/* Search & Plan Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Platform Candidates & Access Directory</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage active subscriptions, refill monthly quotas, and grant 1-click Placement Analysis access.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Plan Filters */}
                <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
                  {[
                    { key: "all", label: "All Users" },
                    { key: "placement_whitelisted", label: "🏢 Placement Access" },
                    { key: "pro", label: "👑 Pro Paid" },
                    { key: "iitb_free", label: "🎓 IITB Tier" },
                    { key: "free", label: "Free Tier" },
                    { key: "admin", label: "SuperAdmin" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPlanFilter(tab.key)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        planFilter === tab.key
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder="Search candidate email, name, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-900/80 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Candidate Identity</th>
                      <th className="py-3.5 px-4 font-semibold">Subscription Plan</th>
                      <th className="py-3.5 px-4 font-semibold">Placement Analysis Gate</th>
                      <th className="py-3.5 px-4 font-semibold">Validity Expiration</th>
                      <th className="py-3.5 px-4 font-semibold">Monthly AI Limits</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                          <Users className="h-8 w-8 mx-auto text-slate-600 opacity-50" />
                          <p className="font-medium text-slate-300">No candidates found matching query</p>
                          <p className="text-xs text-slate-500">
                            Try searching for another email or adjust your filter tab.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const planKey = u.entitlement?.plan_key || "free";
                        const isIITBUser = u.entitlement?.is_iitb;
                        const isAdmin = u.entitlement?.is_admin || planKey === "admin" || u.email.toLowerCase() === "krishnagahlod@gmail.com";
                        const expiresAt = u.entitlement?.expires_at;
                        const hasPlacement = u.has_placement_access || isAdmin;

                        // Calculate remaining days if applicable
                        let daysLeft: number | null = null;
                        if (expiresAt) {
                          const diffMs = new Date(expiresAt).getTime() - Date.now();
                          daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                        }

                        return (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition-colors group">
                            {/* 1. Candidate Identity */}
                            <td className="py-4 px-4 font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0 uppercase">
                                  {u.email ? u.email.substring(0, 2) : "US"}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-white font-semibold truncate max-w-[200px]">
                                      {u.email || u.id}
                                    </span>
                                    {isIITBUser && (
                                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px] py-0 px-1.5 border border-emerald-500/20">
                                        IITB
                                      </Badge>
                                    )}
                                    {isAdmin && (
                                      <Badge className="bg-purple-500/10 text-purple-400 text-[10px] py-0 px-1.5 border border-purple-500/20">
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  {u.full_name && (
                                    <div className="text-[11px] text-slate-400">{u.full_name}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Subscription Plan */}
                            <td className="py-4 px-4">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-semibold uppercase tracking-wider py-0.5 px-2.5 rounded-lg ${
                                  isAdmin
                                    ? "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/10"
                                    : planKey.startsWith("pro")
                                    ? "bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10"
                                    : planKey === "lifetime"
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10"
                                    : isIITBUser
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                {u.entitlement?.plan_name || planKey}
                              </Badge>
                            </td>

                            {/* 3. Placement Analysis Gate */}
                            <td className="py-4 px-4">
                              {isAdmin ? (
                                <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] py-0.5 px-2 flex items-center gap-1 w-fit">
                                  <Shield className="h-3 w-3 text-purple-400" /> Admin VIP
                                </Badge>
                              ) : hasPlacement ? (
                                <div className="space-y-0.5">
                                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] py-0.5 px-2 flex items-center gap-1 w-fit">
                                    <Check className="h-3 w-3 text-emerald-400" /> Whitelisted
                                  </Badge>
                                  {u.placement_details?.notes && (
                                    <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                      {u.placement_details.notes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-slate-900 text-slate-500 border-slate-800 text-[10px] py-0.5 px-2 flex items-center gap-1 w-fit">
                                  <Lock className="h-3 w-3 text-slate-600" /> Locked
                                </Badge>
                              )}
                            </td>

                            {/* 4. Validity Expiration */}
                            <td className="py-4 px-4 font-mono text-[11px]">
                              {isAdmin || planKey === "lifetime" || isIITBUser ? (
                                <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Perpetual
                                </span>
                              ) : expiresAt ? (
                                <div className="space-y-0.5">
                                  <div className="text-slate-200">
                                    {new Date(expiresAt).toLocaleDateString("en-IN", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {daysLeft !== null && daysLeft > 0
                                      ? `${daysLeft} days remaining`
                                      : "Expired"}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500">Free Tier</span>
                              )}
                            </td>

                            {/* 5. Monthly AI Limits */}
                            <td className="py-4 px-4 text-slate-200">
                              <div className="space-y-1.5 max-w-xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Resume Reviews:</span>
                                  <span className="font-semibold text-slate-200">
                                    {u.usage?.resume_analysis?.used ?? 0} /{" "}
                                    {u.usage?.resume_analysis?.limit === -1
                                      ? "∞"
                                      : u.usage?.resume_analysis?.limit ?? 2}
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    u.usage?.resume_analysis?.limit === -1
                                      ? 10
                                      : Math.min(
                                          100,
                                          ((u.usage?.resume_analysis?.used ?? 0) /
                                            (u.usage?.resume_analysis?.limit || 1)) *
                                            100
                                        )
                                  }
                                  className="h-1 bg-slate-800"
                                />

                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Mock Interviews:</span>
                                  <span className="font-semibold text-slate-200">
                                    {u.usage?.mock_interview?.used ?? 0} /{" "}
                                    {u.usage?.mock_interview?.limit === -1
                                      ? "∞"
                                      : u.usage?.mock_interview?.limit ?? 1}
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    u.usage?.mock_interview?.limit === -1
                                      ? 10
                                      : Math.min(
                                          100,
                                          ((u.usage?.mock_interview?.used ?? 0) /
                                            (u.usage?.mock_interview?.limit || 1)) *
                                            100
                                        )
                                  }
                                  className="h-1 bg-slate-800"
                                />
                              </div>
                            </td>

                            {/* 6. Quick Administrative Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* Placement Access Toggle */}
                                {!isAdmin && (
                                  hasPlacement ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRevokePlacementAccess(u.email)}
                                      disabled={actionLoading !== null}
                                      className="text-[11px] h-7 px-2 rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                      title="Revoke Placement Analysis access"
                                    >
                                      <Lock className="h-3 w-3 mr-1" />
                                      Revoke Gate
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleGrantPlacementAccess(u.email, `Granted by Admin for ${u.full_name || 'candidate'}`)}
                                      disabled={actionLoading !== null}
                                      className="text-[11px] h-7 px-2 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                      title="Grant Placement Analysis access"
                                    >
                                      <Unlock className="h-3 w-3 mr-1" />
                                      Grant Gate
                                    </Button>
                                  )
                                )}

                                {/* +30d Pro */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGrantPlan(u.id, u.email, "pro_1m", 30)}
                                  disabled={actionLoading !== null}
                                  className="text-[11px] h-7 px-2 rounded-lg border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                                >
                                  +30d Pro
                                </Button>

                                {/* Reset Usage Quota */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetUsage(u.id, u.email)}
                                  disabled={actionLoading !== null}
                                  className="text-[11px] h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                  title="Refill user's monthly quotas"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1 text-slate-400" /> Reset
                                </Button>

                                {/* Revoke Plan */}
                                {planKey !== "free" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokePlan(u.id, u.email)}
                                    disabled={actionLoading !== null}
                                    className="text-[11px] h-7 px-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                    title="Revoke subscription"
                                  >
                                    <Ban className="h-3 w-3 mr-1" /> Revoke
                                  </Button>
                                )}

                                {/* Remote Sign Out Sessions */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSuspendUser(u.id, u.email)}
                                  disabled={actionLoading !== null}
                                  className="text-[11px] h-7 px-2 text-slate-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                  title="Sign out all active devices"
                                >
                                  <LogOut className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLACEMENT ANALYSIS GATE & WHITELIST MANAGER */}
        {activeTab === "placement" && (
          <div className="space-y-6">
            {/* Top Info Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Placement Analysis Private Whitelist Gate</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[10px]">
                      Protected
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Placement Analysis is currently hidden from public navigation. Access is strictly granted to candidates you add to this whitelist or who possess an active admin invite passcode.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={launchPlacementStudio}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Studio Directly</span>
                </Button>
              </div>
            </div>

            {/* 2-Column Grid: Whitelist Add & Invite Codes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Candidate Whitelist Table */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-400" />
                      <span>Whitelisted Candidate Accounts ({placementData?.whitelisted_users.length || 0})</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      These candidate emails have direct, unrestricted access to the Placement Analysis Studio.
                    </p>
                  </div>

                  <Button
                    onClick={() => setWhitelistModalOpen(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-xl gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Email</span>
                  </Button>
                </div>

                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Whitelisted Email</th>
                        <th className="py-3 px-4 font-semibold">Access Level</th>
                        <th className="py-3 px-4 font-semibold">Notes / Batch</th>
                        <th className="py-3 px-4 font-semibold">Granted Date</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(placementData?.whitelisted_users || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No whitelisted emails yet. Click &quot;Add Email&quot; to grant access.
                          </td>
                        </tr>
                      ) : (
                        placementData?.whitelisted_users.map((item, idx) => {
                          const isAdminUser = item.role === "admin" || item.email === "krishnagahlod@gmail.com";
                          return (
                            <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 font-medium text-white font-mono text-xs">
                                {item.email}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={
                                    isAdminUser
                                      ? "bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px]"
                                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px]"
                                  }
                                >
                                  {isAdminUser ? "SuperAdmin" : "Authorized Candidate"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {item.notes || "—"}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                {item.granted_at ? item.granted_at.substring(0, 10) : "2026-08-24"}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {!isAdminUser ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokePlacementAccess(item.email)}
                                    disabled={actionLoading !== null}
                                    className="text-[11px] h-7 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" /> Revoke
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-purple-400/80 font-mono">Permanent</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Col: Active Passcodes & Generator */}
              <div className="space-y-6">
                {/* Invite Passcodes Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-amber-400" />
                        <span>Active Invite Passcodes</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Shareable VIP passcodes that immediately unlock the studio.
                      </p>
                    </div>
                  </div>

                  {/* Create New Code Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. IITB-VIP-2026"
                      value={newInviteCode}
                      onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                      className="h-8 text-xs bg-slate-900 border-slate-800 text-white font-mono uppercase"
                    />
                    <Button
                      onClick={() => handleCreateInviteCode()}
                      disabled={actionLoading !== null}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 px-3 rounded-lg"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>

                  {/* Code Chips */}
                  <div className="space-y-2 pt-1">
                    {(placementData?.invite_codes || []).map((code, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono group hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-bold text-white">{code}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code, "Invite code")}
                            className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInviteCode(code)}
                            className="h-6 px-2 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Sessions Log */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 shadow-xl">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <span>Recent Studio Logins</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(placementData?.recent_sessions || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No session logs recorded yet.</p>
                    ) : (
                      placementData?.recent_sessions.slice(-8).reverse().map((sess, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                          <span className="font-mono text-slate-300 truncate max-w-[140px]">{sess.email}</span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(sess.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM FINANCIALS & TIERS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Financial Snapshot */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span>Monetization Overview</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Total Captured Revenue:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      ₹{(stats?.total_revenue_inr || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Active Paid Subscriptions:</span>
                    <span className="font-bold text-indigo-400 font-mono text-sm">
                      {stats?.active_subscriptions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Free Tier Candidates:</span>
                    <span className="font-bold text-slate-300 font-mono text-sm">
                      {stats?.tier_distribution?.free || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tier Distribution Breakdown */}
              <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Subscription Tier Fleet Distribution</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats?.tier_distribution || {}).map(([key, count]) => (
                    <div key={key} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {key.replace("_", " ")}
                      </div>
                      <div className="text-xl font-bold text-white font-mono">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT ACTIVITY LOG STREAM */}
        {activeTab === "logs" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Administrative Audit Activity Stream</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Immutable Transaction Log
              </span>
            </div>

            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Admin Performer</th>
                      <th className="py-3 px-4 font-semibold">Action Triggered</th>
                      <th className="py-3 px-4 font-semibold">Target User ID / Email</th>
                      <th className="py-3 px-4 font-semibold">Event Parameters</th>
                      <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No audit activity recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-300">{log.admin_email}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`text-[10px] font-mono uppercase ${
                                log.action.includes("GRANT")
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                  : log.action.includes("REVOKE")
                                  ? "bg-red-500/10 text-red-300 border-red-500/30"
                                  : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                              }`}
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">{log.target_user_id}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {new Date(log.timestamp || log.created_at || "").toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: MANUAL GRANT SUBSCRIPTION MODAL */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <span>Grant Subscription Entitlement</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Manually activate a subscription tier for a user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Candidate Email or UUID</label>
              <Input
                placeholder="e.g. candidate@example.com"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Subscription Tier</label>
              <select
                value={grantPlan}
                onChange={(e) => setGrantPlan(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md bg-slate-950 border border-slate-800 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="pro_1m">Pro 1-Month (30 Days)</option>
                <option value="pro_3m">Pro Season Pass (90 Days)</option>
                <option value="pro_1y">Pro Annual (365 Days)</option>
                <option value="lifetime">Lifetime Unlimited Access</option>
                <option value="iitb_free">IIT Bombay Verified Tier</option>
                <option value="admin">SuperAdmin Privileges</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Validity Duration (Days)</label>
              <Input
                type="number"
                placeholder="30"
                value={grantCustomDays}
                onChange={(e) => setGrantCustomDays(e.target.value)}
                className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Reason / Notes</label>
              <Input
                placeholder="Manual admin grant..."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantModalOpen(false)}
              className="border-slate-800 text-slate-400 hover:bg-slate-800 text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleGrantPlan(
                  grantEmail,
                  grantEmail,
                  grantPlan,
                  parseInt(grantCustomDays) || 30,
                  grantReason
                )
              }
              disabled={!grantEmail.trim() || actionLoading !== null}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold h-9"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Grant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: WHITELIST CANDIDATE FOR PLACEMENT ANALYSIS */}
      <Dialog open={whitelistModalOpen} onOpenChange={setWhitelistModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              <span>Whitelist Candidate for Placement Analysis</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Grants direct access to the Placement Analysis Studio for the specified candidate email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Candidate Email Address</label>
              <Input
                placeholder="e.g. candidate@iitb.ac.in or student@gmail.com"
                value={whitelistEmail}
                onChange={(e) => setWhitelistEmail(e.target.value)}
                className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Access Level</label>
              <select
                value={whitelistRole}
                onChange={(e) => setWhitelistRole(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md bg-slate-950 border border-slate-800 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="authorized_user">Authorized Candidate (Full Studio Access)</option>
                <option value="admin">Administrator (Studio + Admin Privileges)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Notes / Batch Tag</label>
              <Input
                placeholder="e.g. B.Tech Mechanical 2026, Day 1 Selected"
                value={whitelistNotes}
                onChange={(e) => setWhitelistNotes(e.target.value)}
                className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWhitelistModalOpen(false)}
              className="border-slate-800 text-slate-400 hover:bg-slate-800 text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleGrantPlacementAccess(whitelistEmail, whitelistNotes, whitelistRole)
              }
              disabled={!whitelistEmail.trim() || actionLoading !== null}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold h-9"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Placement Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
