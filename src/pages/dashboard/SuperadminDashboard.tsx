import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  UserPlus,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { RankingTable } from '@/components/dashboard/RankingTable';

export default function SuperadminDashboard() {
  const navigate = useNavigate();

  // Query para usuarios pendientes
  const { data: pendingCount, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Query para eventos de hoy
  const { data: eventsTodayCount, isLoading: loadingEventsToday } = useQuery({
    queryKey: ['events-today-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('event_date', today);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Query para eventos del mes
  const { data: eventsMonthCount, isLoading: loadingEventsMonth } = useQuery({
    queryKey: ['events-month-count'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', firstDayOfMonth)
        .lte('event_date', lastDayOfMonth);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Query para eventos del día (igual que hoy, pero podría diferir si se define de otra manera)
  const { data: eventsDayCount, isLoading: loadingEventsDay } = useQuery({
    queryKey: ['events-day-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('event_date', today);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const stats = [
    {
      title: 'Eventos Hoy',
      value: eventsTodayCount?.toString() || '0',
      icon: Calendar,
      trend: 'Programados para hoy',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isLoading: loadingEventsToday,
    },
    {
      title: 'Eventos del Mes',
      value: eventsMonthCount?.toString() || '0',
      icon: Calendar,
      trend: 'En este mes',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      isLoading: loadingEventsMonth,
    },
    {
      title: 'Eventos del Día',
      value: eventsDayCount?.toString() || '0',
      icon: Calendar,
      trend: 'En curso hoy',
      color: 'text-success',
      bgColor: 'bg-success/10',
      isLoading: loadingEventsDay,
    },
    {
      title: 'Usuarios Pendientes',
      value: pendingCount?.toString() || '0',
      icon: UserPlus,
      trend: (pendingCount || 0) > 0 ? 'Requieren aprobación' : 'Todo al día',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      isLoading: loadingPending,
    },
  ];

  // External URLs - can be made configurable via settings table later
  const TRELLO_URL = 'https://trello.com';
  const HUBSPOT_URL = 'https://app.hubspot.com';

  const quickLinks = [
    { 
      label: 'Cotización', 
      href: '/app/quotes', 
      icon: FileText,
      isExternal: false 
    },
    { 
      label: 'Trello', 
      href: TRELLO_URL, 
      icon: ExternalLink,
      isExternal: true 
    },
    { 
      label: 'Hubspot', 
      href: HUBSPOT_URL, 
      icon: ExternalLink,
      isExternal: true 
    },
  ];

  const handleQuickLinkClick = (link: typeof quickLinks[0]) => {
    if (link.isExternal) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link.href);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Superadmin"
        description="Vista general del sistema"
        breadcrumbs={[
          { label: 'Dashboard' },
        ]}
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
        {/* Ranking Table */}
        <RankingTable />

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
                  onClick={() => handleQuickLinkClick(link)}
                >
                  <span className="flex items-center gap-2">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                  {link.isExternal && (
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
