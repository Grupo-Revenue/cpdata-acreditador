import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, MessageSquare, Upload, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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
  payment_date: string | null;
  profiles: { nombre: string; apellido: string; telefono: string | null } | null;
  roles: string[];
  events: { name: string; event_date: string } | null;
  total_amount: number;
}

interface InvoicesTableProps {
  invoices: InvoiceRow[];
  isAdmin: boolean;
  paymentDays: number[];
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

function calcPaymentDate(eventDateStr: string, paymentDays: number[]): Date {
  const eventDate = new Date(eventDateStr + 'T00:00:00');
  const day = eventDate.getDate();
  const sorted = [...paymentDays].sort((a, b) => a - b);

  for (const pd of sorted) {
    if (pd > day) {
      return new Date(eventDate.getFullYear(), eventDate.getMonth(), pd);
    }
  }
  return new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, sorted[0]);
}

function formatDateSafe(dateStr: string): string {
  return format(new Date(dateStr + 'T00:00:00'), 'dd-MM-yyyy');
}

interface Filters {
  nombre: string;
  rol: string;
  idBoleta: string;
  numeroBoleta: string;
  estado: string;
  evento: string;
  valor: string;
  fechaEvento: string;
  fechaEmision: string;
  fechaPago: string;
}

const initialFilters: Filters = {
  nombre: '', rol: '', idBoleta: '', numeroBoleta: '',
  estado: 'all', evento: 'all', valor: '', fechaEvento: '', fechaEmision: '', fechaPago: '',
};

const PAGE_SIZE = 25;

export function InvoicesTable({ invoices, isAdmin, paymentDays, onEdit, onWhatsapp, onUpload }: InvoicesTableProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const uniqueRoles = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => inv.roles.forEach((r) => set.add(r)));
    return [...set].sort();
  }, [invoices]);

  const uniqueEvents = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => { if (inv.events?.name) set.add(inv.events.name); });
    return [...set].sort();
  }, [invoices]);

  const filtered = useMemo(() => {
    setPage(1);
    return invoices.filter((inv) => {
      const name = inv.profiles ? `${inv.profiles.nombre} ${inv.profiles.apellido}` : '';
      const invoiceId = formatInvoiceId(inv.invoice_number);
      const roles = inv.roles.join(', ');
      const eventDateStr = inv.events?.event_date ? formatDateSafe(inv.events.event_date) : '';
      const paymentDateStr = inv.payment_date
        ? formatDateSafe(inv.payment_date)
        : inv.events?.event_date
          ? format(calcPaymentDate(inv.events.event_date, paymentDays), 'dd-MM-yyyy')
          : '';

      const match = (value: string, filter: string) =>
        !filter || value.toLowerCase().includes(filter.toLowerCase());

      if (!match(name, filters.nombre)) return false;
      if (!match(roles, filters.rol === 'all' ? '' : filters.rol)) return false;
      if (!match(invoiceId, filters.idBoleta)) return false;
      if (!match(inv.numero_boleta || '', filters.numeroBoleta)) return false;
      if (filters.estado !== 'all' && inv.status !== filters.estado) return false;
      if (filters.evento !== 'all' && inv.events?.name !== filters.evento) return false;
      if (!match(formatCLP(inv.amount), filters.valor)) return false;
      if (!match(eventDateStr, filters.fechaEvento)) return false;
      if (!match(formatDateSafe(inv.emission_date), filters.fechaEmision)) return false;
      if (!match(paymentDateStr, filters.fechaPago)) return false;

      return true;
    });
  }, [invoices, filters, paymentDays]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-2">
        <Input
          placeholder="Nombre..."
          value={filters.nombre}
          onChange={(e) => setFilter('nombre', e.target.value)}
          className="h-8 text-xs"
        />
        <Select value={filters.rol} onValueChange={(v) => setFilter('rol', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {uniqueRoles.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="ID Boleta..."
          value={filters.idBoleta}
          onChange={(e) => setFilter('idBoleta', e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="N° Boleta..."
          value={filters.numeroBoleta}
          onChange={(e) => setFilter('numeroBoleta', e.target.value)}
          className="h-8 text-xs"
        />
        <Select value={filters.estado} onValueChange={(v) => setFilter('estado', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.evento} onValueChange={(v) => setFilter('evento', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            {uniqueEvents.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Valor..."
          value={filters.valor}
          onChange={(e) => setFilter('valor', e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="F. evento..."
          value={filters.fechaEvento}
          onChange={(e) => setFilter('fechaEvento', e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="F. emisión..."
          value={filters.fechaEmision}
          onChange={(e) => setFilter('fechaEmision', e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="F. pago..."
          value={filters.fechaPago}
          onChange={(e) => setFilter('fechaPago', e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Mostrando {paginated.length} de {filtered.length} boletas
      </p>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>ID Boleta</TableHead>
              <TableHead>N° Boleta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Fecha evento</TableHead>
              <TableHead>Fecha emisión</TableHead>
              <TableHead>Fecha de pago</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  No hay boletas para mostrar
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((inv) => {
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
                    <TableCell>
                      {inv.total_amount > inv.amount ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help font-medium">
                                {formatCLP(inv.total_amount)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatCLP(inv.amount)} base + {formatCLP(inv.total_amount - inv.amount)} rendiciones</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        formatCLP(inv.amount)
                      )}
                    </TableCell>
                    <TableCell>{inv.events?.event_date ? formatDateSafe(inv.events.event_date) : '-'}</TableCell>
                    <TableCell>{formatDateSafe(inv.emission_date)}</TableCell>
                    <TableCell>
                      {inv.payment_date
                        ? formatDateSafe(inv.payment_date)
                        : inv.events?.event_date
                          ? format(calcPaymentDate(inv.events.event_date, paymentDays), 'dd-MM-yyyy')
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(inv)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => onWhatsapp(inv)} title="Enviar WhatsApp">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin ? (
                          inv.file_url ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => onUpload(inv)} title="Subir boleta">
                              <Upload className="h-4 w-4" />
                            </Button>
                          )
                        ) : (
                          inv.file_url ? <CheckCircle className="h-4 w-4 text-success" /> : (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
