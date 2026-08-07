// controllers/couponController.js

import Coupon from '../models/Coupon.js';

/**
 * @desc    Create a new coupon
 * @route   POST /api/admin/coupons
 * @access  Admin
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      heading,
      description,
      expiryDate,
      usageLimit = 1,
      minOrderValue = 0,
      discountPercent = 0,
      discountAmount = 0,
      maxDiscountAmount = 0,
      visible = true,
      assignedTo = null, // (optional) Firebase UID of a single user
    } = req.body;

    if (!code || !heading || !description || !expiryDate) {
      return res
        .status(400)
        .json({ error: 'Code, heading, description and expiryDate are required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check uniqueness
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code:           normalizedCode,
      heading,
      description,
      expiryDate:     new Date(expiryDate),
      usageLimit,
      minOrderValue,
      discountPercent,
      discountAmount,
      maxDiscountAmount,
      visible,
      assignedTo:     assignedTo || null,
      usedBy:         [],   // initialize empty
      usedCount:      0     // initialize zero
    });

    await coupon.save();
    return res.status(201).json(coupon);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * @desc    Update an existing coupon
 * @route   PUT /api/admin/coupons/:id
 * @access  Admin
 */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      heading,
      description,
      expiryDate,
      usageLimit = 1,
      minOrderValue = 0,
      discountPercent = 0,
      discountAmount = 0,
      maxDiscountAmount = 0,
      visible = true,
      assignedTo = null
    } = req.body;

    const normalizedCode = code.trim().toUpperCase();

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code:           normalizedCode,
        heading,
        description,
        expiryDate:     new Date(expiryDate),
        usageLimit,
        minOrderValue,
        discountPercent,
        discountAmount,
        maxDiscountAmount,
        visible,
        assignedTo:     assignedTo || null
      },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    return res.json(coupon);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

/**
 * @desc    Get all coupons (admin only)
 * @route   GET /api/admin/coupons
 * @access  Admin
 */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.json(coupons);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

/**
 * @desc    Delete a coupon by ID
 * @route   DELETE /api/admin/coupons/:id
 * @access  Admin
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    return res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

/**
 * @desc    Apply a coupon code (requires verifyToken)
 * @route   POST /api/coupons/apply
 * @access  Authenticated users (Firebase)
 */
export const applyCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code || typeof orderTotal !== 'number') {
      return res.status(400).json({ error: 'Code and orderTotal are required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const now = new Date();
    if (new Date(coupon.expiryDate) < now) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (orderTotal < coupon.minOrderValue) {
      return res
        .status(400)
        .json({ error: `Minimum order ₹${coupon.minOrderValue} required` });
    }

    // If coupon is invisible, only the assigned user may apply
    if (!coupon.visible) {
      if (coupon.assignedTo !== req.user.userId) {
        return res
          .status(403)
          .json({ error: 'This coupon code is not valid for your account.' });
      }
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Check if this Firebase UID already used it
    if (coupon.usedBy.includes(req.user.userId)) {
      return res.status(400).json({ error: 'You have already used this coupon' });
    }

    // Calculate discount (but do NOT yet mark as used or increment)
    let discount = 0;
    if (coupon.discountPercent > 0) {
      discount = Math.floor((coupon.discountPercent / 100) * orderTotal);
      // Apply max discount cap if set
      if (coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountAmount;
    }

    // Return code + discount, but do not modify usedCount/usedBy here
    return res.json({ code: coupon.code, discount });
  } catch (err) {
    console.error('❌ applyCoupon error:', err);
    return res.status(500).json({ error: 'Could not apply coupon' });
  }
};
