import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/button';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { InvoicesTable, type InvoiceRow } from '@/components/invoices/InvoicesTable';
import { InvoiceCreateDialog } from '@/components/invoices/InvoiceCreateDialog';
import { InvoiceEditDialog } from '@/components/invoices/InvoiceEditDialog';
import { InvoiceUploadDialog } from '@/components/invoices/InvoiceUploadDialog';
import { InvoiceWhatsappDialog } from '@/components/invoices/InvoiceWhatsappDialog';
import { BulkWhatsappInvoicesDialog } from '@/components/invoices/BulkWhatsappInvoicesDialog';

export default function InvoicesPage() {
  const { isAdmin, user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | null>(null);
  const [uploadInvoice, setUploadInvoice] = useState<InvoiceRow | null>(null);
  const [whatsappInvoice, setWhatsappInvoice] = useState<InvoiceRow | null>(null);

  const { data: paymentDays = [5, 15, 25] } = useQuery({
    queryKey: ['payment_days'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_days')
        .maybeSingle();
      if (data?.value) {
        const parsed = data.value.split(',').map(Number);
        if (parsed.length === 3 && parsed.every((n) => n >= 1 && n <= 28)) return parsed;
      }
      return [5, 15, 25];
    },
  });

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

      // Fetch approved expenses per user/event
      let expensesMap: Record<string, Record<string, number>> = {};
      if (userIds.length > 0) {
        const { data: expensesData } = await supabase
          .from('event_expenses')
          .select('user_id, event_id, amount')
          .in('user_id', userIds)
          .eq('approval_status', 'aprobado');
        if (expensesData) {
          for (const exp of expensesData) {
            if (!exp.user_id) continue;
            if (!expensesMap[exp.user_id]) expensesMap[exp.user_id] = {};
            if (!expensesMap[exp.user_id][exp.event_id]) expensesMap[exp.user_id][exp.event_id] = 0;
            expensesMap[exp.user_id][exp.event_id] += exp.amount;
          }
        }
      }

      return items.map(inv => {
        const approvedExpenses = expensesMap[inv.user_id]?.[inv.event_id] || 0;
        return {
          ...inv,
          roles: rolesMap[inv.user_id] || [],
          total_amount: inv.amount + approvedExpenses,
        };
      }) as unknown as InvoiceRow[];
    },
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

      {(() => {
        const displayInvoices = isAdmin ? invoices : invoices.filter(inv => inv.user_id === user?.id);
        return isLoading ? (
          <LoadingState />
        ) : displayInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin boletas"
          description="Las boletas aparecerán aquí cuando se registren."
        />
      ) : (
        <InvoicesTable
          invoices={displayInvoices}
          isAdmin={isAdmin}
          paymentDays={paymentDays}
          onEdit={setEditInvoice}
          onWhatsapp={setWhatsappInvoice}
          onUpload={setUploadInvoice}
        />
        );
      })()}

      <InvoiceCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceEditDialog open={!!editInvoice} onOpenChange={(o) => !o && setEditInvoice(null)} invoice={editInvoice} />
      <InvoiceUploadDialog open={!!uploadInvoice} onOpenChange={(o) => !o && setUploadInvoice(null)} invoice={uploadInvoice} />
      <InvoiceWhatsappDialog open={!!whatsappInvoice} onOpenChange={(o) => !o && setWhatsappInvoice(null)} invoice={whatsappInvoice} />
    </AppShell>
  );
}
