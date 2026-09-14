"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarClock,
  Calendar,
  Compass,
  FileCheck,
  Presentation,
  Terminal,
  Award,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Code2,
  Cog,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  BookOpen,
  X,
  Zap,
  Info,
} from "lucide-react";
import {
  SeasonRoadmapData,
  CalendarEvent,
  MonthOverview,
} from "./types";

interface PlacementSeasonRoadmapViewProps {
  onSelectCompany?: (slug: string) => void;
}

export function PlacementSeasonRoadmapView({
  onSelectCompany,
}: PlacementSeasonRoadmapViewProps) {
  const [data, setData] = useState<SeasonRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active track filter
  const [selectedTrack, setSelectedTrack] = useState<
    "all" | "consulting" | "sde" | "quant" | "core" | "analytics"
  >("all");

  // View mode switcher: "calendar" vs "timeline"
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");

  // Active month in Calendar View (defaults to current month: September = 9)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(9);

  // Selected date for the Day-Detail Drawer
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  // Search vault query
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [showOAPlaybook, setShowOAPlaybook] = useState(false);
  const [showSlottingPlaybook, setShowSlottingPlaybook] = useState(false);

  // Fetch season roadmap data from backend
  useEffect(() => {
    async function fetchRoadmap() {
      setLoading(true);
      setError(null);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/placement-analysis/season-roadmap`);
        if (!res.ok) {
          throw new Error(`Failed to load season roadmap: HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Error fetching season roadmap:", err);
        setError(err.message || "Failed to load season roadmap.");
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmap();
  }, []);

  // Compute "Where We Are Today" & Countdown to D-Day
  const { currentMonthNum, currentDayNum, daysToDDay, todayFormatted, currentPhaseCode } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 6 = July, 7 = Aug, 8 = Sept, 9 = Oct, 10 = Nov, 11 = Dec
    const date = now.getDate();

    let phase = "Phase 1A";
    if (month === 6) phase = "Phase 0 (Kickoff & CVs)";
    else if (month === 7 || month === 8) phase = "Phase 1A (PPTs & Diagnostic Tests)";
    else if (month === 9) phase = "Phase 1B (The OA Blitz)";
    else if (month === 10) phase = "Phase 1C (Shortlist Drops & Slotting)";
    else if (month === 11 && date <= 15) phase = "Phase 1D (D-Day Interviews)";
    else phase = "Phase 2 (Spring Wave)";

    // Target: Next December 1
    const currentYear = now.getFullYear();
    const dDayYear = month === 11 && date > 15 ? currentYear + 1 : currentYear;
    const dDay = new Date(dDayYear, 11, 1, 7, 0, 0); // Dec 1, 7:00 AM
    const diffTime = dDay.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const formatted = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      currentMonthNum: month + 1, // 1-12
      currentDayNum: date,
      daysToDDay: diffDays,
      todayFormatted: formatted,
      currentPhaseCode: phase,
    };
  }, []);

  // Set default calendar month to current month on load
  useEffect(() => {
    if (currentMonthNum >= 7 && currentMonthNum <= 12) {
      setSelectedMonthIndex(currentMonthNum);
    } else {
      setSelectedMonthIndex(9); // Fallback to September
    }
  }, [currentMonthNum]);

  // "This Week Last Year" Events Radar (Around current day in current month)
  const thisWeekEvents = useMemo(() => {
    if (!data?.calendar_events) return [];
    return data.calendar_events.filter((evt) => {
      if (evt.month !== currentMonthNum) return false;
      const dayDiff = Math.abs(evt.day - currentDayNum);
      if (dayDiff > 4) return false;
      if (selectedTrack !== "all" && evt.track !== selectedTrack && evt.track !== "general") {
        return false;
      }
      return true;
    }).slice(0, 6);
  }, [data, currentMonthNum, currentDayNum, selectedTrack]);

  // Filtered Calendar Events based on active month & selected track
  const activeMonthOverview = useMemo(() => {
    if (!data?.months_overview) return null;
    return (
      data.months_overview.find((m) => m.month_index === selectedMonthIndex) ||
      data.months_overview[2] || // September default
      null
    );
  }, [data, selectedMonthIndex]);

  // Generate 7-column calendar matrix for the selected month
  const calendarDays = useMemo(() => {
    if (!activeMonthOverview) return [];
    const year = activeMonthOverview.year;
    const month = activeMonthOverview.month_index - 1; // 0-indexed for JS Date

    const firstDayDate = new Date(year, month, 1);
    // getDay: 0 = Sun, 1 = Mon ... 6 = Sat. We want Mon = 0, Sun = 6
    const firstDayCol = (firstDayDate.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before first day of month
    for (let i = 0; i < firstDayCol; i++) {
      days.push({ dayNumber: null, isoDate: null });
    }
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const padM = String(month + 1).padStart(2, "0");
      const padD = String(d).padStart(2, "0");
      const iso = `${year}-${padM}-${padD}`;
      days.push({ dayNumber: d, isoDate: iso });
    }
    return days;
  }, [activeMonthOverview]);

  // Filtered events for a specific day
  const getDayEvents = (isoDate: string | null) => {
    if (!isoDate || !data?.days_map) return [];
    const rawList = data.days_map[isoDate] || [];
    if (selectedTrack === "all") return rawList;
    return rawList.filter((e) => e.track === selectedTrack || e.track === "general");
  };

  // Filtered events for Timeline View
  const timelineEvents = useMemo(() => {
    if (!data?.calendar_events) return [];
    return data.calendar_events
      .filter((e) => {
        if (selectedTrack !== "all" && e.track !== selectedTrack && e.track !== "general") {
          return false;
        }
        return e.month >= 7 && e.month <= 12; // Focus Phase 1
      })
      .sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      });
  }, [data, selectedTrack]);

  // Search Vault Results
  const vaultSearchResults = useMemo(() => {
    if (!data?.calendar_events || !vaultSearchQuery.trim()) return [];
    const q = vaultSearchQuery.toLowerCase().trim();
    return data.calendar_events
      .filter((e) => {
        return (
          e.company.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [data, vaultSearchQuery]);

  // Active date's detail drawer events
  const selectedDateEvents = useMemo(() => {
    return getDayEvents(selectedDateIso);
  }, [selectedDateIso, data, selectedTrack]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-mono-tech">
          Synthesizing 2,584 blog announcements into recruitment calendar & timeline...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">
          Unable to load Placement Season Calendar
        </h3>
        <p className="text-xs text-muted-foreground font-mono-tech">
          {error || "Calendar data is currently unavailable."}
        </p>
      </div>
    );
  }

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "ppt":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "jaf":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "assessment":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "shortlist":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold";
      case "selection":
      case "slotting":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold";
      default:
        return "bg-muted text-muted-foreground border-border/60";
    }
  };

  const getCategoryDotColor = (cat: string) => {
    switch (cat) {
      case "ppt":
        return "bg-purple-500";
      case "jaf":
        return "bg-blue-500";
      case "assessment":
        return "bg-amber-500";
      case "shortlist":
        return "bg-emerald-500";
      case "selection":
      case "slotting":
        return "bg-rose-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. TOP HERO & RECRUITMENT PULSE RADAR */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 font-mono-tech text-[10px] font-bold px-2.5 py-0.5"
              >
                EMPIRICAL BLOG INTELLIGENCE (2025–26)
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech text-[10px] font-bold px-2.5 py-0.5"
              >
                2,584 VERIFIED ANNOUNCEMENTS
              </Badge>
              <span className="text-[11px] font-mono-tech text-muted-foreground">
                Today: <strong className="text-foreground">{todayFormatted}</strong> • Phase: <strong className="text-primary">{currentPhaseCode}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight flex items-center gap-2.5">
              <CalendarClock className="h-7 w-7 text-primary shrink-0" />
              IIT Bombay Recruitment Calendar & Track Timeline
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono-tech max-w-3xl">
              Chronological day-by-day record of when PPTs occurred, JAFs opened, OAs were held, and shortlists dropped last year. Know exactly what to expect this week.
            </p>
          </div>

          {/* D-Day Countdown & Playbook Quick Launch */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center sm:text-right flex-1 sm:flex-initial min-w-[140px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono-tech block">
                Countdown to Day 1.1
              </span>
              <div className="text-2xl font-black text-foreground font-mono-tech">
                {daysToDDay} <span className="text-xs font-normal text-muted-foreground">Days</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-mono-tech block">
                Dec 1 • 07:00 AM IST
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOAPlaybook(true)}
              className="h-14 rounded-2xl border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono-tech text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer px-3.5"
            >
              <Zap className="h-4 w-4" />
              <span>OA Overlap Guide</span>
            </Button>
          </div>
        </div>

        {/* 2. TRACK HUB SELECTOR BAR */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center text-xs font-mono-tech">
            <span className="font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" /> Select Your Preparation Domain:
            </span>
            <span className="text-muted-foreground text-[11px]">
              Filters all calendar events, test dates & milestones
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: "all", label: "All Tracks", icon: Layers, count: "2,584" },
              { id: "consulting", label: "Consulting & Strategy", icon: Briefcase, count: "116" },
              { id: "sde", label: "Software & Systems", icon: Code2, count: "540" },
              { id: "quant", label: "Quant & HFT", icon: TrendingUp, count: "131" },
              { id: "core", label: "Core Engg & FMCG", icon: Cog, count: "416" },
              { id: "analytics", label: "Product & ML", icon: BarChart2, count: "729" },
            ].map((trk) => {
              const IconComp = trk.icon;
              const isSelected = selectedTrack === trk.id;

              return (
                <button
                  key={trk.id}
                  onClick={() => setSelectedTrack(trk.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary ring-2 ring-primary/20 text-foreground shadow-xs"
                      : "bg-card/60 border-border/70 hover:border-border hover:bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <IconComp className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-[10px] font-mono-tech font-bold opacity-80">
                      {trk.count}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold font-display leading-tight truncate">
                    {trk.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. "THIS WEEK IN PLACEMENTS" LIVE RADAR */}
        <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/70 space-y-3 font-mono-tech">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                What Happened Last Year During This Exact Week:
              </span>
              <Badge variant="outline" className="text-[10px] font-bold bg-background">
                {activeMonthOverview?.month_name} {Math.max(1, currentDayNum - 3)}–{Math.min(30, currentDayNum + 4)}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Anchored to today's date ({todayFormatted})
            </span>
          </div>

          {/* This Week's Pinned Events */}
          {thisWeekEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {thisWeekEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedDateIso(evt.iso_date)}
                  className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-foreground">{evt.date}</span>
                    <Badge variant="outline" className={`text-[9px] uppercase px-1 py-0 ${getCategoryBadgeClass(evt.category)}`}>
                      {evt.category}
                    </Badge>
                  </div>
                  <div className="text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                    {evt.snippet}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic py-1">
              No specific events for the {selectedTrack} track occurred during this exact 7-day window last year.
            </div>
          )}

          {/* Tactical Advice for Current Month */}
          <div className="pt-2 border-t border-border/40 flex items-start gap-2 text-xs text-foreground/90">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-primary font-bold">This Month's Survival Focus: </strong>
              {activeMonthOverview?.tactical_guidance}
            </div>
          </div>
        </div>
      </div>

      {/* 4. VIEW CONTROLS & MONTH SELECTOR BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-border/70 pb-4">
        {/* Month Selector Pills (July - December) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-mono-tech">
          {[
            { index: 7, name: "July" },
            { index: 8, name: "August" },
            { index: 9, name: "September" },
            { index: 10, name: "October" },
            { index: 11, name: "November" },
            { index: 12, name: "December" },
          ].map((m) => {
            const isSelected = selectedMonthIndex === m.index;
            const isCurrent = currentMonthNum === m.index;

            return (
              <button
                key={m.index}
                onClick={() => setSelectedMonthIndex(m.index)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {m.name}
                {isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* View Switcher: Calendar vs Timeline */}
        <div className="flex items-center gap-2 font-mono-tech">
          <div className="p-1 rounded-xl bg-muted/60 border border-border/70 flex">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "calendar"
                  ? "bg-card text-foreground shadow-xs border border-border/70"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Calendar Grid
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "timeline"
                  ? "bg-card text-foreground shadow-xs border border-border/70"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Track Timeline
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSlottingPlaybook(true)}
            className="rounded-xl text-xs font-bold border-border/80 flex items-center gap-1 cursor-pointer"
          >
            <Award className="h-3.5 w-3.5 text-primary" /> D-Day Slots
          </Button>
        </div>
      </div>

      {/* 5. VIEW A: MONTHLY INTERACTIVE CALENDAR GRID */}
      {viewMode === "calendar" && activeMonthOverview && (
        <div className="space-y-4">
          {/* Month Header Banner */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-mono-tech font-bold">
                  {activeMonthOverview.phase_code}
                </Badge>
                <h3 className="text-xl font-black text-foreground font-display">
                  {activeMonthOverview.month_name} {activeMonthOverview.year}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono-tech">
                {activeMonthOverview.title} • {activeMonthOverview.theme}
              </p>
            </div>

            {/* Legend Chips */}
            <div className="flex items-center gap-2 flex-wrap font-mono-tech text-[10px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> PPT
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> JAF
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> OA (Test)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Shortlist
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> D-Day Slot
              </span>
            </div>
          </div>

          {/* 7-Column Day Calendar Grid */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-border/80 bg-muted/30 font-mono-tech text-xs font-extrabold text-muted-foreground text-center py-2.5">
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
              <div>SUN</div>
            </div>

            {/* Day Cells Matrix */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
              {calendarDays.map((cell, idx) => {
                if (!cell.dayNumber) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[105px] p-2 bg-muted/10"
                    />
                  );
                }

                const dayEvents = getDayEvents(cell.isoDate);
                const isToday =
                  selectedMonthIndex === currentMonthNum &&
                  cell.dayNumber === currentDayNum;
                const isSelectedDay = selectedDateIso === cell.isoDate;

                return (
                  <div
                    key={cell.isoDate}
                    onClick={() => setSelectedDateIso(cell.isoDate)}
                    className={`min-h-[110px] p-2 transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelectedDay
                        ? "bg-primary/5 ring-2 ring-primary inset-0 z-10"
                        : isToday
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-mono-tech font-black ${
                          isToday
                            ? "h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                            : "text-foreground group-hover:text-primary transition-colors"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono-tech text-muted-foreground">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Badges in Day Cell */}
                    <div className="space-y-1 mt-1 font-mono-tech">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded truncate font-semibold border flex items-center gap-1 ${getCategoryBadgeClass(
                            evt.category
                          )}`}
                          title={evt.title}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getCategoryDotColor(evt.category)}`} />
                          <span className="truncate">{evt.company || evt.title}</span>
                        </div>
                      ))}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-muted-foreground font-bold pl-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW B: CHRONOLOGICAL TRACK TIMELINE */}
      {viewMode === "timeline" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 flex justify-between items-center text-xs font-mono-tech">
            <span className="font-extrabold text-foreground uppercase tracking-wider">
              Chronological Sequence of Events for {selectedTrack.toUpperCase()}:
            </span>
            <span className="text-muted-foreground">
              {timelineEvents.length} Total Events Recorded
            </span>
          </div>

          <div className="space-y-3 font-mono-tech">
            {timelineEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedDateIso(evt.iso_date)}
                className="p-4 rounded-2xl bg-card border border-border/70 hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground font-mono-tech">
                      {evt.date}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase px-1.5 py-0 ${getCategoryBadgeClass(evt.category)}`}
                    >
                      {evt.category}
                    </Badge>
                    <span className="text-[10px] uppercase text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      {evt.track}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {evt.snippet}
                  </p>
                </div>

                {evt.company && onSelectCompany && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCompany(evt.company_slug);
                    }}
                    className="shrink-0 text-xs font-bold text-primary hover:text-primary cursor-pointer flex items-center gap-1"
                  >
                    Explore Dossier <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. DAY-DETAIL SLIDE-OVER DRAWER */}
      {selectedDateIso && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-card border-l border-border p-6 sm:p-7 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge className="bg-primary text-primary-foreground font-mono-tech text-[10px] font-bold">
                  CAMPUS ANNOUNCEMENT AUDIT
                </Badge>
                <h3 className="text-2xl font-black text-foreground font-display">
                  {selectedDateIso}
                </h3>
                <p className="text-xs text-muted-foreground font-mono-tech">
                  {selectedDateEvents.length} Official Placement Blog Broadcast(s) on this date
                </p>
              </div>

              <button
                onClick={() => setSelectedDateIso(null)}
                className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of announcements on this day */}
            <div className="space-y-4 font-mono-tech">
              {selectedDateEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-3"
                >
                  <div className="flex justify-between items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase px-1.5 py-0.5 ${getCategoryBadgeClass(evt.category)}`}
                    >
                      {evt.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      Track: {evt.track}
                    </span>
                  </div>

                  <div className="text-sm font-black text-foreground leading-snug">
                    {evt.title}
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {evt.snippet}
                  </p>

                  {evt.company && onSelectCompany && (
                    <div className="pt-2 border-t border-border/40 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDateIso(null);
                          onSelectCompany(evt.company_slug);
                        }}
                        className="rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        Open {evt.company} Recruiter Dossier <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. OCTOBER OA OVERLAP & FATIGUE SURVIVAL PLAYBOOK MODAL */}
      {showOAPlaybook && data?.oa_survival_guide && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-3xl p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl font-mono-tech">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                  {data.oa_survival_guide.badge}
                </Badge>
                <h3 className="text-2xl font-black text-foreground font-display">
                  {data.oa_survival_guide.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {data.oa_survival_guide.description}
                </p>
              </div>

              <button
                onClick={() => setShowOAPlaybook(false)}
                className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Consecutive Test Rules */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" /> Back-to-Back Test Strategy (8:00 PM & 9:45 PM):
              </h4>
              <div className="space-y-2.5">
                {data.oa_survival_guide.consecutive_test_strategy.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1"
                  >
                    <div className="text-xs font-bold text-primary">
                      {item.rule}
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekend Window Tactics */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> 24-Hour Weekend Open Window Strategy:
              </h4>
              {data.oa_survival_guide.weekend_window_strategy.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/25 space-y-1.5 text-xs"
                >
                  <div className="font-bold text-rose-600 dark:text-rose-400">
                    {w.window_type}
                  </div>
                  <div className="font-extrabold text-foreground">
                    ⚠️ {w.golden_rule}
                  </div>
                  <p className="text-muted-foreground">{w.why}</p>
                  <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    ✅ Recommended Window: {w.best_time_to_start}
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Proctoring Profiles */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary" /> Platform Proctoring Quirks & Disqualification Traps:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.oa_survival_guide.platform_proctoring_profiles.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2 text-xs"
                  >
                    <div className="font-extrabold text-foreground flex justify-between items-center">
                      <span>{p.platform}</span>
                    </div>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {p.traps_to_avoid.map((trap, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">›</span>
                          <span>{trap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowOAPlaybook(false)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Playbook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 9. D-DAY SLOTTING PLAYBOOK MODAL */}
      {showSlottingPlaybook && data?.dday_slotting_playbook && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-3xl p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl font-mono-tech">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                  D-DAY (DEC 1–15) INTERVIEWS
                </Badge>
                <h3 className="text-2xl font-black text-foreground font-display">
                  {data.dday_slotting_playbook.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {data.dday_slotting_playbook.description}
                </p>
              </div>

              <button
                onClick={() => setShowSlottingPlaybook(false)}
                className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.dday_slotting_playbook.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <Badge className="bg-primary text-primary-foreground text-xs font-black">
                      {slot.slot_code}
                    </Badge>
                    <span className="text-xs font-bold text-muted-foreground">
                      {slot.timing}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {slot.characteristics}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Recruiters:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {slot.historical_recruiters.map((rec, rIdx) => (
                        <span
                          key={rIdx}
                          className="text-[10px] bg-card text-foreground px-1.5 py-0.5 rounded border border-border/60"
                        >
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-foreground/90">
                    <strong className="text-amber-600 dark:text-amber-400 block mb-0.5">
                      Sequencing Strategy:
                    </strong>
                    {slot.collision_strategy}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowSlottingPlaybook(false)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Slotting Playbook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 10. SEARCHABLE ALL-ANNOUNCEMENTS VAULT DRAWER */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 font-mono-tech">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-lg font-black text-foreground font-display flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Searchable Placement Blog Vault (2,584 Announcements)
            </h4>
            <p className="text-xs text-muted-foreground">
              Search any company (e.g. Flipkart, Kearney, Jane Street) to see their full recruitment lifecycle.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={vaultSearchQuery}
            onChange={(e) => setVaultSearchQuery(e.target.value)}
            placeholder="Search company name, test format, shortlist announcement (e.g., 'Flipkart', 'HackerRank', 'Shortlist')..."
            className="pl-10 h-11 rounded-2xl bg-muted/40 border-border/80 text-xs font-mono-tech"
          />
        </div>

        {vaultSearchQuery.trim() && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-muted-foreground">
              Found {vaultSearchResults.length} matching announcements:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {vaultSearchResults.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedDateIso(evt.iso_date)}
                  className="p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-primary transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-foreground">{evt.date}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase px-1 py-0 ${getCategoryBadgeClass(evt.category)}`}
                    >
                      {evt.category}
                    </Badge>
                  </div>
                  <div className="text-xs font-extrabold text-foreground truncate">
                    {evt.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {evt.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
