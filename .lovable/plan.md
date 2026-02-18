

# Telegram and Email Notifications for Overdue Request Actions

## Overview

When an admin closes or reschedules an overdue travel request, the system will notify the requester via both Telegram (direct message) and email (via Resend). This requires storing Telegram chat IDs for users, creating a new edge function to send notifications, and wiring the close/reschedule mutations to trigger it.

## Prerequisites

Two API keys are needed before implementation:
1. **Telegram Bot Token** -- create a bot via [@BotFather](https://t.me/BotFather) on Telegram and copy the token
2. **Resend API Key** -- sign up at [resend.com](https://resend.com), verify a sending domain, and copy the API key

These will be stored as Supabase secrets (`TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`).

## Changes

### 1. Database Migration

Add a `telegram_chat_id` column to the `profiles` table so each user can link their Telegram account:

```sql
ALTER TABLE profiles ADD COLUMN telegram_chat_id text;
```

### 2. New Edge Function: `send-notification`

A single edge function that accepts a notification payload and sends it via both channels.

**Input:**
```json
{
  "requestId": "uuid",
  "recipientUserId": "uuid",
  "type": "overdue_closed" | "overdue_rescheduled",
  "details": {
    "requestNumber": "TR-2026-0042",
    "route": "HQ -> Airport",
    "reason": "Pickup date passed",
    "newPickupDate": "2026-03-01T09:00:00Z"
  }
}
```

**Logic:**
- Fetch the recipient's profile (email, full_name, telegram_chat_id)
- Send email via Resend API with a formatted HTML message
- If `telegram_chat_id` exists, send a Telegram message via Bot API
- Return success/failure for each channel

### 3. Update `useCloseRequest` and `useRescheduleRequest` Hooks

After the database updates succeed, call the `send-notification` edge function with the appropriate type and details. The notification is fire-and-forget (non-blocking) -- if it fails, the close/reschedule still succeeds and a console warning is logged.

### 4. Telegram Bot Linking (User Settings)

Add a simple flow in user settings or profile to link a Telegram account:
- Display a "Link Telegram" button that shows instructions: "Send /start to our bot @YourBotName"
- Create a small edge function or webhook (`telegram-webhook`) that listens for `/start` messages and maps the Telegram chat ID to the user (via a one-time linking code)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Migration SQL | Create | Add `telegram_chat_id` to `profiles` |
| `supabase/functions/send-notification/index.ts` | Create | Edge function to send Telegram + Resend notifications |
| `supabase/functions/telegram-webhook/index.ts` | Create | Webhook to handle Telegram bot /start and link chat IDs |
| `supabase/config.toml` | Modify | Add config for new edge functions |
| `src/hooks/useRequests.ts` | Modify | Call `send-notification` after close/reschedule |
| `src/components/settings/TelegramLinkSection.tsx` | Create | UI for users to link their Telegram account |
| `src/pages/Settings.tsx` | Modify | Include TelegramLinkSection in settings page |

## Technical Details

### send-notification Edge Function

```typescript
// Resend email
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  body: JSON.stringify({
    from: 'notifications@yourdomain.com',
    to: recipientEmail,
    subject: `Travel Request ${requestNumber} - ${actionLabel}`,
    html: emailTemplate,
  }),
});

// Telegram message
if (telegramChatId) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text: telegramMessage,
      parse_mode: 'HTML',
    }),
  });
}
```

### Telegram Linking Flow

1. User clicks "Link Telegram" in Settings
2. System generates a unique 6-character code, stores it temporarily (in `profiles.telegram_link_code` or a short-lived entry)
3. User sends `/start CODE` to the bot on Telegram
4. The `telegram-webhook` edge function receives the message, looks up the code, and saves the `chat_id` to the user's profile
5. UI confirms linking is complete

### Hook Integration (fire-and-forget)

```typescript
// In useCloseRequest, after successful DB update:
supabase.functions.invoke('send-notification', {
  body: {
    requestId: id,
    recipientUserId: request.requester_id,
    type: 'overdue_closed',
    details: { requestNumber, route, reason },
  },
}).catch(console.warn);
```

### Notification Messages

**Closed (Email subject):** "Travel Request TR-2026-0042 Closed"
**Closed (Body):** "Your travel request TR-2026-0042 (HQ to Airport) has been closed because the pickup date has passed. Reason: [admin's reason]."

**Rescheduled (Email subject):** "Travel Request TR-2026-0042 Rescheduled"
**Rescheduled (Body):** "Your travel request TR-2026-0042 (HQ to Airport) has been rescheduled. New pickup: March 1, 2026 at 9:00 AM."

Telegram messages will use the same content in a concise text format with HTML formatting.

