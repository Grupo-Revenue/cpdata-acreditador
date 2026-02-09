import { AppRole, ApprovalStatus } from '@/contexts/AuthContext';

export interface UserWithRoles {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  referencia_contacto: string | null;
  approval_status: ApprovalStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: AppRole[];
  idioma: string | null;
  altura: string | null;
  universidad: string | null;
  carrera: string | null;
  banco: string | null;
  numero_cuenta: string | null;
  tipo_cuenta: string | null;
}

export interface UserRole {
  user_id: string;
  role: AppRole;
}
