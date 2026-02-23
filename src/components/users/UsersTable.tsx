import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserWithRoles } from './types';
import { Edit, Shield, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface UsersTableProps {
  users: UserWithRoles[];
  onEdit: (user: UserWithRoles) => void;
  onManageRoles: (user: UserWithRoles) => void;
  onDelete: (user: UserWithRoles) => void;
}

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin',
  administracion: 'Administración',
  supervisor: 'Supervisor',
  acreditador: 'Acreditador',
};

const PAGE_SIZE = 25;

export function UsersTable({ users, onEdit, onManageRoles, onDelete }: UsersTableProps) {
  const [searchName, setSearchName] = useState('');
  const [searchRut, setSearchRut] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    setPage(1);
    return users.filter((u) => {
      const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
      if (searchName && !fullName.includes(searchName.toLowerCase())) return false;
      if (searchRut && !u.rut.includes(searchRut)) return false;
      if (searchEmail && !u.email.toLowerCase().includes(searchEmail.toLowerCase())) return false;
      if (filterStatus !== 'todos' && u.approval_status !== filterStatus) return false;
      return true;
    });
  }, [users, searchName, searchRut, searchEmail, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="Buscar por RUT..."
          value={searchRut}
          onChange={(e) => setSearchRut(e.target.value)}
        />
        <Input
          placeholder="Buscar por email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios
      </p>

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
            {paginatedUsers.map((user) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
