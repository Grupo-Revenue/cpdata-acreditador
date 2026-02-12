import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CalendarDays, CheckCircle, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RankingTable } from '@/components/dashboard/RankingTable';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupervisorDashboard() {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['supervisor-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return { today: 0, month: 0, total: 0, paid: 0 };

      const { data: assignments } = await supabase
        .from('event_accreditors')
        .select('event_id, events(event_date)')
        .eq('user_id', user.id);

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

      const eventsToday = (assignments || []).filter(a => {
        const ev = a.events as { event_date: string } | null;
        return ev?.event_date === today;
      }).length;

      const eventsMonth = (assignments || []).filter(a => {
        const ev = a.events as { event_date: string } | null;
        return ev?.event_date && ev.event_date >= monthStart && ev.event_date <= monthEnd;
      }).length;

      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pagado');

      return {
        today: eventsToday,
        month: eventsMonth,
        total: (assignments || []).length,
        paid: count || 0,
      };
    },
    enabled: !!user?.id,
  });

  const stats = [
    { title: 'Eventos Hoy', value: metrics?.today ?? 0, icon: Calendar, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Eventos Mes', value: metrics?.month ?? 0, icon: CalendarDays, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Total Participados', value: metrics?.total ?? 0, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' },
    { title: 'Boletas Pagadas', value: metrics?.paid ?? 0, icon: Receipt, color: 'text-warning', bgColor: 'bg-warning/10' },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Supervisor"
        description="Control de eventos y acreditadores"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RankingTable limit={5} />
    </AppShell>
  );
}
