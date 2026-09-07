import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { resolveImage } from '../utils/media';
import { 
  CheckCircle, XCircle, Clock, Image as ImageIcon, 
  Loader2, X, AlertTriangle, MessageSquare, 
  Package, Search, Eye
} from 'lucide-react';

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

export default function ModerationView() {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state for rejection
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, feedback: '' });

  function load() {
    setLoading(true);
    setError('');
    axiosClient
      .get('/api/admin/products', { params: { status: tab, pageSize: 100 } })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setError('Failed to load listings. Please try again.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tab]);

  async function handleApprove(id) {
    setError('');
    try {
      await axiosClient.patch(`/api/admin/products/${id}/approve`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not approve listing.');
    }
  }

  function openRejectModal(id) {
    setRejectModal({ open: true, id, feedback: '' });
  }

  function closeRejectModal() {
    setRejectModal({ open: false, id: null, feedback: '' });
  }

  async function confirmReject() {
    const feedback = rejectModal.feedback.trim();
    if (!feedback) return; // Basic validation inside modal
    
    setError('');
    try {
      await axiosClient.patch(`/api/admin/products/${rejectModal.id}/reject`, { feedback });
      closeRejectModal();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reject listing.');
    }
  }

  const activeTabConfig = TABS.find(t => t.id === tab);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Moderation</h1>
        <p className="text-gray-600">
          Review new submissions, approve valid listings, or reject with feedback for sellers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? t.color : ''}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Action Failed</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="flex gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${activeTabConfig.bg}`}>
            <activeTabConfig.icon className={`w-8 h-8 ${activeTabConfig.color}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No {tab} listings</h3>
          <p className="text-gray-500">
            {tab === 'pending' ? 'All caught up! No new listings to review.' : `There are no ${tab} listings right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div 
              key={p.id} 
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-28 h-48 md:h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  {p.image_url ? (
                    <img 
                      src={resolveImage(p.image_url)} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{p.title}</h3>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${activeTabConfig.bg} ${activeTabConfig.color} border ${activeTabConfig.border}`}>
                      <activeTabConfig.icon className="w-3 h-3" />
                      {p.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                    <span className="font-semibold text-gray-900">${(p.price / 100).toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {p.stock_count} in stock</span>
                    <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" /> {p.category || 'Uncategorized'}</span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.description}</p>

                  {/* Rejection Feedback Display */}
                  {p.status === 'rejected' && p.rejection_feedback && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                      <MessageSquare className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Admin Feedback</p>
                        <p className="text-sm text-red-700">{p.rejection_feedback}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions (Pending Only) */}
                {tab === 'pending' && (
                  <div className="flex md:flex-col gap-2 md:w-32 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reject Listing</h3>
                  <p className="text-xs text-gray-500">Provide a reason for the seller</p>
                </div>
              </div>
              <button 
                onClick={closeRejectModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rejection Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                autoFocus
                rows={4}
                placeholder="e.g., The product image is blurry, or the description contains prohibited items..."
                value={rejectModal.feedback}
                onChange={(e) => setRejectModal(prev => ({ ...prev, feedback: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                This message will be visible to the seller in their dashboard.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeRejectModal}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectModal.feedback.trim()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-red-200"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}