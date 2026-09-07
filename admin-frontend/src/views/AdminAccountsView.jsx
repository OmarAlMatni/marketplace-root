import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const emptyForm = { email: '', password: '', displayName: '' };

export default function AdminAccountsView() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function load() {
    axiosClient.get('/api/admin/admins').then(({ data }) => setAdmins(data));
  }

  useEffect(load, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosClient.post('/api/admin/admins', form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create admin account.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await axiosClient.delete(`/api/admin/admins/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete admin account.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">New admin account</h1>
        <p className="text-sm text-gray-500 mb-4">
          Admins can moderate listings and manage regular user accounts. Only a super admin can create or
          remove admin accounts.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Temporary password (min 8 characters)"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create admin account'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Current admins</h2>
        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-white">
              <div>
                <p className="font-medium">{a.display_name || a.email}</p>
                <p className="text-sm text-gray-500">{a.email}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-red-500 text-sm">
                Remove
              </button>
            </div>
          ))}
          {admins.length === 0 && <p className="text-gray-400 text-sm">No admin accounts yet.</p>}
        </div>
      </div>
    </div>
  );
}
