// src/routes/adminRoutes.js

import express from 'express';
import multer from 'multer';
import { loginAdmin } from '../controllers/adminController.js';
import {
  getBanners,
  addBanner,
  deleteBanner,
} from '../controllers/bannerController.js';
import { verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   POST /api/admin/login
 * @desc    Admin login (returns JWT)
 * @access  Public
 */
router.post('/login', loginAdmin);

/**
 * @route   GET /api/admin/banners
 * @desc    Get all banners (admin only)
 * @access  Admin
 */
router.get('/banners', verifyAdminToken, verifyAdminRole, getBanners);

/**
 * @route   POST /api/admin/banners
 * @desc    Create a new banner (image upload) (admin only)
 * @access  Admin
 */
router.post(
  '/banners',
  verifyAdminToken,
  verifyAdminRole,
  upload.single('image'),
  addBanner
);

/**
 * @route   DELETE /api/admin/banners/:id
 * @desc    Delete a banner by ID (admin only)
 * @access  Admin
 */
router.delete(
  '/banners/:id',
  verifyAdminToken,
  verifyAdminRole,
  deleteBanner
);

export default router;
