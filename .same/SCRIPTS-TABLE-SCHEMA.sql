-- ============================================
-- SCRIPTS TABLE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to create the scripts table
-- This enables server-side storage for ceremony scripts

-- Create scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id INTEGER REFERENCES public.couples(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Traditional',
  status TEXT NOT NULL DEFAULT 'Draft',
  content TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON public.scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_couple_id ON public.scripts(couple_id);
CREATE INDEX IF NOT EXISTS idx_scripts_updated_at ON public.scripts(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own scripts
DROP POLICY IF EXISTS "Users can view own scripts" ON public.scripts;
CREATE POLICY "Users can view own scripts"
  ON public.scripts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scripts" ON public.scripts;
CREATE POLICY "Users can insert own scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scripts" ON public.scripts;
CREATE POLICY "Users can update own scripts"
  ON public.scripts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scripts" ON public.scripts;
CREATE POLICY "Users can delete own scripts"
  ON public.scripts FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.scripts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.scripts_id_seq TO authenticated;

-- Done!
-- After running this, the scripts table will be ready for use.
