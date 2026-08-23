"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { getAuthHeaders } from "@/lib/billing-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isNotAdmin, setIsNotAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/users?query=${encodeURIComponent(searchQuery)}&plan=${planFilter === 'all' ? '' : planFilter}`, { headers }),
        fetch(`${API_URL}/admin/audit-logs`, { headers }),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        setIsNotAdmin(true);
        return;
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const logsData = await logsRes.json();

      setStats(statsData);
      setUsersList(usersData.users || []);
      setAuditLogs(logsData.audit_logs || []);
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      setIsNotAdmin(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleGrantPlan = async (userId: string, userEmail: string, planKey: string, customDays?: number) => {
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
          reason: `Admin console grant (${planKey})`,
        }),
      });

      if (!res.ok) throw new Error("Failed to grant entitlement");

      setToastMessage({ type: "success", text: `Successfully granted ${planKey.toUpperCase()} to ${userEmail}` });
      await fetchAdminData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Action failed" });
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

      setToastMessage({ type: "success", text: `Extended subscription for ${userEmail} by ${days} days` });
      await fetchAdminData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Action failed" });
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

      setToastMessage({ type: "success", text: `Revoked paid access for ${userEmail}` });
      await fetchAdminData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Action failed" });
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

      setToastMessage({ type: "success", text: `Reset monthly usage counts for ${userEmail}` });
      await fetchAdminData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Action failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Force sign out all devices for ${userEmail}?`)) return;

    try {
      setActionLoading(`${userId}_suspend`);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/admin/users/suspend`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) throw new Error("Failed to suspend sessions");

      setToastMessage({ type: "success", text: `Suspended all active sessions for ${userEmail}` });
      await fetchAdminData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Action failed" });
    } finally {
      setActionLoading(null);
    }
  };

  if (isNotAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-card p-8 rounded-2xl border border-border shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            Administrative privileges required. Please sign in with an authorized account or contact system support.
          </p>
          <Link href="/dashboard">
            <Button className="w-full mt-2">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              ← Dashboard
            </Link>
            <span className="text-border">/</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-bold text-foreground">Admin Entitlement Console</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={fetchAdminData} className="text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            }`}
          >
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs underline opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Platform Overview KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">Total Users</span>
            <div className="text-2xl font-extrabold text-foreground">{stats?.total_users ?? 0}</div>
            <p className="text-[11px] text-muted-foreground">Registered profiles</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-primary">Active Pro Subscribers</span>
            <div className="text-2xl font-extrabold text-primary">{stats?.active_subscriptions ?? 0}</div>
            <p className="text-[11px] text-muted-foreground">Paid tier active</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">IITB Verified</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats?.tier_distribution?.iitb_free ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground">@iitb.ac.in users</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-foreground">Total Revenue</span>
            <div className="text-2xl font-extrabold text-foreground">₹{stats?.total_revenue_inr ?? 0}</div>
            <p className="text-[11px] text-muted-foreground">Captured payments</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">Resume Analyses</span>
            <div className="text-2xl font-extrabold text-foreground">{stats?.total_analyses ?? 0}</div>
            <p className="text-[11px] text-muted-foreground">Processed total</p>
          </div>
        </div>

        {/* User Management & Plan Overrides */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">User Entitlements & Overrides</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search users, grant Pro/Lifetime subscriptions, extend expiry dates, or reset monthly quotas.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-9 text-xs"
              />
              <Button type="submit" size="sm" className="h-9 px-3">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

          {/* User Table */}
          <div className="border border-border/60 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-semibold">User / Email</th>
                  <th className="py-3 px-4 font-semibold">Active Plan</th>
                  <th className="py-3 px-4 font-semibold">Expires</th>
                  <th className="py-3 px-4 font-semibold">Monthly Usage (Analyses / Mocks)</th>
                  <th className="py-3 px-4 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const planKey = u.entitlement?.plan_key || "free";
                    const isIITBUser = u.entitlement?.is_iitb;
                    const expiresAt = u.entitlement?.expires_at;

                    return (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{u.email || u.id}</span>
                            {isIITBUser && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 px-1.5 border border-emerald-500/20">
                                IITB
                              </Badge>
                            )}
                          </div>
                          {u.full_name && (
                            <span className="text-[11px] text-muted-foreground">{u.full_name}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold uppercase ${
                              planKey.startsWith("pro")
                                ? "bg-primary/10 text-primary border-primary/30"
                                : planKey === "lifetime"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : planKey === "admin"
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                                : isIITBUser
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.entitlement?.plan_name || planKey}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                          {expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN") : "Indefinite"}
                        </td>

                        <td className="py-3.5 px-4 text-foreground">
                          <div className="flex items-center gap-3 text-[11px]">
                            <span>
                              Resume: <strong>{u.usage?.resume_analysis?.used ?? 0}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Mocks: <strong>{u.usage?.mock_interview?.used ?? 0}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Bullets: <strong>{u.usage?.bullet_refine?.used ?? 0}</strong>
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Grant Pro 30 Days */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGrantPlan(u.id, u.email, "pro_1m", 30)}
                              disabled={actionLoading !== null}
                              className="text-[11px] h-7 px-2 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              +30d Pro
                            </Button>

                            {/* Grant Lifetime */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGrantPlan(u.id, u.email, "lifetime")}
                              disabled={actionLoading !== null}
                              className="text-[11px] h-7 px-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                            >
                              Lifetime
                            </Button>

                            {/* Reset Usage */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetUsage(u.id, u.email)}
                              disabled={actionLoading !== null}
                              className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
                              title="Reset usage counter"
                            >
                              Reset
                            </Button>

                            {/* Revoke */}
                            {planKey !== "free" && planKey !== "iitb_free" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokePlan(u.id, u.email)}
                                disabled={actionLoading !== null}
                                className="text-[11px] h-7 px-2 text-red-600 hover:bg-red-500/10"
                              >
                                Revoke
                              </Button>
                            )}
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

        {/* Audit Activity Log */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Administrative Audit Log</span>
          </h3>

          <div className="border border-border/60 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Admin</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Target User</th>
                  <th className="py-2.5 px-4 font-semibold">Details</th>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No administrative audit entries yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10">
                      <td className="py-2.5 px-4 font-medium text-foreground">{log.admin_email}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px]">{log.target_user_id}</td>
                      <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {new Date(log.timestamp || log.created_at).toLocaleString("en-IN")}
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
  );
}
