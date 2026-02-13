import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertCircle, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EventsAdminTable } from '@/components/events/EventsAdminTable';
import { EventsUserTable } from '@/components/events/EventsUserTable';
import { EventApplicantsDialog } from '@/components/events/EventApplicantsDialog';
import { Button } from '@/components/ui/button';

interface HubSpotDeal {
  id: string;
  dealname: string | null;
  nombre_del_evento: string | null;
  tipo_de_evento: string | null;
  cantidad_de_asistentes: string | null;
  locacion_del_evento: string | null;
  hora_de_inicio_y_fin_del_evento: string | null;
  fecha_inicio_del_evento: string | null;
  fecha_fin_del_evento: string | null;
  dealstage: string | null;
}

export default function EventsPage() {
  const { toast } = useToast();
  const { activeRole, user } = useAuth();
  const isAdmin = activeRole === 'superadmin' || activeRole === 'administracion';
  const isSupervisor = activeRole === 'supervisor';
  const [applicantsOpen, setApplicantsOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['hubspot-deals'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hubspot-deals');
      if (error) throw error;
      if (data?.error && data.error !== 'hubspot_not_configured') {
        throw new Error(data.error);
      }
      return data as { deals: HubSpotDeal[]; error?: string };
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos de HubSpot.',
        variant: 'destructive',
      });
    }
  }, [error]);

  const allDeals = data?.deals ?? [];
  const notConfigured = data?.error === 'hubspot_not_configured';

  // Sync nombre_del_evento from HubSpot to local events table
  useEffect(() => {
    if (allDeals.length === 0) return;
    const syncNames = async () => {
      for (const deal of allDeals) {
        if (deal.nombre_del_evento && deal.id) {
          await supabase
            .from('events')
            .update({ name: deal.nombre_del_evento })
            .eq('hubspot_deal_id', deal.id);
        }
      }
    };
    syncNames();
  }, [allDeals]);

  // For supervisor/acreditador: fetch assigned deal IDs
  const { data: assignedDealIds } = useQuery({
    queryKey: ['assigned-deal-ids', user?.id],
    enabled: !isAdmin && !!user?.id,
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('event_accreditors')
        .select('event_id, events(hubspot_deal_id)')
        .eq('user_id', user!.id);

      return (assignments ?? [])
        .map((a: any) => a.events?.hubspot_deal_id)
        .filter(Boolean) as string[];
    },
  });

  const userDeals = useMemo(() => {
    if (isAdmin) return allDeals;
    if (!assignedDealIds) return [];
    return allDeals.filter((d) => assignedDealIds.includes(d.id));
  }, [isAdmin, allDeals, assignedDealIds]);

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Eventos"
          description="Gestión de eventos y acreditaciones"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app/dashboard' },
            { label: 'Eventos' },
          ]}
        />
        {isAdmin && (
          <Button onClick={() => setApplicantsOpen(true)} variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            Postulantes
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState text="Cargando eventos..." className="py-12" />
      ) : notConfigured ? (
        <EmptyState
          icon={AlertCircle}
          title="HubSpot no configurado"
          description="Configura el token de HubSpot en la sección de Configuración para ver los eventos."
        />
      ) : userDeals.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin eventos"
          description={isAdmin ? "No se encontraron negocios en el pipeline y etapa configurados." : "No tienes eventos asignados."}
        />
      ) : isAdmin ? (
        <EventsAdminTable deals={userDeals} />
      ) : (
        <EventsUserTable deals={userDeals} isSupervisor={isSupervisor} userId={user?.id} />
      )}

      {isAdmin && (
        <EventApplicantsDialog open={applicantsOpen} onOpenChange={setApplicantsOpen} />
      )}
    </AppShell>
  );
}
