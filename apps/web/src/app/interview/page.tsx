"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Mic, Send, PenTool, ArrowLeft, Loader2, Volume2, VolumeX, Lightbulb, FileText, Bot, User, Play, Clock, CheckCircle2, ExternalLink } from "lucide-react"
import ReactMarkdown from "react-markdown"
import dynamic from "next/dynamic"
import { PaywallModal } from "@/components/paywall-modal"

// Dynamically import Excalidraw to prevent SSR hydration errors
const ExcalidrawWrapper = dynamic(
  () => import("@/components/ExcalidrawWrapper"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[#000000]"><Loader2 className="h-4 w-4 animate-spin text-white/50" /></div> }
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
  const { targetCompany, currentSessionId, currentPhase, setCurrentSessionId, setCurrentPhase, isGuest, guestInterviewCount, incrementGuestInterview, user } = useAuthStore()
  
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

  // Wait for auth to initialize before rendering
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(true)
  const [isInitializingSession, setIsInitializingSession] = useState(false)
  const [selectedCaseType, setSelectedCaseType] = useState("Random")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [interviewMode, setInterviewMode] = useState<"case" | "domain">("case")
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
             console.error("Failed to fetch session from API")
          }
        } catch (e) {
          setSessionLoadError("Connection error while loading session. Please ensure the backend is running.")
          console.error("Failed to resume session", e)
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const response = await fetch(`${API_URL}/interview/start_case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_type: selectedCaseType,
          user_id: user?.id
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
            setInputValue((prev) => prev + (prev ? " " : "") + finalTranscript)
          }
        }
        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  // STRICT AUTO-SCROLL LOGIC
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSessionId || "temp_session_id",
          messages: messages,
          current_phase: currentPhase,
          scratchpad: "", // Not sending scratchpad text
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
    if (!inputValue.trim()) return

    if (window.speechSynthesis) window.speechSynthesis.cancel()

    const newMessages = [...messages, { role: "user" as const, content: inputValue }]
    setMessages(newMessages)
    setInputValue("")
    setIsTyping(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          resume_context: interviewMode === "domain" ? caseContext : undefined
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch response")

      const data = await response.json()
      
      setMessages([...newMessages, { role: "assistant", content: data.response }])
      
      if (ttsEnabled) {
        speakResponse(data.response)
      }
      
      if (data.new_phase) {
        setCurrentPhase(data.new_phase)
      }

      if (data.is_paywall_locked) {
        setPaywallMeta({
          title: "Trial Preview Completed • Unlock Full Mock Interview",
          description: "You've completed the 4-question trial preview! Unlock the full 45-minute technical session, dynamic follow-ups, and dimensional AI scorecard with rubrics.",
          featureKey: "mock_interview"
        })
        setPaywallOpen(true)
      }

    } catch (error) {
      console.error(error)
      setMessages([...newMessages, { role: "system", content: "Error: Connection lost. Please try again." }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-slate-500">Restoring interview session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-neutral-200 font-sans antialiased selection:bg-primary/20 ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200/20 dark:border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 font-outfit">Interview Setup</h2>
            <p className="text-muted-foreground text-center mb-8">Select the type of case you want to practice.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-semibold mb-2 block">Case Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {caseTypes.map(type => (
                    <Button
                      key={type}
                      variant={selectedCaseType === type ? "default" : "outline"}
                      className={`justify-start ${selectedCaseType === type ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-neutral-900' : ''}`}
                      onClick={() => setSelectedCaseType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <Button onClick={handleStartCase} className="w-full h-12 text-base font-bold shadow-lg hover:-translate-y-0.5 transition-all">
              <Play className="h-5 w-5 mr-2" /> Start Mock Interview
            </Button>
          </div>
        </div>
      )}

      <header className="flex h-14 items-center justify-between border-b border-slate-200/70 dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl px-6 shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
             if (window.speechSynthesis) window.speechSynthesis.cancel()
             router.push("/dashboard")
          }} className="text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all duration-300 rounded-lg h-9 px-3">
            <ArrowLeft className="h-4 w-4 mr-2" /> Save & Exit
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700" />
          
          {/* Phase Progress Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            {(interviewMode === "domain" ? DOMAIN_PHASES : PHASES).map((phase, idx, arr) => {
              const isActive = currentPhase === phase.id
              const phaseIndex = arr.findIndex(p => p.id === currentPhase)
              const isPast = idx < phaseIndex
              
              return (
                <div key={phase.id} className="flex items-center">
                  <div className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full transition-all duration-500 flex items-center ${isActive ? 'bg-primary text-primary-foreground shadow-sm scale-105' : isPast ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500'}`}>
                    {isPast && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {phase.label}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-3 h-px mx-1 ${isPast ? 'bg-emerald-500/30' : 'bg-slate-200 dark:bg-neutral-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Timer & Pause */}
          <div className="hidden md:flex items-center text-slate-600 dark:text-neutral-400 font-mono text-sm font-semibold bg-slate-100 dark:bg-neutral-800 rounded-md border border-slate-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-3 py-1.5 flex items-center border-r border-slate-200 dark:border-neutral-700">
              <Clock className="h-4 w-4 mr-2 opacity-70" />
              {formatTime(elapsedSeconds)}
            </div>
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)} 
              className="px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors flex items-center"
              title={isTimerRunning ? "Pause Interview" : "Resume Interview"}
            >
              {isTimerRunning ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />
          <ThemeToggle />
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />
          
          {interviewMode === "case" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelState("whiteboard")}
                className={`font-semibold text-xs tracking-wide transition-all duration-300 h-9 px-4 rounded-lg ${rightPanelState === "whiteboard" ? 'text-primary bg-primary/10 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Canvas
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelState("source")}
                className={`font-semibold text-xs tracking-wide transition-all duration-300 h-9 px-4 rounded-lg ${rightPanelState === "source" ? 'text-primary bg-primary/10 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Document
              </Button>

              <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />
            </>
          )}

          {interviewMode === "domain" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResumePanel(!showResumePanel)}
                className={`font-semibold text-xs tracking-wide transition-all duration-300 h-9 px-4 rounded-lg ${showResumePanel ? 'text-primary bg-primary/10 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Resume
              </Button>

              <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />
            </>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />
          
          <Button size="sm" className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-neutral-900 text-xs font-semibold h-9 rounded-lg px-5 ml-2 transition-all duration-300 shadow-sm hover:shadow-md" onClick={handleEndSession} disabled={isTyping}>
            Finish & Feedback
          </Button>
        </div>
      </header>

      {/* 
        MAIN BENTO GRID LAYOUT 
        min-h-0 is absolutely critical here. It prevents flex children from expanding past their parent.
      */}
      <div className={`flex flex-1 overflow-hidden min-h-0 relative ${interviewMode === "domain" ? "justify-center bg-slate-50 dark:bg-[#0a0a0a]" : ""}`}>

        {/* Domain AI Visualizer Background */}
        {interviewMode === "domain" && (
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none flex justify-center pt-12 z-0">
            <div className={`w-40 h-40 rounded-full blur-3xl transition-all duration-1000 ${isSpeaking ? 'bg-primary/30 scale-150 animate-pulse' : 'bg-primary/10 scale-100'}`} />
          </div>
        )}

        {/* LEFT PANEL: CO-PILOT CHAT SIDEBAR / MAIN DOMAIN CHAT */}
        <div 
          style={interviewMode === "case" ? { "--chat-width": `${chatWidth}%` } as React.CSSProperties : {}}
          className={`flex flex-col min-w-[320px] shrink-0 relative z-10 transition-all duration-500 w-full md:w-[var(--chat-width,auto)]
            ${interviewMode === "domain" 
              ? `w-full flex-1 max-w-5xl mx-auto bg-transparent border-none`
              : 'bg-white dark:bg-neutral-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-200/70 dark:border-neutral-800/70'
            }`}
        >
          {/* Custom Drag Handle (Only for Case mode) */}
          {interviewMode === "case" && (
            <div 
              className="absolute -right-3 top-0 bottom-0 w-6 cursor-col-resize z-50 flex items-center justify-center group"
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="h-16 w-1.5 rounded-full bg-slate-200/50 dark:bg-neutral-700/50 group-hover:bg-primary/40 transition-colors duration-300" />
            </div>
          )}
          
          {/* Strict overflow-y-auto ensures ONLY the chat feed scrolls */}
          <div className="flex-1 overflow-y-auto px-8 py-8 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={scrollRef}>
            <div className="space-y-10 pb-6">
              {sessionLoadError ? (
                <div className="flex h-full items-center justify-center pt-32">
                  <div className="flex flex-col items-center gap-4 text-red-500">
                    <p className="text-sm font-medium">{sessionLoadError}</p>
                    <Button variant="outline" onClick={() => router.push("/history")}>Go Back</Button>
                  </div>
                </div>
              ) : messages.length === 0 && !showSetupModal && (
                <div className="flex h-full items-center justify-center pt-32">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                    <p className="text-sm font-medium">Initializing session...</p>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-5 group animate-in slide-in-from-bottom-2 fade-in duration-500 ${interviewMode === "domain" ? 'bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-neutral-800/40 shadow-sm' : ''}`}>
                  
                  {/* Elegant Avatar */}
                  <div className="shrink-0 mt-1">
                    {msg.role === "assistant" ? (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-900 border border-slate-200/60 dark:border-neutral-700/60 flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4 text-slate-700 dark:text-neutral-300" />
                      </div>
                    ) : msg.role === "system" ? (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border border-amber-200/60 dark:border-amber-700/60 flex items-center justify-center shadow-sm">
                        <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center shadow-sm">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Flowing Typography Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-neutral-100">
                        {msg.role === "assistant" ? "Interviewer" : msg.role === "system" ? "System Hint" : "You"}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.role === "system" ? "Internal" : "Just now"}
                      </span>
                    </div>

                    {msg.role === "assistant" || msg.role === "system" ? (
                      <div className={`prose max-w-none prose-p:leading-relaxed prose-li:my-1.5 text-[15px] ${msg.role === "system" ? "text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-900/30" : "text-slate-700 dark:text-neutral-200 font-normal tracking-tight"}`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-neutral-200 font-normal tracking-tight">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-5 animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <div className="shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-900 border border-slate-200/60 dark:border-neutral-700/60 flex items-center justify-center shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-slate-400 font-medium tracking-wide">
                    Synthesizing response<span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* PREMIUM FLOATING OMNIBAR */}
          <div className={`shrink-0 relative z-20 ${interviewMode === "domain" ? 'bg-transparent p-6 pb-8' : 'p-6 bg-gradient-to-t from-white via-white dark:from-neutral-900 dark:via-neutral-900 to-white/80 dark:to-neutral-900/80 border-t border-slate-200/50 dark:border-neutral-800/50'}`}>
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-neutral-400 uppercase">Input</span>
              {interviewMode === "case" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-3 text-[11px] font-bold tracking-widest text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all duration-300 uppercase rounded-full"
                  onClick={handleGetHint}
                  disabled={isTyping || messages.length === 0}
                >
                  <Lightbulb className="h-3 w-3 mr-1.5" />
                  Request Hint
                </Button>
              )}
            </div>

            <div className={`flex gap-2 transition-all duration-300 w-full shadow-lg ${interviewMode === "domain" ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/50 dark:border-neutral-800 rounded-3xl p-2' : 'p-1.5 bg-white dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800 rounded-2xl focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10'}`}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`shrink-0 rounded-xl h-11 w-11 transition-all duration-300 ${isListening ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
                onClick={toggleListening}
                title={isListening ? "Stop Dictation" : "Start Voice Dictation"}
              >
                <div className="relative flex items-center justify-center">
                  <Mic className="h-5 w-5" />
                  {isListening && <span className="absolute -inset-1 rounded-full border-2 border-red-500/30 animate-ping opacity-100" />}
                </div>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel()
                  setTtsEnabled(!ttsEnabled)
                }}
                className={`shrink-0 rounded-xl h-11 w-11 transition-all duration-300 ${ttsEnabled ? 'bg-primary/10 text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
                title={ttsEnabled ? "Disable Voice Output" : "Enable Voice Output"}
              >
                {ttsEnabled ? <Volume2 className={`h-5 w-5 ${isSpeaking ? 'animate-pulse' : ''}`} /> : <VolumeX className="h-5 w-5 opacity-70" />}
              </Button>
              <textarea 
                placeholder={isListening ? "Listening..." : "Message your interviewer..."}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  // Auto-expand logic
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                    e.currentTarget.style.height = 'auto'; // reset height on send
                  }
                }}
                className="flex-1 border-0 bg-transparent focus-visible:outline-none px-3 py-3 text-[15px] shadow-none placeholder:text-slate-400 dark:placeholder:text-neutral-400 text-slate-800 dark:text-neutral-100 font-medium resize-none min-h-[44px] max-h-[200px]"
                disabled={isTyping}
                rows={1}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isTyping || !inputValue.trim()} 
                size="icon"
                className="shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 h-11 w-11 disabled:opacity-30 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* DOMAIN RESUME PANEL */}
        {interviewMode === "domain" && showResumePanel && (
          <div className="hidden md:flex w-[500px] shrink-0 bg-white dark:bg-neutral-900 shadow-2xl border-l border-slate-200 dark:border-neutral-800 z-30 animate-in slide-in-from-right duration-300 flex-col relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800">
              <h3 className="font-semibold text-sm">Your Resume</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowResumePanel(false)} className="h-8 w-8 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </Button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {caseSource ? (
                <iframe 
                  src={caseSource.startsWith('http') ? caseSource : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/casebooks/${encodeURIComponent(caseSource)}`} 
                  className="w-full h-full border-0 bg-white dark:bg-neutral-900"
                  title="Candidate Resume"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FileText className="h-10 w-10 opacity-20 mb-4" />
                  <span className="font-semibold text-sm">Resume not available</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT PANEL: HERO CANVAS (Only for Case Mode) */}
        {interviewMode === "case" && (
          <div className="hidden md:flex flex-1 flex-col bg-slate-50/50 dark:bg-neutral-950/50 relative z-0 overflow-hidden">
            {rightPanelState === "whiteboard" ? (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <ExcalidrawWrapper />
              </div>
            ) : (
            <div className="h-full w-full relative animate-in fade-in duration-500">
              {caseSource ? (
                <div className="w-full h-full relative">
                  <div className="absolute top-4 right-8 z-50">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="shadow-md bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black border border-slate-200 dark:border-neutral-800"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/casebooks/${encodeURIComponent(caseSource)}`, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open PDF in New Tab
                    </Button>
                  </div>
                  <iframe 
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/casebooks/${encodeURIComponent(caseSource)}#page=${pageNumber}`} 
                    className="w-full h-full border-0 relative z-10 bg-white dark:bg-neutral-900"
                    title="Source PDF"
                  />
                </div>
              ) : caseContext ? (
                <div className="h-full overflow-y-auto p-12 lg:p-16">
                  <div className="prose prose-slate dark:prose-invert max-w-3xl mx-auto prose-headings:font-bold prose-headings:tracking-tight prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed text-[15px]">
                    <ReactMarkdown>{caseContext}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin opacity-20 mb-4" />
                  <span className="font-semibold text-sm tracking-widest uppercase">Awaiting Context</span>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title={paywallMeta.title}
        description={paywallMeta.description}
        featureKey={paywallMeta.featureKey}
        limit={paywallMeta.limit}
        used={paywallMeta.used}
        resetAt={paywallMeta.resetAt}
      />
    </div>
  )
}

export default function InterviewEnginePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    }>
      <InterviewEngine />
    </Suspense>
  )
}
