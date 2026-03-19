import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Search, ChevronLeft, ChevronRight, Sun, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function ShiftToggle({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
          value === null ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange(null)}
        title="Día Completo"
      >
        <Clock className="h-3 w-3" />
        Full
      </button>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
          value === 'AM' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange('AM')}
        title="AM"
      >
        <Sun className="h-3 w-3" />
        AM
      </button>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
          value === 'PM' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange('PM')}
        title="PM"
      >
        <Moon className="h-3 w-3" />
        PM
      </button>
    </div>
  );
}

function RankingBadge({ ranking }: { ranking: number | null }) {
  if (ranking === null || ranking === undefined) return <span className="text-muted-foreground">—</span>;
  const variant = ranking >= 5 ? 'default' : ranking >= 3 ? 'secondary' : 'destructive';
  return <Badge variant={variant} className="text-xs font-mono">{ranking}</Badge>;
}

function matchesSearch(user: UserWithProfile, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
  return (
    fullName.includes(q) ||
    user.rut.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q) ||
    (user.telefono || '').includes(q)
  );
}

export function EventTeamDialog({ dealId, dealName, open, onOpenChange }: EventTeamDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSupervisors, setSelectedSupervisors] = useState<Map<string, string | null>>(new Map());
  const [selectedAccreditors, setSelectedAccreditors] = useState<Map<string, string | null>>(new Map());
  const [saving, setSaving] = useState(false);

  const [supSearch, setSupSearch] = useState('');
  const [supPage, setSupPage] = useState(1);

  const [accSearch, setAccSearch] = useState('');
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

  // Fetch existing assignments
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

  // Pre-select existing assignments
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
      setSupSearch('');
      setSupPage(1);
      setAccSearch('');
      setAccPage(1);
    }
  }, [open]);

  // Filtered & paginated supervisors
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter(s => matchesSearch(s, supSearch));
  }, [supervisors, supSearch]);

  const supTotalPages = Math.ceil(filteredSupervisors.length / PAGE_SIZE);
  const paginatedSupervisors = filteredSupervisors.slice((supPage - 1) * PAGE_SIZE, supPage * PAGE_SIZE);
  useEffect(() => { setSupPage(1); }, [supSearch]);

  // Filtered & paginated accreditors
  const filteredAccreditors = useMemo(() => {
    return accreditors.filter(a => matchesSearch(a, accSearch));
  }, [accreditors, accSearch]);

  const accTotalPages = Math.ceil(filteredAccreditors.length / PAGE_SIZE);
  const paginatedAccreditors = filteredAccreditors.slice((accPage - 1) * PAGE_SIZE, accPage * PAGE_SIZE);
  useEffect(() => { setAccPage(1); }, [accSearch]);

  const toggleSupervisor = (id: string) => {
    setSelectedSupervisors(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  };

  const setSupervisorShift = (id: string, shift: string | null) => {
    setSelectedSupervisors(prev => { const next = new Map(prev); next.set(id, shift); return next; });
  };

  const toggleAccreditor = (id: string) => {
    setSelectedAccreditors(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  };

  const setAccreditorShift = (id: string, shift: string | null) => {
    setSelectedAccreditors(prev => { const next = new Map(prev); next.set(id, shift); return next; });
  };

  const toggleAllSupervisors = () => {
    const allFilteredIds = filteredSupervisors.map(s => s.id);
    const allSelected = allFilteredIds.every(id => selectedSupervisors.has(id));
    setSelectedSupervisors(prev => {
      const next = new Map(prev);
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => { if (!next.has(id)) next.set(id, null); });
      }
      return next;
    });
  };

  const toggleAllAccreditors = () => {
    const allFilteredIds = filteredAccreditors.map(a => a.id);
    const allSelected = allFilteredIds.every(id => selectedAccreditors.has(id));
    setSelectedAccreditors(prev => {
      const next = new Map(prev);
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => { if (!next.has(id)) next.set(id, null); });
      }
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

      const removedUserIds = previousAssignmentIds.filter(id => !allSelectedIds.includes(id));
      if (removedUserIds.length > 0) {
        const { error: delInvErr } = await supabase
          .from('invoices')
          .delete()
          .eq('event_id', eventId)
          .in('user_id', removedUserIds);
        if (delInvErr) throw delInvErr;
      }

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

  const allSupFilteredSelected = filteredSupervisors.length > 0 && filteredSupervisors.every(s => selectedSupervisors.has(s.id));
  const allAccFilteredSelected = filteredAccreditors.length > 0 && filteredAccreditors.every(a => selectedAccreditors.has(a.id));

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

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <Tabs defaultValue="supervisores" className="w-full">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="supervisores" className="flex items-center gap-2">
                Supervisores
                {selectedSupervisors.size > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                    {selectedSupervisors.size}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="acreditadores" className="flex items-center gap-2">
                Acreditadores
                {selectedAccreditors.size > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                    {selectedAccreditors.size}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Supervisors Tab */}
            <TabsContent value="supervisores" className="mt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, RUT, email o teléfono..."
                    value={supSearch}
                    onChange={e => setSupSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedSupervisors.size} de {supervisors.length}
                </span>
              </div>

              {loadingSupervisors ? (
                <LoadingState text="Cargando supervisores..." className="py-8" />
              ) : filteredSupervisors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {supervisors.length === 0 ? 'No hay supervisores aprobados.' : 'Sin resultados para la búsqueda.'}
                </p>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={toggleAllSupervisors}>
                      {allSupFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                  </div>
                  <div className="overflow-auto border rounded-md max-h-[calc(85vh-320px)]">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10" />
                          <TableHead>Nombre</TableHead>
                          <TableHead>RUT</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Ranking</TableHead>
                          <TableHead>Turno</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSupervisors.map(s => {
                          const isSelected = selectedSupervisors.has(s.id);
                          return (
                            <TableRow
                              key={s.id}
                              className={cn("cursor-pointer transition-colors", isSelected && "bg-primary/5")}
                              onClick={() => toggleSupervisor(s.id)}
                            >
                              <TableCell className="w-10">
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleSupervisor(s.id)} />
                              </TableCell>
                              <TableCell className="font-medium">{s.nombre} {s.apellido}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{s.rut}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{s.telefono ?? '—'}</TableCell>
                              <TableCell><RankingBadge ranking={s.ranking} /></TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {isSelected && (
                                  <ShiftToggle
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
                  <div>
                    <PaginationControls page={supPage} totalPages={supTotalPages} onPageChange={setSupPage} />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Accreditors Tab */}
            <TabsContent value="acreditadores" className="mt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, RUT, email o teléfono..."
                    value={accSearch}
                    onChange={e => setAccSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedAccreditors.size} de {accreditors.length}
                </span>
              </div>

              {loadingAccreditors ? (
                <LoadingState text="Cargando acreditadores..." className="py-8" />
              ) : filteredAccreditors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {accreditors.length === 0 ? 'No hay acreditadores aprobados.' : 'Sin resultados para la búsqueda.'}
                </p>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={toggleAllAccreditors}>
                      {allAccFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                  </div>
                  <div className="overflow-auto border rounded-md max-h-[calc(85vh-320px)]">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10" />
                          <TableHead>Nombre</TableHead>
                          <TableHead>RUT</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Idioma</TableHead>
                          <TableHead>Ranking</TableHead>
                          <TableHead>Turno</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAccreditors.map(a => {
                          const isSelected = selectedAccreditors.has(a.id);
                          return (
                            <TableRow
                              key={a.id}
                              className={cn("cursor-pointer transition-colors", isSelected && "bg-primary/5")}
                              onClick={() => toggleAccreditor(a.id)}
                            >
                              <TableCell className="w-10">
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleAccreditor(a.id)} />
                              </TableCell>
                              <TableCell className="font-medium">{a.nombre} {a.apellido}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{a.rut}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{a.telefono ?? '—'}</TableCell>
                              <TableCell>{a.idioma ?? '—'}</TableCell>
                              <TableCell><RankingBadge ranking={a.ranking} /></TableCell>
                              <TableCell onClick={e => e.stopPropagation()}>
                                {isSelected && (
                                  <ShiftToggle
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
                  <div>
                    <PaginationControls page={accPage} totalPages={accTotalPages} onPageChange={setAccPage} />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 pb-6 pt-3 shrink-0 border-t">
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {selectedSupervisors.size} supervisores, {selectedAccreditors.size} acreditadores
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Asignación'}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
