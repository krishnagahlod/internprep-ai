"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, X, UserPlus, Plus, Users, Copy, UserX } from "lucide-react";
import { WhitelistedUser } from "./types";

interface PlacementAdminModalProps {
  open: boolean;
  onClose: () => void;
  adminUsers: WhitelistedUser[];
  adminInviteCodes: string[];
  newGrantEmail: string;
  setNewGrantEmail: (val: string) => void;
  newGrantNotes: string;
  setNewGrantNotes: (val: string) => void;
  adminActionLoading: boolean;
  adminActionMsg: string;
  copiedCode: string | null;
  onGrantAccess: () => void;
  onRevokeAccess: (email: string) => void;
  onGenerateCode: () => void;
  onCopyCode: (code: string) => void;
}

export function PlacementAdminModal({
  open,
  onClose,
  adminUsers,
  adminInviteCodes,
  newGrantEmail,
  setNewGrantEmail,
  newGrantNotes,
  setNewGrantNotes,
  adminActionLoading,
  adminActionMsg,
  copiedCode,
  onGrantAccess,
  onRevokeAccess,
  onGenerateCode,
  onCopyCode,
}: PlacementAdminModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground font-display">
                Admin Access Control
              </h2>
              <p className="text-xs text-muted-foreground">
                Whitelist users and manage invite passcodes for Placement Analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
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
              onClick={onGrantAccess}
              disabled={adminActionLoading || !newGrantEmail}
              className="sm:col-span-2 h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground font-mono-tech cursor-pointer"
            >
              Grant
            </Button>
          </div>
          {adminActionMsg && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block font-mono-tech">
              {adminActionMsg}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
              <Key className="h-4 w-4 text-amber-500" /> Active Invite Passcodes
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerateCode}
              disabled={adminActionLoading}
              className="h-7 text-xs font-semibold font-mono-tech cursor-pointer"
            >
              <Plus className="h-3 w-3 mr-1" /> Generate New Code
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {adminInviteCodes.map((code) => (
              <div
                key={code}
                onClick={() => onCopyCode(code)}
                className="px-3 py-1.5 rounded-xl bg-card border border-border/70 text-xs font-mono-tech font-bold text-foreground flex items-center gap-2 cursor-pointer hover:border-primary transition-colors"
              >
                <span>{code}</span>
                <Copy className="h-3 w-3 text-muted-foreground" />
                {copiedCode === code && (
                  <span className="text-[10px] text-emerald-500 font-sans">Copied!</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
            <Users className="h-4 w-4 text-purple-500" /> Authorized / Whitelisted Accounts ({adminUsers.length})
          </h3>
          <div className="max-h-48 overflow-y-auto divide-y divide-border/40 border border-border/60 rounded-2xl bg-card custom-scrollbar">
            {adminUsers.map((u) => (
              <div key={u.email} className="p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-foreground">{u.email}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">({u.role})</span>
                  {u.notes && (
                    <span className="text-[10px] text-muted-foreground block">{u.notes}</span>
                  )}
                </div>
                {u.role !== "admin" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRevokeAccess(u.email)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <UserX className="h-3.5 w-3.5 mr-1" /> Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={onClose} className="h-10 text-xs font-semibold font-mono-tech cursor-pointer">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
