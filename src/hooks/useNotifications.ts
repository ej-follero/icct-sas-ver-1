import { useState, useEffect, useCallback } from 'react';

export interface NotificationItem {
  id: number;
  title?: string;
  message: string;
  time: string;
  unread: boolean;
  from?: string;
  type: 'notification' | 'message';
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  messages: number;
  notifications: number;
}

// No mocks: use live API; keep a minimal fallback in case of transient errors

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications and messages
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      const items: NotificationItem[] = Array.isArray(data?.items) ? data.items : [];
      setNotifications(items);
      setMessages([]); // messages feature not yet backed by API
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []); // Removed dependencies since mock data is now static

  // Mark notification as read
  const markAsRead = useCallback(async (id: number, type: 'notification' | 'message') => {
    try {
      if (type === 'notification') {
        const res = await fetch(`/api/notifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) });
        if (!res.ok) throw new Error('Failed to mark as read');
      }
      
      if (type === 'notification') {
        setNotifications(prev => 
          prev.map(item => 
            item.id === id ? { ...item, unread: false } : item
          )
        );
      } else {
        setMessages(prev => 
          prev.map(item => 
            item.id === id ? { ...item, unread: false } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async (type: 'notification' | 'message') => {
    try {
      // In real implementation, call API
      // await fetch(`/api/notifications/mark-all-read`, { 
      //   method: 'PUT',
      //   body: JSON.stringify({ type })
      // });
      
      if (type === 'notification') {
        setNotifications(prev => 
          prev.map(item => ({ ...item, unread: false }))
        );
      } else {
        setMessages(prev => 
          prev.map(item => ({ ...item, unread: false }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Get notification stats
  const getStats = useCallback((): NotificationStats => {
    const notificationUnread = notifications.filter(n => n.unread).length;
    const messageUnread = messages.filter(m => m.unread).length;
    
    return {
      total: notificationUnread + messageUnread,
      unread: notificationUnread + messageUnread,
      messages: messageUnread,
      notifications: notificationUnread
    };
  }, [notifications, messages]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now() // Simple ID generation
    };
    
    if (notification.type === 'notification') {
      setNotifications(prev => [newNotification, ...prev]);
    } else {
      setMessages(prev => [newNotification, ...prev]);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    messages,
    loading,
    markAsRead,
    markAllAsRead,
    getStats,
    addNotification,
    refresh: loadNotifications
  };
}; 