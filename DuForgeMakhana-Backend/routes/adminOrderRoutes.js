// routes/adminOrderRoutes.js

import express from 'express';
import {
  getAllOrders,
  getOrderById as getOrderByIdController,
  updateOrderStatus
} from '../controllers/orderController.js';

import {
  verifyAdminToken,
  verifyAdminRole
} from '../middleware/verifyToken.js';

const router = express.Router();

// ─── ADMIN ROUTES (JWT‐protected, role="admin" only) ────────────────────────

// GET    /api/admin/orders             ← Fetch all orders (admin only)
router.get('/', verifyAdminToken, verifyAdminRole, getAllOrders);

// GET    /api/admin/orders/:id         ← Fetch single order by ID or orderId (admin only)
router.get('/:id', verifyAdminToken, verifyAdminRole, getOrderByIdController);

// PUT    /api/admin/orders/:id/status  ← Update order status (admin only)
router.put('/:id/status', verifyAdminToken, verifyAdminRole, updateOrderStatus);

export default router;
