import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { deleteReview, getRecentReviews, createOfflineReview, getPendingReviews, updateReviewStatus } from '../controllers/reviewController.js';

const router = Router();

router.get('/recent', getRecentReviews);
router.post('/offline', upload.single('image'), createOfflineReview);
router.get('/pending', protect, adminOnly, getPendingReviews);
router.patch('/:id/status', protect, adminOnly, updateReviewStatus);
router.delete('/:id', protect, deleteReview);

export default router;
