import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

export default function CheckoutView() {
  const { items, total, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  async function handlePlaceOrder() {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const cartItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      const { data } = await axiosClient.post('/api/orders/checkout', { cartItems });
      // In a full build, data.clientSecret would be passed to Stripe.js /
      // Stripe Elements here to collect payment. That confirmation event
      // is what fires the payment_intent.succeeded webhook that marks the
      // order 'paid' server-side.
      setSuccess(data.order);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-2">Order placed!</h1>
        <p className="text-gray-500">
          Order <span className="font-mono">{success.id}</span> is pending payment confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="border border-gray-200 rounded-xl p-4 mb-6">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm py-1">
            <span>
              {i.title} × {i.quantity}
            </span>
            <span>${((i.price * i.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold mt-3 pt-3 border-t border-gray-200">
          <span>Total</span>
          <span>${(total() / 100).toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={handlePlaceOrder}
        disabled={loading || items.length === 0}
        className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'Placing order…' : 'Place order'}
      </button>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Stock is locked row-by-row at checkout time, so this stays safe even during a flash sale rush.
      </p>
    </div>
  );
}
