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
