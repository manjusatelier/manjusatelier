import { Router } from 'express';
import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { verifyWebhookSignature } from '../utils/razorpay.js';
import { verifyCashfreeWebhook } from '../utils/cashfree.js';
import notificationService from '../services/notificationService.js';

const router = Router();

/**
 * Cashfree webhook. Uses raw body & timestamp for HMAC-SHA256 signature verification.
 * Configure this URL in Cashfree Merchant Dashboard -> Payment Gateway -> Developers -> Webhooks
 * URL: https://yourdomain.com/api/webhooks/cashfree
 */
router.post('/cashfree', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const rawBody = req.body; // Buffer

  if (!verifyCashfreeWebhook(signature, rawBody, timestamp)) {
    return res.status(400).json({ success: false, message: 'Invalid Cashfree webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  try {
    const eventType = event.type || event.event;
    const orderData = event.data?.order;
    const paymentData = event.data?.payment;

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'ORDER_PAID') {
      const cfOrderId = orderData?.order_id;
      if (cfOrderId) {
        const order = await Order.findOne({
          $or: [{ cashfreeOrderId: cfOrderId }, { customOrderId: cfOrderId }],
        });

        if (order && order.paymentStatus !== 'SUCCESSFUL' && order.paymentStatus !== 'UTR_VERIFIED') {
          for (const item of order.items) {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
          }
          order.paymentStatus = 'SUCCESSFUL';
          order.orderStatus = 'confirmed';
          if (paymentData?.cf_payment_id) {
            order.cashfreePaymentId = String(paymentData.cf_payment_id);
          }
          await order.save();

          notificationService.notifyPaymentVerified(order).catch((err) => {
            console.error('Failed to send Cashfree webhook payment notification:', err);
          });
        }
      }
    } else if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
      const cfOrderId = orderData?.order_id;
      if (cfOrderId) {
        await Order.updateOne(
          {
            $or: [{ cashfreeOrderId: cfOrderId }, { customOrderId: cfOrderId }],
            paymentStatus: { $nin: ['SUCCESSFUL', 'UTR_VERIFIED'] },
          },
          { paymentStatus: 'FAILED' }
        );
      }
    }
  } catch (err) {
    console.error('Cashfree webhook processing error:', err.message);
  }

  // Always 200 so Cashfree acknowledges delivery
  res.json({ success: true });
});

/**
 * Razorpay webhook. Uses the raw body for signature verification.
 * Configure this URL in the Razorpay dashboard.
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  try {
    if (event.event === 'payment.captured') {
      const rzpOrderId = event.payload.payment.entity.order_id;
      const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
      if (order && order.paymentStatus !== 'paid') {
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
        }
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.razorpayPaymentId = event.payload.payment.entity.id;
        await order.save();
      }
    } else if (event.event === 'payment.failed') {
      const rzpOrderId = event.payload.payment.entity.order_id;
      await Order.updateOne({ razorpayOrderId: rzpOrderId }, { paymentStatus: 'failed' });
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }

  // Always 200 so Razorpay stops retrying once received.
  res.json({ success: true });
});

export default router;
