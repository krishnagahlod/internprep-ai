import React from "react";
import { Mic, Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveDictationCapsule } from "@/components/accenture/live-dictation-capsule";

interface InterviewInputControlsProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  isTyping: boolean;
  isListening: boolean;
  interimTranscript?: string;
  onClearTranscript?: () => void;
  onStopListening?: () => void;
  onSendMessage: () => void;
  onToggleListening: () => void;
  quickReplies?: string[];
  onSelectQuickReply?: (reply: string) => void;
}

const DEFAULT_QUICK_REPLIES = [
  "Could I take a minute to structure my thoughts?",
  "Are there any specific revenue or timeline constraints?",
  "Let's break down the profitability tree into revenue and cost drivers.",
];

export function InterviewInputControls({
  inputValue,
  setInputValue,
  isTyping,
  isListening,
  interimTranscript = "",
  onClearTranscript,
  onStopListening,
  onSendMessage,
  onToggleListening,
  quickReplies = DEFAULT_QUICK_REPLIES,
  onSelectQuickReply,
}: InterviewInputControlsProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isTyping) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="border-t border-border bg-card/60 p-3 sm:p-4 space-y-2 shrink-0">
      {/* Quick Suggestion Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        <span className="text-[10px] font-mono-tech text-muted-foreground shrink-0 flex items-center gap-1">
          <Lightbulb className="h-3 w-3 text-amber-500" />
          Quick:
        </span>
        {quickReplies.map((reply, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectQuickReply ? onSelectQuickReply(reply) : setInputValue(reply)}
            className="text-[10px] font-mono-tech whitespace-nowrap px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 transition-colors cursor-pointer"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Real-Time Live Dictation Capsule */}
      {(isListening || Boolean(interimTranscript)) && (
        <LiveDictationCapsule
          isListening={isListening}
          interimTranscript={interimTranscript}
          confirmedText={inputValue}
          onSend={onSendMessage}
          onClear={onClearTranscript || (() => setInputValue(""))}
          onStop={onStopListening || onToggleListening}
        />
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak or type your answer... (Enter to send, Shift+Enter for new line)"
          className="flex-1 rounded-xl bg-background border border-border px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none custom-scrollbar"
        />

        {/* Speech-to-Text Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={isListening ? "Stop voice listening" : "Start voice listening"}
          onClick={onToggleListening}
          className={`h-10 w-10 rounded-xl shrink-0 cursor-pointer ${
            isListening
              ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-4 w-4" />
        </Button>

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          disabled={!inputValue.trim() || isTyping}
          onClick={onSendMessage}
          className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 shrink-0 cursor-pointer shadow-xs"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
