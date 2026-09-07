import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Route guard: redirects to /login if signed out, or to / if signed in
 * but lacking one of the allowed roles. Wrap any admin-only view with it:
 *
 *   <RequireRole roles={['admin', 'super_admin']}><AdminUsers /></RequireRole>
 */
export default function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
