import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => {
        if (active) setCategories(res.categories);
      })
      .catch(() => void 0)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
