import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const update = await req.json();
    const message = update?.message;

    if (!message?.text || !message?.chat?.id) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

    // Handle /start CODE command
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const code = parts[1]?.trim();

      if (!code) {
        await sendTelegram(
          TELEGRAM_BOT_TOKEN,
          chatId,
          "👋 Welcome! Please use the linking code from your Settings page.\n\nSend: /start YOUR_CODE"
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by link code
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("telegram_link_code", code.toUpperCase())
        .single();

      if (error || !profile) {
        await sendTelegram(
          TELEGRAM_BOT_TOKEN,
          chatId,
          "❌ Invalid or expired linking code. Please generate a new one from Settings."
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Link the chat ID and clear the code
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          telegram_chat_id: chatId,
          telegram_link_code: null,
        })
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error("Failed to link Telegram:", updateError);
        await sendTelegram(
          TELEGRAM_BOT_TOKEN,
          chatId,
          "❌ Something went wrong. Please try again."
        );
      } else {
        await sendTelegram(
          TELEGRAM_BOT_TOKEN,
          chatId,
          `✅ Successfully linked! Hi ${profile.full_name}, you'll now receive travel request notifications here.`
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("telegram-webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendTelegram(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}
