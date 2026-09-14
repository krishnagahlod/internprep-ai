"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
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
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  BookOpen,
} from "lucide-react";
import {
  SeasonRoadmapData,
  RoadmapPhase,
  RoadmapPhaseMilestone,
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

  // View state
  const [activePhaseId, setActivePhaseId] = useState<string>("phase-1a");
  const [seasonMode, setSeasonMode] = useState<"phase_1" | "full">("phase_1");
  const [selectedTrack, setSelectedTrack] = useState<
    "all" | "sde" | "quant" | "consulting" | "core" | "analytics"
  >("all");
  const [activeSubTab, setActiveSubTab] = useState<
    "roadmap" | "slotting" | "tracks"
  >("roadmap");

  // Checklist state stored in localStorage
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load persisted checklist
    try {
      const saved = localStorage.getItem("iitb_placement_milestone_checks");
      if (saved) {
        setCheckedMilestones(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to read milestone checks from localStorage", e);
    }
  }, []);

  const toggleMilestone = (id: string) => {
    setCheckedMilestones((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(
          "iitb_placement_milestone_checks",
          JSON.stringify(updated)
        );
      } catch (e) {
        console.warn("Failed to persist milestone checks", e);
      }
      return updated;
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
  const { currentPhaseId, daysToDDay, todayFormatted } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 6 = July, 7 = Aug, 8 = Sept, 9 = Oct, 10 = Nov, 11 = Dec
    const date = now.getDate();

    let computedPhase = "phase-1a";
    if (month === 6) computedPhase = "phase-0"; // July
    else if (month === 7 || month === 8) computedPhase = "phase-1a"; // Aug - Sept
    else if (month === 9) computedPhase = "phase-1b"; // Oct
    else if (month === 10) computedPhase = "phase-1c"; // Nov
    else if (month === 11 && date <= 15) computedPhase = "phase-1d"; // Dec 1-15
    else computedPhase = "phase-2"; // Jan - June

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
      currentPhaseId: computedPhase,
      daysToDDay: diffDays,
      todayFormatted: formatted,
    };
  }, []);

  // Set default active phase to current computed phase once loaded
  useEffect(() => {
    if (currentPhaseId) {
      setActivePhaseId(currentPhaseId);
    }
  }, [currentPhaseId]);

  // Filtered phases based on mode
  const displayedPhases = useMemo(() => {
    if (!data?.phases) return [];
    if (seasonMode === "phase_1") {
      return data.phases.filter((p) => p.season_group === "phase_1");
    }
    return data.phases;
  }, [data, seasonMode]);

  const activePhase = useMemo(() => {
    if (!data?.phases) return null;
    return (
      data.phases.find((p) => p.id === activePhaseId) || data.phases[0] || null
    );
  }, [data, activePhaseId]);

  // Overall milestone statistics
  const milestoneStats = useMemo(() => {
    if (!data?.phases) return { total: 0, completed: 0, pct: 0 };
    let total = 0;
    let completed = 0;
    const phasesToCount =
      seasonMode === "phase_1"
        ? data.phases.filter((p) => p.season_group === "phase_1")
        : data.phases;

    phasesToCount.forEach((p) => {
      p.weekly_milestones?.forEach((m) => {
        total += 1;
        if (checkedMilestones[m.id]) completed += 1;
      });
    });

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
  }, [data, seasonMode, checkedMilestones]);

  // Phase milestone filtering by career track
  const filteredMilestones = useMemo(() => {
    if (!activePhase?.weekly_milestones) return [];
    if (selectedTrack === "all") return activePhase.weekly_milestones;
    return activePhase.weekly_milestones.filter(
      (m) => m.tracks.includes(selectedTrack) || m.tracks.includes("all")
    );
  }, [activePhase, selectedTrack]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-mono-tech">
          Synthesizing 2,584 blog announcements into season timeline & milestones...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">
          Unable to load Placement Season Roadmap
        </h3>
        <p className="text-xs text-muted-foreground font-mono-tech">
          {error || "Season data is currently unavailable."}
        </p>
      </div>
    );
  }

  const getPhaseIcon = (iconName: string) => {
    switch (iconName) {
      case "FileCheck":
        return FileCheck;
      case "Presentation":
        return Presentation;
      case "Terminal":
        return Terminal;
      case "Award":
        return Award;
      case "Briefcase":
        return Briefcase;
      default:
        return Compass;
    }
  };

  const getTrackIcon = (trackKey: string) => {
    switch (trackKey) {
      case "sde":
        return Code2;
      case "quant":
        return TrendingUp;
      case "consulting":
        return Briefcase;
      case "core":
        return Cog;
      case "analytics":
        return BarChart2;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. TOP SEASON TELEMETRY & CHRONO-ANCHOR BAR */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 font-mono-tech text-[10px] font-bold px-2.5 py-0.5"
              >
                SEASON 2025–26 TELEMETRY
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono-tech text-[10px] font-bold px-2.5 py-0.5"
              >
                2,584 VERIFIED ANNOUNCEMENTS
              </Badge>
              <span className="text-[11px] font-mono-tech text-muted-foreground">
                Today: <strong className="text-foreground">{todayFormatted}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight flex items-center gap-2.5">
              <CalendarClock className="h-7 w-7 text-primary shrink-0" />
              IIT Bombay Placement Preparation Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono-tech max-w-3xl">
              Chronological playbook reconstructed from historical blog drops. Navigate from July CV locking through October OAs to the intense 15-day interview gauntlet in December.
            </p>
          </div>

          {/* D-Day Countdown & Season Mode Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center sm:text-right min-w-[150px]">
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

            {/* Phase 1 vs Full Season Mode Switcher */}
            <div className="p-1 rounded-2xl bg-muted/60 border border-border/80 flex">
              <button
                onClick={() => setSeasonMode("phase_1")}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold font-mono-tech transition-all cursor-pointer ${
                  seasonMode === "phase_1"
                    ? "bg-card text-foreground shadow-xs border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Phase 1 Focus (Jul–Dec)
              </button>
              <button
                onClick={() => setSeasonMode("full")}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold font-mono-tech transition-all cursor-pointer ${
                  seasonMode === "full"
                    ? "bg-card text-foreground shadow-xs border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Full Year (+Phase 2)
              </button>
            </div>
          </div>
        </div>

        {/* Milestone Readiness Tracker Bar */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2 font-mono-tech">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Candidate Preparation Readiness Tracker:
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">{milestoneStats.completed}</strong> of{" "}
              <strong>{milestoneStats.total}</strong> Milestones Completed ({milestoneStats.pct}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${milestoneStats.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (Roadmap vs D-Day Playbook vs Track Guides) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeSubTab === "roadmap" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("roadmap")}
            className="rounded-xl text-xs font-mono-tech font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5" /> Phase-by-Phase Roadmap
          </Button>
          <Button
            variant={activeSubTab === "slotting" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("slotting")}
            className="rounded-xl text-xs font-mono-tech font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="h-3.5 w-3.5" /> D-Day (Dec 1–15) Slotting Playbook
          </Button>
          <Button
            variant={activeSubTab === "tracks" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("tracks")}
            className="rounded-xl text-xs font-mono-tech font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" /> Career Track Blueprints
          </Button>
        </div>

        {/* Track Filter (only relevant on roadmap tab) */}
        {activeSubTab === "roadmap" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono-tech text-muted-foreground mr-1">
              Track Filter:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "sde", label: "💻 SDE" },
              { id: "quant", label: "📈 Quant" },
              { id: "consulting", label: "💼 Consult" },
              { id: "core", label: "⚙️ Core" },
              { id: "analytics", label: "📊 ML/Data" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrack(t.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-tech font-semibold transition-all cursor-pointer ${
                  selectedTrack === t.id
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. VIEW 1: PHASE-BY-PHASE ROADMAP */}
      {activeSubTab === "roadmap" && (
        <div className="space-y-6">
          {/* Phase Stepper Rail */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {displayedPhases.map((phase) => {
              const IconComp = getPhaseIcon(phase.icon);
              const isActive = activePhaseId === phase.id;
              const isCurrent = currentPhaseId === phase.id;

              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhaseId(phase.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 cursor-pointer ${
                    isActive
                      ? "bg-card border-primary ring-2 ring-primary/20 shadow-md"
                      : "bg-card/60 border-border/70 hover:border-border hover:bg-card"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase font-mono-tech tracking-wider text-muted-foreground">
                        {phase.phase_code}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono-tech">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE NOW
                        </span>
                      )}
                    </div>
                    <div className="font-extrabold text-foreground text-sm font-display leading-snug">
                      {phase.name}
                    </div>
                    <div className="text-[10px] font-mono-tech text-muted-foreground">
                      {phase.date_range}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 font-mono-tech text-[10px]">
                    <span className="text-muted-foreground">
                      {phase.summary.total_posts} blog posts
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 font-bold bg-muted/40"
                    >
                      {phase.weekly_milestones?.length || 0} Milestones
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed View of the Selected Phase */}
          {activePhase && (
            <div className="space-y-6">
              {/* Phase Header Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary text-primary-foreground font-mono-tech text-[10px] font-bold">
                        {activePhase.phase_code}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono-tech text-[10px] font-bold"
                      >
                        {activePhase.urgency_badge}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono-tech">
                        {activePhase.date_range} • {activePhase.duration_weeks} Weeks
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-foreground font-display tracking-tight">
                      {activePhase.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono-tech">
                      {activePhase.subtitle}
                    </p>
                  </div>

                  {/* Phase Pulse Metrics */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-center font-mono-tech min-w-[80px]">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Announcements
                      </div>
                      <div className="text-base font-black text-foreground">
                        {activePhase.summary.total_posts}
                      </div>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-center font-mono-tech min-w-[80px]">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        JAFs Open
                      </div>
                      <div className="text-base font-black text-primary">
                        {activePhase.summary.jafs_count}
                      </div>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-center font-mono-tech min-w-[80px]">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Assessments
                      </div>
                      <div className="text-base font-black text-amber-600 dark:text-amber-400">
                        {activePhase.summary.oas_count}
                      </div>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border/60 text-center font-mono-tech min-w-[80px]">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Shortlists
                      </div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {activePhase.summary.shortlists_count}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Reality & Mindset Shield */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 font-mono-tech">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5" /> Ground Reality on Campus:
                    </span>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {activePhase.candidate_reality}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 font-mono-tech">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Mindset & Energy Protection:
                    </span>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {activePhase.mindset_advice}
                    </p>
                  </div>
                </div>

                {/* Placement Cell Rules & Traps */}
                {activePhase.placement_cell_rules?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2 font-mono-tech">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4" /> Crucial Placement Cell Regulations & Pitfalls:
                    </span>
                    <ul className="space-y-1 text-xs text-foreground/90">
                      {activePhase.placement_cell_rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Weekly Actionable Milestones & Checklist */}
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h4 className="text-lg font-black text-foreground font-display flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Weekly Actionable Milestones & Preparation Checklist
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono-tech">
                      Check off completed tasks to track your preparation velocity. Persisted automatically.
                    </p>
                  </div>
                  <span className="text-xs font-mono-tech text-muted-foreground">
                    Showing {filteredMilestones.length} of {activePhase.weekly_milestones?.length || 0} milestones
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMilestones.map((m) => {
                    const isChecked = !!checkedMilestones[m.id];

                    return (
                      <div
                        key={m.id}
                        className={`p-5 rounded-3xl border transition-all space-y-3 relative ${
                          isChecked
                            ? "bg-card/50 border-emerald-500/30 ring-1 ring-emerald-500/20"
                            : "bg-card border-border/80 shadow-xs hover:border-border"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold font-mono-tech bg-muted/40"
                              >
                                {m.week_label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold font-mono-tech ${
                                  m.priority === "CRITICAL"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                }`}
                              >
                                {m.priority}
                              </Badge>
                              {m.tracks.map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] font-mono-tech uppercase text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <h5
                              className={`text-base font-extrabold font-display leading-tight ${
                                isChecked ? "text-muted-foreground line-through" : "text-foreground"
                              }`}
                            >
                              {m.title}
                            </h5>
                          </div>

                          <button
                            onClick={() => toggleMilestone(m.id)}
                            className={`shrink-0 h-7 w-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isChecked
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : "border-border/80 hover:border-primary text-transparent"
                            }`}
                            title={isChecked ? "Mark as Incomplete" : "Mark as Completed"}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground font-mono-tech">
                          {m.description}
                        </p>

                        {/* Deliverables Checklist */}
                        <div className="space-y-1.5 pt-2 border-t border-border/40 font-mono-tech">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Key Deliverables:
                          </span>
                          <ul className="space-y-1 text-xs text-foreground/90">
                            {m.tasks.map((task, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-2">
                                <span className="text-primary font-bold">›</span>
                                <span className={isChecked ? "text-muted-foreground" : ""}>
                                  {task}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Authentic Placement Blog Announcement Feed */}
              {activePhase.summary.featured_announcements?.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/70">
                  <div>
                    <h4 className="text-lg font-black text-foreground font-display flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      Authentic Blog Announcements from {activePhase.phase_code}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono-tech">
                      Real historical broadcasts posted on the IIT Bombay placement blog during this window.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-tech">
                    {activePhase.summary.featured_announcements.map((post, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-4 rounded-2xl bg-card border border-border/70 space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>{post.date}</span>
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase px-1 py-0 font-bold bg-muted/40"
                            >
                              {post.category}
                            </Badge>
                          </div>
                          <div className="font-extrabold text-foreground text-xs line-clamp-2">
                            {post.title}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                            {post.snippet}
                          </p>
                        </div>

                        {post.company && onSelectCompany && (
                          <button
                            onClick={() =>
                              onSelectCompany(
                                post.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                              )
                            }
                            className="pt-2 text-[10px] text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            Explore {post.company} Dossier <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. VIEW 2: D-DAY SLOTTING & INTERVIEW CONFLICT PLAYBOOK */}
      {activeSubTab === "slotting" && data?.dday_slotting_playbook && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-white font-mono-tech text-[10px] font-bold">
                D-DAY (DECEMBER 1–15)
              </Badge>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 font-mono-tech text-[10px] font-bold"
              >
                TACTICAL PLAYBOOK
              </Badge>
            </div>
            <h3 className="text-2xl font-black text-foreground font-display">
              {data.dday_slotting_playbook.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono-tech max-w-3xl">
              {data.dday_slotting_playbook.description}
            </p>
          </div>

          {/* Slots Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.dday_slotting_playbook.slots.map((slot, sIdx) => (
              <div
                key={sIdx}
                className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 font-mono-tech"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <Badge className="bg-primary text-primary-foreground text-xs font-black">
                      {slot.slot_code}
                    </Badge>
                    <div className="text-xs text-muted-foreground pt-1">
                      {slot.timing}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-muted/50"
                  >
                    {slot.prestige}
                  </Badge>
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed">
                  {slot.characteristics}
                </p>

                {/* Recruiter Roster */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Historical Recruiters in this Slot:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {slot.historical_recruiters.map((comp, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[10px] bg-muted/60 text-foreground px-2 py-0.5 rounded-lg border border-border/60"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tactical Strategy */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Collision & Sequencing Strategy:
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {slot.collision_strategy}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Slot Collision & Walk-In Protocols */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 font-mono-tech">
            <h4 className="text-lg font-black text-foreground font-display flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Slot Collision Rules & The Walk-In Phenomenon
            </h4>
            <div className="space-y-3">
              {data.dday_slotting_playbook.collision_rules.map((rule, rIdx) => (
                <div
                  key={rIdx}
                  className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1.5"
                >
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5" /> {rule.scenario}
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed pl-5">
                    {rule.protocol}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW 3: CAREER TRACK BLUEPRINTS */}
      {activeSubTab === "tracks" && data?.track_guides && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2">
            <h3 className="text-2xl font-black text-foreground font-display">
              Career Track Preparation Blueprints
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono-tech max-w-3xl">
              Specialized preparation advice, syllabus pillars, and interview realities tailored to the 5 primary recruiting sectors at IIT Bombay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-tech">
            {Object.entries(data.track_guides).map(([trackKey, guide]) => {
              const TrackIcon = getTrackIcon(trackKey);

              return (
                <div
                  key={trackKey}
                  className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <TrackIcon className="h-5 w-5" />
                      </div>
                      <h4 className="text-base font-extrabold text-foreground font-display">
                        {guide.title}
                      </h4>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                        Core Evaluation Pillars:
                      </span>
                      <ul className="space-y-1 text-xs text-foreground/90">
                        {guide.core_pillars.map((pillar, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-primary font-bold">›</span>
                            <span>{pillar}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60 space-y-1 text-xs text-foreground/90 leading-relaxed">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                      Senior Advice:
                    </span>
                    <p>{guide.key_advice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
