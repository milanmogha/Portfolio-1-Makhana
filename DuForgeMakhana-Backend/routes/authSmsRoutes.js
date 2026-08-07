// backend/routes/authSmsRoutes.js
// SMS-based Authentication Routes (OTP)

import express from 'express';
import {
  sendOTPToPhone,
  verifyOTP,
  resendOTP,
} from '../utils/otpService.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 * Body: { phoneNumber: "+919876543210", email?: "user@example.com" }
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate phone number format (basic check for +country code)
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Use format: +919876543210' 
      });
    }

    const result = await sendOTPToPhone(phoneNumber, email);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and authenticate user
 * Body: { phoneNumber: "+919876543210", otp: "123456" }
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        message: 'Phone number and OTP are required' 
      });
    }

    const result = await verifyOTP(phoneNumber, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Find or create user by phone number
    let user = await User.findOne({ phone: phoneNumber });

    if (!user) {
      // Create new user
      user = new User({
        phone: phoneNumber,
        email: result.email || undefined,
        name: 'User',
        // Password not needed for OTP-based auth
      });
      await user.save();
    }

    // Here you would generate JWT tokens
    // This is a simplified example - implement your token generation

    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        _id: user._id,
        phone: user.phone,
        email: user.email,
        name: user.name,
      },
      // Add your JWT token here
      // token: generateJWT(user._id)
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP to phone number
 * Body: { phoneNumber: "+919876543210" }
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const result = await resendOTP(phoneNumber);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
