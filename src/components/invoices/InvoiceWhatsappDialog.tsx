import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const handleSend = () => {
    if (!phone) {
      toast({ title: 'Error', description: 'El usuario no tiene número de teléfono registrado.', variant: 'destructive' });
      return;
    }
    // UI-only: show success message
    toast({ title: 'Plantilla enviada', description: `Se envió "${selected?.name}" al número ${phone}` });
    onOpenChange(false);
  };

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
          <Button onClick={handleSend} disabled={!selectedTemplate}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
