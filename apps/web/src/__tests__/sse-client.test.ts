import { describe, it, expect, vi } from "vitest";
import { fetchEventSourceStream } from "@/lib/sse-client";

describe("Client-Side SSE Stream Consumer", () => {
  it("should parse token chunks and call onToken callback", async () => {
    const ssePayload = [
      "event: token\n",
      'data: {"token": "Hello "}\n\n',
      "event: token\n",
      'data: {"token": "Candidate!"}\n\n',
      "event: done\n",
      'data: {"response": "Hello Candidate!", "new_phase": "clarifying"}\n\n',
    ].join("");

    const mockResponse = {
      ok: true,
      status: 200,
      body: {
        getReader: () => {
          let readCount = 0;
          return {
            read: async () => {
              if (readCount === 0) {
                readCount++;
                return {
                  value: new TextEncoder().encode(ssePayload),
                  done: false,
                };
              }
              return { value: undefined, done: true };
            },
          };
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse as any);

    const onToken = vi.fn();
    const onDone = vi.fn();

    await fetchEventSourceStream("http://localhost:8000/interview/chat/stream", {
      method: "POST",
      onToken,
      onDone,
    });

    expect(onToken).toHaveBeenCalledWith("Hello ");
    expect(onToken).toHaveBeenCalledWith("Candidate!");
    expect(onDone).toHaveBeenCalledWith({
      response: "Hello Candidate!",
      new_phase: "clarifying",
    });
  });

  it("should handle progress events during ATS deep scan", async () => {
    const ssePayload = [
      "event: progress\n",
      'data: {"stage": "parsing_pdf", "percent": 25, "message": "Parsing layout..."}\n\n',
      "event: progress\n",
      'data: {"stage": "evaluating_pillars", "percent": 75, "message": "Scoring pillars..."}\n\n',
      "event: result\n",
      'data: {"overall_score": 88, "verdict": "STRONG"}\n\n',
    ].join("");

    const mockResponse = {
      ok: true,
      status: 200,
      body: {
        getReader: () => {
          let readCount = 0;
          return {
            read: async () => {
              if (readCount === 0) {
                readCount++;
                return {
                  value: new TextEncoder().encode(ssePayload),
                  done: false,
                };
              }
              return { value: undefined, done: true };
            },
          };
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse as any);

    const onProgress = vi.fn();
    const onDone = vi.fn();

    await fetchEventSourceStream("http://localhost:8000/resume/ats-check/stream", {
      method: "POST",
      onProgress,
      onDone,
    });

    expect(onProgress).toHaveBeenCalledWith({
      stage: "parsing_pdf",
      percent: 25,
      message: "Parsing layout...",
    });
    expect(onProgress).toHaveBeenCalledWith({
      stage: "evaluating_pillars",
      percent: 75,
      message: "Scoring pillars...",
    });
    expect(onDone).toHaveBeenCalledWith({
      overall_score: 88,
      verdict: "STRONG",
    });
  });
});
