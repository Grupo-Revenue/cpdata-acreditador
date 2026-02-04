import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserWithRoles } from './types';
import { Edit, Shield } from 'lucide-react';

interface UsersTableProps {
  users: UserWithRoles[];
  onEdit: (user: UserWithRoles) => void;
  onManageRoles: (user: UserWithRoles) => void;
}

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin',
  administracion: 'Administración',
  supervisor: 'Supervisor',
  acreditador: 'Acreditador',
};

export function UsersTable({ users, onEdit, onManageRoles }: UsersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>RUT</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.nombre || user.apellido ? (
                  `${user.nombre} ${user.apellido}`.trim()
                ) : (
                  <span className="text-muted-foreground italic">{user.email}</span>
                )}
                {!user.is_active && (
                  <Badge variant="secondary" className="ml-2">
                    Inactivo
                  </Badge>
                )}
              </TableCell>
              <TableCell>{user.rut}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <StatusBadge status={user.approval_status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {roleLabels[role] || role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin roles</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onManageRoles(user)}>
                    <Shield className="h-4 w-4" />
                    <span className="sr-only">Gestionar roles</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
