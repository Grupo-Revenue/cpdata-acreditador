import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'pending' 
  | 'approved' 
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'submitted'
  | 'paid'
  | 'open'
  | 'closed'
  | 'resolved'
  | 'signed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  },
  approved: {
    label: 'Aprobado',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  rejected: {
    label: 'Rechazado',
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
  active: {
    label: 'Activo',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  inactive: {
    label: 'Inactivo',
    className: 'bg-muted text-muted-foreground border-muted hover:bg-muted',
  },
  submitted: {
    label: 'Enviado',
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  },
  paid: {
    label: 'Pagado',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  open: {
    label: 'Abierto',
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  },
  closed: {
    label: 'Cerrado',
    className: 'bg-muted text-muted-foreground border-muted hover:bg-muted',
  },
  resolved: {
    label: 'Resuelto',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  signed: {
    label: 'Firmado',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
