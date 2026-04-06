Deno.serve(async () => {
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

  if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL) {
    return new Response(JSON.stringify({ error: "Missing required secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Generate a safe alphanumeric secret (Telegram only allows A-Za-z0-9_-)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  const secret = Array.from(array, b => chars[b % chars.length]).join("");

  const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
      }),
    }
  );

  const result = await response.json();

  return new Response(JSON.stringify({ 
    webhookUrl, 
    telegramResponse: result,
    generatedSecret: secret,
    instruction: "Copy the generatedSecret value and update the TELEGRAM_WEBHOOK_SECRET in Supabase secrets"
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
