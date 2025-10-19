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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication errors gracefully
        if (response.status === 401) {
          console.log('🔐 [useNotifications] Authentication required - skipping notifications load');
          setNotifications([]);
          setMessages([]);
          return;
        }
        
        throw new Error(errorData.error || `Failed to fetch notifications (HTTP ${response.status})`);
      }
      const data = await response.json();
      const items: NotificationItem[] = Array.isArray(data?.data) ? data.data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message || '',
        time: n.createdAt,
        unread: !n.isRead,
        type: 'notification' as const,
        priority: n.priority?.toLowerCase() as 'low' | 'medium' | 'high' | undefined,
        actionUrl: n.actionUrl
      })) : [];
      setNotifications(items);
      setMessages([]); // messages feature not yet backed by API
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []); // Removed dependencies since mock data is now static

  // Toggle notification read status
  const markAsRead = useCallback(async (id: number, type: 'notification' | 'message') => {
    try {
      if (type === 'notification') {
        // Find current notification to get its current read status
        const currentNotification = notifications.find(n => n.id === id);
        const newReadStatus = !currentNotification?.unread; // Toggle the status
        
        const res = await fetch(`/api/notifications/${id}`, { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ isRead: newReadStatus }) 
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to toggle read status (HTTP ${res.status})`);
        }
      }
      
      if (type === 'notification') {
        setNotifications(prev => 
          prev.map(item => 
            item.id === id ? { ...item, unread: !item.unread } : item
          )
        );
      } else {
        setMessages(prev => 
          prev.map(item => 
            item.id === id ? { ...item, unread: !item.unread } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle read status:', error);
    }
  }, [notifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async (type: 'notification' | 'message') => {
    try {
      if (type === 'notification') {
        const res = await fetch('/api/notifications', { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to mark all as read (HTTP ${res.status})`);
        }
      }
      
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

  // Load notifications on mount - removed to avoid duplicate calls
  // The auto-refresh effect below handles the initial load

  // Auto-refresh notifications every 30 seconds for real-time updates
  // Only start auto-refresh after initial load to avoid authentication issues
  useEffect(() => {
    // Small delay to ensure user authentication is complete
    const initialDelay = setTimeout(() => {
      loadNotifications();
    }, 1000);

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
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