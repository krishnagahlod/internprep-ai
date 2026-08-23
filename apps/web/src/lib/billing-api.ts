import { createClient } from './supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PlanLimitInfo {
  resume_analysis: number;
  mock_interview: number;
  bullet_refine: number;
  placement_intelligence: number;
}

export interface UserEntitlement {
  id?: string;
  user_id: string;
  plan_key: string;
  plan_name: string;
  status: string;
  source?: string;
  starts_at?: string;
  expires_at?: string | null;
  is_iitb: boolean;
  is_admin: boolean;
  limits: PlanLimitInfo;
  feature_limits: PlanLimitInfo;
}

export interface UserUsageItem {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  period: string;
  reset_at: string;
  plan_key: string;
  feature_key: string;
}

export interface EntitlementResponse {
  user_id: string;
  email: string;
  is_iitb: boolean;
  is_admin: boolean;
  current_session_id: string;
  entitlement: UserEntitlement;
  usage: Record<string, UserUsageItem>;
  active_sessions_count: number;
}

export interface DeviceSession {
  id?: string;
  session_id: string;
  device_name: string;
  user_agent: string;
  last_seen_at: string;
  revoked_at?: string | null;
}

/**
 * Retrieves the current user's session JWT token from Supabase Auth
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Fetches user entitlement status, active tier, and remaining monthly quotas.
 */
export async function fetchUserEntitlement(): Promise<EntitlementResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/billing/entitlement`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch entitlement: ${errText}`);
  }

  return res.json();
}

/**
 * Fetches public subscription plans
 */
export async function fetchPlans(): Promise<any[]> {
  const res = await fetch(`${API_URL}/billing/plans`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to load pricing plans');
  }

  const data = await res.json();
  return data.plans || [];
}

/**
 * Creates a Razorpay payment order
 */
export async function createPaymentOrder(planKey: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/billing/create-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ plan_key: planKey }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to create payment order' }));
    throw new Error(errorData.detail || 'Failed to create payment order');
  }

  const data = await res.json();
  return data.order;
}

/**
 * Verifies payment signature and immediately activates subscription
 */
export async function verifyPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_key: string;
}): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/billing/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Payment verification failed' }));
    throw new Error(errorData.detail || 'Payment verification failed');
  }

  return res.json();
}

/**
 * Fetches list of active device sessions
 */
export async function fetchUserSessions(): Promise<{ current_session_id: string; sessions: DeviceSession[] }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/billing/sessions`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user sessions');
  }

  return res.json();
}

/**
 * Signs out all other active device sessions
 */
export async function revokeOtherSessions(): Promise<{ message: string; revoked_count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/billing/sessions/revoke-others`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error('Failed to revoke other sessions');
  }

  return res.json();
}

/**
 * Signs out a specific device session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/billing/sessions/revoke`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!res.ok) {
    throw new Error('Failed to revoke session');
  }
}

/**
 * Dynamically loads Razorpay checkout script and opens payment modal
 */
export function openRazorpayCheckout(
  options: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
    };
    handler: (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => void;
    onDismiss?: () => void;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    // If Razorpay SDK already loaded on window
    if (typeof (window as any).Razorpay !== 'undefined') {
      const rzp = new (window as any).Razorpay({
        ...options,
        modal: {
          ondismiss: () => {
            if (options.onDismiss) options.onDismiss();
          }
        }
      });
      rzp.open();
      resolve();
      return;
    }

    // Inject Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      try {
        const rzp = new (window as any).Razorpay({
          ...options,
          modal: {
            ondismiss: () => {
              if (options.onDismiss) options.onDismiss();
            }
          }
        });
        rzp.open();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay checkout script.'));
    };
    document.body.appendChild(script);
  });
}
