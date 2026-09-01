"use client";

import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Flame,
  Bookmark,
  BookmarkCheck,
  Target,
  DollarSign,
  Briefcase,
  Award,
  Users,
  Zap,
  FileText,
  Lock,
  Globe,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Company } from "./types";

interface PlacementCompanyCardProps {
  company: Company;
  selectedSector: string;
  isCompared: boolean;
  isBookmarked: boolean;
  onSelectCompany: (slug: string) => void;
  onToggleCRM: (company: Company) => void;
  onToggleCompare: (slug: string) => void;
  formatINRAmount: (amount: number) => string;
}

export function PlacementCompanyCard({
  company: comp,
  selectedSector,
  isCompared,
  isBookmarked,
  onSelectCompany,
  onToggleCRM,
  onToggleCompare,
  formatINRAmount,
}: PlacementCompanyCardProps) {
  const isC1 = comp.tier_category.includes("C1");
  const hasInsights = Boolean(comp.selection_insights);
  const effectiveCTC = comp.display_highest_ctc_inr || comp.highest_ctc_inr;
  const roleInHandList = (comp.role_offers || [])
    .map((r: any) => r.inhand_inr || 0)
    .filter((v: number) => v > 0);
  const maxRoleInHand =
    roleInHandList.length > 0 ? Math.max(...roleInHandList) : 0;
  const rawInHand =
    comp.display_highest_inhand_inr ||
    maxRoleInHand ||
    comp.highest_inhand_inr ||
    0;
  const effectiveInHand = rawInHand >= 100000 ? rawInHand : 0;

  return (
    <div className="group relative rounded-3xl border border-border/70 hover:border-primary/50 bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      <div className="space-y-4">
        {/* Company Header Row */}
        <div className="flex justify-between items-start gap-3">
          <div
            onClick={() => onSelectCompany(comp.slug)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-purple-500/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-lg text-primary group-hover:scale-105 transition-transform shadow-xs">
              {comp.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground font-display group-hover:text-primary transition-colors line-clamp-1">
                {comp.name}
              </h3>
              <span className="text-xs text-muted-foreground font-medium line-clamp-1">
                {comp.primary_sector}
              </span>
            </div>
          </div>

          {/* Tier, Compare & Bookmark Buttons */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {comp.placement_slot && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1 font-mono-tech"
                >
                  <Calendar className="h-3 w-3 text-amber-500" /> {comp.placement_slot}
                </Badge>
              )}
              {isC1 ? (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 shrink-0 flex items-center gap-1 font-mono-tech"
                >
                  <Flame className="h-3 w-3 text-amber-500" /> C1 Dream
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground border-border text-[10px] font-semibold px-2 py-0.5 shrink-0 font-mono-tech"
                >
                  {comp.tier_category || "Standard"}
                </Badge>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCRM(comp);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isBookmarked
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-muted hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 border-border"
                }`}
                title={isBookmarked ? "Remove from Shortlist" : "Bookmark to Target List"}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(comp.slug);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer font-mono-tech ${
                  isCompared
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border-border"
                }`}
                title="Add to Compare"
              >
                {isCompared ? "✓" : "+ Compare"}
              </button>
            </div>
            {comp.difficulty_score && (
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5 font-mono-tech">
                <Target className="h-2.5 w-2.5 text-primary" /> Difficulty: {comp.difficulty_score}/10
              </span>
            )}
          </div>
        </div>

        {/* Dual Compensation & Senior Intel Card */}
        <div
          onClick={() => onSelectCompany(comp.slug)}
          className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-2 cursor-pointer hover:bg-muted/60 transition-colors"
        >
          <div className="flex justify-between items-center text-xs font-mono-tech">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              {selectedSector !== "All Sectors" ? `${selectedSector} CTC` : "Annual Peak CTC"}
            </span>
            <span className="font-extrabold text-foreground text-sm">
              {formatINRAmount(effectiveCTC)}
            </span>
          </div>

          {effectiveInHand > 0 ? (
            <div className="flex justify-between items-center text-[11px] font-mono-tech">
              <span className="text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                Fixed Base Component
              </span>
              <span className="font-semibold text-foreground">
                {formatINRAmount(effectiveInHand)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground">Available Roles</span>
              <span className="font-semibold text-foreground">
                {comp.roles_count || 1} JAF Roles
              </span>
            </div>
          )}

          {comp.has_authentic_insights && (
            <div className="pt-1.5 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Verified IITB Senior Interview Questions</span>
            </div>
          )}

          {comp.hiring_funnel_intelligence && (
            <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <Users className="h-3 w-3" />
                {comp.hiring_funnel_intelligence.conversion_funnel?.interview_shortlisted_count > 0
                  ? `${comp.hiring_funnel_intelligence.conversion_funnel.interview_shortlisted_count} Shortlisted for Interviews`
                  : `${comp.hiring_funnel_intelligence.conversion_funnel?.oa_shortlisted_count || 0} Test Shortlists`}
              </span>
              {comp.hiring_funnel_intelligence.has_walkins && (
                <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono-tech">
                  Day Walk-ins
                </span>
              )}
            </div>
          )}

          {(comp.placement_slot ||
            comp.has_assignment_deck_round ||
            comp.has_group_discussion ||
            comp.bond_applicable) && (
            <div className="pt-1.5 border-t border-border/40 flex flex-wrap gap-1 items-center font-mono-tech">
              {comp.placement_slot && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] border border-indigo-500/30 flex items-center gap-0.5">
                  <Zap className="h-2.5 w-2.5" /> {comp.placement_slot}
                </span>
              )}
              {comp.has_assignment_deck_round && (
                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[9px] border border-purple-500/30 flex items-center gap-0.5">
                  <FileText className="h-2.5 w-2.5" /> Deck / Case Round
                </span>
              )}
              {comp.has_group_discussion && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px] border border-amber-500/30 flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" /> GD Round
                </span>
              )}
              {comp.bond_applicable && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[9px] border border-rose-500/30 flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" /> Service Bond
                </span>
              )}
            </div>
          )}

          {comp.dominant_currency !== "INR" && (
            <div className="pt-1 border-t border-border/40 flex justify-between items-center text-[10px]">
              <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                <Globe className="h-3 w-3" /> Global Pay
              </span>
              <span className="text-muted-foreground font-mono-tech font-medium">
                {comp.dominant_currency} Currency
              </span>
            </div>
          )}
        </div>

        {/* Role-Specific CTC Chips Container */}
        {comp.role_offers && comp.role_offers.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono-tech">
              {selectedSector !== "All Sectors"
                ? `${selectedSector} Offers & Packages:`
                : "Roles & Compensation Packages:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {comp.role_offers.slice(0, 3).map((role, rIdx) => {
                const isMatchSector =
                  selectedSector !== "All Sectors" &&
                  (role.primary_sector.toLowerCase() === selectedSector.toLowerCase() ||
                    selectedSector.toLowerCase().includes(role.primary_sector.toLowerCase()));
                const isPhase1 =
                  role.session_sheet.includes("25-26 s1") ||
                  role.session_label.toLowerCase().includes("phase 1");
                const isPhase2 =
                  role.session_sheet.includes("25-26 s2") ||
                  role.session_label.toLowerCase().includes("phase 2");

                return (
                  <div
                    key={role.id || rIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCompany(comp.slug);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isMatchSector
                        ? "bg-primary/15 text-primary border-primary/40 shadow-xs scale-[1.01]"
                        : "bg-muted/50 hover:bg-muted text-foreground border-border/60"
                    }`}
                    title={`${role.job_title} | CTC: ${formatINRAmount(role.ctc_inr)} | Base: ${formatINRAmount(role.inhand_inr)} | ${role.session_label}`}
                  >
                    <span className="truncate max-w-[130px]">{role.job_title}</span>
                    <span className="font-extrabold font-mono-tech text-foreground shrink-0">
                      {formatINRAmount(role.ctc_inr)}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono-tech font-bold shrink-0 ${
                        isPhase1
                          ? "bg-purple-500/20 text-purple-600 dark:text-purple-300"
                          : isPhase2
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPhase1 ? "P1" : isPhase2 ? "P2" : "24-25"}
                    </span>
                  </div>
                );
              })}
              {comp.role_offers.length > 3 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCompany(comp.slug);
                  }}
                  className="px-2 py-1 rounded-xl text-[10px] font-bold bg-muted/40 hover:bg-muted text-primary cursor-pointer border border-border/40 self-center font-mono-tech"
                >
                  +{comp.role_offers.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* In-Demand Skills Badges */}
        {comp.top_skills && comp.top_skills.length > 0 && (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {comp.top_skills.slice(0, 4).map((sk, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-card border border-border/60 text-[10px] font-semibold text-foreground font-mono-tech"
                >
                  {sk}
                </span>
              ))}
              {comp.top_skills.length > 4 && (
                <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium font-mono-tech">
                  +{comp.top_skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Chronological Phase Timeline Pills & Student Data */}
        <div className="flex flex-wrap gap-1.5 pt-1 font-mono-tech">
          {comp.has_phase_1 && (
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
              2025–26 Phase 1
            </span>
          )}
          {comp.has_phase_2 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              2025–26 Phase 2
            </span>
          )}
          {comp.has_24_25 && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium border border-border/60">
              2024–25 Master
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-medium flex items-center gap-1">
            <Briefcase className="h-2.5 w-2.5" /> {comp.sector_roles_count || comp.roles_count}{" "}
            {comp.roles_count === 1 ? "Role" : "Roles"}
          </span>
          {hasInsights && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/20">
              <BookOpen className="h-2.5 w-2.5" /> Student Q&A
            </span>
          )}
        </div>
      </div>

      <div
        onClick={() => onSelectCompany(comp.slug)}
        className="mt-5 pt-3.5 border-t border-border/40 flex justify-between items-center text-xs cursor-pointer font-mono-tech"
      >
        <span className="text-muted-foreground text-[11px] line-clamp-1 font-sans">
          {comp.locations.slice(0, 2).join(", ")}
        </span>
        <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          View Intelligence <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
