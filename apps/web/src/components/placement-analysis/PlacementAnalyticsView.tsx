"use client";

import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  GraduationCap,
  BarChart3,
  Globe,
  Flame,
  Briefcase,
} from "lucide-react";

interface PlacementAnalyticsViewProps {
  macroAnalytics: any;
  loadingMacro: boolean;
  onSelectCompany: (slug: string) => void;
  formatINRAmount: (amount: number) => string;
}

export function PlacementAnalyticsView({
  macroAnalytics,
  loadingMacro,
  onSelectCompany,
  formatINRAmount,
}: PlacementAnalyticsViewProps) {
  if (loadingMacro) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4" />
        <p className="text-sm text-muted-foreground font-mono-tech">
          Synthesizing macro placement trends and salary distributions...
        </p>
      </div>
    );
  }

  if (!macroAnalytics) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Branch Placement Velocity & Trajectory Reality */}
      {macroAnalytics.placement_velocity && (
        <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-foreground font-display flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" /> Phase 1 Placement Velocity & Department Trajectories
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono-tech">
                Cumulative Day 1 to Day 15 hiring progression reconstructed from{" "}
                {macroAnalytics.placement_velocity.total_phase1_placed_candidates} verified Phase 1 selections across departments.
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 text-xs font-bold font-mono-tech"
            >
              {macroAnalytics.placement_velocity.total_phase1_placed_candidates} Selections Tracked
            </Badge>
          </div>

          {/* Cumulative Velocity Milestones Steps */}
          <div className="space-y-2 font-mono-tech">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Cumulative Phase 1 Campus Placement Progression:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {macroAnalytics.placement_velocity.overall_cumulative_velocity?.map(
                (m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1 relative overflow-hidden"
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {m.milestone}
                    </div>
                    <div className="text-lg font-black text-foreground">
                      {m.cumulative_percentage}%
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      +{m.placed_in_window} placed
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      ({m.cumulative_placed} total)
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Department Trajectories Grid */}
          <div className="space-y-3 pt-2 border-t border-border/50 font-mono-tech">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-500" /> When Do Different Branches Get Placed?
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Circuital peaks in first 48 hours • Mechanical & Civil peak in Days 3–5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {macroAnalytics.placement_velocity.department_trajectories?.map(
                (dept: any, dIdx: number) => (
                  <div
                    key={dIdx}
                    className="p-4.5 rounded-2xl bg-muted/30 border border-border/60 space-y-3 shadow-2xs hover:border-border transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-xs text-foreground line-clamp-1">
                        {dept.department}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold shrink-0 ${
                          dept.peak_hiring_window.includes("Days 1")
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : dept.peak_hiring_window.includes("Days 3")
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        }`}
                      >
                        {dept.peak_hiring_window}
                      </Badge>
                    </div>

                    {/* 3-Window Velocity Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          Days 1–2: <strong>{dept.day1_2_pct}%</strong>
                        </span>
                        <span>
                          Days 3–5: <strong>{dept.day3_5_pct}%</strong>
                        </span>
                        <span>
                          Days 6–15: <strong>{dept.day6_15_pct}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                        <div
                          style={{ width: `${dept.day1_2_pct}%` }}
                          className="bg-blue-500 h-full"
                          title={`Days 1-2: ${dept.day1_2_pct}%`}
                        />
                        <div
                          style={{ width: `${dept.day3_5_pct}%` }}
                          className="bg-amber-500 h-full"
                          title={`Days 3-5: ${dept.day3_5_pct}%`}
                        />
                        <div
                          style={{ width: `${dept.day6_15_pct}%` }}
                          className="bg-purple-500 h-full"
                          title={`Days 6-15: ${dept.day6_15_pct}%`}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed bg-card/60 p-2.5 rounded-xl border border-border/40 font-sans">
                      💡 {dept.strategic_advice}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sector Compensation Distributions & Base/Bonus Split */}
      <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-foreground font-display flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Sector-wise Compensation & Fixed Base Benchmarks
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono-tech">
            Median CTC, 75th/90th percentiles, and Guaranteed Base vs Bonus vs ESOP splits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-tech">
          {macroAnalytics.sector_benchmarks?.map((sec: any) => (
            <div
              key={sec.sector_name}
              className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-3 shadow-xs"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-extrabold text-sm text-foreground">
                  {sec.sector_name}
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {sec.companies_count} Companies ({sec.roles_count} Roles)
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median CTC:</span>
                  <span className="font-extrabold text-foreground">
                    {formatINRAmount(sec.median_ctc_inr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median Fixed Base:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINRAmount(sec.median_inhand_inr)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Top 10% (P90) CTC:</span>
                  <span className="font-bold text-amber-500">
                    {formatINRAmount(sec.p90_ctc_inr)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Highest Offer:</span>
                  <span className="font-extrabold text-purple-500">
                    {formatINRAmount(sec.highest_ctc_inr)}
                  </span>
                </div>
              </div>

              {/* Visual Base vs Bonus vs ESOP Bar */}
              <div className="space-y-1 pt-1 border-t border-border/40">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Base: {sec.base_pay_pct}%</span>
                  <span>Bonus: {sec.variable_bonus_pct}%</span>
                  <span>ESOPs: {sec.esop_equity_pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
                  <div
                    style={{ width: `${sec.base_pay_pct}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Base Pay: ${sec.base_pay_pct}%`}
                  />
                  <div
                    style={{ width: `${sec.variable_bonus_pct}%` }}
                    className="bg-amber-500 h-full"
                    title={`Variable Bonus: ${sec.variable_bonus_pct}%`}
                  />
                  <div
                    style={{ width: `${sec.esop_equity_pct}%` }}
                    className="bg-purple-500 h-full"
                    title={`ESOPs / Equity: ${sec.esop_equity_pct}%`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* International Recruitment Destinations */}
      <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground font-display flex items-center gap-2">
            <Globe className="h-6 w-6 text-purple-500" /> International Recruitment Hubs
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono-tech">
            Global offers across Japan, USA, Europe, Singapore, UAE, and East Asia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-tech">
          {Object.entries(macroAnalytics.international_breakdown || {}).map(
            ([country, data]: any) => (
              <div
                key={country}
                className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-foreground">
                    {country}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  >
                    {data.count} Offers
                  </Badge>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Highest Package: </span>
                  <strong className="text-amber-500">
                    {formatINRAmount(data.highest_ctc_inr)}
                  </strong>
                </div>
                {data.sample_companies && data.sample_companies.length > 0 && (
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-sans">
                    <strong>Recruiters:</strong> {data.sample_companies.slice(0, 3).join(", ")}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Top CTC & Bulk Hiring Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Highest Paying */}
        <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4 font-mono-tech">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2 font-display">
            <Flame className="h-5 w-5 text-amber-500" /> Top Highest Paying Recruiters (Day 1 / Dream)
          </h3>
          <div className="divide-y divide-border/40 border border-border/60 rounded-2xl bg-muted/20 overflow-hidden">
            {macroAnalytics.top_ctc_companies?.map((c: any, i: number) => (
              <div
                key={c.slug}
                onClick={() => onSelectCompany(c.slug)}
                className="p-3 flex justify-between items-center text-xs hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-bold text-foreground block">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.sector}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-foreground block">
                    {formatINRAmount(c.highest_ctc_inr)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Volume Bulk Recruiters */}
        <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4 font-mono-tech">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2 font-display">
            <Briefcase className="h-5 w-5 text-primary" /> Top Recruiters by JAF Role Volume
          </h3>
          <div className="divide-y divide-border/40 border border-border/60 rounded-2xl bg-muted/20 overflow-hidden">
            {macroAnalytics.top_volume_recruiters?.map((c: any, i: number) => (
              <div
                key={c.slug}
                onClick={() => onSelectCompany(c.slug)}
                className="p-3 flex justify-between items-center text-xs hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-bold text-foreground block">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.sector}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-primary block">
                    {c.roles_count} Roles
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Max: {formatINRAmount(c.highest_ctc_inr)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
