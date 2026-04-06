-- ================================================================
-- ENABLE REALTIME FOR MESSAGES TABLE
-- ================================================================
-- Run this in Supabase SQL Editor to enable real-time updates
-- ================================================================

-- Enable realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify it's enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ================================================================
-- DONE! ✅
-- ================================================================
-- Now when a couple replies, the officiant's portal will update
-- in real-time without needing to refresh the page.
-- ================================================================
