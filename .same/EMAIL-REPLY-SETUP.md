# Email Reply Setup Guide

This guide explains how to set up email replies so couples can respond to your messages and see them in the portal.

## How It Works

1. You send a message to a couple from the portal
2. The email is sent with `reply_to: reply@ordainedpro.com`
3. When the couple replies, Resend forwards it to your webhook
4. The webhook (`/api/inbound-email`) saves the reply to the database
5. The reply appears in your portal's Messages tab

## Setup Steps

### Step 1: Configure Resend Inbound Emails

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click on your domain (`ordainedpro.com`)
3. Go to **Inbound** tab
4. Click **Add Inbound Email**
5. Configure:
   - **Subdomain**: `reply` (for `reply@ordainedpro.com`)
   - **Webhook URL**: `https://your-netlify-site.netlify.app/api/inbound-email`
   - **Enabled**: Yes

### Step 2: Add DNS Records

Resend will provide MX records to add to your domain:

```
Type: MX
Name: reply (or @ if using root domain)
Value: inbound.resend.com
Priority: 10
TTL: 3600
```

### Step 3: Add Environment Variable (Optional)

If you want extra security, add a webhook secret:

```
RESEND_WEBHOOK_SECRET=your-webhook-secret
```

Then update the `/api/inbound-email/route.ts` to verify the signature.

### Step 4: Test the Setup

1. Send a message to yourself from the portal
2. Reply to the email
3. Check the portal - your reply should appear!

## Troubleshooting

### Replies Not Appearing?

1. **Check Netlify Function Logs**: Go to Netlify > Functions > inbound-email
2. **Verify DNS Records**: Use `dig MX reply.ordainedpro.com` to check
3. **Check Resend Dashboard**: Look for inbound email events
4. **Verify Couple Email**: The sender email must match bride_email or groom_email in the database

### Common Issues

- **"No matching couple found"**: The sender email doesn't match any couple in the database
- **Empty replies**: The webhook filters out quoted content, so very short replies might be ignored
- **Webhook timeout**: Netlify functions have a 10-second timeout by default

## Email Flow Diagram

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Officiant      │────▶│   Resend     │────▶│   Couple's      │
│  Portal         │     │   (send)     │     │   Inbox         │
└─────────────────┘     └──────────────┘     └─────────────────┘
        ▲                                            │
        │                                            │ Reply
        │                                            ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Supabase      │◀────│   Webhook    │◀────│   Resend        │
│   Database      │     │  /api/inbound│     │   (inbound)     │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

## Current Configuration

- **From Address**: `info@ordainedpro.com`
- **Reply-To Address**: `reply@ordainedpro.com`
- **Webhook URL**: `/api/inbound-email`

## Need Help?

Contact Same support at support@same.new
