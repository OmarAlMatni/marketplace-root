import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const priceLabel = `$${(product.price / 100).toFixed(2)}`;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow bg-white"
    >
      <div className="h-40 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        )}
      </div>
      <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
      <div className="flex items-center justify-between mt-1">
        <span className="text-brand-600 font-semibold">{priceLabel}</span>
        <span className="text-xs text-gray-500">
          {product.stock_count > 0 ? `${product.stock_count} left` : 'Sold out'}
        </span>
      </div>
    </Link>
  );
}
