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
  LayoutGrid,
  MessageCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { RankingTable } from '@/components/dashboard/RankingTable';
import { RecentTicketsTable } from '@/components/dashboard/RecentTicketsTable';
import { startOfWeek, endOfWeek } from 'date-fns';

interface SuperadminDashboardProps {
  title?: string;
  description?: string;
}

export default function SuperadminDashboard({
  title = 'Dashboard Superadmin',
  description = 'Vista general del sistema',
}: SuperadminDashboardProps) {
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

  // Query para eventos desde HubSpot
  const { data: eventCounts, isLoading: loadingEvents } = useQuery({
    queryKey: ['hubspot-events-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hubspot-deals');
      if (error) throw error;
      const deals: { fecha_inicio_del_evento?: string | null }[] = data?.deals ?? [];

      const parseDate = (d: string | null | undefined): string | null => {
        if (!d) return null;
        const parts = d.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return d;
      };

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      return {
        today: deals.filter(d => parseDate(d.fecha_inicio_del_evento) === today).length,
        week: deals.filter(d => { const p = parseDate(d.fecha_inicio_del_evento); return p != null && p >= weekStart && p <= weekEnd; }).length,
        month: deals.filter(d => { const p = parseDate(d.fecha_inicio_del_evento); return p != null && p >= monthStart && p <= monthEnd; }).length,
      };
    }
  });

  const stats = [
    {
      title: 'Eventos Hoy',
      value: (eventCounts?.today ?? 0).toString(),
      icon: Calendar,
      trend: 'Programados para hoy',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isLoading: loadingEvents,
    },
    {
      title: 'Eventos del Mes',
      value: (eventCounts?.month ?? 0).toString(),
      icon: Calendar,
      trend: 'En este mes',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      isLoading: loadingEvents,
    },
    {
      title: 'Eventos Semanales',
      value: (eventCounts?.week ?? 0).toString(),
      icon: Calendar,
      trend: 'En esta semana',
      color: 'text-success',
      bgColor: 'bg-success/10',
      isLoading: loadingEvents,
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
  const TRELLO_URL = 'https://id.atlassian.com/login?application=trello&continue=https%3A%2F%2Ftrello.com%2Fauth%2Fatlassian%2Fcallback%3Fdisplay%3DeyJ2ZXJpZmljYXRpb25TdHJhdGVneSI6InNvZnQifQ%253D%253D&display=eyJ2ZXJpZmljYXRpb25TdHJhdGVneSI6InNvZnQifQ%3D%3D';
  const HUBSPOT_URL = 'https://app.hubspot.com/login/';

  const quickLinks = [
    { 
      label: 'Cotización', 
      href: 'https://cpdata.lovable.app', 
      icon: FileText,
      isExternal: true 
    },
    { 
      label: 'Trello', 
      href: TRELLO_URL, 
      icon: LayoutGrid,
      isExternal: true 
    },
    { 
      label: 'Hubspot', 
      href: HUBSPOT_URL, 
      icon: MessageCircle,
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
        title={title}
        description={description}
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
        <RankingTable className="lg:col-span-2" />

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

      {/* Recent Tickets */}
      <div className="mt-6">
        <RecentTicketsTable />
      </div>
    </AppShell>
  );
}
