export interface AdminStats {
  total_users: number;
  iitb_users?: number;
  active_subscriptions: number;
  tier_distribution: Record<string, number>;
  total_revenue_inr: number;
  total_analyses: number;
  total_interviews?: number;
  total_resumes?: number;
  plans: Record<string, any>;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  college?: string;
  created_at?: string;
  last_sign_in_at?: string;
  provider?: string;
  has_placement_access?: boolean;
  placement_details?: {
    role?: string;
    notes?: string;
    granted_at?: string;
    granted_by?: string;
  };
  entitlement?: {
    plan_key: string;
    plan_name: string;
    status: string;
    is_iitb: boolean;
    is_admin: boolean;
    expires_at?: string | null;
    source?: string;
  };
  usage?: {
    resume_analysis?: { used: number; limit: number; remaining: number };
    mock_interview?: { used: number; limit: number; remaining: number };
    bullet_refine?: { used: number; limit: number; remaining: number };
    placement_intelligence?: { used: number; limit: number; remaining: number };
  };
  topup_credits?: {
    resume_analysis?: number;
    mock_interview?: number;
  };
  activity?: {
    resumes_count?: number;
    interviews_count?: number;
    analyses_count?: number;
    total_spent_inr?: number;
  };
}

export interface UserDetailRecord {
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at?: string;
    last_sign_in_at?: string;
    provider?: string;
  };
  entitlement: any;
  usage: any;
  topup_credits: any;
  resumes: Array<{ id: string; file_name: string; created_at: string }>;
  interview_sessions: Array<{
    id: string;
    role?: string;
    domain?: string;
    status?: string;
    created_at: string;
  }>;
  payment_transactions: Array<{
    id: string;
    plan_slug: string;
    amount_inr: number;
    status: string;
    created_at: string;
  }>;
}

export interface PlacementOverview {
  total_whitelisted: number;
  total_invite_codes: number;
  whitelisted_users: Array<{
    email: string;
    role: string;
    notes?: string;
    granted_at?: string;
    granted_by?: string;
  }>;
  invite_codes: string[];
  recent_sessions: Array<{
    email: string;
    verified_at: string;
  }>;
  admin_emails: string[];
}

export interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: string;
  target_user_id: string;
  details: Record<string, any>;
  timestamp?: string;
  created_at?: string;
}
