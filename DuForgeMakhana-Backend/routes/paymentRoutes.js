import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// All routes are protected
router.use(verifyToken);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

export default router;