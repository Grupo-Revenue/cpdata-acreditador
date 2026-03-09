import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STATUS_MAP: Record<string, string> = {
  APPROVED: "approved",
  REJECTED: "rejected",
  PENDING: "pending",
  IN_APPEAL: "pending",
};

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { template_id } = await req.json();
    if (!template_id) {
      return new Response(JSON.stringify({ error: "template_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get Meta credentials
    const { data: settings, error: settingsError } = await adminClient
      .from("settings")
      .select("key, value")
      .in("key", ["meta_access_token", "meta_waba_id"]);
    if (settingsError) throw settingsError;

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string | null }) => {
      if (s.value) settingsMap[s.key] = s.value;
    });

    const accessToken = settingsMap["meta_access_token"];
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Meta access token not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get template
    const { data: template, error: templateError } = await adminClient
      .from("whatsapp_templates")
      .select("meta_template_id, status")
      .eq("id", template_id)
      .single();
    if (templateError || !template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!template.meta_template_id) {
      return new Response(
        JSON.stringify({ error: "Template has not been submitted to Meta yet." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Query Meta API
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${template.meta_template_id}?fields=status,name,category,rejected_reason`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const metaData = await metaRes.json();
    console.log("Meta status response:", JSON.stringify(metaData));

    if (!metaRes.ok) {
      return new Response(
        JSON.stringify({ error: metaData?.error?.message || "Meta API error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newStatus = STATUS_MAP[metaData.status] || "pending";
    const rejectionReason = newStatus === "rejected" ? (metaData.rejected_reason || null) : null;

    // Update local status
    const { error: updateError } = await adminClient
      .from("whatsapp_templates")
      .update({ status: newStatus, rejection_reason: rejectionReason })
      .eq("id", template_id);
    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, status: newStatus, meta_status: metaData.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
