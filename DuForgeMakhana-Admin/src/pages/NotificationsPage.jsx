// src/pages/NotificationsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../sockets';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
  deleteNotification
} from '../api/NotificationApi';
import AdminNavbar from './Navbar';
import '../css/NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');

  const loadNotifications = async (currentPage = 1) => {
    if (!adminToken) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };

      if (filter === 'unread') params.isRead = false;
      if (filter === 'read') params.isRead = true;

      const data = await fetchNotifications(adminToken, params);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.totalPages);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen for new notifications
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [filter]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(adminToken, notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      if (notification.link) {
        // Navigate to the correct admin path
        const adminPath = notification.link.startsWith('/admin/') 
          ? notification.link 
          : `/admin${notification.link}`;
        navigate(adminPath);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(adminToken);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm('Clear all read notifications?')) return;
    
    try {
      await clearReadNotifications(adminToken);
      loadNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Delete this notification?')) return;

    try {
      await deleteNotification(adminToken, notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED': return '🛒';
      case 'ORDER_UPDATED': return '📦';
      case 'PAYMENT_RECEIVED': return '💰';
      case 'LOW_STOCK': return '⚠️';
      case 'NEW_REVIEW': return '⭐';
      default: return '🔔';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <>
      <AdminNavbar />
      <div className="notifications-page">
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <div className="header-stats">
              <span className="unread-badge">{unreadCount} Unread</span>
            </div>
          </div>

          <div className="notifications-toolbar">
            <div className="filter-buttons">
              <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={filter === 'unread' ? 'active' : ''}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                className={filter === 'read' ? 'active' : ''}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>

            <div className="action-buttons">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead} className="btn-secondary">
                  Mark All as Read
                </button>
              )}
              <button onClick={handleClearRead} className="btn-danger">
                Clear Read
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔕</span>
              <h2>No notifications</h2>
              <p>You're all caught up!</p>
            </div>
          ) : (
            <>
              <div className="notifications-grid">
                {notifications.map(notification => (
                  <div
                    key={notification._id}
                    className={`notification-card ${!notification.isRead ? 'unread' : ''} priority-${notification.priority}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="card-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="card-content">
                      <div className="card-header">
                        <h3>{notification.title}</h3>
                        <button
                          className="delete-btn"
                          onClick={(e) => handleDelete(notification._id, e)}
                        >
                          ×
                        </button>
                      </div>
                      <p className="card-message">{notification.message}</p>
                      <div className="card-footer">
                        <span className="timestamp">{formatDate(notification.createdAt)}</span>
                        {!notification.isRead && <span className="unread-indicator">●</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => loadNotifications(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => loadNotifications(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
