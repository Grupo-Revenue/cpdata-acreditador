import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

const resetSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecoveryMode, session } = useAuth();

  useEffect(() => {
    // Check if we already have a recovery session
    if (isRecoveryMode && session) {
      setSessionReady(true);
      setChecking(false);
      return;
    }

    // Listen for PASSWORD_RECOVERY event in case it fires after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Timeout after 5 seconds if no recovery event
    const timeout = setTimeout(() => {
      setChecking(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [isRecoveryMode, session]);

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (checking) {
    return <LoadingState fullScreen text="Verificando enlace..." />;
  }

  if (!sessionReady) {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="El enlace de recuperación ha expirado o ya fue utilizado"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-destructive/10">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>

          <p className="text-muted-foreground">
            Por favor solicita un nuevo enlace de recuperación.
          </p>

          <Button className="w-full" onClick={() => navigate('/auth/recover')}>
            Solicitar nuevo enlace
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Contraseña actualizada"
        subtitle="Tu contraseña ha sido restablecida correctamente"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-success/10">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>

          <p className="text-muted-foreground">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>

          <Button className="w-full" onClick={() => navigate('/auth/login')}>
            Ir al inicio de sesión
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu nueva contraseña"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Restablecer contraseña
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
