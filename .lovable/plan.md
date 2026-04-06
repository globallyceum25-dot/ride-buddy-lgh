

# Set Up TELEGRAM_WEBHOOK_SECRET and Reconfigure Webhook

The `telegram-webhook` edge function already checks `X-Telegram-Bot-Api-Secret-Token` against `TELEGRAM_WEBHOOK_SECRET` (lines 16-24). Two things remain:

## Steps

### 1. Add the `TELEGRAM_WEBHOOK_SECRET` secret
Use the secrets tool to add a new secret called `TELEGRAM_WEBHOOK_SECRET` with a strong random value (e.g., a 64-char hex string). This will be used by both Telegram and the edge function to validate requests.

### 2. Reconfigure the Telegram webhook with `secret_token`
Call the Telegram `setWebhook` API to re-register the webhook URL with the `secret_token` parameter matching the secret we just stored. This can be done via a one-time script:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jqnxbckdxvfkjyhrfthp.supabase.co/functions/v1/telegram-webhook",
    "secret_token": "<THE_SAME_SECRET_VALUE>"
  }'
```

The `TELEGRAM_BOT_TOKEN` is already in Supabase secrets, so we'll fetch it and use it in the script. No code changes are needed since the edge function already validates the header.

### Files to modify
None — only secret addition and a one-time API call.

