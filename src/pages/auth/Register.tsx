import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RUTInput } from '@/components/ui/RUTInput';
import { LanguageTagsInput } from '@/components/ui/LanguageTagsInput';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { validateRUT } from '@/lib/rut';
import { Loader2, User, Mail, Lock, Phone, UserPlus, GraduationCap, MapPin, Instagram, Facebook, Shirt, Clock, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const registerSchema = z.object({
  rut: z.string()
    .min(1, 'El RUT es requerido')
    .refine(val => validateRUT(val).isValid, 'RUT inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  referencia_contacto: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  // New optional fields
  fecha_nacimiento: z.string().optional(),
  universidad: z.string().optional(),
  carrera: z.string().optional(),
  semestre: z.string().optional(),
  disponibilidad_horaria: z.string().optional(),
  comuna: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  idioma: z.string().optional(),
  altura: z.string().optional(),
  talla_polera: z.string().optional(),
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_email: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rut: '', nombre: '', apellido: '', email: '', telefono: '',
      referencia_contacto: '', password: '', confirmPassword: '',
      fecha_nacimiento: '', universidad: '', carrera: '', semestre: '',
      disponibilidad_horaria: '', comuna: '', instagram: '', facebook: '',
      idioma: '', altura: '', talla_polera: '',
      contacto_emergencia_nombre: '', contacto_emergencia_email: '', contacto_emergencia_telefono: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);

    const { error } = await signUp({
      email: data.email,
      password: data.password,
      rut: data.rut,
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      referencia_contacto: data.referencia_contacto,
      universidad: data.universidad,
      carrera: data.carrera,
      fecha_nacimiento: data.fecha_nacimiento,
      semestre: data.semestre,
      disponibilidad_horaria: data.disponibilidad_horaria,
      comuna: data.comuna,
      instagram: data.instagram,
      facebook: data.facebook,
      talla_polera: data.talla_polera,
      contacto_emergencia_nombre: data.contacto_emergencia_nombre,
      contacto_emergencia_email: data.contacto_emergencia_email,
      contacto_emergencia_telefono: data.contacto_emergencia_telefono,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error al registrar', description: error.message });
      setIsLoading(false);
      return;
    }

    toast({ title: '¡Registro exitoso!', description: 'Tu cuenta está pendiente de aprobación.' });
    navigate('/auth/pending');
  };

  return (
    <AuthLayout title="Crear cuenta" subtitle="Completa tus datos para registrarte">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Datos personales */}
          <FormField control={form.control} name="rut" render={({ field }) => (
            <FormItem>
              <FormLabel>RUT *</FormLabel>
              <FormControl><RUTInput value={field.value} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Juan" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apellido" render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido *</FormLabel>
                <FormControl><Input placeholder="Pérez" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="correo@ejemplo.cl" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="telefono" render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="+56 9 1234 5678" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="referencia_contacto" render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia de contacto (opcional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="¿Quién te recomendó?" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Separator />

          {/* Datos adicionales */}
          <p className="text-sm font-semibold text-foreground">Datos adicionales</p>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="comuna" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Comuna</FormLabel>
                <FormControl><Input placeholder="Ej: Providencia" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="disponibilidad_horaria" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponibilidad horaria</FormLabel>
                <FormControl><Input placeholder="Ej: Lunes a Viernes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="instagram" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> Instagram</FormLabel>
                <FormControl><Input placeholder="@usuario" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="facebook" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" /> Facebook</FormLabel>
                <FormControl><Input placeholder="Nombre o URL" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="idioma" render={({ field }) => (
              <FormItem>
                <FormLabel>Idiomas</FormLabel>
                <FormControl><LanguageTagsInput value={field.value || ''} onChange={field.onChange} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="altura" render={({ field }) => (
              <FormItem>
                <FormLabel>Estatura</FormLabel>
                <FormControl><Input placeholder="Ej: 1.75" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="talla_polera" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1"><Shirt className="h-3.5 w-3.5" /> Talla de polera</FormLabel>
              <FormControl><Input placeholder="Ej: M, L, XL" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Separator />

          {/* Datos académicos */}
          <p className="text-sm font-semibold text-foreground flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Datos académicos</p>

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="universidad" render={({ field }) => (
              <FormItem>
                <FormLabel>Universidad o Institución</FormLabel>
                <FormControl><Input placeholder="Universidad" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="carrera" render={({ field }) => (
              <FormItem>
                <FormLabel>Carrera</FormLabel>
                <FormControl><Input placeholder="Carrera" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="semestre" render={({ field }) => (
            <FormItem>
              <FormLabel>Semestre</FormLabel>
              <FormControl><Input placeholder="Ej: 5to semestre" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Separator />

          {/* Contacto de emergencia */}
          <p className="text-sm font-semibold text-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Contacto de emergencia</p>

          <FormField control={form.control} name="contacto_emergencia_nombre" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del contacto</FormLabel>
              <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="contacto_emergencia_email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email del contacto</FormLabel>
                <FormControl><Input type="email" placeholder="correo@ejemplo.cl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contacto_emergencia_telefono" render={({ field }) => (
              <FormItem>
                <FormLabel>Celular del contacto</FormLabel>
                <FormControl><Input placeholder="+56 9 1234 5678" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <Separator />

          {/* Contraseña */}
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrarme
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
        <Link to="/auth/login" className="text-primary hover:underline font-medium">
          Inicia sesión
        </Link>
      </div>
    </AuthLayout>
  );
}
