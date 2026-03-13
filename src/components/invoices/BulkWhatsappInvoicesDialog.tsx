import { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MessageSquare, Send, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { InvoiceRow } from './InvoicesTable';

type TemplateName = 'msg_pendiente_boleta' | 'msg_boleta_pagada';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceRow[];
}

export function BulkWhatsappInvoicesDialog({ open, onOpenChange, invoices }: Props) {
  const [template, setTemplate] = useState<TemplateName>('msg_pendiente_boleta');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Filter invoices to only acreditador/supervisor with phone, then by template logic
  const filteredInvoices = useMemo(() => {
    const validRoles = ['acreditador', 'supervisor'];
    return invoices.filter((inv) => {
      const hasValidRole = inv.roles.some((r) => validRoles.includes(r));
      const hasPhone = !!inv.profiles?.telefono;
      if (!hasValidRole || !hasPhone) return false;

      if (template === 'msg_pendiente_boleta') return !inv.file_url;
      return !!inv.file_url;
    });
  }, [invoices, template]);

  // Apply search filter
  const displayInvoices = useMemo(() => {
    if (!search.trim()) return filteredInvoices;
    const q = search.toLowerCase();
    return filteredInvoices.filter((inv) => {
      const name = `${inv.profiles?.nombre ?? ''} ${inv.profiles?.apellido ?? ''}`.toLowerCase();
      const phone = inv.profiles?.telefono ?? '';
      return name.includes(q) || phone.includes(q);
    });
  }, [filteredInvoices, search]);

  // Reset selection when template changes
  const handleTemplateChange = (val: string) => {
    setTemplate(val as TemplateName);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === displayInvoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayInvoices.map((i) => i.id)));
    }
  };

  const selectedInvoices = useMemo(
    () => filteredInvoices.filter((i) => selected.has(i.id)),
    [filteredInvoices, selected]
  );

  const handleSend = useCallback(async () => {
    setSending(true);
    let success = 0;
    let failed = 0;

    for (const inv of selectedInvoices) {
      const nombre = inv.profiles?.nombre ?? '';
      const { error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          template_name: template,
          template_language: 'es',
          to_phone: inv.profiles?.telefono,
          parameters: [nombre],
        },
      });
      if (error) failed++;
      else success++;
    }

    setSending(false);
    setConfirmOpen(false);

    if (success > 0) toast.success(`${success} mensaje(s) enviado(s) correctamente`);
    if (failed > 0) toast.error(`${failed} mensaje(s) fallaron al enviar`);

    if (failed === 0) {
      setSelected(new Set());
      onOpenChange(false);
    }
  }, [selectedInvoices, template, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Masivo — Boletas
            </DialogTitle>
            <DialogDescription>
              Selecciona la plantilla y los destinatarios para enviar mensajes.
            </DialogDescription>
          </DialogHeader>

          {/* Template selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Plantilla</Label>
            <RadioGroup value={template} onValueChange={handleTemplateChange} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="msg_pendiente_boleta" id="tpl_pendiente" />
                <Label htmlFor="tpl_pendiente" className="cursor-pointer text-sm">
                  msg_pendiente_boleta
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="msg_boleta_pagada" id="tpl_pagada" />
                <Label htmlFor="tpl_pagada" className="cursor-pointer text-sm">
                  msg_boleta_pagada
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={displayInvoices.length > 0 && selected.size === displayInvoices.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm text-muted-foreground">
                Seleccionar todos ({displayInvoices.length})
              </span>
            </div>
            <Badge variant="secondary">{selected.size} seleccionado(s)</Badge>
          </div>

          {/* User list */}
          <ScrollArea className="flex-1 max-h-[300px] border rounded-md">
            {displayInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay destinatarios disponibles para esta plantilla.
              </p>
            ) : (
              <div className="divide-y">
                {displayInvoices.map((inv) => {
                  const nombre = `${inv.profiles?.nombre ?? ''} ${inv.profiles?.apellido ?? ''}`;
                  const hasFile = !!inv.file_url;
                  return (
                    <label
                      key={inv.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selected.has(inv.id)}
                        onCheckedChange={() => toggleSelect(inv.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{nombre}</p>
                        <p className="text-xs text-muted-foreground">{inv.profiles?.telefono ?? 'Sin teléfono'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={inv.status === 'pagado' ? 'default' : inv.status === 'rechazado' ? 'destructive' : 'secondary'} className="text-xs">
                          {inv.status}
                        </Badge>
                        <Badge variant={hasFile ? 'default' : 'outline'} className="text-xs">
                          {hasFile ? 'Subida' : 'Sin subir'}
                        </Badge>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0 || sending}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar ({selected.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar envío masivo"
        description={`Se enviará la plantilla "${template}" a ${selected.size} persona(s). ¿Deseas continuar?`}
        confirmLabel="Enviar"
        onConfirm={handleSend}
        isLoading={sending}
        icon={MessageSquare}
      />
    </>
  );
}
