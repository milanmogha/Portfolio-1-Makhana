// routes/notificationRoutes.js

import express from 'express';
import {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
} from '../controllers/notificationController.js';
import { verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';

const router = express.Router();

// Get all notifications
router.get('/', verifyAdminToken, verifyAdminRole, getAllNotifications);

// Mark notification as read
router.patch('/:id/read', verifyAdminToken, verifyAdminRole, markAsRead);

// Mark all as read
router.patch('/read-all', verifyAdminToken, verifyAdminRole, markAllAsRead);

// Clear all read notifications
router.delete('/clear-read', verifyAdminToken, verifyAdminRole, clearReadNotifications);

// Delete notification
router.delete('/:id', verifyAdminToken, verifyAdminRole, deleteNotification);


export default router;
