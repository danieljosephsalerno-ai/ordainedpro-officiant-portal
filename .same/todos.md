# OrdainedPro Portal - Task Tracker

## Current Status (v407)
- ✅ Portal running and working
- ✅ Email sender updated to info@ordainedpro.com
- ✅ Outbound emails working (sending via Resend)
- ✅ Inbound email webhook working
- ✅ Meeting invite emails FIXED (was using localhost:5000)
- ✅ **GitHub sync working** (GitHub Desktop + PowerShell)
- ✅ **Couple-Specific Data** - All menu items isolated per couple
- ✅ **Scripts migrated to server-side** (Apr 28, 2026)

## Server-Side Storage Migration Status

### ✅ COMPLETED - Now using Supabase:
| Item | Table | Status |
|------|-------|--------|
| Messages | `messages` | ✅ Done |
| Tasks | `tasks` | ✅ Done |
| Files | `couple_files` | ✅ Done |
| Meetings | `meetings` | ✅ Done |
| Contracts | `contracts` | ✅ Done |
| Payments | `payments` | ✅ Done |
| **Scripts** | `scripts` | ✅ Done (Apr 28) |

### ⏳ STILL USING localStorage - Need Migration:
| Item | File(s) | Priority |
|------|---------|----------|
| Ceremony Details Form | `CeremonyDetailsForm.tsx`, `AddTaskDialog.tsx` | Medium |
| Officiant Documents | `OfficiantDashboardDialog.tsx` | Medium |
| Public Profile | `OfficiantPublicProfile.tsx` | Low |

## Before Pushing - Run This SQL

**IMPORTANT:** Run `.same/SCRIPTS-TABLE-SCHEMA.sql` in Supabase SQL Editor before deploying!

This creates the `scripts` table with:
- `id`, `user_id`, `couple_id`, `title`, `type`, `status`, `content`, `description`
- Row Level Security policies
- Proper indexes

## Deployment Status
- **GitHub Repo:** danieljosephsalerno-ai/ordainedpro-officiant-portal
- **Netlify:** Auto-deploys from GitHub `main` branch
- **Live Site:** portal.ordainedpro.com
- **Same.new:** Version 407

## Notes
- TypeScript `any` warnings don't block build (CI=false)
- Scripts are per-officiant (optionally linked to couple)
- Auto-save now saves to database instead of localStorage
