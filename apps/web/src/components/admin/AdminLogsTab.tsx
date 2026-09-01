"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuditLogEntry } from "./types";

interface AdminLogsTabProps {
  auditLogs: AuditLogEntry[];
}

export function AdminLogsTab({ auditLogs }: AdminLogsTabProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
          <Clock className="h-4 w-4 text-purple-500" />
          <span>Administrative Audit Activity Stream</span>
        </h3>
        <span className="text-xs text-muted-foreground font-mono-tech">
          Immutable Transaction Log
        </span>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tech">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Admin Performer</th>
                <th className="py-3 px-4 font-semibold">Action Triggered</th>
                <th className="py-3 px-4 font-semibold">Target User ID / Email</th>
                <th className="py-3 px-4 font-semibold">Event Parameters</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audit activity recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-foreground">{log.admin_email}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] uppercase ${
                          log.action.includes("GRANT")
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : log.action.includes("REVOKE")
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground">{log.target_user_id}</td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-xs truncate font-sans">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {new Date(log.timestamp || log.created_at || "").toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
