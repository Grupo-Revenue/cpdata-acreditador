import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { TicketsTable } from '@/components/support/TicketsTable';
import { TicketCreateDialog } from '@/components/support/TicketCreateDialog';
import { TicketEditDialog } from '@/components/support/TicketEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HeadphonesIcon, Plus } from 'lucide-react';

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

  const pendientes = tickets.filter(t => t.status === 'pendiente');
  const resueltos = tickets.filter(t => t.status === 'resuelto');

  const handleEdit = (ticket: SupportTicket) => {
    setEditTicket(ticket);
    setEditOpen(true);
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

      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendientes">Pendientes ({pendientes.length})</TabsTrigger>
          <TabsTrigger value="resueltos">Resueltos ({resueltos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes">
          <Card>
            <CardHeader>
              <CardTitle>Tickets Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState />
              ) : pendientes.length === 0 ? (
                <EmptyState icon={HeadphonesIcon} title="Sin tickets pendientes" description="No hay tickets pendientes en este momento." />
              ) : (
                <TicketsTable tickets={pendientes} canEdit={isAdmin} onEdit={handleEdit} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resueltos">
          <Card>
            <CardHeader>
              <CardTitle>Tickets Resueltos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState />
              ) : resueltos.length === 0 ? (
                <EmptyState icon={HeadphonesIcon} title="Sin tickets resueltos" description="No hay tickets resueltos aún." />
              ) : (
                <TicketsTable tickets={resueltos} canEdit={isAdmin} onEdit={handleEdit} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TicketCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchTickets} />
      <TicketEditDialog open={editOpen} onOpenChange={setEditOpen} ticket={editTicket} onUpdated={fetchTickets} />
    </AppShell>
  );
}
