import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Bell, BriefcaseBusiness, CreditCard, Database, Palette, ShieldCheck,
  Building2, Calendar, FileText, Upload, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axiosClient from '../api/axiosClient';
import { useTranslation } from '../utils/i18n';

const defaults = {
  emailNotifications: true,
  chatNotifications: true,
  payoutMethod: '',
  payoutSchedule: 'manual',
  taxId: '',
  twoFactorEnabled: false,
  vacationMode: false,
  autoReply: '',
  shippingCarrier: '',
  handlingDays: 2,
  theme: 'system',
  language: 'en',
  currency: 'USD',
};

const sections = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payouts', label: 'Payouts', icon: CreditCard },
  { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck },
  { id: 'seller', label: 'Seller Settings', icon: BriefcaseBusiness, sellerOnly: true },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Privacy', icon: Database },
];

export default function SettingsView() {
  const { section } = useParams();
  const navigate = useNavigate();
  const { logout, updateUser } = useAuthStore();
  const t = useTranslation();
  
  const [preferences, setPreferences] = useState(defaults);
  const [isSeller, setIsSeller] = useState(false);
  const [taxDocument, setTaxDocument] = useState(null);
  
  // Updated state for the delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentId = section || 'notifications';
  const visibleSections = sections.filter((item) => !item.sellerOnly || isSeller);
  const current = visibleSections.find((item) => item.id === currentId) || visibleSections[0];

  useEffect(() => {
    const userId = useAuthStore.getState().user?.id;
    Promise.all([
      axiosClient.get('/api/auth/me'),
      axiosClient.get('/api/products', { params: { sellerId: userId, pageSize: 1 } }),
    ]).then(([account, listings]) => {
      setPreferences({ ...defaults, ...(account.data.user.preferences || {}) });
      setIsSeller(listings.data.total > 0);
    });
  }, []);

  useEffect(() => {
    const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.lang = preferences.language;
  }, [preferences.theme, preferences.language]);

  function update(key, value) {
    setPreferences((currentPreferences) => ({ ...currentPreferences, [key]: value }));
  }

  async function savePreferences() {
    setError('');
    setMessage('');
    try {
      const { data } = await axiosClient.patch('/api/auth/me', { preferences });
      updateUser(data.user);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save settings.');
    }
  }

  async function uploadTaxDocument() {
    if (!taxDocument) return;
    const body = new FormData();
    body.append('document', taxDocument);
    await axiosClient.post('/api/auth/me/tax-document', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    setTaxDocument(null);
    setMessage('Tax document uploaded.');
  }

  async function exportData() {
    const response = await axiosClient.get('/api/auth/me/export', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketplace-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (deleteConfirmationText !== 'Delete my account') {
      setError('Please type the exact phrase to confirm deletion.');
      return;
    }
    try {
      await axiosClient.post('/api/auth/me/delete', { confirmation: deleteConfirmationText });
      logout();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete account.');
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">{t('preferences')}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">{t('settingsTitle')}</h1>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {visibleSections.map((item) => {
            const Icon = item.icon;
            const active = item.id === current.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setMessage(''); setError(''); navigate(`/settings/${item.id}`); }} 
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  active 
                    ? 'border-transparent bg-gradient-to-r from-indigo-700 to-purple-600 text-white shadow-md shadow-indigo-200/30' 
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-transparent dark:text-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.id === 'notifications' ? t('notifications') : item.id === 'privacy' ? t('privacy') : item.id === 'appearance' ? t('appearance') : item.id === 'data' ? t('dataAccount') : item.label}
              </button>
            );
          })}
        </aside>
        
        <section className="min-w-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Settings</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                {current.id === 'notifications' ? t('notifications') : current.id === 'privacy' ? t('privacy') : current.id === 'appearance' ? t('appearance') : current.id === 'data' ? t('dataAccount') : current.label}
              </h2>
            </div>
            <button onClick={savePreferences} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              Save changes
            </button>
          </div>
          
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
          {message && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{message}</p>}
          
          {current.id === 'notifications' && <NotificationsPanel preferences={preferences} update={update} />}
          {current.id === 'payouts' && <PayoutsPanel preferences={preferences} update={update} taxDocument={taxDocument} setTaxDocument={setTaxDocument} uploadTaxDocument={uploadTaxDocument} />}
          {current.id === 'privacy' && <PrivacyPanel preferences={preferences} update={update} />}
          {current.id === 'seller' && <SellerPanel preferences={preferences} update={update} />}
          {current.id === 'appearance' && <AppearancePanel preferences={preferences} update={update} />}
          {current.id === 'data' && <DataPanel exportData={exportData} onOpenDeleteModal={() => setIsDeleteModalOpen(true)} />}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 pb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Are you absolutely sure?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                This action cannot be undone. To confirm, please type <span className="font-bold text-red-600 dark:text-red-400">Delete my account</span> below.
              </p>
            </div>

            {/* Modal Input */}
            <div className="px-6 pb-6">
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Delete my account"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/50 outline-none transition-all"
              />
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmationText(''); }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmationText !== 'Delete my account'}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-red-200 dark:shadow-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Panel({ title, description, children }) { 
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  ); 
}

function NotificationsPanel({ preferences, update }) { 
  return (
    <Panel title="Choose what reaches you">
      <Setting label="Email notifications" description="Receive updates about orders and your account." enabled={preferences.emailNotifications} onToggle={() => update('emailNotifications', !preferences.emailNotifications)} />
      <Setting label="Chat notifications" description="Get notified when someone replies to a conversation." enabled={preferences.chatNotifications} onToggle={() => update('chatNotifications', !preferences.chatNotifications)} />
    </Panel>
  ); 
}

function PayoutsPanel({ preferences, update, taxDocument, setTaxDocument, uploadTaxDocument }) {
  return (
    <div className="space-y-6">
      <Panel title="Payout Preferences" description="Configure how and when you receive your earnings.">
        <div className="space-y-8">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">Payout Method</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <PayoutOption 
                value="bank" 
                current={preferences.payoutMethod} 
                onSelect={() => update('payoutMethod', 'bank')}
                icon={<Building2 className="h-5 w-5" />}
                title="Bank Account"
                desc="Direct deposit to your local bank"
              />
              <PayoutOption 
                value="stripe" 
                current={preferences.payoutMethod} 
                onSelect={() => update('payoutMethod', 'stripe')}
                icon={<CreditCard className="h-5 w-5" />}
                title="Stripe Connect"
                desc="Fast payouts via Stripe"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">Payout Schedule</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <select 
                value={preferences.payoutSchedule} 
                onChange={(e) => update('payoutSchedule', e.target.value)} 
                className="w-full appearance-none rounded-xl border border-slate-300 bg-transparent py-3 pl-12 pr-4 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-white dark:focus:ring-indigo-900"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {preferences.payoutSchedule === 'daily' && 'Funds are transferred automatically every 24 hours.'}
              {preferences.payoutSchedule === 'weekly' && 'Funds are transferred automatically every Monday.'}
              {preferences.payoutSchedule === 'manual' && 'You must manually request a payout from your dashboard.'}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Tax & Compliance" description="Provide your tax information to comply with financial regulations.">
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Tax ID / EIN</label>
            <div className="relative">
              <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input 
                value={preferences.taxId} 
                onChange={(e) => update('taxId', e.target.value)} 
                placeholder="XX-XXXXXXX (Optional)" 
                className="w-full rounded-xl border border-slate-300 bg-transparent py-3 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:ring-indigo-900" 
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">W-9 or Tax Document</p>
            {!taxDocument ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20">
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload document</p>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                <input 
                  type="file" 
                  accept="application/pdf,image/jpeg,image/png" 
                  onChange={(e) => setTaxDocument(e.target.files?.[0] || null)} 
                  className="hidden" 
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-900/20 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{taxDocument.name}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">{(taxDocument.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTaxDocument(null)} 
                    className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                  <button 
                    onClick={uploadTaxDocument} 
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function PayoutOption({ value, current, onSelect, icon, title, desc }) {
  const isActive = current === value;
  return (
    <button
      onClick={onSelect}
      className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
        isActive 
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 dark:bg-indigo-900/20 dark:ring-indigo-800' 
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className={`flex-shrink-0 rounded-lg p-2 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>{title}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      {isActive && <CheckCircle className="ml-auto h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
    </button>
  );
}

function PrivacyPanel({ preferences, update }) { 
  return (
    <Panel title="Protect your account">
      <Setting label="Two-factor authentication" description="Frontend preference only for now. Setup will be added later." enabled={preferences.twoFactorEnabled} onToggle={() => update('twoFactorEnabled', !preferences.twoFactorEnabled)} />
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 py-5 dark:border-slate-800">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">Active sessions</p>
          <p className="text-sm text-slate-500">Chrome on Windows · Active now</p>
        </div>
        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Sign out all other devices
        </button>
      </div>
    </Panel>
  ); 
}

function SellerPanel({ preferences, update }) { 
  return (
    <Panel title="Seller tools">
      <Setting label="Vacation mode" description="Hide your listings from the public catalog temporarily." enabled={preferences.vacationMode} onToggle={() => update('vacationMode', !preferences.vacationMode)} />
      <label className="block border-t border-slate-100 py-5 dark:border-slate-800">
        <span className="mb-2 block font-bold text-slate-900 dark:text-white">Auto-reply</span>
        <textarea 
          value={preferences.autoReply} 
          onChange={(e) => update('autoReply', e.target.value)} 
          placeholder="I'm away for the weekend..." 
          rows={4} 
          className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700 dark:text-white" 
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Default shipping carrier</span>
          <input 
            value={preferences.shippingCarrier} 
            onChange={(e) => update('shippingCarrier', e.target.value)} 
            placeholder="UPS, DHL, FedEx..." 
            className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700 dark:text-white" 
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Handling time (days)</span>
          <input 
            type="number" 
            min="0" 
            value={preferences.handlingDays} 
            onChange={(e) => update('handlingDays', Number(e.target.value))} 
            className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700 dark:text-white" 
          />
        </label>
      </div>
    </Panel>
  ); 
}

function AppearancePanel({ preferences, update }) { 
  return (
    <Panel title="Make Marketplace yours">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Theme" value={preferences.theme} onChange={(value) => update('theme', value)} options={['light', 'dark', 'system'].map((value) => [value, value[0].toUpperCase() + value.slice(1)])} />
        <Select label="Language" value={preferences.language} onChange={(value) => update('language', value)} options={[['en', 'English'], ['fr', 'French'], ['es', 'Spanish']]} />
        <Select label="Currency" value={preferences.currency} onChange={(value) => update('currency', value)} options={['USD', 'EUR', 'GBP', 'CAD'].map((value) => [value, value])} />
      </div>
    </Panel>
  ); 
}

function DataPanel({ exportData, onOpenDeleteModal }) { 
  return (
    <Panel title="Your data and account" description="Download a copy of your Marketplace data or permanently remove your account.">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Export my data</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Get a JSON copy of your activity.</p>
          </div>
          <button 
            onClick={exportData} 
            className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Export
          </button>
        </div>

        <div className="border-t border-red-100 dark:border-red-900/30 pt-6">
          <p className="font-bold text-red-600 dark:text-red-400 mb-1">Danger Zone</p>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={onOpenDeleteModal}
            className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 transition-colors shadow-sm shadow-red-200 dark:shadow-none"
          >
            Delete my account
          </button>
        </div>
      </div>
    </Panel>
  ); 
}

function Select({ label, value, onChange, options }) { 
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700 dark:text-white"
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>{text}</option>
        ))}
      </select>
    </label>
  ); 
}

function Setting({ label, description, enabled, onToggle }) { 
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button 
        onClick={onToggle} 
        aria-pressed={enabled} 
        className={`relative h-7 w-12 rounded-full transition ${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  ); 
}