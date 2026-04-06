import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !SUPABASE_URL) {
    return new Response(JSON.stringify({ error: "Missing required secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: TELEGRAM_WEBHOOK_SECRET,
      }),
    }
  );

  const result = await response.json();

  return new Response(JSON.stringify({ webhookUrl, telegramResponse: result }), {
    headers: { "Content-Type": "application/json" },
  });
});
