import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, FileText, Wallet, Download, Link } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { RankingTable } from '@/components/dashboard/RankingTable';
import { startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: pendingInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['pending-invoices-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente');
      if (error) throw error;
      return count || 0;
    },
  });

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
    },
  });

  const stats = [
    { title: 'Eventos Hoy', value: (eventCounts?.today ?? 0).toString(), icon: Calendar, trend: 'Programados para hoy', color: 'text-primary', bgColor: 'bg-primary/10', isLoading: loadingEvents },
    { title: 'Eventos del Mes', value: (eventCounts?.month ?? 0).toString(), icon: Calendar, trend: 'En este mes', color: 'text-accent', bgColor: 'bg-accent/10', isLoading: loadingEvents },
    { title: 'Eventos Semanales', value: (eventCounts?.week ?? 0).toString(), icon: Calendar, trend: 'En esta semana', color: 'text-success', bgColor: 'bg-success/10', isLoading: loadingEvents },
    { title: 'Boletas Pendientes', value: pendingInvoices?.toString() || '0', icon: FileText, trend: (pendingInvoices || 0) > 0 ? 'Requieren revisión' : 'Todo al día', color: 'text-warning', bgColor: 'bg-warning/10', isLoading: loadingInvoices },
  ];

  const quickLinks = [
    { label: 'Rendiciones', icon: Wallet, action: () => navigate('/app/reimbursements') },
    { label: 'Detalle de Rendiciones', icon: FileText, action: () => navigate('/app/reimbursements') },
    { label: 'Descargar Excel Rendiciones', icon: Download, action: () => toast.info('Funcionalidad próximamente disponible') },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Administración"
        description="Gestión de eventos y personal"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

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
        <RankingTable className="lg:col-span-2" />
        <div className="space-y-6">
          <Card className="animate-fade-in-up animation-delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Accesos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link, index) => (
                <Button key={index} variant="outline" className="w-full justify-start gap-2" onClick={link.action}>
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
