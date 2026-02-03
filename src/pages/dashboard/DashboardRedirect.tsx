import { Navigate } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

export default function DashboardRedirect() {
  const { roles, isLoading, isApproved, isActive, user } = useAuth();

  if (isLoading) {
    return <LoadingState fullScreen text="Cargando..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isApproved || !isActive) {
    return <Navigate to="/auth/pending" replace />;
  }

  const defaultDashboard = getDefaultDashboard(roles);
  return <Navigate to={defaultDashboard} replace />;
}
