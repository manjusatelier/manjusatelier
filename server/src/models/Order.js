import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true }, // unit price paid (after discount)
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String },
    customOrderId: { type: String, unique: true },
    paymentMethod: { type: String, default: 'UPI' },
    utrNumber: { type: String },
    utrEdited: { type: Boolean, default: false },
    cashfreeOrderId: { type: String },
    cashfreePaymentId: { type: String },
    cashfreePaymentSessionId: { type: String },
    paymentStatus: {
      type: String,
      enum: ['PAYMENT_PENDING', 'PENDING_UTR', 'UTR_MISMATCH_RETRY', 'UTR_VERIFICATION_PENDING', 'UTR_VERIFIED', 'SUCCESSFUL', 'FAILED'],
      default: 'PAYMENT_PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    deliveredAt: { type: Date },
    returnExchange: {
      actionType: { type: String, enum: ['return', 'exchange'] },
      reason: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'] },
      requestedAt: Date,
      adminNote: String
    }
  },
  { timestamps: true }
);

import Counter from './Counter.js';

// Pre-save hook to generate customOrderId safely
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.customOrderId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      // Clean, industry-standard order ID format: MA + sequential digits (e.g. MA10025)
      this.customOrderId = `MA${10000 + counter.seq}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Order', orderSchema);
