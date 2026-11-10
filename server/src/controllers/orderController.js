import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { getSocket } from '../socket.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { getRazorpay, verifyPaymentSignature } from '../utils/razorpay.js';
import { createCashfreeOrder, fetchCashfreeOrder, fetchCashfreePayments } from '../utils/cashfree.js';
import notificationService from '../services/notificationService.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';
import { isTestDummyProduct, canUserAccessTestProduct } from '../utils/testProduct.js';

/**
 * Recompute the cart total from the DATABASE (never trust client prices).
 * items: [{ productId, quantity }]
 */
async function computeCart(items, couponCode) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }
  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const map = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = map.get(String(item.productId));
    if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (product.stock < qty) throw new ApiError(400, `Insufficient stock for ${product.name}`);
    const unit = product.finalPrice;
    subtotal += unit * qty;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      price: unit,
      quantity: qty,
    });
  }

  let discount = 0;
  let appliedCode;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
    if (coupon) {
      discount = coupon.computeDiscount(subtotal);
      if (discount > 0) appliedCode = coupon.code;
    }
  }

  const afterDiscount = subtotal - discount;
  
  let setting = await Setting.findOne();
  if (!setting) {
    setting = { shippingFlat: 79, freeShippingThreshold: 1499 };
  }

  // Shipping fee is waived (0) if the order consists only of dummy/test products,
  // or if the subtotal reaches the free shipping threshold.
  const regularItems = orderItems.filter((item) => !isTestDummyProduct(item));
  const shippingFee =
    regularItems.length === 0 || afterDiscount >= setting.freeShippingThreshold
      ? 0
      : setting.shippingFlat;
  const total = afterDiscount + shippingFee;

  return { orderItems, subtotal, discount, shippingFee, total, appliedCode };
}

/** POST /api/orders  — creates a pending order. */
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, couponCode, paymentMethod = 'UPI' } = req.body;
  if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.postalCode) {
    throw new ApiError(400, 'Complete shipping address is required');
  }

  const { orderItems, subtotal, discount, shippingFee, total, appliedCode } = await computeCart(
    items,
    couponCode
  );

  // Check authorization for test/dummy products
  if (orderItems.some((item) => isTestDummyProduct(item)) && !canUserAccessTestProduct(req.user)) {
    throw new ApiError(403, 'You do not have access to purchase this test product.');
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode: appliedCode,
    paymentMethod,
    paymentStatus: 'PAYMENT_PENDING',
  });

  // If Cashfree / online payment is requested, initialize payment session with Cashfree
  let paymentSessionId = null;
  let cashfreeOrderId = null;
  if (paymentMethod === 'CASHFREE' || paymentMethod === 'ONLINE') {
    try {
      const clientUrl = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173';
      const returnUrl = `${clientUrl}/checkout/success/${order._id}?cf_id={order_id}`;
      const backendUrl = process.env.BACKEND_URL;
      const notifyUrl = backendUrl && backendUrl.startsWith('https://')
        ? `${backendUrl}/api/webhooks/cashfree`
        : undefined;

      const cfResponse = await createCashfreeOrder({
        orderId: order.customOrderId,
        orderAmount: total,
        customer: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: shippingAddress.phone,
        },
        returnUrl,
        notifyUrl,
      });

      paymentSessionId = cfResponse.payment_session_id;
      cashfreeOrderId = cfResponse.order_id;

      order.cashfreeOrderId = cashfreeOrderId;
      order.cashfreePaymentSessionId = paymentSessionId;
      await order.save();
    } catch (cfErr) {
      console.error('Cashfree order creation error:', cfErr.response?.data || cfErr.message);
      await Order.findByIdAndDelete(order._id);
      const errMsg = cfErr.response?.data?.message || cfErr.message || 'Payment gateway initialization failed';
      throw new ApiError(500, `Failed to initialize Cashfree payment: ${errMsg}`);
    }
  }

  // Emit socket update to admins only (customer is only notified after successful payment)
  try {
    getSocket().to('admins').emit('order_update', { type: 'NEW_ORDER', orderId: order._id });
  } catch (err) {}

  res.status(201).json({
    success: true,
    order: {
      id: order._id,
      customOrderId: order.customOrderId,
      amount: total,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
    },
    paymentSessionId,
    cashfreeOrderId,
  });
});

/** POST /api/orders/:id/verify-cashfree — verify payment with Cashfree and confirm order. */
export const verifyCashfreePayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.paymentStatus === 'SUCCESSFUL' || order.paymentStatus === 'UTR_VERIFIED') {
    return res.json({ success: true, verified: true, order });
  }

  const cfOrderId = order.cashfreeOrderId || order.customOrderId;
  const cfOrder = await fetchCashfreeOrder(cfOrderId);

  if (cfOrder.order_status === 'PAID') {
    let cfPaymentId;
    try {
      const payments = await fetchCashfreePayments(cfOrderId);
      const successfulPayment = Array.isArray(payments)
        ? payments.find((p) => p.payment_status === 'SUCCESS')
        : null;
      if (successfulPayment) {
        cfPaymentId = String(successfulPayment.cf_payment_id);
      }
    } catch (err) {
      console.warn('Could not fetch payment details for Cashfree order:', err.message);
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of order.items) {
          const p = await Product.findOneAndUpdate(
            { _id: item.product },
            { $inc: { stock: -item.quantity } },
            { session, new: true }
          );
          if (p && p.stock <= 10) {
            try {
              const { sendBatchPushNotification } = await import('../utils/push.js');
              const PushSubscription = (await import('../models/PushSubscription.js')).default;
              const adminSubs = await PushSubscription.find({}).populate('user');
              const subsToNotify = adminSubs.filter((sub) => sub.user && sub.user.role === 'admin');
              if (subsToNotify.length > 0) {
                await sendBatchPushNotification(subsToNotify, {
                  title: 'Low Stock Alert ⚠️',
                  body: `${p.name} is running low! Only ${p.stock} left in stock.`,
                  icon: p.images[0] || '/pwa-192x192.png',
                  url: '/admin/products',
                });
              }
            } catch (err) {
              console.error('Failed to send low stock notification', err);
            }
          }
        }

        order.paymentStatus = 'SUCCESSFUL';
        order.orderStatus = 'confirmed';
        if (cfPaymentId) order.cashfreePaymentId = cfPaymentId;
        await order.save({ session });
      });
    } finally {
      session.endSession();
    }

    notificationService.notifyPaymentVerified(order).catch((err) => {
      console.error('Failed to send payment verified notifications:', err);
    });

    try {
      getSocket().to(`user_${order.user._id.toString()}`).emit('order_update', { orderId: order._id });
      getSocket().to('admins').emit('order_update', { orderId: order._id });
    } catch (err) {
      console.error('Socket emission failed:', err);
    }

    return res.json({ success: true, verified: true, order });
  } else {
    return res.json({
      success: false,
      verified: false,
      status: cfOrder.order_status,
      message: `Order status is currently ${cfOrder.order_status}`,
    });
  }
});

/** POST /api/orders/:id/utr — submit UTR number. */
export const submitUtr = asyncHandler(async (req, res) => {
  const { utrNumber } = req.body;
  if (!utrNumber || utrNumber.trim().length !== 12) {
    throw new ApiError(400, 'A valid 12-digit UTR number is required');
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus === 'SUCCESSFUL' || order.paymentStatus === 'UTR_VERIFIED') {
    throw new ApiError(400, 'Order is already verified');
  }

  order.utrNumber = utrNumber.trim();
  order.paymentStatus = 'UTR_VERIFICATION_PENDING';
  await order.save();

  try {
    getSocket().to('admins').emit('order_update', { orderId: order._id });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  res.json({ success: true, order });
});

/** GET /api/orders/mine */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// ---------------- Admin ----------------

/** GET /api/orders/pending-count (admin) */
export const getPendingOrderCount = asyncHandler(async (req, res) => {
  const count = await Order.countDocuments({
    paymentStatus: { $in: ['PAYMENT_PENDING', 'UTR_VERIFICATION_PENDING', 'UTR_MISMATCH_RETRY'] },
    orderStatus: { $nin: ['cancelled', 'delivered'] }
  });
  res.json({ success: true, count });
});

/** GET /api/orders  (admin) — all orders, newest first, optional status filter. */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

/** PATCH /api/orders/:id/status  (admin) */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const allowed = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(orderStatus)) throw new ApiError(400, 'Invalid order status');

  const updateData = { orderStatus: req.body.orderStatus };
  if (orderStatus === 'delivered') {
    updateData.deliveredAt = new Date();
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  ).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  try {
    getSocket().to('admins').emit('order_update', { type: 'STATUS_UPDATE', orderId: order._id });
    getSocket().to(`user_${order.user}`).emit('order_update', { type: 'STATUS_UPDATE', orderId: order._id });
  } catch (err) {}

  let title = 'Order Status Updated';
  let body = `Your order ${order.customOrderId} is now ${orderStatus}.`;
  
  if (orderStatus === 'shipped') {
    title = 'Wow! Your Order Has Shipped!! 🚚✨';
    body = `Great news! Your order ${order.customOrderId} is on its way to you.`;
  } else if (orderStatus === 'delivered') {
    title = "It's Here! Your package has arrived! 🎁";
    body = `Your order ${order.customOrderId} has been delivered. Enjoy!`;
  }
  
  // Send Notifications
  notificationService.notifyOrderStatusUpdate(order, orderStatus).catch(err => {
    console.error('Failed to send order status notifications:', err);
  });

  try {
    getSocket().to('admins').emit('order_update', { orderId: order._id });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  res.json({ success: true, order });
});

/** PATCH /api/orders/:id/verify-utr (admin) */
export const verifyUtr = asyncHandler(async (req, res) => {
  const { verified, adminUtr } = req.body; // boolean, string

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.paymentStatus === 'SUCCESSFUL' || order.paymentStatus === 'UTR_VERIFIED') {
    return res.json({ success: true, order });
  }

  const session = await mongoose.startSession();
  try {
    if (verified) {
      if (adminUtr !== order.utrNumber) {
        throw new ApiError(400, 'UTR Number mismatch. Please verify again.');
      }
      
      await session.withTransaction(async () => {
        for (const item of order.items) {
          const p = await Product.findOneAndUpdate(
            { _id: item.product },
            { $inc: { stock: -item.quantity } },
            { session, new: true }
          );
          // Check for Low Stock
          if (p && p.stock <= 10) {
            try {
              const { sendBatchPushNotification } = await import('../utils/push.js');
              const PushSubscription = (await import('../models/PushSubscription.js')).default;
              const adminSubs = await PushSubscription.find({}).populate('user');
              const subsToNotify = adminSubs.filter(sub => sub.user && sub.user.role === 'admin');
              if (subsToNotify.length > 0) {
                await sendBatchPushNotification(subsToNotify, {
                  title: 'Low Stock Alert ⚠️',
                  body: `${p.name} is running low! Only ${p.stock} left in stock.`,
                  icon: p.images[0] || '/pwa-192x192.png',
                  url: '/admin/products'
                });
              }
            } catch (err) {
              console.error('Failed to send low stock notification', err);
            }
          }
        }
        order.paymentStatus = 'UTR_VERIFIED';
        order.orderStatus = 'confirmed';
        await order.save({ session });
      });

      notificationService.notifyPaymentVerified(order).catch(err => {
        console.error('Failed to send payment verified notifications:', err);
      });
    } else {
      if (!order.utrEdited) {
        // First rejection: give them a chance to edit
        order.paymentStatus = 'UTR_MISMATCH_RETRY';
        order.utrNumber = undefined;
        await order.save();

        notificationService.notifyUtrRejected(order).catch(e => console.error(e));
      } else {
        // Second rejection: cancel order
        order.paymentStatus = 'FAILED';
        order.orderStatus = 'cancelled';
        await order.save();

        notificationService.notifyOrderStatusUpdate(order, 'cancelled').catch(e => console.error(e));
      }
    }
  } catch (err) {
    throw err;
  } finally {
    session.endSession();
  }

  try {
    getSocket().to(`user_${order.user._id.toString()}`).emit('order_update', { orderId: order._id });
    getSocket().to('admins').emit('order_update', { orderId: order._id });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  res.json({ success: true, order });
});

/** PUT /api/orders/:id/edit-utr */
export const editUtr = asyncHandler(async (req, res) => {
  const { utrNumber } = req.body;
  if (!utrNumber) throw new ApiError(400, 'UTR number is required');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not allowed');
  }

  if (order.utrEdited) {
    throw new ApiError(400, 'You have already edited your UTR number once.');
  }

  order.utrNumber = utrNumber;
  order.paymentStatus = 'UTR_VERIFICATION_PENDING';
  order.utrEdited = true;
  await order.save();

  try {
    getSocket().to('admins').emit('order_update', { orderId: order._id });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  res.json({ success: true, order });
});

/** GET /api/orders/:id */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not allowed');
  }
  res.json({ success: true, order });
});

/** GET /api/orders/track/:customOrderId */
export const trackOrder = asyncHandler(async (req, res) => {
  const { customOrderId } = req.params;
  const order = await Order.findOne({ customOrderId: customOrderId.toUpperCase() });
  
  if (!order) {
    throw new ApiError(404, 'Order not found. Please check your Order ID.');
  }

  res.json({
    success: true,
    tracking: {
      customOrderId: order.customOrderId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        name: item.name,
        image: item.image,
        quantity: item.quantity
      }))
    }
  });
});

/** POST /api/orders/:id/request-return (user) */
export const requestReturnExchange = asyncHandler(async (req, res) => {
  const { actionType, reason } = req.body;
  
  if (!['return', 'exchange'].includes(actionType)) {
    throw new ApiError(400, 'Invalid action type');
  }
  if (!reason || reason.trim().length === 0) {
    throw new ApiError(400, 'Reason is required');
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.orderStatus !== 'delivered') {
    throw new ApiError(400, 'You can only request a return or exchange for delivered orders');
  }

  if (order.returnExchange && order.returnExchange.status !== 'rejected') {
    throw new ApiError(400, 'A request has already been submitted for this order');
  }

  const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
  const diffTime = Math.abs(new Date() - deliveredDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays > 7) {
    throw new ApiError(400, 'The 7-day return/exchange window has expired for this order');
  }

  order.returnExchange = {
    actionType,
    reason,
    status: 'pending',
    requestedAt: new Date()
  };

  await order.save();

  try {
    getSocket().to('admins').emit('order_update', { type: 'RETURN_REQUESTED', orderId: order._id });
  } catch (err) {}

  res.json({ success: true, order });
});

/** PATCH /api/orders/:id/return-status (admin) */
export const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  
  if (!['approved', 'rejected', 'completed'].includes(status)) {
    throw new ApiError(400, 'Invalid return status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (!order.returnExchange) {
    throw new ApiError(400, 'No return/exchange request exists for this order');
  }

  order.returnExchange.status = status;
  if (adminNote) {
    order.returnExchange.adminNote = adminNote;
  }

  await order.save();

  let title = `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  let body = `Your ${order.returnExchange.actionType} request for order ${order.customOrderId} has been ${status}.`;

  await Notification.create({
    user: order.user,
    title,
    message: body,
    link: `/account?tab=orders`,
  });

  try {
    getSocket().to(`user_${order.user.toString()}`).emit('order_update', { orderId: order._id });
    getSocket().to('admins').emit('order_update', { orderId: order._id });
  } catch (err) {}

  res.json({ success: true, order });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name');

  if (!order) throw new ApiError(404, 'Order not found');
  
  if (req.user.role !== 'admin' && String(order.user._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Not authorized');
  }

  const inline = req.query.action === 'view';
  generateInvoice(order, res, inline);
});
