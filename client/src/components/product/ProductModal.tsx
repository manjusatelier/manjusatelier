import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Heart, ShoppingBag, Minus, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { cn, formatPrice, finalPrice, categoryName } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { useProductModal } from '@/context/ProductModalContext';
import { trackEvent } from '@/lib/analytics';

export function ProductModal() {
  const { isOpen, productSlug, closeModal } = useProductModal();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  const { add, items, setQuantity } = useCart();
  const { has, toggle } = useWishlist();
  const { notify } = useToast();

  const cartItem = items.find((i) => i.product._id === product?._id);
  const currentQty = cartItem ? cartItem.quantity : qty;

  const handleIncrease = () => {
    if (!product) return;
    const maxStock = Math.min(product.stock, 10);
    if (cartItem) {
      if (cartItem.quantity < maxStock) {
        setQuantity(product._id, cartItem.quantity + 1);
      } else {
        notify(`Maximum limit reached (${maxStock})`, 'info');
      }
    } else {
      setQty((q) => Math.min(maxStock, q + 1));
    }
  };

  const handleDecrease = () => {
    if (!product) return;
    if (cartItem) {
      if (cartItem.quantity > 1) {
        setQuantity(product._id, cartItem.quantity - 1);
      }
    } else {
      setQty((q) => Math.max(1, q - 1));
    }
  };

  const handleAddToCart = () => {
    if (!product || !product.inStock) return;
    const maxStock = Math.min(product.stock, 10);
    if (cartItem && cartItem.quantity >= maxStock) {
      notify(`Maximum limit reached (${maxStock})`, 'info');
      return;
    }
    if (cartItem) {
      trackEvent('added_to_cart', { qty: 1, source: 'quick_view' }, product._id);
      add(product, 1);
      notify('Added to cart');
    } else {
      trackEvent('added_to_cart', { qty, source: 'quick_view' }, product._id);
      add(product, qty);
      notify('Added to cart');
    }
  };

  useEffect(() => {
    if (isOpen && productSlug) {
      setLoading(true);
      setActiveImg(0);
      setQty(1);
      api
        .get<{ product: Product }>(`/products/${productSlug}`)
        .then((res) => {
          setProduct(res.product);
          trackEvent('product_viewed', { source: 'quick_view' }, res.product._id);
        })
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      // Delay clearing product for exit animation
      setTimeout(() => setProduct(null), 300);
    }
  }, [isOpen, productSlug]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1c1712] pointer-events-auto flex flex-col md:flex-row"
            >
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/50 text-brown backdrop-blur transition hover:bg-white dark:bg-black/50 dark:text-beige dark:hover:bg-black"
              >
                <X size={20} />
              </button>

              {loading || !product ? (
                <div className="flex w-full min-h-[400px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brown/30 border-t-brown"></div>
                </div>
              ) : (
                <>
                  {/* Left: Gallery */}
                  <div className="w-full md:w-1/2 bg-beige/20 dark:bg-black/20 flex flex-col h-full max-h-[50vh] md:max-h-[95vh]">
                    <div className="relative aspect-square md:aspect-auto md:flex-1 w-full bg-beige/30 dark:bg-black/40 group overflow-hidden">
                      <img
                        src={product.images[activeImg]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveImg(i => (i === 0 ? product.images.length - 1 : i - 1))
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-brown shadow-sm backdrop-blur transition hover:bg-white"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveImg(i => (i === product.images.length - 1 ? 0 : i + 1))
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-brown shadow-sm backdrop-blur transition hover:bg-white"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}
                    </div>
                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                      <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide shrink-0">
                        {product.images.map((img, idx) => (
                          <button
                            key={img}
                            onClick={() => setActiveImg(idx)}
                            className={cn(
                              'relative aspect-square w-16 md:w-20 shrink-0 overflow-hidden rounded-lg transition-all',
                              activeImg === idx ? 'ring-2 ring-brown ring-offset-2 dark:ring-gold dark:ring-offset-[#1c1712]' : 'opacity-60 hover:opacity-100'
                            )}
                          >
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {product.badges && product.badges.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {product.badges.map((b) => (
                          <Badge key={b} type={b} />
                        ))}
                      </div>
                    )}
                    
                    <p className="mb-1 text-xs uppercase tracking-widest text-brown/50 dark:text-beige/50">
                      {categoryName(product)}
                    </p>
                    <h2 className="font-serif text-2xl md:text-3xl text-brown-dark dark:text-beige leading-tight">
                      {product.name}
                    </h2>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <Rating value={product.rating} count={product.reviewCount} />
                    </div>

                    <div className="mt-5 flex items-baseline gap-3">
                      <span className="text-3xl font-semibold text-brown-dark dark:text-beige">
                        {formatPrice(finalPrice(product))}
                      </span>
                      {product.discount > 0 && (
                        <>
                          <span className="text-lg text-brown/40 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <span className="rounded bg-forest/10 px-2 py-0.5 text-sm font-semibold text-forest">
                            Save {product.discount}%
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-6 text-sm leading-relaxed text-brown/70 dark:text-beige/70 line-clamp-4">
                      {product.description}
                    </p>

                    <div className="mt-8 border-t border-brown/10 dark:border-beige/10 pt-8">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="font-medium text-brown-dark dark:text-beige">Quantity</span>
                        <div className="flex h-10 w-32 items-center justify-between rounded-full border border-brown/20 px-3 dark:border-beige/20">
                          <button
                            onClick={handleDecrease}
                            disabled={currentQty <= 1}
                            className="text-brown hover:text-brown-dark disabled:opacity-40 disabled:cursor-not-allowed dark:text-beige/70 dark:hover:text-beige"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="font-medium text-brown-dark dark:text-beige">{currentQty}</span>
                          <button
                            onClick={handleIncrease}
                            disabled={currentQty >= Math.min(product.stock, 10)}
                            className="text-brown hover:text-brown-dark disabled:opacity-40 disabled:cursor-not-allowed dark:text-beige/70 dark:hover:text-beige"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      {((product as any).isCustomizable || (product as any).customizable || product.tags?.some((t: string) => t.toLowerCase().includes('custom'))) && (
                        <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-brown-dark dark:text-beige">
                          <p className="font-semibold">✨ Customisable Product</p>
                          <p className="mt-0.5 text-brown/80 dark:text-beige/80">We will contact you for customisation details after your order is placed.</p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          className="flex-1"
                          disabled={!product.inStock}
                          onClick={handleAddToCart}
                        >
                          <ShoppingBag size={20} className="mr-2" />
                          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                        <button
                          onClick={() => {
                            toggle(product._id);
                            notify(has(product._id) ? 'Removed from wishlist' : 'Added to wishlist', 'info');
                          }}
                          className={cn(
                            'flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-brown/20 transition-colors dark:border-beige/20',
                            has(product._id)
                              ? 'bg-brown text-white dark:bg-beige dark:text-brown-dark'
                              : 'hover:bg-brown/5 dark:text-beige dark:hover:bg-beige/5'
                          )}
                        >
                          <Heart size={20} className={cn(has(product._id) && 'fill-current')} />
                        </button>
                      </div>
                      
                      <div className="mt-6 text-center">
                         <Link 
                           to={`/product/${product.slug}`}
                           onClick={closeModal}
                           className="text-sm text-brown underline-offset-4 hover:underline dark:text-gold"
                         >
                           View full product details
                         </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
