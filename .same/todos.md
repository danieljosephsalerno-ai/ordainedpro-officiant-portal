# OrdainedPro Portal - Task Tracker

## Current Status
- ✅ Portal running and working
- ✅ Email sender updated to info@ordainedpro.com
- ✅ Marketplace schema created (SAFE-MARKETPLACE-SCHEMA.sql)
- ✅ Outbound emails working (sending via Resend)
- ✅ Inbound email webhook FIXED (now fetches content from Resend API)
- ✅ Auto-refresh for messages (real-time + 30s polling fallback)
- ✅ **FIXED: Add Ceremony crash** (onAddCeremony callback now properly called)
- ✅ **Code synced to GitHub** - Netlify deploys automatically from `main` branch
- ✅ **FIXED: CommunicationPortal restored from backup** (v390)

## Deployment Status
- **GitHub Repo:** danieljosephsalerno-ai/ordainedpro-officiant-portal
- **Netlify:** Connected to GitHub - deploys automatically on push to `main`
- **Live Site:** portal.ordainedpro.com

### Latest Commit on main:
- `5ca5bab` - Fix: Add null checks for brideName/groomName.split() calls

## To Check Deployment:
1. Visit https://portal.ordainedpro.com
2. Or check Netlify dashboard for build status

## Message Auto-Refresh Features
- ✅ Real-time subscription to messages table (Supabase)
- ✅ Polling fallback every 30 seconds
- ✅ New message indicator with count
- ✅ Browser notifications when couple replies
- ✅ Manual refresh button
- ⚠️ **Requires:** Enable realtime on messages table in Supabase

### Enable Real-time (Run in Supabase SQL Editor):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

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
- [x] **Fixed Add Ceremony crash (v371)**
- [x] **Synced code to GitHub repo**

## Remaining Tasks
- [ ] Enable realtime on messages table in Supabase
- [ ] Test email reply flow end-to-end

## Notes
- Netlify is connected to GitHub repo - no need for Same.new deploy
- Push to `main` branch triggers automatic Netlify deployment
- TypeScript errors are type annotation warnings (don't break build - CI=false)
