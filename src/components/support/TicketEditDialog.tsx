import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Upload, ExternalLink } from 'lucide-react';
import { TicketEvidencePreviewDialog } from './TicketEvidencePreviewDialog';

interface SupportTicket {
  id: string;
  ticket_number: number;
  motivo: string;
  status: 'pendiente' | 'resuelto' | 'inactivo';
  priority: 'alta' | 'media' | 'baja';
  observaciones: string | null;
  evidence_url: string | null;
  response_evidence_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  creator_nombre: string;
  creator_apellido: string;
  creator_email: string;
  creator_telefono: string | null;
  creator_rut: string;
  creator_role: string;
  editor_nombre: string | null;
  editor_apellido: string | null;
  editor_email: string | null;
  editor_telefono: string | null;
  editor_rut: string | null;
  editor_role: string | null;
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
  const [responseEvidenceUrl, setResponseEvidenceUrl] = useState<string | null>(null);
  const [previewValue, setPreviewValue] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Evidencia');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile, roles, user } = useAuth();

  useEffect(() => {
    if (ticket) {
      setMotivo(ticket.motivo);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setObservaciones(ticket.observaciones || '');
      setResponseEvidenceUrl(ticket.response_evidence_url);
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

      setResponseEvidenceUrl(filePath);
      toast({ title: 'Archivo subido', description: 'La evidencia de respuesta se ha subido correctamente' });
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
          response_evidence_url: responseEvidenceUrl,
          updated_by: user?.id || null,
          editor_nombre: profile?.nombre || null,
          editor_apellido: profile?.apellido || null,
          editor_email: profile?.email || null,
          editor_telefono: profile?.telefono || null,
          editor_rut: profile?.rut || null,
          editor_role: roles[0] || null,
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

  const openPreview = (value: string, title: string) => {
    setPreviewValue(value);
    setPreviewTitle(title);
  };

  if (!ticket) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ticket #{ticket.ticket_number}</DialogTitle>
            <DialogDescription>Modifica los campos del ticket de soporte</DialogDescription>
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

            <div className="rounded-md border p-3 space-y-2 bg-muted/50">
              <Label className="text-sm font-semibold">Creado por</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Nombre:</span> {ticket.creator_nombre} {ticket.creator_apellido}</div>
                <div><span className="text-muted-foreground">Rol:</span> {ticket.creator_role || '-'}</div>
                <div><span className="text-muted-foreground">Email:</span> {ticket.creator_email}</div>
                <div><span className="text-muted-foreground">Teléfono:</span> {ticket.creator_telefono || '-'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">RUT:</span> {ticket.creator_rut}</div>
              </div>
            </div>

            {ticket.editor_nombre && (
              <div className="rounded-md border p-3 space-y-2 bg-muted/50">
                <Label className="text-sm font-semibold">Último editor</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Nombre:</span> {ticket.editor_nombre} {ticket.editor_apellido}</div>
                  <div><span className="text-muted-foreground">Rol:</span> {ticket.editor_role || '-'}</div>
                  <div><span className="text-muted-foreground">Email:</span> {ticket.editor_email}</div>
                  <div><span className="text-muted-foreground">Teléfono:</span> {ticket.editor_telefono || '-'}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">RUT:</span> {ticket.editor_rut}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-motivo">Motivo</Label>
              <Textarea id="edit-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea id="observaciones" placeholder="Agregar observaciones..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} />
            </div>

            {ticket.evidence_url && (
              <div className="space-y-2">
                <Label>Evidencia del creador</Label>
                <div>
                  <Button variant="outline" size="sm" onClick={() => openPreview(ticket.evidence_url!, 'Evidencia del creador')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver / Descargar
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Evidencia de respuesta</Label>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Subir archivo'}
                </Button>
                {responseEvidenceUrl && (
                  <Button variant="link" size="sm" className="text-sm p-0 h-auto" onClick={() => openPreview(responseEvidenceUrl, 'Evidencia de respuesta')}>
                    Ver evidencia de respuesta
                  </Button>
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

      <TicketEvidencePreviewDialog
        open={!!previewValue}
        onOpenChange={(v) => { if (!v) setPreviewValue(null); }}
        evidenceValue={previewValue}
        title={previewTitle}
      />
    </>
  );
}
