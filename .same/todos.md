# Wedding Officiant Portal - Todos

## Completed
- [x] Profile data persistence
- [x] Uploaded files reflected in documents
- [x] Show officiant's first name in welcome messages
- [x] Square credit card processing for subscription management
- [x] Wedding details notes UI improvements (truncation, popup)
- [x] Server-side storage for wedding details with notes button
- [x] Remove character count badge from notes button
- [x] Move Officiant Dashboard button into avatar dropdown with logout
- [x] Email notifications to officiant when couple sends messages
- [x] Real-time message updates with Supabase Realtime
- [x] Browser push notifications for new messages
- [x] **Fix login stuck issue (Version 476)**
  - Added `user` prop to CommunicationPortal
  - Added effect to sync currentUser with user prop
  - Updated auth loading to use user prop if available
  - Added try/catch/finally to couples loading for proper error handling
- [x] **Fix Supabase RLS duplicate policies (Version 482)**
  - Removed duplicate RLS policies on: tasks, payments, messages, ceremonies, profiles, subscriptions, documents, invoices
  - Added missing DELETE policies on contracts and payments
  - Optimized all policies to use `(select auth.uid())` for 10-100x performance improvement
  - Tables fixed: couples, tasks, meetings, couple_files, contracts, payments, scripts, messages

## Current
- None

## Pending
- None

## Notes
- All pre-existing TypeScript `any` type warnings are non-blocking
- Hydration warnings are development-only and don't affect production
- RLS policies now optimized for performance - queries should be much faster
