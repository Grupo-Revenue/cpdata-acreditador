import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  referencia_contacto?: string;
  approval_status?: "pending" | "approved";
  roles?: string[];
  idioma?: string;
  altura?: string;
  universidad?: string;
  carrera?: string;
  banco?: string;
  numero_cuenta?: string;
  tipo_cuenta?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're a superadmin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is superadmin using the has_role function
    const { data: isSuperadmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: userId,
      _role: "superadmin",
    });

    if (roleError || !isSuperadmin) {
      return new Response(
        JSON.stringify({ error: "Solo los superadministradores pueden crear usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const {
      email,
      password,
      rut,
      nombre,
      apellido,
      telefono,
      referencia_contacto,
      approval_status = "approved",
      roles = [],
      idioma,
      altura,
      universidad,
      carrera,
      banco,
      numero_cuenta,
      tipo_cuenta,
    } = body;

    // Validate required fields
    if (!email || !password || !rut || !nombre || !apellido || !telefono) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for user creation
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if RUT already exists
    const { data: existingRut } = await adminClient
      .from("profiles")
      .select("id")
      .eq("rut", rut)
      .maybeSingle();

    if (existingRut) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con este RUT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user with metadata (trigger will create profile)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        rut,
        nombre,
        apellido,
        telefono,
        referencia_contacto: referencia_contacto || null,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = newUser.user.id;

    // Update profile with approval_status and additional fields
    const profileUpdate: Record<string, unknown> = {};
    if (approval_status === "approved") profileUpdate.approval_status = "approved";
    if (idioma) profileUpdate.idioma = idioma;
    if (altura) profileUpdate.altura = altura;
    if (universidad) profileUpdate.universidad = universidad;
    if (carrera) profileUpdate.carrera = carrera;
    if (banco) profileUpdate.banco = banco;
    if (numero_cuenta) profileUpdate.numero_cuenta = numero_cuenta;
    if (tipo_cuenta) profileUpdate.tipo_cuenta = tipo_cuenta;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await adminClient
        .from("profiles")
        .update(profileUpdate)
        .eq("id", newUserId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    }

    // Assign roles if specified
    if (roles.length > 0) {
      const roleInserts = roles.map((role) => ({
        user_id: newUserId,
        role,
      }));

      const { error: rolesError } = await adminClient
        .from("user_roles")
        .insert(roleInserts);

      if (rolesError) {
        console.error("Error assigning roles:", rolesError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUserId,
          email: newUser.user.email,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
