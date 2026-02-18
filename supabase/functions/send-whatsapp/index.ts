// supabase/functions/send-whatsapp/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { phone, message, imageUrls } = await req.json();

    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    const PHONE_NUMBER_ID = Deno.env.get("PHONE_NUMBER_ID");

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return new Response(
        JSON.stringify({ error: "Missing WhatsApp credentials" }),
        { status: 500 }
      );
    }

    // 1️⃣ Send Text Message
    await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    // 2️⃣ Send Images (actual media)
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        await fetch(
          `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "image",
              image: {
                link: imageUrl,
              },
            }),
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
