import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: Array<'admin' | 'user'>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile && allowedRoles.includes(profile.role)) {
    return <Outlet />;
  }

  // Redirect to home if role is not allowed
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;