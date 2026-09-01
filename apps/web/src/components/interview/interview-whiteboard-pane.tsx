"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

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

interface InterviewWhiteboardPaneProps {
  className?: string;
}

export function InterviewWhiteboardPane({ className = "" }: InterviewWhiteboardPaneProps) {
  return (
    <div className={`h-full w-full bg-background overflow-hidden relative ${className}`}>
      <ExcalidrawWrapper />
    </div>
  );
}
