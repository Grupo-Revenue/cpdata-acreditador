import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Upload, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface EventGeneralExpensesDialogProps {
  hubspotDealId: string | null;
  dealName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventGeneralExpensesDialog({ hubspotDealId, dealName, open, onOpenChange }: EventGeneralExpensesDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resolve internal event_id
  const { data: eventId, isLoading: loadingEvent } = useQuery({
    queryKey: ['event-id-by-deal', hubspotDealId],
    enabled: open && !!hubspotDealId,
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('hubspot_deal_id', hubspotDealId!)
        .maybeSingle();
      if (data) return data.id;
      // Create event if not exists
      const { data: created, error } = await supabase
        .from('events')
        .insert({ name: dealName ?? 'Evento', hubspot_deal_id: hubspotDealId!, event_date: new Date().toISOString().split('T')[0] })
        .select('id')
        .single();
      if (error) throw error;
      return created.id;
    },
  });

  // Fetch general expenses (user_id IS NULL)
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['general-expenses', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data } = await supabase
        .from('event_expenses')
        .select('*')
        .eq('event_id', eventId!)
        .is('user_id', null)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const handleAdd = async () => {
    if (!name.trim() || !amount || !eventId) return;
    setSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      if (file) {
        const path = `${eventId}/general/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('expense-receipts').upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('expense-receipts').getPublicUrl(path);
        receiptUrl = pub.publicUrl;
      }
      const { error } = await supabase.from('event_expenses').insert({
        event_id: eventId,
        user_id: null,
        name: name.trim(),
        amount: parseInt(amount),
        receipt_url: receiptUrl,
      });
      if (error) throw error;
      setName('');
      setAmount('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['general-expenses', eventId] });
      toast({ title: 'Gasto agregado' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('event_expenses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['general-expenses', eventId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionales — {dealName ?? 'Evento'}</DialogTitle>
        </DialogHeader>

        {loadingEvent ? (
          <LoadingState text="Cargando evento..." />
        ) : (
          <>
            {/* Add form */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
              <div>
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Transporte" />
              </div>
              <div>
                <Label>Monto ($)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-28" />
              </div>
              <div>
                <Label>Comprobante</Label>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-36" />
              </div>
              <Button onClick={handleAdd} disabled={submitting || !name.trim() || !amount} size="sm" className="mb-0.5">
                {submitting ? '...' : '+'}
              </Button>
            </div>

            {/* Expenses list */}
            {loadingExpenses ? (
              <LoadingState text="Cargando gastos..." />
            ) : expenses && expenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{exp.name}</TableCell>
                      <TableCell>${exp.amount.toLocaleString('es-CL')}</TableCell>
                      <TableCell>
                        {exp.receipt_url ? (
                          <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin gastos generales registrados.</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
