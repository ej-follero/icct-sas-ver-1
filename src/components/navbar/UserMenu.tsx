"use client";

import React from "react";
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
  const { user, profile, logout, loading } = useUser();

  const handleMenuAction = async (action: "profile" | "settings" | "help" | "logout") => {
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
        await logout();
        break;
    }
  };

  if (loading) {
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

  if (!user) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div 
          className="hidden sm:flex items-center mr-1 group relative cursor-pointer select-none" 
          role="button"
          tabIndex={0}
          aria-label="User account menu"
          aria-haspopup="dialog"
          aria-expanded={open}
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
              <div className="font-semibold text-blue-900 truncate text-base">{user.name}</div>
              <div className="text-sm text-gray-500 truncate">{user.email}</div>
              {user.department && (
                <div className="text-xs text-gray-400 truncate">{user.department}</div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
              {user.role}
            </Badge>
            {user.lastLogin && (
              <span className="text-xs text-gray-400">
                Last login: {new Date(user.lastLogin).toLocaleDateString()}
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
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <div className="flex-1 text-left">
                <div className="font-medium text-red-600">Sign Out</div>
                <div className="text-xs text-red-500">Sign out of your account</div>
              </div>
            </Button>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}; 