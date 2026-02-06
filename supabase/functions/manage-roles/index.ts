import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddRoleRequest {
  action: 'add';
  name: string;
  description?: string;
}

interface UpdateRoleRequest {
  action: 'update';
  name: string;
  description: string;
}

interface ListRolesRequest {
  action: 'list';
}

type RoleRequest = AddRoleRequest | UpdateRoleRequest | ListRolesRequest;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to check permissions
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is superadmin using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: isSuperadmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'superadmin'
    });

    if (!isSuperadmin) {
      return new Response(
        JSON.stringify({ error: 'Solo superadmins pueden gestionar roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RoleRequest = await req.json();

    if (body.action === 'list') {
      const { data: roles, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ roles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'add') {
      const { name, description } = body;

      // Validate role name format (lowercase letters and hyphens only)
      const roleNameRegex = /^[a-z][a-z-]*[a-z]$|^[a-z]$/;
      if (!roleNameRegex.test(name)) {
        return new Response(
          JSON.stringify({ error: 'El nombre del rol solo puede contener letras minúsculas y guiones' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if role already exists in the roles table
      const { data: existingRole } = await supabaseAdmin
        .from('roles')
        .select('name')
        .eq('name', name)
        .single();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: 'Ya existe un rol con ese nombre' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add value to the enum using raw SQL
      // Note: We need to use a prepared statement format to avoid SQL injection
      const enumAddQuery = `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS '${name}'`;
      
      const { error: enumError } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: enumAddQuery 
      });

      // If exec_sql function doesn't exist, we need to handle this differently
      // The enum modification needs to happen through a database migration or direct SQL
      if (enumError) {
        console.log('Note: Could not modify enum directly. Role will be added to roles table only.');
      }

      // Insert into roles table
      const { data: newRole, error: insertError } = await supabaseAdmin
        .from('roles')
        .insert({ name, description })
        .select()
        .single();

      if (insertError) {
        // Check if it's a constraint violation (enum value doesn't exist)
        if (insertError.code === '22P02') {
          return new Response(
            JSON.stringify({ 
              error: 'No se pudo agregar el rol. El valor no existe en el enum de PostgreSQL.',
              details: 'Para agregar nuevos roles, se requiere una migración de base de datos.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, role: newRole }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'update') {
      const { name, description } = body;

      const { data: updatedRole, error } = await supabaseAdmin
        .from('roles')
        .update({ description })
        .eq('name', name)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, role: updatedRole }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
