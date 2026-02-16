import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard, Users, Calendar, FileText, Wallet,
  HeadphonesIcon, Trophy,
} from 'lucide-react';

const ROLES = ['administracion', 'supervisor', 'acreditador'] as const;
const ROLE_LABELS: Record<string, string> = {
  administracion: 'Administración',
  supervisor: 'Supervisor',
  acreditador: 'Acreditador',
};

const NAV_PERMISSIONS = [
  { key: 'nav.dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'nav.users', label: 'Usuarios', icon: Users },
  { key: 'nav.events', label: 'Eventos', icon: Calendar },
  { key: 'nav.invoices', label: 'Boletas', icon: FileText },
  { key: 'nav.reimbursements', label: 'Rendiciones', icon: Wallet },
  { key: 'nav.support', label: 'Soporte', icon: HeadphonesIcon },
  { key: 'nav.ranking', label: 'Ranking', icon: Trophy },
];

interface PermissionRow {
  id: string;
  role: string;
  permission_key: string;
  enabled: boolean;
}

export function PermissionsSettings() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role');
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron cargar los permisos.', variant: 'destructive' });
    } else {
      setPermissions(data as PermissionRow[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const getEnabled = (role: string, key: string): boolean => {
    const row = permissions.find(p => p.role === role && p.permission_key === key);
    return row?.enabled ?? true;
  };

  const togglePermission = async (role: string, key: string) => {
    const row = permissions.find(p => p.role === role && p.permission_key === key);
    if (!row) return;

    const newValue = !row.enabled;

    // Optimistic update
    setPermissions(prev =>
      prev.map(p => p.id === row.id ? { ...p, enabled: newValue } : p)
    );

    const { error } = await supabase
      .from('role_permissions')
      .update({ enabled: newValue })
      .eq('id', row.id);

    if (error) {
      // Revert
      setPermissions(prev =>
        prev.map(p => p.id === row.id ? { ...p, enabled: !newValue } : p)
      );
      toast({ title: 'Error', description: 'No se pudo actualizar el permiso.', variant: 'destructive' });
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos por Rol</CardTitle>
        <CardDescription>
          Controla qué elementos del menú son visibles para cada rol.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="administracion">
          <TabsList>
            {ROLES.map(role => (
              <TabsTrigger key={role} value={role}>{ROLE_LABELS[role]}</TabsTrigger>
            ))}
          </TabsList>

          {ROLES.map(role => (
            <TabsContent key={role} value={role} className="space-y-6 mt-4">
              {/* Navigation section */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Menú de navegación</h4>
                <div className="space-y-3">
                  {NAV_PERMISSIONS.map(nav => {
                    const Icon = nav.icon;
                    return (
                      <div key={nav.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <Label className="cursor-pointer">{nav.label}</Label>
                        </div>
                        <Switch
                          checked={getEnabled(role, nav.key)}
                          onCheckedChange={() => togglePermission(role, nav.key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
