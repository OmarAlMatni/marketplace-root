import { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Plus, Package, Image as ImageIcon, DollarSign, 
  Tag, Hash, Trash2, Edit, AlertCircle, AlertTriangle,
  CheckCircle, Clock, XCircle, Upload, X 
} from 'lucide-react';

const emptyForm = { title: '', description: '', category: '', price: '', stockCount: 1 };

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', icon: Clock, bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: 'Active', icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Rejected', icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

export default function SellerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for the custom delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: listings.length,
      pending: listings.filter(l => l.status === 'pending').length,
      active: listings.filter(l => l.status === 'approved').length,
    };
  }, [listings]);

  function loadListings() {
    if (!user) return;
    axiosClient.get('/api/products', { params: { sellerId: user.id, pageSize: 100 } })
      .then(({ data }) => setListings(data.items || []))
      .catch(() => setListings([]));
  }

  useEffect(loadListings, [user]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setImageFile(file);
      setError('');
    }
  }

  function removeImage() {
    setImageFile(null);
    // Reset the file input value so the same file can be selected again if needed
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('category', form.category);
      body.append('price', String(Math.round(Number(form.price) * 100)));
      body.append('stockCount', String(Number(form.stockCount)));
      if (imageFile) body.append('image', imageFile);

      await axiosClient.post('/api/products', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setForm(emptyForm);
      setImageFile(null);
      const fileInput = document.getElementById('image-upload');
      if (fileInput) fileInput.value = '';
      loadListings();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Modal control functions
  function openDeleteModal(id) {
    setDeleteModal({ open: true, id });
  }

  function closeDeleteModal() {
    setDeleteModal({ open: false, id: null });
  }

  async function confirmDelete() {
    if (!deleteModal.id) return;
    setError('');
    try {
      await axiosClient.delete(`/api/products/${deleteModal.id}`);
      closeDeleteModal();
      loadListings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete listing.');
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to manage your listings</h2>
        <p className="text-gray-500">You need an account to start selling on the marketplace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Stats */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
        <p className="text-gray-600">Manage your inventory and track your sales.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <StatCard label="Total Listings" value={stats.total} icon={Package} color="indigo" />
          <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="amber" />
          <StatCard label="Active Listings" value={stats.active} icon={CheckCircle} color="emerald" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Create Listing Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Listing</h2>
                <p className="text-sm text-gray-500">Items are reviewed by admin before going live.</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Image Upload Zone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Photo</label>
                {!imageFile ? (
                  <label 
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                    <input 
                      id="image-upload"
                      type="file" 
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden" 
                    />
                  </label>
                ) : (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img 
                      src={URL.createObjectURL(imageFile)} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Listing Title</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    required
                    placeholder="e.g., Vintage Leather Jacket"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  placeholder="Describe the condition, features, and reason for selling..."
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Grid for Category, Price, Stock */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      required
                      placeholder="e.g., Electronics"
                      value={form.category}
                      onChange={(e) => update('category', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Qty</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min={0}
                      value={form.stockCount}
                      onChange={(e) => update('stockCount', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !imageFile}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit for Review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Your Listings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Your Listings</h2>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                {listings.length} Total
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {listings.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No listings yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first item!</p>
                </div>
              ) : (
                listings.map((p) => {
                  const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div key={p.id} className="group p-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-200 rounded-xl transition-all">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-900 text-sm truncate pr-2">{p.title}</h3>
                            <button 
                              onClick={() => openDeleteModal(p.id)}
                              className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ${(p.price / 100).toFixed(2)} · {p.stock_count} in stock
                          </p>
                          <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${status.bg} ${status.text} border ${status.border}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </div>
                        </div>
                      </div>
                      
                      {p.status === 'rejected' && p.rejection_feedback && (
                        <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs text-red-700 font-medium mb-1">Admin Feedback:</p>
                          <p className="text-xs text-red-600">{p.rejection_feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 pb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Listing?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to permanently delete this listing? This action cannot be undone.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-red-200"
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

// Helper Component for Stats
function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}