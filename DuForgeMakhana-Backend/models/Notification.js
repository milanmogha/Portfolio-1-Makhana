// models/Notification.js

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['ORDER_PLACED', 'ORDER_UPDATED', 'LOW_STOCK', 'NEW_REVIEW', 'PAYMENT_RECEIVED'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: {
      type: String, // URL to navigate to when clicked
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
notificationSchema.index({ isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
