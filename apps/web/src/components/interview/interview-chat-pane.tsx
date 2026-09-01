"use client";

import React from "react";
import { Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message } from "./types";

interface InterviewChatPaneProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function InterviewChatPane({
  messages,
  isTyping,
  messagesEndRef,
}: InterviewChatPaneProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
      {messages.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground font-display">
            AI Interview Coach Initialized
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed">
            Your interviewer is calibrating the case context. Ask clarifying questions or propose your initial structure.
          </p>
        </div>
      )}

      {messages.map((msg, index) => {
        const isBot = msg.role === "assistant";
        return (
          <div
            key={index}
            className={`flex gap-3 text-sm leading-relaxed ${
              isBot ? "items-start" : "items-start flex-row-reverse"
            }`}
          >
            {/* Avatar */}
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isBot
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/10 border-primary/30 text-primary"
              }`}
            >
              {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                isBot
                  ? "bg-card border border-border text-foreground"
                  : "bg-primary text-primary-foreground font-medium"
              }`}
            >
              {isBot ? (
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-xs sm:text-sm">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Streaming Typewriter Indicator */}
      {isTyping && (
        <div className="flex items-center gap-2 text-xs font-mono-tech text-muted-foreground pl-1">
          <Bot className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>Interviewer is formulating response...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
