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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isNotAdmin, setIsNotAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Grant Modal State
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlan, setGrantPlan] = useState("pro_1m");
  const [grantCustomDays, setGrantCustomDays] = useState("30");
  const [grantReason, setGrantReason] = useState("Manual administrative grant");

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

      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/users?query=${encodeURIComponent(searchQuery)}`, { headers }),
        fetch(`${API_URL}/admin/audit-logs`, { headers }),
      ]);

      // Explicit Admin Check for Krishna
      const isAdminEmailCheck =
        user?.email?.toLowerCase() === "krishnagahlod@gmail.com" ||
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

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setGrantModalOpen(true)}
              className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white text-xs font-semibold h-9 px-3.5 rounded-xl shadow-lg shadow-primary/20 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Grant Subscription</span>
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
              <span className="text-xs font-semibold text-slate-400">Total Users</span>
              <div className="h-7 w-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.total_users ?? (usersList.length || 1)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">100% active</span>
              <span>• Registered base</span>
            </div>
          </div>

          {/* Card 2: Pro Subscribers */}
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400">Pro Subscribers</span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight">
              {stats?.active_subscriptions ?? 0}
            </div>
            <div className="text-[11px] text-slate-400">Paid Sprint & Season passes</div>
          </div>

          {/* Card 3: IIT Bombay Verified */}
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">IIT Bombay Access</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats?.tier_distribution?.iitb_free ??
                usersList.filter((u) => u.entitlement?.is_iitb).length}
            </div>
            <div className="text-[11px] text-slate-400">@iitb.ac.in verified students</div>
          </div>

          {/* Card 4: Total Revenue */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Captured Revenue</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-300 tracking-tight">
              ₹{(stats?.total_revenue_inr ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400">Razorpay verified payments</div>
          </div>

          {/* Card 5: AI Analyses Processed */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-slate-900/50 p-5 space-y-2 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400">AI Analyses Served</span>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-300 tracking-tight">
              {stats?.total_analyses ?? 0}
            </div>
            <div className="text-[11px] text-slate-400">Resumes & mock evaluations</div>
          </div>
        </div>

        {/* User Directory & Management Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">User Entitlement Matrix</h3>
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                  {filteredUsers.length} Users Found
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitor user quotas, grant Pro & Lifetime tiers, extend expirations, or reset monthly limits.
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Plan Filter Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                {[
                  { key: "all", label: "All" },
                  { key: "pro", label: "Pro" },
                  { key: "iitb_free", label: "IITB Partner" },
                  { key: "lifetime", label: "Lifetime" },
                  { key: "free", label: "Free" },
                  { key: "admin", label: "Admin" },
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
                  placeholder="Search user email, name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-900/80 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">User Identity</th>
                    <th className="py-3.5 px-4 font-semibold">Active Plan</th>
                    <th className="py-3.5 px-4 font-semibold">Validity Expiration</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly AI Consumption</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Quick Override Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                        <Users className="h-8 w-8 mx-auto text-slate-600 opacity-50" />
                        <p className="font-medium text-slate-300">No users found matching query</p>
                        <p className="text-xs text-slate-500">
                          Try searching for another email or adjust your filter tab.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const planKey = u.entitlement?.plan_key || "free";
                      const isIITBUser = u.entitlement?.is_iitb;
                      const isAdmin = u.entitlement?.is_admin || planKey === "admin";
                      const expiresAt = u.entitlement?.expires_at;

                      // Calculate remaining days if applicable
                      let daysLeft: number | null = null;
                      if (expiresAt) {
                        const diffMs = new Date(expiresAt).getTime() - Date.now();
                        daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                      }

                      return (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition-colors group">
                          {/* 1. User Identity */}
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

                          {/* 2. Active Plan */}
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

                          {/* 3. Validity Expiry */}
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

                          {/* 4. Monthly Usage Gauges */}
                          <td className="py-4 px-4 text-slate-200">
                            <div className="space-y-1.5 max-w-xs">
                              {/* Resume Reviews */}
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

                              {/* Mocks */}
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

                          {/* 5. Quick Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* +30d Pro */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGrantPlan(u.id, u.email, "pro_1m", 30)}
                                disabled={actionLoading !== null}
                                className="text-[11px] h-7 px-2.5 rounded-lg border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                              >
                                +30d Pro
                              </Button>

                              {/* +90d Season Pass */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGrantPlan(u.id, u.email, "pro_3m", 90)}
                                disabled={actionLoading !== null}
                                className="text-[11px] h-7 px-2.5 rounded-lg border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                              >
                                +90d Season
                              </Button>

                              {/* Lifetime VIP */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGrantPlan(u.id, u.email, "lifetime")}
                                disabled={actionLoading !== null}
                                className="text-[11px] h-7 px-2.5 rounded-lg border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                              >
                                Lifetime
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
                                title="Sign out all devices"
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

        {/* Audit Activity Log Stream */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>Administrative Audit Activity Stream</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Immutable PostgreSQL ledger
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
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No administrative operations logged yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30">
                        <td className="py-3 px-4 font-medium text-slate-300 flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                          <span>{log.admin_email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono font-semibold ${
                              log.action.includes("GRANT")
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : log.action.includes("REVOKE")
                                ? "bg-red-500/10 text-red-300 border-red-500/30"
                                : log.action.includes("EXTEND")
                                ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            }`}
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                          {log.details?.target_email || log.target_user_id}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp || log.created_at || Date.now()).toLocaleString(
                            "en-IN",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Grant Modal Dialog */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span>Grant Subscription Plan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Directly provision access or override tier entitlement for any user account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">User Email or UUID</label>
              <Input
                placeholder="e.g. student@gmail.com or 220050012@iitb.ac.in"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select Plan Tier</label>
              <select
                value={grantPlan}
                onChange={(e) => setGrantPlan(e.target.value)}
                className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs px-3 focus:outline-none focus:border-primary"
              >
                <option value="pro_1m">InternPrep Pro - 1 Month Sprint (30 Days)</option>
                <option value="pro_3m">Placement Season Pass (90 Days)</option>
                <option value="pro_1y">Placement Master Pass (365 Days)</option>
                <option value="lifetime">Lifetime VIP Access (Unlimited)</option>
                <option value="iitb_free">IIT Bombay Partner Tier</option>
                <option value="admin">System Administrator Tier</option>
              </select>
            </div>

            {grantPlan !== "lifetime" && grantPlan !== "admin" && grantPlan !== "iitb_free" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Custom Duration (Days)</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={grantCustomDays}
                  onChange={(e) => setGrantCustomDays(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Reason / Notes</label>
              <Input
                placeholder="e.g. Campus ambassador, Placement incentive, VIP pass"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setGrantModalOpen(false)}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleGrantPlan(
                  grantEmail,
                  grantEmail,
                  grantPlan,
                  grantCustomDays ? parseInt(grantCustomDays) : undefined,
                  grantReason
                )
              }
              disabled={!grantEmail.trim() || actionLoading !== null}
              className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Confirm & Grant Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
