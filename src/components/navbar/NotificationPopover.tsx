"use client";

import React, { useCallback, useEffect } from "react";
import { Bell, MessageCircle, CheckCheck, AlertTriangle, Info, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NotificationPopoverProps {
  type: "notifications" | "messages";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getPriorityIcon = (priority?: string) => {
  switch (priority) {
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'medium':
      return <Info className="w-4 h-4 text-yellow-500" />;
    case 'low':
      return <Info className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-red-500 bg-red-50';
    case 'medium':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'low':
      return 'border-l-blue-500 bg-blue-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  type,
  open,
  onOpenChange,
}) => {
  const {
    notifications,
    messages,
    markAsRead,
    markAllAsRead,
    loading,
    refresh
  } = useNotifications();

  // Safety check for refresh function
  const safeRefresh = refresh || (() => {});

  const items = type === "messages" ? messages : notifications;
  const unreadCount = items.filter((item) => item.unread).length;
  const isMessages = type === "messages";
  
  const Icon = isMessages ? MessageCircle : Bell;
  const title = isMessages ? "Messages" : "Notifications";

  const handleItemClick = useCallback(async (item: NotificationItem) => {
    if (item.unread) {
      await markAsRead(item.id, item.type);
    }
    
    // Navigate to action URL if available
    if (item.actionUrl) {
      window.location.href = item.actionUrl;
    }
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead(type === "messages" ? "message" : "notification");
  }, [markAllAsRead, type]);

  // Refresh notifications when popover opens for real-time updates
  useEffect(() => {
    if (open && safeRefresh) {
      safeRefresh();
    }
  }, [open, safeRefresh]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-white hover:text-accent-foreground h-10 w-10 relative cursor-pointer rounded-xl"
          role="button"
          tabIndex={0}
          aria-label={title}
        >
          <Badge
            variant="destructive"
            className="absolute -top-1.5 -right-1.5 text-[9px] min-w-[1.5rem] min-h-[0.5rem] px-0.5 py-0 flex items-center justify-center font-bold"
            hidden={unreadCount === 0}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
          <Icon className="w-5 h-5 text-blue-700" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 rounded-xl shadow-lg border border-gray-100 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-900 text-lg">{title}</span>
            <span className="font-bold text-blue-900 text-base">({items.length})</span>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                className="text-red-500 font-semibold text-sm hover:underline focus:outline-none"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
        {/* List */}
        <div className="max-h-96 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No {type} yet</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 px-6 py-4 border-b last:border-b-0 bg-white items-start"
                >
                  {/* Avatar or icon */}
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      {typeof (item as any).avatarUrl === "string" && (item as any).avatarUrl ? (
                        <AvatarImage src={(item as any).avatarUrl} alt={item.from || item.title || ""} />
                      ) : (
                        <AvatarFallback>{(item.from || item.title || "?").charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-900 text-base truncate">
                        {isMessages ? item.from : item.title}
                      </span>
                      {item.unread && (
                        <Badge variant="info" className="text-xs px-2 py-0.5 rounded-full font-semibold">New</Badge>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm mb-1">
                      {item.message}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{item.time}</div>
                    {/* Actions for notifications */}
                    {type === "notifications" && "actions" in item && Array.isArray((item as any).actions) && (
                      <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 px-3 py-1 rounded-md">Deny</Button>
                        <Button variant="icct" size="sm" className="px-3 py-1 rounded-md">Approve</Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-white rounded-b-xl">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-gray-200 text-gray-700 font-semibold rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="icct"
            size="lg"
            className="flex-1 font-bold rounded-xl"
            onClick={() => window.location.href = type === "messages" ? "/messages" : "/notifications"}
          >
            View All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 