"use client";

import React, { useCallback } from "react";
import { Bell, MessageCircle, CheckCheck, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";

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
    loading
  } = useNotifications();

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

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={title}
          title={title}
        >
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 text-xs min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center border-2 border-white shadow-sm"
            hidden={unreadCount === 0}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold">{title}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={loading}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No {type} yet</p>
            <p className="text-xs mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors",
                  item.unread ? getPriorityColor(item.priority) : "hover:bg-gray-50",
                  item.actionUrl && "hover:bg-blue-50"
                )}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(item.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-800 truncate">
                        {isMessages ? item.from : item.title}
                      </div>
                      {item.unread && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                      {item.actionUrl && (
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                      {item.message}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {item.time}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}; 