// models/Orders.js

import mongoose from 'mongoose';
import crypto from 'crypto';

const { Schema, model, Types } = mongoose;

// Sub-schemas (orderedProductSchema, paymentBreakdownSchema) remain the same...
const orderedProductSchema = new Schema(
  {
    product:  { type: Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const paymentBreakdownSchema = new Schema(
  {
    itemsTotal: { type: Number, required: true },
    tax:        { type: Number, required: true },
    shipping:   { type: Number, required: true },
    discount:   { type: Number, default: 0 },
    total:      { type: Number, required: true }
  },
  { _id: false }
);


// Main Order schema
const orderSchema = new Schema(
  {
    // *** NEW FIELD ADDED HERE ***
    user: {
        type: String, // This will store the Firebase UID
        required: true,
        index: true,
    },
    orderId: {
      type: String,
      unique: true,
      index: true
    },
    userAddress: {
      type: Types.ObjectId,
      ref: 'AddressBook',
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['CashOnDelivery', 'Card', 'UPI', 'NetBanking', 'Online']
    },
    paymentBreakdown: {
      type: paymentBreakdownSchema,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    trackingLink: {
      type: String,
      default: null
    },
    // Notification flags to track SMS delivery per stage
    notificationFlags: {
      confirmed_sms_sent: { type: Boolean, default: false },
      shipped_sms_sent: { type: Boolean, default: false },
      delivered_sms_sent: { type: Boolean, default: false },
      cancelled_sms_sent: { type: Boolean, default: false }
    },
    products: {
      type: [orderedProductSchema],
      required: true
    },
    couponCode: {
      type: String,
      default: null
    },
    razorpayDetails: { // To store payment gateway info
        type: Object,
        default: {}
    }
  },
  {
    timestamps: true
  }
);

// Pre-validation hook for orderId remains the same...
orderSchema.pre('validate', function (next) {
  if (this.isNew) {
    const timestamp = Date.now();
    const randomComponent = crypto.randomBytes(2).toString('hex');
    this.orderId = `OD-${timestamp}-${randomComponent}`;
  }
  next();
});


export const Order = model('Order', orderSchema);
