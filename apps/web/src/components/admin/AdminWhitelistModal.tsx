"use client";

import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface AdminWhitelistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whitelistEmail: string;
  setWhitelistEmail: (email: string) => void;
  whitelistRole: string;
  setWhitelistRole: (role: string) => void;
  whitelistNotes: string;
  setWhitelistNotes: (notes: string) => void;
  actionLoading: string | null;
  onConfirmWhitelist: () => void;
}

export function AdminWhitelistModal({
  open,
  onOpenChange,
  whitelistEmail,
  setWhitelistEmail,
  whitelistRole,
  setWhitelistRole,
  whitelistNotes,
  setWhitelistNotes,
  actionLoading,
  onConfirmWhitelist,
}: AdminWhitelistModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Building2 className="h-4 w-4 text-amber-500" />
            <span>Whitelist Candidate for Placement Analysis</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-sans">
            Grants direct access to the Placement Analysis Studio for the specified candidate email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 font-mono-tech">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Candidate Email Address
            </label>
            <Input
              placeholder="e.g. candidate@iitb.ac.in or student@gmail.com"
              value={whitelistEmail}
              onChange={(e) => setWhitelistEmail(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Access Level</label>
            <select
              value={whitelistRole}
              onChange={(e) => setWhitelistRole(e.target.value)}
              className="w-full h-9 rounded-xl bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="authorized_user">Authorized Candidate (Full Studio Access)</option>
              <option value="admin">Administrator (Studio + Admin Privileges)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes / Batch Tag</label>
            <Input
              placeholder="e.g. B.Tech Mechanical 2026, Day 1 Selected"
              value={whitelistNotes}
              onChange={(e) => setWhitelistNotes(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="font-mono-tech">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-muted-foreground hover:text-foreground text-xs h-9 rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirmWhitelist}
            disabled={!whitelistEmail.trim() || actionLoading !== null}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 rounded-xl shadow-xs cursor-pointer"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Placement Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
