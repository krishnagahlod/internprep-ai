"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Mic, Send, PenTool, ArrowLeft, Loader2, Volume2, VolumeX, Lightbulb, FileText, Bot, User, Play, Clock, CheckCircle2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import dynamic from "next/dynamic"

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

export default function InterviewEnginePage() {
  const router = useRouter()
  const { targetCompany, currentSessionId, currentPhase, setCurrentSessionId, setCurrentPhase } = useAuthStore()
  
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
  
  // New State
  const [showSetupModal, setShowSetupModal] = useState(true)
  const [selectedCaseType, setSelectedCaseType] = useState("Random")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

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
    setShowSetupModal(false)
    setIsTyping(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_URL}/interview/start_case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_type: selectedCaseType
        })
      })
      if (response.ok) {
        const data = await response.json()
        setCaseContext(data.case_context)
        setCaseSource(data.case_source)
        if (data.page_number) setPageNumber(data.page_number)
        setMessages([{ role: "assistant", content: data.initial_message }])
        setCurrentSessionId(data.session_id)
        setCurrentPhase(data.initial_phase)
        setIsTimerRunning(true)
      } else {
        setMessages([{ role: "assistant", content: "Hello! I'll be your interviewer today. Are you ready to begin the case?" }])
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
          case_context: caseContext
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
          scratchpad: "", // Not extracting canvas text as requested
          case_context: caseContext
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
            <ArrowLeft className="h-4 w-4 mr-2" /> Exit
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700" />
          
          {/* Phase Progress Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            {PHASES.map((phase, idx) => {
              const isActive = currentPhase === phase.id
              const phaseIndex = PHASES.findIndex(p => p.id === currentPhase)
              const isPast = idx < phaseIndex
              
              return (
                <div key={phase.id} className="flex items-center">
                  <div className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full transition-all duration-500 flex items-center ${isActive ? 'bg-primary text-primary-foreground shadow-sm scale-105' : isPast ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500'}`}>
                    {isPast && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {phase.label}
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className={`w-3 h-px mx-1 ${isPast ? 'bg-emerald-500/30' : 'bg-slate-200 dark:bg-neutral-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="hidden md:flex items-center mr-4 text-slate-600 dark:text-neutral-400 font-mono text-sm font-semibold bg-slate-100 dark:bg-neutral-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700">
            <Clock className="h-4 w-4 mr-2 opacity-70" />
            {formatTime(elapsedSeconds)}
          </div>

          <ThemeToggle />
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />
          
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

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel()
              setTtsEnabled(!ttsEnabled)
            }}
            className={`transition-all duration-300 h-9 w-9 p-0 rounded-full flex items-center justify-center ${ttsEnabled ? 'text-primary bg-primary/10' : 'text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
          >
            {ttsEnabled ? <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse text-primary' : ''}`} /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button size="sm" className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-neutral-900 text-xs font-semibold h-9 rounded-lg px-5 ml-2 transition-all duration-300 shadow-sm hover:shadow-md" onClick={handleEndSession} disabled={isTyping}>
            End Session
          </Button>
        </div>
      </header>

      {/* 
        MAIN BENTO GRID LAYOUT 
        min-h-0 is absolutely critical here. It prevents flex children from expanding past their parent.
      */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT PANEL: CO-PILOT CHAT SIDEBAR */}
        <div 
          style={{ width: `${chatWidth}%` }}
          className="flex flex-col min-w-[320px] border-r border-slate-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 shrink-0 relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10"
        >
          {/* Custom Drag Handle */}
          <div 
            className="absolute -right-3 top-0 bottom-0 w-6 cursor-col-resize z-50 flex items-center justify-center group"
            onMouseDown={() => setIsDragging(true)}
          >
            <div className="h-16 w-1.5 rounded-full bg-slate-200/50 dark:bg-neutral-700/50 group-hover:bg-primary/40 transition-colors duration-300" />
          </div>
          
          {/* Strict overflow-y-auto ensures ONLY the chat feed scrolls */}
          <div className="flex-1 overflow-y-auto px-8 py-8 scroll-smooth" ref={scrollRef}>
            <div className="space-y-10 pb-6">
              {messages.length === 0 && !showSetupModal && (
                <div className="flex h-full items-center justify-center pt-32">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                    <p className="text-sm font-medium">Initializing session...</p>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className="flex gap-5 group animate-in slide-in-from-bottom-2 fade-in duration-500">
                  
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
          <div className="shrink-0 p-6 bg-gradient-to-t from-white via-white dark:from-neutral-900 dark:via-neutral-900 to-white/80 dark:to-neutral-900/80 border-t border-slate-200/50 dark:border-neutral-800/50 relative z-20">
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-neutral-400 uppercase">Input</span>
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
            </div>

            <div className="flex gap-2 p-1.5 bg-white dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800 rounded-2xl focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 w-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`shrink-0 rounded-xl h-11 w-11 transition-all duration-300 ${isListening ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
                onClick={toggleListening}
                title={isListening ? "Stop Dictation" : "Start Voice Dictation"}
              >
                <div className="relative flex items-center justify-center">
                  <Mic className="h-5 w-5" />
                  {isListening && <span className="absolute -inset-1 rounded-full border-2 border-red-500/30 animate-ping opacity-100" />}
                </div>
              </Button>
              <Input 
                placeholder={isListening ? "Listening..." : "Message your interviewer..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-3 text-[15px] shadow-none placeholder:text-slate-400 dark:placeholder:text-neutral-400 text-slate-800 dark:text-neutral-100 h-11 font-medium"
                disabled={isTyping}
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

        {/* RIGHT PANEL: HERO CANVAS */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-neutral-950/50 relative z-0 overflow-hidden">
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
      </div>
    </div>
  )
}
