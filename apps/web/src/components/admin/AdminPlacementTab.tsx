"use client";

import { Building2, ExternalLink, UserCheck, Plus, Trash2, KeyRound, Copy, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlacementOverview } from "./types";

interface AdminPlacementTabProps {
  placementData: PlacementOverview | null;
  currentUserEmail?: string;
  actionLoading: string | null;
  newInviteCode: string;
  setNewInviteCode: (code: string) => void;
  onLaunchPlacementStudio: () => void;
  onOpenWhitelistModal: () => void;
  onRevokePlacementAccess: (email: string) => void;
  onCreateInviteCode: (customCode?: string) => void;
  onDeleteInviteCode: (code: string) => void;
  onCopyClipboard: (text: string, label: string) => void;
}

export function AdminPlacementTab({
  placementData,
  currentUserEmail,
  actionLoading,
  newInviteCode,
  setNewInviteCode,
  onLaunchPlacementStudio,
  onOpenWhitelistModal,
  onRevokePlacementAccess,
  onCreateInviteCode,
  onDeleteInviteCode,
  onCopyClipboard,
}: AdminPlacementTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Info Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
              <span>Placement Analysis Private Whitelist Gate</span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono-tech">
                Protected
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground font-sans mt-1 max-w-2xl leading-relaxed">
              Placement Analysis is hidden from public navigation. Access is strictly granted to candidates you add to this whitelist or who possess an active admin invite passcode.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono-tech">
          <Button
            onClick={onLaunchPlacementStudio}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Studio Directly</span>
          </Button>
        </div>
      </div>

      {/* 2-Column Grid: Whitelist Add & Invite Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Candidate Whitelist Table */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                <span>Whitelisted Candidate Accounts ({placementData?.whitelisted_users.length || 0})</span>
              </h4>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                These candidate emails have direct, unrestricted access to the Placement Analysis Studio.
              </p>
            </div>

            <Button
              onClick={onOpenWhitelistModal}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs h-8 px-3 rounded-xl gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Email</span>
            </Button>
          </div>

          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-mono-tech uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Whitelisted Email</th>
                  <th className="py-3 px-4 font-semibold">Access Level</th>
                  <th className="py-3 px-4 font-semibold">Notes / Batch</th>
                  <th className="py-3 px-4 font-semibold">Granted Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {(placementData?.whitelisted_users || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-mono-tech">
                      No whitelisted emails yet. Click &quot;Add Email&quot; to grant access.
                    </td>
                  </tr>
                ) : (
                  placementData?.whitelisted_users.map((item, idx) => {
                    const isAdminUser =
                      item.role === "admin" ||
                      item.email.toLowerCase().includes("admin") ||
                      item.email.toLowerCase() === (currentUserEmail?.toLowerCase() || "");
                    return (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground font-mono-tech text-xs">
                          {item.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              isAdminUser
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-mono-tech"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono-tech"
                            }
                          >
                            {isAdminUser ? "SuperAdmin" : "Authorized Candidate"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-sans">
                          {item.notes || "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono-tech text-[11px]">
                          {item.granted_at ? item.granted_at.substring(0, 10) : "2026-08-24"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tech">
                          {!isAdminUser ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRevokePlacementAccess(item.email)}
                              disabled={actionLoading !== null}
                              className="text-[11px] h-7 px-2 text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Revoke
                            </Button>
                          ) : (
                            <span className="text-[10px] text-purple-500 font-mono-tech">Permanent</span>
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
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
                  <KeyRound className="h-4 w-4 text-amber-500" />
                  <span>Active Invite Passcodes</span>
                </h4>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Shareable VIP passcodes that immediately unlock the studio.
                </p>
              </div>
            </div>

            {/* Create New Code Input */}
            <div className="flex gap-2 font-mono-tech">
              <Input
                placeholder="e.g. IITB-VIP-2026"
                value={newInviteCode}
                onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                className="h-8 text-xs bg-background border-border text-foreground uppercase rounded-xl"
              />
              <Button
                onClick={() => onCreateInviteCode()}
                disabled={actionLoading !== null}
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-white font-mono-tech text-xs h-8 px-3 rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>

            {/* Code Chips */}
            <div className="space-y-2 pt-1 font-mono-tech">
              {(placementData?.invite_codes || []).map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl border border-border bg-muted/20 text-xs group hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-bold text-foreground">{code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyClipboard(code, "Invite code")}
                      className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteInviteCode(code)}
                      className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Sessions Log */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3 shadow-xs">
            <h4 className="text-sm font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Recent Studio Logins</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar font-mono-tech">
              {(placementData?.recent_sessions || []).length === 0 ? (
                <p className="text-xs text-muted-foreground font-sans">No session logs recorded yet.</p>
              ) : (
                placementData?.recent_sessions
                  .slice(-8)
                  .reverse()
                  .map((sess, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-muted/20 border border-border"
                    >
                      <span className="text-foreground truncate max-w-[140px]">{sess.email}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(sess.verified_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
