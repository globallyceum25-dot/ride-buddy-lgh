import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  recipientUserId: string;
  type: "overdue_closed" | "overdue_rescheduled" | "allocation_assigned" | "trip_dispatched" | "trip_in_progress" | "approval_requested" | "immediate_allocation";
  details: {
    requestNumber: string;
    route: string;
    reason?: string;
    newPickupDate?: string;
    vehicleInfo?: string;
    driverName?: string;
    pickupDatetime?: string;
    requesterName?: string;
    purpose?: string;
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

    // Build messages based on type
    let subject: string;
    let bodyText: string;

    if (type === "allocation_assigned") {
      subject = `Travel Request ${details.requestNumber} - Vehicle & Driver Assigned`;
      const pickupStr = details.pickupDatetime
        ? new Date(details.pickupDatetime).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "TBD";
      bodyText = `Your travel request ${details.requestNumber} (${details.route}) has been assigned.\n\nVehicle: ${details.vehicleInfo || "N/A"}\nDriver: ${details.driverName || "N/A"}\nPickup: ${pickupStr}`;
    } else if (type === "trip_dispatched") {
      subject = `Travel Request ${details.requestNumber} - Trip Dispatched`;
      const pickupStr = details.pickupDatetime
        ? new Date(details.pickupDatetime).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "TBD";
      bodyText = `Your travel request ${details.requestNumber} (${details.route}) has been dispatched. Vehicle ${details.vehicleInfo || "N/A"} and driver ${details.driverName || "N/A"} are on their way.\n\nPickup: ${pickupStr}`;
    } else if (type === "trip_in_progress") {
      subject = `Travel Request ${details.requestNumber} - Trip In Progress`;
      bodyText = `Your travel request ${details.requestNumber} (${details.route}) is now in progress.`;
    } else if (type === "approval_requested") {
      subject = `Travel Request ${details.requestNumber} - Approval Required`;
      const pickupStr = details.pickupDatetime
        ? new Date(details.pickupDatetime).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "TBD";
      bodyText = `A new travel request ${details.requestNumber} requires your approval.\n\nRoute: ${details.route}\nRequester: ${details.requesterName || "N/A"}\nPickup: ${pickupStr}\nPurpose: ${details.purpose || "N/A"}`;
    } else if (type === "immediate_allocation") {
      subject = `Travel Request ${details.requestNumber} - Immediate Allocation Required`;
      const pickupStr = details.pickupDatetime
        ? new Date(details.pickupDatetime).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "TBD";
      bodyText = `An immediate travel request ${details.requestNumber} requires allocation.\n\nRoute: ${details.route}\nRequester: ${details.requesterName || "N/A"}\nPickup: ${pickupStr}\nPurpose: ${details.purpose || "N/A"}`;
    } else {
      const isClose = type === "overdue_closed";
      const actionLabel = isClose ? "Closed" : "Rescheduled";
      subject = `Travel Request ${details.requestNumber} ${actionLabel}`;

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
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">${subject}</h2>
        <p>Hi ${profile.full_name},</p>
        <p>${bodyText.replace(/\n/g, "<br/>")}</p>
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
      let telegramText: string;
        if (type === "allocation_assigned" || type === "trip_dispatched") {
          const pickupStr = details.pickupDatetime ? new Date(details.pickupDatetime).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "TBD";
          const emoji = type === "allocation_assigned" ? "🚗" : "🚀";
          telegramText = `<b>${emoji} ${subject}</b>\n\n<b>Route:</b> ${details.route}\n<b>Vehicle:</b> ${details.vehicleInfo || "N/A"}\n<b>Driver:</b> ${details.driverName || "N/A"}\n<b>Pickup:</b> ${pickupStr}`;
        } else if (type === "trip_in_progress") {
          telegramText = `<b>🏁 ${subject}</b>\n\n${bodyText}`;
        } else if (type === "approval_requested") {
          const pickupStr = details.pickupDatetime ? new Date(details.pickupDatetime).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "TBD";
          telegramText = `<b>📋 ${subject}</b>\n\n<b>Route:</b> ${details.route}\n<b>Requester:</b> ${details.requesterName || "N/A"}\n<b>Pickup:</b> ${pickupStr}\n<b>Purpose:</b> ${details.purpose || "N/A"}`;
        } else if (type === "immediate_allocation") {
          const pickupStr = details.pickupDatetime ? new Date(details.pickupDatetime).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "TBD";
          telegramText = `<b>⚡ ${subject}</b>\n\n<b>Route:</b> ${details.route}\n<b>Requester:</b> ${details.requesterName || "N/A"}\n<b>Pickup:</b> ${pickupStr}\n<b>Purpose:</b> ${details.purpose || "N/A"}`;
        } else {
          telegramText = `<b>🚗 ${subject}</b>\n\n${bodyText}`;
        }
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
