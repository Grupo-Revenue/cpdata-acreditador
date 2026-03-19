import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { openEvidenceFile } from '@/lib/ticket-evidence';

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

interface TicketDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
}

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  resuelto: 'Resuelto',
  inactivo: 'Inactivo',
};

const priorityLabels: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const statusStyles: Record<string, string> = {
  pendiente: 'bg-warning/10 text-warning border-warning/20',
  resuelto: 'bg-success/10 text-success border-success/20',
  inactivo: 'bg-muted text-muted-foreground border-muted',
};

const priorityStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  baja: 'bg-muted text-muted-foreground border-muted',
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm col-span-2">{value || '-'}</span>
    </div>
  );
}

export function TicketDetailDialog({ open, onOpenChange, ticket }: TicketDetailDialogProps) {
  const { toast } = useToast();

  const openEvidence = async (value: string) => {
    if (!value) return;
    const { error } = await openEvidenceFile(value);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket #{ticket.ticket_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado y prioridad */}
          <div className="flex gap-2">
            <Badge variant="outline" className={statusStyles[ticket.status]}>
              {statusLabels[ticket.status]}
            </Badge>
            <Badge variant="outline" className={priorityStyles[ticket.priority]}>
              {priorityLabels[ticket.priority]}
            </Badge>
          </div>

          {/* Fecha */}
          <DetailRow label="Fecha de creación" value={format(new Date(ticket.created_at), 'dd-MM-yyyy HH:mm')} />

          {/* Motivo */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">Motivo</span>
            <p className="text-sm mt-1">{ticket.motivo}</p>
          </div>

          <Separator />

          {/* Datos del creador */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Creado por</h4>
            <div className="space-y-1">
              <DetailRow label="Nombre" value={`${ticket.creator_nombre} ${ticket.creator_apellido}`} />
              <DetailRow label="Email" value={ticket.creator_email} />
              <DetailRow label="Teléfono" value={ticket.creator_telefono} />
              <DetailRow label="RUT" value={ticket.creator_rut} />
              <DetailRow label="Rol" value={ticket.creator_role} />
            </div>
          </div>

          {/* Datos del editor/responsable */}
          {ticket.editor_nombre && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Responsable</h4>
                <div className="space-y-1">
                  <DetailRow label="Nombre" value={`${ticket.editor_nombre} ${ticket.editor_apellido}`} />
                  <DetailRow label="Email" value={ticket.editor_email} />
                  <DetailRow label="Teléfono" value={ticket.editor_telefono} />
                  <DetailRow label="RUT" value={ticket.editor_rut} />
                  <DetailRow label="Rol" value={ticket.editor_role} />
                </div>
              </div>
            </>
          )}

          {/* Observaciones */}
          {ticket.observaciones && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Observaciones del responsable</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{ticket.observaciones}</p>
              </div>
            </>
          )}

          {/* Evidencia del creador */}
          {ticket.evidence_url && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Evidencia del creador</h4>
                <Button variant="outline" size="sm" onClick={() => openEvidence(ticket.evidence_url!)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver / Descargar
                </Button>
              </div>
            </>
          )}

          {/* Evidencia de respuesta */}
          {ticket.response_evidence_url && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Evidencia de respuesta</h4>
                <Button variant="outline" size="sm" onClick={() => openEvidence(ticket.response_evidence_url!)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver / Descargar
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
