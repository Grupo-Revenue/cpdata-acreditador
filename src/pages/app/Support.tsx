import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { TicketsTable } from '@/components/support/TicketsTable';
import { TicketCreateDialog } from '@/components/support/TicketCreateDialog';
import { TicketEditDialog } from '@/components/support/TicketEditDialog';
import { TicketDetailDialog } from '@/components/support/TicketDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HeadphonesIcon, Plus, Search } from 'lucide-react';

interface SupportTicket {
  id: string;
  ticket_number: number;
  motivo: string;
  status: 'pendiente' | 'resuelto' | 'inactivo';
  priority: 'alta' | 'media' | 'baja';
  observaciones: string | null;
  evidence_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  creator_nombre: string;
  creator_apellido: string;
  creator_email: string;
  creator_telefono: string | null;
  creator_rut: string;
  creator_role: string;
  editor_nombre: string | null;
  editor_apellido: string | null;
  editor_email: string | null;
  editor_telefono: string | null;
  editor_rut: string | null;
  editor_role: string | null;
}

export default function SupportPage() {
  const { isAdmin } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<SupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<SupportTicket | null>(null);

  const [searchCreator, setSearchCreator] = useState('');
  const [filterPriority, setFilterPriority] = useState('todas');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as SupportTicket[]) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const baseFiltered = useMemo(() => {
    return tickets
      .filter(t => {
        if (!searchCreator) return true;
        const fullName = `${t.creator_nombre} ${t.creator_apellido}`.toLowerCase();
        return fullName.includes(searchCreator.toLowerCase());
      })
      .filter(t => filterPriority === 'todas' || t.priority === filterPriority);
  }, [tickets, searchCreator, filterPriority]);

  const pendingTickets = useMemo(() => baseFiltered.filter(t => t.status === 'pendiente'), [baseFiltered]);
  const resolvedTickets = useMemo(() => baseFiltered.filter(t => t.status === 'resuelto' || t.status === 'inactivo'), [baseFiltered]);

  const handleEdit = (ticket: SupportTicket) => {
    setEditTicket(ticket);
    setEditOpen(true);
  };

  const handleView = (ticket: SupportTicket) => {
    setDetailTicket(ticket);
    setDetailOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="Soporte"
        description="Tickets de soporte y ayuda"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Soporte' },
        ]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Ticket
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? 'Tickets de Soporte' : 'Mis Tickets'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {isAdmin && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre del creador..."
                  value={searchCreator}
                  onChange={e => setSearchCreator(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="pendientes">
            <TabsList>
              <TabsTrigger value="pendientes">Pendientes ({pendingTickets.length})</TabsTrigger>
              <TabsTrigger value="resueltos">Resueltos ({resolvedTickets.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pendientes">
              {isLoading ? (
                <LoadingState />
              ) : pendingTickets.length === 0 ? (
                <EmptyState icon={HeadphonesIcon} title="Sin tickets pendientes" description="No se encontraron tickets pendientes con los filtros aplicados." />
              ) : (
                <TicketsTable tickets={pendingTickets} canEdit={isAdmin} canView={!isAdmin} showCreatorColumns={isAdmin} onEdit={handleEdit} onView={handleView} />
              )}
            </TabsContent>
            <TabsContent value="resueltos">
              {isLoading ? (
                <LoadingState />
              ) : resolvedTickets.length === 0 ? (
                <EmptyState icon={HeadphonesIcon} title="Sin tickets resueltos" description="No se encontraron tickets resueltos con los filtros aplicados." />
              ) : (
                <TicketsTable tickets={resolvedTickets} canEdit={isAdmin} canView={!isAdmin} showCreatorColumns={isAdmin} onEdit={handleEdit} onView={handleView} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TicketCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchTickets} />
      <TicketEditDialog open={editOpen} onOpenChange={setEditOpen} ticket={editTicket} onUpdated={fetchTickets} />
      <TicketDetailDialog open={detailOpen} onOpenChange={setDetailOpen} ticket={detailTicket} />
    </AppShell>
  );
}
