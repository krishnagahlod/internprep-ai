"use client"

import { Excalidraw } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ExcalidrawWrapper() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <div className={`relative w-full h-full overflow-hidden ${isDark ? 'bg-[#121212]' : 'bg-white'}`}>
      <Excalidraw 
        theme={isDark ? "dark" : "light"}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: true,
            loadScene: false,
            export: { saveFileToDisk: true },
            toggleTheme: false
          }
        }}
      />
    </div>
  )
}
