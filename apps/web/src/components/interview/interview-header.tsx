"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Volume2, VolumeX, Mic, PenTool, BookOpen, FileText, Bot, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { VoiceWaveform } from "@/components/ui/voice-waveform";
import { InterviewMode, RightPanelState } from "./types";

interface InterviewHeaderProps {
  interviewMode: InterviewMode;
  targetCompany?: string | null;
  elapsedSeconds: number;
  isListening: boolean;
  ttsEnabled: boolean;
  isSpeaking?: boolean;
  rightPanelState?: RightPanelState;
  onPanelStateChange?: (state: RightPanelState) => void;
  hasResume?: boolean;
  pageNumber?: number;
  onToggleDrawer?: () => void;
  onToggleTts: () => void;
  onEndInterview: () => void;
}

export function InterviewHeader({
  interviewMode,
  targetCompany,
  elapsedSeconds,
  isListening,
  ttsEnabled,
  isSpeaking = false,
  rightPanelState = "whiteboard",
  onPanelStateChange,
  hasResume = false,
  pageNumber,
  onToggleDrawer,
  onToggleTts,
  onEndInterview,
}: InterviewHeaderProps) {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 gap-2">
      {/* Left: Back & Mode Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <span className="text-muted-foreground/40 font-mono-tech text-xs">/</span>
        <Badge
          variant="outline"
          className="text-[10px] font-mono-tech font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        >
          {interviewMode === "case"
            ? "[CASE INTERVIEW SIMULATOR]"
            : targetCompany
            ? `[${targetCompany.toUpperCase()} PREP]`
            : "[FULL DOMAIN INTERVIEW]"}
        </Badge>
      </div>

      {/* Center: Desktop Workspace Panel Switcher */}
      {onPanelStateChange && (
        <div className="hidden md:flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onPanelStateChange("whiteboard")}
            className={`px-3 py-1 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 cursor-pointer ${
              rightPanelState === "whiteboard"
                ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenTool className="h-3.5 w-3.5 text-emerald-500" />
            <span>Whiteboard</span>
          </button>
          
          <button
            type="button"
            onClick={() => onPanelStateChange("source")}
            className={`px-3 py-1 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 cursor-pointer ${
              rightPanelState === "source"
                ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            <span>Case Document</span>
            {pageNumber ? (
              <span className="text-[10px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                p.{pageNumber}
              </span>
            ) : null}
          </button>

          {hasResume && (
            <button
              type="button"
              onClick={() => onPanelStateChange("resume")}
              className={`px-3 py-1 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 cursor-pointer ${
                rightPanelState === "resume"
                  ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-purple-500" />
              <span>Resume</span>
            </button>
          )}
        </div>
      )}

      {/* Center/Right: Timer, Audio Controls, Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Active Audio Recording Indicator */}
        {isListening && (
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-in fade-in">
            <Mic className="h-3 w-3 text-emerald-500 animate-pulse" />
            <VoiceWaveform active={true} color="bg-emerald-500" barCount={4} />
          </div>
        )}

        {/* AI Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono-tech animate-in fade-in">
            <Bot className="h-3.5 w-3.5 animate-pulse text-blue-500" />
            <span className="hidden xl:inline text-[11px] font-bold">Speaking</span>
            <VoiceWaveform active={true} color="bg-blue-500" barCount={4} />
          </div>
        )}

        {/* Elapsed Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs font-mono-tech font-bold text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>

        {/* Notes/Scratchpad Drawer Toggle */}
        {onToggleDrawer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDrawer}
            className="h-8 px-2.5 text-xs font-mono-tech text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg cursor-pointer"
            aria-label="Toggle notes drawer"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden lg:inline">Notes</span>
          </Button>
        )}

        {/* TTS Toggle */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={ttsEnabled ? "Disable AI speech output" : "Enable AI speech output"}
          onClick={onToggleTts}
          className={`h-8 w-8 rounded-lg cursor-pointer ${
            ttsEnabled
              ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {ttsEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>

        <ThemeToggle />

        {/* End Session Button */}
        <Button
          size="sm"
          variant="destructive"
          onClick={onEndInterview}
          className="h-8 px-3 text-xs font-mono-tech font-semibold rounded-lg cursor-pointer"
        >
          End Session
        </Button>
      </div>
    </header>
  );
}
