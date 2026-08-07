// src/components/NotificationToast.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../sockets';
import '../css/NotificationToast.css';

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for new notifications
    const handleNewNotification = (notification) => {
      console.log('🔔 Toast: New notification received:', notification);
      
      // Add toast to the list
      const toastId = Date.now();
      setToasts(prev => [...prev, { ...notification, toastId }]);

      // Play sound
      playNotificationSound();

      // Show browser notification
      if (Notification.permission === 'granted') {
        const browserNotif = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification._id,
          requireInteraction: true, // Keep notification visible until user interacts
        });

        browserNotif.onclick = () => {
          const adminPath = notification.link?.startsWith('/admin/') 
            ? notification.link 
            : `/admin${notification.link}`;
          if (adminPath) {
            window.focus();
            navigate(adminPath);
          }
          browserNotif.close();
        };
      }

      // Auto-remove toast after 10 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
      }, 10000);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [navigate]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Browser notifications enabled');
        }
      });
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: Use Web Audio API for beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });
    } catch (err) {
      console.log('Could not play sound:', err);
    }
  };

  const handleToastClick = (notification) => {
    const adminPath = notification.link?.startsWith('/admin/') 
      ? notification.link 
      : `/admin${notification.link}`;
    if (adminPath) {
      navigate(adminPath);
    }
    setToasts(prev => prev.filter(t => t.toastId !== notification.toastId));
  };

  const handleDismiss = (toastId, e) => {
    e.stopPropagation();
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
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

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className={`notification-toast priority-${toast.priority} toast-enter`}
          onClick={() => handleToastClick(toast)}
        >
          <div className="toast-icon-wrapper">
            <span className="toast-icon">{getNotificationIcon(toast.type)}</span>
          </div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button 
            className="toast-close" 
            onClick={(e) => handleDismiss(toast.toastId, e)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
