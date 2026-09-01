"use client";

import { Button } from "@/components/ui/button";
import { Scale, ArrowRight } from "lucide-react";
import { Company } from "./types";

interface PlacementComparisonDockProps {
  comparedSlugs: string[];
  companies: Company[];
  onClear: () => void;
  onOpenModal: () => void;
}

export function PlacementComparisonDock({
  comparedSlugs,
  companies,
  onClear,
  onOpenModal,
}: PlacementComparisonDockProps) {
  if (comparedSlugs.length === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4 animate-in slide-in-from-bottom-6 duration-300">
      <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-xl border border-primary/40 shadow-2xl flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 rounded-2xl bg-primary/15 text-primary shrink-0 hidden xs:block">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-foreground block truncate font-mono-tech">
              Comparing {comparedSlugs.length} of 3 Companies
            </span>
            <div className="flex gap-1 sm:gap-1.5 mt-0.5 overflow-hidden">
              {comparedSlugs.map((slug) => {
                const c = companies.find((x) => x.slug === slug);
                return (
                  <span
                    key={slug}
                    className="px-1.5 sm:px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-foreground truncate max-w-[85px] sm:max-w-[140px] font-mono-tech"
                  >
                    {c?.name || slug}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground underline px-1 sm:px-2 font-mono-tech cursor-pointer"
          >
            Clear
          </button>
          <Button
            size="sm"
            disabled={comparedSlugs.length < 2}
            onClick={onOpenModal}
            className="h-9 px-3 sm:px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 shrink-0 font-mono-tech cursor-pointer"
          >
            Compare <span className="hidden sm:inline">Now</span>{" "}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
