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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { dealId, properties } = await req.json();

    if (!dealId || typeof dealId !== "string") {
      return new Response(
        JSON.stringify({ error: "dealId es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove read-only fields
    const editableProperties = { ...properties };
    delete editableProperties.dealname;
    delete editableProperties.dealstage;

    // Get HubSpot token
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: setting, error: settingError } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "hubspot_token")
      .maybeSingle();

    if (settingError || !setting?.value) {
      return new Response(
        JSON.stringify({ error: "hubspot_not_configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hubspotToken = setting.value;

    // Update deal in HubSpot
    const hubspotRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${encodeURIComponent(dealId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties: editableProperties }),
      }
    );

    if (!hubspotRes.ok) {
      const errBody = await hubspotRes.text();
      console.error("HubSpot update error:", errBody);
      return new Response(
        JSON.stringify({ error: "Error al actualizar en HubSpot", details: errBody }),
        { status: hubspotRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updatedDeal = await hubspotRes.json();

    return new Response(
      JSON.stringify({ success: true, deal: updatedDeal }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
