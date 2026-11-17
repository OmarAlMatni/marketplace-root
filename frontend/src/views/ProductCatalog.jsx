import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import { useTranslation } from '../utils/i18n';
import { X, SlidersHorizontal, Search, Filter } from 'lucide-react';

const CATEGORIES = ['All Categories', 'Electronics', 'Home', 'Fashion', 'Books', 'Sports', 'Other'];

export default function ProductCatalog() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Local state for form inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at:DESC');

  // Get current filters from URL
  const urlParams = new URLSearchParams(location.search);
  const hasActiveFilters = urlParams.toString() !== '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {
      category: urlParams.get('category') || undefined,
      minPrice: urlParams.get('minPrice') || undefined,
      maxPrice: urlParams.get('maxPrice') || undefined,
      search: urlParams.get('search') || undefined,
      sortBy: urlParams.get('sortBy') || 'created_at',
      sortDir: urlParams.get('sortDir') || 'DESC',
      page: urlParams.get('page') || '1',
    };

    // Sync local state with URL
    setSearchQuery(urlParams.get('search') || '');
    setSelectedCategory(urlParams.get('category') || '');
    setMinPrice(urlParams.get('minPrice') ? (urlParams.get('minPrice') / 100).toString() : '');
    setMaxPrice(urlParams.get('maxPrice') ? (urlParams.get('maxPrice') / 100).toString() : '');
    setSortBy(`${params.sortBy}:${params.sortDir}`);

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
  }, [location.search]);

  const totalPages = Math.max(1, Math.ceil(data.total / 24));

  function applyFilters() {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    if (minPrice) params.set('minPrice', (parseFloat(minPrice) * 100).toString());
    if (maxPrice) params.set('maxPrice', (parseFloat(maxPrice) * 100).toString());
    
    const [sortByField, sortDir] = sortBy.split(':');
    params.set('sortBy', sortByField);
    params.set('sortDir', sortDir);
    params.set('page', '1'); // Reset to first page when applying filters

    navigate(`?${params.toString()}`, { replace: true });
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('created_at:DESC');
    navigate(location.pathname, { replace: true });
  }

  function handlePageChange(page) {
    const params = new URLSearchParams(location.search);
    params.set('page', page.toString());
    navigate(`?${params.toString()}`, { replace: true });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 dark:bg-black">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('marketplace')}
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          {data.total > 0 ? `${data.total} products found` : 'Browse our collection'}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Min Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Max Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Sort and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-slate-800">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="created_at:DESC">Newest First</option>
              <option value="created_at:ASC">Oldest First</option>
              <option value="price:ASC">Price: Low to High</option>
              <option value="price:DESC">Price: High to Low</option>
              <option value="title:ASC">Title: A-Z</option>
              <option value="title:DESC">Title: Z-A</option>
            </select>
          </div>

          <div className="flex gap-3 sm:items-end">
            <button
              onClick={applyFilters}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Apply Filters
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-colors border border-red-200 dark:border-red-800"
              >
                <X className="w-5 h-5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <ProductGridSkeleton />
      ) : data.items.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No products found
          </h3>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            Try adjusting your filters or search query
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[40px] h-10 px-3 rounded-xl font-medium transition-all ${
                    page === parseInt(urlParams.get('page') || '1')
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}