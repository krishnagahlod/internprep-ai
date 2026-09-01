"use client";

import { CommandNav } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Key, ArrowRight } from "lucide-react";

interface PlacementLockGateProps {
  invitePasscode: string;
  setInvitePasscode: (val: string) => void;
  verificationError: string;
  verifying: boolean;
  onUnlock: () => void;
}

export function PlacementLockGate({
  invitePasscode,
  setInvitePasscode,
  verificationError,
  verifying,
  onUnlock,
}: PlacementLockGateProps) {
  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between selection:bg-primary/20">
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <CommandNav
        backHref="/dashboard"
        backLabel="Dashboard"
        breadcrumb="PLACEMENT ACCESS GATE"
      />

      <main className="max-w-xl mx-auto w-full my-auto z-10 p-4">
        <div className="rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border border-primary/40 shadow-inner mb-6">
            <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
          </div>

          <Badge
            variant="outline"
            className="mb-3 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-xs uppercase tracking-wider font-mono-tech"
          >
            Private Preview • Invite Only
          </Badge>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-3 font-display">
            Placement Analysis & Intelligence
          </h1>

          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            This module is currently in private preview and hidden from general access. Early access is granted directly by the system administrator to authorized candidates.
          </p>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Admin Master Key or Authorized Invite Passcode
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Enter admin key or invite passcode"
                  value={invitePasscode}
                  onChange={(e) => setInvitePasscode(e.target.value)}
                  className="pr-10 text-sm font-mono-tech tracking-wider h-11 rounded-xl bg-background/80 border-input focus:border-primary"
                />
                <Key className="absolute right-3.5 top-3 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {verificationError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium font-mono-tech">
                {verificationError}
              </div>
            )}

            <Button
              onClick={onUnlock}
              disabled={verifying || !invitePasscode}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 text-sm font-mono-tech cursor-pointer"
            >
              {verifying ? "Verifying Access..." : "Unlock Studio with Passcode"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
              Need access? Contact your platform administrator to request early preview credentials.
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-4 font-mono-tech">
        Placement Intelligence Studio • Private Admin Preview
      </footer>
    </div>
  );
}
