"use client";

import React, { useCallback, useMemo, useState } from "react";
import { User, Settings, HelpCircle, LogOut, ChevronDown, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";

interface UserMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  open,
  onOpenChange,
}) => {
  // Validate props without breaking hook order
  const safeOnOpenChange = onOpenChange ?? (() => {});

  const { user, profile, logout, loading } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleMenuAction = useCallback(async (action: "profile" | "settings" | "help" | "logout") => {
    try {
      switch (action) {
        case "profile":
          window.location.href = "/settings/profile";
          break;
        case "settings":
          window.location.href = "/settings";
          break;
        case "help":
          window.location.href = "/help";
          break;
        case "logout":
          try {
            setIsLoggingOut(true);
            await logout();
          } catch (error) {
            console.error('Logout failed:', error);
            // You could show a toast notification here
          } finally {
            setIsLoggingOut(false);
          }
          break;
      }
    } catch (error) {
      console.error('UserMenu action error:', error);
    }
  }, [logout]);

  const isLoading = loading;

  // Memoize user display information
  const userDisplayInfo = useMemo(() => {
    if (!user) return null;
    
    return {
      name: profile?.name || user.email || 'User',
      email: user.email || '',
      role: user.role || 'User',
      department: profile?.department || '',
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : null
    };
  }, [user, profile]);

  const hasUser = Boolean(user);

  if (isLoading) {
    return (
      <div className="hidden sm:flex items-center gap-2 mr-1">
        <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex flex-col items-end">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
        </div>
      </div>
    );
  }

  if (!hasUser) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={safeOnOpenChange}>
      <PopoverTrigger asChild>
        <div 
          className="hidden sm:flex items-center mr-1 group relative cursor-pointer select-none" 
          role="button"
          tabIndex={0}
          aria-label="User account menu"
          aria-haspopup="dialog"
          aria-expanded={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenChange(!open);
            }
          }}
        >
          <Avatar className="w-9 h-9 bg-gray-200">
            <AvatarFallback>
              <User className="w-6 h-6 text-blue-700" />
            </AvatarFallback>
          </Avatar>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 mr-8 rounded-xl shadow-lg p-0 border border-gray-100">
        {/* User Info Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 rounded-t-xl bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 bg-gray-200">
              <AvatarFallback>
                <User className="w-8 h-8 text-blue-700" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-blue-900 truncate text-base">{userDisplayInfo?.name}</div>
              <div className="text-sm text-gray-500 truncate">{userDisplayInfo?.email}</div>
              {userDisplayInfo?.department && (
                <div className="text-xs text-gray-400 truncate">{userDisplayInfo.department}</div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
              {userDisplayInfo?.role}
            </Badge>
            {userDisplayInfo?.lastLogin && (
              <span className="text-xs text-gray-400">
                Last login: {userDisplayInfo.lastLogin}
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <ul className="py-2 px-2 bg-white rounded-b-xl">
          <li className="mb-1">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start px-4 py-3 text-blue-900 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition"
              onClick={() => handleMenuAction("profile")}
            >
              <User className="w-4 h-4 text-blue-700" />
              <div className="flex-1 text-left">
                <div className="font-medium text-blue-900">Profile</div>
                <div className="text-xs text-gray-500">View and edit your profile</div>
              </div>
            </Button>
          </li>
          <li className="mb-1">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start px-4 py-3 text-blue-900 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition"
              onClick={() => handleMenuAction("settings")}
            >
              <Settings className="w-4 h-4 text-blue-700" />
              <div className="flex-1 text-left">
                <div className="font-medium text-blue-900">Settings</div>
                <div className="text-xs text-gray-500">Manage your preferences</div>
              </div>
            </Button>
          </li>
          <li className="mb-2">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start px-4 py-3 text-blue-900 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition"
              onClick={() => handleMenuAction("help")}
            >
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <div className="flex-1 text-left">
                <div className="font-medium text-blue-900">Help & Support</div>
                <div className="text-xs text-gray-500">Get help and documentation</div>
              </div>
            </Button>
          </li>
          {/* Divider */}
          <li className="border-t border-gray-100 my-2"></li>
          <li className="mb-1">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start px-4 py-3 text-blue-900 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition"
              onClick={() => window.location.href = "/settings/security"}
            >
              <Shield className="w-4 h-4 text-blue-700" />
              <div className="flex-1 text-left">
                <div className="font-medium text-blue-900">Security</div>
                <div className="text-xs text-gray-500">Password and security settings</div>
              </div>
            </Button>
          </li>
          <li className="mb-2">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start px-4 py-3 text-blue-900 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition"
              onClick={() => window.location.href = "/settings/activity"}
            >
              <Activity className="w-4 h-4 text-blue-700" />
              <div className="flex-1 text-left">
                <div className="font-medium text-blue-900">Activity</div>
                <div className="text-xs text-gray-500">View your recent activity</div>
              </div>
            </Button>
          </li>
          {/* Divider */}
          <li className="border-t border-gray-100 my-2"></li>
          <li>
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 justify-start px-4 py-3 text-red-600 hover:bg-red-100 rounded-lg transition"
              onClick={() => handleMenuAction("logout")}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <div className="flex-1 text-left">
                <div className="font-medium text-red-600">
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </div>
                <div className="text-xs text-red-500">
                  {isLoggingOut ? 'Please wait...' : 'Sign out of your account'}
                </div>
              </div>
            </Button>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}; 