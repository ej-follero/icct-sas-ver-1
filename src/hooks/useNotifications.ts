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

// Mock data - moved outside to prevent recreation on every render
const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "New attendance record",
    message: "Class ICT101 attendance has been recorded for today",
    time: "5m ago",
    unread: true,
    type: 'notification',
    priority: 'medium',
    actionUrl: '/dashboard/attendance'
  },
  {
    id: 2,
    title: "System Update",
    message: "System maintenance scheduled for tonight at 10 PM",
    time: "1h ago",
    unread: true,
    type: 'notification',
    priority: 'high',
    actionUrl: '/settings/system-status'
  },
  {
    id: 3,
    title: "Welcome!",
    message: "Welcome to ICCT Smart Attendance System",
    time: "2h ago",
    unread: false,
    type: 'notification',
    priority: 'low'
  },
  {
    id: 4,
    title: "RFID Reader Offline",
    message: "RFID reader in Room 101 is currently offline",
    time: "3h ago",
    unread: false,
    type: 'notification',
    priority: 'high',
    actionUrl: '/list/rfid/readers'
  }
];

const mockMessages: NotificationItem[] = [
  {
    id: 1,
    from: "John Doe",
    message: "When is the next faculty meeting scheduled?",
    time: "10m ago",
    unread: true,
    type: 'message',
    priority: 'medium'
  },
  {
    id: 2,
    from: "Jane Smith",
    message: "Please check the attendance records for ICT101",
    time: "30m ago",
    unread: true,
    type: 'message',
    priority: 'high'
  },
  {
    id: 3,
    from: "Admin",
    message: "Your account settings have been updated successfully",
    time: "1h ago",
    unread: false,
    type: 'message',
    priority: 'low'
  },
  {
    id: 4,
    from: "System",
    message: "New features available in the attendance dashboard",
    time: "2h ago",
    unread: false,
    type: 'message',
    priority: 'low'
  }
];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications and messages
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real implementation, fetch from API
      // const response = await fetch('/api/notifications');
      // const data = await response.json();
      
      setNotifications(mockNotifications);
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Removed dependencies since mock data is now static

  // Mark notification as read
  const markAsRead = useCallback(async (id: number, type: 'notification' | 'message') => {
    try {
      // In real implementation, call API
      // await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      
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