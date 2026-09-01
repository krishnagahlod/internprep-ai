"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeProbingChatProps {
  resumeId?: string;
  initialQuestion?: string;
}

export function ResumeProbingChat({
  resumeId,
  initialQuestion = "Can you walk me through the specific impact of your primary project bullet?",
}: ResumeProbingChatProps) {
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    { role: "assistant", content: initialQuestion },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    const newMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/resume/probe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeId,
          messages: newMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Good point. How did you specifically measure that metric compared to baseline?",
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Understood. How would you justify your personal contribution versus the broader team?",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <MessageSquare className="h-4 w-4 text-emerald-500" />
        <h3 className="text-xs font-mono-tech font-bold uppercase tracking-wider text-foreground">
          Interactive Claim Defense Simulator
        </h3>
      </div>

      <div className="h-64 overflow-y-auto space-y-3 p-2 custom-scrollbar">
        {messages.map((m, i) => {
          const isBot = m.role === "assistant";
          return (
            <div
              key={i}
              className={`flex gap-2.5 text-xs ${isBot ? "items-start" : "items-start flex-row-reverse"}`}
            >
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 border ${
                  isBot
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-primary/10 border-primary/30 text-primary"
                }`}
              >
                {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  isBot
                    ? "bg-muted/50 border border-border text-foreground"
                    : "bg-primary text-primary-foreground font-medium"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
            <span>Interviewer is probing your response...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Defend your claim or elaborate on specifics..."
          className="flex-1 rounded-xl bg-background border border-border px-3.5 py-2 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        />
        <Button
          size="sm"
          disabled={!inputValue.trim() || isTyping}
          onClick={handleSendMessage}
          className="rounded-xl font-mono-tech text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
