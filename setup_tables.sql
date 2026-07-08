-- Run this in your Supabase SQL Editor to create the missing table for Phase 2

CREATE TABLE IF NOT EXISTS public.resume_analyses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_text text NOT NULL,
    target_role text DEFAULT 'consulting',
    analysis_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own analyses
CREATE POLICY "Users can view their own resume analyses"
    ON public.resume_analyses FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own analyses
CREATE POLICY "Users can insert their own resume analyses"
    ON public.resume_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow the service role to do anything (used by the backend)
CREATE POLICY "Service role has full access to resume analyses"
    ON public.resume_analyses FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable pgvector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Create Knowledge Base Chunks table for Casebook RAG
CREATE TABLE IF NOT EXISTS public.kb_chunks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source text NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    embedding vector(768),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for kb_chunks
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access to kb_chunks"
    ON public.kb_chunks FOR ALL
    USING (true)
    WITH CHECK (true);
CREATE POLICY "Users can select from kb_chunks"
    ON public.kb_chunks FOR SELECT
    USING (true);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_kb_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_source text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  source text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kb_chunks.id,
    kb_chunks.source,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) AS similarity
  FROM kb_chunks
  WHERE 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR kb_chunks.source = filter_source)
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;
