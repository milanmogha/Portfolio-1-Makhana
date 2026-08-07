// backend/routes/smsRoutes.js
// SMS Management Routes (Admin only)

import express from 'express';
import {
  sendPromotionalSMS,
  sendBulkSMS,
} from '../utils/smsService.js';
import {
  sendImmediateCartReminder,
  getAbandonmentStats,
} from '../utils/cartAbandonmentService.js';
import {
  verifyAdminToken,
  verifyAdminRole,
} from '../middleware/verifyToken.js';
import User from '../models/User.js';

const router = express.Router();

// ─── PROMOTIONAL SMS (Admin only) ────────────────────────────────────

/**
 * POST /api/sms/promotional
 * Send promotional SMS to all users
 */
router.post('/promotional', verifyAdminToken, verifyAdminRole, async (req, res) => {
  try {
    const { title, description, expiryDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Get all users with phone numbers
    const users = await User.find({ phone: { $exists: true, $ne: '' } })
      .select('phone')
      .limit(1000); // Safety limit

    if (users.length === 0) {
      return res.status(400).json({ message: 'No users with phone numbers found' });
    }

    const phoneNumbers = users.map(u => u.phone);
    const promoData = { title, description, expiryDate };

    // Send in background
    sendBulkSMS(phoneNumbers, 
      `${title}! ${description}. Offer valid till ${expiryDate}. Shop now: ${process.env.FRONTEND_URL}. Reply STOP to unsubscribe.`
    ).catch(err => console.error('Bulk SMS error:', err));

    res.json({
      success: true,
      message: `Promotional SMS queued for ${phoneNumbers.length} users`,
      count: phoneNumbers.length,
    });
  } catch (error) {
    console.error('Error sending promotional SMS:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/sms/promotional/targeted
 * Send promotional SMS to specific user segment
 */
router.post('/promotional/targeted', verifyAdminToken, verifyAdminRole, async (req, res) => {
  try {
    const { title, description, expiryDate, userIds } = req.body;

    if (!title || !description || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        message: 'Title, description, and userIds array are required' 
      });
    }

    // Get phone numbers for specific users
    const users = await User.find({ 
      _id: { $in: userIds },
      phone: { $exists: true, $ne: '' }
    }).select('phone');

    const phoneNumbers = users.map(u => u.phone);

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ message: 'No users with phone numbers found' });
    }

    // Send in background
    sendBulkSMS(phoneNumbers, 
      `${title}! ${description}. Offer valid till ${expiryDate}. Shop now: ${process.env.FRONTEND_URL}. Reply STOP to unsubscribe.`
    ).catch(err => console.error('Bulk SMS error:', err));

    res.json({
      success: true,
      message: `Promotional SMS queued for ${phoneNumbers.length} users`,
      count: phoneNumbers.length,
    });
  } catch (error) {
    console.error('Error sending targeted promotional SMS:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── CART ABANDONMENT (Admin only) ──────────────────────────────────

/**
 * GET /api/sms/cart-abandonment/stats
 * Get cart abandonment stats
 */
router.get('/cart-abandonment/stats', verifyAdminToken, verifyAdminRole, (req, res) => {
  try {
    const stats = getAbandonmentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/sms/cart-abandonment/send
 * Manually send cart abandonment reminder
 */
router.post('/cart-abandonment/send', verifyAdminToken, verifyAdminRole, async (req, res) => {
  try {
    const { phoneNumber, cartTotal } = req.body;

    if (!phoneNumber || !cartTotal) {
      return res.status(400).json({ 
        message: 'phoneNumber and cartTotal are required' 
      });
    }

    const result = await sendImmediateCartReminder(phoneNumber, { cartTotal });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error sending cart reminder:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
