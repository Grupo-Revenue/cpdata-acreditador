import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading, isApproved, isActive, activeRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullScreen text="Verificando sesión..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!isApproved || !isActive) {
    return <Navigate to="/auth/pending" replace />;
  }

  // Verificar roles contra el rol activo
  if (requiredRoles && requiredRoles.length > 0 && activeRole) {
    const hasAccess = requiredRoles.includes(activeRole);
    if (!hasAccess) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
