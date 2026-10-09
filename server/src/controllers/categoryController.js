import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { getCache, setCache, clearCachePattern } from '../utils/cache.js';

export const getCategories = asyncHandler(async (req, res) => {
  const cacheKey = 'categories:all';
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const categories = await Category.find().sort({ name: 1 }).lean();
  // attach product counts
  const counts = await Product.aggregate([
    { $unwind: '$category' },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const withCounts = categories.map((c) => ({ ...c, productCount: countMap[String(c._id)] || 0 }));
  
  const responseData = { success: true, categories: withCounts };
  await setCache(cacheKey, responseData, 86400); // 24 hours
  res.json(responseData);
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  await clearCachePattern('categories');
  res.status(201).json({ success: true, category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  await clearCachePattern('categories');
  res.json({ success: true, category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await clearCachePattern('categories');
  res.json({ success: true, message: 'Category deleted' });
});
