"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Monitor, ArrowLeftFromLine } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Excalidraw to avoid SSR hydration issues
const ExcalidrawWrapper = dynamic(
  () => import("@/components/ExcalidrawWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

import { InterviewSourcePane } from "@/components/interview/interview-source-pane";

// BroadcastChannel message types (must match use-presentation.ts)
type PresentationMessage =
  | { type: "panel-switch"; state: "whiteboard" | "source" }
  | { type: "close" }
  | { type: "window-closed" }
  | { type: "theme-change"; theme: string };

const CHANNEL_NAME = "internprep-presentation";

function PresentationContent() {
  const searchParams = useSearchParams();

  // Read initial state from URL params
  const initialPanel = (searchParams.get("panel") as "whiteboard" | "source") || "whiteboard";
  const caseContext = searchParams.get("caseContext") || "";
  const caseSource = searchParams.get("caseSource") || "";
  const pageNumber = parseInt(searchParams.get("pageNumber") || "1", 10);

  const [panelState, setPanelState] = useState<"whiteboard" | "source">(initialPanel);

  // Listen for BroadcastChannel messages from the primary window
  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(CHANNEL_NAME);

      channel.onmessage = (event: MessageEvent<PresentationMessage>) => {
        const data = event.data;

        switch (data.type) {
          case "panel-switch":
            setPanelState(data.state);
            break;
          case "close":
            // Primary window requested us to close
            window.close();
            break;
          case "theme-change":
            // Update the document theme class
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(data.theme);
            break;
        }
      };
    } catch {
      console.warn("BroadcastChannel not supported in presentation window");
    }

    // Notify the primary window if this window is closed
    const handleBeforeUnload = () => {
      try {
        channel?.postMessage({ type: "window-closed" } as PresentationMessage);
      } catch {
        // Channel may already be closed
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      channel?.close();
    };
  }, []);

  const handleReturnToMain = () => {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: "window-closed" } as PresentationMessage);
      channel.close();
    } catch {
      // fallback
    }
    window.close();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Minimal Presentation Header */}
      <header className="h-12 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Monitor className="h-4 w-4 text-emerald-500" />
            <span className="text-[11px] font-mono-tech font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Case Workspace
            </span>
          </div>
          <span className="text-[10px] font-mono-tech text-muted-foreground">
            {panelState === "whiteboard" ? "Scratchpad / Whiteboard" : "Case Document"}
          </span>
        </div>

        <button
          onClick={handleReturnToMain}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tech font-semibold bg-muted/60 hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeftFromLine className="h-3.5 w-3.5" />
          Return to Primary
        </button>
      </header>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden">
        {panelState === "source" ? (
          <InterviewSourcePane
            caseContext={caseContext}
            caseSource={caseSource}
            pageNumber={pageNumber}
          />
        ) : (
          <div className="h-full w-full bg-background overflow-hidden relative">
            <ExcalidrawWrapper />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="h-8 border-t border-border bg-card/60 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-mono-tech text-muted-foreground">
            Presented on External Display
          </span>
        </div>
        <span className="text-[10px] font-mono-tech text-muted-foreground/60">
          InternPrep AI
        </span>
      </div>
    </div>
  );
}

export default function PresentationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <p className="text-xs font-mono-tech text-muted-foreground">
              LOADING WORKSPACE...
            </p>
          </div>
        </div>
      }
    >
      <PresentationContent />
    </Suspense>
  );
}
