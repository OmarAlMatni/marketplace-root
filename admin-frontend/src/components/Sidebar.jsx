import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { LayoutDashboard, Package, Users, ShieldAlert, UserCog } from 'lucide-react';
const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium ${
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Sidebar() {
  const { user, logout } = useAdminAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <aside className="flex min-h-screen w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-gray-200 px-4 py-5 dark:border-slate-800">
        <p className="text-lg font-bold text-brand-600">Admin Portal</p>
        <p className="mt-1 truncate text-xs text-gray-400 dark:text-slate-500">{user?.email}</p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 mt-2 capitalize">
          {user?.role?.replace('_', ' ')}
        </span>
      </div>

     <nav className="flex-1 p-3 space-y-1">
  <NavLink to="/" end className={linkClass}>
    <LayoutDashboard size={20} />
    <span>Dashboard</span>
  </NavLink>
  
  <NavLink to="/moderation" className={linkClass}>
    <Package size={20} />
    <span>Listing Moderation</span>
  </NavLink>
  
  <NavLink to="/users" className={linkClass}>
    <Users size={20} />
    <span>Users</span>
  </NavLink>
  
  <NavLink to="/reports" className={linkClass}>
    <ShieldAlert size={20} />
    <span>Reports</span>
  </NavLink>
  
  {isSuperAdmin && (
    <NavLink to="/accounts" className={linkClass}>
      <UserCog size={20} />
      <span>Admin Accounts</span>
    </NavLink>
  )}
</nav>

      <div className="border-t border-gray-200 p-3 dark:border-slate-800">
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full rounded-lg px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
