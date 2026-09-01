"use client";

import { Badge } from "@/components/ui/badge";
import { Target, ShieldCheck, Sparkles, Check, AlertCircle, AlertTriangle } from "lucide-react";

interface ATSKeywordsTabProps {
  atsReport: any;
  onInjectKeyword: (keyword: string) => void;
}

export function ATSKeywordsTab({ atsReport, onInjectKeyword }: ATSKeywordsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Custom JD Match Overview if Present */}
      {atsReport.pillars?.keyword_match?.jd_match_info && (
        <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 font-mono-tech">
              <Target className="h-4 w-4" /> Target Job Description Skill Match: {atsReport.pillars?.keyword_match?.jd_match_info?.match_rate}%
            </h4>
            <Badge className="bg-primary text-primary-foreground font-mono-tech text-xs">
              {atsReport.pillars?.keyword_match?.jd_match_info?.found} / {atsReport.pillars?.keyword_match?.jd_match_info?.total} Skills
            </Badge>
          </div>

          {atsReport.pillars?.keyword_match?.jd_match_info?.core_skills && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Core Mandatory Skills (70% Weight)
                  </span>
                  <Badge className="text-[10px] font-mono-tech bg-primary/10 text-primary border-primary/20">
                    {atsReport.pillars.keyword_match.jd_match_info.core_found?.length || 0} / {atsReport.pillars.keyword_match.jd_match_info.core_skills?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono-tech">
                  {atsReport.pillars.keyword_match.jd_match_info.core_found?.map((s: string, i: number) => (
                    <Badge
                      key={i}
                      className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      <Check className="h-3 w-3 mr-1" /> {s}
                    </Badge>
                  ))}
                  {atsReport.pillars.keyword_match.jd_match_info.core_missing?.map((s: string, i: number) => (
                    <Badge
                      key={i}
                      className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" /> {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Preferred & Secondary Tools (30% Weight)
                  </span>
                  <Badge className="text-[10px] font-mono-tech bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                    {atsReport.pillars.keyword_match.jd_match_info.pref_found?.length || 0} / {atsReport.pillars.keyword_match.jd_match_info.pref_skills?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono-tech">
                  {atsReport.pillars.keyword_match.jd_match_info.pref_found?.map((s: string, i: number) => (
                    <Badge
                      key={i}
                      className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      <Check className="h-3 w-3 mr-1" /> {s}
                    </Badge>
                  ))}
                  {atsReport.pillars.keyword_match.jd_match_info.pref_missing?.map((s: string, i: number) => (
                    <Badge
                      key={i}
                      className="text-[10px] bg-muted text-muted-foreground border border-border"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Missing High-Yield Competencies Box */}
      {atsReport.pillars?.keyword_match?.missing_critical?.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2 font-mono-tech">
              <AlertTriangle className="h-4 w-4" /> Recommended High-Priority Competencies ({atsReport.pillars?.keyword_match?.missing_critical?.length})
            </h4>
            <span className="text-[11px] font-mono-tech text-muted-foreground">
              Click any skill to launch 1-Click AI Bullet Injector
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 font-mono-tech">
            {atsReport.pillars?.keyword_match?.missing_critical.map((kw: string, i: number) => (
              <button
                key={i}
                onClick={() => onInjectKeyword(kw)}
                className="px-2.5 py-1.5 rounded-xl text-xs bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-rose-500 font-bold">+</span> {kw}
                <span className="text-[9px] opacity-70 underline ml-0.5">Inject</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Matrix Breakdown */}
      {atsReport.pillars?.keyword_match?.categorized_matrix ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atsReport.pillars?.keyword_match?.categorized_matrix.map((cat: any, idx: number) => (
            <div key={idx} className="p-4 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono-tech font-display">
                  {cat.category}
                  {cat.is_priority_subtrack && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono-tech px-1.5 py-0">
                      Sub-Track Priority
                    </Badge>
                  )}
                </h5>
                <Badge variant="outline" className="text-[10px] font-mono-tech">
                  {cat.matched?.length} / {(cat.matched?.length || 0) + (cat.missing?.length || 0)}
                </Badge>
              </div>

              <div className="space-y-2 font-mono-tech">
                {cat.matched?.map((m: any, mi: number) => (
                  <div
                    key={mi}
                    className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 truncate">
                      <Check className="h-3 w-3 shrink-0" /> {m.name}
                    </span>
                    {m.is_implicit ? (
                      <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 shrink-0 font-mono-tech flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> AI Inferred
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-muted-foreground opacity-70 truncate max-w-[90px] shrink-0 font-sans">
                        via "{m.matched_via}"
                      </span>
                    )}
                  </div>
                ))}

                {cat.missing?.map((ms: string, msi: number) => (
                  <div
                    key={msi}
                    className="p-2 rounded-xl bg-muted/20 border border-dashed border-border text-xs flex items-center justify-between"
                  >
                    <span className="text-muted-foreground">{ms}</span>
                    <button
                      onClick={() => onInjectKeyword(ms)}
                      className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      + Inject
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
