# OrdainedPro Portal - Task Tracker

## Current Status
- ✅ Portal running and working
- ✅ Email sender updated to info@ordainedpro.com
- ✅ Marketplace schema created (SAFE-MARKETPLACE-SCHEMA.sql)
- ✅ Outbound emails working (sending via Resend)
- ✅ Inbound email webhook FIXED (now fetches content from Resend API)
- ✅ Auto-refresh for messages (real-time + 30s polling fallback)
- ✅ **FIXED: Add Ceremony crash** (onAddCeremony callback now properly called)
- ✅ **FIXED: New couple profile crash** (null checks for .split() on names)
- ✅ **Code synced to GitHub** - Netlify deploys automatically from `main` branch
- ✅ **Console warnings cleaned up** - Removed verbose logging and fixed DialogDescription
- ✅ **FIXED: Middleware Supabase error** (v382) - Added robust validation and try-catch
- ✅ **Git connection established** - Same.new ↔ GitHub ↔ Netlify
- ✅ **DATA ISOLATION FIXED** - All data now properly separated by couple_id
- ✅ **TypeScript errors fixed** (v387) - All 32 errors resolved
- ✅ **Realtime enabled** (v387) - messages, tasks, payments tables

## Realtime Enabled Tables (v387)
| Table | Realtime | Use Case |
|-------|----------|----------|
| `messages` | ✅ Enabled | Real-time message updates between officiant and couples |
| `tasks` | ✅ Enabled | Real-time task completion tracking |
| `payments` | ✅ Enabled | Payment status notifications |

## Data Isolation Status (v386 - COMPLETE ✅)

| System | Status | Fix Applied |
|--------|--------|-------------|
| Messages | ✅ FIXED | MessagesSection with couple selector, filters by `couple_id` |
| Payments | ✅ FIXED | PaymentsSection with couple selector, filters by `couple_id` |
| Wedding Events | ✅ FIXED | CalendarSection filters by `couple_id` when couple selected |
| Tasks | ✅ FIXED | TasksSection + AddTaskDialog now accept `coupleId` prop |

**All data isolation issues resolved!** Each system now:
- Has a couple selector dropdown
- Filters data by both `user_id` AND `couple_id`
- Clears old data immediately when switching couples (prevents data leak)

## Standalone Sections (Completed)
Extracted from CommunicationPortal into their own pages:

| Feature | Status | Route | Component |
|---------|--------|-------|-----------|
| Calendar | ✅ DONE | `/calendar` | `CalendarSection.tsx` |
| Contracts | ✅ DONE | `/contracts` | `ContractsSection.tsx` |
| Payments | ✅ DONE | `/payments` | `PaymentsSection.tsx` |
| BuildScript (Mr. Script) | ✅ DONE | `/buildscript` | `BuildScriptSection.tsx` |
| Marketplace | ✅ DONE | `/marketplace` | `MarketplaceSection.tsx` |
| Messages | ✅ NEW | `/messages` | `MessagesSection.tsx` |
| Tasks | ✅ NEW | `/tasks` | `TasksSection.tsx` |

## Deployment Status
- **GitHub Repo:** danieljosephsalerno-ai/ordainedpro-officiant-portal
- **Netlify:** Connected to GitHub - deploys automatically on push to `main`
- **Live Site:** portal.ordainedpro.com

## Completed Tasks
- [x] Fixed login/session persistence issues
- [x] Updated header avatar to use profile photo
- [x] Fixed CORS issues for images
- [x] Removed localStorage usage for profile data
- [x] Created safe marketplace schema
- [x] Updated email sender to info@ordainedpro.com
- [x] Created inbound email webhook
- [x] Fixed inbound email to fetch content from Resend API
- [x] Added message polling fallback (30s)
- [x] Added new message indicator
- [x] Fixed Add Ceremony crash (v371)
- [x] Synced code to GitHub repo
- [x] Cleaned up console warnings (v380)
- [x] Fixed middleware Supabase validation error (v382)
- [x] Created Calendar standalone page (v383)
- [x] Created Contracts standalone page (v383)
- [x] Created Payments standalone page
- [x] Created BuildScript standalone page
- [x] Created Marketplace standalone page
- [x] **DATA ISOLATION: Fixed Messages (v384)** - Created MessagesSection with couple selector
- [x] **DATA ISOLATION: Fixed Payments (v384)** - Added couple_id filtering
- [x] **DATA ISOLATION: Fixed Wedding Events (v385)** - CalendarSection filters by couple
- [x] **DATA ISOLATION: Fixed Tasks (v385)** - Created TasksSection + updated AddTaskDialog
- [x] **Fixed all 32 TypeScript errors (v387)** - Clean compile
- [x] **Enabled Realtime on messages, tasks, payments (v387)**

## Remaining Tasks (Optional/Future)
- [ ] Apply RLS policies to Supabase (`.same/RLS-POLICIES.sql`) - **Recommended for database-level protection**
- [ ] Test email reply flow end-to-end
- [ ] Deploy marketplace and test integration

## How to Apply RLS Policies
1. Go to Supabase Dashboard → SQL Editor
2. Open `.same/RLS-POLICIES.sql` 
3. Copy and paste the entire contents
4. Click "Run" to execute
5. Verify with the query at the bottom of the file

## Notes
- Netlify is connected to GitHub repo - no need for Same.new deploy
- Push to `main` branch triggers automatic Netlify deployment
- All 7 standalone section pages have been created and are functional
- **Data isolation is now complete at the application level**
- **RLS policies should still be applied for database-level protection**
- **Realtime is now enabled for messages, tasks, and payments tables**
