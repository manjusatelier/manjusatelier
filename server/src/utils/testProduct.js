export const ALLOWED_TEST_PRODUCT_EMAILS = [
  'sameer9032@gmail.com',
  'manjukumari14052003@gmail.com',
];

/**
 * Checks if a product (or order item) represents the test/dummy product.
 */
export function isTestDummyProduct(product) {
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
 * Checks if a given user is authorized to view or checkout the test dummy product.
 * Allowed: sameer9032@gmail.com, manjukumari14052003@gmail.com, and admins.
 */
export function canUserAccessTestProduct(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const email = String(user.email || '').toLowerCase().trim();
  return ALLOWED_TEST_PRODUCT_EMAILS.includes(email);
}

/**
 * Query filter to hide test products from unauthorized users in MongoDB find queries.
 */
export const TEST_PRODUCT_QUERY_EXCLUSION = [
  { name: { $not: /test\s*\/?\s*dummy\s*product|dummy product/i } },
  { slug: { $not: /test-dummy-product|dummy-product/i } },
];

/**
 * Positive match query to identify test dummy products in MongoDB.
 */
export const TEST_PRODUCT_MATCH_QUERY = {
  $or: [
    { name: /test\s*\/?\s*dummy\s*product|dummy product/i },
    { slug: /test-dummy-product|dummy-product/i },
    { tags: { $in: ['dummy', 'test-dummy'] } },
  ],
};

/**
 * Prioritizes test/dummy product to index 0 of an array for authorized users.
 */
export function prioritizeTestProducts(products, user) {
  if (!Array.isArray(products) || products.length <= 1) return products;
  if (!canUserAccessTestProduct(user)) return products;

  const testIndex = products.findIndex((p) => isTestDummyProduct(p));
  if (testIndex <= 0) return products;

  const testItem = products[testIndex];
  const remaining = products.filter((_, idx) => idx !== testIndex);
  return [testItem, ...remaining];
}
