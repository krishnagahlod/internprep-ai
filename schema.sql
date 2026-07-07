-- AI Interview Coach (InternPrep AI) — Database Schema
-- Supabase / Postgres

CREATE EXTENSION IF NOT EXISTS vector;

-- User profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  target_companies TEXT[],
  weak_areas TEXT[],
  preferred_interview_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resumes with structured analysis
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text TEXT,
  file_url TEXT,                  -- Supabase Storage path
  analysis JSONB,                 -- bullets, flagged claims, predicted questions
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company intelligence
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,                  -- consulting / finance / product / fmcg / analytics
  process_rounds JSONB,           -- round-by-round process info
  difficulty TEXT,
  values TEXT,
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- RAG knowledge base chunks (metadata-filtered retrieval)
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(768),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  round_type TEXT,                -- case / hr / resume / brainstormer
  interview_type TEXT,
  difficulty TEXT,
  source TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Interview sessions with state tracking
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  interview_type TEXT,            -- case / hr / resume / brainstormer
  status TEXT DEFAULT 'in_progress',
  case_state JSONB,               -- phase tracking, revealed data, answer key (never sent to frontend)
  scratchpad_content TEXT,        -- consulting scratchpad state
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Session messages (conversation transcript)
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,              -- interviewer / candidate
  content TEXT NOT NULL,
  phase TEXT,                     -- which interview phase this message belongs to
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback per completed session
CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  dimension_notes JSONB,          -- per-dimension qualitative notes (7 dimensions)
  fix_next TEXT[],                -- 2-3 concrete action items
  timeline_data JSONB,            -- moment-by-moment strength/weakness analysis
  suggested_resources JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own sessions" ON interview_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own messages" ON session_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "own feedback" ON session_feedback FOR ALL USING (
  EXISTS (SELECT 1 FROM interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);

-- RAG Vector Search Function
CREATE OR REPLACE FUNCTION match_kb_chunks (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_company_id UUID DEFAULT NULL,
  filter_interview_type TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_chunks.id,
    kb_chunks.content,
    kb_chunks.source,
    1 - (kb_chunks.embedding <=> query_embedding) AS similarity
  FROM kb_chunks
  WHERE 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
    AND (filter_company_id IS NULL OR kb_chunks.company_id = filter_company_id)
    AND (filter_interview_type IS NULL OR kb_chunks.interview_type = filter_interview_type)
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Golden Resume Bullets (for Few-Shot RAG)
CREATE TABLE golden_resume_bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bullet_text TEXT NOT NULL,
  resume_source TEXT NOT NULL,          -- filename of the source resume
  company_placed TEXT,                  -- McKinsey, Bain, BCG, etc.
  target_role TEXT DEFAULT 'consulting',-- NEW: role tagging
  section_type TEXT NOT NULL,           -- 'experience', 'project', 'por', 'scholastic', 'extracurricular'
  structural_skeleton TEXT NOT NULL,
  action_verb TEXT,
  has_metrics BOOLEAN DEFAULT false,
  metric_type TEXT,
  quality_tier TEXT DEFAULT 'gold',
  embedding VECTOR(3072),
  created_at TIMESTAMPTZ DEFAULT now()
);


ALTER TABLE golden_resume_bullets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for golden_resume_bullets" ON golden_resume_bullets FOR SELECT USING (true);
CREATE POLICY "Service role insert for golden_resume_bullets" ON golden_resume_bullets FOR INSERT WITH CHECK (true);

-- Match Golden Bullets Function
CREATE OR REPLACE FUNCTION match_golden_bullets (
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 3,
  filter_section_type TEXT DEFAULT NULL,
  filter_target_role TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  bullet_text TEXT,
  structural_skeleton TEXT,
  action_verb TEXT,
  section_type TEXT,
  company_placed TEXT,
  target_role TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $func$
BEGIN
  RETURN QUERY
  SELECT
    g.id, g.bullet_text, g.structural_skeleton, g.action_verb,
    g.section_type, g.company_placed, g.target_role,
    1 - (g.embedding <=> query_embedding) AS similarity
  FROM golden_resume_bullets g
  WHERE (filter_section_type IS NULL OR g.section_type = filter_section_type)
    AND (filter_target_role IS NULL OR g.target_role = filter_target_role)
  ORDER BY g.embedding <=> query_embedding
  LIMIT match_count;
END;
$func$;
