"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterPills } from "@/components/shared";
import {
  Search,
  X,
  Globe,
  Grid,
  List,
  Sparkles,
} from "lucide-react";
import {
  SECTOR_TABS,
  POPULAR_SKILLS,
  DAY_SLOT_OPTIONS,
} from "./types";

interface PlacementFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedSector: string;
  setSelectedSector: (val: string) => void;
  selectedSkill: string;
  setSelectedSkill: (val: string) => void;
  selectedSession: "all" | "25-26_p1" | "25-26_p2" | "25-26" | "24-25";
  setSelectedSession: (val: "all" | "25-26_p1" | "25-26_p2" | "25-26" | "24-25") => void;
  selectedTier: "all" | "C1" | "C2" | "C3";
  setSelectedTier: (val: "all" | "C1" | "C2" | "C3") => void;
  selectedDaySlot: string;
  setSelectedDaySlot: (val: string) => void;
  isInternationalOnly: boolean;
  setIsInternationalOnly: (val: boolean) => void;
  sortBy: "highest_ctc" | "median_ctc" | "roles_count" | "name";
  setSortBy: (val: "highest_ctc" | "median_ctc" | "roles_count" | "name") => void;
  viewMode: "grid" | "table";
  setViewMode: (val: "grid" | "table") => void;
  matchCount: number;
  onResetFilters: () => void;
}

export function PlacementFilterBar({
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  selectedSkill,
  setSelectedSkill,
  selectedSession,
  setSelectedSession,
  selectedTier,
  setSelectedTier,
  selectedDaySlot,
  setSelectedDaySlot,
  isInternationalOnly,
  setIsInternationalOnly,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  matchCount,
  onResetFilters,
}: PlacementFilterBarProps) {
  const isFiltered =
    Boolean(searchQuery) ||
    selectedSector !== "All Sectors" ||
    selectedSkill !== "All Skills" ||
    selectedSession !== "all" ||
    selectedTier !== "all" ||
    isInternationalOnly ||
    selectedDaySlot !== "All Slots";

  return (
    <div className="space-y-4">
      {/* SEARCH & FILTERS CONSOLE DECK */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by company, role (e.g. APM), skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-background border-border text-foreground font-mono-tech text-xs shadow-xs focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full custom-scrollbar lg:flex-wrap lg:overflow-x-visible lg:justify-end shrink-0">
            {/* Descending Chronology Year & Phase Selector */}
            <div className="inline-flex rounded-xl p-1 bg-muted/40 border border-border text-xs font-mono-tech shrink-0 gap-0.5">
              <button
                onClick={() => setSelectedSession("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedSession === "all"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Sessions
              </button>
              <button
                onClick={() => setSelectedSession("25-26_p1")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSession === "25-26_p1"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-primary hover:bg-primary/10"
                }`}
                title="2025–26 Phase 1 (December Day 1–7 Placements)"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedSession === "25-26_p1" ? "bg-white" : "bg-primary"
                  } animate-pulse`}
                />
                2025–26 P1
              </button>
              <button
                onClick={() => setSelectedSession("25-26_p2")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSession === "25-26_p2"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-primary hover:bg-primary/10"
                }`}
                title="2025–26 Phase 2 (Spring Placement Cycle)"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedSession === "25-26_p2" ? "bg-white" : "bg-primary"
                  }`}
                />
                2025–26 P2
              </button>
              <button
                onClick={() => setSelectedSession("24-25")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedSession === "24-25"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="2024–25 Complete Master Cycle"
              >
                2024–25 Master
              </button>
            </div>

            {/* Tier Selector */}
            <div className="inline-flex rounded-xl p-1 bg-muted/40 border border-border text-xs font-mono-tech">
              <button
                onClick={() => setSelectedTier("all")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTier === "all"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setSelectedTier("C1")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTier === "C1"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                C1 Dream
              </button>
              <button
                onClick={() => setSelectedTier("C2")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTier === "C2"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                C2 Core
              </button>
              <button
                onClick={() => setSelectedTier("C3")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTier === "C3"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                C3 Extended
              </button>
            </div>

            <Button
              variant={isInternationalOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setIsInternationalOnly(!isInternationalOnly)}
              className={`h-9 text-xs rounded-xl font-mono-tech cursor-pointer ${
                isInternationalOnly
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" /> International
            </Button>

            <select
              value={selectedDaySlot}
              onChange={(e) => setSelectedDaySlot(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-mono-tech outline-none focus:border-primary cursor-pointer"
            >
              {DAY_SLOT_OPTIONS.map((slot) => (
                <option key={slot} value={slot}>
                  Slot: {slot}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-mono-tech outline-none focus:border-primary cursor-pointer"
            >
              <option value="highest_ctc">Sort: Highest CTC</option>
              <option value="median_ctc">Sort: Median CTC</option>
              <option value="roles_count">Sort: Total Roles</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            <div className="inline-flex rounded-xl p-1 bg-muted/40 border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2.5">
          {/* Sector Filter Pills */}
          <div className="space-y-1">
            <FilterPills
              options={SECTOR_TABS}
              selected={selectedSector}
              onSelect={setSelectedSector}
            />
          </div>

          {/* In-Demand Skills Cloud */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-[10px] font-bold font-mono-tech text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Key Skills:
            </span>
            <FilterPills
              options={POPULAR_SKILLS}
              selected={selectedSkill}
              onSelect={setSelectedSkill}
            />
          </div>
        </div>
      </div>

      {/* Match Count Header */}
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1 font-mono-tech">
        <span>
          Showing <strong className="text-foreground font-semibold">{matchCount}</strong> companies matching current criteria
        </span>
        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
}
