"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE_BULLETS = [
  {
    raw: "Worked on machine learning model to predict customer churn for retail client.",
    scoreBefore: 44,
    critique: "Passive action verb, missing scale and business impact metrics.",
    optimized: "Engineered an XGBoost churn prediction model across 2.4M customer records, reducing false positives by 18% and retaining $420k in ARR.",
    scoreAfter: 97,
    impact: "+18% Accuracy / $420k ARR",
  },
  {
    raw: "Led consulting team for market entry project in South East Asia.",
    scoreBefore: 38,
    critique: "Vague scope, zero methodology mentioned, lacks quantitative outcome.",
    optimized: "Directed a 5-member team conducting MECE market sizing for $80M SEA fintech entry; delivered 3-phase go-to-market strategy approved by C-suite.",
    scoreAfter: 95,
    impact: "$80M Market Entry / C-Suite Sign-off",
  },
  {
    raw: "Helped optimize database queries to make backend run faster.",
    scoreBefore: 51,
    critique: "Unquantified speedup, weak verb 'helped', missing technical architecture.",
    optimized: "Refactored PostgreSQL indexing and query execution plans, slashing p99 API latency from 840ms to 92ms under 15,000 req/sec load.",
    scoreAfter: 99,
    impact: "840ms → 92ms (89% Reduction)",
  }
];

const CASE_SCENARIOS = [
  {
    role: "McKinsey Partner Persona",
    caseTitle: "FMCG Margin Turnaround",
    turn: "Phase 2: MECE Structuring",
    prompt: "Our client is experiencing a 15% margin erosion in their premium packaged foods division despite rising top-line sales. Walk me through your structure to diagnose whether this is driven by raw material inflation, channel mix, or logistical inefficiencies.",
    candidateResponse: "I will structure this across 3 MECE branches: First, Cost of Goods Sold (COGS) analyzing palm oil & packaging procurement costs; second, Channel Mix dissecting high-margin General Trade vs lower-margin Quick Commerce discounting; third, Freight & Supply Chain bottleneck costs.",
    pushbackPrompt: "Good initial breakdown. However, palm oil prices dropped 4% this quarter while discounting on Quick Commerce rose 35%. How would you pivot your diagnostic prioritization right now?",
    scores: {
      mece: "9.6 / 10",
      acumen: "9.2 / 10",
      synthesis: "9.4 / 10",
      verdict: "Strong Hire (Partner Track)"
    }
  },
  {
    role: "BCG Principal Persona",
    caseTitle: "Electric Vehicle Market Entry",
    turn: "Phase 3: Analysis & Sizing",
    prompt: "Estimate the addressable commercial EV charging market in Tier-1 Indian metro cities by 2028. What key adoption bottlenecks will limit charging infrastructure utilization?",
    candidateResponse: "Starting from top-down sizing: 4 major metros, 12M private registered four-wheelers, projecting 8% EV penetration by 2028 = 960k active EVs. Assuming 1 fast charger per 25 EVs gives 38,400 required commercial ports, representing an asset CapEx pool of ₹1,150 Crores.",
    pushbackPrompt: "Your 1:25 charger ratio assumes 80% home charging overnight. If grid constraints in residential high-rises drop home charging to 30%, how does that expand your commercial port CapEx requirement?",
    scores: {
      mece: "9.7 / 10",
      acumen: "9.5 / 10",
      synthesis: "9.6 / 10",
      verdict: "Strong Hire (Day 1 Ready)"
    }
  }
];

export function InteractiveHeroWidget() {
  const [activeTab, setActiveTab] = useState<"case" | "resume">("case");
  const [caseIndex, setCaseIndex] = useState(0);
  const [isPushbackActive, setIsPushbackActive] = useState(false);
  const [bulletIndex, setBulletIndex] = useState(0);
  const [isRewriting, setIsRewriting] = useState(false);

  const currentCase = CASE_SCENARIOS[caseIndex];
  const currentBullet = SAMPLE_BULLETS[bulletIndex];

  const handleNextBullet = () => {
    setIsRewriting(true);
    setTimeout(() => {
      setBulletIndex((prev) => (prev + 1) % SAMPLE_BULLETS.length);
      setIsRewriting(false);
    }, 150);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-card overflow-hidden shadow-lg transition-colors">
      {/* Console Top Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border text-xs font-mono-tech text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-foreground font-medium">LIVE INTERACTIVE SANDBOX</span>
          </div>
        </div>

        {/* Tab List */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-background border border-border mt-2 sm:mt-0" role="tablist" aria-label="Interactive Sandbox Tools">
          <button
            role="tab"
            aria-selected={activeTab === "case"}
            onClick={() => setActiveTab("case")}
            className={`px-3 py-1.5 rounded text-xs font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all ${
              activeTab === "case"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Case Interview Simulator
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "resume"}
            onClick={() => setActiveTab("resume")}
            className={`px-3 py-1.5 rounded text-xs font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all ${
              activeTab === "resume"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resume Bullet Rewriter
          </button>
        </div>
      </div>

      {/* Main Sandbox Body */}
      <div className="p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {activeTab === "case" ? (
            <motion.div
              key="case-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono-tech text-xs font-semibold">
                    01
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-mono-tech">{currentCase.role}</div>
                    <div className="text-sm font-semibold text-foreground">{currentCase.caseTitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-tech px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {currentCase.turn}
                  </span>
                  <button
                    onClick={() => {
                      setCaseIndex((prev) => (prev + 1) % CASE_SCENARIOS.length);
                      setIsPushbackActive(false);
                    }}
                    className="flex items-center gap-1.5 text-xs font-mono-tech px-2.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
                  >
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    Switch Case Track
                  </button>
                </div>
              </div>

              {/* Prompt Box */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono-tech text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Volume2 className="h-3.5 w-3.5" />
                    INTERVIEWER PROMPT (PHASE-AWARE ENGINE)
                  </span>
                  <span className="text-muted-foreground">LATENCY: &lt; 150MS</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed font-sans">
                  "{isPushbackActive ? currentCase.pushbackPrompt : currentCase.prompt}"
                </p>
              </div>

              {/* Candidate Response & Scorecard */}
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 p-4 rounded-lg bg-card border border-border space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-mono-tech text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      CANDIDATE STRUCTURING & RESPONSE
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">High Logic Density</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                    "{currentCase.candidateResponse}"
                  </p>

                  <div className="pt-2">
                    <Button
                      onClick={() => setIsPushbackActive(!isPushbackActive)}
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98]"
                    >
                      {isPushbackActive ? "Reset to Initial Prompt" : "Simulate Partner Pushback →"}
                    </Button>
                  </div>
                </div>

                {/* Score Rubric */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono-tech text-muted-foreground mb-3 flex items-center justify-between">
                      <span>EVALUATION RUBRIC</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">MBB BENCHMARK</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono-tech">
                      <div className="flex justify-between items-center py-1 border-b border-border/50">
                        <span className="text-muted-foreground">MECE Structuring</span>
                        <span className="text-foreground font-semibold">{currentCase.scores.mece}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Business Acumen</span>
                        <span className="text-foreground font-semibold">{currentCase.scores.acumen}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Synthesis & Math</span>
                        <span className="text-foreground font-semibold">{currentCase.scores.synthesis}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border text-center">
                    <span className="inline-block text-[11px] font-mono-tech font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      {currentCase.scores.verdict}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="resume-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Tab Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="text-xs font-mono-tech text-muted-foreground">
                  GOOGLE XYZ FORMULA & ADAPTIVE RAG REWRITER
                </div>
                <button
                  onClick={handleNextBullet}
                  className="flex items-center gap-1.5 text-xs font-mono-tech px-2.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] transition-all"
                >
                  <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRewriting ? "animate-spin" : ""}`} />
                  Test Another Bullet
                </button>
              </div>

              {/* Before & After Split */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* Draft Box */}
                <div className="p-4 rounded-lg bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      RAW DRAFT (SCORE: {currentBullet.scoreBefore}/100)
                    </span>
                    <span className="text-muted-foreground">UNQUANTIFIED</span>
                  </div>
                  <p className="text-sm text-foreground font-sans italic bg-card p-3 rounded border border-border">
                    "{currentBullet.raw}"
                  </p>
                  <div className="text-xs text-red-600/90 dark:text-red-400/90 font-mono-tech">
                    [FLAGGED] {currentBullet.critique}
                  </div>
                </div>

                {/* Optimized Box */}
                <div className="p-4 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      GOLDEN REWRITE (SCORE: {currentBullet.scoreAfter}/100)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentBullet.impact}</span>
                  </div>
                  <p className="text-sm text-foreground font-sans font-medium bg-card p-3 rounded border border-emerald-500/20">
                    "{currentBullet.optimized}"
                  </p>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono-tech">
                    [PASS] Quantified impact, high-agency action verb, verified metric density.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Console Bottom Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-muted/60 border-t border-border text-xs font-mono-tech text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>BACKEND: FastAPI + Cerebras Llama-3.3 70B</span>
          <span>EMBEDDINGS: pgvector</span>
        </div>
        <div className="text-foreground">
          Ready for live candidate interaction
        </div>
      </div>
    </div>
  );
}
