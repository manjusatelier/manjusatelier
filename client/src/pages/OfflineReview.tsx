import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  Star,
  CheckCircle,
  ChevronDown,
  Search,
  X,
  LayoutGrid,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function OfflineReview() {
  usePageMeta({
    title: "Leave a Review — Manju's Atelier",
    description: "Share your experience with our handcrafted resin, floral, and artisan creations.",
  });

  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    rating: 5,
    comment: '',
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCatalogGrid, setShowCatalogGrid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedProduct = products.find((p) => p._id === formData.productId);

  // Filter products by name, category, color, material, or tags
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesName = p.name?.toLowerCase().includes(q);
    const matchesColor = p.color?.toLowerCase().includes(q);
    const matchesMaterial = p.material?.toLowerCase().includes(q);
    const matchesTags = p.tags?.some((t: string) => t.toLowerCase().includes(q));

    const matchesCategory = Array.isArray(p.category)
      ? p.category.some((c: any) =>
          typeof c === 'string'
            ? c.toLowerCase().includes(q)
            : c?.name?.toLowerCase().includes(q) || c?.slug?.toLowerCase().includes(q)
        )
      : typeof p.category === 'string'
      ? p.category.toLowerCase().includes(q)
      : p.category?.name?.toLowerCase().includes(q);

    return matchesName || matchesColor || matchesMaterial || matchesTags || matchesCategory;
  });

  // Fetch all products (un-capped via all=true&limit=all)
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await api.get<{ success: boolean; products: any[]; total?: number }>(
          '/products?all=true&limit=all&sort=name'
        );
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load products for review page:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Pre-select product from URL params if present (e.g. ?product=id or ?slug=name)
  useEffect(() => {
    const param =
      searchParams.get('product') ||
      searchParams.get('productId') ||
      searchParams.get('id') ||
      searchParams.get('slug');

    if (param && products.length > 0) {
      const match = products.find(
        (p) =>
          p._id === param ||
          p.slug === param ||
          p.name.toLowerCase() === param.toLowerCase()
      );
      if (match) {
        setFormData((prev) => ({ ...prev, productId: match._id }));
      }
    }
  }, [products, searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setRating = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSelectProduct = (productId: string) => {
    setFormData((prev) => ({ ...prev, productId }));
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.name.trim() || !formData.rating) {
      setErrorMessage('Please select a product and provide your name.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const payload = new FormData();
      payload.append('productId', formData.productId);
      payload.append('name', formData.name.trim());
      payload.append('rating', String(formData.rating));
      payload.append('comment', formData.comment.trim());
      if (imageFile) {
        payload.append('image', imageFile);
      }

      await api.upload('/reviews/offline', payload);
      setStatus('success');
    } catch (error: any) {
      console.error('Review submission error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit review. Please try again.');
    }
  };

  // Helper to extract primary category name
  const getCategoryLabel = (product: any): string => {
    if (!product?.category) return '';
    if (Array.isArray(product.category) && product.category.length > 0) {
      const first = product.category[0];
      return typeof first === 'string' ? first : first.name || '';
    }
    return typeof product.category === 'string' ? product.category : product.category.name || '';
  };

  return (
    <div className="container-x py-10 md:py-16">
      {/* Page Header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-brown-dark dark:text-gold mb-3">
          <Sparkles size={13} />
          Customer Feedback
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brown-dark dark:text-beige break-words">
          Leave a Review
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm sm:text-base text-brown/80 dark:text-beige/80 break-words">
          Purchased at our offline exhibition stall or studio? Tell us how much you loved your handcrafted piece!
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-black/5 dark:bg-[#241e18] dark:ring-beige/15">
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle size={40} />
            </div>
            <h3 className="font-serif text-3xl text-brown-dark dark:text-beige">Thank You!</h3>
            <p className="mt-4 max-w-sm text-base sm:text-lg text-brown/80 dark:text-beige/80">
              Your review has been submitted for moderation and will appear on the store shortly.
            </p>
            <Button
              className="mt-8"
              onClick={() => {
                setStatus('idle');
                setFormData({ ...formData, comment: '', rating: 5, productId: '' });
                setImageFile(null);
              }}
              variant="secondary"
            >
              Write Another Review
            </Button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="w-full space-y-6">
            {/* 1. Product Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-brown-dark dark:text-beige">
                  Which product did you purchase? *
                </label>
                {!loading && products.length > 0 && (
                  <span className="text-xs text-brown/60 dark:text-beige/60">
                    {products.length} products available
                  </span>
                )}
              </div>

              {loading ? (
                <div className="rounded-lg border border-dashed border-brown/20 p-6 text-center text-sm text-brown/60 dark:border-beige/20 dark:text-beige/60">
                  Loading all handcrafted products...
                </div>
              ) : selectedProduct ? (
                /* Selected Product Banner */
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/5 p-3.5 dark:bg-gold/10">
                  <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                    <img
                      src={selectedProduct.images?.[0] || '/placeholder.png'}
                      alt={selectedProduct.name}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-brown/10 dark:border-beige/10"
                    />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-brown-dark dark:text-beige">
                        {selectedProduct.name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-brown/70 dark:text-beige/70">
                        {getCategoryLabel(selectedProduct) && (
                          <span className="inline-flex items-center gap-1 rounded bg-beige/50 px-1.5 py-0.5 text-[11px] font-medium text-brown dark:bg-[#1a140e] dark:text-beige">
                            <Tag size={10} />
                            {getCategoryLabel(selectedProduct)}
                          </span>
                        )}
                        {selectedProduct.color && <span>• {selectedProduct.color}</span>}
                        {selectedProduct.price && (
                          <span className="font-semibold text-gold">
                            • {formatPrice(selectedProduct.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, productId: '' }));
                      setDropdownOpen(true);
                    }}
                    className="shrink-0 rounded-lg border border-brown/20 bg-white px-3 py-1.5 text-xs font-semibold text-brown-dark hover:border-gold hover:text-gold dark:border-beige/20 dark:bg-[#1c1611] dark:text-beige transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                /* Dropdown Selector */
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border border-brown/20 bg-white px-3.5 py-2.5 text-left text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold dark:border-beige/20 dark:bg-[#1c1611] dark:text-beige"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-brown/60 dark:text-beige/60">
                      Select a product from our catalog ({products.length} items)...
                    </span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'shrink-0 text-brown/40 dark:text-beige/40 transition-transform duration-200',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 top-full z-30 mt-1 flex max-h-80 w-full flex-col overflow-hidden rounded-xl border border-brown/20 bg-white shadow-2xl dark:border-beige/20 dark:bg-[#1c1611]">
                      {/* Search Bar inside Dropdown */}
                      <div className="sticky top-0 z-20 border-b border-brown/10 bg-white p-2.5 dark:border-beige/10 dark:bg-[#1c1611]">
                        <div className="relative flex items-center">
                          <Search
                            size={16}
                            className="absolute left-3 text-brown/40 dark:text-beige/40 pointer-events-none"
                          />
                          <input
                            type="text"
                            autoFocus
                            placeholder={`Search all ${products.length} products by name, category, color...`}
                            className="w-full rounded-lg border border-brown/20 bg-beige/15 pl-9 pr-8 py-2 text-xs text-brown outline-none focus:border-gold focus:ring-1 focus:ring-gold dark:border-beige/20 dark:bg-[#2b221a] dark:text-beige placeholder:text-brown/40 dark:placeholder:text-beige/40"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2.5 text-brown/40 hover:text-brown dark:text-beige/40 dark:hover:text-beige"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-brown/50 dark:text-beige/50">
                          <span>
                            Showing {filteredProducts.length} of {products.length} products
                          </span>
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="text-gold hover:underline"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="overflow-y-auto divide-y divide-brown/5 dark:divide-beige/5">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((p) => {
                            const catLabel = getCategoryLabel(p);
                            return (
                              <button
                                key={p._id}
                                type="button"
                                onClick={() => handleSelectProduct(p._id)}
                                className="flex w-full min-w-0 items-center gap-3 p-3 text-left transition-colors hover:bg-gold/10 dark:hover:bg-gold/15"
                              >
                                <img
                                  src={p.images?.[0] || '/placeholder.png'}
                                  alt={p.name}
                                  className="h-11 w-11 shrink-0 rounded-lg object-cover border border-brown/10 dark:border-beige/10"
                                />
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="truncate text-sm font-medium text-brown-dark dark:text-beige">
                                    {p.name}
                                  </p>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-brown/60 dark:text-beige/60">
                                    {catLabel && (
                                      <span className="rounded bg-beige/40 px-1 py-0.2 text-[10px] dark:bg-[#2b221a]">
                                        {catLabel}
                                      </span>
                                    )}
                                    {p.color && <span>• {p.color}</span>}
                                    {p.price && (
                                      <span className="font-semibold text-gold">
                                        • {formatPrice(p.price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-sm text-brown/60 dark:text-beige/60">
                            No products match "{searchQuery}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle to visually browse all products */}
              {!loading && products.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCatalogGrid(!showCatalogGrid)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-brown-dark dark:hover:text-beige transition-colors"
                  >
                    <LayoutGrid size={13} />
                    <span>
                      {showCatalogGrid
                        ? 'Hide visual product gallery'
                        : `Or browse all ${products.length} products visually`}
                    </span>
                  </button>

                  {/* Visual Product Grid */}
                  {showCatalogGrid && (
                    <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-brown/15 bg-beige/10 p-3 dark:border-beige/15 dark:bg-[#1a140e]">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {products.map((p) => {
                          const isSelected = p._id === formData.productId;
                          return (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => {
                                handleSelectProduct(p._id);
                                setShowCatalogGrid(false);
                              }}
                              className={cn(
                                'group relative flex flex-col items-start overflow-hidden rounded-lg border bg-white p-2 text-left transition-all hover:border-gold hover:shadow-sm dark:bg-[#241e18]',
                                isSelected
                                  ? 'border-gold ring-2 ring-gold/40'
                                  : 'border-brown/10 dark:border-beige/10'
                              )}
                            >
                              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-beige/20 dark:bg-black/20">
                                <img
                                  src={p.images?.[0] || '/placeholder.png'}
                                  alt={p.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                                {isSelected && (
                                  <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white shadow">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <p className="mt-1.5 line-clamp-2 text-xs font-medium text-brown-dark dark:text-beige">
                                {p.name}
                              </p>
                              {p.price && (
                                <p className="mt-0.5 text-[11px] font-semibold text-gold">
                                  {formatPrice(p.price)}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. User Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-brown-dark dark:text-beige">
                Your Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                className="w-full max-w-full rounded-lg border border-brown/20 bg-white px-3.5 py-2.5 text-sm text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold dark:border-beige/20 dark:bg-[#1c1611] dark:text-beige placeholder:text-brown/40 dark:placeholder:text-beige/40"
                placeholder="e.g. Priya Sharma"
              />
            </div>

            {/* 3. Rating Stars */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-brown-dark dark:text-beige">Rating *</label>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={30}
                      className={cn(
                        'transition-colors shrink-0',
                        star <= formData.rating
                          ? 'fill-gold text-gold hover:fill-gold/80 hover:text-gold/80'
                          : 'text-brown/20 dark:text-beige/20 hover:text-brown/40'
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-medium text-brown/60 dark:text-beige/60">
                  {formData.rating === 5 ? '5.0 — Excellent!' : `${formData.rating}.0`}
                </span>
              </div>
            </div>

            {/* 4. Review Comment */}
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium text-brown-dark dark:text-beige">
                Review (Optional)
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={4}
                value={formData.comment}
                onChange={handleChange}
                className="w-full max-w-full resize-none break-words rounded-lg border border-brown/20 bg-white px-3.5 py-3 text-sm text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold dark:border-beige/20 dark:bg-[#1c1611] dark:text-beige placeholder:text-brown/40 dark:placeholder:text-beige/40"
                placeholder="Tell us what you loved about the craftsmanship, finish, or packaging..."
              />
            </div>

            {/* 5. Photo Upload */}
            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium text-brown-dark dark:text-beige">
                Upload a Photo of Your Item (Optional)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full max-w-full overflow-hidden text-ellipsis rounded-lg border border-brown/20 bg-white p-2 text-xs text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold dark:border-beige/20 dark:bg-[#1c1611] dark:text-beige file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#825028] dark:file:text-gold hover:file:bg-gold/25"
              />
              {imageFile && (
                <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 rounded-lg bg-beige/25 p-2 text-xs text-brown dark:bg-[#2b221a] dark:text-beige">
                  <span className="min-w-0 flex-1 truncate font-medium">Selected: {imageFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      const el = document.getElementById('image') as HTMLInputElement;
                      if (el) el.value = '';
                    }}
                    className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {status === 'error' && (
              <div className="break-words rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full max-w-full"
              size="lg"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Submitting Review...' : 'Submit Review'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
