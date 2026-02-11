import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, MessageSquare, Upload } from 'lucide-react';
import { format } from 'date-fns';

export interface InvoiceRow {
  id: string;
  invoice_number: number;
  numero_boleta: string | null;
  user_id: string;
  event_id: string;
  status: 'pendiente' | 'pagado' | 'rechazado';
  amount: number;
  emission_date: string;
  file_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles: { nombre: string; apellido: string; telefono: string | null } | null;
  roles: string[];
  events: { name: string; event_date: string } | null;
}

interface InvoicesTableProps {
  invoices: InvoiceRow[];
  isAdmin: boolean;
  onEdit: (invoice: InvoiceRow) => void;
  onWhatsapp: (invoice: InvoiceRow) => void;
  onUpload: (invoice: InvoiceRow) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-warning/10 text-warning border-warning/20' },
  pagado: { label: 'Pagado', className: 'bg-success/10 text-success border-success/20' },
  rechazado: { label: 'Rechazado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function formatCLP(amount: number): string {
  return '$' + amount.toLocaleString('es-CL');
}

function formatInvoiceId(num: number): string {
  return 'B' + String(num).padStart(3, '0');
}

export function InvoicesTable({ invoices, isAdmin, onEdit, onWhatsapp, onUpload }: InvoicesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>ID Boleta</TableHead>
            <TableHead>N° Boleta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Evento</TableHead>
            
            <TableHead>Valor</TableHead>
            <TableHead>Fecha emisión</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No hay boletas para mostrar
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => {
              const sc = statusConfig[inv.status];
              const invoiceId = formatInvoiceId(inv.invoice_number);
              const roles = inv.roles.length > 0 ? inv.roles.join(', ') : '-';

              return (
                <TableRow key={inv.id}>
                  <TableCell>
                    {inv.profiles ? `${inv.profiles.nombre} ${inv.profiles.apellido}` : '-'}
                  </TableCell>
                  <TableCell className="capitalize text-sm">{roles}</TableCell>
                  <TableCell>
                    {inv.file_url ? (
                      <a
                        href={inv.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 font-medium"
                      >
                        {invoiceId}
                      </a>
                    ) : (
                      <span className="font-medium">{invoiceId}</span>
                    )}
                  </TableCell>
                  <TableCell>{inv.numero_boleta || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sc?.className}>{sc?.label}</Badge>
                  </TableCell>
                  <TableCell>{inv.events?.name || '-'}</TableCell>


                  <TableCell>{formatCLP(inv.amount)}</TableCell>
                  <TableCell>{format(new Date(inv.emission_date + 'T00:00:00'), 'dd-MM-yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isAdmin ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(inv)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onWhatsapp(inv)} title="Enviar WhatsApp">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        !inv.file_url && (
                          <Button variant="ghost" size="icon" onClick={() => onUpload(inv)} title="Subir boleta">
                            <Upload className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
