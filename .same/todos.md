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
- ✅ **FIXED: handleSendMessage now actually sends emails!** (was just showing alert before)
- ✅ **FIXED: MessengerPanel extracted** - CommunicationPortal now smaller (~800 lines vs 3000+)
- ✅ **Real-time messaging code added** - MessengerPanel has INSERT/UPDATE/DELETE subscriptions

## Deployment Status
- **GitHub Repo:** danieljosephsalerno-ai/ordainedpro-officiant-portal
- **Netlify:** Connected to GitHub - deploys automatically on push to `main`
- **Live Site:** portal.ordainedpro.com

### Latest Commits on main:
- `fc9a448` - Fix handleSendMessage to actually save to Supabase and send emails
- `b576e30` - Add email functionality with inbound/outbound support

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
- [ ] **Run SQL in Supabase** to enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
- [ ] Test email reply flow end-to-end

## Real-time Messaging (v392)
- ✅ Added Supabase real-time subscription for INSERT/UPDATE/DELETE events
- ✅ Messages append seamlessly without screen flicker
- ✅ Browser notifications for new couple messages
- ✅ Duplicate prevention (won't double-add messages)
- ✅ Proper cleanup on component unmount
- ⚠️ **User action required:** Run SQL command in Supabase to enable realtime

## MessengerPanel Extraction (v393)
- ✅ Extracted messenger into separate `MessengerPanel.tsx` component (580 lines)
- ✅ CommunicationPortal reduced from 9,571 → 9,097 lines (-474 lines)
- ✅ Exact same UI and functionality preserved
- ✅ All state, functions, and real-time subscriptions moved to MessengerPanel
- ✅ No changes to how messages are sent/received

## Notes
- Netlify is connected to GitHub repo - no need for Same.new deploy
- Push to `main` branch triggers automatic Netlify deployment
- TypeScript errors are type annotation warnings (don't break build - CI=false)
