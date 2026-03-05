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
  fecha_nacimiento?: string;
  semestre?: string;
  disponibilidad_horaria?: string;
  comuna?: string;
  instagram?: string;
  facebook?: string;
  talla_polera?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_email?: string;
  contacto_emergencia_telefono?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

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

    const body: CreateUserRequest = await req.json();
    const {
      email, password, rut, nombre, apellido, telefono,
      referencia_contacto, approval_status = "approved", roles = [],
      idioma, altura, universidad, carrera, banco, numero_cuenta, tipo_cuenta,
      fecha_nacimiento, semestre, disponibilidad_horaria, comuna,
      instagram, facebook, talla_polera,
      contacto_emergencia_nombre, contacto_emergencia_email, contacto_emergencia_telefono,
    } = body;

    if (!email || !password || !rut || !nombre || !apellido || !telefono) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Normalize RUT for comparison - clean both sides
    const cleanedRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    // Check for existing RUT by fetching all profiles and comparing cleaned versions
    const { data: allProfiles } = await adminClient
      .from("profiles").select("id, rut");
    
    const existingRut = (allProfiles || []).find(p => 
      p.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanedRut
    );

    if (existingRut) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con este RUT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { rut, nombre, apellido, telefono, referencia_contacto: referencia_contacto || null },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = newUser.user.id;

    // Build profile update with all optional fields
    const profileUpdate: Record<string, unknown> = {};
    if (approval_status === "approved") profileUpdate.approval_status = "approved";
    if (idioma) profileUpdate.idioma = idioma;
    if (altura) profileUpdate.altura = altura;
    if (universidad) profileUpdate.universidad = universidad;
    if (carrera) profileUpdate.carrera = carrera;
    if (banco) profileUpdate.banco = banco;
    if (numero_cuenta) profileUpdate.numero_cuenta = numero_cuenta;
    if (tipo_cuenta) profileUpdate.tipo_cuenta = tipo_cuenta;
    if (fecha_nacimiento) profileUpdate.fecha_nacimiento = fecha_nacimiento;
    if (semestre) profileUpdate.semestre = semestre;
    if (disponibilidad_horaria) profileUpdate.disponibilidad_horaria = disponibilidad_horaria;
    if (comuna) profileUpdate.comuna = comuna;
    if (instagram) profileUpdate.instagram = instagram;
    if (facebook) profileUpdate.facebook = facebook;
    if (talla_polera) profileUpdate.talla_polera = talla_polera;
    if (contacto_emergencia_nombre) profileUpdate.contacto_emergencia_nombre = contacto_emergencia_nombre;
    if (contacto_emergencia_email) profileUpdate.contacto_emergencia_email = contacto_emergencia_email;
    if (contacto_emergencia_telefono) profileUpdate.contacto_emergencia_telefono = contacto_emergencia_telefono;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await adminClient
        .from("profiles").update(profileUpdate).eq("id", newUserId);
      if (updateError) console.error("Error updating profile:", updateError);
    }

    if (roles.length > 0) {
      const roleInserts = roles.map((role) => ({ user_id: newUserId, role }));
      const { error: rolesError } = await adminClient.from("user_roles").insert(roleInserts);
      if (rolesError) console.error("Error assigning roles:", rolesError);
    }

    return new Response(
      JSON.stringify({ success: true, user: { id: newUserId, email: newUser.user.email } }),
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
