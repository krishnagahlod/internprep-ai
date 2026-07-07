"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GratitudeMessage {
  id: string
  name: string
  message: string
  created_at: string
}

export default function CreatorDashboardPage() {
  const [messages, setMessages] = useState<GratitudeMessage[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(`${API_URL}/gratitude/`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (error) {
        console.error("Failed to fetch gratitude messages", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden selection:bg-rose-500/20 selection:text-rose-500">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-400/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto z-10 relative">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-outfit tracking-tight text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground">Messages of gratitude and feedback from the community.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card dark:bg-neutral-900/40 p-6 rounded-2xl animate-pulse h-32" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="glass-card dark:bg-neutral-900/40 rounded-3xl p-12 text-center flex flex-col items-center">
            <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">When users submit feedback or gratitude, it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messages.map(msg => (
              <div key={msg.id} className="glass-card dark:bg-neutral-900/40 p-6 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div>
                  <p className="text-base text-foreground leading-relaxed mb-4">"{msg.message}"</p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                  <span className="font-semibold text-rose-500 dark:text-rose-400">
                    — {msg.name || "Anonymous"}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
