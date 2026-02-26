import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2, Lock, Upload, DollarSign, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EventManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hubspotDealId: string;
  dealName: string | null;
}

type AttendanceStatus = 'presente' | 'atrasado' | 'ausente';

const POINTS_MAP: Record<AttendanceStatus, number> = {
  presente: 7,
  atrasado: 5,
  ausente: 0,
};

interface AttendanceRow {
  userId: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  applicationStatus: string;
  contractStatus: string;
  status: AttendanceStatus;
  attendanceDate: string;
  checkInTime: string;
  comment: string;
  saved: boolean;
}

interface ExpenseRow {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  receiptUrl: string | null;
  approvalStatus: string;
}

export function EventManagementDialog({ open, onOpenChange, hubspotDealId, dealName }: EventManagementDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmClose, setConfirmClose] = useState(false);
  const [closingEvent, setClosingEvent] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [newExpenses, setNewExpenses] = useState<Record<string, { name: string; amount: string; file: File | null }>>({});

  // Resolve local event from hubspot_deal_id
  const { data: event } = useQuery({
    queryKey: ['event-by-deal', hubspotDealId],
    enabled: open && !!hubspotDealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('hubspot_deal_id', hubspotDealId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const eventId = event?.id;
  const isClosed = !!event?.closed_at;

  // Fetch assigned accreditors
  const { data: accreditors } = useQuery({
    queryKey: ['event-accreditors-mgmt', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from('event_accreditors')
        .select('user_id, application_status, contract_status')
        .eq('event_id', eventId!);
      if (error) throw error;

      // Filter: only accepted or contract signed
      const filtered = (assignments ?? []).filter(
        a => a.application_status === 'aceptado' || a.contract_status === 'firmado'
      );

      const userIds = filtered.map(a => a.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, rut, telefono')
        .in('id', userIds);
      if (pErr) throw pErr;

      return (profiles ?? []).map(p => {
        const assignment = filtered.find(a => a.user_id === p.id);
        return {
          ...p,
          applicationStatus: assignment?.application_status ?? 'pendiente',
          contractStatus: assignment?.contract_status ?? 'pendiente',
        };
      });
    },
  });

  // Fetch existing attendance records
  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance-records', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', eventId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch existing comments for this event
  const { data: existingComments } = useQuery({
    queryKey: ['attendance-comments-event', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      // Get attendance record ids for this event first
      const { data: records } = await supabase
        .from('attendance_records')
        .select('id, user_id')
        .eq('event_id', eventId!);
      if (!records || records.length === 0) return [];

      const recordIds = records.map(r => r.id);
      const { data: comments, error } = await supabase
        .from('attendance_comments')
        .select('*')
        .in('attendance_record_id', recordIds);
      if (error) throw error;
      return (comments ?? []).map(c => ({
        ...c,
        user_id_from_record: records.find(r => r.id === c.attendance_record_id)?.user_id,
      }));
    },
  });

  // Fetch existing expenses
  const { data: expenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['event-expenses', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_expenses')
        .select('*')
        .eq('event_id', eventId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Initialize attendance rows from accreditors + existing records
  useEffect(() => {
    if (!accreditors) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const rows: AttendanceRow[] = accreditors.map(acc => {
      const existing = existingAttendance?.find(a => a.user_id === acc.id);
      const existingComment = existingComments?.find(c => c.user_id_from_record === acc.id);
      return {
        userId: acc.id,
        nombre: acc.nombre,
        apellido: acc.apellido,
        rut: acc.rut ?? '',
        telefono: acc.telefono ?? '',
        applicationStatus: acc.applicationStatus,
        contractStatus: acc.contractStatus,
        status: (existing?.status as AttendanceStatus) ?? 'presente',
        attendanceDate: existing?.attendance_date ?? today,
        checkInTime: existing?.check_in_time?.substring(0, 5) ?? '',
        comment: existingComment?.comment ?? '',
        saved: !!existing,
      };
    });
    setAttendanceRows(rows);
  }, [accreditors, existingAttendance, existingComments]);

  // Save attendance
  const saveAttendance = useMutation({
    mutationFn: async (row: AttendanceRow) => {
      const record = {
        event_id: eventId!,
        user_id: row.userId,
        status: row.status as any,
        ranking_points: POINTS_MAP[row.status],
        attendance_date: row.attendanceDate,
        check_in_time: row.checkInTime || null,
        recorded_by: user!.id,
      };

      const { data: upserted, error } = await supabase
        .from('attendance_records')
        .upsert(record, { onConflict: 'event_id,user_id' })
        .select('id')
        .single();
      if (error) throw error;

      // Save comment if non-empty
      if (row.comment.trim()) {
        // Delete existing comment for this record, then insert new one
        await supabase
          .from('attendance_comments')
          .delete()
          .eq('attendance_record_id', upserted.id)
          .eq('user_id', row.userId);

        const { error: commentError } = await supabase
          .from('attendance_comments')
          .insert({
            attendance_record_id: upserted.id,
            user_id: row.userId,
            comment: row.comment.trim(),
            created_by: user!.id,
          });
        if (commentError) console.error('Error saving comment:', commentError);
      }
    },
    onSuccess: () => {
      toast({ title: 'Asistencia guardada' });
      queryClient.invalidateQueries({ queryKey: ['attendance-records', eventId] });
      queryClient.invalidateQueries({ queryKey: ['attendance-comments-event', eventId] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar la asistencia.', variant: 'destructive' });
    },
  });

  // Save all attendance
  const saveAllAttendance = async () => {
    for (const row of attendanceRows) {
      await saveAttendance.mutateAsync(row);
    }
  };

  // Add expense
  const addExpense = async (userId: string) => {
    const exp = newExpenses[userId];
    if (!exp || !exp.name || !exp.amount) {
      toast({ title: 'Error', description: 'Nombre y valor son obligatorios.', variant: 'destructive' });
      return;
    }

    let receiptUrl: string | null = null;
    if (exp.file) {
      const filePath = `${user!.id}/${Date.now()}_${exp.file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('expense-receipts')
        .upload(filePath, exp.file);
      if (uploadErr) {
        toast({ title: 'Error', description: 'No se pudo subir el comprobante.', variant: 'destructive' });
        return;
      }
      const { data: urlData } = supabase.storage.from('expense-receipts').getPublicUrl(filePath);
      receiptUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('event_expenses').insert({
      event_id: eventId!,
      user_id: userId,
      name: exp.name,
      amount: parseInt(exp.amount),
      receipt_url: receiptUrl,
      created_by: user!.id,
    });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo agregar el adicional.', variant: 'destructive' });
      return;
    }

    setNewExpenses(prev => ({ ...prev, [userId]: { name: '', amount: '', file: null } }));
    refetchExpenses();
    toast({ title: 'Adicional agregado' });
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    const { error } = await supabase.from('event_expenses').delete().eq('id', expenseId);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el adicional.', variant: 'destructive' });
      return;
    }
    refetchExpenses();
    toast({ title: 'Adicional eliminado' });
  };

  // Close event
  const closeEvent = async () => {
    setClosingEvent(true);
    try {
      // Save all attendance first
      await saveAllAttendance();

      const { error } = await supabase
        .from('events')
        .update({
          closed_at: new Date().toISOString(),
          closed_by: user!.id,
          status: 'completed' as any,
        })
        .eq('id', eventId!);

      if (error) throw error;

      toast({ title: 'Proyecto cerrado', description: 'El evento ha sido cerrado exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['event-by-deal', hubspotDealId] });
      setConfirmClose(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cerrar el proyecto.', variant: 'destructive' });
    } finally {
      setClosingEvent(false);
    }
  };

  const updateAttendanceRow = (userId: string, field: keyof AttendanceRow, value: any) => {
    setAttendanceRows(prev => {
      return prev.map(row => row.userId === userId ? { ...row, [field]: value } : row);
    });
  };

  const getExpenseInput = (userId: string) => newExpenses[userId] ?? { name: '', amount: '', file: null };

  const searchLower = searchFilter.toLowerCase();
  const filteredRows = attendanceRows.filter(row => {
    if (!searchFilter) return true;
    return (
      row.nombre.toLowerCase().includes(searchLower) ||
      row.apellido.toLowerCase().includes(searchLower) ||
      row.rut.toLowerCase().includes(searchLower) ||
      (row.telefono ?? '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isClosed && <Lock className="h-4 w-4 text-muted-foreground" />}
              Gestión de Evento: {dealName ?? hubspotDealId}
            </DialogTitle>
          </DialogHeader>

          {!eventId ? (
            <p className="text-muted-foreground text-center py-8">
              No se encontró el evento local asociado a este deal de HubSpot.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Attendance Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registro de Asistencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attendanceRows.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, RUT o teléfono..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  )}
                  {attendanceRows.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      No hay acreditadores aceptados o con contrato firmado.
                    </p>
                  ) : filteredRows.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      No se encontraron resultados para "{searchFilter}".
                    </p>
                  ) : (
                    filteredRows.map((row, i) => (
                      <div key={row.userId} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{row.nombre} {row.apellido}</p>
                            {row.contractStatus === 'firmado' && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">Contrato Firmado</Badge>
                            )}
                            {row.applicationStatus === 'aceptado' && row.contractStatus !== 'firmado' && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Aceptado</Badge>
                            )}
                          </div>
                          {!isClosed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => saveAttendance.mutate(row)}
                              title="Guardar asistencia"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Asistencia</label>
                            <Select
                              value={row.status}
                              disabled={isClosed}
                              onValueChange={(v) => updateAttendanceRow(row.userId, 'status', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="presente">Presente</SelectItem>
                                <SelectItem value="atrasado">Atrasado</SelectItem>
                                <SelectItem value="ausente">Ausente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Puntos</label>
                            <div className="h-8 flex items-center text-sm font-semibold px-2 border rounded-md bg-muted/50">
                              {POINTS_MAP[row.status]}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Fecha</label>
                            <Input
                              type="date"
                              value={row.attendanceDate}
                              disabled={isClosed}
                              onChange={(e) => updateAttendanceRow(row.userId, 'attendanceDate', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Hora Ingreso</label>
                            <Input
                              type="time"
                              value={row.checkInTime}
                              disabled={isClosed}
                              onChange={(e) => updateAttendanceRow(row.userId, 'checkInTime', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <Textarea
                          placeholder="Comentario..."
                          value={row.comment}
                          disabled={isClosed}
                          onChange={(e) => updateAttendanceRow(row.userId, 'comment', e.target.value)}
                          className="min-h-[40px] h-10 text-xs resize-none"
                        />
                      </div>
                    ))
                  )}
                  {!isClosed && attendanceRows.length > 0 && (
                    <div className="flex justify-end pt-2">
                      <Button size="sm" className="w-full sm:w-auto" onClick={saveAllAttendance}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar toda la asistencia
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expenses Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Adicionales (Gastos)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {attendanceRows.map((row) => {
                    const userExpenses = expenses?.filter(e => e.user_id === row.userId) ?? [];
                    const input = getExpenseInput(row.userId);

                    return (
                      <div key={row.userId} className="border rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium">{row.nombre} {row.apellido}</p>

                        {userExpenses.length > 0 && (
                          <div className="space-y-1">
                            {userExpenses.map(exp => (
                              <div key={exp.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                                <span>{exp.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">${exp.amount.toLocaleString('es-CL')}</span>
                                  {exp.receipt_url && (
                                    <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                                      Ver
                                    </a>
                                  )}
                                  {!isClosed && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteExpense(exp.id)}>
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isClosed && (
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                            <Input
                              placeholder="Nombre adicional"
                              value={input.name}
                              onChange={(e) => setNewExpenses(prev => ({ ...prev, [row.userId]: { ...getExpenseInput(row.userId), name: e.target.value } }))}
                              className="h-8 text-xs"
                            />
                            <Input
                              type="number"
                              placeholder="Valor CLP"
                              value={input.amount}
                              onChange={(e) => setNewExpenses(prev => ({ ...prev, [row.userId]: { ...getExpenseInput(row.userId), amount: e.target.value } }))}
                              className="h-8 text-xs w-full sm:w-[100px]"
                            />
                            <label className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground border rounded px-2 py-1 h-8 hover:bg-muted">
                              <Upload className="h-3 w-3" />
                              {input.file ? input.file.name.substring(0, 10) + '...' : 'Comprobante'}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  setNewExpenses(prev => ({ ...prev, [row.userId]: { ...getExpenseInput(row.userId), file } }));
                                }}
                              />
                            </label>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => addExpense(row.userId)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Close Project Button */}
              {!isClosed && (
                <>
                  <Separator />
                  <div className="flex justify-end">
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setConfirmClose(true)}>
                      <Lock className="h-4 w-4 mr-2" />
                      Cerrar proyecto
                    </Button>
                  </div>
                </>
              )}

              {isClosed && (
                <div className="bg-muted/50 border rounded-lg p-4 text-center text-sm text-muted-foreground">
                  <Lock className="h-5 w-5 mx-auto mb-2" />
                  Este evento fue cerrado el {event?.closed_at ? format(new Date(event.closed_at), 'dd/MM/yyyy HH:mm') : ''}. Solo lectura.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Cerrar proyecto"
        description="Al cerrar el proyecto, se guardará toda la asistencia y el evento quedará bloqueado para edición. Esta acción solo puede ser revertida por un Superadmin."
        confirmLabel="Cerrar proyecto"
        variant="destructive"
        icon={Lock}
        onConfirm={closeEvent}
        isLoading={closingEvent}
      />
    </>
  );
}
