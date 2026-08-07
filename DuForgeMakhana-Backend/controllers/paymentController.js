// /controllers/paymentController.js

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { processOrderCreation } from './orderController.js';
import shippingService from '../utils/shippingService.js';
import AddressBook from '../models/AddressBook.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order. The amount is computed server-side from the cart
 * items + address + coupon so the client can never decide what it pays.
 * Body: { products: [{ product, quantity }], addressId, couponCode? }
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { products, addressId, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0 || !addressId) {
      return res.status(400).json({ success: false, message: 'products and addressId are required' });
    }

    const addr = await AddressBook.findById(addressId);
    if (!addr) {
      return res.status(400).json({ success: false, message: 'Address not found' });
    }

    const charges = await shippingService.calculateCharges({
      items: products,
      pincode: addr.pincode || '',
      couponCode: couponCode || null,
      userId: req.user.userId,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(charges.total * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.json({ ...order, charges });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderCreationData,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay parameters.',
      });
    }

    // 1. Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const signaturesMatch =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(String(razorpay_signature)));

    if (!signaturesMatch) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // 2. Identity comes only from the verified JWT — never from the request body
    const finalUserId = req.user?.userId;
    if (!finalUserId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!orderCreationData || !orderCreationData.userAddress || !Array.isArray(orderCreationData.products)) {
      return res.status(400).json({
        success: false,
        message: 'Missing products or userAddress in orderCreationData.',
      });
    }

    // 3. Recompute charges server-side and require the amount actually paid
    //    (the Razorpay order amount) to match — closes price-tampering.
    let serverCalc;
    try {
      const addr = await AddressBook.findById(orderCreationData.userAddress);
      serverCalc = await shippingService.calculateCharges({
        items: orderCreationData.products,
        pincode: addr?.pincode || '',
        couponCode: orderCreationData.couponCode || null,
        userId: finalUserId,
      });
    } catch (calcErr) {
      console.error('Error validating charges:', calcErr);
      return res.status(500).json({ success: false, message: 'Failed to validate order charges.' });
    }

    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedPaise = Math.round(serverCalc.total * 100);
    if (!rzpOrder || Number(rzpOrder.amount) !== expectedPaise) {
      console.error(
        `❌ Payment amount mismatch for order ${razorpay_order_id}: paid ${rzpOrder?.amount}, expected ${expectedPaise}`
      );
      return res.status(400).json({ success: false, message: 'Payment amount mismatch. Order not created.' });
    }

    // 4. Create the order with the server-computed breakdown
    const orderData = {
      ...orderCreationData,
      paymentBreakdown: {
        itemsTotal: serverCalc.itemsTotal,
        tax: serverCalc.tax,
        shipping: serverCalc.shipping,
        discount: serverCalc.discount,
        total: serverCalc.total,
      },
      paymentMethod: 'Online',
      razorpayDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    };

    try {
      const newOrder = await processOrderCreation(orderData, finalUserId, req.io);
      return res.status(200).json({
        success: true,
        message: 'Order Placed Successfully',
        order: newOrder,
      });
    } catch (orderErr) {
      console.error('❌ Order creation after payment failed:', orderErr);
      return res.status(500).json({
        success: false,
        message: 'Payment successful, but order creation failed. Our team will contact you.',
      });
    }
  } catch (err) {
    console.error('❌ Error in verifyRazorpayPayment:', err);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
};
