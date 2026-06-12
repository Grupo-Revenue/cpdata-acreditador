import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { template_name, template_language, to_phone, components, parameters } = await req.json();

    if (!template_name || !to_phone) {
      return new Response(
        JSON.stringify({ error: "template_name and to_phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number: remove non-numeric chars and leading +
    const cleanPhone = to_phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read Meta credentials from settings
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["meta_access_token", "meta_phone_number_id"]);

    if (settingsError) throw settingsError;

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    const accessToken = settingsMap.meta_access_token;
    const phoneNumberId = settingsMap.meta_phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "Meta credentials not configured. Go to Settings > Integrations." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build components: use explicit parameters if provided, fall back to legacy components
    let templateComponents = components || [];
    if (parameters && Array.isArray(parameters) && parameters.length > 0) {
      templateComponents = [
        {
          type: "body",
          parameters: parameters.map((val: string) => ({ type: "text", text: val })),
        },
      ];
    }

    const metaPayload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: template_name,
        language: { code: template_language || "es" },
        components: templateComponents,
      },
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error("Meta API error:", JSON.stringify(metaData));
      const code = metaData?.error?.code;
      const subcode = metaData?.error?.error_subcode;
      let errorMsg = metaData?.error?.message || "Unknown Meta API error";

      // OAuthException code 1 = token inválido/expirado o permisos insuficientes
      if (metaData?.error?.type === "OAuthException" && (code === 1 || code === 190)) {
        errorMsg =
          "El access token de Meta es inválido o ha expirado. Actualízalo en Configuración > Integraciones > Meta WhatsApp.";
      } else if (code === 131026) {
        errorMsg = "El destinatario no puede recibir mensajes (no tiene WhatsApp o número inválido).";
      } else if (code === 132000 || code === 132001 || subcode === 2494072) {
        errorMsg = "La plantilla no está aprobada o el número de variables no coincide.";
      }

      // Return 200 so supabase.functions.invoke does NOT throw → no blank screen.
      return new Response(
        JSON.stringify({ error: errorMsg, meta_error: metaData?.error }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message_id: metaData?.messages?.[0]?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-whatsapp-message error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
