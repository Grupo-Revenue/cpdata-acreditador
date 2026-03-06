import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

function detectVariables(text: string): string[] {
  const matches = text.match(/\{\{\d+\}\}/g);
  return matches ? [...new Set(matches)].sort() : [];
}

export function InvoiceWhatsappDialog({ open, onOpenChange, invoice }: Props) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

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

  const variables = useMemo(() => {
    if (!selected) return [];
    return detectVariables(selected.body_text);
  }, [selected]);

  // Reset variable values when template changes
  useEffect(() => {
    setVariableValues({});
  }, [selectedTemplate]);

  const previewBody = useMemo(() => {
    if (!selected) return '';
    let text = selected.body_text;
    variables.forEach((v) => {
      const val = variableValues[v];
      if (val) text = text.replaceAll(v, val);
    });
    return text;
  }, [selected, variables, variableValues]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!phone) throw new Error('El usuario no tiene número de teléfono registrado.');
      if (!selected) throw new Error('Selecciona una plantilla.');

      // Build parameters array in order
      const parameters = variables.map((v) => variableValues[v] || '');

      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          template_name: selected.name,
          template_language: selected.language || 'es',
          to_phone: cleanPhone(phone),
          parameters: parameters.length > 0 ? parameters : undefined,
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
      setVariableValues({});
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

          {selected && variables.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Variables dinámicas</Label>
              {variables.map((v, idx) => (
                <div key={v} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {v} — Variable {idx + 1}
                  </Label>
                  <Input
                    placeholder={`Valor para ${v}`}
                    value={variableValues[v] || ''}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="rounded-md border p-3 bg-muted/30 space-y-1">
              <p className="text-sm font-medium">Vista previa:</p>
              <p className="text-sm whitespace-pre-wrap">{previewBody}</p>
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
