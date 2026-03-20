import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Pencil, Users, Download, FileDown, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { generateProfessionalPDF } from '@/lib/contract-utils';
import { EventEditDialog } from '@/components/events/EventEditDialog';
import { EventTeamDialog } from '@/components/events/EventTeamDialog';
import { BulkWhatsappEventsDialog } from '@/components/events/BulkWhatsappEventsDialog';

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

interface EventsAdminTableProps {
  deals: HubSpotDeal[];
}

const PAGE_SIZE = 5;


export function EventsAdminTable({ deals }: EventsAdminTableProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole('superadmin') || hasRole('administracion');
  const canAssignTeam = hasRole('superadmin') || hasRole('administracion');

  // Fetch internal event statuses by hubspot_deal_id
  const dealIds = deals.map((d) => d.id);
  const { data: eventStatusMap } = useQuery({
    queryKey: ['event-statuses-admin', dealIds],
    enabled: dealIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('hubspot_deal_id, status')
        .in('hubspot_deal_id', dealIds);
      const map: Record<string, string> = {};
      for (const ev of data ?? []) {
        if (ev.hubspot_deal_id) map[ev.hubspot_deal_id] = ev.status;
      }
      return map;
    },
  });

  const getEventStatusBadge = (dealId: string) => {
    const status = eventStatusMap?.[dealId];
    if (status === 'completed' || status === 'cancelled') {
      return { label: 'Cerrado', className: 'bg-muted text-muted-foreground border-muted' };
    }
    return { label: 'Abierto', className: 'bg-success/10 text-success border-success/20' };
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [editingDeal, setEditingDeal] = useState<HubSpotDeal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [teamDeal, setTeamDeal] = useState<HubSpotDeal | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  const totalPages = Math.ceil(deals.length / PAGE_SIZE);
  const paginatedDeals = deals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [deals.length]);

  const downloadContractsForDeal = async (deal: HubSpotDeal) => {
    // Get internal event
    const { data: eventData } = await supabase
      .from('events')
      .select('id')
      .eq('hubspot_deal_id', deal.id)
      .maybeSingle();

    if (!eventData) {
      toast({ title: 'Sin contratos', description: 'No se encontró el evento local.', variant: 'destructive' });
      return;
    }

    const { data: signatures } = await supabase
      .from('digital_signatures')
      .select('contract_text, signer_name, signed_at')
      .eq('event_id', eventData.id);

    if (!signatures || signatures.length === 0) {
      toast({ title: 'Sin contratos', description: 'No hay contratos firmados para este evento.' });
      return;
    }

    const doc = new jsPDF();
    signatures.forEach((sig, i) => {
      generateProfessionalPDF(doc, sig.contract_text, sig.signer_name, new Date(sig.signed_at), i > 0);
    });
    const name = signatures.length === 1
      ? `contrato-${deal.nombre_del_evento ?? deal.dealname ?? 'evento'}-${signatures[0].signer_name}.pdf`
      : `contratos-${deal.nombre_del_evento ?? deal.dealname ?? 'evento'}.pdf`;
    doc.save(name);
  };

  const downloadAllContracts = async () => {
    // Get all hubspot deal ids
    const dealIds = deals.map((d) => d.id);
    const { data: events } = await supabase
      .from('events')
      .select('id, hubspot_deal_id, name')
      .in('hubspot_deal_id', dealIds);

    if (!events || events.length === 0) {
      toast({ title: 'Sin contratos', description: 'No se encontraron eventos locales.' });
      return;
    }

    const eventIds = events.map((e) => e.id);
    const { data: signatures } = await supabase
      .from('digital_signatures')
      .select('contract_text, signer_name, signed_at, event_id')
      .in('event_id', eventIds);

    if (!signatures || signatures.length === 0) {
      toast({ title: 'Sin contratos', description: 'No hay contratos firmados.' });
      return;
    }

    const eventNameMap: Record<string, string> = {};
    for (const ev of events) {
      eventNameMap[ev.id] = ev.name;
    }

    const doc = new jsPDF();
    signatures.forEach((sig, i) => {
      generateProfessionalPDF(doc, sig.contract_text, sig.signer_name, new Date(sig.signed_at), i > 0);
    });
    doc.save('todos-los-contratos.pdf');
  };

  return (
    <>
      <div className="flex justify-end gap-2 mb-2">
        <Button variant="outline" size="sm" onClick={() => setWhatsappDialogOpen(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Enviar WhatsApp Masivo
        </Button>
        <Button variant="outline" size="sm" onClick={downloadAllContracts}>
          <FileDown className="h-4 w-4 mr-2" />
          Descargar Todos los Contratos
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[900px]">
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
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
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
                  <TableCell className="flex gap-1">
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => { setEditingDeal(deal); setEditDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canAssignTeam && (
                      <Button variant="ghost" size="icon" onClick={() => { setTeamDeal(deal); setTeamDialogOpen(true); }}>
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => downloadContractsForDeal(deal)} title="Descargar contratos">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
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

      <EventEditDialog deal={editingDeal} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
      <EventTeamDialog
        dealId={teamDeal?.id ?? null}
        dealName={teamDeal?.nombre_del_evento ?? teamDeal?.dealname ?? null}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
      />
      <BulkWhatsappEventsDialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen} />
    </>
  );
}
