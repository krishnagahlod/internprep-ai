"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Volume2, Sparkles, Sliders } from "lucide-react";
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
    turn: "Turn 03 of 12",
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
    role: "Google Staff Eng Persona",
    caseTitle: "Global Rate Limiter Architecture",
    turn: "Turn 05 of 16",
    prompt: "Design a distributed rate limiter supporting 2 million requests per second across 4 global regions with sub-5ms evaluation latency. What data store and eviction algorithm do you select?",
    candidateResponse: "I choose Redis Cluster with sliding window log algorithm utilizing local in-memory token bucket caches with async sync. This guarantees local P99 latency < 2ms while maintaining bounded eventual consistency globally.",
    pushbackPrompt: "What happens during a cross-region fiber partition? Does your rate limiter fail open or fail closed, and what is the cascading blast radius on upstream microservices?",
    scores: {
      mece: "9.8 / 10",
      acumen: "9.5 / 10",
      synthesis: "9.7 / 10",
      verdict: "L6 Staff Calibrated"
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
    }, 250);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-white/[0.08] bg-[#0E1013] overflow-hidden shadow-2xl">
      {/* Console Top Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#121418] border-b border-white/[0.06] text-xs font-mono-tech text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80"></span>
          </div>
          <span className="text-zinc-500">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-300 font-medium">INTERACTIVE SANDBOX</span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#08090A] border border-white/[0.06] mt-2 sm:mt-0">
          <button
            onClick={() => setActiveTab("case")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "case"
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Voice Case Simulator
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "resume"
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Live Resume Rewriter
          </button>
        </div>
      </div>

      {/* Main Sandbox Window */}
      <div className="p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {activeTab === "case" ? (
            <motion.div
              key="case-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Case Header Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono-tech text-xs font-semibold">
                    01
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-mono-tech">{currentCase.role}</div>
                    <div className="text-sm font-semibold text-white">{currentCase.caseTitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-tech px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                    {currentCase.turn}
                  </span>
                  <button
                    onClick={() => {
                      setCaseIndex((prev) => (prev + 1) % CASE_SCENARIOS.length);
                      setIsPushbackActive(false);
                    }}
                    className="flex items-center gap-1 text-xs font-mono-tech px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Switch Case Track
                  </button>
                </div>
              </div>

              {/* Prompt Block */}
              <div className="p-4 rounded-lg bg-[#14161B] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono-tech text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5" />
                    INTERVIEWER PROMPT (LIVE AUDIO SYNTHESIS)
                  </span>
                  <span className="text-zinc-500">VOICE SPEED: 1.0x</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                  "{isPushbackActive ? currentCase.pushbackPrompt : currentCase.prompt}"
                </p>
                {/* Audio Waveform Graphic */}
                <div className="flex items-center gap-1 pt-2">
                  {[24, 40, 16, 60, 80, 45, 90, 70, 30, 50, 85, 35, 75, 40, 20, 60, 80, 40, 25].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-emerald-500/70"
                      style={{
                        height: `${h * 0.28}px`,
                        opacity: i % 2 === 0 ? 0.9 : 0.4
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Live Candidate Response & Rubric Score */}
              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 p-4 rounded-lg bg-[#111317] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                      CANDIDATE RESPONSE (VOICE TRANSCRIBED)
                    </span>
                    <span className="text-emerald-400">Confidence: 99.1%</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    "{currentCase.candidateResponse}"
                  </p>

                  <div className="pt-2">
                    <Button
                      onClick={() => setIsPushbackActive(!isPushbackActive)}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      {isPushbackActive ? "Reset to Initial Turn" : "Simulate Partner Pushback →"}
                    </Button>
                  </div>
                </div>

                {/* Score Rubric Box */}
                <div className="p-4 rounded-lg bg-[#14161B] border border-white/[0.06] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono-tech text-zinc-400 mb-3 flex items-center justify-between">
                      <span>CALIBRATED RUBRIC</span>
                      <span className="text-emerald-400 font-bold">MBB SPEC</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono-tech">
                      <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-400">MECE Structure</span>
                        <span className="text-white font-semibold">{currentCase.scores.mece}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-400">Business Acumen</span>
                        <span className="text-white font-semibold">{currentCase.scores.acumen}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-400">Verbal Synthesis</span>
                        <span className="text-white font-semibold">{currentCase.scores.synthesis}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
                    <span className="inline-block text-[11px] font-mono-tech font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      {currentCase.scores.verdict}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="resume-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Tab Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="text-xs font-mono-tech text-zinc-400">
                  RECRUITER-GRADE LINE SCANNER (GOOGLE XYZ FORMULA CALIBRATED)
                </div>
                <button
                  onClick={handleNextBullet}
                  className="flex items-center gap-1 text-xs font-mono-tech px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isRewriting ? "animate-spin" : ""}`} />
                  Test Another Bullet
                </button>
              </div>

              {/* Before & After Split */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* Before Box */}
                <div className="p-4 rounded-lg bg-[#14161B] border border-red-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      UNQUANTIFIED DRAFT (SCORE: {currentBullet.scoreBefore}/100)
                    </span>
                    <span className="text-zinc-500">RAW BULLET</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-sans italic bg-[#0E1013] p-3 rounded border border-white/[0.04]">
                    "{currentBullet.raw}"
                  </p>
                  <div className="text-xs text-red-300/80 font-mono-tech">
                    [FAIL] {currentBullet.critique}
                  </div>
                </div>

                {/* After Box */}
                <div className="p-4 rounded-lg bg-[#14161B] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      OPTIMIZED RESULT (SCORE: {currentBullet.scoreAfter}/100)
                    </span>
                    <span className="text-emerald-400 font-bold">{currentBullet.impact}</span>
                  </div>
                  <p className="text-sm text-white font-sans font-medium bg-[#0E1013] p-3 rounded border border-emerald-500/20">
                    "{currentBullet.optimized}"
                  </p>
                  <div className="text-xs text-emerald-400 font-mono-tech">
                    [PASS] Quantified impact, high-agency action verb, verified metric density.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Console Bottom Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-[#121418] border-t border-white/[0.06] text-xs font-mono-tech text-zinc-500">
        <div className="flex items-center gap-4">
          <span>LATENCY: 140ms</span>
          <span>EVAL ENGINE: Cerebras Llama-3.3 70B</span>
        </div>
        <div className="text-zinc-400">
          Ready for live candidate interaction
        </div>
      </div>
    </div>
  );
}
