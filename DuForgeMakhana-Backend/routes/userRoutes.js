// routes/userRoutes.js
import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getAllUsers,
} from "../controllers/userController.js";

import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (JWT)
 */
router.get("/profile", requireAuth, getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private (JWT)
 */
router.put("/profile", requireAuth, updateUserProfile);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete current user profile
 * @access  Private (JWT)
 */
router.delete("/profile", requireAuth, deleteUserProfile);

/**
 * @route   GET /api/users/admin/users
 * @desc    Get all users (admin only)
 * @access  Private (JWT + admin)
 */
router.get("/admin/users", requireAuth, requireAdmin, getAllUsers);

export default router;
