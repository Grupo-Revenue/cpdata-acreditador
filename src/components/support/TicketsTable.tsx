import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';

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

interface TicketsTableProps {
  tickets: SupportTicket[];
  canEdit: boolean;
  onEdit: (ticket: SupportTicket) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-warning/10 text-warning border-warning/20' },
  resuelto: { label: 'Resuelto', className: 'bg-success/10 text-success border-success/20' },
  inactivo: { label: 'Inactivo', className: 'bg-muted text-muted-foreground border-muted' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  media: { label: 'Media', className: 'bg-warning/10 text-warning border-warning/20' },
  baja: { label: 'Baja', className: 'bg-muted text-muted-foreground border-muted' },
};

export function TicketsTable({ tickets, canEdit, onEdit }: TicketsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-28">Prioridad</TableHead>
            <TableHead className="w-32">Fecha</TableHead>
            {canEdit && <TableHead className="w-24">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">
                No hay tickets para mostrar
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => {
              const sc = statusConfig[ticket.status];
              const pc = priorityConfig[ticket.priority];
              return (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.ticket_number}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.motivo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sc?.className}>{sc?.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pc?.className}>{pc?.label}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(ticket.created_at), 'dd-MM-yyyy')}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(ticket)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
