import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading, isApproved, isActive } = useAuth();

  if (isLoading) {
    return <LoadingState fullScreen text="Cargando..." />;
  }

  // Si hay usuario autenticado y aprobado, redirigir al dashboard
  if (user && isApproved && isActive) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Si hay usuario pero no está aprobado, puede ver las páginas públicas
  // excepto login/register, debe ir a pending
  if (user && !isApproved) {
    return <Navigate to="/auth/pending" replace />;
  }

  return <>{children}</>;
}
