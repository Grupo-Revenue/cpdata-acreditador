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
}

export interface UserRole {
  user_id: string;
  role: AppRole;
}
