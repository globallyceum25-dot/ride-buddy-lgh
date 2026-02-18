import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  recipientUserId: string;
  type: "overdue_closed" | "overdue_rescheduled";
  details: {
    requestNumber: string;
    route: string;
    reason?: string;
    newPickupDate?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: NotificationPayload = await req.json();
    const { recipientUserId, type, details } = payload;

    // Fetch recipient profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, telegram_chat_id")
      .eq("user_id", recipientUserId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Recipient profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email: boolean; telegram: boolean } = {
      email: false,
      telegram: false,
    };

    // Build messages
    const isClose = type === "overdue_closed";
    const actionLabel = isClose ? "Closed" : "Rescheduled";
    const subject = `Travel Request ${details.requestNumber} ${actionLabel}`;

    let bodyText: string;
    if (isClose) {
      bodyText = `Your travel request ${details.requestNumber} (${details.route}) has been closed because the pickup date has passed. Reason: ${details.reason || "N/A"}.`;
    } else {
      const dateStr = details.newPickupDate
        ? new Date(details.newPickupDate).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "TBD";
      bodyText = `Your travel request ${details.requestNumber} (${details.route}) has been rescheduled. New pickup: ${dateStr}.`;
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Travel Request ${actionLabel}</h2>
        <p>Hi ${profile.full_name},</p>
        <p>${bodyText}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">This is an automated notification from your Travel Management System.</p>
      </div>
    `;

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Travel System <noreply@lyceumglobal.co>",
            to: profile.email,
            subject,
            html: emailHtml,
          }),
        });
        results.email = emailRes.ok;
        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.error("Resend error:", errBody);
        }
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }

    // Send Telegram message
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (TELEGRAM_BOT_TOKEN && profile.telegram_chat_id) {
      try {
        const telegramText = `<b>🚗 ${subject}</b>\n\n${bodyText}`;
        const tgRes = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: profile.telegram_chat_id,
              text: telegramText,
              parse_mode: "HTML",
            }),
          }
        );
        results.telegram = tgRes.ok;
        if (!tgRes.ok) {
          const errBody = await tgRes.text();
          console.error("Telegram error:", errBody);
        }
      } catch (e) {
        console.error("Telegram send failed:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
