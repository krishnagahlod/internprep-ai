"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/paywall-modal";
import { fetchEventSourceStream } from "@/lib/sse-client";
import { trackInterviewStarted, trackInterviewTurnCompleted } from "@/lib/analytics";
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
  const [caseSource, setCaseSource] = useState<string>("");
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rightPanelState, setRightPanelState] = useState<RightPanelState>("whiteboard");
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

            if (sessionMessages && sessionMessages.length > 0) {
              setMessages(sessionMessages);
            } else {
              setMessages(session.messages || []);
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
  }, [sessionIdParam]);

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

  // Start Case logic
  const handleStartCase = async () => {
    if (isGuest && guestInterviewCount >= 1) {
      alert("You've reached your free guest limit (1 mock interview). Please sign up to continue using InternPrep AI.");
      router.push("/login");
      return;
    }

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
        setMessages([{ role: "assistant", content: "Hello! I'll be your interviewer today. Are you ready to begin?" }]);
      }
    } catch (e) {
      setMessages([{ role: "assistant", content: "Hello! I'll be your interviewer today. Are you ready to begin the case?" }]);
    } finally {
      setIsTyping(false);
    }
  };

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
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInputValue((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
          }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakResponse = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isPaywallLocked) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const userMessageContent = inputValue;
    const newMessages = [...messages, { role: "user" as const, content: userMessageContent }];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      let streamedText = "";
      let hasInsertedAssistant = false;

      await fetchEventSourceStream(`${API_URL}/interview/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: currentSessionId || "temp_session_id",
          messages: newMessages,
          current_phase: currentPhase,
          scratchpad: "",
          case_context: caseContext,
          case_source: caseSource,
          interview_type: interviewMode,
          domain: "",
          company: "",
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
            speakResponse(streamedText);
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
    }
  };

  const handleEndSession = async () => {
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
        onToggleTts={() => setTtsEnabled(!ttsEnabled)}
        onEndInterview={handleEndSession}
      />

      {/* Phase Progression Stepper */}
      <InterviewPhaseTracker phases={activePhases} currentPhase={currentPhase} />

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
          onClick={() => setMobileView("canvas")}
          className={`flex-1 py-1 text-xs font-mono-tech font-bold rounded-lg transition-all ${
            mobileView === "canvas"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground"
          }`}
        >
          Whiteboard Canvas
        </button>
        {caseContext && (
          <button
            type="button"
            onClick={() => setMobileView("source")}
            className={`flex-1 py-1 text-xs font-mono-tech font-bold rounded-lg transition-all ${
              mobileView === "source"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground"
            }`}
          >
            Case Source
          </button>
        )}
      </div>

      {/* Main Workspace (Dual-Column on Desktop) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Chat Feed */}
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
            onSendMessage={handleSendMessage}
            onToggleListening={toggleListening}
          />
        </div>

        {/* Desktop Drag Handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="hidden lg:block w-1.5 hover:w-2 bg-border/40 hover:bg-emerald-500/60 cursor-col-resize transition-all z-20"
        />

        {/* Right Column: Whiteboard or Source */}
        <div
          style={{ width: `${100 - chatWidth}%` }}
          className={`h-full flex flex-col bg-background ${
            mobileView !== "chat" ? "w-full" : "hidden lg:flex"
          }`}
        >
          {mobileView === "source" || rightPanelState === "source" ? (
            <InterviewSourcePane
              caseContext={caseContext}
              caseSource={caseSource}
              pageNumber={pageNumber}
            />
          ) : (
            <InterviewWhiteboardPane />
          )}
        </div>
      </div>
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
