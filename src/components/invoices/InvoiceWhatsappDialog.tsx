import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceRow } from './InvoicesTable';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceRow | null;
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function InvoiceWhatsappDialog({ open, onOpenChange, invoice }: Props) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp_templates_approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('status', 'approved');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const selected = templates.find((t) => t.id === selectedTemplate);
  const phone = invoice?.profiles?.telefono;

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!phone) throw new Error('El usuario no tiene número de teléfono registrado.');
      if (!selected) throw new Error('Selecciona una plantilla.');

      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          template_name: selected.name,
          template_language: selected.language || 'es',
          to_phone: cleanPhone(phone),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Mensaje enviado', description: `Se envió "${selected?.name}" al número ${phone}` });
      onOpenChange(false);
      setSelectedTemplate('');
    },
    onError: (err: Error) => {
      toast({ title: 'Error al enviar', description: err.message, variant: 'destructive' });
    },
  });

  if (!invoice) return null;

  const userName = invoice.profiles ? `${invoice.profiles.nombre} ${invoice.profiles.apellido}` : 'Usuario';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla para enviar a {userName} ({phone || 'sin teléfono'}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue placeholder="Seleccionar plantilla" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-md border p-3 bg-muted/30 space-y-1">
              <p className="text-sm font-medium">Vista previa:</p>
              <p className="text-sm whitespace-pre-wrap">{selected.body_text}</p>
              {selected.footer_text && (
                <p className="text-xs text-muted-foreground mt-2">{selected.footer_text}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => sendMutation.mutate()} disabled={!selectedTemplate || sendMutation.isPending}>
            {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
