import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import PushSubscription from '../models/PushSubscription.js';
import { asyncHandler } from '../middleware/error.js';
import { generateOrdersExcel } from '../utils/orderExcelGenerator.js';

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

/**
 * Resolves date presets into Start and End timestamps.
 */
export function resolveOrderDateFilter(range, customStart, customEnd) {
  const now = new Date();
  let start = null;
  let end = new Date(now);
  let rangeLabel = 'All Time';

  switch (range) {
    case 'last_week': {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Last Week (7 Days)';
      break;
    }
    case 'last_month': {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Last Month (30 Days)';
      break;
    }
    case 'last_3_months': {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Last 3 Months (90 Days)';
      break;
    }
    case 'last_6_months': {
      start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Last 6 Months (180 Days)';
      break;
    }
    case 'last_12_months': {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      rangeLabel = 'Last 12 Months (1 Year)';
      break;
    }
    case 'this_financial_year': {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0 = Jan, 3 = Apr
      const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
      const fyEndYear = fyStartYear + 1;
      start = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // April 1st
      end = new Date(fyEndYear, 2, 31, 23, 59, 59, 999); // March 31st
      rangeLabel = `This Financial Year (FY ${fyStartYear}-${String(fyEndYear).slice(-2)})`;
      break;
    }
    case 'custom': {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      rangeLabel = `Custom Dates (${customStart || 'Start'} to ${customEnd || 'Present'})`;
      break;
    }
    case 'all_time':
    default: {
      start = null;
      end = null;
      rangeLabel = 'All Time (Complete History)';
      break;
    }
  }

  return { start, end, rangeLabel };
}

function buildOrderExportQuery({ range, startDate, endDate, successfulOnly = 'true' }) {
  const { start, end, rangeLabel } = resolveOrderDateFilter(range, startDate, endDate);
  const query = {};

  if (successfulOnly !== 'false') {
    // Default to successful order payments as requested
    query.paymentStatus = { $in: ['UTR_VERIFIED', 'SUCCESSFUL'] };
  }

  if (start || end) {
    query.createdAt = {};
    if (start) query.createdAt.$gte = start;
    if (end) query.createdAt.$lte = end;
  }

  return { query, start, end, rangeLabel };
}

/**
 * GET /api/admin/orders/export-excel — download comprehensive Excel spreadsheet of orders.
 */
export const exportOrdersExcel = asyncHandler(async (req, res) => {
  const { range = 'last_month', startDate, endDate, successfulOnly = 'true' } = req.query;
  const { query, start, end, rangeLabel } = buildOrderExportQuery({
    range,
    startDate,
    endDate,
    successfulOnly,
  });

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  const dateRangeText = start && end
    ? `${start.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} to ${end.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    : start
    ? `From ${start.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    : end
    ? `Up to ${end.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    : 'All Time History';

  await generateOrdersExcel(
    orders,
    {
      rangeKey: range,
      rangeLabel,
      dateRangeText,
      adminName: req.user?.name || 'Administrator',
    },
    res
  );
});

/**
 * GET /api/admin/orders/export-count — preview matching count and revenue for selected date filter.
 */
export const getExportOrdersCount = asyncHandler(async (req, res) => {
  const { range = 'last_month', startDate, endDate, successfulOnly = 'true' } = req.query;
  const { query, rangeLabel } = buildOrderExportQuery({
    range,
    startDate,
    endDate,
    successfulOnly,
  });

  const [count, revenueAgg] = await Promise.all([
    Order.countDocuments(query),
    Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  res.json({
    success: true,
    count,
    totalRevenue: revenueAgg[0]?.total || 0,
    rangeLabel,
  });
});


