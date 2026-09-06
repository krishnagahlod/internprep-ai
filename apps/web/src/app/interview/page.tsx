"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/paywall-modal";
import { fetchEventSourceStream } from "@/lib/sse-client";
import { trackInterviewStarted, trackInterviewTurnCompleted } from "@/lib/analytics";
import { ttsEngine } from "@/lib/tts-engine";
import { usePresentation } from "@/hooks/use-presentation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, BookOpen, PenTool, AlertTriangle, X } from "lucide-react";
import {
  Message,
  RightPanelState,
  PHASES,
  DOMAIN_PHASES,
  InterviewHeader,
  InterviewPhaseTracker,
  InterviewChatPane,
  InterviewInputControls,
  InterviewSetupModal,
  InterviewWhiteboardPane,
  InterviewSourcePane,
  PresentationPlaceholder,
} from "@/components/interview";

function InterviewEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("id");
  const supabase = createClient();
  const {
    currentSessionId,
    currentPhase,
    setCurrentSessionId,
    setCurrentPhase,
    isGuest,
    guestInterviewCount,
    incrementGuestInterview,
    user,
    targetCompany,
  } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [caseContext, setCaseContext] = useState<string>("");
  const [caseSource, setCaseSource] = useState<string>("CCG Casebook.pdf");
  const [pageNumber, setPageNumber] = useState<number>(91);
  const [inputValue, setInputValue] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rightPanelState, setRightPanelState] = useState<RightPanelState>("whiteboard");
  const [sessionDomain, setSessionDomain] = useState<string>("");
  const [sessionCompany, setSessionCompany] = useState<string>("");
  const [chatWidth, setChatWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  // Mobile Split-Pane View Switcher State
  const [mobileView, setMobileView] = useState<"chat" | "canvas" | "source">("chat");

  const [showSetupModal, setShowSetupModal] = useState(true);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [selectedCaseType, setSelectedCaseType] = useState("Random Casebook Mix");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [interviewMode, setInterviewMode] = useState<"case" | "domain">("case");
  const [isPaywallLocked, setIsPaywallLocked] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallMeta, setPaywallMeta] = useState<{
    title?: string;
    description?: string;
    limit?: number;
    used?: number;
    resetAt?: string;
    featureKey?: string;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // External Display Presentation Mode
  const presentation = usePresentation({
    panelState: rightPanelState === "source" ? "source" : "whiteboard",
    caseContext,
    caseSource,
    pageNumber,
  });

  // TTS Speaker state listener
  useEffect(() => {
    const unsubscribe = ttsEngine.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      ttsEngine.stop();
    };
  }, []);

  // Resume Session logic
  useEffect(() => {
    const resumeSession = async () => {
      if (sessionIdParam) {
        setIsInitializingSession(true);
        setShowSetupModal(false);
        setIsTyping(true);
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(`${API_URL}/interview/session/${sessionIdParam}`);

          if (response.ok) {
            const data = await response.json();
            const session = data.session;
            const sessionMessages = data.messages;

            setCaseContext(session.case_state?.case_context || session.case_state?.resume_context || "");
            setCaseSource(session.case_state?.case_source || "");
            if (session.case_state?.page_number) {
              setPageNumber(session.case_state.page_number);
            }
            if (session.case_state?.domain) {
              setSessionDomain(session.case_state.domain);
            }
            if (session.case_state?.company) {
              setSessionCompany(session.case_state.company);
            }

            const loadedMessages = (sessionMessages && sessionMessages.length > 0)
              ? sessionMessages
              : (session.messages || []);
            setMessages(loadedMessages);

            // Auto-speak opening turn by default
            const lastAssistant = [...loadedMessages].reverse().find((m: any) => m.role === "assistant");
            if (lastAssistant?.content) {
              ttsEngine.unlockAudio();
              ttsEngine.speak(lastAssistant.content);
            }

            setCurrentSessionId(session.id);
            setCurrentPhase(session.case_state?.current_phase || "introduction");
            setInterviewMode(session.interview_type || "case");
            setIsTimerRunning(true);
          } else {
            setSessionLoadError("Failed to fetch session. Please ensure you are connected to the network.");
          }
        } catch (e) {
          setSessionLoadError("Connection error while loading session.");
        } finally {
          setIsTyping(false);
          setIsInitializingSession(false);
        }
      }
    };
    resumeSession();
  }, [sessionIdParam, setCurrentSessionId, setCurrentPhase]);

  // Drag to resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 25 && newWidth < 75) {
        setChatWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

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

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

  // Start Case logic
  const handleStartCase = async () => {
    if (isGuest && guestInterviewCount >= 1) {
      alert("You've reached your free guest limit (1 mock interview). Please sign up to continue using InternPrep AI.");
      router.push("/login");
      return;
    }

    ttsEngine.unlockAudio();
    setShowSetupModal(false);
    setIsTyping(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/interview/start_case`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          case_type: selectedCaseType,
          user_id: user?.id || (isGuest ? "guest" : undefined),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCaseContext(data.case_context || "");
        setCaseSource(data.case_source || "");
        if (data.page_number) setPageNumber(data.page_number);
        setMessages([{ role: "assistant", content: data.initial_message }]);
        setCurrentSessionId(data.session_id);
        setCurrentPhase(data.initial_phase);
        setIsTimerRunning(true);
        if (isGuest) {
          incrementGuestInterview();
        }
        trackInterviewStarted({
          interviewType: "case",
          company: targetCompany || undefined,
          sessionId: data.session_id,
        });
        if (data.initial_message && ttsEnabled) {
          ttsEngine.speak(data.initial_message);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === "object" ? errorData.detail : {};
          setPaywallMeta({
            title: "Mock Interview Limit Reached",
            description:
              detail.message ||
              (typeof errorData.detail === "string"
                ? errorData.detail
                : "You have reached your mock interview quota. Upgrade to Pro for 15 live mock sessions every month."),
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at,
          });
          setPaywallOpen(true);
          setShowSetupModal(true);
          return;
        }
        const fallbackProblem =
          "Our client is ElectraVolt, a Tier-1 European automotive supplier evaluating whether to enter the commercial EV battery pack manufacturing market in India over the next 3 years. Their CEO wants to know: 1) What is the addressable market size and projected margin profile? 2) What are the primary cost bottlenecks and regulatory entry barriers? 3) Should they build a greenfield facility or pursue a strategic joint venture with an established domestic player?";
        setCaseContext(`PROBLEM STATEMENT: ${fallbackProblem}`);
        setCaseSource("CCG Casebook.pdf");
        setPageNumber(91);
        setMessages([
          {
            role: "assistant",
            content: `Welcome! I'll be your case interviewer today. We are evaluating a strategic challenge for **ElectraVolt**, a Tier-1 European automotive supplier looking at entering the commercial EV battery manufacturing market in India.\n\n**Problem Statement**: ${fallbackProblem}\n\nWhenever you're ready, feel free to ask any initial clarifying questions, or take a moment to structure your thoughts.`,
          },
        ]);
        setCurrentPhase("introduction");
        setIsTimerRunning(true);
      }
    } catch (e) {
      const fallbackProblem =
        "Our client is ElectraVolt, a Tier-1 European automotive supplier evaluating whether to enter the commercial EV battery pack manufacturing market in India over the next 3 years. Their CEO wants to know: 1) What is the addressable market size and projected margin profile? 2) What are the primary cost bottlenecks and regulatory entry barriers? 3) Should they build a greenfield facility or pursue a strategic joint venture with an established domestic player?";
      setCaseContext(`PROBLEM STATEMENT: ${fallbackProblem}`);
      setCaseSource("CCG Casebook.pdf");
      setPageNumber(91);
      setMessages([
        {
          role: "assistant",
          content: `Welcome! I'll be your case interviewer today. We are evaluating a strategic challenge for **ElectraVolt**, a Tier-1 European automotive supplier looking at entering the commercial EV battery manufacturing market in India.\n\n**Problem Statement**: ${fallbackProblem}\n\nWhenever you're ready, feel free to ask any initial clarifying questions, or take a moment to structure your thoughts.`,
        },
      ]);
      setCurrentPhase("introduction");
      setIsTimerRunning(true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (overrideContent?: string, targetPhase?: string) => {
    const rawContent = overrideContent || (inputValue + (interimTranscript ? ` ${interimTranscript}` : "")).trim();
    if (!rawContent || isPaywallLocked) return;

    ttsEngine.stop();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
    }

    const userMessageContent = rawContent;
    const newMessages = [...messages, { role: "user" as const, content: userMessageContent }];
    setMessages(newMessages);
    setInputValue("");
    setInterimTranscript("");
    setIsTyping(true);

    if (targetPhase) {
      setCurrentPhase(targetPhase);
    }

    let streamedText = "";
    let hasInsertedAssistant = false;
    let hasSpoken = false;

    const playSpeechIfReady = (text: string) => {
      if (!hasSpoken && text.trim() && ttsEnabled) {
        hasSpoken = true;
        ttsEngine.speak(text.trim());
      }
    };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      await fetchEventSourceStream(`${API_URL}/interview/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: currentSessionId || "temp_session_id",
          messages: newMessages,
          current_phase: targetPhase || currentPhase,
          target_phase: targetPhase || undefined,
          scratchpad: "",
          case_context: caseContext,
          case_source: caseSource,
          interview_type: interviewMode,
          domain: sessionDomain || (interviewMode === "case" ? "Consulting" : "General"),
          company: sessionCompany || targetCompany || "",
          resume_context: interviewMode === "domain" ? caseContext : undefined,
          user_id: user?.id || (isGuest ? "guest" : undefined),
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
        onPaywall: () => {
          setIsPaywallLocked(true);
          setPaywallMeta({
            title: "Trial Limit Reached (4 Free Questions)",
            description:
              "You've completed your free 4-question trial preview! Unlock the full 45-minute simulation, dynamic edge-case follow-ups, and comprehensive partner rubric scorecard.",
            featureKey: "mock_interview",
          });
          setPaywallOpen(true);
        },
        onDone: (data) => {
          if (data?.new_phase) {
            setCurrentPhase(data.new_phase);
          }
          if (streamedText && ttsEnabled) {
            playSpeechIfReady(streamedText);
          }
          trackInterviewTurnCompleted({
            sessionId: currentSessionId || "temp_session_id",
            turnNumber: Math.ceil(newMessages.length / 2),
            phase: currentPhase,
          });
        },
        onError: (err) => {
          console.error("Interview streaming error:", err);
        },
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && prev[prev.length - 1].content.trim()) {
          return prev;
        }
        return [...newMessages, { role: "system", content: "Error: Connection lost. Please try again." }];
      });
    } finally {
      setIsTyping(false);
      if (streamedText && ttsEnabled) {
        playSpeechIfReady(streamedText);
      }
    }
  };

  const handleJumpToSection = (targetPhaseId: string) => {
    if (isTyping || targetPhaseId === currentPhase) return;
    const targetPhaseObj = activePhases.find((p) => p.id === targetPhaseId);
    if (!targetPhaseObj) return;

    const transitionText = `[Candidate requested to transition directly to the ${targetPhaseObj.label} section.]`;
    handleSendMessage(transitionText, targetPhaseId);
  };

  const handleEndSession = async () => {
    ttsEngine.stop();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
    }
    if (!currentSessionId) {
      router.push("/feedback");
      return;
    }

    setIsTyping(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${API_URL}/interview/end_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: currentSessionId }),
      });
      router.push(`/feedback?session_id=${currentSessionId}`);
    } catch (e) {
      console.error(e);
      router.push("/feedback");
    }
  };

  const activePhases = interviewMode === "domain" ? DOMAIN_PHASES : PHASES;

  if (isInitializingSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs font-mono-tech text-muted-foreground">RESTORING INTERVIEW SESSION...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Setup Modal */}
      <InterviewSetupModal
        open={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        selectedCaseType={selectedCaseType}
        setSelectedCaseType={setSelectedCaseType}
        onStartSession={handleStartCase}
        isInitializing={isTyping}
        targetCompany={targetCompany}
      />

      {/* Paywall Gate Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title={paywallMeta.title}
        description={paywallMeta.description}
        limit={paywallMeta.limit}
        used={paywallMeta.used}
        resetAt={paywallMeta.resetAt}
        featureKey={paywallMeta.featureKey}
      />

      {/* Top Header */}
      <InterviewHeader
        interviewMode={interviewMode}
        targetCompany={targetCompany}
        elapsedSeconds={elapsedSeconds}
        isListening={isListening}
        ttsEnabled={ttsEnabled}
        isSpeaking={isSpeaking}
        rightPanelState={rightPanelState}
        onPanelStateChange={(state) => {
          setRightPanelState(state);
          // Sync to external window if presenting
          if (presentation.status === "active") {
            presentation.sendPanelSwitch(state as "whiteboard" | "source");
          }
        }}
        pageNumber={pageNumber}
        onToggleTts={() => {
          if (ttsEnabled) {
            ttsEngine.stop();
          }
          setTtsEnabled(!ttsEnabled);
        }}
        onEndInterview={handleEndSession}
        isPresentationActive={presentation.status === "active"}
        isPresentationSupported={presentation.isSupported}
        isPresentationDetecting={presentation.status === "detecting"}
        isPresentationMockMode={presentation.isMockMode}
        onTogglePresentation={async () => {
          if (presentation.status === "active") {
            presentation.stopPresentation();
          } else {
            await presentation.startPresentation();
          }
        }}
      />

      {/* Phase Progression Stepper with Interactive Section Jumping */}
      <InterviewPhaseTracker
        phases={activePhases}
        currentPhase={currentPhase}
        onPhaseSelect={handleJumpToSection}
        disabled={isTyping}
      />

      {/* Mobile Segmented View Switcher */}
      <div className="lg:hidden flex items-center justify-around border-b border-border bg-card/80 p-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView("chat")}
          className={`flex-1 py-1 text-xs font-mono-tech font-bold rounded-lg transition-all ${
            mobileView === "chat"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground"
          }`}
        >
          Chat Feed
        </button>
        <button
          type="button"
          onClick={() => {
            setRightPanelState("whiteboard");
            setMobileView("canvas");
          }}
          className={`flex-1 py-1 text-xs font-mono-tech font-bold rounded-lg transition-all ${
            mobileView === "canvas" && rightPanelState === "whiteboard"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground"
          }`}
        >
          Whiteboard Canvas
        </button>
        <button
          type="button"
          onClick={() => {
            setRightPanelState("source");
            setMobileView("source");
          }}
          className={`flex-1 py-1 text-xs font-mono-tech font-bold rounded-lg transition-all ${
            mobileView === "source" || rightPanelState === "source"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground"
          }`}
        >
          Case Document {pageNumber ? `(p.${pageNumber})` : ""}
        </button>
      </div>

      {/* Main Workspace (Dual-Column on Desktop) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Chat Feed & Dictation Controls */}
        <div
          style={{ width: `${chatWidth}%` }}
          className={`h-full flex flex-col border-r border-border bg-background transition-all ${
            mobileView === "chat" ? "w-full" : "hidden lg:flex"
          }`}
        >
          <InterviewChatPane
            messages={messages}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
          />

          <InterviewInputControls
            inputValue={inputValue}
            setInputValue={setInputValue}
            isTyping={isTyping}
            isListening={isListening}
            interimTranscript={interimTranscript}
            onClearTranscript={() => {
              setInputValue("");
              setInterimTranscript("");
            }}
            onStopListening={() => {
              recognitionRef.current?.stop();
              setIsListening(false);
              setInterimTranscript("");
            }}
            onSendMessage={() => handleSendMessage()}
            onToggleListening={toggleListening}
          />
        </div>

        {/* Desktop Drag Handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="hidden lg:block w-1.5 hover:w-2 bg-border/40 hover:bg-emerald-500/60 cursor-col-resize transition-all z-20"
        />

        {/* Right Column: Whiteboard or Source or Resume or Presented */}
        <div
          style={{ width: `${100 - chatWidth}%` }}
          className={`h-full flex flex-col bg-background ${
            mobileView !== "chat" ? "w-full" : "hidden lg:flex"
          }`}
        >
          {presentation.status === "active" ? (
            <PresentationPlaceholder
              onReturn={() => presentation.stopPresentation()}
              isMockMode={presentation.isMockMode}
            />
          ) : rightPanelState === "source" || mobileView === "source" ? (
            <InterviewSourcePane
              caseContext={caseContext}
              caseSource={caseSource}
              pageNumber={pageNumber}
            />
          ) : rightPanelState === "resume" ? (
            <div className="h-full flex flex-col bg-card/40 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <h4 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground">
                    Candidate Resume Profile
                  </h4>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 text-xs font-sans leading-relaxed text-foreground whitespace-pre-wrap shadow-xs">
                {caseContext || "No resume text attached to this session."}
              </div>
            </div>
          ) : (
            <InterviewWhiteboardPane />
          )}
        </div>
      </div>

      {/* Presentation Error Toast */}
      <AnimatePresence>
        {presentation.error && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 flex items-start gap-3 max-w-md px-4 py-3 rounded-xl bg-card border border-red-500/20 shadow-lg backdrop-blur-md"
          >
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-mono-tech font-bold text-foreground mb-0.5">
                Presentation Error
              </p>
              <p className="text-[11px] font-sans text-muted-foreground leading-relaxed">
                {presentation.error.message}
              </p>
            </div>
            <button
              onClick={() => presentation.clearError()}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-xs font-mono-tech text-muted-foreground">CALIBRATING INTERVIEW ENGINE...</p>
          </div>
        </div>
      }
    >
      <InterviewEngine />
    </Suspense>
  );
}
