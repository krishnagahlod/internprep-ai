"use client"

import { useState } from "react"
import { Heart, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth-store"

export function CreatorBadge() {
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
      const response = await fetch(`${API_URL}/gratitude/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || (isGuest ? "Anonymous Guest" : user?.email?.split('@')[0] || "Anonymous"),
          message: message.trim(),
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
      console.error("Error submitting gratitude:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center mt-12 mb-8 space-y-4">
      <div className="flex items-center text-sm text-muted-foreground font-medium bg-secondary/50 px-4 py-2 rounded-full border border-border">
        <span>Created by </span>
        <span className="text-foreground ml-1 font-semibold">Krishna Gahlod (23B0373)</span>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-full shadow-sm hover:shadow-md gap-2 group">
            <Heart className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
            Share Feedback or Gratitude
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Support the Creator
            </DialogTitle>
            <DialogDescription>
              Found this platform helpful? I'd love to hear your feedback or a simple thank you! It helps me keep improving it.
            </DialogDescription>
          </DialogHeader>
          
          {submitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in duration-300">
              <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Thank you so much!</h3>
              <p className="text-muted-foreground text-sm">Your message means a lot to me.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name (Optional)</Label>
                <Input 
                  id="name" 
                  placeholder={isGuest ? "Fellow IITian" : user?.email?.split('@')[0] || "Name"} 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="How did this platform help you? Any suggestions?" 
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="rounded-xl resize-none"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                {!isSubmitting && <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
