import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { getCache, setCache, clearCachePattern } from '../utils/cache.js';

/**
 * GET /api/products
 * Supports: search, category (slug), material, color, minPrice, maxPrice,
 * inStock, sort, page, limit.
 */
export const getProducts = asyncHandler(async (req, res) => {
  const cacheKey = `products:${req.originalUrl}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const {
    search,
    category,
    material,
    color,
    minPrice,
    maxPrice,
    inStock,
    sort = 'newest',
    page = 1,
    limit = 12,
    featured,
    ids,
  } = req.query;

  const filter = {};

  if (ids) {
    const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (idArray.length > 0) {
      filter._id = { $in: idArray };
    }
  }

  if (search) filter.$text = { $search: search };
  if (material) filter.material = new RegExp(`^${material}$`, 'i');
  if (color) filter.color = new RegExp(`^${color}$`, 'i');
  if (featured) filter.featured = featured === 'true';
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
    else return res.json({ success: true, products: [], total: 0, page: 1, pages: 0 });
  }

  const sortMap = {
    newest: { createdAt: -1 },
    popular: { reviewCount: -1, rating: -1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
    rating: { rating: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(48, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  const responseData = {
    success: true,
    products,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  };

  await setCache(cacheKey, responseData, 3600);
  res.json(responseData);
});

export const getFeatured = asyncHandler(async (req, res) => {
  const cacheKey = 'products:featured';
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const products = await Product.find({ featured: true })
    .populate('category', 'name slug')
    .limit(8);
    
  const responseData = { success: true, products };
  await setCache(cacheKey, responseData, 3600);
  res.json(responseData);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `products:slug:${req.params.slug}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const product = await Product.findOne({ slug: req.params.slug }).populate(
    'category',
    'name slug'
  );
  if (!product) throw new ApiError(404, 'Product not found');

  const categoryIds = product.category.map(c => c._id);
  const related = await Product.find({
    category: { $in: categoryIds },
    _id: { $ne: product._id },
  })
    .limit(4)
    .populate('category', 'name slug');

  const responseData = { success: true, product, related };
  await setCache(cacheKey, responseData, 3600);
  res.json(responseData);
});

// ---- Admin ----
const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.slug && data.name) data.slug = slugify(data.name);
  if (data.slug && (await Product.exists({ slug: data.slug }))) {
    data.slug = `${data.slug}-${Date.now().toString(36).slice(-4)}`;
  }
  const product = await Product.create(data);
  await clearCachePattern('products');
  await clearCachePattern('categories');

  // Dispatch Social Media Webhook if requested and at least one platform is selected
  if (data.postToSocials && process.env.MAKE_WEBHOOK_URL && (data.postToInstagram || data.postToFacebook || data.postToX)) {
    try {
      fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          productLink: `${process.env.CLIENT_URL || process.env.FRONTEND_URL}/product/${product.slug}`,
          caption: data.socialCaption,
          images: product.images.map(img => img.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? img : `${img}.jpg`),
          coverImage: product.images && product.images.length > 0 ? (product.images[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? product.images[0] : `${product.images[0]}.jpg`) : '',
          platforms: {
            instagram: !!data.postToInstagram,
            facebook: !!data.postToFacebook,
            x: !!data.postToX,
          }
        })
      }).catch(err => console.error('Social webhook failed:', err));
    } catch (e) {
      console.error('Failed to trigger social webhook:', e);
    }
  }

  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const oldProduct = await Product.findById(req.params.id);
  if (!oldProduct) throw new ApiError(404, 'Product not found');

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Dispatch Social Media Webhook if requested and at least one platform is selected
  if (req.body.postToSocials && process.env.MAKE_WEBHOOK_URL && (req.body.postToInstagram || req.body.postToFacebook || req.body.postToX)) {
    try {
      fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          productLink: `${process.env.CLIENT_URL || process.env.FRONTEND_URL}/product/${product.slug}`,
          caption: req.body.socialCaption,
          images: product.images.map(img => img.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? img : `${img}.jpg`),
          coverImage: product.images && product.images.length > 0 ? (product.images[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? product.images[0] : `${product.images[0]}.jpg`) : '',
          platforms: {
            instagram: !!req.body.postToInstagram,
            facebook: !!req.body.postToFacebook,
            x: !!req.body.postToX,
          }
        })
      }).catch(err => console.error('Social webhook failed on update:', err));
    } catch (e) {
      console.error('Failed to trigger social webhook on update:', e);
    }
  }

  // Back in stock notification
  if (oldProduct.stock === 0 && product.stock > 0) {
    const BackInStock = (await import('../models/BackInStock.js')).default;
    const { sendBatchEmail } = await import('../utils/sendEmail.js');
    
    const subscriptions = await BackInStock.find({ product: product._id, notified: false });
    
    if (subscriptions.length > 0) {
      const emailsData = subscriptions.map((sub) => ({
        to: sub.email,
        subject: `Back in Stock: ${product.name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Good news!</h2>
            <p><strong>${product.name}</strong> is now back in stock.</p>
            <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/product/${product.slug}" style="display:inline-block; padding: 10px 20px; background-color: #4A3C31; color: #fff; text-decoration: none; border-radius: 5px;">Shop Now</a></p>
          </div>
        `,
        text: `${product.name} is back in stock! Shop now at ${process.env.CLIENT_URL || 'http://localhost:5173'}/product/${product.slug}`,
      }));

      await sendBatchEmail(emailsData);
      
      await BackInStock.updateMany(
        { _id: { $in: subscriptions.map(s => s._id) } },
        { $set: { notified: true } }
      );
    }
  }

  await clearCachePattern('products');
  await clearCachePattern('categories');
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await clearCachePattern('products');
  await clearCachePattern('categories');
  res.json({ success: true, message: 'Product deleted' });
});

export const subscribeBackInStock = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock > 0) throw new ApiError(400, 'Product is already in stock');

  const BackInStock = (await import('../models/BackInStock.js')).default;
  
  const existing = await BackInStock.findOne({ email, product: product._id, notified: false });
  if (existing) {
    return res.json({ success: true, message: 'Already subscribed' });
  }

  await BackInStock.create({ email, product: product._id });
  res.status(201).json({ success: true, message: 'Subscribed successfully' });
});

/**
 * GET /api/products/:id/also-bought
 * Returns products frequently bought with the given product.
 */
export const getAlsoBought = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Find orders containing this product
  const orders = await Order.find({ 'items.product': id }).select('items.product').lean();
  
  if (!orders || orders.length === 0) {
    return res.json([]);
  }

  // Count frequencies of other products
  const productCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const pid = item.product.toString();
      if (pid !== id) {
        productCounts[pid] = (productCounts[pid] || 0) + 1;
      }
    });
  });

  // Sort by frequency and get top 4
  const topProductIds = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(entry => entry[0]);

  if (topProductIds.length === 0) {
    return res.json([]);
  }

  const relatedProducts = await Product.find({ _id: { $in: topProductIds }, stock: { $gt: 0 } }).lean();
  res.json(relatedProducts);
});
