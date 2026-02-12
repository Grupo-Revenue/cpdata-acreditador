import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface EventApplicantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Applicant {
  id: string;
  user_id: string;
  event_id: string;
  application_status: string;
  contract_status: string;
  nombre: string;
  apellido: string;
  ranking: number | null;
  event_name: string;
  event_date: string;
  role: string;
}

const PAGE_SIZE = 10;

const statusStyles: Record<string, string> = {
  pendiente: 'bg-warning/10 text-warning border-warning/20',
  aceptado: 'bg-success/10 text-success border-success/20',
  rechazado: 'bg-destructive/10 text-destructive border-destructive/20',
  firmado: 'bg-success/10 text-success border-success/20',
};

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  firmado: 'Firmado',
};

export function EventApplicantsDialog({ open, onOpenChange }: EventApplicantsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    nombre: '',
    evento: '__all__',
    rol: '__all__',
    applicationStatus: '__all__',
    contractStatus: '__all__',
    ranking: '',
  });

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['event-applicants'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_accreditors')
        .select('id, user_id, event_id, application_status, contract_status, events(name, event_date)');
      if (error) throw error;
      return data as any[];
    },
  });

  const userIds = useMemo(() => [...new Set((rawData ?? []).map((r: any) => r.user_id))], [rawData]);

  const { data: profiles } = useQuery({
    queryKey: ['applicant-profiles', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, ranking')
        .in('id', userIds);
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ['applicant-roles', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      if (error) throw error;
      return data;
    },
  });

  const applicants: Applicant[] = useMemo(() => {
    if (!rawData || !profiles || !userRoles) return [];
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const roleMap = new Map<string, string>();
    for (const ur of userRoles) {
      if (ur.role === 'supervisor') roleMap.set(ur.user_id, 'Supervisor');
      else if (ur.role === 'acreditador' && !roleMap.has(ur.user_id)) roleMap.set(ur.user_id, 'Acreditador');
    }
    return rawData.map((r: any) => {
      const profile = profileMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        event_id: r.event_id,
        application_status: r.application_status,
        contract_status: r.contract_status,
        nombre: profile?.nombre ?? '',
        apellido: profile?.apellido ?? '',
        ranking: profile?.ranking ?? null,
        event_name: r.events?.name ?? 'Sin nombre',
        event_date: r.events?.event_date ?? '',
        role: roleMap.get(r.user_id) ?? 'Acreditador',
      };
    });
  }, [rawData, profiles, userRoles]);

  const eventNames = useMemo(() => [...new Set(applicants.map((a) => a.event_name))].sort(), [applicants]);

  const filtered = useMemo(() => {
    let result = applicants;
    if (filters.nombre) {
      const q = filters.nombre.toLowerCase();
      result = result.filter((a) => `${a.nombre} ${a.apellido}`.toLowerCase().includes(q));
    }
    if (filters.evento !== '__all__') result = result.filter((a) => a.event_name === filters.evento);
    if (filters.rol !== '__all__') result = result.filter((a) => a.role === filters.rol);
    if (filters.applicationStatus !== '__all__') result = result.filter((a) => a.application_status === filters.applicationStatus);
    if (filters.contractStatus !== '__all__') result = result.filter((a) => a.contract_status === filters.contractStatus);
    if (filters.ranking) {
      const val = Number(filters.ranking);
      if (!isNaN(val)) result = result.filter((a) => a.ranking !== null && a.ranking >= val);
    }
    return result;
  }, [applicants, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleAccept = async (applicant: Applicant) => {
    const { data: conflicts, error: conflictError } = await supabase
      .from('event_accreditors')
      .select('id, events(event_date)')
      .eq('user_id', applicant.user_id)
      .eq('application_status', 'aceptado')
      .neq('id', applicant.id);

    if (conflictError) {
      toast({ title: 'Error', description: 'No se pudo verificar conflictos.', variant: 'destructive' });
      return;
    }

    const hasConflict = (conflicts ?? []).some((c: any) => c.events?.event_date === applicant.event_date);
    if (hasConflict) {
      toast({
        title: 'Conflicto de fecha',
        description: 'Este postulante ya está asignado a otro evento en la misma fecha.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('event_accreditors')
      .update({ application_status: 'aceptado' } as any)
      .eq('id', applicant.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo aceptar al postulante.', variant: 'destructive' });
    } else {
      toast({ title: 'Aceptado', description: `${applicant.nombre} ${applicant.apellido} fue aceptado.` });
      queryClient.invalidateQueries({ queryKey: ['event-applicants'] });
    }
  };

  const handleReject = async (applicant: Applicant) => {
    const { error } = await supabase
      .from('event_accreditors')
      .update({ application_status: 'rechazado' } as any)
      .eq('id', applicant.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo rechazar al postulante.', variant: 'destructive' });
    } else {
      toast({ title: 'Rechazado', description: `${applicant.nombre} ${applicant.apellido} fue rechazado.` });
      queryClient.invalidateQueries({ queryKey: ['event-applicants'] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Postulantes</DialogTitle>
          <DialogDescription>Gestión de postulantes asignados a eventos</DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <Input
            placeholder="Nombre..."
            value={filters.nombre}
            onChange={(e) => setFilter('nombre', e.target.value)}
            className="h-8 text-xs"
          />
          <Select value={filters.evento} onValueChange={(v) => setFilter('evento', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los eventos</SelectItem>
              {eventNames.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.rol} onValueChange={(v) => setFilter('rol', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los roles</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Acreditador">Acreditador</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.applicationStatus} onValueChange={(v) => setFilter('applicationStatus', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Postulación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aceptado">Aceptado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.contractStatus} onValueChange={(v) => setFilter('contractStatus', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="firmado">Firmado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Ranking mín..."
            value={filters.ranking}
            onChange={(e) => setFilter('ranking', e.target.value)}
            className="h-8 text-xs"
            type="number"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No se encontraron postulantes.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Postulación</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Ranking</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nombre} {a.apellido}</TableCell>
                    <TableCell>{a.event_name}</TableCell>
                    <TableCell>{a.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusStyles[a.application_status])}>
                        {statusLabels[a.application_status] ?? a.application_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusStyles[a.contract_status])}>
                        {statusLabels[a.contract_status] ?? a.contract_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.ranking ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-success hover:text-success/80"
                          onClick={() => handleAccept(a)}
                          disabled={a.application_status === 'aceptado'}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive/80"
                          onClick={() => handleReject(a)}
                          disabled={a.application_status === 'rechazado'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
