-- Placement Analysis & Company Intelligence Schema Migration
-- Supabase / PostgreSQL

-- 1. Update profiles table with IITB verification columns
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS is_iitb_verified BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS iitb_email TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS iitb_verification_otp TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS iitb_otp_expires_at TIMESTAMPTZ;

-- 2. Companies Master Table
CREATE TABLE IF NOT EXISTS placement_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  normalized_name TEXT,
  primary_sector TEXT,
  tier_category TEXT,
  headquarters TEXT,
  website TEXT,
  logo_url TEXT,
  is_hiring_24_25 BOOLEAN DEFAULT false,
  is_hiring_25_26 BOOLEAN DEFAULT false,
  total_roles_count INT DEFAULT 0,
  highest_ctc_inr NUMERIC DEFAULT 0,
  median_ctc_inr NUMERIC DEFAULT 0,
  highest_inhand_inr NUMERIC DEFAULT 0,
  currency_dominant TEXT DEFAULT 'INR',
  ai_company_overview TEXT,
  locations JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_companies_sector ON placement_companies(primary_sector);
CREATE INDEX IF NOT EXISTS idx_placement_companies_tier ON placement_companies(tier_category);
CREATE INDEX IF NOT EXISTS idx_placement_companies_highest_ctc ON placement_companies(highest_ctc_inr DESC);
CREATE INDEX IF NOT EXISTS idx_placement_companies_slug ON placement_companies(slug);

-- 3. Placement Roles (JAF Records across sessions)
CREATE TABLE IF NOT EXISTS placement_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES placement_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  session_sheet TEXT NOT NULL, -- '24-25', '25-26 s1', '25-26 s2'
  company_sector TEXT,
  job_sector TEXT,
  job_location TEXT,
  category_tier TEXT,
  currency TEXT DEFAULT 'INR',
  ctc_raw TEXT,
  inhand_raw TEXT,
  ctc_original_min NUMERIC,
  ctc_original_max NUMERIC,
  ctc_original_median NUMERIC,
  inhand_original_median NUMERIC,
  ctc_inr_equivalent NUMERIC,
  inhand_inr_equivalent NUMERIC,
  raw_jd TEXT,
  additional_info_raw TEXT,
  role_summary TEXT,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  required_skills JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  selection_rounds_overview JSONB DEFAULT '[]'::jsonb,
  bond_details JSONB DEFAULT '{}'::jsonb,
  perks_and_benefits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_roles_company ON placement_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_placement_roles_session ON placement_roles(session_sheet);
CREATE INDEX IF NOT EXISTS idx_placement_roles_sector ON placement_roles(job_sector);
CREATE INDEX IF NOT EXISTS idx_placement_roles_ctc_inr ON placement_roles(ctc_inr_equivalent DESC);

-- 4. Authentic Selection Insights (Student experiences & Q&A)
CREATE TABLE IF NOT EXISTS placement_selection_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES placement_companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  online_test_details TEXT,
  interview_details TEXT,
  questions_asked JSONB DEFAULT '[]'::jsonb,
  recommended_electives_projects JSONB DEFAULT '[]'::jsonb,
  preparation_tips TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_selection_insights_company ON placement_selection_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_selection_insights_sector ON placement_selection_insights(sector);

-- 5. AI Intelligence Synthesis
CREATE TABLE IF NOT EXISTS placement_ai_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES placement_companies(id) ON DELETE CASCADE,
  executive_summary TEXT,
  compensation_analysis TEXT,
  interview_blueprint JSONB DEFAULT '{}'::jsonb,
  prep_roadmap JSONB DEFAULT '{}'::jsonb,
  key_competencies JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_ai_intel_company ON placement_ai_intelligence(company_id);
