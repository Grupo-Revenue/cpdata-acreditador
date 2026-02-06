import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUpdateRole, Role } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';

interface RoleEditDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleEditDialog({ role, open, onOpenChange }: RoleEditDialogProps) {
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const updateRole = useUpdateRole();

  useEffect(() => {
    if (role) {
      setDescription(role.description || '');
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) return;

    try {
      await updateRole.mutateAsync({
        name: role.name,
        description: description.trim(),
      });

      toast({
        title: 'Rol actualizado',
        description: `La descripción del rol "${role.name}" se actualizó correctamente.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el rol.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Rol</DialogTitle>
          <DialogDescription>
            Modifica la descripción del rol "{role?.name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Nombre del rol</Label>
            <p className="text-sm font-medium px-3 py-2 bg-muted rounded-md">
              {role?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              El nombre del rol no se puede modificar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del rol y sus permisos"
              disabled={updateRole.isPending}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateRole.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateRole.isPending}>
              {updateRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
