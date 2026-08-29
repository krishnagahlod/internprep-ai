"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, ArrowRight, Clock, FileText, Bot, Loader2, Calendar, 
  Search, Filter, Sparkles, CheckCircle2, ShieldAlert, Award, 
  RotateCcw, ExternalLink, Layers, Trash2, LogIn
} from "lucide-react";

const DOMAINS = [
  { id: "all", label: "All Tracks" },
  { id: "consulting", label: "Consulting" },
  { id: "tech", label: "Software & SWE" },
  { id: "analytics", label: "Data Analytics" },
  { id: "finance", label: "Finance & Quant" },
  { id: "product", label: "Product" },
];

const DEMO_RESUME_HISTORY = [
  {
    id: "res-demo-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    target_role: "Management Consulting",
    domain: "consulting",
    score: 92,
    feedback: "Exceptional quantification across projects. 2 passive action verbs flagged in Leadership section.",
    starCompliance: 96,
    actionVerbs: 88,
    atsStatus: "100% Parser Compliant"
  },
  {
    id: "res-demo-2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    target_role: "Software & Systems SWE",
    domain: "tech",
    score: 89,
    feedback: "High technical scope. Slashing latency from 840ms to 92ms provides strong engineering evidence.",
    starCompliance: 90,
    actionVerbs: 94,
    atsStatus: "100% Parser Compliant"
  },
  {
    id: "res-demo-3",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    target_role: "Quantitative Finance",
    domain: "finance",
    score: 95,
    feedback: "Sharpe ratio and max drawdown metrics backtested rigorously. Strong Day 1 candidate profile.",
    starCompliance: 98,
    actionVerbs: 92,
    atsStatus: "100% Parser Compliant"
  },
  {
    id: "res-demo-4",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    target_role: "Data Science & Analytics",
    domain: "analytics",
    score: 86,
    feedback: "Good pipeline volume metrics. Causal difference-in-differences bullet needs sample size clarification.",
    starCompliance: 88,
    actionVerbs: 86,
    atsStatus: "100% Parser Compliant"
  }
];

const DEMO_INTERVIEW_HISTORY = [
  {
    id: "int-demo-1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    topic: "FMCG Margin Turnaround & Reverse Logistics",
    domain: "consulting",
    interview_type: "case",
    score: "9.6 / 10",
    verdict: "Strong Hire (Top 1%)",
    turns: 6,
    duration: "18 mins",
    keyHighlight: "MECE structuring was exhaustive. Successfully defended contribution margin against logistics probing."
  },
  {
    id: "int-demo-2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    topic: "Flash Sale Distributed Cache Stampede",
    domain: "tech",
    interview_type: "technical",
    score: "9.8 / 10",
    verdict: "Senior Level Verified",
    turns: 8,
    duration: "24 mins",
    keyHighlight: "Mutex locks with jittered TTL strategy defended cleanly under 50,000 QPS thread starvation probe."
  },
  {
    id: "int-demo-3",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    topic: "Customer LTV Attribution & CAC Uplift",
    domain: "analytics",
    interview_type: "case",
    score: "9.4 / 10",
    verdict: "Strong Hire",
    turns: 5,
    duration: "16 mins",
    keyHighlight: "Demonstrated strong difference-in-differences quasi-experimental rigor for cohort segmentation."
  },
  {
    id: "int-demo-4",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    topic: "LBO 3-Statement Free Cash Flow Mechanics",
    domain: "finance",
    interview_type: "technical",
    score: "9.9 / 10",
    verdict: "Top Quartile Analyst",
    turns: 7,
    duration: "21 mins",
    keyHighlight: "Flawless walkthrough of CapEx vs Depreciation flow-through and debt amortization schedule."
  }
];

export default function HistoryPage() {
  const { user, isGuest } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const [resumeHistory, setResumeHistory] = useState<any[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search States
  const [activeTab, setActiveTab] = useState<"all" | "interviews" | "resumes">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest">("newest");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!user && !isGuest) {
          setIsLoading(false);
          return;
        }

        let fetchedResumes: any[] = [];
        let fetchedInterviews: any[] = [];

        if (user) {
          const { data: resumes } = await supabase
            .from("resume_analyses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (resumes && resumes.length > 0) fetchedResumes = resumes;

          const { data: interviews } = await supabase
            .from("interview_sessions")
            .select("*, session_feedback(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (interviews && interviews.length > 0) fetchedInterviews = interviews;
        }

        // Use real if available, else combine with calibrated demo data so candidate can see structure
        setResumeHistory(fetchedResumes.length > 0 ? fetchedResumes : DEMO_RESUME_HISTORY);
        setInterviewHistory(fetchedInterviews.length > 0 ? fetchedInterviews : DEMO_INTERVIEW_HISTORY);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, isGuest]);

  // Filtered Lists
  const filteredResumes = useMemo(() => {
    return resumeHistory.filter((item) => {
      const matchesSearch = 
        (item.target_role?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.feedback?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.analysis_data?.overall_feedback?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      const itemDomain = (item.domain || item.target_role || "").toLowerCase();
      const matchesDomain = selectedDomain === "all" || itemDomain.includes(selectedDomain);

      return matchesSearch && matchesDomain;
    });
  }, [resumeHistory, searchQuery, selectedDomain]);

  const filteredInterviews = useMemo(() => {
    return interviewHistory.filter((item) => {
      const matchesSearch = 
        (item.topic?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.domain?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.keyHighlight?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      const itemDomain = (item.domain || "").toLowerCase();
      const matchesDomain = selectedDomain === "all" || itemDomain.includes(selectedDomain);

      return matchesSearch && matchesDomain;
    });
  }, [interviewHistory, searchQuery, selectedDomain]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p>FETCHING SESSION ARCHIVES & TRANSCRIPTS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors">
      
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard")} 
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs font-mono-tech"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Dashboard
            </Button>
            <span className="text-border">/</span>
            <span className="text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold">
              HISTORY & ARCHIVES
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(!user || isGuest) && (
              <Link href="/login">
                <Button size="sm" className="h-8 px-2.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 font-mono-tech text-xs font-semibold flex items-center gap-1 shadow-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-6">
        
        {/* Guest Mode Demo Notice Banner */}
        {(!user || isGuest) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground font-mono-tech block">
                  DEMO HISTORY ARCHIVE
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are viewing sample interview transcripts and audit diffs. Sign in with your candidate account to automatically archive and sync your personal prep history.
                </p>
              </div>
            </div>
            <Link href="/login" className="w-full sm:w-auto shrink-0">
              <Button size="sm" className="w-full sm:w-auto h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-mono-tech shadow-xs flex items-center justify-center gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Sign In to Save
              </Button>
            </Link>
          </div>
        )}
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [ARCHIVES]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">SESSION TRANSCRIPTS & SCORECARDS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Interview & Resume History
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
              Review full interview transcripts, rubric evaluations, and line-by-line resume diffs.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-4 text-xs font-mono-tech bg-muted/60 px-4 py-2 rounded-xl border border-border shrink-0">
            <div>
              <span className="text-muted-foreground">Interviews: </span>
              <span className="text-foreground font-bold">{interviewHistory.length}</span>
            </div>
            <span className="text-border">•</span>
            <div>
              <span className="text-muted-foreground">Resumes: </span>
              <span className="text-foreground font-bold">{resumeHistory.length}</span>
            </div>
          </div>
        </div>

        {/* Command Bar: Search, Category Tabs, Domain Filter */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by role, topic, keyword, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-card border border-border text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* View Filter Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border font-mono-tech text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-md transition-all ${
                  activeTab === "all"
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Archives ({filteredResumes.length + filteredInterviews.length})
              </button>
              <button
                onClick={() => setActiveTab("interviews")}
                className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === "interviews"
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Interviews ({filteredInterviews.length})
              </button>
              <button
                onClick={() => setActiveTab("resumes")}
                className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === "resumes"
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                Resumes ({filteredResumes.length})
              </button>
            </div>

          </div>

          {/* Domain Track Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-mono-tech whitespace-nowrap transition-all border ${
                  selectedDomain === d.id
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 font-bold border-transparent shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Responsive Grid (No Broken Left Column!) */}
        <div className="space-y-8">
          
          {/* Section: Mock Interview Sessions */}
          {(activeTab === "all" || activeTab === "interviews") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground font-mono-tech">
                  <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>MOCK INTERVIEW TRANSCRIPT SESSIONS ({filteredInterviews.length})</span>
                </div>
                <Link href="/interview" className="text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 hover:underline">
                  + Launch New Session
                </Link>
              </div>

              {filteredInterviews.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/40 text-xs font-mono-tech text-muted-foreground">
                  No mock interview sessions match your current filter.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredInterviews.map((item) => (
                    <div 
                      key={item.id}
                      className="p-5 rounded-xl border border-border bg-card hover:border-emerald-500/40 transition-all space-y-4 flex flex-col justify-between shadow-xs group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono-tech">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                            {item.score || "9.4 / 10"}
                          </span>
                        </div>

                        <div>
                          <div className="text-[11px] font-mono-tech uppercase text-muted-foreground">
                            {item.domain || "Consulting"} • {item.turns || 6} Turns Simulated
                          </div>
                          <h3 className="text-sm font-bold text-foreground mt-0.5 leading-snug">
                            {item.topic || "Case Strategy & Structured Problem Solving"}
                          </h3>
                        </div>

                        <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-2 bg-muted/40 p-3 rounded-lg border border-border/60">
                          "{item.keyHighlight || item.case_state?.current_phase || "Simulation completed. Logic probed and verified."}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                        <span className="text-[11px] font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold">
                          {item.verdict || "Strong Hire (Top 1%)"}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(item.id.startsWith("int-demo") ? "/interview" : `/interview?id=${item.id}`)}
                          className="h-8 text-xs font-mono-tech border-border group-hover:border-emerald-500/40"
                        >
                          View Transcript <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Resume Diagnostics */}
          {(activeTab === "all" || activeTab === "resumes") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground font-mono-tech">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>RESUME AUDIT & VECTOR SCORECARDS ({filteredResumes.length})</span>
                </div>
                <Link href="/resume" className="text-xs font-mono-tech text-blue-600 dark:text-blue-400 hover:underline">
                  + Upload New PDF
                </Link>
              </div>

              {filteredResumes.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/40 text-xs font-mono-tech text-muted-foreground">
                  No resume audits match your current filter.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredResumes.map((scan) => {
                    const score = scan.score || (scan.analysis_data?.radar_scores ? Math.round(Object.values(scan.analysis_data.radar_scores as Record<string, number>).reduce((a, b) => a + b, 0) / 6) : 88);
                    const feedback = scan.feedback || scan.analysis_data?.overall_feedback || "Analysis completed.";

                    return (
                      <div 
                        key={scan.id}
                        className="p-5 rounded-xl border border-border bg-card hover:border-blue-500/40 transition-all space-y-4 flex flex-col justify-between shadow-xs group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono-tech">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 text-[11px]">
                              Score: {score} / 100
                            </span>
                          </div>

                          <div>
                            <div className="text-[11px] font-mono-tech uppercase text-muted-foreground">
                              TARGET TRACK: <span className="text-foreground font-semibold">{scan.target_role || "General"}</span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-2 bg-muted/40 p-3 rounded-lg border border-border/60">
                            {feedback}
                          </p>

                          {/* Quick Dimension Badges */}
                          <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono-tech">
                            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              STAR: {scan.starCompliance || 94}%
                            </span>
                            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              Verbs: {scan.actionVerbs || 90}%
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {scan.atsStatus || "ATS Verified"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(scan.id.startsWith("res-demo") ? "/resume" : `/history/resume/${scan.id}`)}
                            className="h-8 text-xs font-mono-tech border-border group-hover:border-blue-500/40"
                          >
                            View Scorecard <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
