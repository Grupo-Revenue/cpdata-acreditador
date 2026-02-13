import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RankingTable } from '@/components/dashboard/RankingTable';
import { FaqDialog } from '@/components/dashboard/FaqDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

export default function AcreditadorDashboard() {
  const { user } = useAuth();
  const [faqOpen, setFaqOpen] = useState(false);

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: eventsWeek, isLoading: l1 } = useQuery({
    queryKey: ['acred-events-week', user?.id, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_accreditors')
        .select('id, events!inner(event_date)')
        .eq('user_id', user!.id)
        .gte('events.event_date', weekStart)
        .lte('events.event_date', weekEnd);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user,
  });

  const { data: eventsMonth, isLoading: l2 } = useQuery({
    queryKey: ['acred-events-month', user?.id, monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_accreditors')
        .select('id, events!inner(event_date)')
        .eq('user_id', user!.id)
        .gte('events.event_date', monthStart)
        .lte('events.event_date', monthEnd);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!user,
  });

  const { data: totalEvents, isLoading: l3 } = useQuery({
    queryKey: ['acred-events-total', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_accreditors')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: totalEarned, isLoading: l4 } = useQuery({
    queryKey: ['acred-earned', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('amount')
        .eq('user_id', user!.id)
        .eq('status', 'pagado');
      if (error) throw error;
      return (data || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
    },
    enabled: !!user,
  });

  const isLoading = l1 || l2 || l3 || l4;

  const stats = [
    { title: 'Eventos Semana', value: eventsWeek ?? 0, icon: Calendar, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Eventos Mes', value: eventsMonth ?? 0, icon: CalendarDays, color: 'text-warning', bgColor: 'bg-warning/10' },
    { title: 'Total Participados', value: totalEvents ?? 0, icon: CheckCircle, color: 'text-accent', bgColor: 'bg-accent/10' },
    {
      title: 'Monto Ganado',
      value: `$${(totalEarned ?? 0).toLocaleString('es-CL')}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Mi Dashboard"
        description="Resumen de tu actividad"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingTable limit={5} />

        <Card
          className="gradient-primary text-primary-foreground cursor-pointer hover-lift animate-fade-in-up"
          onClick={() => setFaqOpen(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 rounded-full bg-white/20">
              <HelpCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold">Preguntas Frecuentes</h3>
            <p className="text-sm opacity-90">Revisa las respuestas a las dudas más comunes</p>
            <span className="inline-flex items-center gap-2 mt-2 bg-white/20 rounded-full px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors">
              Ver preguntas <ArrowRight className="w-4 h-4" />
            </span>
          </CardContent>
        </Card>
      </div>

      <FaqDialog open={faqOpen} onOpenChange={setFaqOpen} />
    </AppShell>
  );
}
