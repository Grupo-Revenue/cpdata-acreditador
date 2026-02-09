import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get HubSpot token from settings
    const { data: setting, error: settingError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "hubspot_token")
      .maybeSingle();

    if (settingError) {
      throw new Error(`Error reading settings: ${settingError.message}`);
    }

    if (!setting?.value) {
      return new Response(
        JSON.stringify({ error: "hubspot_not_configured", deals: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hubspotToken = setting.value;

    // Search deals in HubSpot
    const searchBody = {
      filterGroups: [
        {
          filters: [
            { propertyName: "pipeline", operator: "EQ", value: "755372600" },
            { propertyName: "dealstage", operator: "EQ", value: "1098991990" },
          ],
        },
      ],
      properties: [
        "dealname",
        "nombre_del_evento",
        "tipo_de_evento",
        "cantidad_de_asistentes",
        "locacion_del_evento",
        "hora_de_inicio_y_fin_del_evento",
        "fecha_inicio_del_evento",
        "fecha_fin_del_evento",
        "dealstage",
      ],
      limit: 100,
    };

    const hubspotRes = await fetch(
      "https://api.hubapi.com/crm/v3/objects/deals/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchBody),
      }
    );

    if (!hubspotRes.ok) {
      const errorBody = await hubspotRes.text();
      console.error(`HubSpot API error [${hubspotRes.status}]: ${errorBody}`);
      throw new Error(`HubSpot API error: ${hubspotRes.status}`);
    }

    const hubspotData = await hubspotRes.json();

    const deals = (hubspotData.results || []).map((deal: any) => ({
      id: deal.id,
      ...deal.properties,
    }));

    return new Response(JSON.stringify({ deals }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in hubspot-deals:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
