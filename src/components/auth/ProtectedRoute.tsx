import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading, isApproved, isActive, roles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullScreen text="Verificando sesión..." />;
  }

  // No hay usuario autenticado
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Usuario no aprobado o inactivo
  if (!isApproved || !isActive) {
    return <Navigate to="/auth/pending" replace />;
  }

  // Verificar roles si se especifican
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role as any));
    if (!hasRequiredRole) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
