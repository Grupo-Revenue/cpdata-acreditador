import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

interface UserWithProfile {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  email: string;
  telefono: string | null;
  idioma: string | null;
  altura: string | null;
  ranking: number | null;
}

interface EventTeamDialogProps {
  dealId: string | null;
  dealName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Siguiente <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function ShiftSelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <Select value={value ?? 'full'} onValueChange={v => onChange(v === 'full' ? null : v)}>
      <SelectTrigger className="w-[130px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="full">Día Completo</SelectItem>
        <SelectItem value="AM">AM</SelectItem>
        <SelectItem value="PM">PM</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function EventTeamDialog({ dealId, dealName, open, onOpenChange }: EventTeamDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Map<user_id, shift> where shift is null (full day), 'AM', or 'PM'
  const [selectedSupervisors, setSelectedSupervisors] = useState<Map<string, string | null>>(new Map());
  const [selectedAccreditors, setSelectedAccreditors] = useState<Map<string, string | null>>(new Map());
  const [saving, setSaving] = useState(false);

  // Supervisor filters
  const [supFilterNombre, setSupFilterNombre] = useState('');
  const [supFilterRut, setSupFilterRut] = useState('');
  const [supFilterEmail, setSupFilterEmail] = useState('');
  const [supFilterTelefono, setSupFilterTelefono] = useState('');
  const [supFilterRanking, setSupFilterRanking] = useState('');
  const [supPage, setSupPage] = useState(1);

  // Accreditor filters
  const [filterNombre, setFilterNombre] = useState('');
  const [filterRut, setFilterRut] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterIdioma, setFilterIdioma] = useState('');
  const [filterRanking, setFilterRanking] = useState('');
  const [filterTelefono, setFilterTelefono] = useState('');
  const [accPage, setAccPage] = useState(1);

  // Fetch supervisors
  const { data: supervisors = [], isLoading: loadingSupervisors } = useQuery({
    queryKey: ['team-supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'supervisor');
      if (error) throw error;
      const userIds = data.map(r => r.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, rut, email, telefono, ranking')
        .in('id', userIds)
        .eq('approval_status', 'approved')
        .eq('is_active', true);
      if (pErr) throw pErr;
      return (profiles || []) as UserWithProfile[];
    },
    enabled: open,
  });

  // Fetch accreditors
  const { data: accreditors = [], isLoading: loadingAccreditors } = useQuery({
    queryKey: ['team-accreditors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'acreditador');
      if (error) throw error;
      const userIds = data.map(r => r.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles, error: pErr } = await (supabase
        .from('profiles')
        .select('id, nombre, apellido, rut, email, telefono, idioma, altura, ranking') as any)
        .in('id', userIds)
        .eq('approval_status', 'approved')
        .eq('is_active', true);
      if (pErr) throw pErr;
      return (profiles || []) as UserWithProfile[];
    },
    enabled: open,
  });

  // Fetch existing assignments with shift
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ['event-assignments', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data: evt } = await (supabase
        .from('events')
        .select('id') as any)
        .eq('hubspot_deal_id', dealId)
        .maybeSingle();
      if (!evt) return [];
      const { data, error } = await (supabase
        .from('event_accreditors')
        .select('user_id, shift') as any)
        .eq('event_id', evt.id);
      if (error) throw error;
      return (data || []) as { user_id: string; shift: string | null }[];
    },
    enabled: open && !!dealId,
    refetchOnMount: 'always',
  });

  // Pre-select existing assignments with their shifts
  useEffect(() => {
    if (!open) return;
    const supIds = new Set(supervisors.map(s => s.id));
    const accIds = new Set(accreditors.map(a => a.id));
    const supMap = new Map<string, string | null>();
    const accMap = new Map<string, string | null>();
    for (const a of existingAssignments) {
      if (supIds.has(a.user_id)) supMap.set(a.user_id, a.shift ?? null);
      if (accIds.has(a.user_id)) accMap.set(a.user_id, a.shift ?? null);
    }
    setSelectedSupervisors(supMap);
    setSelectedAccreditors(accMap);
  }, [open, existingAssignments, supervisors, accreditors]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedSupervisors(new Map());
      setSelectedAccreditors(new Map());
      setSupFilterNombre('');
      setSupFilterRut('');
      setSupFilterEmail('');
      setSupFilterTelefono('');
      setSupFilterRanking('');
      setSupPage(1);
      setFilterNombre('');
      setFilterRut('');
      setFilterEmail('');
      setFilterIdioma('');
      setFilterRanking('');
      setFilterTelefono('');
      setAccPage(1);
    }
  }, [open]);

  // Filtered & paginated supervisors
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter(s => {
      const fullName = `${s.nombre} ${s.apellido}`.toLowerCase();
      if (supFilterNombre && !fullName.includes(supFilterNombre.toLowerCase())) return false;
      if (supFilterRut && !s.rut.toLowerCase().includes(supFilterRut.toLowerCase())) return false;
      if (supFilterEmail && !s.email.toLowerCase().includes(supFilterEmail.toLowerCase())) return false;
      if (supFilterTelefono && !(s.telefono || '').includes(supFilterTelefono)) return false;
      if (supFilterRanking && s.ranking?.toString() !== supFilterRanking) return false;
      return true;
    });
  }, [supervisors, supFilterNombre, supFilterRut, supFilterEmail, supFilterTelefono, supFilterRanking]);

  const supTotalPages = Math.ceil(filteredSupervisors.length / PAGE_SIZE);
  const paginatedSupervisors = filteredSupervisors.slice((supPage - 1) * PAGE_SIZE, supPage * PAGE_SIZE);

  useEffect(() => { setSupPage(1); }, [supFilterNombre, supFilterRut, supFilterEmail, supFilterTelefono, supFilterRanking]);

  // Filtered & paginated accreditors
  const filteredAccreditors = useMemo(() => {
    return accreditors.filter(a => {
      const fullName = `${a.nombre} ${a.apellido}`.toLowerCase();
      if (filterNombre && !fullName.includes(filterNombre.toLowerCase())) return false;
      if (filterRut && !a.rut.toLowerCase().includes(filterRut.toLowerCase())) return false;
      if (filterEmail && !a.email.toLowerCase().includes(filterEmail.toLowerCase())) return false;
      if (filterIdioma && !(a.idioma || '').toLowerCase().includes(filterIdioma.toLowerCase())) return false;
      if (filterRanking && a.ranking?.toString() !== filterRanking) return false;
      if (filterTelefono && !(a.telefono || '').includes(filterTelefono)) return false;
      return true;
    });
  }, [accreditors, filterNombre, filterRut, filterEmail, filterIdioma, filterRanking, filterTelefono]);

  const accTotalPages = Math.ceil(filteredAccreditors.length / PAGE_SIZE);
  const paginatedAccreditors = filteredAccreditors.slice((accPage - 1) * PAGE_SIZE, accPage * PAGE_SIZE);

  useEffect(() => { setAccPage(1); }, [filterNombre, filterRut, filterEmail, filterIdioma, filterRanking, filterTelefono]);

  const toggleSupervisor = (id: string) => {
    setSelectedSupervisors(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, null);
      }
      return next;
    });
  };

  const setSupervisorShift = (id: string, shift: string | null) => {
    setSelectedSupervisors(prev => {
      const next = new Map(prev);
      next.set(id, shift);
      return next;
    });
  };

  const toggleAccreditor = (id: string) => {
    setSelectedAccreditors(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, null);
      }
      return next;
    });
  };

  const setAccreditorShift = (id: string, shift: string | null) => {
    setSelectedAccreditors(prev => {
      const next = new Map(prev);
      next.set(id, shift);
      return next;
    });
  };

  const handleSave = async () => {
    if (!dealId) return;
    setSaving(true);
    try {
      let { data: evt } = await (supabase
        .from('events')
        .select('id') as any)
        .eq('hubspot_deal_id', dealId)
        .maybeSingle();

      if (evt && dealName) {
        await supabase.from('events').update({ name: dealName } as any).eq('id', evt.id);
      }

      if (!evt) {
        const { data: newEvt, error: createErr } = await supabase
          .from('events')
          .insert({
            name: dealName || `Evento HubSpot ${dealId}`,
            event_date: new Date().toISOString().split('T')[0],
            hubspot_deal_id: dealId,
          } as any)
          .select('id')
          .single();
        if (createErr) throw createErr;
        evt = newEvt;
      }

      const eventId = evt!.id;
      const previousAssignmentIds = existingAssignments.map(a => a.user_id);

      await supabase.from('event_accreditors').delete().eq('event_id', eventId);

      const allSelected = [...selectedSupervisors.entries(), ...selectedAccreditors.entries()];
      if (allSelected.length > 0) {
        const rows = allSelected.map(([userId, shift]) => ({
          event_id: eventId,
          user_id: userId,
          shift: shift,
        }));
        const { error: insertErr } = await supabase.from('event_accreditors').insert(rows as any);
        if (insertErr) throw insertErr;
      }

      const allSelectedIds = allSelected.map(([id]) => id);

      // Delete invoices for removed users
      const removedUserIds = previousAssignmentIds.filter(id => !allSelectedIds.includes(id));
      if (removedUserIds.length > 0) {
        const { error: delInvErr } = await supabase
          .from('invoices')
          .delete()
          .eq('event_id', eventId)
          .in('user_id', removedUserIds);
        if (delInvErr) throw delInvErr;
      }

      // Create invoices for newly assigned users
      const newUserIds = allSelectedIds.filter(id => !previousAssignmentIds.includes(id));
      if (newUserIds.length > 0) {
        const { data: existingInvoices } = await supabase
          .from('invoices')
          .select('user_id')
          .eq('event_id', eventId)
          .in('user_id', newUserIds);

        const usersWithInvoice = new Set((existingInvoices || []).map(i => i.user_id));
        const usersNeedingInvoice = newUserIds.filter(id => !usersWithInvoice.has(id));

        if (usersNeedingInvoice.length > 0) {
          // Fetch payment_amount from event_accreditors for each user
          const { data: accreditorData } = await supabase
            .from('event_accreditors')
            .select('user_id, payment_amount')
            .eq('event_id', eventId)
            .in('user_id', usersNeedingInvoice);

          const paymentMap = new Map((accreditorData || []).map((a: any) => [a.user_id, a.payment_amount ?? 0]));

          const invoiceRows = usersNeedingInvoice.map(userId => ({
            user_id: userId,
            event_id: eventId,
            amount: paymentMap.get(userId) ?? 0,
          }));
          const { error: invErr } = await supabase.from('invoices').insert(invoiceRows);
          if (invErr) throw invErr;
        }
      }

      toast({ title: 'Equipo asignado', description: `Se asignaron ${allSelected.length} personas al evento.` });
      queryClient.invalidateQueries({ queryKey: ['event-assignments', dealId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo asignar el equipo.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl h-[85vh] flex flex-col p-0">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Asignar Equipo
            </DialogTitle>
            <DialogDescription>
              {dealName ? `Evento: ${dealName}` : 'Selecciona supervisores y acreditadores para este evento.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6">
          <Tabs defaultValue="supervisores" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="supervisores">Supervisores ({selectedSupervisors.size})</TabsTrigger>
              <TabsTrigger value="acreditadores">Acreditadores ({selectedAccreditors.size})</TabsTrigger>
            </TabsList>

            <TabsContent value="supervisores" className="flex-1 min-h-0 flex flex-col overflow-hidden mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nombre" value={supFilterNombre} onChange={e => setSupFilterNombre(e.target.value)} className="pl-8" />
                </div>
                <Input placeholder="RUT" value={supFilterRut} onChange={e => setSupFilterRut(e.target.value)} />
                <Input placeholder="Email" value={supFilterEmail} onChange={e => setSupFilterEmail(e.target.value)} />
                <Input placeholder="Teléfono" value={supFilterTelefono} onChange={e => setSupFilterTelefono(e.target.value)} />
                <Input placeholder="Ranking (1-7)" value={supFilterRanking} onChange={e => setSupFilterRanking(e.target.value)} />
              </div>

              {loadingSupervisors ? (
                <LoadingState text="Cargando supervisores..." className="py-8" />
              ) : filteredSupervisors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {supervisors.length === 0 ? 'No hay supervisores aprobados.' : 'Sin resultados para los filtros aplicados.'}
                </p>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-auto border rounded-md">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]" />
                          <TableHead>Nombre</TableHead>
                          <TableHead>RUT</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Ranking</TableHead>
                          <TableHead>Turno</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSupervisors.map(s => {
                          const isSelected = selectedSupervisors.has(s.id);
                          return (
                            <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleSupervisor(s.id)}>
                              <TableCell>
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleSupervisor(s.id)} />
                              </TableCell>
                              <TableCell>{s.nombre} {s.apellido}</TableCell>
                              <TableCell>{s.rut}</TableCell>
                              <TableCell>{s.email}</TableCell>
                              <TableCell>{s.telefono ?? '—'}</TableCell>
                              <TableCell>{s.ranking ?? '—'}</TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {isSelected && (
                                  <ShiftSelect
                                    value={selectedSupervisors.get(s.id) ?? null}
                                    onChange={v => setSupervisorShift(s.id, v)}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="shrink-0">
                    <PaginationControls page={supPage} totalPages={supTotalPages} onPageChange={setSupPage} />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="acreditadores" className="flex-1 min-h-0 flex flex-col overflow-hidden mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nombre" value={filterNombre} onChange={e => setFilterNombre(e.target.value)} className="pl-8" />
                </div>
                <Input placeholder="RUT" value={filterRut} onChange={e => setFilterRut(e.target.value)} />
                <Input placeholder="Email" value={filterEmail} onChange={e => setFilterEmail(e.target.value)} />
                <Input placeholder="Idioma" value={filterIdioma} onChange={e => setFilterIdioma(e.target.value)} />
                <Input placeholder="Ranking (1-7)" value={filterRanking} onChange={e => setFilterRanking(e.target.value)} />
                <Input placeholder="Teléfono" value={filterTelefono} onChange={e => setFilterTelefono(e.target.value)} />
              </div>

              {loadingAccreditors ? (
                <LoadingState text="Cargando acreditadores..." className="py-8" />
              ) : filteredAccreditors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {accreditors.length === 0 ? 'No hay acreditadores aprobados.' : 'Sin resultados para los filtros aplicados.'}
                </p>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-auto border rounded-md">
                    <Table className="min-w-[850px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]" />
                          <TableHead>Nombre</TableHead>
                          <TableHead>RUT</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Idioma</TableHead>
                          <TableHead>Estatura</TableHead>
                          <TableHead>Ranking</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Turno</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAccreditors.map(a => {
                          const isSelected = selectedAccreditors.has(a.id);
                          return (
                            <TableRow key={a.id} className="cursor-pointer" onClick={() => toggleAccreditor(a.id)}>
                              <TableCell>
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleAccreditor(a.id)} />
                              </TableCell>
                              <TableCell>{a.nombre} {a.apellido}</TableCell>
                              <TableCell>{a.rut}</TableCell>
                              <TableCell>{a.email}</TableCell>
                              <TableCell>{a.idioma ?? '—'}</TableCell>
                              <TableCell>{a.altura ?? '—'}</TableCell>
                              <TableCell>{a.ranking ?? '—'}</TableCell>
                              <TableCell>{a.telefono ?? '—'}</TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {isSelected && (
                                  <ShiftSelect
                                    value={selectedAccreditors.get(a.id) ?? null}
                                    onChange={v => setAccreditorShift(a.id, v)}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="shrink-0">
                    <PaginationControls page={accPage} totalPages={accTotalPages} onPageChange={setAccPage} />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 pb-6 pt-3 shrink-0 border-t">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Asignación'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
