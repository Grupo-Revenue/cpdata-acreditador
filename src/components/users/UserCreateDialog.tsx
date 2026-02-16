import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RUTInput } from '@/components/ui/RUTInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getRUTError } from '@/lib/rut';
import { AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { BANCOS_CHILE, TIPOS_CUENTA } from './constants';
import { LanguageTagsInput } from '@/components/ui/LanguageTagsInput';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserCreateDialog({ open, onOpenChange, onSuccess }: UserCreateDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { data: roles } = useRoles();
  
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [referenciaContacto, setReferenciaContacto] = useState('');
  const [password, setPassword] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('approved');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [idioma, setIdioma] = useState('');
  const [altura, setAltura] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [carrera, setCarrera] = useState('');
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  // New fields
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [semestre, setSemestre] = useState('');
  const [disponibilidadHoraria, setDisponibilidadHoraria] = useState('');
  const [comuna, setComuna] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tallaPolera, setTallaPolera] = useState('');
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState('');
  const [contactoEmergenciaEmail, setContactoEmergenciaEmail] = useState('');
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState('');

  const resetForm = () => {
    setRut(''); setNombre(''); setApellido(''); setEmail('');
    setTelefono(''); setReferenciaContacto(''); setPassword('');
    setApprovalStatus('approved'); setSelectedRoles([]);
    setIdioma(''); setAltura(''); setUniversidad(''); setCarrera('');
    setBanco(''); setNumeroCuenta(''); setTipoCuenta('');
    setFechaNacimiento(''); setSemestre(''); setDisponibilidadHoraria('');
    setComuna(''); setInstagram(''); setFacebook(''); setTallaPolera('');
    setContactoEmergenciaNombre(''); setContactoEmergenciaEmail(''); setContactoEmergenciaTelefono('');
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rutError = getRUTError(rut);
    if (rutError) {
      toast({ variant: 'destructive', title: 'Error de validación', description: rutError });
      return;
    }

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !telefono.trim() || !password.trim()) {
      toast({ variant: 'destructive', title: 'Error de validación', description: 'Todos los campos marcados son requeridos.' });
      return;
    }

    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Error de validación', description: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('No hay sesión activa');

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
            rut,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono.trim(),
            referencia_contacto: referenciaContacto.trim() || undefined,
            approval_status: approvalStatus,
            roles: selectedRoles,
            idioma: idioma.trim() || undefined,
            altura: altura.trim() || undefined,
            universidad: universidad.trim() || undefined,
            carrera: carrera.trim() || undefined,
            banco: banco || undefined,
            numero_cuenta: numeroCuenta.trim() || undefined,
            tipo_cuenta: tipoCuenta || undefined,
            fecha_nacimiento: fechaNacimiento || undefined,
            semestre: semestre.trim() || undefined,
            disponibilidad_horaria: disponibilidadHoraria.trim() || undefined,
            comuna: comuna.trim() || undefined,
            instagram: instagram.trim() || undefined,
            facebook: facebook.trim() || undefined,
            talla_polera: tallaPolera.trim() || undefined,
            contacto_emergencia_nombre: contactoEmergenciaNombre.trim() || undefined,
            contacto_emergencia_email: contactoEmergenciaEmail.trim() || undefined,
            contacto_emergencia_telefono: contactoEmergenciaTelefono.trim() || undefined,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al crear usuario');

      toast({ title: 'Usuario creado', description: `${nombre} ${apellido} ha sido creado exitosamente.` });
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
          <DialogDescription>Complete los datos para crear un nuevo usuario en el sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos personales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rut">RUT *</Label>
              <RUTInput id="rut" value={rut} onChange={setRut} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={isLoading} placeholder="Nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} disabled={isLoading} placeholder="Apellido" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={isLoading} placeholder="+56 9 1234 5678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
              <Input id="fecha_nacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia de contacto</Label>
            <Input id="referencia" value={referenciaContacto} onChange={(e) => setReferenciaContacto(e.target.value)} disabled={isLoading} placeholder="Opcional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña temporal *</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} placeholder="Mínimo 6 caracteres" />
            <p className="text-xs text-muted-foreground">El usuario deberá cambiar esta contraseña en su primer inicio de sesión.</p>
          </div>

          <Separator />

          {/* Información adicional */}
          <div>
            <Label className="text-base font-semibold">Información adicional</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2 col-span-2">
                <Label>Idiomas</Label>
                <LanguageTagsInput value={idioma} onChange={setIdioma} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura">Altura</Label>
                <Input id="altura" value={altura} onChange={(e) => setAltura(e.target.value)} disabled={isLoading} placeholder="Ej: 1.75" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="talla_polera">Talla de polera</Label>
                <Input id="talla_polera" value={tallaPolera} onChange={(e) => setTallaPolera(e.target.value)} disabled={isLoading} placeholder="Ej: M, L, XL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disponibilidad">Disponibilidad horaria</Label>
                <Input id="disponibilidad" value={disponibilidadHoraria} onChange={(e) => setDisponibilidadHoraria(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comuna">Comuna</Label>
                <Input id="comuna" value={comuna} onChange={(e) => setComuna(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} disabled={isLoading} placeholder="@usuario" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} disabled={isLoading} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Datos académicos */}
          <div>
            <Label className="text-base font-semibold">Datos académicos</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="universidad">Universidad</Label>
                <Input id="universidad" value={universidad} onChange={(e) => setUniversidad(e.target.value)} disabled={isLoading} placeholder="Universidad" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrera">Carrera</Label>
                <Input id="carrera" value={carrera} onChange={(e) => setCarrera(e.target.value)} disabled={isLoading} placeholder="Carrera" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semestre">Semestre</Label>
                <Input id="semestre" value={semestre} onChange={(e) => setSemestre(e.target.value)} disabled={isLoading} placeholder="Ej: 5to" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contacto de emergencia */}
          <div>
            <Label className="text-base font-semibold">Contacto de emergencia</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="emergencia_nombre">Nombre</Label>
                <Input id="emergencia_nombre" value={contactoEmergenciaNombre} onChange={(e) => setContactoEmergenciaNombre(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencia_email">Email</Label>
                <Input id="emergencia_email" type="email" value={contactoEmergenciaEmail} onChange={(e) => setContactoEmergenciaEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencia_telefono">Celular</Label>
                <Input id="emergencia_telefono" value={contactoEmergenciaTelefono} onChange={(e) => setContactoEmergenciaTelefono(e.target.value)} disabled={isLoading} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Datos bancarios */}
          <div>
            <Label className="text-base font-semibold">Datos bancarios</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Select value={banco} onValueChange={setBanco} disabled={isLoading}>
                  <SelectTrigger id="banco"><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                  <SelectContent>
                    {BANCOS_CHILE.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_cuenta">Tipo de cuenta</Label>
                <Select value={tipoCuenta} onValueChange={setTipoCuenta} disabled={isLoading}>
                  <SelectTrigger id="tipo_cuenta"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CUENTA.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="numero_cuenta">Número de cuenta</Label>
                <Input id="numero_cuenta" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} disabled={isLoading} placeholder="Número de cuenta" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="status">Estado inicial</Label>
            <Select value={approvalStatus} onValueChange={(value: 'pending' | 'approved') => setApprovalStatus(value)} disabled={isLoading}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Roles iniciales</Label>
            <div className="grid grid-cols-2 gap-2">
              {roles?.map((role) => (
                <div key={role.name} className="flex items-center space-x-2">
                  <Checkbox id={`role-${role.name}`} checked={selectedRoles.includes(role.name as AppRole)} onCheckedChange={() => handleRoleToggle(role.name as AppRole)} disabled={isLoading} />
                  <Label htmlFor={`role-${role.name}`} className="text-sm font-normal cursor-pointer">{role.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
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
