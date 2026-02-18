

# Set Up Telegram Webhook

## What needs to happen

The Telegram Bot API needs to be told where to send incoming messages. This is done by calling the `setWebhook` endpoint once with the URL of our `telegram-webhook` edge function.

## Approach

Create a small one-time-use edge function called `setup-telegram-webhook` that:

1. Reads the `TELEGRAM_BOT_TOKEN` from Supabase secrets
2. Calls `https://api.telegram.org/bot<TOKEN>/setWebhook` with the URL set to `https://jqnxbckdxvfkjyhrfthp.supabase.co/functions/v1/telegram-webhook`
3. Returns the Telegram API response so we can confirm it worked

After calling it once to register the webhook, we can delete the function since it's no longer needed.

## Technical Details

### New file: `supabase/functions/setup-telegram-webhook/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/telegram-webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: WEBHOOK_URL }),
    }
  );

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

### Modify: `supabase/config.toml`

Add entry for the new function with `verify_jwt = false`.

### Steps after deployment

1. Deploy the function
2. Call it once via the edge function curl tool
3. Confirm Telegram returns `{"ok": true, "result": true}`
4. Delete the function since it's no longer needed

