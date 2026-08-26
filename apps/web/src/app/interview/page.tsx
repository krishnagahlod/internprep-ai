"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Mic, Send, PenTool, ArrowLeft, Loader2, 
  Volume2, VolumeX, Lightbulb, FileText, Bot, 
  User, Play, Clock, CheckCircle2, ExternalLink, X, Sparkles,
  Lock, Zap
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import dynamic from "next/dynamic"
import { PaywallModal } from "@/components/paywall-modal"

// Dynamically import Excalidraw to prevent SSR hydration errors
const ExcalidrawWrapper = dynamic(
  () => import("@/components/ExcalidrawWrapper"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-background"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> }
)

type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

type RightPanelState = "whiteboard" | "source"

const PHASES = [
  { id: "introduction", label: "Intro" },
  { id: "clarifying", label: "Clarify" },
  { id: "structuring", label: "Structure" },
  { id: "quantitative", label: "Quant" },
  { id: "brainstorming", label: "Ideas" },
  { id: "synthesis", label: "Synthesis" }
]

const DOMAIN_PHASES = [
  { id: "introduction", label: "Intro & Resume" },
  { id: "technical", label: "Technical Q&A" },
  { id: "hr", label: "HR & Behavioral" }
]

function InterviewEngine() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get("id")
  const supabase = createClient()
  const { currentSessionId, currentPhase, setCurrentSessionId, setCurrentPhase, isGuest, guestInterviewCount, incrementGuestInterview, user } = useAuthStore()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [caseContext, setCaseContext] = useState<string>("")
  const [caseSource, setCaseSource] = useState<string>("")
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [rightPanelState, setRightPanelState] = useState<RightPanelState>("whiteboard")
  const [chatWidth, setChatWidth] = useState(50) // Default to 50%
  const [isDragging, setIsDragging] = useState(false)
  const [showResumePanel, setShowResumePanel] = useState(false)
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null)
  
  // Mobile Split-Pane View Switcher State (Phase 2 UX enhancement)
  const [mobileView, setMobileView] = useState<"chat" | "canvas" | "source">("chat")

  const [showSetupModal, setShowSetupModal] = useState(true)
  const [isInitializingSession, setIsInitializingSession] = useState(false)
  const [selectedCaseType, setSelectedCaseType] = useState("Random")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [interviewMode, setInterviewMode] = useState<"case" | "domain">("case")
  const [isPaywallLocked, setIsPaywallLocked] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallMeta, setPaywallMeta] = useState<{
    title?: string
    description?: string
    limit?: number
    used?: number
    resetAt?: string
    featureKey?: string
  }>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Resume Session logic
  useEffect(() => {
    const resumeSession = async () => {
      if (sessionIdParam) {
        setIsInitializingSession(true)
        setShowSetupModal(false)
        setIsTyping(true)
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          const response = await fetch(`${API_URL}/interview/session/${sessionIdParam}`)
          
          if (response.ok) {
            const data = await response.json()
            const session = data.session
            const sessionMessages = data.messages
            
            setCaseContext(session.case_state?.case_context || session.case_state?.resume_context || "")
            setCaseSource(session.case_state?.case_source || "")
            
            if (sessionMessages && sessionMessages.length > 0) {
              setMessages(sessionMessages)
            } else {
              setMessages(session.messages || [])
            }
            
            setCurrentSessionId(session.id)
            setCurrentPhase(session.case_state?.current_phase || "introduction")
            setInterviewMode(session.interview_type || "case")
            setIsTimerRunning(true)
          } else {
             setSessionLoadError("Failed to fetch session. Please ensure you are connected to the network.")
          }
        } catch (e) {
          setSessionLoadError("Connection error while loading session.")
        } finally {
          setIsTyping(false)
          setIsInitializingSession(false)
        }
      }
    }
    resumeSession()
  }, [sessionIdParam])

  // Drag to resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const newWidth = (e.clientX / window.innerWidth) * 100
      if (newWidth > 25 && newWidth < 75) {
        setChatWidth(newWidth)
      }
    }
    const handleMouseUp = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Start Case logic
  const handleStartCase = async () => {
    if (isGuest && guestInterviewCount >= 1) {
      alert("You've reached your free guest limit (1 mock interview). Please sign up to continue using InternPrep AI.")
      router.push("/login")
      return
    }

    setShowSetupModal(false)
    setIsTyping(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const response = await fetch(`${API_URL}/interview/start_case`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          case_type: selectedCaseType,
          user_id: user?.id || (isGuest ? "guest" : undefined)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCaseContext(data.case_context || "")
        setCaseSource(data.case_source || "")
        if (data.page_number) setPageNumber(data.page_number)
        setMessages([{ role: "assistant", content: data.initial_message }])
        setCurrentSessionId(data.session_id)
        setCurrentPhase(data.initial_phase)
        setIsTimerRunning(true)
        if (isGuest) {
          incrementGuestInterview()
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === 'object' ? errorData.detail : {}
          setPaywallMeta({
            title: "Mock Interview Limit Reached",
            description: detail.message || (typeof errorData.detail === 'string' ? errorData.detail : "You have reached your mock interview quota. Upgrade to Pro for 15 live mock sessions every month."),
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at
          })
          setPaywallOpen(true)
          setShowSetupModal(true)
          return
        }
        setMessages([{ role: "assistant", content: "Hello! I'll be your interviewer today. Are you ready to begin?" }])
      }
    } catch (e) {
      setMessages([{ role: "assistant", content: "Hello! I'll be your interviewer today. Are you ready to begin the case?" }])
    } finally {
      setIsTyping(false)
    }
  }

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setInputValue((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript))
          }
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const speakResponse = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*_#`]/g, "")
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.05
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleGetHint = async () => {
    if (messages.length === 0) return
    setIsTyping(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/hint`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: currentSessionId || "temp_session_id",
          messages: messages,
          current_phase: currentPhase,
          scratchpad: "",
          case_context: caseContext,
          case_source: caseSource
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch hint")

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "system", content: data.hint }])
    } catch (error) {
      console.error(error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isPaywallLocked) return

    if (window.speechSynthesis) window.speechSynthesis.cancel()

    const newMessages = [...messages, { role: "user" as const, content: inputValue }]
    setMessages(newMessages)
    setInputValue("")
    setIsTyping(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/chat`, {
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
          user_id: user?.id || (isGuest ? "guest" : undefined)
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch response")

      const data = await response.json()
      
      if (data.is_paywall_locked) {
        setIsPaywallLocked(true)
        if (data.response && data.response.trim()) {
          setMessages([...newMessages, { role: "assistant", content: data.response }])
        }
        setPaywallMeta({
          title: "Trial Limit Reached (4 Free Questions)",
          description: "You've completed your free 4-question trial preview! Unlock the full 45-minute simulation, dynamic edge-case follow-ups, and comprehensive partner rubric scorecard.",
          featureKey: "mock_interview"
        })
        setPaywallOpen(true)
      } else {
        if (data.response && data.response.trim()) {
          setMessages([...newMessages, { role: "assistant", content: data.response }])
          if (ttsEnabled) {
            speakResponse(data.response)
          }
        }
        if (data.new_phase) {
          setCurrentPhase(data.new_phase)
        }
      }

    } catch (error) {
      console.error(error)
      setMessages([...newMessages, { role: "system", content: "Error: Connection lost. Please try again." }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleEndSession = async () => {
    if (!currentSessionId) {
      router.push("/feedback")
      return
    }
    
    setIsTyping(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      await fetch(`${API_URL}/interview/end_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: currentSessionId })
      })
      router.push(`/feedback?session_id=${currentSessionId}`)
    } catch (e) {
      console.error(e)
      router.push("/feedback")
    }
  }

  const caseTypes = ["Random", "Profitability", "Market Entry", "Growth", "Pricing", "Market Sizing", "M&A"]

  if (isInitializingSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs font-mono-tech text-muted-foreground">RESTORING INTERVIEW SESSION...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Interview Calibration Setup</h2>
                <p className="text-xs text-muted-foreground">Select case type to simulate partner evaluation.</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-mono-tech uppercase tracking-wider text-muted-foreground mb-2 block">Case Framework Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {caseTypes.map(type => (
                    <Button
                      key={type}
                      variant={selectedCaseType === type ? "default" : "outline"}
                      size="sm"
                      className={`justify-start text-xs h-9 rounded-lg font-mono-tech ${
                        selectedCaseType === type 
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                          : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setSelectedCaseType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleStartCase} 
              className="w-full h-10 text-xs font-semibold font-mono-tech bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all"
            >
              <Play className="h-4 w-4 mr-2" /> Start Mock Interview
            </Button>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel()
              router.push("/dashboard")
            }} 
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md h-8 px-2.5 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Save & Exit
          </Button>

          <div className="h-4 w-px bg-border hidden sm:block" />
          
          {/* Phase Progress Indicator */}
          <div className="hidden lg:flex items-center gap-1">
            {(interviewMode === "domain" ? DOMAIN_PHASES : PHASES).map((phase, idx, arr) => {
              const isActive = currentPhase === phase.id
              const phaseIndex = arr.findIndex(p => p.id === currentPhase)
              const isPast = idx < phaseIndex
              
              return (
                <div key={phase.id} className="flex items-center">
                  <div className={`text-[10px] font-mono-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-all flex items-center ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-xs' 
                      : isPast 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'text-muted-foreground opacity-60'
                  }`}>
                    {isPast && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {phase.label}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-2 h-px mx-1 ${isPast ? 'bg-emerald-500/30' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Actions & Tool Switches */}
        <div className="flex items-center gap-2">
          
          {/* Mobile Split View Switcher */}
          <div className="flex md:hidden p-0.5 rounded-md bg-muted border border-border text-[11px] font-mono-tech">
            <button
              onClick={() => setMobileView("chat")}
              className={`px-2 py-1 rounded transition-all ${mobileView === "chat" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileView("canvas")}
              className={`px-2 py-1 rounded transition-all ${mobileView === "canvas" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"}`}
            >
              Canvas
            </button>
            {caseSource && (
              <button
                onClick={() => setMobileView("source")}
                className={`px-2 py-1 rounded transition-all ${mobileView === "source" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"}`}
              >
                Doc
              </button>
            )}
          </div>

          {/* Timer */}
          <div className="hidden sm:flex items-center text-muted-foreground font-mono-tech text-xs font-semibold bg-muted/60 rounded-md border border-border overflow-hidden">
            <div className="px-2.5 py-1 flex items-center border-r border-border">
              <Clock className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              {formatTime(elapsedSeconds)}
            </div>
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)} 
              className="px-2 py-1 hover:bg-muted text-foreground transition-colors"
              title={isTimerRunning ? "Pause Interview" : "Resume Interview"}
            >
              {isTimerRunning ? (
                <span className="h-2 w-2 rounded-xs bg-amber-500 inline-block" />
              ) : (
                <Play className="h-3 w-3 text-emerald-500" />
              )}
            </button>
          </div>

          <ThemeToggle />
          
          {interviewMode === "case" && (
            <div className="hidden md:flex items-center gap-1 p-0.5 rounded-md bg-muted/60 border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelState("whiteboard")}
                className={`h-7 px-2.5 text-xs font-mono-tech rounded ${rightPanelState === "whiteboard" ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <PenTool className="h-3.5 w-3.5 mr-1.5" />
                Canvas
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelState("source")}
                className={`h-7 px-2.5 text-xs font-mono-tech rounded ${rightPanelState === "source" ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Document
              </Button>
            </div>
          )}

          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 text-xs font-semibold h-8 rounded-md px-3 font-mono-tech shadow-xs" 
            onClick={handleEndSession} 
            disabled={isTyping}
          >
            End & Grade
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">

        {/* LEFT PANEL: Chat Feed */}
        <div 
          style={interviewMode === "case" ? { "--chat-width": `${chatWidth}%` } as React.CSSProperties : {}}
          className={`flex flex-col min-w-[320px] shrink-0 relative z-10 transition-all duration-300 w-full md:w-[var(--chat-width,auto)] bg-card border-r border-border ${
            mobileView !== "chat" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Custom Drag Handle (Case Mode Desktop) */}
          {interviewMode === "case" && (
            <div 
              className="hidden md:flex absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize z-50 items-center justify-center group"
              onMouseDown={() => setIsDragging(true)}
              title="Drag to resize panels"
            >
              <div className="h-12 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
            </div>
          )}
          
          {/* Scrollable Chat Feed */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth custom-scrollbar" ref={scrollRef}>
            <div className="space-y-6 max-w-2xl mx-auto pb-4">
              {sessionLoadError ? (
                <div className="flex h-full items-center justify-center pt-20 text-center">
                  <div className="space-y-3 text-destructive font-mono-tech text-xs">
                    <p>{sessionLoadError}</p>
                    <Button variant="outline" size="sm" onClick={() => router.push("/history")}>Back to History</Button>
                  </div>
                </div>
              ) : messages.length === 0 && !showSetupModal && (
                <div className="flex h-full items-center justify-center pt-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground font-mono-tech text-xs">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>INITIALIZING CEREBRAS PARTNER ENGINE...</p>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className="flex gap-3.5 group animate-in fade-in duration-200">
                  
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {msg.role === "assistant" ? (
                      <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    ) : msg.role === "system" ? (
                      <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Lightbulb className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-tech font-semibold text-foreground">
                        {msg.role === "assistant" ? "Partner Interviewer" : msg.role === "system" ? "System Hint" : "Candidate"}
                      </span>
                    </div>

                    {msg.role === "assistant" || msg.role === "system" ? (
                      <div className={`text-xs sm:text-sm leading-relaxed ${
                        msg.role === "system" 
                          ? "text-amber-700 dark:text-amber-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 font-mono-tech" 
                          : "text-foreground font-sans"
                      }`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground/90 font-sans">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3.5 items-center font-mono-tech text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Synthesizing partner response...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Omnibar */}
          <div className="shrink-0 p-4 border-t border-border bg-card/60">
            <div className="max-w-2xl mx-auto space-y-2">
              
              {/* In-Chat Paywall Notice */}
              {isPaywallLocked && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono-tech space-y-2.5 mb-2 shadow-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Lock className="h-4 w-4" /> TRIAL PREVIEW COMPLETED (4 QUESTIONS)
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-background/80 border border-border px-2 py-0.5 rounded">
                      Free Preview
                    </span>
                  </div>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                    You have completed your 4 free trial questions. Unlock the full 45-minute simulation with live partner pushbacks, dynamic technical follow-ups, and receive your comprehensive candidate scorecard.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button 
                      size="sm" 
                      onClick={() => setPaywallOpen(true)} 
                      className="h-8 text-xs font-bold bg-primary text-primary-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" /> Unlock Full Simulation & Scorecard →
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleEndSession} 
                      className="h-8 text-xs border-border"
                    >
                      End & Generate Preview Scorecard
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-mono-tech uppercase tracking-wider text-muted-foreground">Candidate Turn</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-[10px] font-mono-tech text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  onClick={handleGetHint}
                  disabled={isTyping || messages.length === 0 || isPaywallLocked}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Request Hint
                </Button>
              </div>

              <div className={`flex items-center gap-2 p-1.5 rounded-lg bg-background border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 ${isPaywallLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded shrink-0 ${isListening ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={toggleListening}
                  title={isListening ? "Stop Dictation" : "Start Voice Input"}
                  disabled={isPaywallLocked}
                >
                  <Mic className="h-4 w-4" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel()
                    setTtsEnabled(!ttsEnabled)
                  }}
                  className={`h-8 w-8 rounded shrink-0 ${ttsEnabled ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  title={ttsEnabled ? "Disable Voice Output" : "Enable Voice Output"}
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
                </Button>

                <textarea 
                  placeholder={isPaywallLocked ? "Trial completed. Unlock full session to continue..." : isListening ? "Listening to your dictation..." : "Speak or type your logical structuring..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 border-0 bg-transparent focus-visible:outline-none px-2 py-1.5 text-xs sm:text-sm placeholder:text-muted-foreground text-foreground font-sans resize-none min-h-[36px] max-h-[120px]"
                  disabled={isTyping || isPaywallLocked}
                  rows={1}
                />

                <Button 
                  onClick={handleSendMessage} 
                  disabled={isTyping || !inputValue.trim() || isPaywallLocked} 
                  size="icon"
                  className="h-8 w-8 rounded bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Excalidraw Whiteboard & PDF Source */}
        {interviewMode === "case" && (
          <div className={`flex-1 flex-col bg-muted/20 relative z-0 overflow-hidden ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}>
            {rightPanelState === "whiteboard" || mobileView === "canvas" ? (
              <div className="absolute inset-0">
                <ExcalidrawWrapper />
              </div>
            ) : (
              <div className="h-full w-full relative">
                {caseSource ? (
                  <iframe 
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/casebooks/${encodeURIComponent(caseSource)}#page=${pageNumber}`} 
                    className="w-full h-full border-0 bg-background"
                    title="Source PDF"
                  />
                ) : caseContext ? (
                  <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <ReactMarkdown>{caseContext}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-mono-tech text-muted-foreground">
                    No source document attached for this case.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">INITIALIZING INTERVIEW ENGINE...</div>}>
      <InterviewEngine />
    </Suspense>
  )
}
