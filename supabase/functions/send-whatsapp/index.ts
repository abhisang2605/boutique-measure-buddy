// supabase/functions/send-whatsapp/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, imageUrls } = await req.json();

    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    const PHONE_NUMBER_ID = Deno.env.get("PHONE_NUMBER_ID");

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return new Response(
        JSON.stringify({ error: "Missing WhatsApp credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1️⃣ Send Text Message
    const textResponse = await fetch(
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
          text: { body: message },
        }),
      }
    );

    const textResult = await textResponse.json();
    console.log("META RESPONSE (text):", JSON.stringify(textResult));

    if (!textResponse.ok) {
      return new Response(
        JSON.stringify(textResult),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ Send Images (actual media)
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        const imageResponse = await fetch(
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

        const imageResult = await imageResponse.json();
        console.log("META RESPONSE (image):", JSON.stringify(imageResult));

        if (!imageResponse.ok) {
          return new Response(
            JSON.stringify(imageResult),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.log("EDGE FUNCTION ERROR:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
