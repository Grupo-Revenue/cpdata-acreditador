import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Wallet, Lock, Unlock, CheckCircle, XCircle, DollarSign, Plus, Trash2, Upload } from 'lucide-react';

export default function ReimbursementsPage() {
  const { activeRole, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSuperadmin = activeRole === 'superadmin';
  const isSupervisor = activeRole === 'supervisor';
  const isAdmin = activeRole === 'superadmin' || activeRole === 'administracion';

  const [confirmAction, setConfirmAction] = useState<{ type: string; eventId: string; expenseId?: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseFile, setNewExpenseFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // For supervisors: get assigned events; for admins: get all events with expenses
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['reimbursement-events', user?.id, activeRole],
    enabled: !!user?.id,
    queryFn: async () => {
      if (isAdmin) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
      } else {
        // Supervisor: only assigned events
        const { data: assignments, error: aErr } = await supabase
          .from('event_accreditors')
          .select('event_id')
          .eq('user_id', user!.id);
        if (aErr) throw aErr;
        const eventIds = (assignments ?? []).map(a => a.event_id);
        if (eventIds.length === 0) return [];
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
      }
    },
  });

  // Get all expenses for these events
  const eventIds = (events ?? []).map(e => e.id);
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['reimbursement-expenses', eventIds],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_expenses')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Get profiles for expense user names
  const expenseUserIds = [...new Set((expenses ?? []).filter(e => e.user_id).map(e => e.user_id))];
  const { data: profiles } = useQuery({
    queryKey: ['expense-profiles', expenseUserIds],
    enabled: expenseUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', expenseUserIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return 'Evento';
    const p = profiles?.find(pr => pr.id === userId);
    return p ? `${p.nombre} ${p.apellido}` : userId.substring(0, 8);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['reimbursement-events'] });
    queryClient.invalidateQueries({ queryKey: ['reimbursement-expenses'] });
  };

  // Approve expense
  const approveExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('event_expenses')
      .update({ approval_status: 'aprobado' as any, approved_by: user!.id })
      .eq('id', expenseId);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Gasto aprobado' });
    invalidateAll();
  };

  // Create event-level expense (supervisor)
  const createEventExpense = async (eventId: string) => {
    if (!newExpenseName.trim() || !newExpenseAmount) return;
    setSubmitting(true);
    let receiptUrl: string | null = null;
    if (newExpenseFile) {
      const filePath = `${eventId}/${Date.now()}-${newExpenseFile.name}`;
      const { error: upErr } = await supabase.storage.from('expense-receipts').upload(filePath, newExpenseFile);
      if (upErr) { toast({ title: 'Error subiendo comprobante', variant: 'destructive' }); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('expense-receipts').getPublicUrl(filePath);
      receiptUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('event_expenses').insert({
      event_id: eventId,
      name: newExpenseName.trim(),
      amount: parseInt(newExpenseAmount),
      receipt_url: receiptUrl,
      created_by: user!.id,
    } as any);
    setSubmitting(false);
    if (error) { toast({ title: 'Error al crear gasto', variant: 'destructive' }); return; }
    toast({ title: 'Adicional agregado' });
    setNewExpenseName(''); setNewExpenseAmount(''); setNewExpenseFile(null); setShowAddForm(null);
    invalidateAll();
  };

  // Delete expense (supervisor, own created)
  const deleteExpense = async (expenseId: string) => {
    const { error } = await supabase.from('event_expenses').delete().eq('id', expenseId);
    if (error) { toast({ title: 'Error al eliminar', variant: 'destructive' }); return; }
    toast({ title: 'Gasto eliminado' });
    invalidateAll();
  };

  // Reject expense
  const rejectExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('event_expenses')
      .update({ approval_status: 'rechazado' as any })
      .eq('id', expenseId);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Gasto rechazado' });
    invalidateAll();
  };

  // Close reimbursements (supervisor)
  const closeReimbursements = async (eventId: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('events')
      .update({ reimbursement_closed_at: new Date().toISOString(), reimbursement_closed_by: user!.id })
      .eq('id', eventId);
    setProcessing(false);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Rendiciones cerradas' });
    invalidateAll();
    setConfirmAction(null);
  };

  // Reopen event (superadmin)
  const reopenEvent = async (eventId: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('events')
      .update({ closed_at: null, closed_by: null, status: 'in_progress' as any })
      .eq('id', eventId);
    setProcessing(false);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Evento rehabilitado' });
    invalidateAll();
    setConfirmAction(null);
  };

  // Reopen reimbursements (superadmin)
  const reopenReimbursements = async (eventId: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('events')
      .update({ reimbursement_closed_at: null, reimbursement_closed_by: null })
      .eq('id', eventId);
    setProcessing(false);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); return; }
    toast({ title: 'Rendiciones reabiertas' });
    invalidateAll();
    setConfirmAction(null);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'close_reimbursement') closeReimbursements(confirmAction.eventId);
    if (confirmAction.type === 'reopen_event') reopenEvent(confirmAction.eventId);
    if (confirmAction.type === 'reopen_reimbursement') reopenReimbursements(confirmAction.eventId);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'aprobado') return <Badge className="bg-primary/10 text-primary border-primary/20">Aprobado</Badge>;
    if (status === 'rechazado') return <Badge variant="destructive">Rechazado</Badge>;
    return <Badge variant="secondary">Pendiente</Badge>;
  };

  const isLoading = eventsLoading || expensesLoading;

  return (
    <AppShell>
      <PageHeader
        title="Rendiciones"
        description="Gestión de rendiciones de gastos por evento"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Rendiciones' },
        ]}
      />

      {isLoading ? (
        <LoadingState text="Cargando rendiciones..." className="py-12" />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin rendiciones"
          description={isSupervisor ? "No tienes eventos asignados con gastos." : "No hay eventos con gastos registrados."}
        />
      ) : (
        <div className="space-y-6">
          {events.map(event => {
            const eventExpenses = expenses?.filter(e => e.event_id === event.id) ?? [];
            if (!isSuperadmin && !isSupervisor && eventExpenses.length === 0) return null;
            const isReimbursementClosed = !!event.reimbursement_closed_at;
            const isEventClosed = !!event.closed_at;
            const approvedTotal = eventExpenses
              .filter(e => e.approval_status === 'aprobado')
              .reduce((sum, e) => sum + e.amount, 0);

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {event.name}
                      {isEventClosed && <Badge variant="outline" className="ml-2"><Lock className="h-3 w-3 mr-1" />Cerrado</Badge>}
                      {isReimbursementClosed && <Badge variant="outline" className="ml-1"><Lock className="h-3 w-3 mr-1" />Rendición cerrada</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        Total aprobado: <span className="font-semibold text-foreground">${approvedTotal.toLocaleString('es-CL')}</span>
                      </span>
                      {isSupervisor && !isReimbursementClosed && eventExpenses.length > 0 && (
                        <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'close_reimbursement', eventId: event.id })}>
                          <Lock className="h-3 w-3 mr-1" />
                          Cerrar rendiciones
                        </Button>
                      )}
                      {isSuperadmin && isEventClosed && (
                        <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'reopen_event', eventId: event.id })}>
                          <Unlock className="h-3 w-3 mr-1" />
                          Rehabilitar evento
                        </Button>
                      )}
                      {isSuperadmin && isReimbursementClosed && (
                        <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'reopen_reimbursement', eventId: event.id })}>
                          <Unlock className="h-3 w-3 mr-1" />
                          Reabrir rendiciones
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {eventExpenses.length === 0 && !isSupervisor ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Sin gastos registrados</p>
                  ) : (
                    <>
                      {eventExpenses.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Acreditador</TableHead>
                              <TableHead>Adicional</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                              <TableHead>Comprobante</TableHead>
                              <TableHead>Estado</TableHead>
                              {(isSuperadmin || (isSupervisor && !isReimbursementClosed)) && <TableHead className="w-[120px]">Acciones</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventExpenses.map(exp => (
                              <TableRow key={exp.id}>
                                <TableCell>{getProfileName(exp.user_id)}</TableCell>
                                <TableCell>{exp.name}</TableCell>
                                <TableCell className="text-right font-medium">${exp.amount.toLocaleString('es-CL')}</TableCell>
                                <TableCell>
                                  {exp.receipt_url ? (
                                    <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Ver</a>
                                  ) : '—'}
                                </TableCell>
                                <TableCell>{getStatusBadge(exp.approval_status)}</TableCell>
                                {isSuperadmin && (
                                  <TableCell className="flex gap-1">
                                    {exp.approval_status === 'pendiente' && (
                                      <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => approveExpense(exp.id)} title="Aprobar">
                                          <CheckCircle className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rejectExpense(exp.id)} title="Rechazar">
                                          <XCircle className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </>
                                    )}
                                  </TableCell>
                                )}
                                {isSupervisor && !isReimbursementClosed && (
                                  <TableCell>
                                    {exp.created_by === user!.id && !exp.user_id && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteExpense(exp.id)} title="Eliminar">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                      {eventExpenses.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Sin gastos registrados</p>
                      )}
                    </>
                  )}
                  {isSupervisor && !isReimbursementClosed && (
                    <div className="p-4 border-t">
                      {showAddForm === event.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input placeholder="Nombre del adicional" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} />
                            <Input type="number" placeholder="Monto (CLP)" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} />
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer border rounded-md px-3 py-2 hover:bg-accent">
                                <Upload className="h-4 w-4" />
                                {newExpenseFile ? newExpenseFile.name.substring(0, 15) : 'Comprobante'}
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setNewExpenseFile(e.target.files?.[0] ?? null)} />
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => createEventExpense(event.id)} disabled={submitting || !newExpenseName.trim() || !newExpenseAmount}>
                              {submitting ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(null); setNewExpenseName(''); setNewExpenseAmount(''); setNewExpenseFile(null); }}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setShowAddForm(event.id)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar adicional
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'close_reimbursement' ? 'Cerrar rendiciones' :
          confirmAction?.type === 'reopen_event' ? 'Rehabilitar evento' :
          'Reabrir rendiciones'
        }
        description={
          confirmAction?.type === 'close_reimbursement' ? 'Al cerrar las rendiciones, no se podrán ingresar, editar ni eliminar gastos. Solo un Superadmin podrá reabrir.' :
          confirmAction?.type === 'reopen_event' ? 'Se rehabilitará el evento permitiendo editar asistencia y adicionales nuevamente.' :
          'Se reabrirán las rendiciones permitiendo gestionar gastos nuevamente.'
        }
        confirmLabel="Confirmar"
        variant={confirmAction?.type === 'close_reimbursement' ? 'destructive' : 'default'}
        icon={confirmAction?.type === 'close_reimbursement' ? Lock : Unlock}
        onConfirm={handleConfirm}
        isLoading={processing}
      />
    </AppShell>
  );
}
