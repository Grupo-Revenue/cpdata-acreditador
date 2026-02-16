import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionsResult {
  canAccess: (permissionKey: string) => boolean;
  permissions: Record<string, boolean>;
  isLoading: boolean;
}

export function usePermissions(): PermissionsResult {
  const { activeRole } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeRole || activeRole === 'superadmin') {
      setPermissions({});
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('permission_key, enabled')
          .eq('role', activeRole);

        if (error) throw error;

        const map: Record<string, boolean> = {};
        data?.forEach((row) => {
          map[row.permission_key] = row.enabled;
        });
        setPermissions(map);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [activeRole]);

  const canAccess = useCallback(
    (permissionKey: string): boolean => {
      if (activeRole === 'superadmin') return true;
      // Default to true if permission not found
      return permissions[permissionKey] ?? true;
    },
    [activeRole, permissions]
  );

  return { canAccess, permissions, isLoading };
}
