import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserWithRoles } from './types';
import { ApprovalStatus } from '@/contexts/AuthContext';
import { BANCOS_CHILE, TIPOS_CUENTA } from './constants';
import { LanguageTagsInput } from '@/components/ui/LanguageTagsInput';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserEditDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onSuccess }: UserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    referencia_contacto: '',
    approval_status: 'pending' as ApprovalStatus,
    is_active: true,
    idioma: '',
    altura: '',
    universidad: '',
    carrera: '',
    banco: '',
    numero_cuenta: '',
    tipo_cuenta: '',
    fecha_nacimiento: '',
    semestre: '',
    disponibilidad_horaria: '',
    comuna: '',
    instagram: '',
    facebook: '',
    talla_polera: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_email: '',
    contacto_emergencia_telefono: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        telefono: user.telefono || '',
        referencia_contacto: user.referencia_contacto || '',
        approval_status: user.approval_status,
        is_active: user.is_active,
        idioma: user.idioma || '',
        altura: user.altura || '',
        universidad: user.universidad || '',
        carrera: user.carrera || '',
        banco: user.banco || '',
        numero_cuenta: user.numero_cuenta || '',
        tipo_cuenta: user.tipo_cuenta || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
        semestre: user.semestre || '',
        disponibilidad_horaria: user.disponibilidad_horaria || '',
        comuna: user.comuna || '',
        instagram: user.instagram || '',
        facebook: user.facebook || '',
        talla_polera: user.talla_polera || '',
        contacto_emergencia_nombre: user.contacto_emergencia_nombre || '',
        contacto_emergencia_email: user.contacto_emergencia_email || '',
        contacto_emergencia_telefono: user.contacto_emergencia_telefono || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono || null,
          referencia_contacto: formData.referencia_contacto || null,
          approval_status: formData.approval_status,
          is_active: formData.is_active,
          idioma: formData.idioma || null,
          altura: formData.altura || null,
          universidad: formData.universidad || null,
          carrera: formData.carrera || null,
          banco: formData.banco || null,
          numero_cuenta: formData.numero_cuenta || null,
          tipo_cuenta: formData.tipo_cuenta || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          semestre: formData.semestre || null,
          disponibilidad_horaria: formData.disponibilidad_horaria || null,
          comuna: formData.comuna || null,
          instagram: formData.instagram || null,
          facebook: formData.facebook || null,
          talla_polera: formData.talla_polera || null,
          contacto_emergencia_nombre: formData.contacto_emergencia_nombre || null,
          contacto_emergencia_email: formData.contacto_emergencia_email || null,
          contacto_emergencia_telefono: formData.contacto_emergencia_telefono || null,
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Usuario actualizado', description: 'Los cambios se guardaron correctamente.' });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el usuario.' });
    } finally {
      setIsLoading(false);
    }
  };

  const set = (key: string, value: string | boolean) => setFormData({ ...formData, [key]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Modifica la información del usuario. Los cambios se aplicarán inmediatamente.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Avatar className="h-20 w-20">
            {user?.foto_url && <AvatarImage src={user.foto_url} alt={`${user?.nombre} ${user?.apellido}`} />}
            <AvatarFallback className="text-2xl">
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rut">RUT</Label>
              <Input id="rut" value={user?.rut || ''} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => set('nombre', e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" value={formData.apellido} onChange={(e) => set('apellido', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={formData.telefono} onChange={(e) => set('telefono', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="referencia">Referencia de Contacto</Label>
                <Input id="referencia" value={formData.referencia_contacto} onChange={(e) => set('referencia_contacto', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <Input id="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={(e) => set('fecha_nacimiento', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comuna">Comuna</Label>
                <Input id="comuna" value={formData.comuna} onChange={(e) => set('comuna', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="approval_status">Estado de Aprobación</Label>
              <Select value={formData.approval_status} onValueChange={(value: ApprovalStatus) => set('approval_status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Usuario Activo</Label>
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => set('is_active', checked)} />
            </div>

            <Separator />

            {/* Información adicional */}
            <Label className="text-base font-semibold">Información adicional</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 col-span-2">
                <Label>Idiomas</Label>
                <LanguageTagsInput value={formData.idioma} onChange={(v) => set('idioma', v)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="altura">Altura</Label>
                <Input id="altura" value={formData.altura} onChange={(e) => set('altura', e.target.value)} placeholder="Ej: 1.75" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="talla_polera">Talla de polera</Label>
                <Input id="talla_polera" value={formData.talla_polera} onChange={(e) => set('talla_polera', e.target.value)} placeholder="Ej: M, L, XL" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="disponibilidad">Disponibilidad horaria</Label>
                <Input id="disponibilidad" value={formData.disponibilidad_horaria} onChange={(e) => set('disponibilidad_horaria', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" value={formData.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@usuario" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" value={formData.facebook} onChange={(e) => set('facebook', e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Datos académicos */}
            <Label className="text-base font-semibold">Datos académicos</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="universidad">Universidad</Label>
                <Input id="universidad" value={formData.universidad} onChange={(e) => set('universidad', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="carrera">Carrera</Label>
                <Input id="carrera" value={formData.carrera} onChange={(e) => set('carrera', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semestre">Semestre</Label>
                <Input id="semestre" value={formData.semestre} onChange={(e) => set('semestre', e.target.value)} placeholder="Ej: 5to" />
              </div>
            </div>

            <Separator />

            {/* Contacto de emergencia */}
            <Label className="text-base font-semibold">Contacto de emergencia</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="emergencia_nombre">Nombre</Label>
                <Input id="emergencia_nombre" value={formData.contacto_emergencia_nombre} onChange={(e) => set('contacto_emergencia_nombre', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emergencia_email">Email</Label>
                <Input id="emergencia_email" type="email" value={formData.contacto_emergencia_email} onChange={(e) => set('contacto_emergencia_email', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emergencia_telefono">Celular</Label>
                <Input id="emergencia_telefono" value={formData.contacto_emergencia_telefono} onChange={(e) => set('contacto_emergencia_telefono', e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Datos bancarios */}
            <Label className="text-base font-semibold">Datos bancarios</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="banco">Banco</Label>
                <Select value={formData.banco} onValueChange={(v) => set('banco', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                  <SelectContent>
                    {BANCOS_CHILE.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo_cuenta">Tipo de cuenta</Label>
                <Select value={formData.tipo_cuenta} onValueChange={(v) => set('tipo_cuenta', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CUENTA.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="numero_cuenta">Número de cuenta</Label>
                <Input id="numero_cuenta" value={formData.numero_cuenta} onChange={(e) => set('numero_cuenta', e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
