import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';

export function ProductFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { categories, loading: catLoading } = useCategories();
  const query = useMemo(() => ({
    category: selectedCategory || undefined,
    limit: 24,
  }), [selectedCategory]);

  const { data, loading: prodLoading } = useProducts(query);

  return (
    <section className="py-10 md:py-16 bg-beige/30 dark:bg-[#231d17]">
      <div className="container-x">
        <header className="mb-6 text-center">
          <h2 className="font-serif text-3xl text-brown-dark dark:text-beige">Our Collection</h2>
          <p className="mt-2 text-sm text-brown/60 dark:text-beige/60">
            Explore all our handmade pieces or select a category below.
          </p>
        </header>

        {/* Category Pills */}
        <div className="mb-6 flex overflow-x-auto gap-3 pb-2 px-4 -mx-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Button
            variant={selectedCategory === null ? 'primary' : 'secondary'}
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => setSelectedCategory(null)}
          >
            All Items
          </Button>
          {!catLoading && categories.filter(c => c.productCount && c.productCount > 0).map((cat) => (
            <Button
              key={cat._id}
              variant={selectedCategory === cat.slug ? 'primary' : 'secondary'}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {prodLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.products.map((p: Product) => (
                <ProductCard key={p._id} product={p} />
              ))}
        </div>

        {!prodLoading && data?.products.length === 0 && (
          <div className="py-20 text-center text-brown/60 dark:text-beige/60">
            No products found in this category.
          </div>
        )}

      </div>
    </section>
  );
}
