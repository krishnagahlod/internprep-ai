"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// BroadcastChannel name for cross-window communication
const CHANNEL_NAME = "internprep-presentation";

// Message types for cross-window communication
export type PresentationMessage =
  | { type: "panel-switch"; state: "whiteboard" | "source" }
  | { type: "close" }
  | { type: "window-closed" }
  | { type: "theme-change"; theme: string };

export type PresentationStatus =
  | "idle"           // No presentation active
  | "detecting"      // Checking for external displays
  | "active"         // Presentation window is open
  | "error";         // Something went wrong

export interface PresentationError {
  code: "unsupported" | "no-display" | "permission-denied" | "popup-blocked" | "unknown";
  message: string;
}

export interface UsePresentationOptions {
  /** Current right panel state */
  panelState?: "whiteboard" | "source";
  /** Case context text */
  caseContext?: string;
  /** Case source PDF filename */
  caseSource?: string;
  /** Page number for the PDF */
  pageNumber?: number;
}

export interface UsePresentationReturn {
  status: PresentationStatus;
  error: PresentationError | null;
  isSupported: boolean;
  isMockMode: boolean;
  startPresentation: () => Promise<void>;
  stopPresentation: () => void;
  sendPanelSwitch: (state: "whiteboard" | "source") => void;
  sendThemeChange: (theme: string) => void;
  clearError: () => void;
}

/**
 * Custom hook for External Display Presentation Mode.
 *
 * Uses the Window Management API (Chrome 100+/Edge 100+) to detect
 * external displays and position a presentation window on them.
 *
 * Includes a dev mock mode (Ctrl+Shift+P) for testing without a physical display.
 */
export function usePresentation(options: UsePresentationOptions = {}): UsePresentationReturn {
  const { panelState = "whiteboard", caseContext = "", caseSource = "", pageNumber = 1 } = options;
  const [status, setStatus] = useState<PresentationStatus>("idle");
  const [error, setError] = useState<PresentationError | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  const presentationWindowRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if the Window Management API is supported
  const isSupported =
    typeof window !== "undefined" &&
    ("getScreenDetails" in window || isMockMode);

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      // Listen for messages from the external window
      channelRef.current.onmessage = (event: MessageEvent<PresentationMessage>) => {
        const data = event.data;
        if (data.type === "window-closed") {
          // External window was closed by the user
          cleanupPresentation();
        }
      };
    } catch {
      // BroadcastChannel not supported — degrade gracefully
      console.warn("BroadcastChannel not supported");
    }

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  // Dev mock mode keyboard shortcut: Ctrl+Shift+P
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setIsMockMode((prev) => {
          const next = !prev;
          console.log(
            `%c[Presentation] Mock mode ${next ? "ENABLED" : "DISABLED"}`,
            "color: #10b981; font-weight: bold"
          );
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Poll to detect if the external window was manually closed
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(() => {
      if (presentationWindowRef.current?.closed) {
        cleanupPresentation();
      }
    }, 500);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const cleanupPresentation = useCallback(() => {
    stopPolling();
    presentationWindowRef.current = null;
    setStatus("idle");
    setError(null);
  }, [stopPolling]);

  /**
   * Start presentation — detect external display and open popup window.
   * Must be called from a user-initiated click event to avoid popup blocking.
   */
  const startPresentation = useCallback(async () => {
    setError(null);

    // Guard: already presenting
    if (status === "active" && presentationWindowRef.current && !presentationWindowRef.current.closed) {
      presentationWindowRef.current.focus();
      return;
    }

    // Guard: browser support
    if (!isSupported && !isMockMode) {
      setError({
        code: "unsupported",
        message: "External display presentation is not supported in this browser. Try a Chromium-based browser (Chrome or Edge).",
      });
      setStatus("error");
      return;
    }

    setStatus("detecting");

    try {
      // ============================================================
      // CRITICAL: Open the window IMMEDIATELY and SYNCHRONOUSLY from
      // the user's click event. If we await getScreenDetails() first,
      // Chrome loses the "user activation" context and blocks the popup.
      // We open about:blank first, then reposition + navigate after.
      // ============================================================
      const popup = window.open("about:blank", "internprep-presentation");

      if (!popup) {
        setError({
          code: "popup-blocked",
          message: "The presentation window was blocked by your browser. Please allow popups for this site and try again.",
        });
        setStatus("error");
        return;
      }

      // Build the presentation URL with query params
      const params = new URLSearchParams({
        panel: panelState,
        caseSource: caseSource,
        pageNumber: String(pageNumber),
        t: String(Date.now()),
      });
      if (caseContext && caseContext.length < 1500) {
        params.set("caseContext", caseContext);
      }
      const presentationUrl = `/interview/present?${params.toString()}`;

      if (isMockMode) {
        // Mock mode: position on the same screen, offset right
        const mockLeft = Math.round(window.screen.availWidth * 0.55);
        const mockTop = 50;
        const mockWidth = Math.round(window.screen.availWidth * 0.42);
        const mockHeight = Math.round(window.screen.availHeight * 0.85);
        popup.moveTo(mockLeft, mockTop);
        popup.resizeTo(mockWidth, mockHeight);
      } else {
        // Real mode: use Window Management API (async, but window is already open)
        try {
          const screenDetails = await (window as any).getScreenDetails();
          const screens: any[] = screenDetails.screens || [];

          // Find an external (non-primary) screen
          const externalScreen = screens.find((s: any) => !s.isPrimary);

          if (!externalScreen) {
            popup.close();
            setError({
              code: "no-display",
              message: "No external display detected. Connect an extended display and try again.",
            });
            setStatus("error");
            return;
          }

          // Position the window using the external display's actual geometry
          const left = externalScreen.availLeft ?? externalScreen.left ?? 0;
          const top = externalScreen.availTop ?? externalScreen.top ?? 0;
          const width = externalScreen.availWidth ?? externalScreen.width ?? 1920;
          const height = externalScreen.availHeight ?? externalScreen.height ?? 1080;
          popup.moveTo(left, top);
          popup.resizeTo(width, height);
        } catch (apiErr: any) {
          // If getScreenDetails fails (permission denied, etc.), keep the popup
          // on the current screen as a fallback rather than losing it entirely
          if (apiErr?.name === "NotAllowedError") {
            popup.close();
            setError({
              code: "permission-denied",
              message: "Multi-screen permission was denied. Please grant the permission and try again.",
            });
            setStatus("error");
            return;
          }
          // For other errors, just leave it on the current screen
          console.warn("[Presentation] Could not detect external display, using current screen:", apiErr);
        }
      }

      // Navigate the already-open window to the presentation page
      popup.location.href = presentationUrl;

      presentationWindowRef.current = popup;
      setStatus("active");

      // Start polling to detect if the user manually closes the window
      startPolling();
    } catch (err: any) {
      // Generic safety net — close any popup that may have been opened
      if (presentationWindowRef.current && !presentationWindowRef.current.closed) {
        presentationWindowRef.current.close();
        presentationWindowRef.current = null;
      }
      setError({
        code: "unknown",
        message: err?.message || "An unexpected error occurred while starting presentation.",
      });
      setStatus("error");
    }
  }, [status, isSupported, isMockMode, startPolling]);

  /**
   * Stop presentation — close the external window and restore inline workspace.
   */
  const stopPresentation = useCallback(() => {
    // Send close message to the external window
    try {
      channelRef.current?.postMessage({ type: "close" } as PresentationMessage);
    } catch {
      // Channel may already be closed
    }

    // Close the external window
    if (presentationWindowRef.current && !presentationWindowRef.current.closed) {
      presentationWindowRef.current.close();
    }

    cleanupPresentation();
  }, [cleanupPresentation]);

  /**
   * Send a panel switch command to the external window.
   */
  const sendPanelSwitch = useCallback((state: "whiteboard" | "source") => {
    try {
      channelRef.current?.postMessage({
        type: "panel-switch",
        state,
      } as PresentationMessage);
    } catch {
      // Channel may not be available
    }
  }, []);

  /**
   * Send a theme change to the external window.
   */
  const sendThemeChange = useCallback((theme: string) => {
    try {
      channelRef.current?.postMessage({
        type: "theme-change",
        theme,
      } as PresentationMessage);
    } catch {
      // Channel may not be available
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === "error") {
      setStatus("idle");
    }
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    error,
    isSupported: isSupported || isMockMode,
    isMockMode,
    startPresentation,
    stopPresentation,
    sendPanelSwitch,
    sendThemeChange,
    clearError,
  };
}
