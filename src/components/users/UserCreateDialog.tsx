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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RUTInput } from '@/components/ui/RUTInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getRUTError, cleanRUT } from '@/lib/rut';
import { AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AVAILABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'administracion', label: 'Administración' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'acreditador', label: 'Acreditador' },
];

export function UserCreateDialog({ open, onOpenChange, onSuccess }: UserCreateDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [referenciaContacto, setReferenciaContacto] = useState('');
  const [password, setPassword] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('approved');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  const resetForm = () => {
    setRut('');
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setReferenciaContacto('');
    setPassword('');
    setApprovalStatus('approved');
    setSelectedRoles([]);
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate RUT
    const rutError = getRUTError(rut);
    if (rutError) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: rutError,
      });
      return;
    }

    // Validate required fields
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !telefono.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Todos los campos marcados son requeridos.',
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(
        'https://wodzysrgdsforiuliejo.supabase.co/functions/v1/create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            rut: cleanRUT(rut),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono.trim(),
            referencia_contacto: referenciaContacto.trim() || undefined,
            approval_status: approvalStatus,
            roles: selectedRoles,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario');
      }

      toast({
        title: 'Usuario creado',
        description: `${nombre} ${apellido} ha sido creado exitosamente.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el usuario.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
          <DialogDescription>
            Complete los datos para crear un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rut">RUT *</Label>
              <RUTInput
                id="rut"
                value={rut}
                onChange={setRut}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={isLoading}
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                disabled={isLoading}
                placeholder="Apellido"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={isLoading}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia de contacto</Label>
              <Input
                id="referencia"
                value={referenciaContacto}
                onChange={(e) => setReferenciaContacto(e.target.value)}
                disabled={isLoading}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña temporal *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-xs text-muted-foreground">
              El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado inicial</Label>
            <Select
              value={approvalStatus}
              onValueChange={(value: 'pending' | 'approved') => setApprovalStatus(value)}
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Roles iniciales</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`role-${role.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
