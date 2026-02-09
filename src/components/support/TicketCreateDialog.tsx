import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TicketCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function TicketCreateDialog({ open, onOpenChange, onCreated }: TicketCreateDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [priority, setPriority] = useState<string>('media');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile, roles } = useAuth();

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast({ title: 'Error', description: 'El motivo es obligatorio', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          motivo: motivo.trim(),
          priority: priority as 'alta' | 'media' | 'baja',
          creator_nombre: profile?.nombre || '',
          creator_apellido: profile?.apellido || '',
          creator_email: profile?.email || '',
          creator_telefono: profile?.telefono || null,
          creator_rut: profile?.rut || '',
          creator_role: roles[0] || '',
        });

      if (error) throw error;

      toast({ title: 'Ticket creado', description: 'El ticket de soporte ha sido creado exitosamente' });
      setMotivo('');
      setPriority('media');
      onOpenChange(false);
      onCreated();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Ticket de Soporte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
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
