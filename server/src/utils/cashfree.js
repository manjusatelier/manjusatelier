import crypto from 'crypto';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

let cachedConfig = null;
let cashfreeInstance = null;

/**
 * Returns a configured Cashfree client instance.
 * Reads credentials from CASHFREE_APP_ID (or CASHFREE_CLIENT_ID)
 * and CASHFREE_SECRET_KEY (or CASHFREE_CLIENT_SECRET).
 */
export function getCashfreeClient() {
  const clientId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }

  const env = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
  const cfEnv = env === 'PRODUCTION' || env === 'PROD'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

  const currentConfigKey = `${clientId}:${cfEnv}:${process.env.CASHFREE_API_VERSION || 'default'}`;

  if (!cashfreeInstance || cachedConfig !== currentConfigKey) {
    cashfreeInstance = new Cashfree(cfEnv, clientId, clientSecret);
    if (process.env.CASHFREE_API_VERSION) {
      cashfreeInstance.XApiVersion = process.env.CASHFREE_API_VERSION;
    }
    cachedConfig = currentConfigKey;
  }

  return cashfreeInstance;
}

/**
 * Creates an order on Cashfree Payment Gateway and returns the payment_session_id.
 *
 * @param {Object} params
 * @param {string} params.orderId - Unique order ID (alphanumeric and dashes/underscores)
 * @param {number} params.orderAmount - Total amount in INR
 * @param {Object} params.customer - Customer details
 * @param {string} params.customer.id - Customer unique identifier
 * @param {string} [params.customer.name] - Customer full name
 * @param {string} [params.customer.email] - Customer email
 * @param {string} [params.customer.phone] - Customer 10-digit phone number
 * @param {string} [params.returnUrl] - URL to redirect the customer after payment
 * @param {string} [params.notifyUrl] - Webhook endpoint for async notifications
 * @returns {Promise<Object>} Cashfree order response with payment_session_id
 */
export async function createCashfreeOrder({
  orderId,
  orderAmount,
  customer,
  returnUrl,
  notifyUrl,
}) {
  const cashfree = getCashfreeClient();

  // Cashfree requires a valid 10-digit phone number
  const rawPhone = String(customer.phone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';

  // Sanitized orderId for Cashfree (max 45 chars, alphanumeric with - or _)
  const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);

  const request = {
    order_id: cleanOrderId,
    order_amount: Number(orderAmount),
    order_currency: 'INR',
    customer_details: {
      customer_id: String(customer.id),
      customer_name: customer.name || 'Valued Customer',
      customer_email: customer.email || 'help@manjusatelier.in',
      customer_phone: cleanPhone,
    },
    order_meta: {
      return_url: returnUrl || undefined,
      notify_url: notifyUrl || undefined,
    },
    order_note: `Manju's Atelier Order ${orderId}`,
  };

  const response = await cashfree.PGCreateOrder(request);
  return response.data;
}

/**
 * Fetches the current order status from Cashfree.
 *
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function fetchCashfreeOrder(orderId) {
  const cashfree = getCashfreeClient();
  const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
  const response = await cashfree.PGFetchOrder(cleanOrderId);
  return response.data;
}

/**
 * Fetches all payment transactions associated with a Cashfree order.
 *
 * @param {string} orderId
 * @returns {Promise<Array>}
 */
export async function fetchCashfreePayments(orderId) {
  const cashfree = getCashfreeClient();
  const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
  const response = await cashfree.PGOrderFetchPayments(cleanOrderId);
  return response.data;
}

/**
 * Verifies the signature of an incoming Cashfree webhook.
 *
 * Cashfree signs: timestamp + rawBody using HMAC-SHA256 with the client secret,
 * encoded in Base64.
 *
 * @param {string} signature - Received in 'x-webhook-signature' header
 * @param {string|Buffer} rawBody - Raw unparsed webhook request body
 * @param {string} timestamp - Received in 'x-webhook-timestamp' header
 * @returns {boolean}
 */
export function verifyCashfreeWebhook(signature, rawBody, timestamp) {
  const secret = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_CLIENT_SECRET;
  if (!secret || !signature || !timestamp || !rawBody) {
    return false;
  }

  try {
    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    const bodyToSign = `${timestamp}${rawString}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyToSign)
      .digest('base64');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error('Failed to verify Cashfree webhook signature:', err);
    return false;
  }
}

