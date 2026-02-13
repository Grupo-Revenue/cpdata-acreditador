import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { PenTool, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventManagementDialog } from './EventManagementDialog';

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
}

const PAGE_SIZE = 5;

export function EventsUserTable({ deals, isSupervisor }: EventsUserTableProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [managementOpen, setManagementOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<HubSpotDeal | null>(null);
  const [filters, setFilters] = useState({
    dealname: '',
    nombre_del_evento: '',
    tipo_de_evento: '',
    locacion_del_evento: '',
    fecha_inicio_del_evento: '',
    hora_de_inicio_y_fin_del_evento: '',
  });

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const match = (value: string | null, filter: string) =>
        !filter || (value ?? '').toLowerCase().includes(filter.toLowerCase());
      return (
        match(deal.dealname, filters.dealname) &&
        match(deal.nombre_del_evento, filters.nombre_del_evento) &&
        match(deal.tipo_de_evento, filters.tipo_de_evento) &&
        match(deal.locacion_del_evento, filters.locacion_del_evento) &&
        match(deal.fecha_inicio_del_evento, filters.fecha_inicio_del_evento) &&
        match(deal.hora_de_inicio_y_fin_del_evento, filters.hora_de_inicio_y_fin_del_evento)
      );
    });
  }, [deals, filters]);

  const totalPages = Math.ceil(filteredDeals.length / PAGE_SIZE);
  const paginatedDeals = filteredDeals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFirmaDigital = () => {
    toast({ title: 'Firma digital', description: 'Funcionalidad próximamente disponible.' });
  };

  const handleGestionEvento = (deal: HubSpotDeal) => {
    setSelectedDeal(deal);
    setManagementOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <Input placeholder="Filtrar Id..." value={filters.dealname} onChange={(e) => updateFilter('dealname', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Nombre..." value={filters.nombre_del_evento} onChange={(e) => updateFilter('nombre_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Tipo..." value={filters.tipo_de_evento} onChange={(e) => updateFilter('tipo_de_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Locación..." value={filters.locacion_del_evento} onChange={(e) => updateFilter('locacion_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Fecha..." value={filters.fecha_inicio_del_evento} onChange={(e) => updateFilter('fecha_inicio_del_evento', e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Filtrar Horario..." value={filters.hora_de_inicio_y_fin_del_evento} onChange={(e) => updateFilter('hora_de_inicio_y_fin_del_evento', e.target.value)} className="h-8 text-xs" />
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
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron eventos.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.dealname ?? '—'}</TableCell>
                    <TableCell>{deal.nombre_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.tipo_de_evento ?? '—'}</TableCell>
                    <TableCell>{deal.locacion_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.fecha_inicio_del_evento ?? '—'}</TableCell>
                    <TableCell>{deal.hora_de_inicio_y_fin_del_evento ?? '—'}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={handleFirmaDigital} title="Firma digital">
                        <PenTool className="h-4 w-4" />
                      </Button>
                      {isSupervisor && (
                        <Button variant="ghost" size="icon" onClick={() => handleGestionEvento(deal)} title="Gestión del evento">
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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
    </>
  );
}
