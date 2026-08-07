// routes/couponRoutes.js

import express from 'express';
import {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  updateCoupon
} from '../controllers/couponController.js';
import {
  verifyAdminToken,
  verifyAdminRole
} from '../middleware/verifyToken.js';

const router = express.Router();

// Create a coupon (admin only)
router.post('/', verifyAdminToken, verifyAdminRole, createCoupon);

// Read all coupons (admin view)
router.get('/', verifyAdminToken, verifyAdminRole, getAllCoupons);

// Update a coupon (admin only)
router.put('/:id', verifyAdminToken, verifyAdminRole, updateCoupon);

// Delete a coupon (admin only)
router.delete('/:id', verifyAdminToken, verifyAdminRole, deleteCoupon);

export default router;
