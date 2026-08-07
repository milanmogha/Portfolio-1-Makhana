// routes/publicCouponRoutes.js

import express from 'express';
import Coupon from '../models/Coupon.js';
import { applyCoupon } from '../controllers/couponController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * GET /api/coupons
 * Public endpoint: returns only coupons that are visible and not expired
 */
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    // Fetch only visible + not expired
    const coupons = await Coupon.find({
      visible: true,
      expiryDate: { $gt: now }
    }).sort({ createdAt: -1 });

    res.json(coupons);
  } catch (err) {
    console.error('Error fetching public coupons:', err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

/**
 * POST /api/coupons/apply
 * Protected endpoint: validate/apply any coupon code,
 * allowing invisible coupons only for the assigned user.
 */
router.post('/apply', verifyToken, applyCoupon);

export default router;
