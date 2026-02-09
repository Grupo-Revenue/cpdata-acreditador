import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

function getStageBadgeClass(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes('ganado') || s.includes('cerrado ganado') || s.includes('completado') || s.includes('firmado'))
    return 'bg-success/10 text-success border-success/20';
  if (s.includes('progreso') || s.includes('activ') || s.includes('en curso'))
    return 'bg-primary/10 text-primary border-primary/20';
  if (s.includes('pendiente') || s.includes('espera') || s.includes('revisión'))
    return 'bg-warning/10 text-warning border-warning/20';
  if (s.includes('perdido') || s.includes('cancelado') || s.includes('rechazado'))
    return 'bg-destructive/10 text-destructive border-destructive/20';
  return 'bg-muted text-muted-foreground border-muted';
}

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

  const deals = data?.deals ?? [];
  const notConfigured = data?.error === 'hubspot_not_configured';

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(deals.length / PAGE_SIZE);
  const paginatedDeals = deals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [deals.length]);

  return (
    <AppShell>
      <PageHeader
        title="Eventos"
        description="Gestión de eventos y acreditaciones"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Eventos' },
        ]}
      />

      {isLoading ? (
        <LoadingState text="Cargando eventos..." className="py-12" />
      ) : notConfigured ? (
        <EmptyState
          icon={AlertCircle}
          title="HubSpot no configurado"
          description="Configura el token de HubSpot en la sección de Configuración para ver los eventos."
        />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin eventos"
          description="No se encontraron negocios en el pipeline y etapa configurados."
        />
      ) : (
        <>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Id</TableHead>
                  <TableHead>Nombre del Evento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Asistentes</TableHead>
                  <TableHead>Locación</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Etapa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.dealname ?? '—'}</TableCell>
                    <TableCell>{deal.nombre_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.tipo_de_evento ?? '—'}</TableCell>
                    <TableCell>{deal.cantidad_de_asistentes ?? '—'}</TableCell>
                    <TableCell>{deal.locacion_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.hora_de_inicio_y_fin_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.fecha_inicio_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.fecha_fin_del_evento ?? '—'}</TableCell>
                    <TableCell>
                      {deal.dealstage ? (
                        <Badge variant="outline" className={getStageBadgeClass(deal.dealstage)}>
                          {deal.dealstage}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => p - 1); }} />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink href="#" isActive={page === currentPage} onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (page === 2 && currentPage > 3) return <PaginationEllipsis key="start-ellipsis" />;
                if (page === totalPages - 1 && currentPage < totalPages - 2) return <PaginationEllipsis key="end-ellipsis" />;
                return null;
              })}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => p + 1); }} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </>
      )}
    </AppShell>
  );
}
