"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  ArrowLeft,
  Target,
  Brain,
  FileText,
  SlidersHorizontal,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
  Briefcase,
  ShieldCheck,
  Search,
  GraduationCap,
  Building2,
  Cpu,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackButton } from "@/components/creator-badge";
import {
  SUB_TRACKS_BY_ROLE,
  MasterScoreGauge,
  ATSIngestionForm,
  ATSOverviewTab,
  ATSSectionsTab,
  ATSKeywordsTab,
  ATSLineHazardTab,
  ATSRawStreamTab,
  ATSReasoningModal,
  ATSBulletFixModal,
} from "@/components/ats-checker";
import { fetchEventSourceStream } from "@/lib/sse-client";

export default function ATSCheckerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // ATS Config
  const [targetRole, setTargetRole] = useState("software");
  const [subTrack, setSubTrack] = useState("sde_generalist");
  const [atsMode, setAtsMode] = useState<"iitb_placement" | "global_ats">("iitb_placement");
  const [customJD, setCustomJD] = useState("");
  const [showJDInput, setShowJDInput] = useState(false);
  const [showReasoningModal, setShowReasoningModal] = useState(false);

  // Results & Loading
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [atsReport, setAtsReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "sections" | "keywords" | "line_wrap" | "raw_stream"
  >("overview");

  // 1-Click Bullet Fix State
  const [bulletToFix, setBulletToFix] = useState<any | null>(null);
  const [fixType, setFixType] = useState<string>("power_verb");
  const [missingKeywordToInject, setMissingKeywordToInject] = useState<string>("");
  const [isFixingBullet, setIsFixingBullet] = useState(false);
  const [fixedBulletResult, setFixedBulletResult] = useState<any | null>(null);
  const [copiedBullet, setCopiedBullet] = useState<string | null>(null);

  const { isGuest, incrementGuestResume } = useAuthStore();
  const router = useRouter();

  const handleRoleChange = (newRole: string) => {
    setTargetRole(newRole);
    const subTracks = SUB_TRACKS_BY_ROLE[newRole] || [];
    if (subTracks.length > 0) {
      setSubTrack(subTracks[0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        setFile(null);
        setPdfUrl(null);
      } else {
        setFile(selectedFile);
        setPdfUrl(URL.createObjectURL(selectedFile));
        setError(null);
      }
    }
  };

  const handleRunATS = async (
    overrideRole?: string,
    overrideSubTrack?: string,
    overrideMode?: "iitb_placement" | "global_ats",
    overrideJD?: string
  ) => {
    if (!file && !atsReport) return;

    setIsScanning(true);
    setError(null);
    setScanProgress(15);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }

      formData.append("target_role", overrideRole || targetRole);
      formData.append("sub_track", overrideSubTrack || subTrack);
      formData.append("mode", overrideMode || atsMode);

      const jdToSend = overrideJD !== undefined ? overrideJD : customJD;
      if (jdToSend && jdToSend.trim()) {
        formData.append("job_description", jdToSend.trim());
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      await fetchEventSourceStream(`${API_URL}/resume/ats-check/stream`, {
        method: "POST",
        body: formData,
        onProgress: (prog) => {
          if (prog?.percent) {
            setScanProgress(prog.percent);
          }
        },
        onDone: (data) => {
          setAtsReport(data);
          setScanProgress(100);
          if (isGuest && !atsReport) {
            incrementGuestResume();
          }
        },
        onError: (err) => {
          throw err;
        },
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during ATS evaluation.");
      setScanProgress(0);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExecuteBulletFix = async () => {
    if (!bulletToFix) return;
    setIsFixingBullet(true);
    setFixedBulletResult(null);
    setCopiedBullet(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const payload = {
        bullet_text: bulletToFix.bullet_text || bulletToFix,
        fix_type: fixType,
        target_role: targetRole,
        mode: atsMode,
        missing_keyword: missingKeywordToInject || undefined,
        target_length: bulletToFix.target_trim_chars || undefined,
      };

      const res = await fetch(`${API_URL}/resume/ats-fix-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setFixedBulletResult(data);
      }
    } catch (e) {
      console.error("Error refining bullet:", e);
    } finally {
      setIsFixingBullet(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBullet(id);
    setTimeout(() => setCopiedBullet(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 left-1/3 w-[550px] h-[550px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Sticky Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-2.5 text-xs font-mono-tech shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <span className="text-border">/</span>
            <span className="text-xs font-mono-tech text-muted-foreground truncate">
              <span className="hidden sm:inline">ATS SCORE CHECKER & AUDITOR</span>
              <span className="sm:hidden">ATS AUDITOR</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/resume")}
              className="flex items-center gap-1.5 border-border text-foreground hover:bg-muted text-xs font-mono-tech h-8 px-2 sm:px-3 cursor-pointer"
            >
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Resume Workshop</span>
              <span className="sm:hidden">Workshop</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div
        className={`container mx-auto px-4 sm:px-6 relative z-10 ${
          !atsReport ? "py-8 max-w-4xl" : "py-6 max-w-[1600px] flex-1 flex flex-col"
        }`}
      >
        {/* Banner Title */}
        <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [DAY 1 PLACEMENT CALIBRATED]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">
                DUAL-CALIBRATED NEURAL AUDITOR
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
              ATS & Placement Score Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-sans">
              Comprehensive evaluation calibrated for IIT Bombay campus placement shortlisting and enterprise ATS systems (Workday, Greenhouse, Taleo).
            </p>
          </div>

          {atsReport && (
            <div className="flex flex-wrap items-center gap-2 font-mono-tech">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReasoningModal(true)}
                className="text-xs border-border hover:bg-muted h-8 rounded-xl cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-primary" /> Scoring Methodology
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAtsReport(null);
                  setFile(null);
                  setPdfUrl(null);
                }}
                className="text-xs border-border hover:bg-muted h-8 rounded-xl cursor-pointer"
              >
                <UploadCloud className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Scan Another Resume
              </Button>
            </div>
          )}
        </div>

        {/* Pre-flight Architectural Cards when No Report */}
        {!atsReport && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono-tech">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
              <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
                <span>DUAL BENCHMARKS</span>
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-base font-bold text-foreground">IITB & Corporate</div>
              <div className="text-[10px] text-muted-foreground font-sans">Day 1 policy vs Enterprise ATS</div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
              <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
                <span>5 AUDIT PILLARS</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-base font-bold text-foreground">100-Point Rubric</div>
              <div className="text-[10px] text-muted-foreground font-sans">Parse, Relevance, Verbs, Metrics, Budget</div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
              <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
                <span>LINE HAZARD ENGINE</span>
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-base font-bold text-foreground">Visual Overflows</div>
              <div className="text-[10px] text-muted-foreground font-sans">Fix orphan words eating line budget</div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
              <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
                <span>DOMAIN TAXONOMY</span>
                <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-base font-bold text-foreground">5 Roles / 14 Tracks</div>
              <div className="text-[10px] text-muted-foreground font-sans">Exact keyword & tool requirements</div>
            </div>
          </div>
        )}

        {/* INGESTION & CONFIGURATION FORM */}
        {!atsReport ? (
          <ATSIngestionForm
            atsMode={atsMode}
            setAtsMode={setAtsMode}
            targetRole={targetRole}
            onRoleChange={handleRoleChange}
            subTrack={subTrack}
            setSubTrack={setSubTrack}
            showJDInput={showJDInput}
            setShowJDInput={setShowJDInput}
            customJD={customJD}
            setCustomJD={setCustomJD}
            file={file}
            onFileChange={handleFileChange}
            isScanning={isScanning}
            scanProgress={scanProgress}
            error={error}
            onRunATS={() => handleRunATS()}
          />
        ) : (
          /* SCORECARD RESULTS VIEW */
          <div className="flex flex-1 min-h-0 border-t border-border mt-2 pt-4">
            {/* PDF Viewer Panel - Desktop Only */}
            <div className="hidden lg:flex w-[35%] flex-col pr-4 border-r border-border">
              <div className="w-full h-full rounded-3xl overflow-hidden border border-border bg-card p-2 flex flex-col shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground font-mono-tech">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Source Resume Preview
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono-tech">
                    {atsReport.pillars?.formatting_layout?.page_count || 1}-Page Resume
                  </Badge>
                </div>
                <div className="flex-1 mt-2 rounded-2xl overflow-hidden bg-muted/20 flex items-center justify-center">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-2xl border-none"
                      title="Resume PDF Preview"
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground font-mono-tech">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      PDF visual preview loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Scorecard Content */}
            <div className="flex-1 overflow-y-auto px-2 lg:pl-6 custom-scrollbar pb-20 space-y-6 animate-in fade-in duration-500">
              {/* Benchmark Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-xs font-mono-tech">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                    Standard:
                  </span>
                  <button
                    onClick={() => {
                      setAtsMode("iitb_placement");
                      handleRunATS(targetRole, subTrack, "iitb_placement");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      atsMode === "iitb_placement"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> IITB Day 1
                  </button>
                  <button
                    onClick={() => {
                      setAtsMode("global_ats");
                      handleRunATS(targetRole, subTrack, "global_ats");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      atsMode === "global_ats"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Corporate ATS
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="h-8 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
                    value={targetRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setTargetRole(newRole);
                      const defaultSub = SUB_TRACKS_BY_ROLE[newRole]?.[0]?.id || "";
                      setSubTrack(defaultSub);
                      handleRunATS(newRole, defaultSub, atsMode);
                    }}
                  >
                    <option value="software">Software Engineering</option>
                    <option value="consulting">Management Consulting</option>
                    <option value="product_management">Product Management</option>
                    <option value="finance">Finance / Quant</option>
                    <option value="analytics">Data Science & Analytics</option>
                  </select>

                  <select
                    className="h-8 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none cursor-pointer"
                    value={subTrack}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      setSubTrack(newSub);
                      handleRunATS(targetRole, newSub, atsMode);
                    }}
                  >
                    {(SUB_TRACKS_BY_ROLE[targetRole] || []).map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJDInput(!showJDInput)}
                    className="h-8 px-2.5 text-xs border-border hover:bg-muted rounded-xl cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5 mr-1 text-primary" />
                    {atsReport.is_custom_jd ? "Edit JD" : "Match JD"}
                  </Button>
                </div>
              </div>

              {/* Custom JD Drawer */}
              {showJDInput && (
                <div className="p-4 rounded-2xl bg-card border border-border space-y-3 animate-in fade-in duration-300 shadow-xs font-mono-tech">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Target Job Description Matcher
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Extracts required tools & computes exact skill match %
                    </span>
                  </div>
                  <textarea
                    className="w-full h-28 p-3 rounded-xl border border-border bg-background text-xs shadow-2xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none text-foreground custom-scrollbar"
                    placeholder="Paste the target job description here..."
                    value={customJD}
                    onChange={(e) => setCustomJD(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomJD("");
                        handleRunATS(targetRole, subTrack, atsMode, "");
                      }}
                      className="h-8 text-xs text-muted-foreground rounded-xl cursor-pointer"
                    >
                      Reset to Domain Preset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRunATS(targetRole, subTrack, atsMode, customJD)}
                      disabled={isScanning || !customJD.trim()}
                      className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl cursor-pointer"
                    >
                      {isScanning ? "Matching Skills..." : "Calculate JD Match %"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Master Split Hero: Gauge on Left + Quick Wins Roadmap on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Master Gauge Card */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-card border border-border shadow-xs flex items-center">
                  <MasterScoreGauge
                    score={atsReport.overall_score}
                    tier={atsReport.tier}
                    mode={atsReport.mode}
                    roleLabel={atsReport.target_role_label}
                  />
                </div>

                {/* Right: Quick Wins Roadmap Card */}
                <div className="lg:col-span-5 p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2.5 font-mono-tech">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Immediate Score Roadmap
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        High-Yield Priorities
                      </span>
                    </div>

                    <div className="space-y-2 font-mono-tech">
                      {atsReport.quick_wins?.map((qw: any, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-2xl bg-muted/20 border border-border flex items-center justify-between gap-3 hover:border-primary/30 transition-all"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0">
                                {qw.impact_pts}
                              </Badge>
                              <p className="text-xs font-bold text-foreground truncate">
                                {qw.title}
                              </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-sans">
                              {qw.hint}
                            </p>
                          </div>

                          {qw.action_type === "inject_keyword" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveSubTab("keywords")}
                              className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 shrink-0 rounded-lg cursor-pointer"
                            >
                              View Skills <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                          {qw.action_type === "trim_line_wrap" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveSubTab("line_wrap")}
                              className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 shrink-0 rounded-lg cursor-pointer"
                            >
                              Trim Lines <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono-tech text-muted-foreground">
                    <span>Target: 85+ (Placement Ready)</span>
                    <span className="font-semibold text-primary">Est. Gain: +15-25 pts</span>
                  </div>
                </div>
              </div>

              {/* IITB Policy Alerts (e.g. Prohibited JEE Rank Mentions) */}
              {atsReport.policy_alerts && atsReport.policy_alerts.length > 0 && (
                <div className="space-y-3">
                  {atsReport.policy_alerts.map((alert: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-1"
                    >
                      <h5 className="font-bold text-xs font-mono-tech text-rose-700 dark:text-rose-400">
                        {alert.title}
                      </h5>
                      <p className="text-xs leading-relaxed text-rose-900/80 dark:text-rose-200/90 font-sans">
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 5-Pillar Score Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono-tech">
                {/* Pillar 1: Parseability */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Parseability
                      </span>
                      <span className="font-bold text-foreground">
                        {atsReport.pillars?.parseability?.score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${atsReport.pillars?.parseability?.score || 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      Layout structure & entity extraction hygiene.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Text Stream</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      100% Parsed
                    </span>
                  </div>
                </div>

                {/* Pillar 2: Keyword Match */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" /> Skill Match
                      </span>
                      <span className="font-bold text-foreground">
                        {atsReport.pillars?.keyword_match?.score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${atsReport.pillars?.keyword_match?.score || 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.keyword_match?.found_critical_count} of{" "}
                      {atsReport.pillars?.keyword_match?.total_critical_count} skills matched.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Domain</span>
                    <span className="font-semibold text-primary truncate max-w-[100px]">
                      {atsReport.target_role_label}
                    </span>
                  </div>
                </div>

                {/* Pillar 3: Quantification */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" /> Quantification
                      </span>
                      <span className="font-bold text-foreground">
                        {atsReport.pillars?.quantification?.score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${atsReport.pillars?.quantification?.score || 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.quantification?.quantification_ratio}% bullets have
                      metrics.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Benchmark</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      &gt;75% Target
                    </span>
                  </div>
                </div>

                {/* Pillar 4: Action Verbs */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Action Verbs
                      </span>
                      <span className="font-bold text-foreground">
                        {atsReport.pillars?.action_verbs?.score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${atsReport.pillars?.action_verbs?.score || 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.action_verbs?.weak_verb_count} weak verbs detected.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Voice</span>
                    <span className="font-semibold text-primary">Active Voice</span>
                  </div>
                </div>

                {/* Pillar 5: Formatting & Budget */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Line Budget
                      </span>
                      <span className="font-bold text-foreground">
                        {atsReport.pillars?.formatting_layout?.score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${atsReport.pillars?.formatting_layout?.score || 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      {atsReport.pillars?.formatting_layout?.word_count} words (
                      {atsReport.pillars?.formatting_layout?.page_count || 1}-Page).
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Visual Wraps</span>
                    <span
                      className={`font-semibold ${
                        atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0
                          ? "text-amber-500"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length || 0}{" "}
                      Orphan Flags
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-view Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-muted/30 border border-border text-xs font-mono-tech">
                <button
                  onClick={() => setActiveSubTab("overview")}
                  className={`px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === "overview"
                      ? "bg-background text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  1. Pillar Health & Checks
                </button>
                <button
                  onClick={() => setActiveSubTab("sections")}
                  className={`px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === "sections"
                      ? "bg-background text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  2. Section Quality
                </button>
                <button
                  onClick={() => setActiveSubTab("keywords")}
                  className={`px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === "keywords"
                      ? "bg-background text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  3. Skill & Keyword Matrix
                  <Badge className="h-4 px-1 text-[9px] font-mono-tech bg-primary/20 text-primary border-none">
                    {atsReport.pillars?.keyword_match?.found_critical_count} /{" "}
                    {atsReport.pillars?.keyword_match?.total_critical_count}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveSubTab("line_wrap")}
                  className={`px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === "line_wrap"
                      ? "bg-background text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  4. Line-Wrap Hazards
                  {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length > 0 && (
                    <Badge className="h-4 px-1 text-[9px] font-mono-tech bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none">
                      {atsReport.pillars?.formatting_layout?.line_wrap_hazards?.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveSubTab("raw_stream")}
                  className={`px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === "raw_stream"
                      ? "bg-background text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  5. ATS Bot Stream
                </button>
              </div>

              {/* Sub-view 1: Overview */}
              {activeSubTab === "overview" && <ATSOverviewTab atsReport={atsReport} />}

              {/* Sub-view 2: Section Diagnostics */}
              {activeSubTab === "sections" && (
                <ATSSectionsTab
                  atsReport={atsReport}
                  onLaunchAIFix={(type) => {
                    setFixType(type);
                    setBulletToFix({ bullet_text: "" });
                  }}
                />
              )}

              {/* Sub-view 3: Keywords & Skills */}
              {activeSubTab === "keywords" && (
                <ATSKeywordsTab
                  atsReport={atsReport}
                  onInjectKeyword={(kw) => {
                    setMissingKeywordToInject(kw);
                    setFixType("inject_keyword");
                    setBulletToFix({ bullet_text: "" });
                  }}
                />
              )}

              {/* Sub-view 4: Line Wrap Hazards */}
              {activeSubTab === "line_wrap" && (
                <ATSLineHazardTab
                  atsReport={atsReport}
                  onFixHazard={(hazard) => {
                    setBulletToFix(hazard);
                    setFixType("trim_line_wrap");
                  }}
                />
              )}

              {/* Sub-view 5: Raw Stream */}
              {activeSubTab === "raw_stream" && (
                <ATSRawStreamTab
                  atsReport={atsReport}
                  copiedBullet={copiedBullet}
                  onCopyText={copyToClipboard}
                />
              )}

              {/* Bottom Placement Feedback */}
              <div className="mt-8 p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono-tech">
                    ATS Audit & Rubric Feedback
                  </h5>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    Have suggestions on this audit score, pillar rubrics, or missing role keywords?
                  </p>
                </div>
                <FeedbackButton context="ATS Scorecard Studio" label="Share Audit Feedback" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scoring Methodology Modal */}
      <ATSReasoningModal
        open={showReasoningModal}
        onClose={() => setShowReasoningModal(false)}
        atsReport={atsReport}
      />

      {/* 1-Click AI Bullet Optimizer Modal */}
      <ATSBulletFixModal
        bulletToFix={bulletToFix}
        onClose={() => {
          setBulletToFix(null);
          setFixedBulletResult(null);
        }}
        fixType={fixType}
        setFixType={setFixType}
        missingKeywordToInject={missingKeywordToInject}
        setMissingKeywordToInject={setMissingKeywordToInject}
        isFixingBullet={isFixingBullet}
        fixedBulletResult={fixedBulletResult}
        copiedBullet={copiedBullet}
        onExecuteFix={handleExecuteBulletFix}
        onCopyText={copyToClipboard}
      />
    </div>
  );
}
