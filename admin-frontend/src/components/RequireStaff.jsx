import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

/**
 * Gate for the whole admin portal: must be signed in AND hold the
 * 'admin' or 'super_admin' role. A plain 'user' account (or nobody)
 * gets bounced to /login.
 */
export default function RequireStaff({ children }) {
  const user = useAdminAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!['admin', 'super_admin'].includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}
