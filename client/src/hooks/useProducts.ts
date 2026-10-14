import { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import type { Paginated, Product } from '@/types';

export interface ProductQuery {
  search?: string;
  category?: string;
  material?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  ids?: string;
}

function toQueryString(q: ProductQuery): string {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== false) params.set(k, String(v));
  });
  return params.toString();
}

export function useProducts(query: ProductQuery) {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = query.page || 1;
  const key = toQueryString(query);

  // Track non-pagination filters to reset data when filters change
  const baseKey = useMemo(() => {
    const base = { ...query };
    delete base.page;
    return toQueryString(base);
  }, [
    query.search,
    query.category,
    query.material,
    query.color,
    query.minPrice,
    query.maxPrice,
    query.inStock,
    query.sort,
    query.limit,
    query.featured,
    query.ids,
  ]);

  const prevBaseKeyRef = useRef(baseKey);

  useEffect(() => {
    let active = true;
    const isFilterChange = prevBaseKeyRef.current !== baseKey;
    prevBaseKeyRef.current = baseKey;

    if (page === 1 || isFilterChange) {
      setLoading(true);
      setData(null);
    } else {
      setLoadingMore(true);
    }

    setError(null);
    api
      .get<Paginated<Product> & { success: boolean }>(`/products?${key}`)
      .then((res) => {
        if (active) {
          setData((prev) => {
            // If it's page 1, a filter change, or we don't have previous data, replace it
            if (page === 1 || isFilterChange || !prev) return res;
            // Otherwise, append unique new products
            const existingIds = new Set(prev.products.map((p) => p._id));
            const newProducts = res.products.filter((p) => !existingIds.has(p._id));
            return {
              ...res,
              products: [...prev.products, ...newProducts],
            };
          });
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => {
      active = false;
    };
  }, [key, page, baseKey]);

  return { data, loading, loadingMore, error };
}
