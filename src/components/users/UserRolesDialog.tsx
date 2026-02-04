import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserWithRoles } from './types';
import { AppRole } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface UserRolesDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: 'superadmin', label: 'Superadmin', description: 'Acceso total al sistema' },
  { value: 'administracion', label: 'Administración', description: 'Gestión administrativa' },
  { value: 'supervisor', label: 'Supervisor', description: 'Supervisión de operaciones' },
  { value: 'acreditador', label: 'Acreditador', description: 'Gestión de acreditaciones' },
];

export function UserRolesDialog({ user, open, onOpenChange, onSuccess }: UserRolesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setSelectedRoles([...user.roles]);
    }
  }, [user]);

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Determine roles to add and remove
      const rolesToAdd = selectedRoles.filter((r) => !user.roles.includes(r));
      const rolesToRemove = user.roles.filter((r) => !selectedRoles.includes(r));

      // Remove roles
      for (const role of rolesToRemove) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', role);

        if (error) throw error;
      }

      // Add roles
      for (const role of rolesToAdd) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role });

        if (error) throw error;
      }

      toast({
        title: 'Roles actualizados',
        description: 'Los roles del usuario se actualizaron correctamente.',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar los roles.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestionar Roles
          </DialogTitle>
          <DialogDescription>
            {user && `Asigna roles a ${user.nombre} ${user.apellido}`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            {ALL_ROLES.map((role) => (
              <div
                key={role.value}
                className="flex items-start space-x-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={(checked) =>
                    handleRoleToggle(role.value, checked as boolean)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={role.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Roles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
