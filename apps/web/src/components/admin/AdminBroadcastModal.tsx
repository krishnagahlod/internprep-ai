"use client";

import { Megaphone, Loader2 } from "lucide-react";
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

interface AdminBroadcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broadcastActive: boolean;
  setBroadcastActive: (active: boolean) => void;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;
  broadcastLevel: string;
  setBroadcastLevel: (lvl: string) => void;
  broadcastLinkUrl: string;
  setBroadcastLinkUrl: (url: string) => void;
  broadcastLinkText: string;
  setBroadcastLinkText: (txt: string) => void;
  actionLoading: string | null;
  onSaveBroadcast: () => void;
}

export function AdminBroadcastModal({
  open,
  onOpenChange,
  broadcastActive,
  setBroadcastActive,
  broadcastMessage,
  setBroadcastMessage,
  broadcastLevel,
  setBroadcastLevel,
  broadcastLinkUrl,
  setBroadcastLinkUrl,
  broadcastLinkText,
  setBroadcastLinkText,
  actionLoading,
  onSaveBroadcast,
}: AdminBroadcastModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Megaphone className="h-4 w-4 text-amber-500" />
            <span>Platform-Wide Broadcast Banner</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-sans">
            Displays a notification banner at the top of the dashboard for all logged-in students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 font-mono-tech">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border">
            <div>
              <span className="text-xs font-semibold text-foreground">Banner Active</span>
              <p className="text-[11px] text-muted-foreground font-sans">
                Toggle whether this announcement is currently live
              </p>
            </div>
            <input
              type="checkbox"
              checked={broadcastActive}
              onChange={(e) => setBroadcastActive(e.target.checked)}
              className="h-4 w-4 rounded-md border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Announcement Message
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 🚀 Placement Season Mock Interview Drive is now live!"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full rounded-2xl bg-background border border-border p-2.5 text-xs text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Banner Style / Severity
            </label>
            <select
              value={broadcastLevel}
              onChange={(e) => setBroadcastLevel(e.target.value)}
              className="w-full h-9 rounded-xl bg-background border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="info">🔵 Information (Blue Glow)</option>
              <option value="warning">🟡 Announcement / Priority (Amber Glow)</option>
              <option value="success">🟢 Success / Celebration (Emerald Glow)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Action Link URL (Optional)
            </label>
            <Input
              placeholder="e.g. /resume or /billing"
              value={broadcastLinkUrl}
              onChange={(e) => setBroadcastLinkUrl(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Action Button Text (Optional)
            </label>
            <Input
              placeholder="e.g. Upgrade Now → or Try ATS Scan"
              value={broadcastLinkText}
              onChange={(e) => setBroadcastLinkText(e.target.value)}
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
            onClick={onSaveBroadcast}
            disabled={actionLoading !== null}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 rounded-xl shadow-xs cursor-pointer"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Publish Banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
