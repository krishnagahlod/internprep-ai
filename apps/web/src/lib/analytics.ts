import posthog from "posthog-js";

/**
 * Standardized Analytics Funnel Event Taxonomy for InternPrep AI
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    if (typeof window !== "undefined" && posthog.__loaded) {
      posthog.capture(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    }
  } catch (err) {
    console.debug("[Analytics] Failed to capture event:", eventName, err);
  }
}

export function trackInterviewStarted(properties: {
  interviewType: string;
  company?: string;
  domain?: string;
  sessionId: string;
}) {
  trackEvent("interview_started", properties);
}

export function trackInterviewTurnCompleted(properties: {
  sessionId: string;
  turnNumber: number;
  phase: string;
}) {
  trackEvent("interview_turn_completed", properties);
}

export function trackATSScanCompleted(properties: {
  overallScore: number;
  verdict: string;
  targetRole: string;
  mode: string;
}) {
  trackEvent("ats_scan_completed", properties);
}

export function trackPaywallViewed(properties: {
  featureKey: string;
  triggerContext: string;
}) {
  trackEvent("paywall_modal_viewed", properties);
}

export function trackUpgradeClicked(properties: {
  planKey: string;
  source: string;
}) {
  trackEvent("upgrade_button_clicked", properties);
}
