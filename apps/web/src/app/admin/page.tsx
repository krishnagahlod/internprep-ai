"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CreditCard,
  Crown,
  TrendingUp,
  Clock,
  RefreshCw,
  AlertTriangle,
  Plus,
  GraduationCap,
  Zap,
  Building2,
  UserPlus,
  Download,
  Megaphone,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { getAuthHeaders } from "@/lib/billing-api";
import { CommandNav, CommandHero, KpiMetricGrid, SegmentedTabs } from "@/components/shared";
import {
  AdminStats,
  AdminUserRecord,
  UserDetailRecord,
  PlacementOverview,
  AuditLogEntry,
  AdminUsersTab,
  AdminPlacementTab,
  AdminAnalyticsTab,
  AdminLogsTab,
  AdminGrantPlanModal,
  AdminTopupCreditModal,
  AdminInspectUserModal,
  AdminBroadcastModal,
  AdminWhitelistModal,
} from "@/components/admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  // Top-up Credit Modal State
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupUserId, setTopupUserId] = useState("");
  const [topupUserEmail, setTopupUserEmail] = useState("");
  const [topupFeature, setTopupFeature] = useState("resume_analysis");
  const [topupAmount, setTopupAmount] = useState("5");
  const [topupReason, setTopupReason] = useState("Admin customer support topup");

  // Inspect User Detail Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectData, setInspectData] = useState<UserDetailRecord | null>(null);

  // Whitelist Modal State
  const [whitelistModalOpen, setWhitelistModalOpen] = useState(false);
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistRole, setWhitelistRole] = useState("authorized_user");
  const [whitelistNotes, setWhitelistNotes] = useState("");

  // Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLevel, setBroadcastLevel] = useState("info");
  const [broadcastActive, setBroadcastActive] = useState(true);
  const [broadcastLinkUrl, setBroadcastLinkUrl] = useState("");
  const [broadcastLinkText, setBroadcastLinkText] = useState("");

  // New Invite Passcode State
  const [newInviteCode, setNewInviteCode] = useState("");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const qLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        u.email.toLowerCase().includes(qLower) ||
        (u.full_name && u.full_name.toLowerCase().includes(qLower)) ||
        u.id.toLowerCase().includes(qLower);

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
        fetch(`${API_URL}/admin/users?query=${encodeURIComponent(searchQuery)}&limit=200`, { headers }),
        fetch(`${API_URL}/admin/audit-logs`, { headers }),
        fetch(`${API_URL}/admin/placement/overview`, { headers }),
      ]);

      // Explicit Admin Check
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
    }, 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", `Copied ${label} to clipboard!`);
  };

  // Launch Placement Studio directly as SuperAdmin
  const launchPlacementStudio = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("placement_auth_verified", "true");
      sessionStorage.setItem("placement_auth_email", user?.email || "krishnagahlod@gmail.com");
      sessionStorage.setItem("placement_auth_role", "admin");
    }
    router.push("/placement-analysis");
  };

  // Inspect User Details
  const handleInspectUser = async (userId: string) => {
    try {
      setInspectLoading(true);
      setInspectModalOpen(true);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(userId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setInspectData(data);
      } else {
        throw new Error("Failed to load user inspection details");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to inspect candidate");
    } finally {
      setInspectLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      setActionLoading("export_csv");
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/export`, { headers });
      if (!res.ok) throw new Error("Failed to generate CSV export");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internprep_users_export_${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", "Candidate directory exported successfully!");
    } catch (err: any) {
      showToast("error", err.message || "CSV export failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Administrative Actions
  const handleGrantPlan = async (
    targetUserId: string,
    targetEmail?: string,
    planKey: string = "pro_1m",
    days: number = 30,
    reason: string = "Admin manual grant"
  ) => {
    try {
      setActionLoading(`${targetUserId}_grant`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/grant`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: targetUserId,
          user_email: targetEmail,
          plan_key: planKey,
          custom_days: days,
          reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to grant entitlement");
      }

      showToast("success", `Granted ${planKey} (${days}d) to ${targetEmail || targetUserId}`);
      setGrantModalOpen(false);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantTopupCredits = async () => {
    try {
      setActionLoading("grant_topup");
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/topup-credits`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: topupUserId,
          user_email: topupUserEmail,
          feature_key: topupFeature,
          credits: parseInt(topupAmount) || 5,
          reason: topupReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to grant topup credits");
      }

      showToast("success", `Added +${topupAmount} ${topupFeature} credits to ${topupUserEmail || topupUserId}`);
      setTopupModalOpen(false);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Topup grant failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePlan = async (targetUserId: string, targetEmail?: string) => {
    if (!confirm(`Revoke subscription and downgrade ${targetEmail || targetUserId} to Free?`)) return;

    try {
      setActionLoading(`${targetUserId}_revoke`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/revoke`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: targetUserId,
          reason: "Admin manual revocation",
        }),
      });

      if (!res.ok) throw new Error("Failed to revoke plan");

      showToast("success", `Revoked subscription for ${targetEmail || targetUserId}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetUsage = async (targetUserId: string, targetEmail?: string) => {
    if (!confirm(`Reset monthly usage counter to 0 for ${targetEmail || targetUserId}?`)) return;

    try {
      setActionLoading(`${targetUserId}_reset`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/reset-usage`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: targetUserId }),
      });

      if (!res.ok) throw new Error("Failed to reset usage");

      showToast("success", `Usage counter reset for ${targetEmail || targetUserId}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (targetUserId: string, targetEmail?: string) => {
    if (!confirm(`Force sign out all active sessions for ${targetEmail || targetUserId}?`)) return;

    try {
      setActionLoading(`${targetUserId}_suspend`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/suspend`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: targetUserId, reason: "Admin forced sign-out" }),
      });

      if (!res.ok) throw new Error("Failed to revoke user sessions");

      showToast("success", `Signed out all active devices for ${targetEmail || targetUserId}`);
      await fetchAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

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

  const handleSaveBroadcast = async () => {
    try {
      setActionLoading("save_broadcast");
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/broadcast`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: broadcastMessage,
          level: broadcastLevel,
          is_active: broadcastActive,
          link_url: broadcastLinkUrl || undefined,
          link_text: broadcastLinkText || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update broadcast banner");

      showToast("success", "System broadcast announcement updated!");
      setBroadcastModalOpen(false);
    } catch (err: any) {
      showToast("error", err.message || "Broadcast update failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (isNotAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Access Restricted</h2>
          <p className="text-sm text-slate-400 font-sans">
            Administrative privileges required. Current account ({user?.email || "Guest"}) is not authorized.
          </p>
          <div className="pt-2 flex gap-3 font-mono-tech">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 rounded-xl cursor-pointer">
                Dashboard
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl cursor-pointer">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
      {/* Top Admin Navigation Header */}
      <CommandNav
        backHref="/dashboard"
        backLabel="Dashboard"
        breadcrumb="ADMIN SYSTEM CONTROL"
        actions={
          <div className="flex items-center gap-2 font-mono-tech">
            <Button
              onClick={launchPlacementStudio}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 px-3 rounded-xl gap-1.5 shadow-xs cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Placement Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </Button>

            <Button
              onClick={() => setBroadcastModalOpen(true)}
              variant="outline"
              size="sm"
              className="border-border text-foreground text-xs h-8 px-2.5 rounded-xl gap-1.5 cursor-pointer"
              title="Set Global Announcement Banner"
            >
              <Megaphone className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden md:inline">Broadcast</span>
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              disabled={actionLoading === "export_csv"}
              className="border-border text-foreground text-xs h-8 px-2.5 rounded-xl gap-1.5 cursor-pointer"
              title="Download Candidates CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden md:inline">CSV</span>
            </Button>

            <Button
              onClick={() => setWhitelistModalOpen(true)}
              variant="outline"
              size="sm"
              className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold h-8 px-2.5 rounded-xl gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Whitelist</span>
            </Button>

            <Button
              onClick={() => {
                setGrantEmail("");
                setGrantModalOpen(true);
              }}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 px-3 rounded-xl gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grant Plan</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              className="border-border text-muted-foreground hover:text-foreground text-xs h-8 px-2.5 rounded-xl gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Command Hero Header */}
        <CommandHero
          badge="[SUPERADMIN SYSTEM TELEMETRY]"
          statusBadge="ALL SERVICES ONLINE"
          statusVariant="emerald"
          title="Administrative Command Center"
          subtitle="Manage candidate entitlements, whitelist Day 1 Placement Studio access, audit live telemetry, and review security transaction logs."
        />

        {/* Toast Notification Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`p-4 rounded-2xl border flex items-center justify-between text-sm shadow-xs backdrop-blur-md ${
                toastMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <div className="flex items-center gap-3">
                {toastMessage.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                )}
                <span className="font-medium font-mono-tech text-xs">{toastMessage.text}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-xs font-mono-tech underline opacity-70 hover:opacity-100 transition-opacity ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform Overview Metric Cards via KpiMetricGrid */}
        <KpiMetricGrid
          columns={6}
          metrics={[
            {
              label: "Total Candidates",
              value: stats?.total_users || usersList.length,
              subtext: "Auth Candidate Fleet",
              icon: Users,
              badge: "Live Pool",
              badgeVariant: "blue",
            },
            {
              label: "IIT Bombay Verified",
              value:
                stats?.iitb_users ||
                usersList.filter(
                  (u) => u.entitlement?.is_iitb || u.email.endsWith("@iitb.ac.in")
                ).length,
              subtext: "@iitb.ac.in Verified",
              icon: GraduationCap,
              badge: "Campus",
              badgeVariant: "emerald",
              onClick: () => {
                setPlanFilter("iitb_free");
                setActiveTab("users");
              },
            },
            {
              label: "Paid Subscribers",
              value: stats?.active_subscriptions || 0,
              subtext: "Pro & Lifetime Plans",
              icon: Crown,
              badge: "Revenue",
              badgeVariant: "purple",
              onClick: () => {
                setPlanFilter("pro");
                setActiveTab("users");
              },
            },
            {
              label: "Placement Whitelist",
              value: placementData?.total_whitelisted || 0,
              subtext: "Authorized JAF Access",
              icon: Building2,
              badge: "Private",
              badgeVariant: "amber",
              onClick: () => setActiveTab("placement"),
            },
            {
              label: "Captured Revenue",
              value: `₹${(stats?.total_revenue_inr || 0).toLocaleString("en-IN")}`,
              subtext: "Razorpay Live Captured",
              icon: CreditCard,
              badge: "Settled",
              badgeVariant: "emerald",
            },
            {
              label: "AI Analyses Served",
              value: stats?.total_analyses || 0,
              subtext: `${stats?.total_interviews || 62} Mocks • ${stats?.total_resumes || 6} Audits`,
              icon: Zap,
              badge: "Telemetry",
              badgeVariant: "blue",
            },
          ]}
        />

        {/* Tab Navigation via SegmentedTabs */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4 overflow-x-auto custom-scrollbar">
          <SegmentedTabs
            tabs={[
              { id: "users", label: "Candidate Directory", count: usersList.length, icon: Users },
              {
                id: "placement",
                label: "Placement Gate",
                count: placementData?.total_whitelisted || 0,
                icon: Building2,
                badge: "Private",
              },
              { id: "analytics", label: "Financials & Tier Breakdown", icon: TrendingUp },
              { id: "logs", label: "Audit Trail", count: auditLogs.length, icon: Clock },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as any)}
          />
        </div>

        {/* TAB 1: USER DIRECTORY */}
        {activeTab === "users" && (
          <AdminUsersTab
            filteredUsers={filteredUsers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            currentUserEmail={user?.email}
            actionLoading={actionLoading}
            onInspectUser={handleInspectUser}
            onGrantPlacementAccess={handleGrantPlacementAccess}
            onRevokePlacementAccess={handleRevokePlacementAccess}
            onOpenTopup={(u) => {
              setTopupUserId(u.id);
              setTopupUserEmail(u.email);
              setTopupModalOpen(true);
            }}
            onGrantPlan={handleGrantPlan}
            onResetUsage={handleResetUsage}
            onSuspendUser={handleSuspendUser}
          />
        )}

        {/* TAB 2: PLACEMENT GATE */}
        {activeTab === "placement" && (
          <AdminPlacementTab
            placementData={placementData}
            currentUserEmail={user?.email}
            actionLoading={actionLoading}
            newInviteCode={newInviteCode}
            setNewInviteCode={setNewInviteCode}
            onLaunchPlacementStudio={launchPlacementStudio}
            onOpenWhitelistModal={() => setWhitelistModalOpen(true)}
            onRevokePlacementAccess={handleRevokePlacementAccess}
            onCreateInviteCode={handleCreateInviteCode}
            onDeleteInviteCode={handleDeleteInviteCode}
            onCopyClipboard={copyToClipboard}
          />
        )}

        {/* TAB 3: PLATFORM FINANCIALS & TIERS */}
        {activeTab === "analytics" && <AdminAnalyticsTab stats={stats} />}

        {/* TAB 4: AUDIT ACTIVITY LOG STREAM */}
        {activeTab === "logs" && <AdminLogsTab auditLogs={auditLogs} />}
      </div>

      {/* MODAL 1: MANUAL GRANT SUBSCRIPTION */}
      <AdminGrantPlanModal
        open={grantModalOpen}
        onOpenChange={setGrantModalOpen}
        grantEmail={grantEmail}
        setGrantEmail={setGrantEmail}
        grantPlan={grantPlan}
        setGrantPlan={setGrantPlan}
        grantCustomDays={grantCustomDays}
        setGrantCustomDays={setGrantCustomDays}
        grantReason={grantReason}
        setGrantReason={setGrantReason}
        actionLoading={actionLoading}
        onConfirmGrant={() =>
          handleGrantPlan(
            grantEmail,
            grantEmail,
            grantPlan,
            parseInt(grantCustomDays) || 30,
            grantReason
          )
        }
      />

      {/* MODAL 2: ADD TOPUP CREDITS */}
      <AdminTopupCreditModal
        open={topupModalOpen}
        onOpenChange={setTopupModalOpen}
        topupUserId={topupUserId}
        topupUserEmail={topupUserEmail}
        topupFeature={topupFeature}
        setTopupFeature={setTopupFeature}
        topupAmount={topupAmount}
        setTopupAmount={setTopupAmount}
        topupReason={topupReason}
        setTopupReason={setTopupReason}
        actionLoading={actionLoading}
        onConfirmTopup={handleGrantTopupCredits}
      />

      {/* MODAL 3: CANDIDATE DEEP INSPECTION DOSSIER */}
      <AdminInspectUserModal
        open={inspectModalOpen}
        onOpenChange={setInspectModalOpen}
        inspectLoading={inspectLoading}
        inspectData={inspectData}
      />

      {/* MODAL 4: SYSTEM BROADCAST ANNOUNCEMENT */}
      <AdminBroadcastModal
        open={broadcastModalOpen}
        onOpenChange={setBroadcastModalOpen}
        broadcastActive={broadcastActive}
        setBroadcastActive={setBroadcastActive}
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        broadcastLevel={broadcastLevel}
        setBroadcastLevel={setBroadcastLevel}
        broadcastLinkUrl={broadcastLinkUrl}
        setBroadcastLinkUrl={setBroadcastLinkUrl}
        broadcastLinkText={broadcastLinkText}
        setBroadcastLinkText={setBroadcastLinkText}
        actionLoading={actionLoading}
        onSaveBroadcast={handleSaveBroadcast}
      />

      {/* MODAL 5: WHITELIST CANDIDATE FOR PLACEMENT ANALYSIS */}
      <AdminWhitelistModal
        open={whitelistModalOpen}
        onOpenChange={setWhitelistModalOpen}
        whitelistEmail={whitelistEmail}
        setWhitelistEmail={setWhitelistEmail}
        whitelistRole={whitelistRole}
        setWhitelistRole={setWhitelistRole}
        whitelistNotes={whitelistNotes}
        setWhitelistNotes={setWhitelistNotes}
        actionLoading={actionLoading}
        onConfirmWhitelist={() =>
          handleGrantPlacementAccess(whitelistEmail, whitelistNotes, whitelistRole)
        }
      />
    </div>
  );
}
