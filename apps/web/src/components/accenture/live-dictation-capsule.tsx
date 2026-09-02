"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, X, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveDictationCapsuleProps {
  isListening: boolean;
  interimTranscript: string;
  confirmedText: string;
  onSend: () => void;
  onClear: () => void;
  onStop: () => void;
}

export function LiveDictationCapsule({
  isListening,
  interimTranscript,
  confirmedText,
  onSend,
  onClear,
  onStop,
}: LiveDictationCapsuleProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [isListening]);

  if (!isListening && !interimTranscript) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="mb-2 p-3 sm:p-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-emerald-500/40 shadow-xl ring-1 ring-emerald-500/20"
      >
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono-tech font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Live Dictation Active{dots}
            </span>

            {/* Pulsing Soundwave Frequency Bars */}
            <div className="flex items-center gap-0.5 ml-1">
              {[40, 75, 100, 60, 90, 45, 80].map((height, i) => (
                <motion.span
                  key={i}
                  animate={{
                    height: isListening ? [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`] : "20%",
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6 + i * 0.1,
                    ease: "easeInOut",
                  }}
                  className="w-1 bg-emerald-500/80 rounded-full h-3 inline-block"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 px-2 text-[10px] font-mono-tech text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
            >
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSend}
              disabled={!confirmedText.trim() && !interimTranscript.trim()}
              className="h-7 px-2.5 text-[11px] font-mono-tech font-bold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Send className="h-3 w-3" /> Send Answer
            </Button>
          </div>
        </div>

        {/* Live Word-by-Word Stream Display */}
        <div className="pt-2.5 max-h-24 overflow-y-auto custom-scrollbar text-xs leading-relaxed font-sans">
          {confirmedText && <span className="text-foreground">{confirmedText} </span>}
          {interimTranscript && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
              {interimTranscript}
            </span>
          )}
          {!confirmedText && !interimTranscript && (
            <span className="text-muted-foreground italic text-[11px]">
              Listening to your response... Speak clearly into your microphone.
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
