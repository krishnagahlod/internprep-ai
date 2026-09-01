"use client";

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Target, Check, Sparkles } from "lucide-react";
import { CheckRow } from "./CheckRow";

interface ATSOverviewTabProps {
  atsReport: any;
}

export function ATSOverviewTab({ atsReport }: ATSOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* Parseability & Formatting Checks */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono-tech">
            <ShieldCheck className="h-4 w-4 text-primary" /> Technical & Parseability Verification
          </h4>
          <span className="text-[11px] font-mono-tech text-primary font-semibold">
            Score: {atsReport.pillars?.parseability?.score}%
          </span>
        </div>

        <div className="space-y-2.5">
          {atsReport.pillars?.parseability?.checks?.map((chk: any, i: number) => (
            <CheckRow
              key={i}
              name={chk.name}
              score={chk.score ?? (chk.passed ? 100 : 50)}
              status={chk.status ?? (chk.passed ? "Optimal" : "Check")}
              passed={chk.passed}
            />
          ))}
          {atsReport.pillars?.formatting_layout?.layout_checks?.map((chk: any, i: number) => (
            <CheckRow
              key={`layout-${i}`}
              name={chk.name}
              score={chk.score ?? (chk.passed ? 100 : 60)}
              status={chk.status ?? (chk.passed ? "Optimal" : "Check")}
              passed={chk.passed}
            />
          ))}
        </div>
      </div>

      {/* Quantification & Action Verbs Deep Dive */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono-tech">
            <Target className="h-4 w-4 text-primary" /> Quantification & Language Health
          </h4>
          <span className="text-[11px] font-mono-tech text-primary font-semibold">
            Score: {atsReport.pillars?.quantification?.score}%
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-muted/20 border border-border space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground font-mono-tech">
              Metrics Diversity Breakdown
            </span>
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech"
            >
              {atsReport.pillars?.quantification?.metric_types_found?.length || 0} Categories Present
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1 font-mono-tech">
            {atsReport.pillars?.quantification?.metric_types_found?.map((mt: string, i: number) => (
              <Badge
                key={i}
                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium"
              >
                <Check className="h-3 w-3 mr-1 inline" /> {mt}
              </Badge>
            ))}
          </div>
        </div>

        {atsReport.pillars?.action_verbs?.repetitive_verbs?.length > 0 && (
          <div className="p-3 rounded-2xl bg-muted/20 border border-border space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground font-mono-tech">
                Repetitive Action Verbs
              </span>
              <span className="text-[10px] text-amber-500 font-mono-tech">Variety Advisory</span>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Repeating opening verbs reduces impact. Detected:{" "}
              <span className="font-mono-tech font-bold text-amber-500">
                {atsReport.pillars?.action_verbs?.repetitive_verbs.join(", ")}
              </span>
            </p>
          </div>
        )}

        {/* Tier-1 Benchmark Bullet Structure (ACR Anatomy) Inspector */}
        {atsReport.pillars?.quantification?.xyz_deconstruction?.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 font-mono-tech">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Tier-1 Benchmark Bullet Structure (ACR Anatomy):
            </span>
            {atsReport.pillars?.quantification?.xyz_deconstruction.slice(0, 3).map((xyz: any, i: number) => (
              <div key={i} className="p-3 rounded-2xl bg-muted/20 border border-border space-y-1.5">
                <p className="text-xs font-mono-tech text-foreground line-clamp-1 italic">
                  "{xyz.bullet_text}"
                </p>
                <div className="flex flex-wrap gap-1 text-[9px] font-mono-tech">
                  <Badge
                    className={`px-1.5 py-0 ${
                      xyz.has_action_verb
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {xyz.has_action_verb ? "Action: Strong" : "Action: Weak"}
                  </Badge>
                  <Badge
                    className={`px-1.5 py-0 ${
                      xyz.is_causal_metric
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold"
                        : xyz.has_metric_y
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {xyz.is_causal_metric
                      ? "Outcome: Quantified Metric"
                      : xyz.has_metric_y
                      ? "Metric: Activity / Scope"
                      : "Outcome Metric: Missing"}
                  </Badge>
                  <Badge
                    className={`px-1.5 py-0 ${
                      xyz.has_mechanism_z
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {xyz.has_mechanism_z ? "Context/Method: Clear" : "Context/Method: Add Context"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
