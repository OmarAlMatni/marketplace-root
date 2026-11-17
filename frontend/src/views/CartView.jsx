import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { Package, Trash2 } from 'lucide-react';

export default function CartView() {
  const { items, updateQuantity, removeItem, total } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">Looks like you haven't added anything yet.</p>
        <Link 
          to="/" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>
      
      <div className="space-y-4">
        {items.map((item) => {
          // Support both camelCase and snake_case
          const imageUrl = item.imageUrl || item.image_url;
          
          return (
            <div key={item.productId} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
              <div className="h-20 w-20 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={item.title} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                  ${(item.price / 100).toFixed(2)}
                </p>
                {item.stock_count !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {item.stock_count} available
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-lg">
                  <button 
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Math.max(1, Number(e.target.value)))}
                    className="w-12 text-center border-x border-gray-300 dark:border-slate-700 py-1 bg-transparent text-gray-900 dark:text-white"
                  />
                  <button 
                    onClick={() => updateQuantity(item.productId, Math.min(item.stock_count || 999, item.quantity + 1))}
                    className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-300"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={() => removeItem(item.productId)} 
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary */}
      <div className="mt-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 dark:text-slate-400">Subtotal</span>
          <span className="font-semibold text-gray-900 dark:text-white">${(total() / 100).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 dark:text-slate-400">Shipping</span>
          <span className="text-gray-500 dark:text-slate-400">Calculated at checkout</span>
        </div>
        <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ${(total() / 100).toFixed(2)}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-600/20"
        >
          Proceed to Checkout
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium py-2 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}