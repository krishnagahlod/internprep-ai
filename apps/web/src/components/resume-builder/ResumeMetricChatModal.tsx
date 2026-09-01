"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, Loader2, Save, Send } from "lucide-react";
import { Achievement } from "./types";

interface ResumeMetricChatModalProps {
  activeAchievement: Achievement | null;
  onClose: () => void;
  chatMessages: Array<{ role: string; content: string }>;
  isChatLoading: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: (isInitial?: boolean) => void;
  pendingMetricsUpdate: any;
  pendingContextSummary: string;
  onApplyMetrics: () => void;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function ResumeMetricChatModal({
  activeAchievement,
  onClose,
  chatMessages,
  isChatLoading,
  chatInput,
  setChatInput,
  onSendMessage,
  pendingMetricsUpdate,
  pendingContextSummary,
  onApplyMetrics,
  chatScrollRef,
}: ResumeMetricChatModalProps) {
  if (!activeAchievement) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-background w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] border border-border/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-card">
          <div>
            <h3 className="font-bold text-base text-foreground font-display">Metric Reconstruction</h3>
            <p className="text-xs text-muted-foreground truncate max-w-md">{activeAchievement.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-muted/10 custom-scrollbar">
          {chatMessages.length === 0 && (
            <div className="text-center text-muted-foreground p-10 bg-background rounded-2xl border shadow-xs max-w-lg mx-auto my-auto">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2 font-display">Metrics Discovery</h4>
              <p className="text-sm mb-6 leading-relaxed">
                Start an interview with our AI consultant to uncover hidden metrics, scope, and quantitative impact in this achievement.
              </p>
              <Button
                onClick={() => onSendMessage(true)}
                size="lg"
                className="rounded-full shadow-md font-semibold cursor-pointer"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Start Interview
              </Button>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-[15px] shadow-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-xs"
                    : "bg-background border rounded-bl-xs text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-background border rounded-2xl rounded-bl-xs p-4 text-[15px] shadow-xs flex gap-3 items-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> AI is thinking...
              </div>
            </div>
          )}
          <div ref={chatScrollRef} />
        </div>

        <div className="p-4 border-t bg-background">
          {pendingMetricsUpdate || pendingContextSummary ? (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
              <div>
                <p className="text-sm font-semibold text-primary flex items-center gap-1.5 font-mono-tech">
                  <Sparkles className="h-4 w-4" /> New details discovered!
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono-tech">
                  {pendingContextSummary ? "Context notes ready. " : ""}
                  {pendingMetricsUpdate && Object.keys(pendingMetricsUpdate).length > 0
                    ? `Found: ${Object.keys(pendingMetricsUpdate).join(", ")}.`
                    : ""}
                </p>
              </div>
              <Button
                onClick={onApplyMetrics}
                disabled={isChatLoading}
                size="sm"
                className="shadow-xs whitespace-nowrap ml-4 font-mono-tech cursor-pointer"
              >
                {isChatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Apply to Vault
              </Button>
            </div>
          ) : null}
          <div className="flex gap-3 relative">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your answer here..."
              className="resize-none pr-14 min-h-[60px] rounded-xl focus-visible:ring-primary/30 text-[15px] bg-card"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <Button
              onClick={() => onSendMessage()}
              disabled={isChatLoading || !chatInput.trim()}
              className="absolute right-2 top-2 h-11 w-11 rounded-lg cursor-pointer"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-2 font-mono-tech">
            Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}
