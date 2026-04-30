-- ================================================================
-- ADD MISSING couple_id COLUMN TO user_files TABLE
-- ================================================================
-- Run this in Supabase SQL Editor to fix the "column user_files.couple_id does not exist" error
-- ================================================================

-- Add couple_id column to user_files (nullable since not all files belong to a couple)
ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS couple_id INTEGER REFERENCES public.couples(id) ON DELETE SET NULL;

-- Create index for faster couple lookups
CREATE INDEX IF NOT EXISTS idx_user_files_couple_id ON public.user_files(couple_id);

-- Done! The user_files table now supports couple-specific file associations.
-- Files can be linked to:
--   - A user (user_id) - who uploaded the file
--   - A ceremony (ceremony_id) - which ceremony it belongs to
--   - A couple (couple_id) - directly to a couple
-- ================================================================
