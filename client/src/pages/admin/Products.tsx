import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Package, Eye, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice, finalPrice, cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import type { Product, Badge, Category } from '@/types';

const ALL_BADGES: Badge[] = ['New', 'Sale', 'Limited', 'Handmade'];

interface FormState {
  name: string;
  category: string[];
  price: string;
  discount: string;
  stock: string;
  material: string;
  dimensions: string;
  color: string;
  description: string;
  images: string[];
  badges: Badge[];
  featured: boolean;
  socialCaption?: string;
  postToSocials?: boolean;
  postToInstagram?: boolean;
  postToFacebook?: boolean;
  postToX?: boolean;
}

const emptyForm: FormState = {
  name: '',
  category: [],
  price: '',
  discount: '0',
  stock: '0',
  material: '',
  dimensions: '',
  color: '',
  description: '',
  images: [],
  badges: ['Handmade'],
  featured: false,
  socialCaption: '',
  postToSocials: false,
  postToInstagram: true,
  postToFacebook: true,
  postToX: true,
};

export default function Products() {
  const { categories } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { notify } = useToast();

  const load = () => {
    setLoading(true);
    api
      .get<{ products: Product[] }>('/products?limit=48')
      .then(({ products }) => setProducts(products))
      .catch((e) => notify(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setShowForm(true);
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      setProducts((prev) => prev.filter((x) => x._id !== p._id));
      notify('Product deleted');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Products</h1>
          <p className="mt-1 text-brown/60 dark:text-beige/60">
            {loading ? 'Loading…' : `${products.length} products`}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={18} /> Add Product
        </Button>
      </header>

      {!showForm && (
        <div className="mb-6">
          <input
            type="search"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md rounded-lg border border-brown/20 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-gold dark:border-beige/20 dark:bg-[#2c2621] dark:text-beige"
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
        <div className="card-surface grid place-items-center py-20 text-center">
          <Package className="text-brown/40" size={40} />
          <p className="mt-3 font-serif text-xl text-brown-dark dark:text-beige">
            {searchQuery ? 'No products found matching your search' : 'No products'}
          </p>
          {!searchQuery && (
            <Button className="mt-4" onClick={openNew}>
              Add your first product
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
            <div key={p._id} className="card-surface flex items-center gap-4 p-3">
              <img
                src={p.images[0]}
                alt={p.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-brown-dark dark:text-beige">{p.name}</p>
                <p className="text-xs text-brown/50 dark:text-beige/50">
                  {Array.isArray(p.category) && p.category.length > 0 && typeof p.category[0] === 'object' ? p.category[0].name : ''} ·{' '}
                  {formatPrice(finalPrice(p))}
                  {p.discount > 0 && <span className="text-forest"> (-{p.discount}%)</span>}
                </p>
              </div>
              <span
                className={cn(
                  'hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline',
                  p.stock === 0
                    ? 'bg-red-100 text-red-600'
                    : p.stock <= 5
                      ? 'bg-gold/20 text-brown-dark'
                      : 'bg-forest/15 text-forest'
                )}
              >
                {p.stock} in stock
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(p)}
                  aria-label="Edit"
                  className="rounded-lg p-2 text-brown hover:bg-beige/50 dark:hover:bg-beige/10"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => remove(p)}
                  aria-label="Delete"
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    product
      ? {
          name: product.name,
          category: Array.isArray(product.category)
            ? product.category.map((c) => (typeof c === 'object' ? c._id : c))
            : product.category
              ? [typeof product.category === 'object' ? product.category._id : product.category]
              : [],
          price: String(product.price),
          discount: String(product.discount),
          stock: String(product.stock),
          material: product.material || '',
          dimensions: product.dimensions || '',
          color: product.color || '',
          description: product.description,
          images: product.images || [],
          badges: product.badges || [],
          featured: !!product.featured,
        }
      : emptyForm
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingIndex(index);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url } = await api.upload<{ url: string }>('/admin/upload', fd);
      
      const newImages = [...form.images];
      newImages[index] = url;
      set('images', newImages);
      notify('Image uploaded');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    set('images', newImages);
  };

  const handleAIAutofill = async () => {
    const coverImage = form.images[0];
    if (!coverImage) {
      return notify('Please upload a cover image first so AI can analyze it.', 'error');
    }

    setGeneratingAI(true);
    try {
      const { data } = await api.post<{ data: any }>('/ai/generate-product', { imageUrl: coverImage });
      
      setForm(prev => {
        const newBadges = [...prev.badges];
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => {
             const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
             if (!newBadges.includes(capitalized as Badge) && ALL_BADGES.includes(capitalized as Badge)) {
               newBadges.push(capitalized as Badge);
             }
          });
        }
        return {
          ...prev,
          name: prev.name || data.name || '',
          description: prev.description || data.description || '',
          category: prev.category.length ? prev.category : (data.category ? (Array.isArray(data.category) ? data.category : [data.category]) : []),
          color: prev.color || data.color || '',
          socialCaption: prev.socialCaption || data.socialCaption || '',
          badges: newBadges
        };
      });
      notify('AI Auto-fill complete! Review the suggestions.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'AI generation failed', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.category.length === 0) return notify('Please choose at least one category', 'error');
    if (form.images.length === 0) return notify('Please add at least one product image', 'error');
    if (form.postToSocials && !form.postToInstagram && !form.postToFacebook && !form.postToX) {
      return notify('Please select at least one social media platform to post to, or disable Auto-Post', 'error');
    }
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      discount: Number(form.discount),
      stock: Number(form.stock),
      material: form.material,
      dimensions: form.dimensions,
      color: form.color,
      description: form.description,
      images: form.images.filter(Boolean),
      badges: form.badges,
      featured: form.featured,
      ...(form.postToSocials ? {
        postToSocials: true,
        postToInstagram: form.postToInstagram,
        postToFacebook: form.postToFacebook,
        postToX: form.postToX,
        socialCaption: form.socialCaption,
      } : {}),
    };
    try {
      if (product) await api.patch(`/products/${product._id}`, payload);
      else await api.post('/products', payload);
      notify(product ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-brown-dark/50 p-4 backdrop-blur-sm"
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl bg-cream p-6 shadow-lift dark:bg-[#1c1712]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-brown-dark dark:text-beige">
            {product ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="text-brown-dark dark:text-beige" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Image Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-brown-dark dark:text-beige">Product Images</span>
            <p className="text-xs text-brown/50 dark:text-beige/50">
              Upload up to 6 images. First image will be the cover.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => {
                const img = form.images[i];
                return (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-brown/20 bg-beige/10">
                    {img ? (
                      <>
                        <img src={img} alt="" className={cn("h-full w-full object-cover", uploadingIndex === i && "opacity-50 blur-sm")} />
                        {uploadingIndex === i ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brown border-t-transparent" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-1 bg-black/40 opacity-100 backdrop-blur-[2px] transition-all duration-200 lg:gap-1.5 lg:bg-black/60 lg:opacity-0 lg:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => window.open(img, '_blank')}
                              className="rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/40"
                              title="View image"
                            >
                              <Eye size={14} />
                            </button>
                            <label
                              className="cursor-pointer rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/40"
                              title="Replace image"
                            >
                              <Upload size={14} />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, i)} />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="rounded-full bg-red-500/80 p-1.5 text-white transition-colors hover:bg-red-500"
                              title="Remove image"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <label className={cn(
                        "flex h-full w-full cursor-pointer flex-col items-center justify-center text-brown/40 transition-colors",
                        uploadingIndex === i ? "bg-beige/20" : "hover:bg-beige/30 hover:text-brown"
                      )}>
                        {uploadingIndex === i ? (
                           <div className="h-5 w-5 animate-spin rounded-full border-2 border-brown border-t-transparent" />
                        ) : (
                          <>
                            <Plus size={24} />
                            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider">Add</span>
                          </>
                        )}
                        <input type="file" accept="image/*" disabled={uploadingIndex !== null} className="hidden" onChange={(e) => handleImageUpload(e, i)} />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleAIAutofill}
              disabled={generatingAI || !form.images[0]}
              className="mt-4 w-max border-gold/40 bg-gold/10 text-brown-dark hover:bg-gold/20 dark:text-beige"
            >
              {generatingAI ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brown border-t-transparent dark:border-beige dark:border-t-transparent" />
                  Generating details with Gemini AI...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-gold" /> Auto-fill details with AI
                </div>
              )}
            </Button>
          </div>

          <Field label="Name">
            <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categories">
              <div className="flex flex-col gap-2 rounded-xl border border-brown/15 bg-cream p-3 dark:bg-[#1c1712] dark:border-beige/10 h-[46px] overflow-y-auto" style={{ height: 'auto', maxHeight: '150px' }}>
                {categories.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 text-sm text-brown-dark dark:text-beige cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-brown/20 text-gold focus:ring-gold dark:border-beige/20 dark:bg-[#26201a]"
                      checked={form.category.includes(c._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        set('category', checked 
                          ? [...form.category, c._id] 
                          : form.category.filter(id => id !== c._id)
                        );
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Color">
              <input className="input" required value={form.color} onChange={(e) => set('color', e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₹)">
              <input type="number" min="0" className="input" required value={form.price} onChange={(e) => set('price', e.target.value)} />
            </Field>
            <Field label="Discount (%)">
              <input type="number" min="0" max="100" required className="input" value={form.discount} onChange={(e) => set('discount', e.target.value)} />
            </Field>
            <Field label="Stock">
              <input type="number" min="0" required className="input" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Material">
              <input className="input" required value={form.material} onChange={(e) => set('material', e.target.value)} />
            </Field>
            <Field label="Dimensions">
              <input className="input" required value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} />
            </Field>
          </div>

          <Field label="Description">
            <textarea rows={3} className="input resize-none" required value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brown-dark dark:text-beige">
              Badges
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_BADGES.map((b) => {
                const active = form.badges.includes(b);
                return (
                  <button
                    type="button"
                    key={b}
                    onClick={() =>
                      set('badges', active ? form.badges.filter((x) => x !== b) : [...form.badges, b])
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      active ? 'border-brown bg-brown text-cream' : 'border-brown/25 text-brown'
                    )}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-brown-dark dark:text-beige">
            <input type="checkbox" className="h-4 w-4 accent-brown" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            Show in Featured Products
          </label>

            <div className="mt-4 rounded-xl border border-brown/10 bg-cream/50 p-4 dark:border-beige/10 dark:bg-[#1c1712]/50">
              <label className="flex cursor-pointer items-center gap-2 font-serif text-lg text-brown-dark dark:text-beige">
                <input type="checkbox" className="h-4 w-4 accent-brown" checked={form.postToSocials} onChange={(e) => set('postToSocials', e.target.checked)} />
                <Sparkles size={18} className="text-gold" /> {product ? 'Share to Social Media' : 'Auto-Post to Social Media'}
              </label>
              
              {form.postToSocials && (
                <div className="mt-4 space-y-4 border-t border-brown/10 pt-4 dark:border-beige/10">
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-brown" checked={form.postToInstagram} onChange={(e) => set('postToInstagram', e.target.checked)} /> Instagram
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-brown" checked={form.postToFacebook} onChange={(e) => set('postToFacebook', e.target.checked)} /> Facebook
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-brown" checked={form.postToX} onChange={(e) => set('postToX', e.target.checked)} /> X (Twitter)
                    </label>
                  </div>
                  <Field label={product ? "Social Media Caption" : "Social Media Caption (AI Auto-filled)"}>
                    <textarea rows={3} className="input resize-none" placeholder="Catchy caption with hashtags..." value={form.socialCaption || ''} onChange={(e) => set('socialCaption', e.target.value)} />
                  </Field>
                  <p className="text-xs text-brown/50 dark:text-beige/50">When you save this product, we'll automatically send this post to your configured social accounts via Make.com webhook.</p>
                </div>
              )}
            </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingIndex !== null || generatingAI}>
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-brown-dark dark:text-beige">
        {label}
      </span>
      {children}
    </label>
  );
}
