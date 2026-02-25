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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is superadmin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Use service role client for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is superadmin
    const { data: callerRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "superadmin");

    if (rolesError || !callerRoles?.length) {
      return new Response(
        JSON.stringify({ error: "Solo superadmins pueden eliminar usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (user_id === callerId) {
      return new Response(
        JSON.stringify({ error: "No puedes eliminarte a ti mismo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cascading deletion in correct order

    // 1. Get attendance_record IDs for this user to delete comments
    const { data: attendanceRecords } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("user_id", user_id);

    if (attendanceRecords?.length) {
      const recordIds = attendanceRecords.map((r) => r.id);
      await supabase
        .from("attendance_comments")
        .delete()
        .in("attendance_record_id", recordIds);
    }

    // Also delete comments created by this user
    await supabase.from("attendance_comments").delete().eq("created_by", user_id);

    // 2. Attendance records
    await supabase.from("attendance_records").delete().eq("user_id", user_id);

    // 3. Digital signatures
    await supabase.from("digital_signatures").delete().eq("user_id", user_id);

    // 4. Event expenses (as user or creator)
    await supabase.from("event_expenses").delete().eq("user_id", user_id);
    await supabase.from("event_expenses").delete().eq("created_by", user_id);

    // 5. Invoices
    await supabase.from("invoices").delete().eq("user_id", user_id);

    // 6. Event accreditors
    await supabase.from("event_accreditors").delete().eq("user_id", user_id);

    // 7. Support tickets
    await supabase.from("support_tickets").delete().eq("created_by", user_id);

    // 8. User roles
    await supabase.from("user_roles").delete().eq("user_id", user_id);

    // 9. Profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (profileError) {
      throw new Error(`Error deleting profile: ${profileError.message}`);
    }

    // 10. Delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
    if (authError) {
      throw new Error(`Error deleting auth user: ${authError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuario eliminado completamente" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-user:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
