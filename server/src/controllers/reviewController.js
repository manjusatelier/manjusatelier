import mongoose from 'mongoose';
import Review from '../models/Review.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { checkFoulLanguage } from '../utils/aiModeration.js';

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'approved' }).sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

/** GET /api/reviews/recent — latest reviews across all products (for testimonials). */
export const getRecentReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(12, Number(req.query.limit) || 6);
  const reviews = await Review.find({ comment: { $exists: true, $ne: '' }, status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('product', 'name slug images');
  res.json({ success: true, reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw new ApiError(409, 'You already reviewed this product');

  const isFoul = await checkFoulLanguage(comment);
  if (isFoul) {
    throw new ApiError(400, 'Such words are prohibited. Please use appropriate language - we understand you received some damaged product or we did not meet your expectations. We are sorry for that but be respectful.');
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
    status: 'approved',
  });

  res.status(201).json({ success: true, review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not allowed');
  }
  await Review.findOneAndDelete({ _id: review._id });
  res.json({ success: true, message: 'Review deleted' });
});

export const createOfflineReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, name } = req.body;
  if (!productId || !rating || !name) {
    throw new ApiError(400, 'Product, rating, and name are required');
  }

  let imageUrl = undefined;
  if (req.file) {
    imageUrl = req.file.path;
  }

  const isFoul = await checkFoulLanguage(comment);
  if (isFoul) {
    throw new ApiError(400, 'Such words are prohibited. Please use appropriate language - we understand you received some damaged product or we did not meet your expectations. We are sorry for that but be respectful.');
  }

  const review = await Review.create({
    product: productId,
    user: new mongoose.Types.ObjectId(), // fake user ID for offline to bypass unique index
    name,
    rating,
    comment,
    image: imageUrl,
    status: 'approved',
  });

  res.status(201).json({ success: true, review });
});

// Admin endpoint to get pending reviews
export const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('product', 'name');
  res.json({ success: true, reviews });
});

// Admin endpoint to approve a review
export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  review.status = status;
  await review.save(); // triggers recalcProductRating if approved

  res.json({ success: true, review });
});
