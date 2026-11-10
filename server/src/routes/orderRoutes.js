import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createOrder,
  submitUtr,
  verifyCashfreePayment,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  verifyUtr,
  editUtr,
  trackOrder,
  getPendingOrderCount,
  requestReturnExchange,
  updateReturnStatus,
  getInvoice
} from '../controllers/orderController.js';

const router = Router();

router.get('/track/:customOrderId', trackOrder);

router.use(protect); // all order routes require auth

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('paymentMethod').optional().isIn(['UPI', 'COD', 'CASHFREE', 'ONLINE']).withMessage('Invalid payment method')
  ],
  validate,
  createOrder
);

router.post('/:id/verify-cashfree', verifyCashfreePayment);

router.post(
  '/:id/utr',
  [body('utrNumber').isLength({ min: 12, max: 12 }).isNumeric().withMessage('UTR must be 12 digits')],
  validate,
  submitUtr
);

router.put(
  '/:id/edit-utr',
  [body('utrNumber').isLength({ min: 12, max: 12 }).isNumeric().withMessage('UTR must be 12 digits')],
  validate,
  editUtr
);
router.get('/mine', getMyOrders);
router.post('/:id/request-return', requestReturnExchange);

// Admin
router.get('/pending-count', adminOnly, getPendingOrderCount);
router.get('/', adminOnly, getAllOrders);
router.patch('/:id/status', adminOnly, updateOrderStatus);
router.patch('/:id/verify-utr', adminOnly, verifyUtr);
router.patch('/:id/return-status', adminOnly, updateReturnStatus);

router.get('/:id/invoice', getInvoice);
router.get('/:id', getOrder);

export default router;
