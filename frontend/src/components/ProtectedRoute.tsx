import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  userRole?: UserRole;
}

export default function ProtectedRoute({ allowedRoles, userRole }: ProtectedRouteProps) {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
