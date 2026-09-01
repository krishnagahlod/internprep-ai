import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localforage for node environment
vi.mock("localforage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useAuthStore } from "@/stores/auth-store";

describe("Auth Store State Management", () => {
  beforeEach(() => {
    useAuthStore.getState().clearState();
  });

  it("should initialize with default guest state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isGuest).toBe(false);
    expect(state.guestResumeCount).toBe(0);
    expect(state.guestInterviewCount).toBe(0);
  });

  it("should activate guest mode correctly", () => {
    useAuthStore.getState().setGuestMode();
    expect(useAuthStore.getState().isGuest).toBe(true);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("should track guest resume evaluation and interview counts", () => {
    expect(useAuthStore.getState().guestResumeCount).toBe(0);
    useAuthStore.getState().incrementGuestResume();
    expect(useAuthStore.getState().guestResumeCount).toBe(1);

    expect(useAuthStore.getState().guestInterviewCount).toBe(0);
    useAuthStore.getState().incrementGuestInterview();
    expect(useAuthStore.getState().guestInterviewCount).toBe(1);
  });

  it("should set user and clear guest state upon authentication", () => {
    useAuthStore.getState().setGuestMode();
    expect(useAuthStore.getState().isGuest).toBe(true);

    const mockUser: any = {
      id: "usr_123456",
      email: "candidate@iitb.ac.in",
      created_at: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user?.email).toBe("candidate@iitb.ac.in");
    expect(useAuthStore.getState().isGuest).toBe(false);
  });

  it("should reset state upon clearState", () => {
    useAuthStore.getState().setResumeText("Sample resume text");
    useAuthStore.getState().setTargetCompany("McKinsey");
    expect(useAuthStore.getState().targetCompany).toBe("McKinsey");

    useAuthStore.getState().clearState();
    expect(useAuthStore.getState().targetCompany).toBeNull();
    expect(useAuthStore.getState().resumeText).toBeNull();
  });
});
