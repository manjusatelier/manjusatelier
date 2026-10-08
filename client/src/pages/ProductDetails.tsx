import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Product, Review } from '@/types';
import { cn, formatPrice, finalPrice, categoryName, formatDate } from '@/lib/utils';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { optimizeCloudinaryUrl } from '@/lib/image';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { ProductCard } from '@/components/product/ProductCard';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { Skeleton } from '@/components/ui/Skeleton';
import { trackEvent } from '@/lib/analytics';

const tabs = ['Description', 'Details', 'Care', 'Reviews'] as const;
type Tab = (typeof tabs)[number];

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>('Description');

  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const { notify } = useToast();

  // Touch handlers removed in favor of native scroll snap

  usePageMeta({
    title: product ? `${product.name} — Manju's Atelier` : 'Loading…',
    description: product?.description,
    image: product?.images[0],
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setQty(1);
    setTab('Description');
    api
      .get<{ product: Product; related: Product[] }>(`/products/${slug}`)
      .then((res) => {
        setProduct(res.product);
        trackEvent('product_viewed', {}, res.product._id);
        
        // Fetch also-bought products
        api.get<Product[]>(`/products/${res.product._id}/also-bought`)
           .then(alsoBought => {
               if (alsoBought && alsoBought.length > 0) {
                   setRelated(alsoBought);
               } else {
                   setRelated(res.related); // Fallback to category related
               }
           })
           .catch(() => setRelated(res.related));
        
        // Save to recently viewed
        try {
          const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          const updated = [res.product._id, ...stored.filter((id: string) => id !== res.product._id)].slice(0, 10);
          localStorage.setItem('recentlyViewed', JSON.stringify(updated));
        } catch (e) {}
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    api
      .get<{ reviews: Review[] }>(`/products/${product._id}/reviews`)
      .then(({ reviews }) => setReviews(reviews))
      .catch(() => void 0);
  }, [product]);

  if (loading) return <DetailsSkeleton />;
  if (!product)
    return (
      <div className="container-x grid place-items-center py-32 text-center">
        <p className="font-serif text-3xl text-brown-dark dark:text-beige">Product not found</p>
        <Link to="/shop" className="mt-6">
          <Button>Back to shop</Button>
        </Link>
      </div>
    );

  const wished = has(product._id);
  const price = finalPrice(product);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => void 0);
    } else {
      await navigator.clipboard.writeText(url);
      notify('Link copied to clipboard', 'info');
    }
  };

  const buyNow = () => {
    trackEvent('added_to_cart', { qty }, product._id);
    add(product, qty);
    navigate('/checkout');
  };

  return (
    <div className="container-x py-10">
      {/* Back Button & Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-1.5 rounded-full border border-brown/10 bg-white/50 px-3 py-1.5 text-sm font-medium text-brown transition-colors hover:bg-brown/5 hover:text-brown-dark dark:border-beige/10 dark:bg-[#1c1712]/50 dark:text-beige/70 dark:hover:bg-[#26201a] dark:hover:text-beige"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <nav className="flex items-center gap-1 text-sm text-brown/50 dark:text-beige/50">
          <Link to="/" className="hover:text-brown">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-brown">
            Shop
          </Link>
          <ChevronRight size={14} />
          <span className="text-brown-dark dark:text-beige">{product.name}</span>
        </nav>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-4">

          <div className="relative w-full">
            <div
              id="product-carousel"
              className="flex items-start w-full snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-2"
              onScroll={(e) => {
                const el = e.currentTarget;
                const index = Math.round(el.scrollLeft / (el.clientWidth + 16));
                if (index !== activeImg) setActiveImg(index);
              }}
            >
              {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-full shrink-0 snap-center overflow-hidden rounded-2xl"
                  >
                    <img
                      src={optimizeCloudinaryUrl(img, 1200)}
                      alt={`${product.name} ${i + 1}`}
                      onClick={() => setLightboxOpen(true)}
                      className="h-auto w-full cursor-pointer transition-transform duration-200"
                    />
                  </div>
              ))}
            </div>

            <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
              {product.badges?.map((b) => (
                <Badge key={b} type={b} />
              ))}
            </div>

            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const next = Math.max(0, activeImg - 1);
                    setActiveImg(next);
                    const container = document.getElementById('product-carousel');
                    if (container) {
                      container.scrollTo({ left: (container.clientWidth + 16) * next, behavior: 'smooth' });
                    }
                  }}
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/40 p-2 text-brown opacity-60 backdrop-blur-md transition-all hover:bg-white hover:opacity-100",
                    activeImg === 0 && "hidden"
                  )}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(product.images.length - 1, activeImg + 1);
                    setActiveImg(next);
                    const container = document.getElementById('product-carousel');
                    if (container) {
                      container.scrollTo({ left: (container.clientWidth + 16) * next, behavior: 'smooth' });
                    }
                  }}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/40 p-2 text-brown opacity-60 backdrop-blur-md transition-all hover:bg-white hover:opacity-100",
                    activeImg === product.images.length - 1 && "hidden"
                  )}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Pagination dots */}
          {product.images.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveImg(i);
                    const container = document.getElementById('product-carousel');
                    if (container) {
                      container.scrollTo({
                        left: (container.clientWidth + 16) * i,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300 hover:bg-brown',
                    activeImg === i ? 'w-5 bg-brown' : 'w-1.5 bg-brown/30'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm uppercase tracking-wide text-brown/50 dark:text-beige/50">
            {categoryName(product)}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-brown-dark dark:text-beige">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.rating} count={product.reviewCount} size={16} />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-brown-dark dark:text-beige">
              {formatPrice(price)}
            </span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-brown/40 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="rounded-full bg-forest/15 px-2 py-0.5 text-sm font-semibold text-forest">
                  Save {product.discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-brown/70 dark:text-beige/70">
            {product.description}
          </p>

          {/* Stock */}
          <p className="mt-5 text-sm">
            {product.inStock ? (
              <span className="font-medium text-forest">
                In stock — {product.stock} available
              </span>
            ) : (
              <span className="font-medium text-red-500">Out of stock</span>
            )}
          </p>

          {/* Quantity + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-brown/20">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-beige/40"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, 10, q + 1))}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-beige/40"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <Button
              onClick={(e) => {
                const btn = e.currentTarget;
                const originalHTML = btn.innerHTML;
                btn.classList.add('bg-forest');
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;margin-right:8px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Added';
                setTimeout(() => {
                  btn.classList.remove('bg-forest');
                  btn.innerHTML = originalHTML;
                }, 1000);
                trackEvent('added_to_cart', { qty }, product._id);
                add(product, qty);
                notify('Added to cart');
              }}
              disabled={!product.inStock}
              size="lg"
              className="transition-colors duration-200"
            >
              <ShoppingBag size={18} /> Add to Cart
            </Button>
            <Button onClick={buyNow} disabled={!product.inStock} variant="gold" size="lg">
              Buy Now
            </Button>
          </div>

          <div className="mt-3">
            <Link 
              to={`/bulk-orders?product=${encodeURIComponent(product.name)}`}
              className="text-sm font-medium text-brown hover:text-gold transition-colors underline decoration-brown/30 underline-offset-4"
            >
              Need more than 10? Request a bulk order
            </Link>
          </div>

          {!product.inStock && (
            <div className="mt-4 rounded-xl border border-brown/20 bg-beige/30 p-4 dark:border-beige/20 dark:bg-beige/5">
              <h3 className="mb-2 text-sm font-semibold text-brown-dark dark:text-beige">
                Notify me when available
              </h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const email = fd.get('email');
                  const btn = e.currentTarget.querySelector('button');
                  if (btn) btn.disabled = true;
                  api.post(`/products/${product._id}/notify-stock`, { email })
                    .then(() => {
                      notify('You will be notified when this is back in stock!', 'info');
                      if (btn) btn.textContent = 'Subscribed ✓';
                    })
                    .catch((err) => {
                      notify(err instanceof Error ? err.message : 'Something went wrong', 'error');
                      if (btn) btn.disabled = false;
                    });
                }}
                className="flex gap-2"
              >
                <input 
                  type="email" 
                  name="email" 
                  required 
                  defaultValue={user?.email || ''}
                  placeholder="Enter your email" 
                  className="input flex-1 bg-white text-sm dark:bg-[#2c2621]"
                />
                <Button type="submit" size="sm">Notify Me</Button>
              </form>
            </div>
          )}

          <div className="mt-4 flex gap-4">
            <button
              onClick={() => toggle(product._id)}
              className="flex items-center gap-2 text-sm text-brown/70 hover:text-brown dark:text-beige/70"
            >
              <Heart size={18} className={cn(wished && 'fill-red-500 text-red-500')} />
              {wished ? 'Wishlisted' : 'Add to wishlist'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-brown/70 hover:text-brown dark:text-beige/70"
            >
              <Share2 size={18} /> Share
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-brown/10 pt-6 text-center text-xs text-brown/60 dark:text-beige/60">
            <div className="flex flex-col items-center gap-1.5">
              <Truck size={20} className="text-brown" /> Free shipping over ₹1499
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={20} className="text-brown" /> Secure payment
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RefreshCw size={20} className="text-brown" /> 7-day returns
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex flex-wrap gap-2 border-b border-brown/10">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors',
                tab === t ? 'text-brown' : 'text-brown/50 hover:text-brown dark:text-beige/50'
              )}
            >
              {t}
              {t === 'Reviews' && ` (${reviews.length})`}
              {tab === t && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-brown"
                />
              )}
            </button>
          ))}
        </div>

        <div className="py-8 text-brown/75 dark:text-beige/75">
          {tab === 'Description' && <p className="max-w-3xl leading-relaxed">{product.description}</p>}
          {tab === 'Details' && (
            <dl className="grid max-w-xl gap-3 sm:grid-cols-2">
              <Detail label="Material" value={product.material} />
              <Detail label="Dimensions" value={product.dimensions} />
              <Detail label="Color" value={product.color} />
              <Detail label="Category" value={categoryName(product)} />
            </dl>
          )}
          {tab === 'Care' && <p className="max-w-3xl leading-relaxed">{product.careInstructions}</p>}
          {tab === 'Reviews' && (
            <ReviewsTab
              product={product}
              reviews={reviews}
              canReview={!!user}
              user={user}
              onAdded={(r) => {
                setReviews((prev) => [r, ...prev]);
                if (r.status === 'approved') {
                  setProduct((p) => (p ? { ...p, reviewCount: p.reviewCount + 1 } : p));
                }
              }}
              onDeleted={(id) => {
                setReviews((prev) => prev.filter(r => r._id !== id));
                setProduct((p) => (p ? { ...p, reviewCount: Math.max(0, p.reviewCount - 1) } : p));
              }}
            />
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-3xl text-brown-dark dark:text-beige">
            Frequently Bought Together / You May Also Love
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      <RecentlyViewed currentProductId={product._id} />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          >
            <div className="flex justify-end p-4">
              <button
                onClick={() => setLightboxOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Close fullscreen"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div
              id="lightbox-carousel"
              className="flex flex-1 snap-x snap-mandatory overflow-x-auto scrollbar-hide"
              onScroll={(e) => {
                const el = e.currentTarget;
                const index = Math.round(el.scrollLeft / el.clientWidth);
                if (index !== activeImg) {
                  setActiveImg(index);
                  // Sync main carousel
                  const mainContainer = document.getElementById('product-carousel');
                  if (mainContainer) {
                    mainContainer.scrollTo({
                      left: (mainContainer.clientWidth + 16) * index,
                      behavior: 'auto'
                    });
                  }
                }
              }}
              ref={(el) => {
                // Ensure it opens exactly to the active image
                if (el && el.scrollLeft === 0 && activeImg > 0) {
                  el.scrollLeft = el.clientWidth * activeImg;
                }
              }}
            >
              {product.images.map((img, i) => (
                <div key={i} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-4 relative">
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>

            {/* Lightbox Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const next = Math.max(0, activeImg - 1);
                    setActiveImg(next);
                    const container = document.getElementById('lightbox-carousel');
                    if (container) {
                      container.scrollTo({ left: container.clientWidth * next, behavior: 'smooth' });
                    }
                  }}
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/10 p-3 text-white opacity-50 backdrop-blur-md transition-all hover:bg-white/30 hover:opacity-100",
                    activeImg === 0 && "hidden"
                  )}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(product.images.length - 1, activeImg + 1);
                    setActiveImg(next);
                    const container = document.getElementById('lightbox-carousel');
                    if (container) {
                      container.scrollTo({ left: container.clientWidth * next, behavior: 'smooth' });
                    }
                  }}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/10 p-3 text-white opacity-50 backdrop-blur-md transition-all hover:bg-white/30 hover:opacity-100",
                    activeImg === product.images.length - 1 && "hidden"
                  )}
                  aria-label="Next image"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Pagination dots for lightbox */}
            {product.images.length > 1 && (
              <div className="flex justify-center gap-2 p-6">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveImg(i);
                      const container = document.getElementById('lightbox-carousel');
                      if (container) {
                        container.scrollTo({
                          left: container.clientWidth * i,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      activeImg === i ? 'w-6 bg-white' : 'w-2 bg-white/30'
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b border-brown/10 py-2">
      <dt className="text-brown/50 dark:text-beige/50">{label}</dt>
      <dd className="font-medium text-brown-dark dark:text-beige">{value || '—'}</dd>
    </div>
  );
}

function ReviewsTab({
  product,
  reviews,
  canReview,
  user,
  onAdded,
  onDeleted,
}: {
  product: Product;
  reviews: Review[];
  canReview: boolean;
  user: any;
  onAdded: (r: Review) => void;
  onDeleted: (id: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { review } = await api.post<{ review: Review }>(
        `/products/${product._id}/reviews`,
        { rating, comment }
      );
      onAdded(review);
      setComment('');
      notify('Thank you for your review!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="card-surface p-6 text-center">
          <p className="font-serif text-5xl text-brown-dark dark:text-beige">
            {product.rating.toFixed(1)}
          </p>
          <Rating value={product.rating} className="mt-2 justify-center" size={18} />
          <p className="mt-2 text-sm text-brown/50 dark:text-beige/50">
            Based on {product.reviewCount} reviews
          </p>
        </div>

        {canReview ? (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <p className="font-medium text-brown-dark dark:text-beige">Write a review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} stars`}>
                  <span className={cn('text-2xl', i <= rating ? 'text-gold' : 'text-brown/25')}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts…"
              rows={3}
              className="w-full rounded-xl border border-brown/15 bg-white p-3 text-sm outline-none focus:border-brown dark:bg-[#26201a]"
            />
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-beige/40 p-4 text-sm text-brown/70 dark:bg-beige/10">
            <Link to="/login" className="font-medium text-brown underline">
              Log in
            </Link>{' '}
            to write a review.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-brown/50 dark:text-beige/50">
            No reviews yet — be the first to share!
          </p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="card-surface p-5 relative">
              <div className="flex items-center justify-between">
                <p className="font-medium text-brown-dark dark:text-beige">{r.name}</p>
                <div className="flex items-center gap-4">
                  <Rating value={r.rating} />
                  {user?.role === 'admin' && (
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this review?')) {
                          try {
                            await api.delete(`/reviews/${r._id}`);
                            notify('Review deleted');
                            onDeleted(r._id);
                          } catch (err) {
                            notify('Failed to delete review', 'error');
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-brown/70 dark:text-beige/70">{r.comment}</p>
              )}
              {r.image && (
                <div className="mt-3">
                  <a href={r.image} target="_blank" rel="noopener noreferrer">
                    <img src={r.image} alt="Review attachment" className="h-24 w-24 rounded-lg object-cover hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}
              <p className="mt-2 text-xs text-brown/40">
                {formatDate(r.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="container-x grid gap-10 py-10 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-48" />
      </div>
    </div>
  );
}
