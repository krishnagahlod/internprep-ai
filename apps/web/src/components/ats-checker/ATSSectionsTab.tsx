"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Wrench,
  Users,
  Check,
} from "lucide-react";

interface ATSSectionsTabProps {
  atsReport: any;
  onLaunchAIFix: (fixType: string, bulletText?: string) => void;
}

export function ATSSectionsTab({ atsReport, onLaunchAIFix }: ATSSectionsTabProps) {
  const sections = [
    {
      key: "experience",
      data: atsReport.section_health?.experience,
      icon: Briefcase,
      defaultFixType: "power_verb",
    },
    {
      key: "projects",
      data: atsReport.section_health?.projects,
      icon: FolderGit2,
      defaultFixType: "quantify",
    },
    {
      key: "education",
      data: atsReport.section_health?.education,
      icon: GraduationCap,
      defaultFixType: "power_verb",
    },
    {
      key: "skills",
      data: atsReport.section_health?.skills,
      icon: Wrench,
      defaultFixType: "inject_keyword",
    },
    {
      key: "leadership",
      data: atsReport.section_health?.leadership,
      icon: Users,
      defaultFixType: "power_verb",
    },
  ].filter((s) => s.data);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 font-mono-tech">
            <Sparkles className="h-4 w-4" /> Multi-Dimensional Section Quality Diagnostics
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans">
            Audited across 4 standardized industry & campus placement benchmarks (25% weight each) with realistic score calibration.
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] font-mono-tech border-border text-foreground w-fit">
          {sections.length} Key Sections Audited
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sections.map(({ key, data, icon: Icon, defaultFixType }) => (
          <div
            key={key}
            className="p-5 rounded-3xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/30 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-foreground font-mono-tech font-display">
                      {data.name}
                    </h5>
                    <span className="text-[10px] text-muted-foreground font-mono-tech">
                      {data.bullets_count} Points Audited
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={`font-mono-tech text-xs px-2.5 py-0.5 border ${
                      data.score >= 82
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : data.score >= 72
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {data.score}% • {data.status}
                  </Badge>
                </div>
              </div>

              {/* 4-Dimension Sub-Metric Progress Bars */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-tech">
                  Standardized Evaluation Dimensions (25% Each)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {data.dimensions?.map((dim: any, dIdx: number) => (
                    <div
                      key={dIdx}
                      className="p-2.5 rounded-2xl bg-muted/20 border border-border space-y-1.5"
                    >
                      <div className="flex justify-between text-[11px] font-mono-tech">
                        <span className="font-semibold text-foreground truncate">{dim.name}</span>
                        <span className="font-bold text-primary shrink-0 ml-1">{dim.score}%</span>
                      </div>
                      <Progress value={dim.score} className="h-1.5" />
                      <span className="text-[9px] text-muted-foreground font-mono-tech block truncate font-sans">
                        Criteria: {dim.benchmark}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Strengths */}
              {data.strengths?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono-tech">
                    <Check className="h-3 w-3" /> Key Highlights & Strengths
                  </span>
                  <div className="space-y-1">
                    {data.strengths.map((str: string, sIdx: number) => (
                      <p
                        key={sIdx}
                        className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40 font-sans"
                      >
                        {str}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Targeted Recommendations */}
              {data.gaps?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono-tech">
                      <Sparkles className="h-3 w-3" /> Targeted Recommendation
                    </span>
                    <button
                      onClick={() => onLaunchAIFix(defaultFixType, "")}
                      className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 font-mono-tech cursor-pointer"
                    >
                      + Launch AI Fix
                    </button>
                  </div>
                  <div className="space-y-1">
                    {data.gaps.map((gap: string, gIdx: number) => (
                      <p
                        key={gIdx}
                        className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans"
                      >
                        {gap}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
