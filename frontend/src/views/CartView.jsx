import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

export default function CartView() {
  const { items, updateQuantity, removeItem, total } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-brand-600 font-medium">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 border-b border-gray-200 pb-4">
            <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-brand-600">${(item.price / 100).toFixed(2)}</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
              className="w-16 border border-gray-300 rounded-lg px-2 py-1"
            />
            <button onClick={() => removeItem(item.productId)} className="text-red-500 text-sm">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <p className="text-lg font-semibold">Total: ${(total() / 100).toFixed(2)}</p>
        <button
          onClick={() => navigate('/checkout')}
          className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
