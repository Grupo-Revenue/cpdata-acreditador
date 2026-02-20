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
    // Auth check
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

    // Verify user
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
      return new Response(
        JSON.stringify({ error: "template_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get Meta credentials from settings
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
    const wabaId = settingsMap["meta_waba_id"];

    if (!accessToken || !wabaId) {
      return new Response(
        JSON.stringify({
          error:
            "Meta credentials not configured. Please set access token and WABA ID in Settings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get template data
    const { data: template, error: templateError } = await adminClient
      .from("whatsapp_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build Meta API payload
    const components: Record<string, unknown>[] = [];

    // Header
    if (template.header_type === "text" && template.header_text) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: template.header_text,
      });
    } else if (template.header_type === "image" && template.header_image_url) {
      components.push({
        type: "HEADER",
        format: "IMAGE",
        example: { header_handle: [template.header_image_url] },
      });
    }

    // Body
    components.push({ type: "BODY", text: template.body_text });

    // Footer
    if (template.footer_text) {
      components.push({ type: "FOOTER", text: template.footer_text });
    }

    // Buttons
    const buttons = (template.buttons as Array<{
      type: string;
      text: string;
      url?: string;
      phone_number?: string;
    }>) || [];
    if (buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons.map((btn) => {
          if (btn.type === "URL") {
            return { type: "URL", text: btn.text, url: btn.url };
          }
          if (btn.type === "PHONE_NUMBER") {
            return {
              type: "PHONE_NUMBER",
              text: btn.text,
              phone_number: btn.phone_number,
            };
          }
          return { type: "QUICK_REPLY", text: btn.text };
        }),
      });
    }

    const metaPayload = {
      name: template.name,
      language: template.language,
      category: template.category,
      components,
    };

    console.log("Sending to Meta API:", JSON.stringify(metaPayload));

    // Call Meta API
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/message_templates`,
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
    console.log("Meta API response:", JSON.stringify(metaData));

    if (!metaRes.ok) {
      const errorMsg =
        metaData?.error?.message || "Error desconocido de Meta API";
      return new Response(
        JSON.stringify({ error: errorMsg, meta_error: metaData?.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update local template with meta_template_id and status
    const { error: updateError } = await adminClient
      .from("whatsapp_templates")
      .update({
        meta_template_id: metaData.id,
        status: "pending",
      })
      .eq("id", template_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        meta_template_id: metaData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
