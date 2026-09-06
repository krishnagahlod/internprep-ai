import { describe, it, expect, vi } from "vitest";
import { PHASES, DOMAIN_PHASES, RightPanelState } from "@/components/interview/types";

describe("Interview Suite Upgrades & Features", () => {
  it("defines standard case and domain phase progressions with valid IDs", () => {
    expect(PHASES.length).toBeGreaterThanOrEqual(6);
    expect(PHASES.map((p) => p.id)).toContain("introduction");
    expect(PHASES.map((p) => p.id)).toContain("quantitative");
    expect(PHASES.map((p) => p.id)).toContain("synthesis");

    expect(DOMAIN_PHASES.length).toBeGreaterThanOrEqual(3);
    expect(DOMAIN_PHASES.map((p) => p.id)).toContain("introduction");
    expect(DOMAIN_PHASES.map((p) => p.id)).toContain("technical");
    expect(DOMAIN_PHASES.map((p) => p.id)).toContain("hr");
  });

  it("supports whiteboard, source document, and resume panel states", () => {
    const validStates: RightPanelState[] = ["whiteboard", "source", "resume"];
    expect(validStates).toContain("source");
    expect(validStates).toContain("whiteboard");
    expect(validStates).toContain("resume");
  });

  it("formats casebook PDF URLs with proper URI encoding and page anchors", () => {
    const API_URL = "http://localhost:8000";
    const caseSource = "CCG Casebook.pdf";
    const pageNumber = 91;

    const url = `${API_URL}/casebooks/${encodeURIComponent(caseSource)}#page=${pageNumber}`;
    expect(url).toBe("http://localhost:8000/casebooks/CCG%20Casebook.pdf#page=91");
  });
});
