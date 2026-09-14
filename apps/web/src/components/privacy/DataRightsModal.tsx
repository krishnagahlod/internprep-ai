"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface DataRightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataRightsModal({ open, onOpenChange }: DataRightsModalProps) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleExportData = async () => {
    try {
      setExporting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to export your data archive.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/privacy/export-data`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to generate data export");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internprep_data_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Personal data archive downloaded successfully (DPDP Act 2023).");
    } catch (err) {
      toast.error("Could not export data. Please try again or contact grievance@internprep.ai");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "DELETE") {
      toast.error("Please type DELETE to confirm permanent account erasure.");
      return;
    }

    try {
      setDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to initiate account erasure.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/privacy/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account and personal records have been permanently erased.");
      await supabase.auth.signOut({ scope: "global" });
      onOpenChange(false);
      router.push("/");
    } catch (err) {
      toast.error("Failed to delete account. Please reach out to grievance@internprep.ai");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border border-border text-foreground p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono-tech text-xs mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>DPDP ACT 2023 & GDPR PRIVACY CONTROLS</span>
          </div>
          <DialogTitle className="text-xl font-bold font-mono-tech">
            Data Privacy & User Rights
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-sans">
            Exercise your statutory data principal rights to data portability, summary access, and cryptographic erasure under India&apos;s DPDP Act 2023.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs font-sans text-muted-foreground">
          {/* Export Box */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground font-mono-tech text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-500" />
                Data Portability Export
              </span>
              <span className="text-[10px] font-mono-tech text-muted-foreground uppercase">JSON ARCHIVE</span>
            </div>
            <p className="leading-relaxed">
              Download a complete, machine-readable JSON copy of your profile, parsed resumes, generated achievements, interview transcripts, and credit balances.
            </p>
            <Button
              onClick={handleExportData}
              disabled={exporting}
              variant="outline"
              size="sm"
              className="mt-2 font-mono-tech text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  PREPARING ARCHIVE...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  DOWNLOAD PERSONAL DATA ARCHIVE
                </>
              )}
            </Button>
          </div>

          {/* Delete Account Box */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground font-mono-tech text-sm flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="h-4 w-4" />
                Permanent Account Erasure
              </span>
              <span className="text-[10px] font-mono-tech text-rose-500 uppercase">RIGHT TO BE FORGOTTEN</span>
            </div>
            <p className="leading-relaxed">
              Permanently and irreversibly delete your candidate account, uploaded PDF resumes, interview logs, and billing references from all databases.
            </p>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                size="sm"
                className="mt-2 font-mono-tech text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                REQUEST COMPLETE DATA ERASURE
              </Button>
            ) : (
              <div className="mt-3 p-3 rounded-lg bg-background border border-rose-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-500 font-mono-tech text-xs font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>ACTION CANNOT BE REVERSED</span>
                </div>
                <p className="text-[11px]">
                  Please type <strong className="text-foreground font-mono-tech">DELETE</strong> below to confirm immediate permanent erasure of all records:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="font-mono-tech text-xs h-8 max-w-[160px] border-rose-500/30 focus-visible:ring-rose-500"
                  />
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText.trim() !== "DELETE"}
                    variant="destructive"
                    size="sm"
                    className="h-8 font-mono-tech text-xs bg-rose-600 hover:bg-rose-700"
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "CONFIRM ERASURE"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 font-mono-tech text-xs"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Grievance Desk Info */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono-tech">
            <span>Grievance Desk: <a href="mailto:grievance@internprep.ai" className="text-emerald-600 dark:text-emerald-400 hover:underline">grievance@internprep.ai</a></span>
            <a 
              href="/privacy" 
              target="_blank" 
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <span>Full Privacy Policy</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="sm"
            className="font-mono-tech text-xs"
          >
            CLOSE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
