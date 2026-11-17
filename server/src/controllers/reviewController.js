import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import SecurityIncident from '../models/SecurityIncident.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { checkFoulLanguage, moderateReviewImage } from '../utils/aiModeration.js';
import { getClientIp, lookupIpLocation } from '../utils/geoIp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { getSecurityIncidentAlertEmail } from '../utils/emailTemplates.js';

/**
 * Common interception helper when review image is flagged by AI.
 * Logs incident to database, shreds image from CDN, and emails manjusatelier@gmail.com.
 */
async function interceptObsceneReview({
  req,
  imageUrl,
  cloudinaryPublicId,
  productId,
  productName,
  comment,
  rating,
  user,
  userName,
  userEmail,
  moderationResult,
}) {
  console.error(`🚨 [SECURITY INCIDENT] Obscene review upload blocked: ${moderationResult.reason}`);

  // 1. Delete the image from Cloudinary storage immediately
  if (cloudinaryPublicId) {
    try {
      const { v2: cloudinary } = await import('cloudinary');
      await cloudinary.uploader.destroy(cloudinaryPublicId);
      console.log(`[SECURITY] Shredded flagged image from Cloudinary: ${cloudinaryPublicId}`);
    } catch (err) {
      console.warn('Could not delete flagged image from Cloudinary:', err.message);
    }
  }

  // 2. Extract client IP and resolve physical geolocation
  const ip = getClientIp(req);
  const location = await lookupIpLocation(ip);

  // 3. Record incident in separate SecurityIncident table
  const incident = await SecurityIncident.create({
    incidentType: 'OBSCENE_IMAGE_REVIEW',
    user: user?._id || undefined,
    userName: userName || user?.name || 'Anonymous User',
    userEmail: userEmail || user?.email || 'Not provided',
    ipAddress: ip,
    location,
    userAgent: req.headers['user-agent'] || '',
    product: productId || undefined,
    productName: productName || 'N/A',
    reviewComment: comment || '',
    reviewRating: rating,
    flaggedImageUrl: imageUrl,
    cloudinaryPublicId,
    aiVerdict: moderationResult.verdict || 'UNSAFE',
    aiReason: moderationResult.reason || 'Image contains obscene, sexually explicit, or prohibited content.',
    aiCategories: moderationResult.categories || ['prohibited_content'],
    aiConfidence: moderationResult.confidence,
    aiModelUsed: moderationResult.modelUsed || 'OpenRouter Vision',
    emailSentTo: 'manjusatelier@gmail.com',
  });

  // 4. Send immediate high-priority alert email to manjusatelier@gmail.com
  try {
    await sendEmail({
      email: 'manjusatelier@gmail.com',
      subject: `🚨 [SECURITY ALERT] Obscene/Prohibited Content Blocked on Review Submission (${location.city || 'Unknown'})`,
      html: getSecurityIncidentAlertEmail(incident),
    });
    console.log('[SECURITY] Alert email sent immediately to manjusatelier@gmail.com');
  } catch (err) {
    console.error('Failed to send security alert email to manjusatelier@gmail.com:', err);
  }

  // 5. Fail the request with a strict zero-tolerance violation error
  throw new ApiError(
    400,
    'Security Alert: The uploaded image violates our strict community standards and has been blocked. Your IP address and network footprint have been recorded.'
  );
}

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

  const productDoc = await Product.findById(productId).select('name');
  const productName = productDoc?.name || 'Handcrafted Craft Item';

  // 1. Text foul language analysis
  const moderationResult = await checkFoulLanguage(comment);
  if (moderationResult === 'FOUL') {
    throw new ApiError(
      400,
      'Such words are prohibited. Please use appropriate language - we understand you received some damaged product or we did not meet your expectations. We are sorry for that but be respectful.'
    );
  }

  // 2. AI Image Vision Verification (Zero Tolerance)
  let imageUrl = undefined;
  let cloudinaryPublicId = undefined;
  if (req.file) {
    imageUrl = req.file.path;
    cloudinaryPublicId = req.file.filename;

    const imgModeration = await moderateReviewImage({
      imageUrl,
      mimeType: req.file.mimetype,
    });

    if (!imgModeration.isSafe) {
      await interceptObsceneReview({
        req,
        imageUrl,
        cloudinaryPublicId,
        productId,
        productName,
        comment,
        rating: Number(rating),
        user: req.user,
        userName: req.user.name,
        userEmail: req.user.email,
        moderationResult: imgModeration,
      });
    }
  }

  const reviewStatus = moderationResult === 'CLEAN' ? 'approved' : 'pending';

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
    image: imageUrl,
    status: reviewStatus,
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
  const { productId, rating, comment, name, email } = req.body;
  if (!productId || !rating || !name) {
    throw new ApiError(400, 'Product, rating, and name are required');
  }

  const productDoc = await Product.findById(productId).select('name');
  const productName = productDoc?.name || 'Handcrafted Craft Item';

  // 1. Text foul language analysis
  const moderationResult = await checkFoulLanguage(comment);
  if (moderationResult === 'FOUL') {
    throw new ApiError(
      400,
      'Such words are prohibited. Please use appropriate language - we understand you received some damaged product or we did not meet your expectations. We are sorry for that but be respectful.'
    );
  }

  // 2. AI Image Vision Verification (Zero Tolerance)
  let imageUrl = undefined;
  let cloudinaryPublicId = undefined;
  if (req.file) {
    imageUrl = req.file.path;
    cloudinaryPublicId = req.file.filename;

    const imgModeration = await moderateReviewImage({
      imageUrl,
      mimeType: req.file.mimetype,
    });

    if (!imgModeration.isSafe) {
      await interceptObsceneReview({
        req,
        imageUrl,
        cloudinaryPublicId,
        productId,
        productName,
        comment,
        rating: Number(rating),
        user: null,
        userName: name,
        userEmail: email || 'Offline Customer',
        moderationResult: imgModeration,
      });
    }
  }

  const reviewStatus = moderationResult === 'CLEAN' ? 'approved' : 'pending';

  const review = await Review.create({
    product: productId,
    user: new mongoose.Types.ObjectId(), // fake user ID for offline to bypass unique index
    name,
    rating: Number(rating),
    comment,
    image: imageUrl,
    status: reviewStatus,
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

// Admin endpoint to approve/reject a review
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

// Admin endpoint to fetch blocked security incidents
export const getSecurityIncidents = asyncHandler(async (req, res) => {
  const incidents = await SecurityIncident.find()
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, incidents });
});
