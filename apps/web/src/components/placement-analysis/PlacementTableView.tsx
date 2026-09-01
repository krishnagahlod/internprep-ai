"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react";
import { Company } from "./types";

interface PlacementTableViewProps {
  companies: Company[];
  selectedSector: string;
  comparedSlugs: string[];
  crmItems: Array<{ slug: string }>;
  onSelectCompany: (slug: string) => void;
  onToggleCRM: (company: Company) => void;
  onToggleCompare: (slug: string) => void;
  formatINRAmount: (amount: number) => string;
}

export function PlacementTableView({
  companies,
  selectedSector,
  comparedSlugs,
  crmItems,
  onSelectCompany,
  onToggleCRM,
  onToggleCompare,
  formatINRAmount,
}: PlacementTableViewProps) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card overflow-hidden shadow-sm">
      <div className="sm:hidden px-4 py-2 bg-muted/40 text-[11px] text-muted-foreground font-mono-tech flex items-center justify-between border-b border-border/50">
        <span>Swipe horizontally for full packages & slots →</span>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground font-semibold font-mono-tech">
            <tr>
              <th className="p-4">Company Name</th>
              <th className="p-4">Sector</th>
              <th className="p-4">Hiring Tier</th>
              <th className="p-4">
                {selectedSector !== "All Sectors"
                  ? `${selectedSector} Highest CTC`
                  : "Highest CTC"}
              </th>
              <th className="p-4">Fixed Base</th>
              <th className="p-4">Role Offers & Packages</th>
              <th className="p-4">Hiring Phases</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {companies.map((comp) => {
              const isCompared = comparedSlugs.includes(comp.slug);
              const isBookmarked = crmItems.some((x) => x.slug === comp.slug);
              const effectiveCTC =
                comp.display_highest_ctc_inr || comp.highest_ctc_inr;
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
                <tr
                  key={comp.id}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <td
                    onClick={() => onSelectCompany(comp.slug)}
                    className="p-4 font-bold text-foreground font-display"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-xs shrink-0 font-mono-tech">
                        {comp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="block">{comp.name}</span>
                          {comp.has_authentic_insights && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20 font-mono-tech"
                              title="Verified Senior Interview Questions Available"
                            >
                              Senior Q&A
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal line-clamp-1 font-sans">
                          {comp.locations.slice(0, 2).join(", ")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td
                    onClick={() => onSelectCompany(comp.slug)}
                    className="p-4 text-muted-foreground font-medium"
                  >
                    {comp.primary_sector}
                  </td>
                  <td onClick={() => onSelectCompany(comp.slug)} className="p-4">
                    <div className="flex flex-col gap-1 items-start font-mono-tech">
                      <Badge variant="outline" className="text-[10px]">
                        {comp.tier_category || "Standard"}
                      </Badge>
                      {comp.placement_slot && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> {comp.placement_slot}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    onClick={() => onSelectCompany(comp.slug)}
                    className="p-4 font-extrabold text-foreground font-mono-tech"
                  >
                    {formatINRAmount(effectiveCTC)}
                  </td>
                  <td
                    onClick={() => onSelectCompany(comp.slug)}
                    className="p-4 font-semibold text-foreground font-mono-tech"
                  >
                    {effectiveInHand > 0
                      ? formatINRAmount(effectiveInHand)
                      : "Standard"}
                  </td>
                  <td onClick={() => onSelectCompany(comp.slug)} className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[260px] font-mono-tech">
                      {comp.role_offers?.slice(0, 2).map((r, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-semibold text-foreground flex items-center gap-1 border border-border/40"
                        >
                          <span className="truncate max-w-[110px]">{r.job_title}</span>
                          <span className="font-bold text-primary">
                            {formatINRAmount(r.ctc_inr)}
                          </span>
                        </span>
                      ))}
                      {comp.role_offers && comp.role_offers.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          +{comp.role_offers.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td onClick={() => onSelectCompany(comp.slug)} className="p-4 font-mono-tech">
                    <div className="flex flex-wrap gap-1">
                      {comp.has_phase_1 && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold border border-purple-500/20">
                          25–26 P1
                        </span>
                      )}
                      {comp.has_phase_2 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold border border-blue-500/20">
                          25–26 P2
                        </span>
                      )}
                      {comp.has_24_25 && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] border border-border/40">
                          24–25
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        title="Bookmark to Target List"
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
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer font-mono-tech ${
                          isCompared
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border-border"
                        }`}
                      >
                        {isCompared ? "✓ Compared" : "+ Compare"}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectCompany(comp.slug)}
                        className="h-8 text-xs font-semibold text-primary font-mono-tech cursor-pointer"
                      >
                        View <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
