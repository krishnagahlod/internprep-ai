"use client";

import { Users, Search, Shield, Check, Lock, Unlock, Gift, RotateCcw, LogOut, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Progress as UiProgress } from "@/components/ui/progress";
import { AdminUserRecord } from "./types";

interface AdminUsersTabProps {
  filteredUsers: AdminUserRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  planFilter: string;
  setPlanFilter: (filter: string) => void;
  currentUserEmail?: string;
  actionLoading: string | null;
  onInspectUser: (userId: string) => void;
  onGrantPlacementAccess: (email: string, notes: string) => void;
  onRevokePlacementAccess: (email: string) => void;
  onOpenTopup: (user: AdminUserRecord) => void;
  onGrantPlan: (userId: string, email: string, planKey: string, days: number) => void;
  onResetUsage: (userId: string, email: string) => void;
  onSuspendUser: (userId: string, email: string) => void;
}

export function AdminUsersTab({
  filteredUsers,
  searchQuery,
  setSearchQuery,
  planFilter,
  setPlanFilter,
  currentUserEmail,
  actionLoading,
  onInspectUser,
  onGrantPlacementAccess,
  onRevokePlacementAccess,
  onOpenTopup,
  onGrantPlan,
  onResetUsage,
  onSuspendUser,
}: AdminUsersTabProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-xs">
      {/* Search & Plan Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Users className="h-4 w-4 text-primary" />
            <span>Candidate Access Directory</span>
            <UiBadge
              variant="outline"
              className="text-[10px] bg-muted/40 text-muted-foreground border-border font-mono-tech"
            >
              {filteredUsers.length} Loaded
            </UiBadge>
          </h3>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            Synced in real-time from Supabase Auth & PostgreSQL. Inspect activity, grant subscriptions, or add top-up credits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filters */}
          <div className="flex items-center bg-muted/30 border border-border rounded-2xl p-1 text-xs font-mono-tech overflow-x-auto max-w-full">
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
                className={`px-3 py-1 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                  planFilter === tab.key
                    ? "bg-card text-foreground font-bold shadow-2xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search candidate email, name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background border-border text-foreground font-mono-tech rounded-xl placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-mono-tech uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Candidate Identity</th>
                <th className="py-3.5 px-4 font-semibold">Subscription Plan</th>
                <th className="py-3.5 px-4 font-semibold">Placement Gate</th>
                <th className="py-3.5 px-4 font-semibold">Platform Activity</th>
                <th className="py-3.5 px-4 font-semibold">Monthly AI Limits</th>
                <th className="py-3.5 px-4 font-semibold text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground space-y-2">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="font-medium font-mono-tech text-foreground">
                      No candidates found matching query
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try searching for another email or adjust your filter tab.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const planKey = u.entitlement?.plan_key || "free";
                  const isIITBUser =
                    u.entitlement?.is_iitb || u.email.toLowerCase().endsWith("@iitb.ac.in");
                  const isAdmin =
                    u.entitlement?.is_admin ||
                    planKey === "admin" ||
                    u.email.toLowerCase().includes("admin") ||
                    u.email.toLowerCase() === (currentUserEmail?.toLowerCase() || "");
                  const expiresAt = u.entitlement?.expires_at;
                  const hasPlacement = u.has_placement_access || isAdmin;
                  const act = u.activity || {};

                  let daysLeft: number | null = null;
                  if (expiresAt) {
                    const diffMs = new Date(expiresAt).getTime() - Date.now();
                    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                  }

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors group">
                      {/* 1. Candidate Identity */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.full_name || u.email}
                              className="h-8 w-8 rounded-full border border-border object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground font-mono-tech flex-shrink-0 uppercase">
                              {u.email ? u.email.substring(0, 2) : "US"}
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-foreground font-semibold font-mono-tech truncate max-w-[200px]">
                                {u.email || u.id}
                              </span>
                              {isIITBUser && (
                                <UiBadge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 px-1.5 border border-emerald-500/20 font-mono-tech">
                                  IITB
                                </UiBadge>
                              )}
                              {isAdmin && (
                                <UiBadge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] py-0 px-1.5 border border-purple-500/20 font-mono-tech">
                                  Admin
                                </UiBadge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-sans">
                              {u.full_name && <span>{u.full_name}</span>}
                              {u.created_at && (
                                <span className="text-muted-foreground/70 text-[10px] font-mono-tech">
                                  Joined{" "}
                                  {new Date(u.created_at).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Subscription Plan */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <UiBadge
                            variant="outline"
                            className={`text-[10px] font-mono-tech font-semibold uppercase tracking-wider py-0.5 px-2 rounded-lg ${
                              isAdmin
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                : planKey.startsWith("pro") || planKey === "pro"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                : planKey === "lifetime"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : isIITBUser
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-muted/40 text-muted-foreground border-border"
                            }`}
                          >
                            {u.entitlement?.plan_name || planKey}
                          </UiBadge>
                          <div className="text-[10px] text-muted-foreground font-mono-tech">
                            {isAdmin || planKey === "lifetime" || isIITBUser ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                ✓ Perpetual
                              </span>
                            ) : expiresAt && daysLeft !== null ? (
                              <span>{daysLeft > 0 ? `${daysLeft}d left` : "Expired"}</span>
                            ) : (
                              <span>Free Tier</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Placement Analysis Gate */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <UiBadge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-mono-tech py-0.5 px-2 flex items-center gap-1 w-fit">
                            <Shield className="h-3 w-3 text-purple-500" /> Admin VIP
                          </UiBadge>
                        ) : hasPlacement ? (
                          <div className="space-y-0.5">
                            <UiBadge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono-tech py-0.5 px-2 flex items-center gap-1 w-fit">
                              <Check className="h-3 w-3 text-emerald-500" /> Whitelisted
                            </UiBadge>
                            {u.placement_details?.notes && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-[130px] font-sans">
                                {u.placement_details.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <UiBadge
                            variant="outline"
                            className="bg-muted/30 text-muted-foreground border-border text-[10px] font-mono-tech py-0.5 px-2 flex items-center gap-1 w-fit"
                          >
                            <Lock className="h-3 w-3 text-muted-foreground" /> Locked
                          </UiBadge>
                        )}
                      </td>

                      {/* 4. Platform Activity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-[11px] font-mono-tech">
                          <span
                            className="px-1.5 py-0.5 rounded-lg bg-muted/40 border border-border text-foreground"
                            title="Resumes Uploaded"
                          >
                            📄 {act.resumes_count ?? 0}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-lg bg-muted/40 border border-border text-foreground"
                            title="Mock Interviews Taken"
                          >
                            🎙️ {act.interviews_count ?? 0}
                          </span>
                          {(act.total_spent_inr || 0) > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                              title="Total Revenue Spent"
                            >
                              ₹{act.total_spent_inr}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Monthly AI Limits */}
                      <td className="py-3.5 px-4 text-foreground">
                        <div className="space-y-1.5 max-w-[180px]">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono-tech">
                            <span>Resume:</span>
                            <span className="font-semibold text-foreground">
                              {u.usage?.resume_analysis?.used ?? 0} /{" "}
                              {u.usage?.resume_analysis?.limit === -1
                                ? "∞"
                                : u.usage?.resume_analysis?.limit ?? 2}
                              {(u.topup_credits?.resume_analysis || 0) > 0 && (
                                <span className="text-amber-500 ml-1">
                                  (+{u.topup_credits?.resume_analysis})
                                </span>
                              )}
                            </span>
                          </div>
                          <UiProgress
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
                            className="h-1 bg-muted"
                          />

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono-tech">
                            <span>Mocks:</span>
                            <span className="font-semibold text-foreground">
                              {u.usage?.mock_interview?.used ?? 0} /{" "}
                              {u.usage?.mock_interview?.limit === -1
                                ? "∞"
                                : u.usage?.mock_interview?.limit ?? 1}
                              {(u.topup_credits?.mock_interview || 0) > 0 && (
                                <span className="text-amber-500 ml-1">
                                  (+{u.topup_credits?.mock_interview})
                                </span>
                              )}
                            </span>
                          </div>
                          <UiProgress
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
                            className="h-1 bg-muted"
                          />
                        </div>
                      </td>

                      {/* 6. Quick Administrative Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap font-mono-tech">
                          {/* Inspect Candidate Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onInspectUser(u.id)}
                            className="text-[11px] h-7 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                            title="Inspect candidate activity, resumes & interview sessions"
                          >
                            <Eye className="h-3 w-3 mr-1 text-primary" /> Inspect
                          </Button>

                          {/* Placement Access Toggle */}
                          {!isAdmin &&
                            (hasPlacement ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRevokePlacementAccess(u.email)}
                                disabled={actionLoading !== null}
                                className="text-[11px] h-7 px-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Revoke Placement Analysis access"
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onGrantPlacementAccess(
                                    u.email,
                                    `Granted by Admin for ${u.full_name || "candidate"}`
                                  )
                                }
                                disabled={actionLoading !== null}
                                className="text-[11px] h-7 px-2 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                title="Grant Placement Analysis access"
                              >
                                <Unlock className="h-3 w-3" />
                              </Button>
                            ))}

                          {/* Add Top-up Credits */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenTopup(u)}
                            className="text-[11px] h-7 px-2 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                            title="Add non-expiring topup credits"
                          >
                            <Gift className="h-3 w-3 mr-1" /> Topup
                          </Button>

                          {/* +30d Pro */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onGrantPlan(u.id, u.email, "pro_1m", 30)}
                            disabled={actionLoading !== null}
                            className="text-[11px] h-7 px-2 rounded-xl border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                          >
                            +30d
                          </Button>

                          {/* Reset Usage Quota */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onResetUsage(u.id, u.email)}
                            disabled={actionLoading !== null}
                            className="text-[11px] h-7 px-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl cursor-pointer"
                            title="Refill user's monthly quotas"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>

                          {/* Remote Sign Out Sessions */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSuspendUser(u.id, u.email)}
                            disabled={actionLoading !== null}
                            className="text-[11px] h-7 px-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
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
  );
}
