import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Upload } from 'lucide-react';

interface SupportTicket {
  id: string;
  ticket_number: number;
  motivo: string;
  status: 'pendiente' | 'resuelto' | 'inactivo';
  priority: 'alta' | 'media' | 'baja';
  observaciones: string | null;
  evidence_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TicketEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
  onUpdated: () => void;
}

export function TicketEditDialog({ open, onOpenChange, ticket, onUpdated }: TicketEditDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [priority, setPriority] = useState<string>('media');
  const [status, setStatus] = useState<string>('pendiente');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (ticket) {
      setMotivo(ticket.motivo);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setObservaciones(ticket.observaciones || '');
      setEvidenceUrl(ticket.evidence_url);
    }
  }, [ticket]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${ticket.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-evidence')
        .getPublicUrl(filePath);

      setEvidenceUrl(publicUrl);
      toast({ title: 'Archivo subido', description: 'La evidencia se ha subido correctamente' });
    } catch (error: any) {
      toast({ title: 'Error al subir archivo', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!ticket || !motivo.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          motivo: motivo.trim(),
          priority: priority as 'alta' | 'media' | 'baja',
          status: status as 'pendiente' | 'resuelto' | 'inactivo',
          observaciones: observaciones.trim() || null,
          evidence_url: evidenceUrl,
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({ title: 'Ticket actualizado', description: 'El ticket ha sido actualizado exitosamente' });
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Ticket #{ticket.ticket_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID del Ticket</Label>
              <Input value={`#${ticket.ticket_number}`} disabled />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Creación</Label>
              <Input value={format(new Date(ticket.created_at), 'dd-MM-yyyy')} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-motivo">Motivo</Label>
            <Textarea
              id="edit-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
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
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Agregar observaciones..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Evidencia</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild disabled={isUploading}>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Subir archivo'}
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                </label>
              </Button>
              {evidenceUrl && (
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                  Ver evidencia
                </a>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
