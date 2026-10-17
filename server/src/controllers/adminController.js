import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import PushSubscription from '../models/PushSubscription.js';
import { asyncHandler } from '../middleware/error.js';

const LOW_STOCK_THRESHOLD = 5;

/** GET /api/admin/stats — overview metrics for the dashboard. */
export const getStats = asyncHandler(async (req, res) => {
  const [revenueAgg, totalOrders, paidOrders, pendingOrders, productCount, customerCount, lowStock, recentOrders] =
    await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: { $in: ['UTR_VERIFIED', 'SUCCESSFUL'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.countDocuments({ orderStatus: 'processing' }),
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
        .select('name stock slug images')
        .sort({ stock: 1 })
        .limit(10),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  res.json({
    success: true,
    stats: {
      revenue: revenueAgg[0]?.total || 0,
      totalOrders,
      paidOrders,
      pendingOrders,
      productCount,
      customerCount,
      lowStock,
      recentOrders,
    },
  });
});

/** GET /api/admin/customers — get all customers with their order stats. */
export const getCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const match = { role: 'user' };
  if (search) {
    match.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const [customers, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          createdAt: 1,
          orderCount: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $in: ['$$order.paymentStatus', ['UTR_VERIFIED', 'SUCCESSFUL', 'paid']] }
                  }
                },
                as: 'validOrder',
                in: '$$validOrder.total'
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]),
    User.countDocuments(match)
  ]);

  res.json({
    success: true,
    customers,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  });
});

/** POST /api/admin/upload — single image upload (multer sets req.file). */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // With Cloudinary Storage, the remote URL is stored in req.file.path
  res.status(201).json({ success: true, url: req.file.path });
});

/** POST /api/admin/marketing/broadcast — Send a promotional email and push to all opted-in users. */
export const sendBroadcastEmail = asyncHandler(async (req, res) => {
  const { title, content, couponCode, discountPercentage } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  // Fetch all users who opted in and all push subscriptions concurrently
  const [users, pushSubscriptions] = await Promise.all([
    User.find({ 'emailPreferences.promotional': true }).select('email'),
    PushSubscription.find()
  ]);

  if (users.length === 0 && pushSubscriptions.length === 0) {
    return res.json({ success: true, message: 'No opted-in users or push subscribers found' });
  }

  // 1. Send Emails
  if (users.length > 0) {
    const { sendBatchEmail } = await import('../utils/sendEmail.js');
    const { getPromotionalTemplate } = await import('../utils/emailTemplates.js');
    
    const html = getPromotionalTemplate(title, content, couponCode, discountPercentage);
    const emailsData = users.map((user) => ({
      to: user.email,
      subject: title,
      html,
      text: content,
    }));

    const chunkSize = 100;
    for (let i = 0; i < emailsData.length; i += chunkSize) {
      const chunk = emailsData.slice(i, i + chunkSize);
      await sendBatchEmail(chunk);
    }
  }

  // 2. Send Push Notifications
  if (pushSubscriptions.length > 0) {
    const { sendBatchPushNotification } = await import('../utils/push.js');
    
    // Strip HTML tags for the push notification body
    const plainTextContent = content.replace(/<[^>]*>?/gm, '').substring(0, 150) + (content.length > 150 ? '...' : '');

    // Construct the notification payload
    const pushPayload = {
      title,
      body: plainTextContent,
      icon: '/pwa-192x192.png',
      url: '/shop'
    };
    
    // Fire and forget (or await it). We await to ensure we don't end request prematurely
    await sendBatchPushNotification(pushSubscriptions, pushPayload);
  }

  res.json({
    success: true,
    message: `Broadcast sent successfully (Emails: ${users.length}, Push: ${pushSubscriptions.length})`,
  });
});

/** GET /api/admin/marketing/stall-qr-pdf — download/stream high-res printable stall QR PDF. */
export const downloadStallQrPdf = asyncHandler(async (req, res) => {
  const { headline, message, stallName, targetUrl, inline } = req.query;
  const { generateStallQrPdf } = await import('../utils/stallQrPdfGenerator.js');

  await generateStallQrPdf(
    {
      headline: headline || undefined,
      message: message || undefined,
      stallName: stallName || undefined,
      targetUrl: targetUrl || undefined,
      inline: inline === 'true',
    },
    res
  );
});

