import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { InvoicesTable, type InvoiceRow } from '@/components/invoices/InvoicesTable';
import { InvoiceCreateDialog } from '@/components/invoices/InvoiceCreateDialog';
import { InvoiceEditDialog } from '@/components/invoices/InvoiceEditDialog';
import { InvoiceWhatsappDialog } from '@/components/invoices/InvoiceWhatsappDialog';

export default function InvoicesPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | null>(null);
  const [whatsappInvoice, setWhatsappInvoice] = useState<InvoiceRow | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          profiles:user_id(nombre, apellido, telefono),
          events:event_id(name, event_date)
        `)
        .order('invoice_number', { ascending: false });
      if (error) throw error;

      const items = data || [];
      const userIds = [...new Set(items.map(i => i.user_id))];

      let rolesMap: Record<string, string[]> = {};
      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        if (rolesData) {
          for (const r of rolesData) {
            if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
            rolesMap[r.user_id].push(r.role);
          }
        }
      }

      return items.map(inv => ({
        ...inv,
        roles: rolesMap[inv.user_id] || [],
      })) as unknown as InvoiceRow[];
    },
  });

  const filtered = invoices.filter((inv) => {
    const name = inv.profiles ? `${inv.profiles.nombre} ${inv.profiles.apellido}` : '';
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <PageHeader
        title="Boletas"
        description="Gestión de boletas y documentos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Boletas' },
        ]}
        actions={isAdmin ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Crear Boleta
          </Button>
        ) : undefined}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : filtered.length === 0 && !search && statusFilter === 'all' ? (
        <EmptyState
          icon={FileText}
          title="Sin boletas"
          description="Las boletas aparecerán aquí cuando se registren."
        />
      ) : (
        <InvoicesTable
          invoices={filtered}
          isAdmin={isAdmin}
          onEdit={setEditInvoice}
          onWhatsapp={setWhatsappInvoice}
          onUpload={setEditInvoice}
        />
      )}

      <InvoiceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceEditDialog open={!!editInvoice} onOpenChange={(o) => !o && setEditInvoice(null)} invoice={editInvoice} />
      <InvoiceWhatsappDialog open={!!whatsappInvoice} onOpenChange={(o) => !o && setWhatsappInvoice(null)} invoice={whatsappInvoice} />
    </AppShell>
  );
}
