"use client";

import React from "react";
import { motion } from "framer-motion";

interface VoiceWaveformProps {
  active?: boolean;
  color?: string;
  barCount?: number;
  className?: string;
}

export function VoiceWaveform({
  active = false,
  color = "bg-emerald-500",
  barCount = 5,
  className = "",
}: VoiceWaveformProps) {
  return (
    <div
      role="status"
      aria-label={active ? "Voice input recording active" : "Voice input idle"}
      className={`inline-flex items-center gap-1 h-5 px-1.5 ${className}`}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.span
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={
            active
              ? {
                  height: ["6px", `${14 + ((i * 7) % 10)}px`, "6px"],
                }
              : { height: "4px" }
          }
          transition={
            active
              ? {
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }
              : { duration: 0.2 }
          }
        />
      ))}
      <span className="sr-only">
        {active ? "Listening for speech..." : "Voice inactive"}
      </span>
    </div>
  );
}
