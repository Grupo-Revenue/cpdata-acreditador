import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getDashboardForRole } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';
import { RoleSelectDialog } from '@/components/auth/RoleSelectDialog';

export default function DashboardRedirect() {
  const { roles, isLoading, isApproved, isActive, user, activeRole, setActiveRole } = useAuth();
  const [autoAssigned, setAutoAssigned] = useState(false);

  // Auto-assign if single role
  useEffect(() => {
    if (!isLoading && user && isApproved && isActive && roles.length === 1 && !activeRole) {
      setActiveRole(roles[0]);
      setAutoAssigned(true);
    }
  }, [isLoading, user, isApproved, isActive, roles, activeRole, setActiveRole]);

  if (isLoading) {
    return <LoadingState fullScreen text="Cargando..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isApproved || !isActive) {
    return <Navigate to="/auth/pending" replace />;
  }

  // Already has active role -> redirect
  if (activeRole) {
    return <Navigate to={getDashboardForRole(activeRole)} replace />;
  }

  // Multiple roles, no active role -> show selector
  if (roles.length > 1 && !activeRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RoleSelectDialog
          open
          roles={roles}
          onSelect={(role) => setActiveRole(role)}
        />
      </div>
    );
  }

  // Fallback while auto-assigning
  return <LoadingState fullScreen text="Cargando..." />;
}
