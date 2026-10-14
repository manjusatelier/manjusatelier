import type { Product } from '@/types';

/** Merge class names, dropping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function finalPrice(p: { price: number; discount: number; finalPrice?: number }): number {
  return p.finalPrice ?? Math.round(p.price * (1 - p.discount / 100));
}

export function categoryName(p: Product): string {
  if (!p.category) return 'Uncategorized';
  const first = Array.isArray(p.category) ? p.category[0] : p.category;
  if (!first) return 'Uncategorized';
  return typeof first === 'string' ? first : first.name ?? 'Uncategorized';
}

export function formatDate(dateString: string | Date): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Load an external script once (used for Razorpay checkout). */
export function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
