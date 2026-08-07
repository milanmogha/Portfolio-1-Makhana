// shippingService.js

import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { resolveZoneFromPincode } from './zoneResolver.js';

// Bands (kg)
const BANDS = [0.5, 1, 1.5, 2, 2.5, 3];

// Delivery rate table
const ZONES = {
  NCR: [50, 75, 110, 120, 145, 155],
  NORTH: [65, 90, 130, 130, 165, 175],
  ROI: [70, 100, 140, 165, 185, 210],
  NE_SPL: [100, 140, 175, 175, 235, 235],
};

const DEFAULT_TAX_RATE = 0.1;

// Pick shipping price based on weight slab
const pickPriceForWeight = (zone, weightKg) => {
  const prices = ZONES[zone] || ZONES.ROI;

  for (let i = 0; i < BANDS.length; i++) {
    if (weightKg <= BANDS[i]) return prices[i];
  }

  // Extra weight handling
  const last = prices[prices.length - 1];
  const EXTRA_05KG_RATE = {
    NCR: 10,
    NORTH: 10,
    ROI: 20,
    NE_SPL: 30,
  };

  const extraSteps = Math.ceil((weightKg - 3) / 0.5);
  return last + EXTRA_05KG_RATE[zone] * extraSteps;
};

// Main calculator
export const calculateCharges = async ({
  items = [],
  pincode = '',
  couponCode = null,
  userId = null,
}) => {

  // 🧪 LOCAL TEST PINCODE OVERRIDE
  if (
    pincode === '999999' &&
    (process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_TEST_PINCODE === 'true')
  ) {
    return {
      itemsTotal: 0,
      shipping: 0,
      discount: 0,
      tax: 0,
      total: 1, // Razorpay requires amount > 0
      zone: 'TEST',
      weightKg: 0,
      couponCode: null,
    };
  }


  const productIds = items.map(i => i.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const prodMap = {};
  products.forEach(p => {
    prodMap[p._id.toString()] = p;
  });

  let itemsTotal = 0;
  let totalWeight = 0;

  for (const it of items) {
    const p = prodMap[it.product];
    if (!p) continue;

    const qty = it.quantity || 1;
    const priceAfterDiscount = Math.round(
      (p.price * (100 - (p.discount || 0))) / 100
    );

    itemsTotal += priceAfterDiscount * qty;
    totalWeight += (p.weightKg || 0.5) * qty;
  }

  // ✅ SINGLE SOURCE OF TRUTH
  const zone = resolveZoneFromPincode(pincode);

  console.log('🚚 Zone resolved:', zone, 'for pincode', pincode);

  let shipping = pickPriceForWeight(zone, totalWeight);

  // Coupon logic — every rule enforced here, since this is the single
  // source of truth used by both quote and order-creation paths.
  let discount = 0;
  let appliedCoupon = null;

  if (couponCode && typeof couponCode === 'string') {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
    });

    const isValid =
      coupon &&
      new Date(coupon.expiryDate) >= new Date() &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
      (!coupon.minOrderValue || itemsTotal >= coupon.minOrderValue) &&
      (!userId || !coupon.usedBy?.includes(String(userId))) &&
      (coupon.visible || (userId && coupon.assignedTo === String(userId)));

    if (isValid) {
      appliedCoupon = coupon;
      if (coupon.discountPercent > 0) {
        discount = Math.floor((coupon.discountPercent / 100) * itemsTotal);
        if (coupon.maxDiscountAmount > 0) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else {
        discount = coupon.discountAmount || 0;
      }
      discount = Math.min(discount, itemsTotal);

      if (coupon.type === 'FREE_SHIPPING') {
        shipping = 0;
      }
    }
  }

  const taxable = Math.max(0, itemsTotal - discount);
  const tax = Math.round(taxable * DEFAULT_TAX_RATE);
  const total = Math.round(itemsTotal - discount + tax + shipping);

  return {
    itemsTotal,
    shipping,
    discount,
    tax,
    total,
    zone,
    weightKg: Math.round(totalWeight * 100) / 100,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
  };
};

export default { calculateCharges };
