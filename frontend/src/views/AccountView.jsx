import { useEffect, useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import axiosClient, { API_BASE_URL } from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';

export default function AccountView() {
  const login = useAuthStore((state) => state.login);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get('/api/auth/me').then(({ data }) => {
      setUser(data.user);
      setDisplayName(data.user.display_name || '');
    });
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await axiosClient.patch('/api/auth/me', { displayName });
      let nextUser = data.user;
      if (avatar) {
        const body = new FormData();
        body.append('avatar', avatar);
        const response = await axiosClient.post('/api/auth/me/avatar', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        nextUser = response.data.user;
        setAvatar(null);
      }
      setUser(nextUser);
      login(nextUser, useAuthStore.getState().token);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update profile.');
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      const { data } = await axiosClient.patch('/api/auth/me/password', passwords);
      login(data.user, data.token);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update password.');
    }
  }

  const avatarUrl = user?.avatar_url?.startsWith('/') ? `${API_BASE_URL}${user.avatar_url}` : user?.avatar_url;
  const initials = (user?.display_name || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4"><span className="rounded-2xl bg-indigo-100 p-3 text-indigo-700"><UserRound size={25} /></span><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Profile</p><h1 className="text-3xl font-extrabold text-slate-950">My Account</h1></div></div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {user && <form onSubmit={saveProfile} className="max-w-lg space-y-5"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white">{avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : initials}</div><label className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-800">Change profile picture<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setAvatar(e.target.files?.[0] || null)} className="hidden" /></label></div><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><input value={user.email} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Display name</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label><button className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Save profile</button></form>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><KeyRound className="text-indigo-600" size={21} /><h2 className="text-xl font-bold text-slate-900">Change password</h2></div><form onSubmit={changePassword} className="max-w-lg space-y-4"><PasswordInput label="Current password" value={passwords.currentPassword} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} /><PasswordInput label="New password" value={passwords.newPassword} onChange={(value) => setPasswords({ ...passwords, newPassword: value })} /><PasswordInput label="Confirm new password" value={passwords.confirmPassword} onChange={(value) => setPasswords({ ...passwords, confirmPassword: value })} /><button className="rounded-xl border border-indigo-200 px-5 py-3 font-bold text-indigo-700 hover:bg-indigo-50">Update password</button></form></section>
    </main>
  );
}

function PasswordInput({ label, value, onChange }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><input type="password" required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>; }
