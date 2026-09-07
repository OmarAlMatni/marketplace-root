import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * URL-Synced Dynamic Deep-Filtering.
 *
 * Reads filters (category, price range, search, sort) directly from
 * URLSearchParams so the catalog state is bookmarkable and shareable,
 * and writes back to the URL whenever a filter changes.
 */
export function useURLFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortDir: searchParams.get('sortDir') || 'DESC',
      page: Number(searchParams.get('page') || 1),
    }),
    [searchParams]
  );

  const setFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value === '' || value === undefined || value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      // Any filter change resets pagination back to page 1.
      if (key !== 'page') next.set('page', '1');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  return { filters, setFilter };
}
