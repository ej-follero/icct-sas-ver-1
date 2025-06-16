"use client";

import { User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Menu from "@/components/Menu";

export default function RolesPermissionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <Navbar />
      <div className="flex">
        <aside className="hidden md:block w-64 h-screen sticky top-0 left-0 bg-white border-r border-gray-200 z-30">
          <Menu role="admin" />
        </aside>
        <main className="flex-1 pt-20 pl-0 md:pl-64 p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white rounded-2xl shadow-md border border-blue-100 animate-fade-in w-full">
            <span className="bg-blue-100 p-4 rounded-full mb-4 animate-pop">
              <User className="w-12 h-12 text-blue-600" />
            </span>
            <h1 className="text-3xl font-extrabold text-blue-800 mb-2">Roles & Permissions</h1>
            <p className="text-blue-700 text-lg mb-6 text-center max-w-xl">
              Manage user roles and permissions for the ICCT Smart Attendance System. Configure access levels and assign roles here.
            </p>
            <div className="w-full max-w-6xl mx-auto">
              {/* TODO: Add roles table and actions */}
              <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-8 text-center text-blue-400">
                <p className="text-lg">Roles & permissions table coming soon...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 