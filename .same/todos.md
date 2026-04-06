# OrdainedPro Portal - Task Tracker

## Current Status
- ✅ Portal running and working
- ✅ Email sender updated to info@ordainedpro.com
- ✅ Marketplace schema created (SAFE-MARKETPLACE-SCHEMA.sql)
- ✅ Outbound emails working (sending via Resend)
- ✅ Inbound email webhook FIXED (now fetches content from Resend API)
- ✅ Auto-refresh for messages (real-time + 30s polling fallback)
- ⚠️ Need to deploy changes to portal.ordainedpro.com

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

## To Enable Email Replies from Couples

1. **Go to Resend Dashboard** → https://resend.com/domains
2. Webhook is already configured at: `https://portal.ordainedpro.com/api/inbound-email`
3. ✅ Webhook is receiving events (Success status)
4. ⚠️ Need to deploy updated code to fix empty content issue

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

## Pending - Deployment Needed
- [ ] **Deploy updated inbound-email handler to portal.ordainedpro.com**
- [ ] Enable realtime on messages table in Supabase
- [ ] Test email reply flow end-to-end

## Notes
- The Netlify build log shows successful compilation
- TypeScript errors are type annotation warnings (don't break build)
- The critical fix is running the SQL to add couple_id column
