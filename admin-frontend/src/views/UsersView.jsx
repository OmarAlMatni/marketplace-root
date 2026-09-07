import { useEffect, useState } from 'react';
import { 
  Search, Users, ShieldCheck, ShieldBan, Trash2, 
  UserX, AlertTriangle, X
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { resolveImage } from '../utils/media';

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  function load() {
    setLoading(true);
    setError('');
    axiosClient
      .get('/api/admin/users', { params: { search: search || undefined, pageSize: 100 } })
      .then(({ data }) => setUsers(data.items || []))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleBanToggle(user) {
    setError('');
    try {
      const action = user.status === 'banned' ? 'unban' : 'ban';
      await axiosClient.patch(`/api/admin/users/${user.id}/${action}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
    }
  }

  function openDeleteModal(user) {
    setDeleteModal({ open: true, user });
  }

  function closeDeleteModal() {
    setDeleteModal({ open: false, user: null });
  }

  async function confirmDelete() {
    if (!deleteModal.user) return;
    setError('');
    try {
      await axiosClient.delete(`/api/admin/users/${deleteModal.user.id}`);
      closeDeleteModal();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete user.');
    }
  }

  // Helper to generate initials and avatar color
  const getUserInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return email.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = [
      'bg-blue-100 text-blue-900', 
      'bg-amber-100 text-amber-900', 
      'bg-purple-100 text-purple-900', 
      'bg-emerald-100 text-emerald-900', 
      'bg-pink-100 text-pink-900'
    ];
    return colors[id.charCodeAt(0) % colors.length];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View, moderate, and manage buyer and seller accounts.
        </p>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form 
          onSubmit={(e) => { e.preventDefault(); load(); }} 
          className="relative flex-1"
        >
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search by email or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </form>
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Users className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-semibold text-white">
            {loading ? '...' : `${users.length} Total Users`}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-200">Error</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <UserX className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">No users found</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="bg-slate-900 hover:bg-slate-800/50 transition-colors">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden ${getAvatarColor(u.id)}`}>
                          {u.avatar_url ? (
                            <img src={resolveImage(u.avatar_url)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getUserInitials(u.display_name, u.email)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">
                            {u.display_name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-slate-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {u.status === 'banned' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-red-500/30 bg-red-500/10 text-red-400">
                          <ShieldBan className="h-3 w-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(u.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleBanToggle(u)}
                          title={u.status === 'banned' ? 'Unban User' : 'Ban User'}
                          className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          {u.status === 'banned' ? <ShieldCheck className="h-4 w-4" /> : <ShieldBan className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openDeleteModal(u)}
                          title="Delete User"
                          className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-900/20 border border-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete User Account?</h3>
              <p className="mt-2 text-sm text-slate-400">
                Are you sure you want to permanently delete <strong className="text-white">{deleteModal.user.email}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}