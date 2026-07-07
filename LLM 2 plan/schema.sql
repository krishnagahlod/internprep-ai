-- AI Interview & Case Prep Assistant — Database Schema (Supabase / Postgres)
-- Apply after enabling the pgvector extension.

create extension if not exists vector;

-- Minimal profile, tied to Supabase auth.users. Store only what's necessary.
create table profiles (
  id uuid references auth.users primary key,
  target_companies text[],
  weak_areas text[],
  created_at timestamptz default now()
);

-- Resumes, with structured analysis stored as JSON after Phase 4 processing.
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  raw_text text,
  analysis jsonb, -- bullets, flagged claims, predicted questions
  created_at timestamptz default now()
);

-- Curated company list. This is the main ongoing-maintenance table.
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text, -- consulting / finance / product / supply_chain / ai_ds
  process_rounds jsonb, -- structured round-by-round process info
  difficulty text,
  values text,
  notes text,
  last_updated timestamptz default now()
);

-- Knowledge base chunks powering RAG. Metadata tags matter more than raw text volume.
create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768), -- match dimension to whichever embedding model is actually used
  company_id uuid references companies(id) on delete set null,
  round_type text, -- case / hr / resume / brainstormer
  interview_type text,
  difficulty text,
  source text,
  created_at timestamptz default now()
);

create index on kb_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- One row per interview session. case_state holds the hidden answer key and
-- phase/reveal tracking described in CLAUDE.md — never sent to the frontend as-is.
create table interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  company_id uuid references companies(id),
  interview_type text, -- case / hr / resume / brainstormer
  status text default 'in_progress', -- in_progress / completed
  case_state jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references interview_sessions(id) on delete cascade,
  role text not null, -- interviewer / candidate
  content text not null,
  created_at timestamptz default now()
);

-- One feedback row per completed session, generated once at session end.
create table session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references interview_sessions(id) on delete cascade,
  dimension_notes jsonb, -- per-dimension qualitative notes, 7 fixed dimensions
  fix_next text[], -- 2-3 concrete next steps
  created_at timestamptz default now()
);

-- Row Level Security: users see only their own data. Companies and kb_chunks
-- are readable by any authenticated user (adjust if kb_chunks should stay private).

alter table profiles enable row level security;
alter table resumes enable row level security;
alter table interview_sessions enable row level security;
alter table session_messages enable row level security;
alter table session_feedback enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own resumes" on resumes for all using (auth.uid() = user_id);
create policy "own sessions" on interview_sessions for all using (auth.uid() = user_id);
create policy "own session messages" on session_messages for all using (
  exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "own feedback" on session_feedback for all using (
  exists (select 1 from interview_sessions s where s.id = session_id and s.user_id = auth.uid())
);
