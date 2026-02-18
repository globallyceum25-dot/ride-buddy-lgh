

# Update Resend Sender Email to Verified Domain

## Summary

Change the sender email in the `send-notification` edge function from the Resend test address to your verified production domain.

## Change

**File:** `supabase/functions/send-notification/index.ts`

**Line 100** -- update the `from` field:

- **Before:** `"Travel System <onboarding@resend.dev>"`
- **After:** `"Travel System <noreply@lyceumglobal.co>"`

This is a single-line change. No other files need to be modified.

## Prerequisite

Make sure the domain `lyceumglobal.co` is fully verified in your [Resend dashboard](https://resend.com/domains). The current logs show a 403 error because the test domain can only send to your own email -- this change will resolve that.

