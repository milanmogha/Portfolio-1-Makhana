// routes/cartRoutes.js
import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// All routes here require a valid JWT
router.use(verifyToken);

// @route   GET /api/cart
// @desc    Get current user's cart
router.get('/', getCart);

// @route   POST /api/cart
// @desc    Add a product to cart (or increase quantity)
router.post('/', addToCart);

// @route   PUT /api/cart
// @desc    Update quantity of an existing cart item
router.put('/', updateCartItem);

// @route   DELETE /api/cart/:productId
// @desc    Remove a product from cart
router.delete('/:productId', removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear all items from cart
router.delete('/', clearCart);

export default router;
