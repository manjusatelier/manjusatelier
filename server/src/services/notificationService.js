import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { getSocket } from '../socket.js';
import { sendEmail } from '../utils/sendEmail.js';
import { getOrderReceivedTemplate, getOrderShippedTemplate, getOrderDeliveredTemplate, getOrderCancelledTemplate, getPaymentVerifiedTemplate } from '../utils/emailTemplates.js';

/**
 * Service to handle all order-related notifications (Email, In-App, Push, Socket)
 */
class NotificationService {
  /**
   * Helper to send push notifications dynamically
   */
  async _sendPush(userId, payload) {
    try {
      const { sendPushToUser } = await import('../utils/push.js');
      await sendPushToUser(userId, payload);
    } catch (err) {
      console.error('Push notification failed:', err);
    }
  }

  async _getUserEmail(userId) {
    const user = await mongoose.model('User').findById(userId);
    return user?.email;
  }

  /**
   * Notify about a new order
   */
  async notifyOrderReceived(order) {
    const email = await this._getUserEmail(order.user);
    
    if (email) {
      await sendEmail({
        email,
        subject: `Yay! We got your order! 🎉 - #${order.customOrderId}`,
        html: getOrderReceivedTemplate(order)
      }).catch(e => console.error('Email failed:', e));
    }

    await Notification.create({
      user: order.user,
      title: 'Yay! We got your order! 🎉',
      message: `Thank you for your order #${order.customOrderId}. Please complete your UPI payment.`,
      link: `/account?tab=orders`,
    }).catch(e => console.error('In-app notification failed:', e));

    await this._sendPush(order.user, {
      title: 'Order Received 🎉',
      body: `We have received your order #${order.customOrderId}.`,
      icon: '/pwa-192x192.png',
      url: '/account?tab=orders'
    });

    try {
      getSocket().to('admins').emit('order_update', { type: 'NEW_ORDER', orderId: order._id });
    } catch (err) {
      console.error('Socket admin notification failed:', err);
    }
  }

  /**
   * Notify about order status updates (shipped, delivered, cancelled)
   */
  async notifyOrderStatusUpdate(order, status) {
    const email = order.user?.email || await this._getUserEmail(order.user);
    
    let subject = '';
    let html = '';
    let title = '';
    let body = '';
    
    if (status === 'shipped') {
      subject = `Your order #${order.customOrderId} has been shipped! 🚚`;
      html = getOrderShippedTemplate(order);
      title = 'Order Shipped 🚚';
      body = `Your order #${order.customOrderId} is on its way.`;
    } else if (status === 'delivered') {
      subject = `Your order #${order.customOrderId} has been delivered! 🎁`;
      html = getOrderDeliveredTemplate(order);
      title = 'Order Delivered 🎁';
      body = `Your order #${order.customOrderId} has been delivered.`;
    } else if (status === 'cancelled') {
      subject = `Order #${order.customOrderId} Cancelled`;
      html = getOrderCancelledTemplate(order);
      title = 'Order Cancelled';
      body = `Your order #${order.customOrderId} has been cancelled.`;
    } else {
      return; // No notification for other statuses
    }

    if (email) {
      await sendEmail({ email, subject, html }).catch(e => console.error('Email failed:', e));
    }

    await Notification.create({
      user: order.user._id || order.user,
      title,
      message: body,
      link: `/account?tab=orders`,
    }).catch(e => console.error('In-app notification failed:', e));

    await this._sendPush(order.user._id || order.user, {
      title,
      body,
      icon: '/pwa-192x192.png',
      url: '/account?tab=orders'
    });

    try {
      const userIdStr = (order.user._id || order.user).toString();
      getSocket().to(`user_${userIdStr}`).emit('order_update', {
        orderId: order._id,
        status,
        customOrderId: order.customOrderId,
        type: 'STATUS_UPDATE',
      });
    } catch (e) {
      console.error('Socket user notification failed:', e);
    }
  }

  /**
   * Notify about UTR verification (Payment verified)
   */
  async notifyPaymentVerified(order) {
    const email = order.user?.email || await this._getUserEmail(order.user);

    if (email) {
      await sendEmail({
        email,
        subject: `Order Confirmed! 🎉 - #${order.customOrderId}`,
        html: getPaymentVerifiedTemplate(order)
      }).catch(e => console.error('Email failed:', e));
    }

    await Notification.create({
      user: order.user._id || order.user,
      title: 'Order Confirmed! 🎉',
      message: `Your payment for order #${order.customOrderId} was successful and your order is confirmed.`,
      link: `/account?tab=orders`,
    }).catch(e => console.error('In-app notification failed:', e));

    await this._sendPush(order.user._id || order.user, {
      title: 'Order Confirmed 🎉',
      body: `Your payment for order #${order.customOrderId} was successful and your order is confirmed!`,
      icon: '/pwa-192x192.png',
      url: '/account?tab=orders'
    });

    try {
      const userIdStr = (order.user._id || order.user).toString();
      getSocket().to(`user_${userIdStr}`).emit('order_update', {
        orderId: order._id,
        status: order.paymentStatus,
        customOrderId: order.customOrderId,
        type: 'PAYMENT_UPDATE',
      });
    } catch (e) {
      console.error('Socket user notification failed:', e);
    }
  }
  /**
   * Notify about UTR Rejection
   */
  async notifyUtrRejected(order) {
    await Notification.create({
      user: order.user._id || order.user,
      title: 'UTR Rejected',
      message: `The UTR for order ${order.customOrderId} was rejected. Please check and enter the correct UTR (you have one edit left).`,
      link: `/account?tab=orders`,
    }).catch(e => console.error('In-app notification failed:', e));

    await this._sendPush(order.user._id || order.user, {
      title: 'Action Required: UTR Rejected',
      body: `The UTR for order ${order.customOrderId} was rejected. Please update it.`,
      icon: '/pwa-192x192.png',
      url: '/account?tab=orders'
    });

    try {
      getSocket().to('admins').emit('order_update', { type: 'UTR_REJECTED', orderId: order._id });
      getSocket().to(`user_${(order.user._id || order.user).toString()}`).emit('order_update', { type: 'UTR_REJECTED', orderId: order._id });
    } catch (e) {
      console.error('Socket notification failed:', e);
    }
  }
}

export default new NotificationService();
