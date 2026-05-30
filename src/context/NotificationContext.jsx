import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

import { supabaseFetch } from '../lib/supabaseFetch';


export function NotificationProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !isDemo && user.id) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, isDemo]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await supabaseFetch(`notifications?user_id=eq.${user.id}&order=created_at.desc`);
      if (data && Array.isArray(data)) {
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          icon: n.icon || '🔔',
          type: n.type,
          read: n.read,
          time: new Date(n.created_at).toLocaleDateString() + ' ' + new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    if (!user || !user.id || isDemo) return;
    
    // Optimistic UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await supabaseFetch(`notifications?user_id=eq.${user.id}&read=eq.false`, {
        method: 'PATCH',
        body: { read: true }
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!user || !user.id || isDemo) return;
    
    // Optimistic UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    try {
      await supabaseFetch(`notifications?id=eq.${id}`, {
        method: 'PATCH',
        body: { read: true }
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Internal helper to create notifications (mainly for other contexts to use)
  const createNotification = async (notificationData) => {
    if (!user || !user.id || isDemo) return;

    try {
      await supabaseFetch('notifications', {
        method: 'POST',
        body: {
          user_id: notificationData.userId || user.id,
          type: notificationData.type || 'system',
          title: notificationData.title,
          message: notificationData.message,
          icon: notificationData.icon || '🔔',
          read: false
        }
      });
      // Optionally reload or we can just rely on periodic fetches if we want
      if (!notificationData.userId || notificationData.userId === user.id) {
        loadNotifications();
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      loading, 
      unreadCount, 
      markAllAsRead, 
      markAsRead, 
      createNotification,
      loadNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
