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
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  BookOpen,
  X,
  Zap,
  Info,
  Laptop,
  FileText,
  Users,
  Bell,
  Globe,
  ArrowRight,
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

  // Dedicated announcement popup modal (for search results or quick inspecting)
  const [selectedAnnouncementPopup, setSelectedAnnouncementPopup] =
    useState<CalendarEvent | null>(null);

  // Set of expanded event IDs for "Read more / Show less" toggle
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(
    new Set()
  );

  // Search vault query
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [showOAPlaybook, setShowOAPlaybook] = useState(false);
  const [showSlottingPlaybook, setShowSlottingPlaybook] = useState(false);

  const toggleExpandEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
  const {
    currentMonthNum,
    currentDayNum,
    daysToDDay,
    todayFormatted,
    currentPhaseCode,
  } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 6 = July, 7 = Aug, 8 = Sept, 9 = Oct, 10 = Nov, 11 = Dec
    const date = now.getDate();

    let phase = "Phase 1A";
    if (month === 6) phase = "Phase 0 (Kickoff & CVs)";
    else if (month === 7 || month === 8)
      phase = "Phase 1A (PPTs & Diagnostic Tests)";
    else if (month === 9) phase = "Phase 1B (The OA Blitz)";
    else if (month === 10) phase = "Phase 1C (Shortlist Drops & Slotting)";
    else if (month === 11 && date <= 15)
      phase = "Phase 1D (D-Day Interviews)";
    else phase = "Phase 2 (Spring Wave)";

    // Target: Next December 1
    const currentYear = now.getFullYear();
    const dDayYear =
      month === 11 && date > 15 ? currentYear + 1 : currentYear;
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
    return data.calendar_events
      .filter((evt) => {
        if (evt.month !== currentMonthNum) return false;
        const dayDiff = Math.abs(evt.day - currentDayNum);
        if (dayDiff > 4) return false;
        if (
          selectedTrack !== "all" &&
          evt.track !== selectedTrack &&
          evt.track !== "general"
        ) {
          return false;
        }
        return true;
      })
      .slice(0, 6);
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
    return rawList.filter(
      (e) => e.track === selectedTrack || e.track === "general"
    );
  };

  // Filtered events for Timeline View
  const timelineEvents = useMemo(() => {
    if (!data?.calendar_events) return [];
    return data.calendar_events
      .filter((e) => {
        if (
          selectedTrack !== "all" &&
          e.track !== selectedTrack &&
          e.track !== "general"
        ) {
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
          e.snippet.toLowerCase().includes(q) ||
          (e.content && e.content.toLowerCase().includes(q))
        );
      })
      .slice(0, 24);
  }, [data, vaultSearchQuery]);

  // Active date's detail drawer events
  const selectedDateEvents = useMemo(() => {
    return getDayEvents(selectedDateIso);
  }, [selectedDateIso, data, selectedTrack]);

  // Helper for category presentation
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "ppt":
        return {
          label: "Pre-Placement Talk",
          shortLabel: "PPT",
          icon: <Presentation className="h-3 w-3" />,
          badgeClass:
            "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
          dotColor: "bg-purple-500",
          borderAccent: "border-l-purple-500",
          cardBg: "hover:border-purple-500/40",
        };
      case "jaf":
        return {
          label: "JAF Announcement",
          shortLabel: "JAF",
          icon: <FileText className="h-3 w-3" />,
          badgeClass:
            "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          dotColor: "bg-blue-500",
          borderAccent: "border-l-blue-500",
          cardBg: "hover:border-blue-500/40",
        };
      case "assessment":
        return {
          label: "Online Assessment",
          shortLabel: "OA / Test",
          icon: <Laptop className="h-3 w-3" />,
          badgeClass:
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          dotColor: "bg-amber-500",
          borderAccent: "border-l-amber-500",
          cardBg: "hover:border-amber-500/40",
        };
      case "shortlist":
        return {
          label: "Interview Shortlist",
          shortLabel: "Shortlist",
          icon: <Users className="h-3 w-3" />,
          badgeClass:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          dotColor: "bg-emerald-500",
          borderAccent: "border-l-emerald-500",
          cardBg: "hover:border-emerald-500/40",
        };
      case "selection":
        return {
          label: "Selection & Offer",
          shortLabel: "Selection",
          icon: <Award className="h-3 w-3" />,
          badgeClass:
            "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
          dotColor: "bg-green-500",
          borderAccent: "border-l-green-500",
          cardBg: "hover:border-green-500/40",
        };
      case "slotting":
        return {
          label: "Day Slot Matrix",
          shortLabel: "Slotting",
          icon: <ShieldAlert className="h-3 w-3" />,
          badgeClass:
            "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          dotColor: "bg-rose-500",
          borderAccent: "border-l-rose-500",
          cardBg: "hover:border-rose-500/40",
        };
      default:
        return {
          label: "Campus Notice",
          shortLabel: "Notice",
          icon: <Bell className="h-3 w-3" />,
          badgeClass:
            "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
          dotColor: "bg-slate-400",
          borderAccent: "border-l-slate-400",
          cardBg: "hover:border-slate-500/40",
        };
    }
  };

  // Helper for track presentation
  const getTrackDetails = (track: string) => {
    switch (track) {
      case "consulting":
        return {
          label: "Consulting",
          icon: "💼",
          badgeClass:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        };
      case "sde":
        return {
          label: "SDE / Software",
          icon: "💻",
          badgeClass:
            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        };
      case "quant":
        return {
          label: "Quant / HFT",
          icon: "📈",
          badgeClass:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        };
      case "core":
        return {
          label: "Core Eng",
          icon: "⚙️",
          badgeClass:
            "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
        };
      case "analytics":
        return {
          label: "Product & ML",
          icon: "📊",
          badgeClass:
            "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
        };
      default:
        return {
          label: "General",
          icon: "📢",
          badgeClass: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-mono-tech">
          Synthesizing 2,584 blog announcements into recruitment calendar &
          timeline...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">
          Season Roadmap Unavailable
        </h3>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO COMMAND & TELEMETRY BAR */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap font-mono-tech">
              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold flex items-center gap-1.5 py-1 px-3">
                <CalendarClock className="h-3.5 w-3.5" /> 2025–26 SEASON CHRONOLOGY
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-bold"
              >
                📍 TODAY: {todayFormatted} ({currentPhaseCode})
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/5 font-bold"
              >
                2,584 Blog Broadcasts Indexed
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-display">
              Placement Season Recruitment Calendar & Track Timeline
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore day-by-day recruitment announcements, corporate PPTs, JAF
              openings, and online assessments from last year. Filter strictly by
              your career domain to see what to anticipate at each stage of the season.
            </p>
          </div>

          {/* D-Day Countdown Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-4 shrink-0 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg font-mono-tech">
              ⏳
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono-tech font-bold text-muted-foreground tracking-wider">
                Countdown to D-Day (Dec 1)
              </div>
              <div className="text-2xl font-black text-foreground font-display">
                {daysToDDay} Days Left
              </div>
              <div className="text-[11px] text-muted-foreground font-mono-tech">
                Day 1.1 Slot: Dec 1, 07:00 AM IST
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRACK HUB: DOMAIN-SPECIFIC FILTERING */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-mono-tech font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" /> Sector / Track Focus
          </span>
          <span className="text-xs font-mono-tech text-muted-foreground">
            Selecting a track re-renders the calendar and timeline specifically
            for that industry.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono-tech">
          {[
            { id: "all", label: "All Tracks", icon: "🌐", count: 2584 },
            {
              id: "consulting",
              label: "Consulting",
              icon: "💼",
              count: 124,
            },
            { id: "sde", label: "SDE / Tech", icon: "💻", count: 540 },
            { id: "quant", label: "Quant / HFT", icon: "📈", count: 131 },
            { id: "core", label: "Core Eng", icon: "⚙️", count: 415 },
            {
              id: "analytics",
              label: "Product & ML",
              icon: "📊",
              count: 726,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTrack(t.id as any)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedTrack === t.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card hover:bg-muted/50 border-border text-foreground"
              }`}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs font-extrabold truncate">{t.label}</div>
              <div
                className={`text-[10px] mt-0.5 ${
                  selectedTrack === t.id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {t.count} Events
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. THIS WEEK IN PLACEMENTS LIVE RADAR */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-card to-primary/5 border border-emerald-500/30 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-base font-extrabold text-foreground font-display flex items-center gap-2">
                This Week in Placements (What Happened Last Year)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono-tech">
              Historical broadcasts around September {currentDayNum} for{" "}
              <strong className="text-foreground">
                {selectedTrack.toUpperCase()}
              </strong>
            </p>
          </div>

          <Badge
            variant="outline"
            className="bg-background/80 text-foreground border-border text-xs font-bold font-mono-tech"
          >
            Sept {Math.max(1, currentDayNum - 3)} – Sept{" "}
            {Math.min(30, currentDayNum + 3)}
          </Badge>
        </div>

        {/* Radar Event Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {thisWeekEvents.length === 0 ? (
            <div className="col-span-3 py-4 text-center text-xs text-muted-foreground font-mono-tech">
              No historical announcements recorded for {selectedTrack} during
              this exact window. Switch to &ldquo;All Tracks&rdquo; to see
              campus-wide events.
            </div>
          ) : (
            thisWeekEvents.map((evt) => {
              const catDetails = getCategoryDetails(evt.category);
              const trackDetails = getTrackDetails(evt.track);
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedDateIso(evt.iso_date)}
                  className={`p-3.5 rounded-2xl bg-card border border-border/80 ${catDetails.cardBg} hover:shadow-sm transition-all cursor-pointer space-y-2 border-l-4 ${catDetails.borderAccent} group`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono-tech">
                    <span className="font-bold text-foreground">{evt.date}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase px-1.5 py-0 flex items-center gap-1 ${catDetails.badgeClass}`}
                    >
                      {catDetails.icon}
                      <span>{catDetails.shortLabel}</span>
                    </Badge>
                  </div>

                  <div className="text-xs font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {evt.title}
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {evt.snippet}
                  </p>

                  <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[10px] font-mono-tech">
                    <span className="text-muted-foreground">
                      {trackDetails.icon} {trackDetails.label}
                    </span>
                    <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Day <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pinned Tactical Guidance */}
        <div className="p-3.5 rounded-2xl bg-background/70 border border-border/60 flex items-center gap-3 text-xs font-mono-tech">
          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="text-muted-foreground">
            <strong className="text-foreground">Tactical Rule:</strong> Attendance
            at Pre-Placement Talks (PPTs) for firms like Kearney or Flipkart is
            often logged by the Placement Cell and used as a hard filter for CV
            shortlisting consideration.
          </div>
        </div>
      </div>

      {/* 4. VIEW CONTROLS & MONTH SELECTOR BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-4">
        {/* Month Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 font-mono-tech">
          {[
            { num: 7, label: "July" },
            { num: 8, label: "August" },
            { num: 9, label: "September" },
            { num: 10, label: "October" },
            { num: 11, label: "November" },
            { num: 12, label: "December" },
          ].map((m) => {
            const isCurrent = m.num === currentMonthNum;
            const isSelected = m.num === selectedMonthIndex;
            return (
              <button
                key={m.num}
                onClick={() => {
                  setSelectedMonthIndex(m.num);
                  setViewMode("calendar");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-foreground text-background shadow-xs"
                    : isCurrent
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                {isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {m.label}
              </button>
            );
          })}
        </div>

        {/* View Switcher & Playbook Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOAPlaybook(true)}
            className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 cursor-pointer"
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" /> October OA Survival
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSlottingPlaybook(true)}
            className="rounded-xl text-xs font-bold border-border/80 flex items-center gap-1 cursor-pointer"
          >
            <Award className="h-3.5 w-3.5 text-primary" /> D-Day Slots
          </Button>

          <div className="flex items-center p-1 rounded-xl bg-muted border border-border">
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
        </div>
      </div>

      {/* 5. VIEW A: MONTHLY INTERACTIVE CALENDAR GRID */}
      {viewMode === "calendar" && activeMonthOverview && (
        <div className="space-y-4">
          {/* Month Header Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-card via-card to-primary/5 border border-border/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
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

            {/* Legend Chips with Icons */}
            <div className="flex items-center gap-2 flex-wrap font-mono-tech text-[10px]">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold">
                <Presentation className="h-3 w-3" /> PPT
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold">
                <FileText className="h-3 w-3" /> JAF
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold">
                <Laptop className="h-3 w-3" /> OA (Test)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                <Users className="h-3 w-3" /> Shortlist
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-bold">
                <Award className="h-3 w-3" /> D-Day Slot
              </span>
            </div>
          </div>

          {/* 7-Column Day Calendar Grid */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-border/80 bg-muted/40 font-mono-tech text-xs font-extrabold text-muted-foreground text-center py-3">
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
                      className="min-h-[110px] p-2 bg-muted/10"
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
                    className={`min-h-[115px] p-2.5 transition-all cursor-pointer flex flex-col justify-between group rounded-lg ${
                      isSelectedDay
                        ? "bg-primary/10 ring-2 ring-primary inset-0 z-10 shadow-sm"
                        : isToday
                        ? "bg-emerald-500/10 ring-2 ring-emerald-500/50 hover:bg-emerald-500/15"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-mono-tech font-black ${
                            isToday
                              ? "h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                              : "text-foreground group-hover:text-primary transition-colors"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-mono-tech font-bold uppercase text-emerald-600 dark:text-emerald-400">
                            Today
                          </span>
                        )}
                      </div>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono-tech font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Badges in Day Cell */}
                    <div className="space-y-1 mt-1 font-mono-tech">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const catDetails = getCategoryDetails(evt.category);
                        return (
                          <div
                            key={evt.id}
                            className={`text-[9px] px-1.5 py-0.5 rounded-md truncate font-semibold border flex items-center gap-1 shadow-2xs ${catDetails.badgeClass}`}
                            title={evt.title}
                          >
                            <span className="shrink-0">{catDetails.icon}</span>
                            <span className="truncate">
                              {evt.company || evt.title}
                            </span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-muted-foreground font-extrabold pl-1 flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          <span>+{dayEvents.length - 2} more</span>
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
          <div className="p-4 rounded-2xl bg-card border border-border/80 flex justify-between items-center text-xs font-mono-tech shadow-xs">
            <span className="font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Chronological Sequence
              of Events for {selectedTrack.toUpperCase()}:
            </span>
            <span className="text-muted-foreground">
              {timelineEvents.length} Total Announcements Recorded
            </span>
          </div>

          <div className="space-y-3 font-mono-tech relative before:absolute before:inset-0 before:left-3 sm:before:left-5 before:w-0.5 before:bg-border/60 before:z-0">
            {timelineEvents.map((evt) => {
              const catDetails = getCategoryDetails(evt.category);
              const trackDetails = getTrackDetails(evt.track);
              const isExpanded = expandedEventIds.has(evt.id);

              return (
                <div
                  key={evt.id}
                  className={`relative z-10 p-5 rounded-2xl bg-card border border-border/80 border-l-4 ${catDetails.borderAccent} ${catDetails.cardBg} hover:shadow-md transition-all space-y-3 group`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-foreground font-mono-tech">
                        {evt.date}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase px-2 py-0.5 flex items-center gap-1 font-bold ${catDetails.badgeClass}`}
                      >
                        {catDetails.icon}
                        <span>{catDetails.label}</span>
                      </Badge>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                        {trackDetails.icon} {trackDetails.label}
                      </span>
                      {evt.company && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold bg-primary/5 text-primary border-primary/25"
                        >
                          {evt.company}
                        </Badge>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedDateIso(evt.iso_date)}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" /> View Day Broadcasts
                    </button>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm sm:text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                    {evt.title}
                  </h4>

                  {/* Announcement Content with Expand / Collapse */}
                  <div className="text-xs text-foreground/90 leading-relaxed font-sans">
                    <p className={isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}>
                      {isExpanded
                        ? evt.content || evt.snippet
                        : evt.snippet}
                    </p>

                    <button
                      onClick={(e) => toggleExpandEvent(evt.id, e)}
                      className="mt-1.5 text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" /> Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" /> Read Full Announcement
                        </>
                      )}
                    </button>
                  </div>

                  {/* External Links attached to this announcement */}
                  {evt.external_links && evt.external_links.length > 0 && (
                    <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                      {evt.external_links.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5" /> Open Broadcast Portal Link{" "}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Verified Recruiter Dossier Button (ONLY rendered if verified company dossier exists!) */}
                  {evt.has_dossier && evt.company_slug && onSelectCompany && (
                    <div className="pt-2 border-t border-border/40 flex justify-end">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCompany(evt.company_slug);
                        }}
                        className="rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        Open {evt.company} Intelligence Dossier{" "}
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
                  {selectedDateEvents.length} Official Placement Blog Broadcast(s)
                  recorded on this date
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
              {selectedDateEvents.map((evt) => {
                const catDetails = getCategoryDetails(evt.category);
                const trackDetails = getTrackDetails(evt.track);
                const isExpanded = expandedEventIds.has(evt.id);

                return (
                  <div
                    key={evt.id}
                    className={`p-5 rounded-2xl bg-muted/30 border border-border/70 border-l-4 ${catDetails.borderAccent} space-y-3`}
                  >
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase px-2 py-0.5 flex items-center gap-1 font-bold ${catDetails.badgeClass}`}
                      >
                        {catDetails.icon}
                        <span>{catDetails.label}</span>
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        {trackDetails.icon} {trackDetails.label}
                      </span>
                    </div>

                    <div className="text-sm font-black text-foreground leading-snug">
                      {evt.title}
                    </div>

                    {/* Announcement text with expandable view */}
                    <div className="text-xs text-foreground/90 leading-relaxed font-sans">
                      <p className={isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"}>
                        {isExpanded
                          ? evt.content || evt.snippet
                          : evt.snippet}
                      </p>

                      <button
                        onClick={(e) => toggleExpandEvent(evt.id, e)}
                        className="mt-1.5 text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" /> Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" /> Read Full Announcement
                          </>
                        )}
                      </button>
                    </div>

                    {/* External links if attached to announcement */}
                    {evt.external_links && evt.external_links.length > 0 && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                        {evt.external_links.map((link, lIdx) => (
                          <a
                            key={lIdx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                          >
                            <Globe className="h-3.5 w-3.5" /> Official Broadcast Link{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Working Recruiter Dossier Link (ONLY rendered if verified company dossier exists!) */}
                    {evt.has_dossier && evt.company_slug && onSelectCompany && (
                      <div className="pt-2 border-t border-border/40 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDateIso(null);
                            onSelectCompany(evt.company_slug);
                          }}
                          className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          Open {evt.company} Recruiter Dossier{" "}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. DEDICATED ANNOUNCEMENT POPUP MODAL (Solves search redirect issue!) */}
      {selectedAnnouncementPopup && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-7 overflow-y-auto max-h-[88vh] space-y-5 shadow-2xl font-mono-tech">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-foreground">
                    {selectedAnnouncementPopup.date}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase px-2 py-0.5 flex items-center gap-1 font-bold ${getCategoryDetails(
                      selectedAnnouncementPopup.category
                    ).badgeClass}`}
                  >
                    {getCategoryDetails(selectedAnnouncementPopup.category).icon}
                    <span>
                      {
                        getCategoryDetails(selectedAnnouncementPopup.category)
                          .label
                      }
                    </span>
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 uppercase">
                    {getTrackDetails(selectedAnnouncementPopup.track).icon}{" "}
                    {getTrackDetails(selectedAnnouncementPopup.track).label}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-foreground font-display leading-snug">
                  {selectedAnnouncementPopup.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedAnnouncementPopup(null)}
                className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Full announcement body */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3 font-sans">
              <div className="text-xs font-mono-tech font-bold text-muted-foreground uppercase tracking-wider">
                Full Announcement Broadcast:
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncementPopup.content ||
                  selectedAnnouncementPopup.snippet}
              </p>
            </div>

            {/* External Links if attached */}
            {selectedAnnouncementPopup.external_links &&
              selectedAnnouncementPopup.external_links.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground">
                    Attached Official Links:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnnouncementPopup.external_links.map(
                      (link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5" /> Open Form / Submission
                          Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Action Footer */}
            <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const date = selectedAnnouncementPopup.iso_date;
                  setSelectedAnnouncementPopup(null);
                  setSelectedDateIso(date);
                }}
                className="w-full sm:w-auto rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-primary" /> View All Broadcasts
                for This Day
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedAnnouncementPopup.has_dossier &&
                  selectedAnnouncementPopup.company_slug &&
                  onSelectCompany && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const slug = selectedAnnouncementPopup.company_slug;
                        setSelectedAnnouncementPopup(null);
                        onSelectCompany(slug);
                      }}
                      className="w-full sm:w-auto rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                    >
                      Open {selectedAnnouncementPopup.company} Dossier{" "}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAnnouncementPopup(null)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. OCTOBER OA OVERLAP & FATIGUE SURVIVAL PLAYBOOK MODAL */}
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
                <Flame className="h-4 w-4 text-amber-500" /> Back-to-Back Test
                Strategy (8:00 PM & 9:45 PM):
              </h4>
              <div className="space-y-2.5">
                {data.oa_survival_guide.consecutive_test_strategy.map(
                  (item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1"
                    >
                      <div className="text-xs font-bold text-primary">
                        {item.rule}
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                        {item.action}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Weekend Window Tactics */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> 24-Hour
                Weekend Open Window Strategy:
              </h4>
              {data.oa_survival_guide.weekend_window_strategy.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/25 space-y-1.5 text-xs font-sans"
                >
                  <div className="font-bold text-rose-600 dark:text-rose-400 font-mono-tech">
                    {w.window_type}
                  </div>
                  <div className="font-extrabold text-foreground">
                    ⚠️ {w.golden_rule}
                  </div>
                  <p className="text-muted-foreground">{w.why}</p>
                  <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-bold font-mono-tech">
                    ✅ Recommended Window: {w.best_time_to_start}
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Proctoring Profiles */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary" /> Platform
                Proctoring Quirks & Disqualification Traps:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.oa_survival_guide.platform_proctoring_profiles.map(
                  (p, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2 text-xs"
                    >
                      <div className="font-extrabold text-foreground flex justify-between items-center">
                        <span>{p.platform}</span>
                      </div>
                      <ul className="space-y-1 text-muted-foreground text-[11px] font-sans">
                        {p.traps_to_avoid.map((trap, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-1.5">
                            <span className="text-primary font-bold">›</span>
                            <span>{trap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
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

      {/* 10. D-DAY SLOTTING PLAYBOOK MODAL */}
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

                  <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                    {slot.characteristics}
                  </p>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Recruiters:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {slot.historical_recruiters.map((r, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2 py-0.5 rounded-md bg-card border border-border text-[10px] font-bold text-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-background/80 border border-border/60 text-[11px] text-muted-foreground font-sans">
                    <strong className="text-foreground">Collision Strategy:</strong>{" "}
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
                Close Playbook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 11. SEARCHABLE ALL-ANNOUNCEMENTS VAULT */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4 shadow-xs">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="text-base font-extrabold text-foreground font-display flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" /> Searchable Placement
              Blog Vault (2,584 Announcements)
            </h3>
            <p className="text-xs text-muted-foreground font-mono-tech">
              Search any company (e.g. Flipkart, Kearney, Jane Street) or keyword to
              instantly view the full announcement details in a popup.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={vaultSearchQuery}
            onChange={(e) => setVaultSearchQuery(e.target.value)}
            placeholder="Search company name, test format, shortlist announcement (e.g., 'Flipkart', 'HackerRank', 'Shortlist')..."
            className="pl-10 h-11 rounded-2xl bg-muted/30 border-border text-sm font-mono-tech"
          />
        </div>

        {vaultSearchQuery.trim() && (
          <div className="space-y-3 font-mono-tech pt-2">
            <div className="text-xs font-bold text-muted-foreground flex justify-between items-center">
              <span>Found {vaultSearchResults.length} matching announcements:</span>
              <span className="text-[11px]">Click any card to open full details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {vaultSearchResults.map((evt) => {
                const catDetails = getCategoryDetails(evt.category);
                const trackDetails = getTrackDetails(evt.track);

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedAnnouncementPopup(evt)}
                    className={`p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-primary/60 border-l-4 ${catDetails.borderAccent} hover:shadow-md transition-all cursor-pointer space-y-2 group`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-foreground">{evt.date}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase px-1.5 py-0 flex items-center gap-1 ${catDetails.badgeClass}`}
                      >
                        {catDetails.icon}
                        <span>{catDetails.shortLabel}</span>
                      </Badge>
                    </div>

                    <div className="text-xs font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {evt.title}
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                      {evt.snippet}
                    </p>

                    <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[10px]">
                      <span className="text-muted-foreground">
                        {trackDetails.icon} {trackDetails.label}
                      </span>
                      <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Open Details <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
