import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/api/products/${id}`)
      .then(({ data }) => setProduct(data))
      .finally(() => setLoading(false));
  }, [id]);

  async function startChat() {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data: room } = await axiosClient.post('/api/chat/rooms', { productId: id });
      navigate(`/chat?room=${room.id}`);
    } catch (err) {
      setNotice(err.response?.data?.error || 'Could not start chat.');
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10 skeleton h-96" />;
  }
  if (!product) {
    return <p className="text-center py-16 text-gray-500">Listing not found.</p>;
  }

  const isOwnListing = user?.id === product.seller_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
      <div className="h-80 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-brand-600 text-xl font-semibold mt-2">${(product.price / 100).toFixed(2)}</p>
        <p className="text-gray-500 text-sm mt-1">
          {product.stock_count > 0 ? `${product.stock_count} in stock` : 'Sold out'}
        </p>
        <p className="text-gray-700 mt-4 whitespace-pre-line">{product.description}</p>

        {notice && <p className="text-red-600 text-sm mt-3">{notice}</p>}

        <div className="flex gap-3 mt-6">
          <button
            disabled={product.stock_count === 0}
            onClick={() => addItem(product)}
            className="bg-brand-600 text-white px-5 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            Add to cart
          </button>
          {!isOwnListing && (
            <button
              onClick={startChat}
              className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50"
            >
              Message seller
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
