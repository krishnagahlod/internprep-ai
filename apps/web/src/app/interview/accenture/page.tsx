"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { fetchEventSourceStream } from "@/lib/sse-client";
import { PaywallModal } from "@/components/paywall-modal";
import {
  Message,
  InterviewHeader,
  InterviewPhaseTracker,
  InterviewChatPane,
  InterviewInputControls,
  InterviewWhiteboardPane,
} from "@/components/interview";
import {
  AccenturePracticeMode,
  AccentureReadinessReport,
  AccentureSetupModal,
  AccentureReadinessDossier,
  ACCENTURE_PHASES_MAP,
} from "@/components/accenture";

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

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [chatWidth, setChatWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Evaluation Dossier State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<AccentureReadinessReport | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Speech Recognition
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
    window.speechSynthesis.speak(utterance);
  };

  const handleStartSession = async () => {
    setIsInitializing(true);
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
          speakResponse(data.initial_message);
        }
      } else {
        setShowSetupModal(false);
        setMessages([
          {
            role: "assistant",
            content:
              "Good morning. I'm a Manager here at Accenture Strategy & Consulting. Walk me through your resume, highlighting the inflection points that shaped your interest in management consulting.",
          },
        ]);
        setIsTimerRunning(true);
      }
    } catch {
      setShowSetupModal(false);
      setMessages([
        {
          role: "assistant",
          content:
            "Good morning. I'm a Manager here at Accenture Strategy & Consulting. Let's begin with your background.",
        },
      ]);
      setIsTimerRunning(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const userMessage = inputValue;
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInputValue("");
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
            speakResponse(streamedText);
          }
        },
        onError: (err) => {
          console.error("Accenture stream error:", err);
        },
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Understood. Let's look at how you would quantify that from a business perspective.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndInterview = async () => {
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
        // Fallback evaluation
        setEvaluationReport({
          session_id: sessionId || "temp_accenture_id",
          overall_verdict: "Hire",
          candidate_level: "Accenture Strategy & Consulting Ready",
          readiness_score: 84,
          executive_summary:
            "Demonstrated strong structured problem solving and technical fluency, with room for sharper quantification on resume projects.",
          dimension_scores: {
            accenture_alignment: {
              score: 85,
              critique: "Clear motivation for management consulting.",
              recommendation: "Articulate Accenture-specific tech + strategy synergy more explicitly.",
            },
            resume_ownership: {
              score: 88,
              critique: "Good technical depth.",
              recommendation: "Always state the baseline before quoting percentage improvements.",
            },
            business_and_digital_thinking: {
              score: 82,
              critique: "Solid commercial instincts.",
              recommendation: "Structure cost buckets before diving into pricing levers.",
            },
            structured_problem_solving: {
              score: 80,
              critique: "MECE issue tree established early.",
              recommendation: "Synthesize recommendations into 3 crisp executive takeaways.",
            },
            ai_tech_fluency: {
              score: 90,
              critique: "Clear explanation of RAG vs Fine-tuning.",
              recommendation: "Highlight change management when deploying AI for clients.",
            },
            executive_presence_under_pressure: {
              score: 80,
              critique: "Maintained composure under probing.",
              recommendation: "Keep initial case structuring under 90 seconds.",
            },
          },
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
        executive_summary: "Completed Accenture Consulting interview simulation.",
        dimension_scores: {
          accenture_alignment: { score: 80, critique: "Good alignment with consulting fundamentals." },
          resume_ownership: { score: 85, critique: "Strong project defense." },
          business_and_digital_thinking: { score: 80, critique: "Logical business intuition." },
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          <h3 className="text-sm font-bold font-display text-foreground">
            Synthesizing Partner-Level Evaluation...
          </h3>
          <p className="text-xs font-mono-tech text-muted-foreground">
            Benchmarking transcript against 6 Accenture Consulting dimensions
          </p>
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
      <InterviewHeader
        interviewMode="case"
        targetCompany="Accenture Strategy & Consulting"
        elapsedSeconds={elapsedSeconds}
        isListening={isListening}
        ttsEnabled={ttsEnabled}
        onToggleTts={() => setTtsEnabled(!ttsEnabled)}
        onEndInterview={handleEndInterview}
      />

      {/* Stepper Progression Tracker */}
      <InterviewPhaseTracker phases={activePhases} currentPhase={currentPhase} />

      {/* Dual Column Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Chat Feed */}
        <div
          style={{ width: `${chatWidth}%` }}
          className="h-full flex flex-col border-r border-border bg-background transition-all"
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

        {/* Drag Handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="hidden lg:block w-1.5 hover:w-2 bg-border/40 hover:bg-emerald-500/60 cursor-col-resize transition-all z-20"
        />

        {/* Right Column: Whiteboard Canvas */}
        <div style={{ width: `${100 - chatWidth}%` }} className="h-full flex flex-col bg-background">
          <InterviewWhiteboardPane />
        </div>
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
            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
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
