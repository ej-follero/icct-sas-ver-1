"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import CustomMenu from "@/components/Menu";
import { Menu, X, Maximize2, Minimize2, LayoutDashboard, FileBarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider 
} from "@/components/ui/tooltip";
import { QuickAccessButtons } from "@/components/navbar/QuickAccessButtons";
import { NotificationPopover } from "@/components/navbar/NotificationPopover";
import { UserMenu } from "@/components/navbar/UserMenu";
import Sidebar, { Role } from "@/components/Menu";

const HEADER_HEIGHT = 64;

/**
 * Navbar component
 */
const Navbar = ({ onSidebarToggle, sidebarCollapsed, logoOnly = false, hideLogo = false, role = "admin" }: { onSidebarToggle: () => void; sidebarCollapsed: boolean; logoOnly?: boolean; hideLogo?: boolean; role?: Role }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);


  const handleQuickAccess = useCallback((type: string) => {
    switch (type) {
      case "dashboard":
        window.location.href = "/dashboard";
        break;
      case "reports":
        window.location.href = "/reports";
        break;
      default:
        console.warn(`Unknown quick access type: ${type}`);
    }
  }, []);

  // Fullscreen toggle logic
  const handleFullscreenToggle = useCallback(() => {
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Accessibility: close drawer on Escape
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  if (logoOnly) {
    return (
      <div className={`flex items-center h-full w-full justify-between`}>
        <div className="flex-shrink-0">
          <Logo variant={sidebarCollapsed ? "compact" : "default"} />
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onSidebarToggle}
            className="md:inline-flex flex-shrink-0 hover:bg-white rounded-xl"
          >
            <Menu className="w-6 h-6 text-blue-700" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Mobile Drawer and Backdrop */}
      {mobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
            onClick={() => {
              console.log('Backdrop clicked, closing drawer');
              setMobileDrawerOpen(false);
            }}
            aria-label="Close menu backdrop"
          />
          {/* Drawer */}
          <div
            className="fixed top-[64px] left-0 h-[calc(100vh-64px)] w-64 bg-[#0c2556] z-60 shadow-2xl transition-transform duration-200 md:hidden"
            style={{ transform: mobileDrawerOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            aria-label="Mobile menu drawer"
          >
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => {
                  console.log('Close button clicked');
                  setMobileDrawerOpen(false);
                }}
                className="hover:bg-blue-800/50 rounded-xl text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            {/* Sidebar navigation inside drawer */}
            <Sidebar role={role} collapsed={false} />
          </div>
        </>
      )}

      <header
        ref={navbarRef}
        className="fixed top-0 left-0 w-full h-16 bg-blue-100 z-50 shadow border-b border-gray-200"
        style={{ height: HEADER_HEIGHT }}
      >
        <nav className="w-full flex items-center justify-between gap-2 h-full px-2 md:px-0">
          {/* Left side: Logo and Hamburger icon, together and spaced */}
          <div className="flex items-center w-auto md:w-64 justify-between">
            {!hideLogo && (
              <div className="flex-shrink-0">
                <Logo variant={sidebarCollapsed ? "compact" : "default"} />
              </div>
            )}
            {/* Hamburger for mobile - always visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => {
                console.log('Mobile hamburger clicked, current state:', mobileDrawerOpen);
                setMobileDrawerOpen(true);
                console.log('Mobile drawer should now be open');
              }}
              className="inline-flex md:hidden hover:bg-white rounded-xl ml-2 cursor-pointer z-50 relative"
              style={{ 
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minWidth: '44px',
                minHeight: '44px'
              }}
              data-testid="mobile-hamburger"
            >
              <Menu className="w-6 h-6 text-blue-700" />
            </Button>
            {/* Sidebar toggle for desktop */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={onSidebarToggle}
              className="hidden md:inline-flex hover:bg-white rounded-xl ml-2"
            >
              <Menu className="w-6 h-6 text-blue-700" />
            </Button>
          </div>
          {/* Right side: Controls (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 flex-1 w-full justify-end pr-0 md:pr-16">
            {/* Quick Access Buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Dashboard"
                    onClick={() => handleQuickAccess("dashboard")}
                    className="hover:bg-white rounded-xl"
                  >
                    <LayoutDashboard className="w-5 h-5 text-blue-700" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Main Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Reports"
                    onClick={() => handleQuickAccess("reports")}
                    className="hover:bg-white rounded-xl"
                  >
                    <FileBarChart2 className="w-5 h-5 text-blue-700" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Reports</TooltipContent>
            </Tooltip>
            
            {/* Notifications Popover */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <NotificationPopover
                    type="notifications"
                    open={notificationsOpen}
                    onOpenChange={setNotificationsOpen}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            {/* Fullscreen Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    onClick={handleFullscreenToggle}
                    className="hover:bg-white rounded-xl"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-5 h-5 text-blue-700" />
                    ) : (
                      <Maximize2 className="w-5 h-5 text-blue-700" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</TooltipContent>
            </Tooltip>
            {/* User Menu */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <UserMenu
                    open={userMenuOpen}
                    onOpenChange={setUserMenuOpen}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>Account</TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </header>
    </TooltipProvider>
  );
};

export default Navbar;
