// routes/customerOrderRoutes.js

import express from 'express';

import {
  createOrder,
  getMyOrders,
  getOrderById as getOrderByIdController,
  generateOrderInvoice // <-- Import this
} from '../controllers/orderController.js';

import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// ─── CUSTOMER ROUTES (Firebase‐protected) ───────────────────────────────────

// POST   /api/orders          ← Customer places a new order
router.post('/', verifyToken, createOrder);

// GET    /api/orders/my       ← Customer’s own orders
router.get('/my', verifyToken, getMyOrders);

// GET    /api/orders/:id      ← Customer fetches a single order
//                            (verifyToken → controller enforces ownership)
router.get('/:id', verifyToken, getOrderByIdController);


// GET    /api/orders/:id/invoice  ← Generate a PDF invoice for an order
router.get('/:id/invoice', verifyToken, generateOrderInvoice);

export default router;
