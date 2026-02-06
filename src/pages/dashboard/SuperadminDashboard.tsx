import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Users,
  UserCheck,
  Clock,
  ExternalLink,
  UserPlus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SuperadminDashboard() {
  const navigate = useNavigate();

  // Query para usuarios pendientes
  const { data: pendingUsers, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Query para contar usuarios activos
  const { data: activeUsersCount, isLoading: loadingActive } = useQuery({
    queryKey: ['active-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('approval_status', 'approved');
      
      if (error) throw error;
      return count || 0;
    }
  });

  const pendingCount = pendingUsers?.length || 0;

  const stats = [
    {
      title: 'Eventos Hoy',
      value: '0',
      icon: Calendar,
      trend: 'Próximamente',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isLoading: false,
    },
    {
      title: 'Eventos del Mes',
      value: '0',
      icon: Calendar,
      trend: 'Próximamente',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      isLoading: false,
    },
    {
      title: 'Usuarios Pendientes',
      value: pendingCount.toString(),
      icon: UserPlus,
      trend: pendingCount > 0 ? 'Requieren aprobación' : 'Todo al día',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      isLoading: loadingPending,
    },
    {
      title: 'Usuarios Activos',
      value: activeUsersCount?.toString() || '0',
      icon: UserCheck,
      trend: 'Aprobados y activos',
      color: 'text-success',
      bgColor: 'bg-success/10',
      isLoading: loadingActive,
    },
  ];

  const quickLinks = [
    { label: 'Gestionar Usuarios', href: '/app/users', icon: Users },
    { label: 'Ver Eventos', href: '/app/events', icon: Calendar },
    { label: 'Configuración', href: '/app/settings', icon: ExternalLink },
  ];

  const getDisplayName = (user: typeof pendingUsers extends (infer U)[] | null ? U : never) => {
    if (user.nombre && user.apellido) {
      return `${user.nombre} ${user.apellido}`;
    }
    if (user.nombre) return user.nombre;
    return user.email;
  };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Superadmin"
        description="Vista general del sistema"
        breadcrumbs={[
          { label: 'Dashboard' },
        ]}
        actions={
          pendingCount > 0 ? (
            <Button onClick={() => navigate('/app/users')}>
              <Users className="w-4 h-4 mr-2" />
              Aprobar usuarios ({pendingCount})
            </Button>
          ) : null
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {stat.isLoading ? (
                    <Skeleton className="h-9 w-12 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usuarios Pendientes */}
        <Card className="lg:col-span-2 animate-fade-in-up animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-warning" />
              Usuarios Pendientes de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : pendingUsers && pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.slice(0, 5).map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted smooth-transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/20 text-warning font-bold text-sm">
                        {user.nombre?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{getDisplayName(user)}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(user.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </div>
                  </div>
                ))}
                {pendingUsers.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    Y {pendingUsers.length - 5} usuarios más...
                  </p>
                )}
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => navigate('/app/users')}
                >
                  Ver todos los usuarios pendientes
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 mx-auto text-success mb-3" />
                <p className="text-muted-foreground">No hay usuarios pendientes de aprobación</p>
                <p className="text-sm text-muted-foreground mt-1">¡Todo está al día!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accesos Rápidos */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up animation-delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Accesos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate(link.href)}
                >
                  <span className="flex items-center gap-2">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
