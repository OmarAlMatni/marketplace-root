import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Package, Heart, Trash2 } from 'lucide-react';

export default function SavedItemsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedItems();
  }, []);

  async function loadSavedItems() {
    try {
      setLoading(true);
      setError('');
      const { data } = await axiosClient.get('/api/saved-items');
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load saved items:', err);
      setError(err.response?.data?.error || 'Failed to load saved items');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(productId) {
    try {
      await axiosClient.post('/api/saved-items/toggle', { productId });
      setItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Failed to remove item');
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Error Loading Saved Items</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">{error}</p>
          <button 
            onClick={loadSavedItems}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <Heart className="w-6 h-6 text-red-600 dark:text-red-400 fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Items</h1>
          <p className="text-gray-500 dark:text-slate-400">Products you've saved for later.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
          <Package className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No saved items yet</h3>
          <p className="text-gray-500 dark:text-slate-400 mt-1 mb-6">Start exploring and save products you love!</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all relative"
            >
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-10"
                title="Remove from saved"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div 
                onClick={() => navigate(`/products/${item.id}`)}
                className="aspect-square bg-gray-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 
                  onClick={() => navigate(`/products/${item.id}`)}
                  className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {item.title}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                    ${(item.price / 100).toFixed(2)}
                  </p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    item.stock_count > 0 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {item.stock_count > 0 ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}