import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Clock, LogOut, RefreshCw, Loader2, XCircle } from 'lucide-react';

export default function PendingPage() {
  const { signOut, refreshProfile, profile, user, isApproved, isActive, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Redirect if user is approved and active
  useEffect(() => {
    if (!isLoading && isApproved && isActive) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isApproved, isActive, isLoading, navigate]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await refreshProfile();
      
      // After refresh, check if still pending (the useEffect will handle redirect if approved)
      // We need a small delay to let the state update
      setTimeout(() => {
        setIsChecking(false);
        // If we're still on this page after state update, show toast
        if (!isApproved || !isActive) {
          toast({
            title: "Estado verificado",
            description: "Tu cuenta aún está pendiente de aprobación.",
          });
        }
      }, 500);
    } catch (error) {
      setIsChecking(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo verificar el estado. Intenta de nuevo.",
      });
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // The useEffect will handle redirect when user becomes null
    } catch (error) {
      setIsSigningOut(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar sesión. Intenta de nuevo.",
      });
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <AuthLayout title="Cargando..." subtitle="">
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  const isRejected = profile?.approval_status === 'rejected';

  if (isRejected) {
    return (
      <AuthLayout
        title="Cuenta rechazada"
        subtitle="No tienes acceso al sistema"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-destructive/10">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              Tu solicitud de acceso ha sido rechazada.
            </p>
            <p className="text-sm text-muted-foreground">
              Si crees que esto es un error, contacta al administrador del sistema.
            </p>
          </div>

          {profile && (
            <div className="bg-muted rounded-lg p-4 text-left">
              <p className="text-sm font-medium">Datos de tu registro:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li><span className="font-medium">Nombre:</span> {profile.nombre} {profile.apellido}</li>
                <li><span className="font-medium">RUT:</span> {profile.rut}</li>
                <li><span className="font-medium">Email:</span> {profile.email}</li>
              </ul>
            </div>
          )}

          <Button 
            type="button"
            variant="ghost" 
            onClick={handleSignOut} 
            disabled={isSigningOut}
            className="w-full text-muted-foreground"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            {isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Cuenta pendiente de aprobación"
      subtitle="Tu registro fue exitoso"
    >
      <div className="text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-warning/10 animate-pulse-soft">
          <Clock className="w-12 h-12 text-warning" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">
            Tu cuenta está pendiente de revisión por un administrador.
          </p>
          <p className="text-sm text-muted-foreground">
            Te notificaremos por correo cuando tu cuenta sea aprobada.
          </p>
        </div>

        {profile && (
          <div className="bg-muted rounded-lg p-4 text-left">
            <p className="text-sm font-medium">Datos de tu registro:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li><span className="font-medium">Nombre:</span> {profile.nombre} {profile.apellido}</li>
              <li><span className="font-medium">RUT:</span> {profile.rut}</li>
              <li><span className="font-medium">Email:</span> {profile.email}</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleCheckStatus} 
            disabled={isChecking || isSigningOut}
            className="w-full"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isChecking ? 'Verificando...' : 'Verificar estado'}
          </Button>
          
          <Button 
            type="button"
            variant="ghost" 
            onClick={handleSignOut} 
            disabled={isChecking || isSigningOut}
            className="w-full text-muted-foreground"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            {isSigningOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
