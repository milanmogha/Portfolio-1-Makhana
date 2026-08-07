// routes/adminUserRoutes.js

import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Fetch all users (admin only)
 * @access  Admin (JWT + role check)
 */
router.get('/', verifyAdminToken, verifyAdminRole, getAllUsers);

export default router;
