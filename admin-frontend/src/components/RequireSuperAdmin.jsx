import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

/**
 * Extra gate for the Admin Accounts screen — only super_admin may create
 * or delete admin accounts. Assumes RequireStaff has already run.
 */
export default function RequireSuperAdmin({ children }) {
  const user = useAdminAuthStore((s) => s.user);

  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  return children;
}
