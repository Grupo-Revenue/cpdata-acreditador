import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface TemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
}

interface TemplateData {
  id?: string;
  name: string;
  language: string;
  category: string;
  header_type: string;
  header_text: string;
  header_image_url: string;
  body_text: string;
  footer_text: string;
  buttons: TemplateButton[];
  status?: string;
}

const EMPTY: TemplateData = {
  name: '', language: 'es', category: 'MARKETING', header_type: 'none',
  header_text: '', header_image_url: '', body_text: '', footer_text: '', buttons: [],
};

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'es_AR', label: 'Español (Argentina)' },
  { value: 'es_MX', label: 'Español (México)' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt_BR', label: 'Portugués (Brasil)' },
];

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utilidad' },
  { value: 'AUTHENTICATION', label: 'Autenticación' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TemplateData | null;
}

export function WhatsappTemplateDialog({ open, onOpenChange, template }: Props) {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TemplateData>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!template?.id;
  const hasMetaId = !!(template as any)?.meta_template_id;
  const isRejected = template?.status === 'rejected';

  useEffect(() => {
    if (open) {
      setForm(template ? { ...template, buttons: template.buttons ?? [] } : { ...EMPTY });
    }
  }, [open, template]);

  const set = <K extends keyof TemplateData>(key: K, value: TemplateData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async (status: string) => {
      const payload = {
        name: form.name,
        language: form.language,
        category: form.category,
        header_type: form.header_type,
        header_text: form.header_type === 'text' ? form.header_text : null,
        header_image_url: form.header_type === 'image' ? form.header_image_url : null,
        body_text: form.body_text,
        footer_text: form.footer_text || null,
        buttons: JSON.parse(JSON.stringify(form.buttons)),
        status,
      };

      if (isEdit) {
        const { error } = await supabase.from('whatsapp_templates').update(payload).eq('id', form.id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('whatsapp_templates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Plantilla guardada' });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const addButton = () => {
    if (form.buttons.length >= 3) return;
    set('buttons', [...form.buttons, { type: 'QUICK_REPLY', text: '' }]);
  };

  const updateButton = (idx: number, patch: Partial<TemplateButton>) => {
    const updated = form.buttons.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    set('buttons', updated);
  };

  const removeButton = (idx: number) => {
    set('buttons', form.buttons.filter((_, i) => i !== idx));
  };

  const canSave = form.name.trim() && form.body_text.trim();

  const handleSubmitToMeta = async () => {
    if (!canSave || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // First save as draft
      const payload = {
        name: form.name,
        language: form.language,
        category: form.category,
        header_type: form.header_type,
        header_text: form.header_type === 'text' ? form.header_text : null,
        header_image_url: form.header_type === 'image' ? form.header_image_url : null,
        body_text: form.body_text,
        footer_text: form.footer_text || null,
        buttons: JSON.parse(JSON.stringify(form.buttons)),
        status: 'draft',
      };

      let templateId = form.id;
      if (isEdit) {
        const { error } = await supabase.from('whatsapp_templates').update(payload).eq('id', form.id!);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('whatsapp_templates').insert(payload).select('id').single();
        if (error) throw error;
        templateId = data.id;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('submit-whatsapp-template', {
        body: { template_id: templateId },
      });

      if (error) throw new Error(error.message || 'Error al enviar a Meta');
      if (data?.error) {
        const userMsg = data?.meta_error?.error_user_msg || data.error;
        throw new Error(userMsg);
      }

      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Plantilla enviada a Meta', description: 'El estado cambiará cuando Meta la apruebe.' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error al enviar a Meta', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          <DialogDescription>
            Completa los campos para {isEdit ? 'editar' : 'crear'} una plantilla de mensaje de WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nombre de la plantilla *</Label>
            <Input placeholder="bienvenida_cliente" value={form.name} onChange={(e) => set('name', e.target.value)} disabled={hasMetaId} />
            <p className="text-xs text-muted-foreground">
              {hasMetaId ? 'El nombre no se puede cambiar una vez enviado a Meta' : 'Solo letras minúsculas, números y guiones bajos'}
            </p>
          </div>

          {/* Category + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={form.language} onValueChange={(v) => set('language', v)} disabled={hasMetaId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasMetaId && <p className="text-xs text-muted-foreground">No se puede cambiar el idioma</p>}
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <Label>Tipo de header</Label>
            <Select value={form.header_type} onValueChange={(v) => set('header_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.header_type === 'text' && (
            <div className="space-y-2">
              <Label>Texto del header</Label>
              <Input placeholder="Ej: ¡Hola {{1}}!" value={form.header_text} onChange={(e) => set('header_text', e.target.value)} />
            </div>
          )}

          {form.header_type === 'image' && (
            <div className="space-y-2">
              <Label>URL de la imagen</Label>
              <Input placeholder="https://example.com/image.jpg" value={form.header_image_url} onChange={(e) => set('header_image_url', e.target.value)} />
            </div>
          )}

          {/* Body */}
          <div className="space-y-2">
            <Label>Cuerpo del mensaje *</Label>
          <Textarea
              placeholder="Hola {{1}}, tu cita es el {{2}} a las {{3}}."
              value={form.body_text}
              onChange={(e) => set('body_text', e.target.value)}
              rows={4}
            />
            {(() => {
              const matches = form.body_text.match(/\{\{\d+\}\}/g);
              const uniqueVars = matches ? [...new Set(matches)].sort() : [];
              return (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Usa {'{{1}}'}, {'{{2}}'}, etc. para variables dinámicas que se reemplazan al enviar el mensaje.</p>
                  <p className="text-muted-foreground/70">Ejemplo: "Hola {'{{1}}'}, tu factura #{'{{2}}'} está lista" → al enviar se pasan los valores en orden.</p>
                  {uniqueVars.length > 0 && (
                    <p className="font-medium text-foreground/80">
                      Variables detectadas: {uniqueVars.join(', ')} ({uniqueVars.length} {uniqueVars.length === 1 ? 'variable' : 'variables'})
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <Label>Footer (opcional)</Label>
            <Input placeholder="Ej: Responde STOP para cancelar" value={form.footer_text} onChange={(e) => set('footer_text', e.target.value)} />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Botones (máx. 3)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addButton} disabled={form.buttons.length >= 3}>
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>

            {form.buttons.map((btn, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 rounded-md border bg-muted/30">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={btn.type} onValueChange={(v) => updateButton(idx, { type: v as TemplateButton['type'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUICK_REPLY">Respuesta rápida</SelectItem>
                        <SelectItem value="URL">URL</SelectItem>
                        <SelectItem value="PHONE_NUMBER">Teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Texto del botón" value={btn.text} onChange={(e) => updateButton(idx, { text: e.target.value })} />
                  </div>
                  {btn.type === 'URL' && (
                    <Input placeholder="https://example.com" value={btn.url ?? ''} onChange={(e) => updateButton(idx, { url: e.target.value })} />
                  )}
                  {btn.type === 'PHONE_NUMBER' && (
                    <Input placeholder="+56912345678" value={btn.phone_number ?? ''} onChange={(e) => updateButton(idx, { phone_number: e.target.value })} />
                  )}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeButton(idx)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={() => saveMutation.mutate('draft')} disabled={!canSave || saveMutation.isPending || isSubmitting}>
            Guardar borrador
          </Button>
          <Button onClick={handleSubmitToMeta} disabled={!canSave || saveMutation.isPending || isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar a aprobación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
