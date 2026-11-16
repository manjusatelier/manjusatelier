import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { prioritizeTestProducts } from '@/utils/testProduct';
import type { Product } from '@/types';

export function FeaturedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ products: Product[] }>('/products/featured')
      .then(({ products }) => setProducts(products))
      .catch(() => void 0)
      .finally(() => setLoading(false));
  }, []);

  const displayedProducts = useMemo(() => {
    return prioritizeTestProducts(products, user);
  }, [products, user]);

  return (
    <section className="section bg-beige/30 dark:bg-[#231d17]">
      <div className="container-x">
        <SectionHeading
          eyebrow="Handpicked"
          title="Featured Products"
          subtitle="Our most-loved handmade pieces, chosen for their craftsmanship and character."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : displayedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
        </div>

        <Reveal className="mt-12 text-center">
          <Link to="/shop">
            <Button variant="secondary" size="lg">
              View All Products <ArrowRight size={18} />
            </Button>
          </Link>
        </Reveal>
      </div>

    </section>
  );
}
