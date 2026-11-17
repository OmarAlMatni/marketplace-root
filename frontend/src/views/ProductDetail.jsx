import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ShoppingCart, MessageCircle, Share2, Heart, 
  ChevronLeft, ChevronRight, Package, User, 
  MapPin, Calendar, Tag, Shield, Truck,
  ZoomIn, X
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadProduct();
  }, [id]);

  // Check if the product is already saved when user and product are loaded
  useEffect(() => {
    if (user && product) {
      axiosClient.get('/api/saved-items').then(({ data }) => {
        const isCurrentlySaved = data.items.some(item => item.id === product.id);
        setIsSaved(isCurrentlySaved);
      }).catch(err => console.error('Failed to check saved status', err));
    }
  }, [user, product]);

  async function loadProduct() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get(`/api/products/${id}`);
      setProduct(data);
      
      // Load related products (same category)
      if (data.category) {
        const { data: related } = await axiosClient.get('/api/products', {
          params: {
            category: data.category,
            pageSize: 4,
            excludeId: data.id
          }
        });
        setRelatedProducts(related.items || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load product.');
    } finally {
      setLoading(false);
    }
  }

  async function startChat() {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data: room } = await axiosClient.post('/api/chat/rooms', { productId: id });
      navigate(`/chat?room=${room.id}`);
    } catch (err) {
      console.error('Chat error:', err);
    }
  }

  async function handleToggleSave() {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setSaving(true);
    try {
      const { data } = await axiosClient.post('/api/saved-items/toggle', { productId: id });
      setIsSaved(data.isSaved);
    } catch (err) {
      console.error('Failed to toggle saved item', err);
    } finally {
      setSaving(false);
    }
  }

  function handleAddToCart() {
    if (!product || product.stock_count === 0) return;
    addItem({ ...product, quantity });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[500px] bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">{error || 'This listing may have been removed.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const isOwnListing = user?.id === product.seller_id;
  const inStock = product.stock_count > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <button onClick={() => navigate(-1)} className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {product.category && (
          <>
            <span>/</span>
            <span className="capitalize">{product.category}</span>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden group">
            {product.image_url ? (
              <>
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setShowImageModal(true)}
                />
                <button 
                  onClick={() => setShowImageModal(true)}
                  className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <ZoomIn className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-24 h-24" />
              </div>
            )}
            
            {/* Stock Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
              inStock ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {inStock ? 'In Stock' : 'Sold Out'}
            </div>
          </div>

          {/* Thumbnails (if multiple images in future) */}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {[product.image_url, ...product.images].map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === idx ? 'border-indigo-600' : 'border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.title}</h1>
              <div className="flex gap-2">
                {/* FIXED: Heart Button now uses handleToggleSave and isSaved state */}
                <button 
                  onClick={handleToggleSave}
                  disabled={saving}
                  className={`p-2 rounded-full transition-colors ${
                    isSaved ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {saving ? (
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                  )}
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Listed {new Date(product.created_at).toLocaleDateString()}
              </span>
              {product.views && (
                <span>• {product.views} views</span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              ${(product.price / 100).toFixed(2)}
            </p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-xl text-gray-400 line-through">
                ${(product.original_price / 100).toFixed(2)}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Condition</p>
                <p className="font-semibold text-gray-900 dark:text-white">New</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Category</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{product.category || 'Uncategorized'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Buyer Protection</p>
                <p className="font-semibold text-gray-900 dark:text-white">Full refund if not as described</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Shipping</p>
                <p className="font-semibold text-gray-900 dark:text-white">Calculated at checkout</p>
              </div>
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          {!isOwnListing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Quantity:</label>
                <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min={1} 
                    max={product.stock_count}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(product.stock_count, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center border-x border-gray-300 dark:border-slate-700 py-2 bg-transparent"
                  />
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock_count, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {product.stock_count} available
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:shadow-none"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {inStock ? 'Add to Cart' : 'Sold Out'}
                </button>
                <button
                  onClick={startChat}
                  className="px-6 py-3.5 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message Seller
                </button>
              </div>
            </div>
          )}

          {/* Seller Info */}
          {product.seller && (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                  {product.seller.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{product.seller.display_name || 'Seller'}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3" />
                    Member since {new Date(product.seller.created_at).getFullYear()}
                  </div>
                </div>
                {!isOwnListing && (
                  <button 
                    onClick={startChat}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Contact
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => navigate(`/products/${p.id}`)}
                className="group cursor-pointer bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="aspect-square bg-gray-100 dark:bg-slate-800 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.title}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                    ${(p.price / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button 
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={product.image_url} 
            alt={product.title} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}