// controllers/notificationController.js

import Notification from '../models/Notification.js';
import { getIO } from '../socket.js';

/**
 * @desc    Create a new notification and emit via socket
 * @param   {Object} data - { type, title, message, orderId, link, priority }
 * @returns {Promise<Notification>}
 */
export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    
    // Emit to all connected admin clients in admin-room
    const io = getIO();
    console.log('📢 Emitting new-notification to admin-room:', notification.title);
    io.to('admin-room').emit('new-notification', notification);
    
    return notification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
};

/**
 * @desc    Get all notifications (admin only)
 * @route   GET /api/admin/notifications
 * @access  Admin
 */
export const getAllNotifications = async (req, res) => {
  try {
    const { limit = 50, page = 1, isRead } = req.query;
    
    const filter = {};
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('orderId', 'orderId status');

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/admin/notifications/:id/read
 * @access  Admin
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/admin/notifications/read-all
 * @access  Admin
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/admin/notifications/:id
 * @access  Admin
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/admin/notifications/clear-read
 * @access  Admin
 */
export const clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ isRead: true });
    
    res.json({ 
      message: `${result.deletedCount} notifications cleared`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
};
