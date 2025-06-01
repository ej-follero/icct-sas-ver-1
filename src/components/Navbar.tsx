"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import CustomMenu from "@/components/Menu";
import {
  Menu,
  X,
  ChevronDown,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell,
  MessageCircle,
  MoreHorizontal,
  CheckCheck,
  Sun,
  Moon,
  Search,
  LayoutDashboard,
  FileBarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // if you use classnames utility

const HEADER_HEIGHT = 64;

// Mock notifications data
const notifications = [
  { id: 1, title: "New attendance record", message: "Class ICT101 attendance has been recorded", time: "5m ago", unread: true },
  { id: 2, title: "System Update", message: "System maintenance scheduled for tonight", time: "1h ago", unread: true },
  { id: 3, title: "Welcome!", message: "Welcome to ICCT Smart Attendance System", time: "2h ago", unread: false },
];

// Mock messages data
const messages = [
  { id: 1, from: "John Doe", message: "When is the next meeting?", time: "10m ago", unread: true },
  { id: 2, from: "Jane Smith", message: "Please check the attendance records", time: "30m ago", unread: true },
  { id: 3, from: "Admin", message: "Your account has been updated", time: "1h ago", unread: false },
];

type MenuAction = "profile" | "settings" | "help" | "logout";

const userMenuItems = [
  { label: "Profile", icon: <User className="w-4 h-4" />, action: "profile" },
  { label: "Settings", icon: <Settings className="w-4 h-4" />, action: "settings" },
  { label: "Help", icon: <HelpCircle className="w-4 h-4" />, action: "help" },
  { type: "divider" as const },
  { label: "Logout", icon: <LogOut className="w-4 h-4" />, action: "logout" },
];

/**
 * Navbar component
 * Automatically hides the search bar if another search bar exists elsewhere on the page.
 */
const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [shouldShowSearchBar, setShouldShowSearchBar] = useState(true);
  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for DOM to be ready
    setTimeout(() => {
      // Find all search inputs (type='search' or aria-label='Search')
      const allSearchInputs = Array.from(document.querySelectorAll('input[type="search"], input[aria-label="Search"]'));
      // Exclude those inside the navbar
      const navbarNode = navbarRef.current;
      const filtered = allSearchInputs.filter(input => {
        let node = input.parentElement;
        while (node) {
          if (node === navbarNode) return false;
          node = node.parentElement;
        }
        return true;
      });
      setShouldShowSearchBar(filtered.length === 0);
    }, 0);
    // Optionally, rerun on route change if using Next.js router events
  }, []);

  const handleMenuAction = (action: MenuAction) => {
    setUserMenuOpen(false);
    // TODO: Implement real actions
    alert(`Action: ${action}`);
  };
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    // TODO: Implement real theme switching
    alert("Theme toggled (stub)");
  };
  const handleQuickAccess = (type: string) => {
    // TODO: Implement navigation
    alert(`Quick access: ${type}`);
  };
  const handleHelp = () => {
    // TODO: Implement help/support
    alert("Help/Support (stub)");
  };

  return (
    <header
      ref={navbarRef}
      className="fixed top-0 left-0 w-full h-16 bg-white z-50 shadow border-b border-gray-200"
      style={{ height: HEADER_HEIGHT }}
    >
      <nav className="w-full flex items-center justify-end gap-2 h-full px-8">
        {/* Right: Search Bar and Icons */}
        <div className="flex items-center gap-2">
          {/* Search Bar with Tooltip (auto-detects other search bars) */}
          {shouldShowSearchBar && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`relative max-w-xs transition ${searchFocused ? "ring-2 ring-blue-400" : ""}`} tabIndex={0}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      placeholder="Search..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      aria-label="Search"
                      style={{ minWidth: '180px' }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {/* Quick Access Icons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Dashboard" onClick={() => handleQuickAccess("dashboard")}> 
                  <LayoutDashboard className="w-5 h-5 text-gray-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dashboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Reports" onClick={() => handleQuickAccess("reports")}> 
                  <FileBarChart2 className="w-5 h-5 text-gray-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reports</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Notifications */}
          <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
            <PopoverTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Messages"
                      className="relative"
                    >
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 text-xs min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center border-2 border-white shadow-sm"
                        hidden={messages.filter((m) => m.unread).length === 0}
                      >
                        {messages.filter((m) => m.unread).length}
                      </Badge>
                      <MessageCircle className="w-5 h-5 text-gray-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Messages</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold">Messages</span>
              </div>
              <ul>
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className={cn(
                      "px-4 py-3 border-b last:border-b-0 cursor-pointer",
                      msg.unread ? "bg-blue-50" : ""
                    )}
                  >
                    <div className="font-medium text-gray-800">{msg.from}</div>
                    <div className="text-gray-500 text-xs">{msg.message}</div>
                    <div className="text-gray-400 text-xs mt-1">{msg.time}</div>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Notifications"
                      className="relative"
                    >
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 text-xs min-w-[1.5rem] min-h-[1.5rem] flex items-center justify-center border-2 border-white shadow-sm"
                        hidden={notifications.filter((n) => n.unread).length === 0}
                      >
                        {notifications.filter((n) => n.unread).length}
                      </Badge>
                      <Bell className="w-5 h-5 text-gray-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold">Notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => {
                    // Mark all as read logic here
                  }}
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </Button>
              </div>
              <ul>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={cn(
                      "px-4 py-3 border-b last:border-b-0 cursor-pointer",
                      notif.unread ? "bg-blue-50" : ""
                    )}
                  >
                    <div className="font-medium text-gray-800">{notif.title}</div>
                    <div className="text-gray-500 text-xs">{notif.message}</div>
                    <div className="text-gray-400 text-xs mt-1">{notif.time}</div>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          {/* Theme Switcher */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={handleThemeToggle}>
                  {theme === "light" ? <Moon className="w-5 h-5 text-gray-700" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Help/Support */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help/Support" onClick={handleHelp}>
                  <HelpCircle className="w-5 h-5 text-gray-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help & Support</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* User Info & Dropdown */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <PopoverTrigger asChild>
                    <div className="hidden sm:flex items-center gap-2 mr-1 group relative cursor-pointer select-none">
                      <Avatar className="w-9 h-9 bg-gray-200">
                        <AvatarFallback>
                          <User className="w-6 h-6 text-blue-700" />
                        </AvatarFallback>
                        {/* <AvatarImage src="/your-avatar.png" /> */}
                      </Avatar>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-gray-900">EJ Yu</span>
                        <span className="text-xs text-gray-500">Admin</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-700 ml-1 group-hover:text-blue-700 transition" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0">
                    <ul>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full flex items-center gap-2 justify-start px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => handleMenuAction("profile")}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full flex items-center gap-2 justify-start px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => handleMenuAction("settings")}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full flex items-center gap-2 justify-start px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => handleMenuAction("help")}
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Help</span>
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full flex items-center gap-2 justify-start px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => handleMenuAction("logout")}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </Button>
                      </li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>Account</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Mobile Menu Button */}
          <div className="flex md:hidden ml-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              {drawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setDrawerOpen(false)}>
          <aside
            className="fixed top-0 right-0 h-full w-72 bg-gray-50 shadow-lg flex flex-col"
            style={{ minHeight: "100vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end h-16 px-4 border-b border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <CustomMenu role="admin" />
          </aside>
        </div>
      )}
    </header>
  );
};

export default Navbar;
