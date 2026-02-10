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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceCreateDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState('');
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState<'pendiente' | 'pagado' | 'rechazado'>('pendiente');
  const [amount, setAmount] = useState('');
  const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setUserId('');
      setEventId('');
      setStatus('pendiente');
      setAmount('');
      setEmissionDate(new Date().toISOString().split('T')[0]);
      setFile(null);
    }
  }, [open]);

  // Fetch users with supervisor/acreditador roles
  const { data: users = [] } = useQuery({
    queryKey: ['invoice-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, profiles:user_id(id, nombre, apellido)')
        .in('role', ['supervisor', 'acreditador']);
      if (error) throw error;
      // Dedupe by user_id
      const map = new Map<string, { id: string; nombre: string; apellido: string }>();
      data?.forEach((r: any) => {
        if (r.profiles && !map.has(r.user_id)) {
          map.set(r.user_id, r.profiles);
        }
      });
      return Array.from(map.values());
    },
    enabled: open,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['invoice-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, name').order('event_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let fileUrl: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('invoices').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('invoices').insert({
        user_id: userId,
        event_id: eventId,
        status,
        amount: parseInt(amount),
        emission_date: emissionDate,
        file_url: fileUrl,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Boleta creada exitosamente' });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const canSave = userId && eventId && amount && parseInt(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Boleta</DialogTitle>
          <DialogDescription>Ingresa los datos para registrar una nueva boleta.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Usuario *</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Evento *</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar evento" /></SelectTrigger>
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
            <Label>Valor ($ CLP) *</Label>
            <Input
              type="number"
              placeholder="150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha de emisión</Label>
            <Input type="date" value={emissionDate} onChange={(e) => setEmissionDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Archivo de boleta (opcional)</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!canSave || createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Boleta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
