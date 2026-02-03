import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Check, X, RefreshCw } from 'lucide-react';

interface PendingUser {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  referencia_contacto: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los usuarios pendientes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      // Actualizar estado del perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Asignar rol de acreditador por defecto
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role: 'acreditador' });

      if (roleError) throw roleError;

      toast({
        title: 'Usuario aprobado',
        description: `${selectedUser.nombre} ${selectedUser.apellido} ha sido aprobado.`,
      });

      fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo aprobar el usuario.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Usuario rechazado',
        description: `${selectedUser.nombre} ${selectedUser.apellido} ha sido rechazado.`,
      });

      fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo rechazar el usuario.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Gestión de Usuarios"
        description="Aprobar y gestionar usuarios del sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Usuarios' },
        ]}
        actions={
          <Button variant="outline" onClick={fetchPendingUsers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios Pendientes de Aprobación
            {pendingUsers.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({pendingUsers.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState text="Cargando usuarios..." />
          ) : pendingUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin usuarios pendientes"
              description="No hay usuarios esperando aprobación."
            />
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {user.nombre} {user.apellido}
                      </p>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      RUT: {user.rut} • {user.email}
                    </p>
                    {user.telefono && (
                      <p className="text-sm text-muted-foreground">
                        Tel: {user.telefono}
                      </p>
                    )}
                    {user.referencia_contacto && (
                      <p className="text-sm text-muted-foreground">
                        Ref: {user.referencia_contacto}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Registrado: {new Date(user.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setActionType('approve');
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedUser(user);
                        setActionType('reject');
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={actionType === 'approve' && !!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        title="Aprobar usuario"
        description={`¿Estás seguro de aprobar a ${selectedUser?.nombre} ${selectedUser?.apellido}? Se le asignará el rol de Acreditador.`}
        confirmLabel="Aprobar"
        onConfirm={handleApprove}
        isLoading={isProcessing}
      />

      <ConfirmDialog
        open={actionType === 'reject' && !!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        title="Rechazar usuario"
        description={`¿Estás seguro de rechazar a ${selectedUser?.nombre} ${selectedUser?.apellido}? El usuario será desactivado.`}
        confirmLabel="Rechazar"
        variant="destructive"
        onConfirm={handleReject}
        isLoading={isProcessing}
      />
    </AppShell>
  );
}
