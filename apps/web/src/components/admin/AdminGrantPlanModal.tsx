"use client";

import { Crown, Loader2 } from "lucide-react";
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

interface AdminGrantPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grantEmail: string;
  setGrantEmail: (email: string) => void;
  grantPlan: string;
  setGrantPlan: (plan: string) => void;
  grantCustomDays: string;
  setGrantCustomDays: (days: string) => void;
  grantReason: string;
  setGrantReason: (reason: string) => void;
  actionLoading: string | null;
  onConfirmGrant: () => void;
}

export function AdminGrantPlanModal({
  open,
  onOpenChange,
  grantEmail,
  setGrantEmail,
  grantPlan,
  setGrantPlan,
  grantCustomDays,
  setGrantCustomDays,
  grantReason,
  setGrantReason,
  actionLoading,
  onConfirmGrant,
}: AdminGrantPlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Crown className="h-4 w-4 text-primary" />
            <span>Grant Subscription Entitlement</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-sans">
            Manually activate a subscription tier for a user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 font-mono-tech">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Candidate Email or UUID
            </label>
            <Input
              placeholder="e.g. candidate@example.com"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Subscription Tier
            </label>
            <select
              value={grantPlan}
              onChange={(e) => setGrantPlan(e.target.value)}
              className="w-full h-9 rounded-xl bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
            <label className="text-xs text-muted-foreground block mb-1">
              Validity Duration (Days)
            </label>
            <Input
              type="number"
              placeholder="30"
              value={grantCustomDays}
              onChange={(e) => setGrantCustomDays(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Reason / Notes
            </label>
            <Input
              placeholder="Manual admin grant..."
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
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
            onClick={onConfirmGrant}
            disabled={!grantEmail.trim() || actionLoading !== null}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 rounded-xl shadow-xs cursor-pointer"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Grant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
