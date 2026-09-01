"use client";

import { Eye, Loader2, FileText, Mic, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserDetailRecord } from "./types";

interface AdminInspectUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectLoading: boolean;
  inspectData: UserDetailRecord | null;
}

export function AdminInspectUserModal({
  open,
  onOpenChange,
  inspectLoading,
  inspectData,
}: AdminInspectUserModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Eye className="h-4 w-4 text-primary" />
            <span>Candidate Dossier & Activity Profile</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-sans">
            Complete historical activity, session logs, uploaded resumes, and entitlement state.
          </DialogDescription>
        </DialogHeader>

        {inspectLoading || !inspectData ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-mono-tech">
              Loading candidate history from PostgreSQL...
            </span>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border">
              {inspectData.user.avatar_url ? (
                <img
                  src={inspectData.user.avatar_url}
                  alt={inspectData.user.full_name || inspectData.user.email}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-bold text-foreground font-mono-tech uppercase">
                  {inspectData.user.email ? inspectData.user.email.substring(0, 2) : "US"}
                </div>
              )}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground font-mono-tech truncate">
                    {inspectData.user.email}
                  </span>
                  <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono-tech">
                    {inspectData.entitlement?.plan_name || "Free"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-sans flex items-center gap-3">
                  <span>{inspectData.user.full_name || "Name not provided"}</span>
                  <span>•</span>
                  <span className="font-mono-tech text-[11px]">
                    ID: {inspectData.user.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Metrics: Resumes, Mocks, Payments */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-card border border-border text-center space-y-1 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono-tech">
                  Resumes
                </span>
                <div className="text-lg font-bold text-foreground font-mono-tech">
                  {inspectData.resumes.length}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border text-center space-y-1 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono-tech">
                  Mock Sessions
                </span>
                <div className="text-lg font-bold text-primary font-mono-tech">
                  {inspectData.interview_sessions.length}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border text-center space-y-1 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground font-mono-tech">
                  Total Spent
                </span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono-tech">
                  ₹
                  {inspectData.payment_transactions.reduce(
                    (acc, p) => acc + (p.status === "captured" ? p.amount_inr : 0),
                    0
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded Resumes List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-foreground font-mono-tech flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span>Uploaded Resumes ({inspectData.resumes.length})</span>
              </h5>
              {inspectData.resumes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded-2xl border border-border font-sans">
                  No resumes uploaded by this user yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {inspectData.resumes.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border text-xs font-mono-tech"
                    >
                      <span className="text-foreground truncate max-w-sm">{r.file_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mock Interviews List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-foreground font-mono-tech flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-primary" />
                <span>Mock Interview Sessions ({inspectData.interview_sessions.length})</span>
              </h5>
              {inspectData.interview_sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded-2xl border border-border font-sans">
                  No mock interviews taken yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {inspectData.interview_sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border text-xs font-mono-tech"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted/40 border-border text-foreground font-mono-tech"
                        >
                          {s.role || "General"}
                        </Badge>
                        <span className="text-muted-foreground text-[11px] font-sans">
                          {s.domain || "Standard"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[9px] py-0 bg-primary/10 text-primary border-primary/20 font-mono-tech">
                          {s.status || "completed"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-foreground font-mono-tech flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                <span>Payment Transactions ({inspectData.payment_transactions.length})</span>
              </h5>
              {inspectData.payment_transactions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded-2xl border border-border font-sans">
                  No payments recorded for this account.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {inspectData.payment_transactions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border text-xs font-mono-tech"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground uppercase text-[11px]">
                          {p.plan_slug}
                        </span>
                        <Badge className="text-[9px] py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          {p.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ₹{p.amount_inr}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border pt-3 font-mono-tech">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-muted-foreground hover:text-foreground text-xs h-9 rounded-xl cursor-pointer"
          >
            Close Dossier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
