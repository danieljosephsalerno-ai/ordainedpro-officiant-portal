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
- ✅ **DATA ISOLATION FIXES** - Fixed hardcoded couple_id issues (see below)

## Data Isolation Fixes (Completed)
Fixed cross-couple data pollution within the same officiant's account:

| Component | Issue Fixed |
|-----------|-------------|
| `AddTaskDialog.tsx` | Removed hardcoded `coupleId = 1`, now uses prop or localStorage |
| `ContractUploadDialog.tsx` | Removed hardcoded `coupleId = 1`, now uses prop or localStorage |
| `ScheduleMeetingDialog.tsx` | Removed hardcoded `coupleId = 1`, now uses prop or localStorage |
| `CalendarSection.tsx` | Removed `couple_id: null`, now reads from localStorage |

**New utility module:** `src/lib/couple-utils.ts` - Centralized couple ID management

**Note:** All components now validate that a couple is selected before creating records.
If no couple is selected, user sees: "⚠️ Please select a couple before..."

## Standalone Sections (Completed)
Extracted from CommunicationPortal into their own pages:

| Feature | Status | Route | Component |
|---------|--------|-------|-----------|
| Calendar | ✅ DONE | `/calendar` | `CalendarSection.tsx` |
| Contracts | ✅ DONE | `/contracts` | `ContractsSection.tsx` |
| Payments | ✅ DONE | `/payments` | `PaymentsSection.tsx` |
| BuildScript (Mr. Script) | ✅ DONE | `/buildscript` | `BuildScriptSection.tsx` |
| Marketplace | ✅ DONE | `/marketplace` | `MarketplaceSection.tsx` |

## Deployment Status
- **GitHub Repo:** danieljosephsalerno-ai/ordainedpro-officiant-portal
- **Netlify:** Connected to GitHub - deploys automatically on push to `main`
- **Live Site:** portal.ordainedpro.com

## ⏸️ PAUSED - Tasks on hold per user request

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
- [x] **Fixed data isolation - removed hardcoded couple_id values**
- [x] **Created couple-utils.ts for centralized couple ID management**

## Remaining Tasks (Paused)
- [ ] Enable realtime on messages table in Supabase
- [ ] Test email reply flow end-to-end
- [ ] Fix TypeScript type annotations (non-breaking)
- [ ] Deploy marketplace and test integration

## Notes
- Netlify is connected to GitHub repo - no need for Same.new deploy
- Push to `main` branch triggers automatic Netlify deployment
- All 5 standalone section pages have been created and are functional
- **Data isolation is now enforced at application level for couple-specific data**
