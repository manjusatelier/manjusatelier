import type { Product, User } from '@/types';

export const ALLOWED_TEST_PRODUCT_EMAILS = [
  'sameer9032@gmail.com',
  'manjukumari14052003@gmail.com',
];

/**
 * Checks if a product or cart item is the internal test/dummy product.
 */
export function isTestDummyProduct(product?: Product | { name?: string; slug?: string; tags?: string[] } | null): boolean {
  if (!product) return false;
  const name = String(product.name || '').toLowerCase();
  const slug = String(product.slug || '').toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.map((t) => String(t).toLowerCase()) : [];

  return (
    name.includes('test / dummy product') ||
    name.includes('test/dummy product') ||
    name.includes('test dummy product') ||
    name.includes('dummy product') ||
    slug.includes('test-dummy-product') ||
    slug.includes('test-dummy') ||
    slug.includes('dummy-product') ||
    tags.includes('dummy') ||
    tags.includes('test-dummy')
  );
}

/**
 * Checks if a user is permitted to see and order the test dummy product.
 */
export function canUserAccessTestProduct(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const email = String(user.email || '').toLowerCase().trim();
  return ALLOWED_TEST_PRODUCT_EMAILS.includes(email);
}
