import cron from 'node-cron';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './sendEmail.js';
import { getAbandonedCartTemplate } from './emailTemplates.js';

let tasks = [];

export const initCronJobs = () => {
  // Run every 5 minutes
  const t1 = cron.schedule('*/5 * * * *', async () => {
    try {
      // Find orders that are PAYMENT_PENDING and created more than 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const expiredOrders = await Order.find({
        paymentStatus: 'PAYMENT_PENDING',
        createdAt: { $lt: fiveMinutesAgo }
      });

      if (expiredOrders.length > 0) {
        console.log(`[CRON] Found ${expiredOrders.length} expired payment-pending orders. Cancelling them...`);
        
        for (const order of expiredOrders) {
          order.paymentStatus = 'FAILED';
          order.orderStatus = 'cancelled';
          await order.save();
          
          await Notification.create({
            user: order.user,
            title: 'Order Expired',
            message: `Your payment window for order #${order.customOrderId} expired. The order has been cancelled.`,
            link: `/account?tab=orders`,
          });
          
          console.log(`[CRON] Cancelled order #${order.customOrderId}`);
        }
      }
    } catch (error) {
      console.error('[CRON] Error checking for expired orders:', error);
    }
  });
  
  // Run every day at 10:00 AM for abandoned carts
  const t2 = cron.schedule('0 10 * * *', async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const abandonedUsers = await User.find({
        'cart.0': { $exists: true }, // cart is not empty
        updatedAt: { $lt: oneDayAgo },
        $or: [
          { cartReminderSentAt: { $exists: false } },
          { cartReminderSentAt: null },
          { cartReminderSentAt: { $lt: sevenDaysAgo } }
        ]
      });

      if (abandonedUsers.length > 0) {
        console.log(`[CRON] Found ${abandonedUsers.length} abandoned carts. Sending emails...`);
        for (const user of abandonedUsers) {
          if (!user.email) continue;
          try {
            await sendEmail({
              email: user.email,
              subject: "Did you forget something?",
              html: getAbandonedCartTemplate(user.name.split(' ')[0], 'COMEBACK5')
            });
            user.cartReminderSentAt = new Date();
            await user.save();
          } catch (e) {
            console.error(`Failed to send abandoned cart email to ${user.email}:`, e);
          }
        }
      }
    } catch (error) {
      console.error('[CRON] Error processing abandoned carts:', error);
    }
  });

  tasks.push(t1, t2);

  console.log('[CRON] Jobs initialized.');
};

export const stopCronJobs = () => {
  tasks.forEach(t => t.stop());
  tasks = [];
};
