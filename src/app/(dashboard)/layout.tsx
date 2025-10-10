"use client";

import React, { useState } from "react";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import { Menu as MenuIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Role } from "@/components/Menu";
import { useUser } from "@/hooks/useUser";
//import { Role } from "@prisma/client";

const SIDEBAR_WIDTH = 256; // 64 * 4 = 256px (w-64)
const SIDEBAR_COLLAPSED_WIDTH = 64; // collapsed width
const HEADER_HEIGHT = 64; // h-16

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isInitialized } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleSidebarToggle = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - fixed, full height - hidden on mobile, shown on desktop */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] z-30 bg-[#0c2556] shadow-lg transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        style={{ width: sidebarCollapsed ? 64 : 256 }}
      >
        <Menu role={mapRoleToMenuRole(user?.role)} collapsed={sidebarCollapsed} />
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
        <main className="flex-1 p-4 bg-gray-50 min-h-[calc(100vh-4rem)] pt-20 md:pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}

function mapRoleToMenuRole(role?: string): Role {
  const r = (role || '').toUpperCase();
  if (r === 'SUPER_ADMIN') return 'super_admin';
  if (r === 'ADMIN') return 'admin';
  if (r === 'DEPARTMENT_HEAD') return 'department_head';
  if (r === 'INSTRUCTOR' || r === 'TEACHER') return 'teacher';
  if (r === 'STUDENT') return 'student';
  return 'student';
}
