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
  fecha_nacimiento: string | null;
  semestre: string | null;
  disponibilidad_horaria: string | null;
  comuna: string | null;
  instagram: string | null;
  facebook: string | null;
  talla_polera: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_email: string | null;
  contacto_emergencia_telefono: string | null;
}

export interface UserRole {
  user_id: string;
  role: AppRole;
}
