import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-lg text-sm font-medium ${
    isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
  }`;

export default function Sidebar() {
  const { user, logout } = useAdminAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-gray-200">
        <p className="text-lg font-bold text-brand-600">Admin Portal</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 mt-2 capitalize">
          {user?.role?.replace('_', ' ')}
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <NavLink to="/" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/moderation" className={linkClass}>
          Listing Moderation
        </NavLink>
        <NavLink to="/users" className={linkClass}>
          Users
        </NavLink>
        {isSuperAdmin && (
          <NavLink to="/accounts" className={linkClass}>
            Admin Accounts
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
