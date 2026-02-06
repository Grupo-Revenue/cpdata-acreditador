import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserData {
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  email: string;
}

interface CreateUsersRequest {
  users: UserData[];
}

interface UserResult {
  email: string;
  success: boolean;
  password?: string;
  error?: string;
}

/**
 * Genera una contraseña temporal segura
 */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%&*';
  let password = '';
  
  // 8 caracteres alfanuméricos
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 1 caracter especial
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // 2 números adicionales
  for (let i = 0; i < 2; i++) {
    password += Math.floor(Math.random() * 10).toString();
  }
  
  return password;
}

/**
 * Limpia un RUT de caracteres no numéricos (excepto K)
 */
function cleanRUT(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
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
        JSON.stringify({ error: "Solo los superadministradores pueden crear usuarios masivamente" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUsersRequest = await req.json();
    const { users } = body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere un array de usuarios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size
    if (users.length > 100) {
      return new Response(
        JSON.stringify({ error: "Máximo 100 usuarios por lote" }),
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

    // Get existing RUTs and emails to check for duplicates
    const rutsToCheck = users.map(u => cleanRUT(u.rut));
    const emailsToCheck = users.map(u => u.email.toLowerCase());

    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("rut, email")
      .or(`rut.in.(${rutsToCheck.join(',')}),email.in.(${emailsToCheck.join(',')})`);

    const existingRuts = new Set((existingProfiles || []).map(p => cleanRUT(p.rut)));
    const existingEmails = new Set((existingProfiles || []).map(p => p.email.toLowerCase()));

    // Process each user
    const results: UserResult[] = [];

    for (const userData of users) {
      const { nombre, apellido, rut, telefono, email } = userData;
      const cleanedRut = cleanRUT(rut);
      const lowerEmail = email.toLowerCase();

      // Check for existing RUT
      if (existingRuts.has(cleanedRut)) {
        results.push({
          email,
          success: false,
          error: "Ya existe un usuario con este RUT"
        });
        continue;
      }

      // Check for existing email
      if (existingEmails.has(lowerEmail)) {
        results.push({
          email,
          success: false,
          error: "Ya existe un usuario con este email"
        });
        continue;
      }

      // Generate temporary password
      const password = generatePassword();

      try {
        // Create the user with metadata (trigger will create profile)
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: lowerEmail,
          password,
          email_confirm: true, // Auto-confirm email for bulk-created users
          user_metadata: {
            rut: cleanedRut,
            nombre,
            apellido,
            telefono,
          },
        });

        if (createError) {
          results.push({
            email,
            success: false,
            error: createError.message
          });
          continue;
        }

        const newUserId = newUser.user.id;

        // Update approval_status to approved
        await adminClient
          .from("profiles")
          .update({ approval_status: "approved" })
          .eq("id", newUserId);

        // Assign acreditador role
        await adminClient
          .from("user_roles")
          .insert({ user_id: newUserId, role: "acreditador" });

        // Add to existing sets to prevent duplicates within same batch
        existingRuts.add(cleanedRut);
        existingEmails.add(lowerEmail);

        results.push({
          email,
          success: true,
          password
        });
      } catch (err) {
        console.error(`Error creating user ${email}:`, err);
        results.push({
          email,
          success: false,
          error: "Error interno al crear usuario"
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: users.length,
          created: successCount,
          failed: errorCount
        },
        results
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
