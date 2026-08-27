"use client"

import { useState } from "react"
import { MessageSquare, Send, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth-store"

interface FeedbackButtonProps {
  label?: string
  context?: string
  variant?: "outline" | "default" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function FeedbackButton({
  label = "Share Feedback",
  context,
  variant = "outline",
  size = "sm",
  className = "",
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { user, isGuest } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const formattedMessage = context ? `[${context}] ${message.trim()}` : message.trim()

      const response = await fetch(`${API_URL}/gratitude/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || (isGuest ? "Anonymous Student" : user?.email?.split("@")[0] || "Anonymous"),
          message: formattedMessage,
          user_id: isGuest ? "guest" : user?.id,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
          setMessage("")
        }, 2000)
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        className={`inline-flex items-center justify-center rounded-lg text-xs font-mono-tech font-medium transition-colors border border-border bg-card hover:bg-muted text-foreground h-8 px-3 shadow-xs gap-2 cursor-pointer hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
      >
        <MessageSquare className="h-3.5 w-3.5 text-primary" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border border-border text-foreground rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-mono-tech text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" />
            Platform & Rubric Feedback
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-sans">
            Help us calibrate placement benchmarks and enhance simulation realism. Your feedback is directly reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        {context && (
          <div className="text-[10px] font-mono-tech px-2.5 py-1 rounded bg-muted/40 text-muted-foreground border border-border w-fit">
            Context: <span className="text-foreground font-semibold">{context}</span>
          </div>
        )}

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in duration-300">
            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-1 border border-emerald-500/20">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground font-mono-tech">Thank You for Your Feedback</h3>
            <p className="text-muted-foreground text-xs font-sans max-w-xs">
              Your notes have been recorded and will help us refine evaluation precision.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="feedback-name" className="text-xs font-mono-tech text-muted-foreground">
                Your Name / Roll No (Optional)
              </Label>
              <Input
                id="feedback-name"
                placeholder={isGuest ? "Anonymous Student" : user?.email?.split("@")[0] || "Name (Optional)"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl font-mono-tech text-xs bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-message" className="text-xs font-mono-tech text-muted-foreground">
                Feedback, Bug Report, or Benchmark Suggestions *
              </Label>
              <Textarea
                id="feedback-message"
                placeholder="How was the simulation or analysis? Any metric, question, or feature recommendations?"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="rounded-xl resize-none text-xs font-sans bg-background border-border"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-mono-tech text-xs font-semibold gap-2 h-9"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? "Submitting..." : "Send Feedback"}
              {!isSubmitting && <Send className="h-3.5 w-3.5" />}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Backwards compatibility alias: renders FeedbackButton without any personal name/badge
export function CreatorBadge(props: FeedbackButtonProps) {
  return <FeedbackButton {...props} />
}
