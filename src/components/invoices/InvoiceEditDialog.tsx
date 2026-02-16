import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { InvoiceRow } from './InvoicesTable';

function GlosaInfoBlock({ open }: { open: boolean }) {
  const { data: glosa } = useQuery({
    queryKey: ['modelo-glosa'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'modelo_glosa')
        .maybeSingle();
      return data?.value || null;
    },
    enabled: open,
  });

  if (!glosa) return null;

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 space-y-1">
      <p className="text-sm font-medium flex items-center gap-1.5 text-blue-800">
        <Info className="w-4 h-4" />
        Modelo de Glosa
      </p>
      <p className="text-sm text-blue-700 whitespace-pre-wrap">{glosa}</p>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceRow | null;
}

export function InvoiceEditDialog({ open, onOpenChange, invoice }: Props) {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState('');
  const [userOpen, setUserOpen] = useState(false);
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState<'pendiente' | 'pagado' | 'rechazado'>('pendiente');
  const [amount, setAmount] = useState('');
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && invoice) {
      setUserId(invoice.user_id);
      setEventId(invoice.event_id);
      setStatus(invoice.status);
      setAmount(String(invoice.amount));
      setNumeroBoleta(invoice.numero_boleta || '');
      setPaymentDate((invoice as any).payment_date || '');
      setFile(null);
    }
  }, [open, invoice]);

  const { data: users = [] } = useQuery({
    queryKey: ['invoice-users'],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['supervisor', 'acreditador']);
      if (rolesError) throw rolesError;
      const userIds = [...new Set((rolesData || []).map(r => r.user_id))];
      if (userIds.length === 0) return [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', userIds);
      if (profilesError) throw profilesError;
      return profilesData || [];
    },
    enabled: open && isAdmin,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['invoice-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, name').order('event_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open && isAdmin,
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      let fileUrl = invoice.file_url;

      if (file) {
        const ext = file.name.split('.').pop();
        const targetUserId = isAdmin ? userId : invoice.user_id;
        const path = `${targetUserId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('invoices').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      if (isAdmin) {
        const { error } = await supabase.from('invoices').update({
          user_id: userId,
          event_id: eventId,
          status,
          amount: parseInt(amount),
          file_url: fileUrl,
          numero_boleta: numeroBoleta || null,
          payment_date: paymentDate || null,
        } as any).eq('id', invoice.id);
        if (error) throw error;
      } else {
        // Non-admin can update file_url and numero_boleta
        const { error } = await supabase.from('invoices').update({
          file_url: fileUrl,
          numero_boleta: numeroBoleta || null,
        }).eq('id', invoice.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Boleta actualizada' });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  if (!invoice) return null;

  const invoiceId = 'B' + String(invoice.invoice_number).padStart(3, '0');
  const emissionFormatted = invoice.emission_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isAdmin ? 'Editar Boleta' : 'Subir Boleta'}</DialogTitle>
          <DialogDescription>
            {isAdmin ? 'Modifica los campos de la boleta.' : 'Sube el archivo de tu boleta.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Always show ID and emission date as read-only */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Boleta</Label>
              <Input value={invoiceId} disabled />
            </div>
            <div className="space-y-2">
              <Label>Fecha de emisión</Label>
              <Input value={emissionFormatted} disabled />
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={userOpen} className="w-full justify-between font-normal">
                      {userId ? users.find(u => u.id === userId)?.nombre + ' ' + users.find(u => u.id === userId)?.apellido : 'Seleccionar usuario...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar usuario..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados.</CommandEmpty>
                        <CommandGroup>
                          {users.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.nombre} ${u.apellido}`}
                              onSelect={() => { setUserId(u.id); setUserOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", userId === u.id ? "opacity-100" : "opacity-0")} />
                              {u.nombre} {u.apellido}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Evento</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor ($ CLP)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de pago (opcional)</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si se deja vacío, se calculará automáticamente.
                </p>
              </div>
            </>
          )}

          {!isAdmin && <GlosaInfoBlock open={open} />}

          <div className="space-y-2">
            <Label>Número de boleta {!isAdmin && <span className="text-destructive">*</span>}</Label>
            <Input
              placeholder="Ingrese el número de su boleta"
              value={numeroBoleta}
              onChange={(e) => setNumeroBoleta(e.target.value)}
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">Campo obligatorio para subir tu boleta.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Archivo de boleta</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {invoice.file_url && (
              <p className="text-xs text-muted-foreground">
                Ya tiene un archivo. Subir uno nuevo lo reemplazará.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || (!isAdmin && !numeroBoleta.trim())}>
            {editMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
