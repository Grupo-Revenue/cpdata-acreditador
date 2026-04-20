import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { PenTool, ClipboardList, Download, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventManagementDialog } from './EventManagementDialog';
import { DigitalSignatureDialog } from './DigitalSignatureDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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

interface EventsUserTableProps {
  deals: HubSpotDeal[];
  isSupervisor: boolean;
  userId?: string;
}

const PAGE_SIZE = 5;

export function EventsUserTable({ deals, isSupervisor, userId }: EventsUserTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [managementOpen, setManagementOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<HubSpotDeal | null>(null);
  const [signatureDeal, setSignatureDeal] = useState<HubSpotDeal | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [applyDeal, setApplyDeal] = useState<HubSpotDeal | null>(null);
  const [filters, setFilters] = useState({
    dealname: '',
    nombre_del_evento: '',
    tipo_de_evento: '',
    locacion_del_evento: '',
    fecha_inicio_del_evento: '',
    hora_de_inicio_y_fin_del_evento: '',
    estado: '',
    estadoEvento: '',
  });

  // Fetch user's application statuses and event statuses
  const { data: statusMap } = useQuery({
    queryKey: ['event-accreditor-status', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('event_accreditors')
        .select('application_status, payment_amount, events(hubspot_deal_id, status)')
        .eq('user_id', userId!);

      const map: Record<string, { applicationStatus: string; eventStatus: string; paymentAmount: number | null }> = {};
      for (const row of data ?? []) {
        const ev = row.events as any;
        if (ev?.hubspot_deal_id) {
          map[ev.hubspot_deal_id] = {
            applicationStatus: row.application_status,
            eventStatus: ev.status,
            paymentAmount: (row as any).payment_amount ?? null,
          };
        }
      }
      return map;
    },
  });

  // Fetch existing signatures for this user
  const { data: signatureMap } = useQuery({
    queryKey: ['user-signatures', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('digital_signatures')
        .select('event_id, events(hubspot_deal_id)')
        .eq('user_id', userId!);

      const map: Record<string, boolean> = {};
      for (const row of data ?? []) {
        const ev = (row as any).events;
        if (ev?.hubspot_deal_id) {
          map[ev.hubspot_deal_id] = true;
        }
      }
      return map;
    },
  });

  const getDisplayStatus = (dealId: string) => {
    const info = statusMap?.[dealId];
    if (!info) return { label: '—', color: '' };
    if (info.eventStatus === 'completed') return { label: 'Evento Finalizado', color: 'bg-muted text-muted-foreground border-muted' };
    if (info.applicationStatus === 'asignado') return { label: 'Asignado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (info.applicationStatus === 'aceptado') return { label: 'Aceptado', color: 'bg-success/10 text-success border-success/20' };
    if (info.applicationStatus === 'rechazado') return { label: 'Rechazado', color: 'bg-destructive/10 text-destructive border-destructive/20' };
    return { label: 'Pendiente', color: 'bg-warning/10 text-warning border-warning/20' };
  };

  const getEventStatusBadge = (dealId: string) => {
    const info = statusMap?.[dealId];
    if (info?.eventStatus === 'completed' || info?.eventStatus === 'cancelled') {
      return { label: 'Cerrado', className: 'bg-muted text-muted-foreground border-muted' };
    }
    return { label: 'Abierto', className: 'bg-success/10 text-success border-success/20' };
  };

  const isSignEnabled = (dealId: string) => {
    const info = statusMap?.[dealId];
    return info?.applicationStatus === 'aceptado' && info?.eventStatus !== 'completed';
  };

  const canApply = (dealId: string) => {
    const info = statusMap?.[dealId];
    return info?.applicationStatus === 'asignado' && info?.eventStatus !== 'completed' && info?.eventStatus !== 'cancelled';
  };

  const handleApply = async (deal: HubSpotDeal) => {
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('hubspot_deal_id', deal.id)
      .limit(1);
    
    const eventId = events?.[0]?.id;
    if (!eventId || !userId) return;

    const { error } = await supabase
      .from('event_accreditors')
      .update({ application_status: 'pendiente' } as any)
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo postular al evento.', variant: 'destructive' });
    } else {
      toast({ title: 'Postulación enviada', description: 'Tu postulación fue enviada correctamente.' });
      queryClient.invalidateQueries({ queryKey: ['event-accreditor-status', userId] });
    }
  };

  const hasSigned = (dealId: string) => !!signatureMap?.[dealId];

  const getPaymentAmount = (dealId: string) => {
    const info = statusMap?.[dealId];
    if (!info?.paymentAmount) return null;
    return info.paymentAmount;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const match = (value: string | null, filter: string) =>
        !filter || (value ?? '').toLowerCase().includes(filter.toLowerCase());
      const status = getDisplayStatus(deal.id);
      const evStatus = getEventStatusBadge(deal.id);
      return (
        match(deal.dealname, filters.dealname) &&
        match(deal.nombre_del_evento, filters.nombre_del_evento) &&
        match(deal.tipo_de_evento, filters.tipo_de_evento) &&
        match(deal.locacion_del_evento, filters.locacion_del_evento) &&
        match(deal.fecha_inicio_del_evento, filters.fecha_inicio_del_evento) &&
        match(deal.hora_de_inicio_y_fin_del_evento, filters.hora_de_inicio_y_fin_del_evento) &&
        match(evStatus.label, filters.estadoEvento) &&
        match(status.label, filters.estado)
      );
    });
  }, [deals, filters, statusMap]);

  const totalPages = Math.ceil(filteredDeals.length / PAGE_SIZE);
  const paginatedDeals = filteredDeals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignatureClick = (deal: HubSpotDeal) => {
    setSignatureDeal(deal);
    setSignatureOpen(true);
  };

  const handleGestionEvento = (deal: HubSpotDeal) => {
    setSelectedDeal(deal);
    setManagementOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-4">
        <Input placeholder="Filtrar Id..." value={filters.dealname} onChange={(e) => updateFilter('dealname', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Nombre..." value={filters.nombre_del_evento} onChange={(e) => updateFilter('nombre_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Tipo..." value={filters.tipo_de_evento} onChange={(e) => updateFilter('tipo_de_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Locación..." value={filters.locacion_del_evento} onChange={(e) => updateFilter('locacion_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Fecha..." value={filters.fecha_inicio_del_evento} onChange={(e) => updateFilter('fecha_inicio_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Horario..." value={filters.hora_de_inicio_y_fin_del_evento} onChange={(e) => updateFilter('hora_de_inicio_y_fin_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Estado Evento..." value={filters.estadoEvento} onChange={(e) => updateFilter('estadoEvento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Estado..." value={filters.estado} onChange={(e) => updateFilter('estado', e.target.value)} className="h-8 text-xs" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Id</TableHead>
                <TableHead>Nombre del Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Locación</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Estado Evento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No se encontraron eventos.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDeals.map((deal) => {
                  const status = getDisplayStatus(deal.id);
                  const signed = hasSigned(deal.id);
                  const signEnabled = isSignEnabled(deal.id);
                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.dealname ?? '—'}</TableCell>
                      <TableCell>{deal.nombre_del_evento ?? '—'}</TableCell>
                      <TableCell>{deal.tipo_de_evento ?? '—'}</TableCell>
                      <TableCell>{deal.locacion_del_evento ?? '—'}</TableCell>
                      <TableCell>{deal.fecha_inicio_del_evento ?? '—'}</TableCell>
                      <TableCell>{deal.hora_de_inicio_y_fin_del_evento ?? '—'}</TableCell>
                      <TableCell>
                        {(() => {
                          const evStatus = getEventStatusBadge(deal.id);
                          return (
                            <Badge variant="outline" className={evStatus.className}>
                              {evStatus.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getPaymentAmount(deal.id) !== null ? formatCurrency(getPaymentAmount(deal.id)!) : '—'}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        {canApply(deal.id) && (
                          <Button variant="ghost" size="icon" onClick={() => setApplyDeal(deal)} title="Postular al evento">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {signed ? (
                          <Button variant="ghost" size="icon" onClick={() => handleSignatureClick(deal)} title="Descargar contrato">
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleSignatureClick(deal)} title="Firma digital" disabled={!signEnabled}>
                            <PenTool className="h-4 w-4" />
                          </Button>
                        )}
                        {isSupervisor && (
                          <Button variant="ghost" size="icon" onClick={() => handleGestionEvento(deal)} title="Gestión del evento">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => p - 1); }} />
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
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => p + 1); }} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}

      {selectedDeal && (
        <EventManagementDialog
          open={managementOpen}
          onOpenChange={setManagementOpen}
          hubspotDealId={selectedDeal.id}
          dealName={selectedDeal.nombre_del_evento}
        />
      )}

      {userId && (
        <DigitalSignatureDialog
          open={signatureOpen}
          onOpenChange={setSignatureOpen}
          eventId={signatureDeal?.id ?? null}
          dealName={signatureDeal?.nombre_del_evento ?? signatureDeal?.dealname ?? null}
          userId={userId}
          horario={signatureDeal?.hora_de_inicio_y_fin_del_evento ?? undefined}
          locacion={signatureDeal?.locacion_del_evento ?? undefined}
          onSigned={() => queryClient.invalidateQueries({ queryKey: ['user-signatures', userId] })}
        />
      )}

      <ConfirmDialog
        open={!!applyDeal}
        onOpenChange={(open) => { if (!open) setApplyDeal(null); }}
        title="Confirmar postulación"
        description={`¿Está seguro que desea postular al evento "${applyDeal?.nombre_del_evento ?? applyDeal?.dealname ?? ''}"?`}
        confirmLabel="Postular"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (applyDeal) {
            handleApply(applyDeal);
            setApplyDeal(null);
          }
        }}
      />
    </>
  );
}
