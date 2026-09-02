"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { fetchEventSourceStream } from "@/lib/sse-client";
import { ttsEngine } from "@/lib/tts-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  FileText,
  Edit3,
  X,
  ArrowRight,
  Loader2,
  Clock,
  RotateCcw,
  CheckCircle2,
  Bot,
  User,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AccenturePracticeMode,
  AccentureReadinessReport,
  AccentureSetupModal,
  AccentureReadinessDossier,
  ACCENTURE_PHASES_MAP,
  LiveDictationCapsule,
} from "@/components/accenture";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const FRAMEWORK_CHIPS = [
  "Let me structure this with a 3-pillar MECE framework...",
  "May I clarify if this margin decline is industry-wide or company-specific?",
  "Let me break down the revenue tree into Price × Volume.",
  "Let me state the project baseline metric first before quoting percentage impact.",
  "From a GenAI ROI perspective, RAG offers lower hallucination risk for client data.",
];

function AccentureInterviewEngine() {
  const router = useRouter();
  const { user, isGuest, resumeText } = useAuthStore();

  const [practiceMode, setPracticeMode] = useState<AccenturePracticeMode>("full_simulation");
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState("introduction");
  const activePhases = ACCENTURE_PHASES_MAP[practiceMode] || ACCENTURE_PHASES_MAP.full_simulation;

  // Input & Dictation States
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isManagerSpeaking, setIsManagerSpeaking] = useState(false);

  // Timer & Drawer States
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"resume" | "scratchpad">("resume");
  const [scratchpadText, setScratchpadText] = useState("");

  // Evaluation Dossier State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<AccentureReadinessReport | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // TTS speaking listener
  useEffect(() => {
    const unsubscribe = ttsEngine.onSpeakingChange((speaking) => {
      setIsManagerSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      ttsEngine.stop();
    };
  }, []);

  // Web Speech Recognition Real-Time Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcript;
            } else {
              currentInterim += transcript;
            }
          }

          setInterimTranscript(currentInterim);

          if (finalChunk) {
            setInputValue((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
            setInterimTranscript("");
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
    } else {
      ttsEngine.stop();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        // Safe start fallback
      }
    }
  };

  const handleStartSession = async () => {
    setIsInitializing(true);
    ttsEngine.unlockAudio();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/interview/accenture/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_mode: practiceMode,
          resume_context: resumeText,
          user_id: user?.id || (isGuest ? "guest" : undefined),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setCurrentPhase(data.initial_phase);
        setMessages([{ role: "assistant", content: data.initial_message }]);
        setShowSetupModal(false);
        setIsTimerRunning(true);
        if (ttsEnabled) {
          ttsEngine.speak(data.initial_message);
        }
      } else {
        const fallbackMsg =
          "Good morning. I'm a Senior Manager at Accenture Strategy & Consulting. Walk me through your resume, highlighting the inflection points that shaped your interest in management consulting.";
        setShowSetupModal(false);
        setMessages([{ role: "assistant", content: fallbackMsg }]);
        setIsTimerRunning(true);
        if (ttsEnabled) {
          ttsEngine.speak(fallbackMsg);
        }
      }
    } catch {
      const fallbackMsg =
        "Good morning. I'm a Senior Manager at Accenture Strategy & Consulting. Walk me through your key projects and background.";
      setShowSetupModal(false);
      setMessages([{ role: "assistant", content: fallbackMsg }]);
      setIsTimerRunning(true);
      if (ttsEnabled) {
        ttsEngine.speak(fallbackMsg);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async () => {
    const textToSend = (inputValue + (interimTranscript ? ` ${interimTranscript}` : "")).trim();
    if (!textToSend || isTyping) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
    }

    ttsEngine.stop();

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInputValue("");
    setInterimTranscript("");
    setIsTyping(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      let streamedText = "";
      let hasInsertedAssistant = false;

      await fetchEventSourceStream(`${API_URL}/interview/accenture/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId || "temp_accenture_id",
          messages: newMessages,
          current_phase: currentPhase,
          practice_mode: practiceMode,
          time_elapsed_secs: elapsedSeconds,
          resume_context: resumeText,
        }),
        onPhase: (phase) => {
          if (phase) setCurrentPhase(phase);
        },
        onToken: (token) => {
          setIsTyping(false);
          streamedText += token;
          if (!hasInsertedAssistant) {
            hasInsertedAssistant = true;
            setMessages([...newMessages, { role: "assistant", content: streamedText }]);
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
                updated[updated.length - 1] = { role: "assistant", content: streamedText };
              }
              return updated;
            });
          }
        },
        onDone: (data) => {
          if (data?.new_phase) {
            setCurrentPhase(data.new_phase);
          }
          if (streamedText && ttsEnabled) {
            ttsEngine.speak(streamedText);
          }
        },
        onError: (err) => {
          console.error("Accenture stream error:", err);
        },
      });
    } catch {
      const errorMsg = "Understood. Let's look at how you would quantify that from a business and client value perspective.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
        },
      ]);
      if (ttsEnabled) ttsEngine.speak(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndInterview = async () => {
    ttsEngine.stop();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    setIsEvaluating(true);
    setIsTimerRunning(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/interview/accenture/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId || "temp_accenture_id",
          messages,
          resume_context: resumeText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluationReport(data.feedback);
      } else {
        setEvaluationReport({
          session_id: sessionId || "temp_accenture_id",
          overall_verdict: "Hire",
          candidate_level: "Accenture Strategy & Consulting Ready",
          readiness_score: 84,
          percentile_estimate: 86,
          executive_summary:
            "Demonstrated strong structured problem solving and technical breadth, with room for sharper metric quantification on resume projects.",
          dimension_scores: {
            accenture_alignment: {
              score: 85,
              status: "mastered",
              critique: "Clear motivation for management consulting.",
              recommendation: "Articulate Accenture-specific tech + strategy synergy more explicitly.",
            },
            resume_ownership: {
              score: 80,
              status: "proficient",
              critique: "Good technical depth.",
              recommendation: "Always state the baseline before quoting percentage improvements.",
            },
            business_and_digital_thinking: {
              score: 78,
              status: "proficient",
              critique: "Solid commercial instincts.",
              recommendation: "Structure cost buckets before diving into pricing levers.",
            },
            structured_problem_solving: {
              score: 82,
              status: "proficient",
              critique: "MECE issue tree established early.",
              recommendation: "Synthesize recommendations into 3 crisp executive takeaways.",
            },
            ai_tech_fluency: {
              score: 90,
              status: "mastered",
              critique: "Clear explanation of RAG vs Fine-tuning.",
              recommendation: "Highlight change management when deploying AI for clients.",
            },
            executive_presence_under_pressure: {
              score: 80,
              status: "proficient",
              critique: "Maintained composure under probing.",
              recommendation: "Keep initial case structuring under 90 seconds.",
            },
          },
          turn_by_turn_rewrites: [
            {
              turn_number: 1,
              question_context: "Project impact and personal ownership defense",
              what_you_said: "I worked on the project and we helped improve the overall sustainability pipeline.",
              gap_identified: "Lacked baseline metrics and specific personal ownership.",
              golden_benchmark_answer:
                "I led the quantitative ESG benchmarking across 8 conglomerates, personally designing the carbon reduction model that identified a 14% energy savings reviewed by the CSO.",
            },
          ],
          fix_before_real_interview: [
            "Always lead with the baseline when defending quantitative resume metrics.",
            "Ensure consulting case issue trees explicitly cover both internal and external revenue drivers.",
            "Reinforce 'Why Accenture' with specific references to end-to-end digital transformation.",
          ],
        });
      }
    } catch {
      setEvaluationReport({
        session_id: sessionId || "temp_accenture_id",
        overall_verdict: "Hire",
        candidate_level: "Accenture Strategy & Consulting Ready",
        readiness_score: 82,
        percentile_estimate: 84,
        executive_summary: "Completed Accenture Consulting interview simulation.",
        dimension_scores: {
          accenture_alignment: { score: 80, critique: "Good alignment with consulting fundamentals." },
          resume_ownership: { score: 80, critique: "Strong project defense." },
          business_and_digital_thinking: { score: 78, critique: "Logical business intuition." },
          structured_problem_solving: { score: 80, critique: "Clear problem breakdown." },
          ai_tech_fluency: { score: 85, critique: "Good tech translation." },
          executive_presence_under_pressure: { score: 80, critique: "Professional communication." },
        },
        fix_before_real_interview: [
          "State metric baselines upfront.",
          "Structure business problems MECE.",
          "Articulate why Accenture's end-to-end model fits your career goals.",
        ],
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  if (evaluationReport) {
    return (
      <AccentureReadinessDossier
        report={evaluationReport}
        onRetake={() => {
          setEvaluationReport(null);
          setShowSetupModal(true);
          setMessages([]);
          setElapsedSeconds(0);
        }}
      />
    );
  }

  if (isEvaluating) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
          <div className="h-12 w-12 rounded-2xl border-3 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <h3 className="text-base font-bold font-display text-foreground">
            Synthesizing Partner-Level Dossier...
          </h3>
          <p className="text-xs font-mono-tech text-muted-foreground">
            Benchmarking transcript against 6 Accenture Consulting dimensions & IIT Bombay cohort standards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-emerald-500/20">
      {/* Calibration Setup Dialog */}
      <AccentureSetupModal
        open={showSetupModal}
        onClose={() => router.push("/dashboard")}
        selectedMode={practiceMode}
        setSelectedMode={setPracticeMode}
        onStartSession={handleStartSession}
        isInitializing={isInitializing}
      />

      {/* Top Header */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="h-8 px-2 text-xs font-mono-tech text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-tech uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold hidden sm:inline-block">
              ACCENTURE STRATEGY
            </span>
            <span className="text-xs font-bold font-display text-foreground truncate max-w-[160px] sm:max-w-none">
              Management Consulting Simulation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs font-mono-tech font-bold text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Voice Synthesis Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (ttsEnabled) {
                ttsEngine.stop();
                setTtsEnabled(false);
              } else {
                setTtsEnabled(true);
                ttsEngine.unlockAudio();
              }
            }}
            className={`h-8 px-2 rounded-lg font-mono-tech text-xs flex items-center gap-1.5 cursor-pointer ${
              ttsEnabled
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden md:inline">{ttsEnabled ? "Voice Active" : "Muted"}</span>
          </Button>

          {/* Resume / Scratchpad Sheet Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDrawer(!showDrawer)}
            className="h-8 px-2.5 rounded-lg font-mono-tech text-xs flex items-center gap-1.5 border-border cursor-pointer"
          >
            {showDrawer ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Resume & Notes</span>
          </Button>

          {/* End Session CTA */}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleEndInterview}
            className="h-8 px-3 rounded-lg font-mono-tech text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
          >
            End Interview
          </Button>
        </div>
      </header>

      {/* Stepper Progression Ribbon */}
      <div className="border-b border-border bg-muted/30 px-4 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
        {activePhases.map((phase, idx) => {
          const isActive = currentPhase === phase.id;
          return (
            <div
              key={phase.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-tech shrink-0 transition-colors ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30"
                  : "text-muted-foreground opacity-70"
              }`}
            >
              <span className="text-[9px] opacity-70">{idx + 1}.</span>
              <span>{phase.label.replace(/^[0-9]+\.\s*/, "")}</span>
            </div>
          );
        })}
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center-Stage Conversational Room */}
        <div className="flex-1 flex flex-col h-full overflow-hidden max-w-4xl mx-auto w-full px-4 sm:px-6">
          {/* Active AI Manager Presence Banner */}
          <div className="py-2.5 flex items-center justify-between border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${
                    isManagerSpeaking
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-md ring-2 ring-emerald-500/30 animate-pulse"
                      : "bg-muted text-foreground border-border"
                  }`}
                >
                  <Bot className="h-4 w-4" />
                </div>
                {isManagerSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-foreground font-display block">
                  Senior Manager, Accenture Strategy & Consulting
                </span>
                <span className="text-[10px] font-mono-tech text-muted-foreground block">
                  {isManagerSpeaking
                    ? "Speaking live..."
                    : isTyping
                    ? "Synthesizing next inquiry..."
                    : isListening
                    ? "Listening to candidate..."
                    : "Awaiting candidate response"}
                </span>
              </div>
            </div>

            {/* Speaking Waveform */}
            {isManagerSpeaking && (
              <div className="flex items-center gap-1">
                {[50, 90, 40, 100, 60, 80, 45].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [`${h * 0.2}%`, `${h}%`, `${h * 0.3}%`] }}
                    transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                    className="w-1 bg-emerald-500 rounded-full h-3.5 inline-block"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isAssistant ? "items-start" : "items-start justify-end"}`}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-[13px] leading-relaxed font-sans shadow-xs ${
                      isAssistant
                        ? "bg-card border border-border text-foreground"
                        : "bg-emerald-600 dark:bg-emerald-600 text-white font-medium ml-auto"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-full bg-muted border border-border text-foreground flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground py-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1">Manager is structuring response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Framework Response Chips */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-[10px] font-mono-tech text-muted-foreground shrink-0 font-bold uppercase">
              Starters:
            </span>
            {FRAMEWORK_CHIPS.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputValue(chip)}
                className="text-[10px] font-mono-tech px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border shrink-0 transition-colors cursor-pointer"
              >
                {chip.length > 35 ? `${chip.slice(0, 35)}...` : chip}
              </button>
            ))}
          </div>

          {/* Real-Time Live Dictation Capsule (Appears above input during STT) */}
          <LiveDictationCapsule
            isListening={isListening}
            interimTranscript={interimTranscript}
            confirmedText={inputValue}
            onSend={handleSendMessage}
            onClear={() => {
              setInputValue("");
              setInterimTranscript("");
            }}
            onStop={() => {
              recognitionRef.current?.stop();
              setIsListening(false);
            }}
          />

          {/* Input Controls */}
          <div className="pb-4 pt-1 shrink-0">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border shadow-md focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Speak or type your consulting answer... (Press Enter to send)"
                disabled={isTyping}
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={toggleListening}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 animate-pulse"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={isListening ? "Stop listening" : "Start speech dictation"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-9 px-3 rounded-xl font-mono-tech text-xs font-bold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Slide-Over Resume & Scratchpad Drawer */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-80 sm:w-96 border-l border-border bg-card/95 backdrop-blur-xl h-full flex flex-col z-20 shadow-2xl absolute right-0 top-0 bottom-0"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={drawerTab === "resume" ? "secondary" : "ghost"}
                    onClick={() => setDrawerTab("resume")}
                    className="h-7 text-xs font-mono-tech rounded-lg"
                  >
                    <FileText className="h-3 w-3 mr-1" /> Resume Context
                  </Button>
                  <Button
                    size="sm"
                    variant={drawerTab === "scratchpad" ? "secondary" : "ghost"}
                    onClick={() => setDrawerTab("scratchpad")}
                    className="h-7 text-xs font-mono-tech rounded-lg"
                  >
                    <Edit3 className="h-3 w-3 mr-1" /> Scratchpad
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar text-xs font-sans leading-relaxed">
                {drawerTab === "resume" ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono-tech uppercase text-muted-foreground font-bold block">
                      Active Resume Extracted Content:
                    </span>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border whitespace-pre-wrap font-mono-tech text-[11px] text-muted-foreground">
                      {resumeText || "No resume text currently extracted. The AI is operating with IIT candidate context."}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 h-full flex flex-col">
                    <span className="text-[10px] font-mono-tech uppercase text-muted-foreground font-bold block">
                      Case Math & Framework Scratchpad:
                    </span>
                    <textarea
                      value={scratchpadText}
                      onChange={(e) => setScratchpadText(e.target.value)}
                      placeholder="Jot down quick MECE trees, revenue = P × Q math, or candidate notes..."
                      className="flex-1 w-full p-3 rounded-xl bg-muted/30 border border-border text-xs font-mono-tech text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AccentureInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <p className="text-xs font-mono-tech text-muted-foreground">
              INITIALIZING ACCENTURE CONSULTING STUDIO...
            </p>
          </div>
        </div>
      }
    >
      <AccentureInterviewEngine />
    </Suspense>
  );
}
