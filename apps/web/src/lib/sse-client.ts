/**
 * Client-Side Server-Sent Events (SSE) Stream Consumer
 * Handles text/event-stream chunks via Fetch Streams API with automatic parsing,
 * callback events, timeout management, and AbortController support.
 */

export interface SSEStreamOptions {
  onToken?: (token: string) => void;
  onPhase?: (phase: string) => void;
  onProgress?: (progress: { stage: string; percent: number; message: string }) => void;
  onPaywall?: (data: { is_paywall_locked: boolean; turn_count: number; max_turns: number }) => void;
  onDone?: (data: any) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export async function fetchEventSourceStream(
  url: string,
  options: RequestInit & SSEStreamOptions
): Promise<void> {
  const {
    onToken,
    onPhase,
    onProgress,
    onPaywall,
    onDone,
    onError,
    signal,
    headers,
    ...fetchInit
  } = options;

  try {
    const response = await fetch(url, {
      ...fetchInit,
      headers: {
        Accept: "text/event-stream",
        ...headers,
      },
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errorMessage = errJson.error.message;
        } else if (errJson?.detail) {
          errorMessage = errJson.detail;
        }
      } catch {
        // use default message
      }
      const err = new Error(errorMessage);
      onError?.(err);
      throw err;
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by response body.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      let currentEvent = "message";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.slice(6).trim();
          continue;
        }

        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") {
            onDone?.({});
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);

            const eventType = parsed?.type || currentEvent;

            switch (eventType) {
              case "token":
                if (parsed?.token !== undefined) {
                  onToken?.(parsed.token);
                } else if (parsed?.text !== undefined) {
                  onToken?.(parsed.text);
                }
                break;
              case "phase":
                if (parsed?.phase !== undefined) {
                  onPhase?.(parsed.phase);
                }
                break;
              case "progress":
                onProgress?.(parsed);
                break;
              case "paywall":
                onPaywall?.(parsed);
                break;
              case "result":
              case "done":
                onDone?.(parsed);
                break;
              case "error":
                onError?.(new Error(parsed?.error || parsed?.message || "Stream error"));
                break;
              default:
                if (parsed?.token) onToken?.(parsed.token);
                else if (parsed?.phase) onPhase?.(parsed.phase);
                break;
            }
          } catch {
            // raw string data
            if (currentEvent === "token" || dataStr) onToken?.(dataStr);
          }
        }
      }
    }
    onDone?.({ isCompleted: true });
  } catch (err: any) {
    if (err.name !== "AbortError") {
      onError?.(err);
    }
    throw err;
  }
}
