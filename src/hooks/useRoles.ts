import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const BASE_ROLES = ['superadmin', 'administracion', 'supervisor', 'acreditador'];

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Role[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useAddRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('No hay sesión activa');

      const response = await fetch(
        'https://wodzysrgdsforiuliejo.supabase.co/functions/v1/manage-roles',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'add', name, description }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al agregar rol');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('No hay sesión activa');

      const response = await fetch(
        'https://wodzysrgdsforiuliejo.supabase.co/functions/v1/manage-roles',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'update', name, description }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al actualizar rol');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function isBaseRole(roleName: string): boolean {
  return BASE_ROLES.includes(roleName);
}
