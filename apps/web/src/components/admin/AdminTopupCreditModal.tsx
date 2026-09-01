"use client";

import { Gift, Loader2 } from "lucide-react";
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

interface AdminTopupCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topupUserId: string;
  topupUserEmail: string;
  topupFeature: string;
  setTopupFeature: (feat: string) => void;
  topupAmount: string;
  setTopupAmount: (amt: string) => void;
  topupReason: string;
  setTopupReason: (reason: string) => void;
  actionLoading: string | null;
  onConfirmTopup: () => void;
}

export function AdminTopupCreditModal({
  open,
  onOpenChange,
  topupUserId,
  topupUserEmail,
  topupFeature,
  setTopupFeature,
  topupAmount,
  setTopupAmount,
  topupReason,
  setTopupReason,
  actionLoading,
  onConfirmTopup,
}: AdminTopupCreditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Gift className="h-4 w-4 text-amber-500" />
            <span>Add Non-Expiring Top-Up Credits</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-sans">
            Instantly credit extra Resume Reviews or Mock Interviews to a candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 font-mono-tech">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Candidate Email</label>
            <Input
              value={topupUserEmail || topupUserId}
              disabled
              className="bg-muted/40 border-border text-muted-foreground text-xs h-9 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Credit Type</label>
            <select
              value={topupFeature}
              onChange={(e) => setTopupFeature(e.target.value)}
              className="w-full h-9 rounded-xl bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="resume_analysis">📄 Resume Deep Scans / Reviews</option>
              <option value="mock_interview">🎙️ Mock Interview Sessions</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Credits to Add</label>
            <div className="flex gap-2 mb-2">
              {["1", "3", "5", "10", "25"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    topupAmount === amt
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom amount"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Reason / Reference</label>
            <Input
              placeholder="Customer support credit, reward..."
              value={topupReason}
              onChange={(e) => setTopupReason(e.target.value)}
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
            onClick={onConfirmTopup}
            disabled={actionLoading !== null}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 rounded-xl shadow-xs cursor-pointer"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Add Credits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
