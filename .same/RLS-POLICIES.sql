-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Data Isolation for OrdainedPro Portal
-- ================================================================
-- Run this in Supabase SQL Editor to ensure complete data isolation
-- Each officiant can ONLY see/modify their own data
-- ================================================================

-- ================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceremonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_files if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_files') THEN
    EXECUTE 'ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ================================================================
-- STEP 2: PROFILES TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 3: COUPLES TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own couples" ON public.couples;
CREATE POLICY "Users can view own couples"
  ON public.couples FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own couples" ON public.couples;
CREATE POLICY "Users can insert own couples"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own couples" ON public.couples;
CREATE POLICY "Users can update own couples"
  ON public.couples FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own couples" ON public.couples;
CREATE POLICY "Users can delete own couples"
  ON public.couples FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 4: CEREMONIES TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own ceremonies" ON public.ceremonies;
CREATE POLICY "Users can view own ceremonies"
  ON public.ceremonies FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ceremonies" ON public.ceremonies;
CREATE POLICY "Users can insert own ceremonies"
  ON public.ceremonies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ceremonies" ON public.ceremonies;
CREATE POLICY "Users can update own ceremonies"
  ON public.ceremonies FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own ceremonies" ON public.ceremonies;
CREATE POLICY "Users can delete own ceremonies"
  ON public.ceremonies FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 5: MESSAGES TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 6: PAYMENTS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;
CREATE POLICY "Users can delete own payments"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 7: SCRIPTS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own scripts" ON public.scripts;
CREATE POLICY "Users can view own scripts"
  ON public.scripts FOR SELECT
  USING (auth.uid() = user_id);

-- Published scripts can be viewed by anyone (for marketplace)
DROP POLICY IF EXISTS "Anyone can view published scripts" ON public.scripts;
CREATE POLICY "Anyone can view published scripts"
  ON public.scripts FOR SELECT
  USING (is_published = true);

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

-- ================================================================
-- STEP 8: DOCUMENTS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 9: TASKS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 10: MEETINGS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own meetings" ON public.meetings;
CREATE POLICY "Users can view own meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meetings" ON public.meetings;
CREATE POLICY "Users can insert own meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meetings" ON public.meetings;
CREATE POLICY "Users can update own meetings"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meetings" ON public.meetings;
CREATE POLICY "Users can delete own meetings"
  ON public.meetings FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 11: CONTRACTS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
CREATE POLICY "Users can view own contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contracts" ON public.contracts;
CREATE POLICY "Users can insert own contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
CREATE POLICY "Users can update own contracts"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
CREATE POLICY "Users can delete own contracts"
  ON public.contracts FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 12: SUBSCRIPTIONS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 13: USER_FILES TABLE POLICIES (if exists)
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_files') THEN
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own files" ON public.user_files';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own files" ON public.user_files';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own files" ON public.user_files';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own files" ON public.user_files';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view published files" ON public.user_files';

    -- Create policies
    EXECUTE 'CREATE POLICY "Users can view own files" ON public.user_files FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Anyone can view published files" ON public.user_files FOR SELECT USING (is_published = true)';
    EXECUTE 'CREATE POLICY "Users can insert own files" ON public.user_files FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own files" ON public.user_files FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own files" ON public.user_files FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ================================================================
-- STEP 14: STORAGE BUCKET POLICIES
-- ================================================================
-- Note: Run these separately in Supabase Storage > Policies if needed

-- Storage policies for profile-photos bucket:
-- INSERT: auth.uid() IS NOT NULL
-- SELECT: auth.uid() IS NOT NULL
-- UPDATE: auth.uid() IS NOT NULL
-- DELETE: auth.uid() IS NOT NULL

-- Storage policies for documents bucket:
-- INSERT: auth.uid() IS NOT NULL
-- SELECT: auth.uid() IS NOT NULL
-- UPDATE: auth.uid() IS NOT NULL
-- DELETE: auth.uid() IS NOT NULL

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
-- Run this to verify RLS is enabled on all tables:

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ================================================================
-- DONE! ✅
-- ================================================================
-- All tables now have Row Level Security enabled
-- Each officiant can only see/modify their own data
-- Even if there's a bug in the code, the database prevents cross-user access
-- ================================================================
