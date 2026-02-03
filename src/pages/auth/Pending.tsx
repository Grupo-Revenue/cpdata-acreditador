import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

export default function PendingPage() {
  const { signOut, refreshProfile, profile } = useAuth();

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
          <Button variant="outline" onClick={refreshProfile} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar estado
          </Button>
          
          <Button variant="ghost" onClick={signOut} className="w-full text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
