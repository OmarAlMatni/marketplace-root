import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import { useURLFilters } from '../hooks/useURLFilters';
import { useTranslation } from '../utils/i18n';

const CATEGORIES = ['', 'Electronics', 'Home', 'Fashion', 'Books', 'Sports', 'Other'];

export default function ProductCatalog() {
  const { filters, setFilter } = useURLFilters();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {
      category: filters.category || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: filters.page,
    };

    axiosClient
      .get('/api/products', { params })
      .then(({ data }) => {
        if (!cancelled) setData(data);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], total: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.category, filters.minPrice, filters.maxPrice, filters.search, filters.sortBy, filters.sortDir, filters.page]);

  const totalPages = Math.max(1, Math.ceil(data.total / 24));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 dark:bg-black">
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <input
          placeholder={t('searchListings')}
          defaultValue={filters.search}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[200px]"
        />

        <select
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c || t('allCategories')}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min $"
          defaultValue={filters.minPrice ? filters.minPrice / 100 : ''}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('minPrice', Number(e.target.value) * 100)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-24"
        />
        <input
          type="number"
          placeholder="Max $"
          defaultValue={filters.maxPrice ? filters.maxPrice / 100 : ''}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('maxPrice', Number(e.target.value) * 100)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-24"
        />

        <select
          value={`${filters.sortBy}:${filters.sortDir}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split(':');
            setFilter('sortBy', sortBy);
            setFilter('sortDir', sortDir);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="created_at:DESC">{t('newest')}</option>
          <option value="price:ASC">Price: Low to High</option>
          <option value="price:DESC">Price: High to Low</option>
          <option value="title:ASC">Title: A–Z</option>
        </select>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : data.items.length === 0 ? (
        <p className="text-gray-500 py-16 text-center">{t('noListings')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setFilter('page', String(i + 1))}
              className={`px-3 py-1 rounded-lg border ${
                filters.page === i + 1 ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
