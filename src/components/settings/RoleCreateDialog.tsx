import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAddRole } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleCreateDialog({ open, onOpenChange }: RoleCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const addRole = useAddRole();

  const resetForm = () => {
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim().toLowerCase();

    // Validate name format
    const roleNameRegex = /^[a-z][a-z-]*[a-z]$|^[a-z]$/;
    if (!roleNameRegex.test(trimmedName)) {
      toast({
        variant: 'destructive',
        title: 'Nombre inválido',
        description: 'Solo letras minúsculas y guiones. Debe comenzar y terminar con letra.',
      });
      return;
    }

    try {
      await addRole.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
      });

      toast({
        title: 'Rol creado',
        description: `El rol "${trimmedName}" se creó correctamente.`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el rol.',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Rol</DialogTitle>
          <DialogDescription>
            Crea un nuevo rol para el sistema. Los nombres de rol son permanentes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del rol *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="ej: auditor, coordinador-zona"
              disabled={addRole.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas y guiones. Ej: auditor, coordinador-zona
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del rol y sus permisos"
              disabled={addRole.isPending}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addRole.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addRole.isPending || !name.trim()}>
              {addRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Rol
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
