import { useState, useMemo, useCallback } from 'react';
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
import { Check, X, ChevronLeft, ChevronRight, Eye, MessageSquare } from 'lucide-react';
import { ApplicantProfileDialog, ProfileData } from './ApplicantProfileDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
  payment_amount: number | null;
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
  const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null);
  const [acceptingApplicant, setAcceptingApplicant] = useState<Applicant | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filters, setFilters] = useState({
    nombre: '',
    evento: '__all__',
    rol: '__all__',
    applicationStatus: '__all__',
    contractStatus: '__all__',
    ranking: '',
  });
  const [bulkFirmaPendienteConfirmOpen, setBulkFirmaPendienteConfirmOpen] = useState(false);
  const [sendingFirmaPendiente, setSendingFirmaPendiente] = useState(false);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['event-applicants'],
    enabled: open,
    refetchOnMount: 'always',
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_accreditors')
        .select('id, user_id, event_id, application_status, contract_status, payment_amount, events(name, event_date, hubspot_deal_id)');
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: hubspotDeals } = useQuery({
    queryKey: ['hubspot-deals-for-applicants'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('hubspot-deals');
      if (error) throw error;
      return (data?.deals ?? []) as any[];
    },
  });

  const userIds = useMemo(() => [...new Set((rawData ?? []).map((r: any) => r.user_id))], [rawData]);

  const { data: profiles } = useQuery({
    queryKey: ['applicant-profiles', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, ranking, rut, email, telefono, referencia_contacto, idioma, altura, universidad, carrera, banco, numero_cuenta, tipo_cuenta, foto_url')
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

  const hubspotDealMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const deal of hubspotDeals ?? []) {
      if (deal.dealId) map.set(deal.dealId, deal);
    }
    return map;
  }, [hubspotDeals]);

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
      const hubspotDeal = r.events?.hubspot_deal_id ? hubspotDealMap.get(r.events.hubspot_deal_id) : null;
      return {
        id: r.id,
        user_id: r.user_id,
        event_id: r.event_id,
        application_status: r.application_status,
        contract_status: r.contract_status,
        nombre: profile?.nombre ?? '',
        apellido: profile?.apellido ?? '',
        ranking: profile?.ranking ?? null,
        payment_amount: r.payment_amount ?? null,
        event_name: r.events?.name
          || hubspotDeal?.nombre_del_evento
          || hubspotDeal?.dealname
          || 'Sin nombre',
        event_date: r.events?.event_date ?? '',
        role: roleMap.get(r.user_id) ?? 'Acreditador',
      };
    });
  }, [rawData, profiles, userRoles, hubspotDealMap]);

  const eventNames = useMemo(() => [...new Set(applicants.map((a) => a.event_name))].sort(), [applicants]);

  const pendingContractApplicants = useMemo(() => {
    return applicants.filter(
      (a) =>
        a.application_status === 'aceptado' &&
        a.contract_status === 'pendiente' &&
        profiles?.find((p) => p.id === a.user_id)?.telefono
    );
  }, [applicants, profiles]);

  const handleBulkFirmaPendiente = useCallback(async () => {
    setSendingFirmaPendiente(true);
    let sent = 0;
    let failed = 0;
    for (const a of pendingContractApplicants) {
      const profile = profiles?.find((p) => p.id === a.user_id);
      if (!profile?.telefono) continue;
      try {
        await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template_name: 'msg_firma_pendiente',
            template_language: 'es',
            to_phone: profile.telefono,
            parameters: [a.nombre],
          },
        });
        sent++;
      } catch {
        failed++;
      }
    }
    setSendingFirmaPendiente(false);
    setBulkFirmaPendienteConfirmOpen(false);
    toast({
      title: 'Envío completado',
      description: `${sent} mensaje(s) enviado(s)${failed > 0 ? `, ${failed} fallido(s)` : ''}.`,
    });
  }, [pendingContractApplicants, profiles, toast]);

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

  const handleConfirmAccept = async () => {
    if (!acceptingApplicant) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Ingresa un monto válido mayor a 0.', variant: 'destructive' });
      return;
    }

    const applicant = acceptingApplicant;

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
      .update({ application_status: 'aceptado', payment_amount: amount } as any)
      .eq('id', applicant.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo aceptar al postulante.', variant: 'destructive' });
      return;
    }

    // Sync invoice amount
    await supabase
      .from('invoices')
      .update({ amount } as any)
      .eq('user_id', applicant.user_id)
      .eq('event_id', applicant.event_id);

    // Send WhatsApp notification (fire-and-forget)
    const profile = profiles?.find(p => p.id === applicant.user_id);
    if (profile?.telefono) {
      supabase.functions.invoke('send-whatsapp-message', {
        body: {
          template_name: 'msg_seleccionado',
          template_language: 'es',
          to_phone: profile.telefono,
          parameters: [applicant.nombre],
        },
      }).catch(() => {});
    }

    toast({ title: 'Aceptado', description: `${applicant.nombre} ${applicant.apellido} fue aceptado con monto $${amount.toLocaleString()}.` });
    queryClient.invalidateQueries({ queryKey: ['event-applicants'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    setAcceptingApplicant(null);
    setPaymentAmount('');
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
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Postulantes</DialogTitle>
              <DialogDescription>Gestión de postulantes asignados a eventos</DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pendingContractApplicants.length === 0 || sendingFirmaPendiente}
              onClick={() => setBulkFirmaPendienteConfirmOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Firma Pendiente ({pendingContractApplicants.length})
            </Button>
          </div>
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
                  <TableHead>Monto</TableHead>
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
                    <TableCell>{a.payment_amount ? `$${a.payment_amount.toLocaleString()}` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const profile = profiles?.find((p) => p.id === a.user_id);
                            if (profile) {
                              setViewingProfile({
                                nombre: profile.nombre,
                                apellido: profile.apellido,
                                rut: profile.rut,
                                email: profile.email,
                                telefono: profile.telefono,
                                referencia_contacto: profile.referencia_contacto,
                                idioma: profile.idioma,
                                altura: profile.altura,
                                universidad: profile.universidad,
                                carrera: profile.carrera,
                                banco: profile.banco,
                                numero_cuenta: profile.numero_cuenta,
                                tipo_cuenta: profile.tipo_cuenta,
                                ranking: profile.ranking,
                                foto_url: profile.foto_url,
                                role: a.role,
                              });
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-success hover:text-success/80"
                          onClick={() => {
                            setAcceptingApplicant(a);
                            setPaymentAmount(a.payment_amount ? String(a.payment_amount) : '');
                          }}
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

      <ApplicantProfileDialog
        profile={viewingProfile}
        onClose={() => setViewingProfile(null)}
      />

      <Dialog open={!!acceptingApplicant} onOpenChange={(o) => { if (!o) { setAcceptingApplicant(null); setPaymentAmount(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Monto de pago</DialogTitle>
            <DialogDescription>
              Ingresa el monto a pagar a {acceptingApplicant?.nombre} {acceptingApplicant?.apellido}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            placeholder="Monto en pesos..."
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            min={1}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAcceptingApplicant(null); setPaymentAmount(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAccept}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
