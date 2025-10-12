"use client";

import React, { useState } from "react";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import { useUser } from "@/hooks/useUser";
import type { Role } from "@/components/Menu";

const SIDEBAR_WIDTH = 256; // 64 * 4 = 256px (w-64)
const SIDEBAR_COLLAPSED_WIDTH = 64; // collapsed width
const HEADER_HEIGHT = 64; // h-16

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, isInitialized, loading } = useUser();
  const handleSidebarToggle = () => setSidebarCollapsed((prev) => !prev);
  
  // Get stable role for menu - only change when user actually changes
  const [stableRole, setStableRole] = useState<Role>('student');
  
  // Update stable role only when user is fully loaded and role is confirmed
  React.useEffect(() => {
    if (isInitialized && user?.role && !loading) {
      const mappedRole = mapRoleToMenuRole(user.role);
      setStableRole(mappedRole);
    }
  }, [user?.role, isInitialized, loading]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - fixed, full height - hidden on mobile, shown on desktop */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] z-30 bg-[#0c2556] shadow-lg transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        style={{ width: sidebarCollapsed ? 64 : 256 }}
      >
        <Menu role={stableRole} collapsed={sidebarCollapsed} />
      </aside>
      
      {/* Logo/hamburger group fixed over sidebar - hidden on mobile, shown on desktop */}
      <div className={`hidden md:flex flex-col fixed left-0 top-0 h-16 z-40 bg-blue-100 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        style={{ width: sidebarCollapsed ? 64 : 256 }}
      >
        <div className="flex items-center h-full">
          <Navbar onSidebarToggle={handleSidebarToggle} sidebarCollapsed={sidebarCollapsed} logoOnly />
        </div>
      </div>
      
      {/* Main area: header/navbar and content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Header/Navbar - fixed at top, full width on mobile, offset on desktop */}
        <header className={`fixed top-0 z-20 w-full h-16 bg-blue-100 shadow flex items-center px-4 md:px-8 border-b transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <Navbar onSidebarToggle={handleSidebarToggle} sidebarCollapsed={sidebarCollapsed} hideLogo />
        </header>
        
        {/* Main Content - responsive padding */}
        <main className="flex-1 p-4 bg-gray-50 min-h-[calc(100vh-4rem)] pt-16 md:pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}

function mapRoleToMenuRole(role?: string): Role {
  if (!role) return 'student'; // Default fallback
  
  const r = (role || '').toUpperCase();
  if (r === 'SUPER_ADMIN') return 'super_admin';
  if (r === 'ADMIN') return 'admin';
  if (r === 'DEPARTMENT_HEAD') return 'department_head';
  if (r === 'INSTRUCTOR' || r === 'TEACHER') return 'teacher';
  if (r === 'STUDENT') return 'student';
  return 'student';
} 