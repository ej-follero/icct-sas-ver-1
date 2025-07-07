"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import CustomMenu from "@/components/Menu";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchBar } from "@/components/navbar/SearchBar";
import { QuickAccessButtons } from "@/components/navbar/QuickAccessButtons";
import { NotificationPopover } from "@/components/navbar/NotificationPopover";
import { UserMenu } from "@/components/navbar/UserMenu";
import { UtilityButtons } from "@/components/navbar/UtilityButtons";
import { useSearch } from "@/hooks/useSearch";

const HEADER_HEIGHT = 64;

/**
 * Navbar component
 * Automatically hides the search bar if another search bar exists elsewhere on the page.
 */
const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [shouldShowSearchBar, setShouldShowSearchBar] = useState(true);
  const navbarRef = useRef<HTMLDivElement>(null);
  
  const {
    query,
    setQuery,
    results,
    loading,
    history,
    showHistory,
    setShowHistory,
    clearHistory,
    removeFromHistory,
    navigateToResult,
    getSuggestions
  } = useSearch();

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
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

    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && drawerOpen) { // 768px is the md breakpoint
        setDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerOpen]);

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

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen((open) => !open);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <TooltipProvider>
      <header
        ref={navbarRef}
        className="fixed top-0 left-0 w-full h-16 bg-white z-50 shadow border-b border-gray-200"
        style={{ height: HEADER_HEIGHT }}
      >
        <nav className="w-full flex items-center justify-end gap-2 h-full px-8">
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            {shouldShowSearchBar && (
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search students, teachers, courses..."
                results={results}
                loading={loading}
                history={history}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                clearHistory={clearHistory}
                removeFromHistory={removeFromHistory}
                navigateToResult={navigateToResult}
                getSuggestions={getSuggestions}
              />
            )}
            
            {/* Quick Access Buttons */}
            <QuickAccessButtons
              onDashboardClick={() => handleQuickAccess("dashboard")}
              onReportsClick={() => handleQuickAccess("reports")}
            />
            
            {/* Messages Popover */}
            <NotificationPopover
              type="messages"
              open={messagesOpen}
              onOpenChange={setMessagesOpen}
            />
            
            {/* Notifications Popover */}
            <NotificationPopover
              type="notifications"
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
            />
            
            {/* Utility Buttons */}
            <UtilityButtons />
            
            {/* User Menu */}
            <UserMenu
              open={userMenuOpen}
              onOpenChange={setUserMenuOpen}
            />
            
            {/* Mobile Menu Button */}
            <div className="flex md:hidden ml-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={handleDrawerToggle}
              >
                {drawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/30" onClick={handleDrawerClose}>
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
                  onClick={handleDrawerClose}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <CustomMenu role="admin" />
            </aside>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
};

export default Navbar;
