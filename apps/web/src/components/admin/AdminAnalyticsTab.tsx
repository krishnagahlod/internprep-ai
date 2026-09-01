"use client";

import { DollarSign, Layers } from "lucide-react";
import { AdminStats } from "./types";

interface AdminAnalyticsTabProps {
  stats: AdminStats | null;
}

export function AdminAnalyticsTab({ stats }: AdminAnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Snapshot */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <h4 className="text-sm font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span>Monetization Overview</span>
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border text-xs font-mono-tech">
              <span className="text-muted-foreground">Total Captured Revenue:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                ₹{(stats?.total_revenue_inr || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border text-xs font-mono-tech">
              <span className="text-muted-foreground">Active Paid Subscriptions:</span>
              <span className="font-bold text-primary text-sm">
                {stats?.active_subscriptions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border text-xs font-mono-tech">
              <span className="text-muted-foreground">IIT Bombay Verified Fleet:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {stats?.iitb_users || 8}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border text-xs font-mono-tech">
              <span className="text-muted-foreground">Free Tier Candidates:</span>
              <span className="font-bold text-foreground text-sm">
                {stats?.tier_distribution?.free || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Tier Distribution Breakdown */}
        <div className="md:col-span-2 rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <h4 className="text-sm font-bold text-foreground font-mono-tech flex items-center gap-2 font-display">
            <Layers className="h-4 w-4 text-purple-500" />
            <span>Subscription Tier Fleet Distribution</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats?.tier_distribution || {}).map(([key, count]) => (
              <div
                key={key}
                className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-1"
              >
                <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono-tech tracking-wider">
                  {key.replace("_", " ")}
                </div>
                <div className="text-xl font-bold text-foreground font-mono-tech">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
