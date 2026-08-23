"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, GraduationCap, ShieldCheck, Crown, ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchUserEntitlement, EntitlementResponse } from "@/lib/billing-api";

export function QuotaBadge() {
  const [data, setData] = useState<EntitlementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserEntitlement()
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return null;
  }

  const { entitlement, usage, is_iitb, is_admin } = data;
  const planKey = entitlement.plan_key;

  if (is_admin || planKey === "admin") {
    return (
      <Link href="/admin">
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5 py-1 px-2.5 hover:bg-purple-500/20 transition-all cursor-pointer">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-semibold text-xs">Admin Console</span>
        </Badge>
      </Link>
    );
  }

  if (is_iitb || planKey === "iitb_free") {
    return (
      <Link href="/billing">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-2.5 hover:bg-emerald-500/20 transition-all cursor-pointer">
          <GraduationCap className="h-3.5 w-3.5" />
          <span className="font-semibold text-xs">IIT Bombay Partner Access</span>
        </Badge>
      </Link>
    );
  }

  if (planKey.startsWith("pro") || planKey === "lifetime") {
    return (
      <Link href="/billing">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1.5 py-1 px-2.5 hover:bg-primary/20 transition-all cursor-pointer">
          <Crown className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-xs">Pro Member</span>
        </Badge>
      </Link>
    );
  }

  // Free Tier
  const resumeUsage = usage?.resume_analysis;
  const remaining = resumeUsage ? resumeUsage.remaining : 2;

  return (
    <Link href="/billing">
      <Badge variant="outline" className="bg-muted/80 text-muted-foreground border-border gap-1.5 py-1 px-2.5 hover:bg-muted transition-all cursor-pointer">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs">
          Free Tier <span className="text-foreground font-semibold">({remaining} left)</span>
        </span>
        <span className="text-[10px] text-primary font-bold ml-1 uppercase">Upgrade</span>
      </Badge>
    </Link>
  );
}
