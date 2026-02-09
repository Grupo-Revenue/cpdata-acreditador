import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';

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

export function EventTeamDialog({ dealId, dealName, open, onOpenChange }: EventTeamDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSupervisors, setSelectedSupervisors] = useState<Set<string>>(new Set());
  const [selectedAccreditors, setSelectedAccreditors] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Filters for accreditors
  const [filterNombre, setFilterNombre] = useState('');
  const [filterRut, setFilterRut] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterIdioma, setFilterIdioma] = useState('');
  const [filterRanking, setFilterRanking] = useState('');
  const [filterTelefono, setFilterTelefono] = useState('');

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
        .select('id, nombre, apellido, rut, email, telefono')
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
      // Find local event by hubspot_deal_id
      const { data: evt } = await (supabase
        .from('events')
        .select('id') as any)
        .eq('hubspot_deal_id', dealId)
        .maybeSingle();
      if (!evt) return [];
      const { data, error } = await supabase
        .from('event_accreditors')
        .select('user_id')
        .eq('event_id', evt.id);
      if (error) throw error;
      return data.map(a => a.user_id);
    },
    enabled: open && !!dealId,
  });

  // Pre-select existing assignments
  useEffect(() => {
    if (existingAssignments.length > 0) {
      const supIds = new Set(supervisors.map(s => s.id));
      const accIds = new Set(accreditors.map(a => a.id));
      setSelectedSupervisors(new Set(existingAssignments.filter(id => supIds.has(id))));
      setSelectedAccreditors(new Set(existingAssignments.filter(id => accIds.has(id))));
    }
  }, [existingAssignments, supervisors, accreditors]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedSupervisors(new Set());
      setSelectedAccreditors(new Set());
      setFilterNombre('');
      setFilterRut('');
      setFilterEmail('');
      setFilterIdioma('');
      setFilterRanking('');
      setFilterTelefono('');
    }
  }, [open]);

  // Filtered accreditors
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

  const toggleSupervisor = (id: string) => {
    setSelectedSupervisors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAccreditor = (id: string) => {
    setSelectedAccreditors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!dealId) return;
    setSaving(true);
    try {
      // Find or create local event
      let { data: evt } = await (supabase
        .from('events')
        .select('id') as any)
        .eq('hubspot_deal_id', dealId)
        .maybeSingle();

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

      // Delete existing assignments
      await supabase.from('event_accreditors').delete().eq('event_id', eventId);

      // Insert new assignments
      const allSelected = [...selectedSupervisors, ...selectedAccreditors];
      if (allSelected.length > 0) {
        const rows = allSelected.map(userId => ({
          event_id: eventId,
          user_id: userId,
        }));
        const { error: insertErr } = await supabase.from('event_accreditors').insert(rows);
        if (insertErr) throw insertErr;
      }

      toast({ title: 'Equipo asignado', description: `Se asignaron ${allSelected.length} personas al evento.` });
      queryClient.invalidateQueries({ queryKey: ['event-assignments', dealId] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo asignar el equipo.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Equipo
          </DialogTitle>
          <DialogDescription>
            {dealName ? `Evento: ${dealName}` : 'Selecciona supervisores y acreditadores para este evento.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="supervisores" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supervisores">
              Supervisores ({selectedSupervisors.size})
            </TabsTrigger>
            <TabsTrigger value="acreditadores">
              Acreditadores ({selectedAccreditors.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supervisores">
            {loadingSupervisors ? (
              <LoadingState text="Cargando supervisores..." className="py-8" />
            ) : supervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay supervisores aprobados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]" />
                    <TableHead>Nombre</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supervisors.map(s => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleSupervisor(s.id)}>
                      <TableCell>
                        <Checkbox checked={selectedSupervisors.has(s.id)} onCheckedChange={() => toggleSupervisor(s.id)} />
                      </TableCell>
                      <TableCell>{s.nombre} {s.apellido}</TableCell>
                      <TableCell>{s.rut}</TableCell>
                      <TableCell>{s.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="acreditadores">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
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
              <Table>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccreditors.map(a => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => toggleAccreditor(a.id)}>
                      <TableCell>
                        <Checkbox checked={selectedAccreditors.has(a.id)} onCheckedChange={() => toggleAccreditor(a.id)} />
                      </TableCell>
                      <TableCell>{a.nombre} {a.apellido}</TableCell>
                      <TableCell>{a.rut}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.idioma ?? '—'}</TableCell>
                      <TableCell>{a.altura ?? '—'}</TableCell>
                      <TableCell>{a.ranking ?? '—'}</TableCell>
                      <TableCell>{a.telefono ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || (selectedSupervisors.size === 0 && selectedAccreditors.size === 0)}>
            {saving ? 'Guardando...' : 'Guardar Asignación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
