import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X } from 'lucide-react';

interface TicketCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type Priority = 'alta' | 'media' | 'baja';
interface Category { name: string; priority: Priority }

const priorityLabel: Record<Priority, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const priorityClass: Record<Priority, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  baja: 'bg-muted text-muted-foreground border-muted',
};

export function TicketCreateDialog({ open, onOpenChange, onCreated }: TicketCreateDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile, roles } = useAuth();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ticket_categories')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value) as Category[];
          setCategories(parsed.filter((c) => c.name?.trim()));
        } catch {}
      }
    })();
  }, [open]);

  const handleCategoryChange = (name: string) => {
    setCategoryName(name);
    const cat = categories.find((c) => c.name === name);
    if (cat) setPriority(cat.priority);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast({ title: 'Error', description: 'El motivo es obligatorio', variant: 'destructive' });
      return;
    }
    if (categories.length > 0 && !categoryName) {
      toast({ title: 'Error', description: 'Debes seleccionar una categoría', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const motivoFinal = categoryName ? `[${categoryName}] ${motivo.trim()}` : motivo.trim();
      const { data: newTicket, error } = await supabase
        .from('support_tickets')
        .insert({
          motivo: motivoFinal,
          priority,
          creator_nombre: profile?.nombre || '',
          creator_apellido: profile?.apellido || '',
          creator_email: profile?.email || '',
          creator_telefono: profile?.telefono || null,
          creator_rut: profile?.rut || '',
          creator_role: roles[0] || '',
        })
        .select('id')
        .single();

      if (error) throw error;

      if (file && newTicket) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${newTicket.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('ticket-evidence')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        await supabase
          .from('support_tickets')
          .update({ evidence_url: filePath })
          .eq('id', newTicket.id);
      }

      toast({ title: 'Ticket creado', description: 'El ticket de soporte ha sido creado exitosamente' });
      setMotivo('');
      setPriority('media');
      setCategoryName('');
      setFile(null);
      onOpenChange(false);
      onCreated();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCategories = categories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Ticket de Soporte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {hasCategories && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={categoryName} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo del ticket..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            {hasCategories ? (
              <div>
                <Badge variant="outline" className={priorityClass[priority]}>
                  {priorityLabel[priority]}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Asignada automáticamente según la categoría seleccionada.
                </p>
              </div>
            ) : (
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Evidencia (opcional)</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Subir archivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              {file && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFile(null)} title="Quitar archivo">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
