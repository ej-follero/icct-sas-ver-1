"use client";

import React, { useState } from "react";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import { Menu as MenuIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { role } from "@/lib/data";
import type { Role } from "@/components/Menu";
//import { Role } from "@prisma/client";

const SIDEBAR_WIDTH = 256; // 64 * 4 = 256px (w-64)
const HEADER_HEIGHT = 64; // h-16

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerToggle = () => setDrawerOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - fixed, full height */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 w-64 h-full z-30 bg-[#0c2556] border-r border-blue-900 shadow-lg">
        <Menu role={role as Role} />
      </aside>
      {/* Main area: header/navbar and content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen pt-16">
        {/* Header/Navbar - fixed at top of main area */}
        <header className="fixed top-0 z-20 w-full h-16 bg-white shadow flex items-center justify-end px-4 md:px-8 border-b">
          <Navbar />
        </header>
        {/* Main Content */}
        <main className="flex-1 p-4 bg-gray-50 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
