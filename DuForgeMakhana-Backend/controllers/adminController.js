// src/controllers/adminController.js

import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLogs.js'; // updated to match the model filename

/**
 * @desc    Authenticate admin/owner & get JWT
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('❌ loginAdmin error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

/**
 * @desc    Fetch system logs (audit logs)
 * @route   GET /api/admin/logs
 * @access  Owner only
 */
export const getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role') // include admin info if needed
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    console.error('❌ getLogs error:', err);
    res.status(500).json({ message: 'Could not fetch logs' });
  }
};
