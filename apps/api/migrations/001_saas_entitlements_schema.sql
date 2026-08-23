-- =============================================================================
-- INTERNPREP AI & OPPORTUNITY OS: SAAS ENTITLEMENTS & SUBSCRIPTION SCHEMA
-- Migration: 001_saas_entitlements_schema.sql
-- =============================================================================

-- Enable UUID generator extension if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PLANS TABLE
-- Defines product tiers across InternPrep AI & Opportunity OS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product TEXT NOT NULL DEFAULT 'internprep_ai', -- 'internprep_ai' | 'opportunity_os'
    slug TEXT NOT NULL,                           -- 'guest' | 'free' | 'iitb_free' | 'pro' | 'lifetime' | 'admin'
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_plans_product_slug UNIQUE (product, slug)
);

-- Seed baseline plans for InternPrep AI
INSERT INTO plans (product, slug, display_name, description) VALUES
    ('internprep_ai', 'guest', 'Guest Explorer', 'Unauthenticated temporary tier with teaser preview'),
    ('internprep_ai', 'free', 'Free Student Tier', 'External authenticated user with essential monthly starter limits'),
    ('internprep_ai', 'iitb_free', 'IIT Bombay Partner Access', 'Verified IIT Bombay student access with full platform capabilities'),
    ('internprep_ai', 'pro', 'InternPrep Pro', 'Paid power-user access with elevated quotas and full placement dossiers'),
    ('internprep_ai', 'lifetime', 'Lifetime VIP', 'Special promotion or honorary lifetime placement access'),
    ('internprep_ai', 'admin', 'System Administrator', 'Administrative role with full access control and override privileges')
ON CONFLICT (product, slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 2. ENTITLEMENTS TABLE
-- Authoritative server-side record of user tier and validity period
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    plan_key TEXT NOT NULL DEFAULT 'free',        -- references plans(slug)
    status TEXT NOT NULL DEFAULT 'active',        -- 'active' | 'scheduled' | 'expired' | 'revoked' | 'suspended'
    source TEXT NOT NULL DEFAULT 'system',        -- 'iitb' | 'razorpay' | 'admin' | 'promo' | 'system'
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,                       -- NULL for permanent/lifetime or active recurring
    granted_by UUID REFERENCES auth.users(id),    -- Admin user ID if manually granted
    external_reference TEXT,                      -- Razorpay payment/order ID
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_lookup ON entitlements(user_id, product, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_expiry ON entitlements(status, expires_at);

-- -----------------------------------------------------------------------------
-- 3. FEATURE LIMITS TABLE
-- Configurable quota rules per product, plan, and feature
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    plan_key TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    limit_value INT NOT NULL DEFAULT 0,          -- -1 for unlimited
    period TEXT NOT NULL DEFAULT 'month',        -- 'month' | 'day' | 'lifetime' | 'session'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_feature_limits UNIQUE (product, plan_key, feature_key)
);

-- Seed feature limits based on confirmed user quotas
INSERT INTO feature_limits (product, plan_key, feature_key, enabled, limit_value, period) VALUES
    -- Guest
    ('internprep_ai', 'guest', 'resume_analysis', true, 1, 'lifetime'),
    ('internprep_ai', 'guest', 'mock_interview', false, 0, 'lifetime'),
    ('internprep_ai', 'guest', 'bullet_refine', true, 2, 'lifetime'),
    ('internprep_ai', 'guest', 'placement_intelligence', true, 3, 'lifetime'),

    -- Free
    ('internprep_ai', 'free', 'resume_analysis', true, 2, 'month'),
    ('internprep_ai', 'free', 'mock_interview', true, 1, 'lifetime'),
    ('internprep_ai', 'free', 'bullet_refine', true, 10, 'month'),
    ('internprep_ai', 'free', 'placement_intelligence', true, 5, 'month'),

    -- IITB Free (Calibrated Partner Quota)
    ('internprep_ai', 'iitb_free', 'resume_analysis', true, 10, 'month'),
    ('internprep_ai', 'iitb_free', 'mock_interview', true, 10, 'month'),
    ('internprep_ai', 'iitb_free', 'bullet_refine', true, 200, 'month'),
    ('internprep_ai', 'iitb_free', 'placement_intelligence', true, -1, 'month'),

    -- Pro
    ('internprep_ai', 'pro', 'resume_analysis', true, 30, 'month'),
    ('internprep_ai', 'pro', 'mock_interview', true, 15, 'month'),
    ('internprep_ai', 'pro', 'bullet_refine', true, 200, 'month'),
    ('internprep_ai', 'pro', 'placement_intelligence', true, -1, 'month'),

    -- Lifetime
    ('internprep_ai', 'lifetime', 'resume_analysis', true, 50, 'month'),
    ('internprep_ai', 'lifetime', 'mock_interview', true, 30, 'month'),
    ('internprep_ai', 'lifetime', 'bullet_refine', true, 500, 'month'),
    ('internprep_ai', 'lifetime', 'placement_intelligence', true, -1, 'month')
ON CONFLICT (product, plan_key, feature_key) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    limit_value = EXCLUDED.limit_value,
    period = EXCLUDED.period,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 4. USAGE EVENTS & USAGE LOG
-- Race-condition safe atomic usage tracking per period
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    feature_key TEXT NOT NULL,
    period_key TEXT NOT NULL,                    -- e.g. '2026-08' or 'lifetime'
    count INT NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_usage_user_feature_period UNIQUE (user_id, product, feature_key, period_key)
);

CREATE INDEX IF NOT EXISTS idx_usage_events_lookup ON usage_events(user_id, product, feature_key, period_key);

CREATE TABLE IF NOT EXISTS usage_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    feature_key TEXT NOT NULL,
    request_id TEXT,
    units INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_log_user ON usage_event_log(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. USER SESSIONS & ANTI-SHARING CONTROLS
-- Multi-device support with active session revocation and abuse flags
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,                    -- JWT jti / session token
    device_hash TEXT,
    device_name TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uq_user_sessions_session UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, revoked_at);

-- -----------------------------------------------------------------------------
-- 6. PAYMENT TRANSACTIONS & SUBSCRIPTIONS
-- Razorpay orders, payments, webhooks, and duration passes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    plan_slug TEXT NOT NULL,                     -- 'pro'
    duration_days INT NOT NULL DEFAULT 30,
    amount_inr NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT NOT NULL,
    provider_payment_id TEXT,
    provider_signature TEXT,
    status TEXT NOT NULL DEFAULT 'created',      -- 'created' | 'pending' | 'captured' | 'failed' | 'refunded'
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_payment_provider_payment UNIQUE (provider_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payment_transactions(provider_order_id);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    plan_key TEXT NOT NULL DEFAULT 'pro',
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. ADMIN ROLES & AUDIT LOGS
-- Immutable record of every administrative action and override
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',          -- 'superadmin' | 'admin' | 'support'
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_admin_users_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    action TEXT NOT NULL,                        -- 'grant' | 'revoke' | 'extend' | 'change_plan' | 'suspend' | 'unsuspend' | 'reset_sessions'
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_logs(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_logs(admin_user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. USER TOP-UP CREDITS (MICRO-TRANSACTIONS)
-- Non-expiring purchased credit balances (single reviews, packs, mocks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_topup_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product TEXT NOT NULL DEFAULT 'internprep_ai',
    feature_key TEXT NOT NULL,                  -- 'resume_analysis' | 'mock_interview'
    credits_remaining INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_topup UNIQUE (user_id, product, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_topup_user ON user_topup_credits(user_id, product);

-- -----------------------------------------------------------------------------
-- 9. BULLET CRITIQUE CACHE (INCREMENTAL RESUME RE-ANALYSIS COST REDUCTION)
-- Semantic/Hash cache for individual resume bullet critiques
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bullet_critique_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bullet_hash TEXT NOT NULL,                  -- SHA-256 of normalized bullet text
    raw_bullet TEXT NOT NULL,
    critique JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INT NOT NULL DEFAULT 70,
    suggested_rewrites JSONB NOT NULL DEFAULT '[]'::jsonb,
    hit_count INT NOT NULL DEFAULT 1,
    last_hit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bullet_hash UNIQUE (bullet_hash)
);

CREATE INDEX IF NOT EXISTS idx_bullet_hash ON bullet_critique_cache(bullet_hash);

-- -----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topup_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bullet_critique_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Plans & feature limits are readable by all authenticated users
CREATE POLICY "Public read plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Public read feature_limits" ON feature_limits FOR SELECT USING (true);
CREATE POLICY "Public read bullet_cache" ON bullet_critique_cache FOR SELECT USING (true);

-- User-owned reads
CREATE POLICY "Own entitlements" ON entitlements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own usage_events" ON usage_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own usage_event_log" ON usage_event_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own user_sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own payments" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own topup_credits" ON user_topup_credits FOR SELECT USING (auth.uid() = user_id);

-- Admin read/write policies
CREATE POLICY "Admins full plans" ON plans FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
);
CREATE POLICY "Admins full entitlements" ON entitlements FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
);
CREATE POLICY "Admins full feature_limits" ON feature_limits FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
);
CREATE POLICY "Admins full audit_logs" ON admin_audit_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
);
CREATE POLICY "Admins read admin_users" ON admin_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
);
