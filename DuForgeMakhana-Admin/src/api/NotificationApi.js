// src/api/NotificationApi.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000';

/**
 * Fetch all notifications (admin only)
 */
export const fetchNotifications = async (adminToken, params = {}) => {
  const { limit = 50, page = 1, isRead } = params;
  
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    ...(isRead !== undefined && { isRead: isRead.toString() })
  });

  const res = await axios.get(`${BASE_URL}/api/admin/notifications?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  
  return res.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (adminToken, notificationId) => {
  const res = await axios.patch(
    `${BASE_URL}/api/admin/notifications/${notificationId}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  
  return res.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (adminToken) => {
  const res = await axios.patch(
    `${BASE_URL}/api/admin/notifications/read-all`,
    {},
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  
  return res.data;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (adminToken, notificationId) => {
  const res = await axios.delete(
    `${BASE_URL}/api/admin/notifications/${notificationId}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  
  return res.data;
};

/**
 * Clear all read notifications
 */
export const clearReadNotifications = async (adminToken) => {
  const res = await axios.delete(
    `${BASE_URL}/api/admin/notifications/clear-read`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );
  return res.data;
};
