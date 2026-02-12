import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, CreditCard, Phone, Users, Lock, Loader2, GraduationCap, Landmark, Shield, Settings, Eye, BadgeCheck, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth, getDashboardForRole, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RoleSelectDialog } from '@/components/auth/RoleSelectDialog';
import { BANCOS_CHILE, TIPOS_CUENTA } from '@/components/users/constants';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const profileSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos').optional().or(z.literal('')),
  referencia_contacto: z.string().optional().or(z.literal('')),
  idioma: z.string().optional().or(z.literal('')),
  altura: z.string().optional().or(z.literal('')),
  universidad: z.string().optional().or(z.literal('')),
  carrera: z.string().optional().or(z.literal('')),
  banco: z.string().optional().or(z.literal('')),
  numero_cuenta: z.string().optional().or(z.literal('')),
  tipo_cuenta: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, user, refreshProfile, roles, activeRole, setActiveRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: profile?.nombre || '',
      apellido: profile?.apellido || '',
      telefono: profile?.telefono || '',
      referencia_contacto: profile?.referencia_contacto || '',
      idioma: (profile as any)?.idioma || '',
      altura: (profile as any)?.altura || '',
      universidad: (profile as any)?.universidad || '',
      carrera: (profile as any)?.carrera || '',
      banco: (profile as any)?.banco || '',
      numero_cuenta: (profile as any)?.numero_cuenta || '',
      tipo_cuenta: (profile as any)?.tipo_cuenta || '',
    },
  });

  const initials = profile
    ? `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`
    : '??';

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    administracion: 'Administración',
    supervisor: 'Supervisor',
    acreditador: 'Acreditador',
  };

  const roleIcons: Record<string, typeof Shield> = {
    superadmin: Shield,
    administracion: Settings,
    supervisor: Eye,
    acreditador: BadgeCheck,
  };

  const handleRoleSelect = (role: AppRole) => {
    setActiveRole(role);
    setIsRoleDialogOpen(false);
    navigate(getDashboardForRole(role));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una imagen válida',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar los 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if exists
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new photo URL (add timestamp to bust cache)
      const photoUrlWithCache = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: photoUrlWithCache })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: 'Foto actualizada',
        description: 'Tu foto de perfil se ha actualizado correctamente',
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la foto. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono || null,
          referencia_contacto: data.referencia_contacto || null,
          idioma: data.idioma || null,
          altura: data.altura || null,
          universidad: data.universidad || null,
          carrera: data.carrera || null,
          banco: data.banco || null,
          numero_cuenta: data.numero_cuenta || null,
          tipo_cuenta: data.tipo_cuenta || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos se han guardado correctamente',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar los cambios. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Correo enviado',
        description: 'Revisa tu bandeja de entrada para cambiar tu contraseña',
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el correo. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Mi Perfil"
        description="Configura tu información personal y preferencias"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.foto_url || undefined} alt={profile?.nombre} />
                  <AvatarFallback className="gradient-primary text-white text-2xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  {profile?.nombre} {profile?.apellido}
                </CardTitle>
                <div className="flex flex-wrap justify-center gap-1">
                  {roles.map(role => (
                    <Badge key={role} variant="secondary">
                      {roleLabels[role] || role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Read-only Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Información de cuenta
            </CardTitle>
            <CardDescription>
              Estos datos no pueden ser modificados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  RUT
                </Label>
                <div className="flex h-10 w-full items-center rounded-md border bg-muted px-3 text-sm">
                  {profile?.rut}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <div className="flex h-10 w-full items-center rounded-md border bg-muted px-3 text-sm">
                  {profile?.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rol activo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {activeRole && roleIcons[activeRole] ? (() => { const Icon = roleIcons[activeRole]; return <Icon className="h-5 w-5" />; })() : <Shield className="h-5 w-5" />}
              Rol activo
            </CardTitle>
            <CardDescription>
              Actualmente operando como <span className="font-medium text-foreground">{activeRole ? roleLabels[activeRole] || activeRole : 'Sin rol'}</span>
            </CardDescription>
          </CardHeader>
          {roles.length > 1 && (
            <CardContent>
              <Button variant="outline" className="gap-2" onClick={() => setIsRoleDialogOpen(true)}>
                <RefreshCw className="h-4 w-4" />
                Cambiar rol
              </Button>
            </CardContent>
          )}
        </Card>

        {isRoleDialogOpen && (
          <RoleSelectDialog
            open={isRoleDialogOpen}
            roles={roles}
            onSelect={handleRoleSelect}
          />
        )}

        {/* Editable Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información personal
            </CardTitle>
            <CardDescription>
              Actualiza tus datos de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apellido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Teléfono
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+56 9 1234 5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referencia_contacto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencia de contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="¿Cómo te encontraron?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Información adicional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="idioma" render={({ field }) => (
                    <FormItem><FormLabel>Idioma</FormLabel><FormControl><Input placeholder="Ej: Español" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="altura" render={({ field }) => (
                    <FormItem><FormLabel>Altura</FormLabel><FormControl><Input placeholder="Ej: 1.75" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="universidad" render={({ field }) => (
                    <FormItem><FormLabel>Universidad</FormLabel><FormControl><Input placeholder="Universidad" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="carrera" render={({ field }) => (
                    <FormItem><FormLabel>Carrera</FormLabel><FormControl><Input placeholder="Carrera" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Datos bancarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Datos bancarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="banco" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {BANCOS_CHILE.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tipo_cuenta" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de cuenta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {TIPOS_CUENTA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="numero_cuenta" render={({ field }) => (
                  <FormItem><FormLabel>Número de cuenta</FormLabel><FormControl><Input placeholder="Número de cuenta" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cambiar contraseña</p>
                <p className="text-sm text-muted-foreground">
                  Recibirás un correo para restablecer tu contraseña
                </p>
              </div>
              <Button variant="outline" onClick={handleResetPassword}>
                Enviar correo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
