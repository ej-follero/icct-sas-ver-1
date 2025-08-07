"use client";

import { useState } from "react";
import { Users, User, BarChart2, CalendarCheck, AlertCircle, PlusCircle, Megaphone, FileText, Settings, RefreshCw, Download, Bell, CheckCircle, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActionsPanel, MoreOptionsGroup } from "@/components/reusable/QuickActionsPanel";

// Placeholder for analytics chart
function PlaceholderChart({ title }: { title: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 flex flex-col items-center justify-center h-64 border border-blue-100 shadow-inner">
      <BarChart2 className="w-12 h-12 text-blue-400 mb-2" />
      <div className="text-lg font-semibold text-blue-900 mb-1">{title}</div>
      <div className="text-blue-600">(Chart placeholder)</div>
    </div>
  );
}

export default function AdminDashboardPage() {

  // Example analytics data
  const stats = [
    {
      label: "Total Students",
      value: 1240,
      icon: Users,
      color: "from-blue-500 to-blue-700"
    },
    {
      label: "Total Instructors",
      value: 87,
      icon: User,
      color: "from-indigo-500 to-indigo-700"
    },
    {
      label: "Attendance Rate",
      value: "96.2%",
      icon: CalendarCheck,
      color: "from-green-500 to-green-700"
    },
    {
      label: "Absentees Today",
      value: 14,
      icon: AlertCircle,
      color: "from-red-500 to-red-700"
    }
  ];

  // Example recent activity
  const recentActivity = [
    { id: 1, type: "attendance", message: "Marked attendance for Section A1", time: "2 min ago" },
    { id: 2, type: "user", message: "Added new instructor: Jane D.", time: "10 min ago" },
    { id: 3, type: "system", message: "System backup completed", time: "30 min ago" },
    { id: 4, type: "notification", message: "Sent alert to all students", time: "1 hr ago" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />
      <main className="flex-1 pt-20 p-6">
        <div className="container mx-auto space-y-6">
          {/* Gradient Header */}
          <Card className="border-0 shadow-none bg-transparent">
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-6 py-6 rounded-xl flex items-center gap-4">
              <Users className="w-10 h-10 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-blue-100">Overview and management of the attendance system</p>
              </div>
            </div>
          </Card>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className={`shadow-xl border-0 bg-gradient-to-r ${stat.color}`}>
                <CardContent className="flex items-center gap-4 p-6">
                  <stat.icon className="w-10 h-10 text-white bg-white/20 rounded-full p-2" />
                  <div>
                    <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                    <div className="text-white/80 text-sm font-medium">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content: Analytics + Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Analytics/Charts Section */}
            <div className="xl:col-span-3 space-y-6">
              <PlaceholderChart title="Attendance Trends" />
              <PlaceholderChart title="Department Breakdown" />
            </div>

            {/* Quick Actions Panel */}
            <div className="xl:col-span-1">
              <QuickActionsPanel
                title="Quick Actions"
                subtitle="Essential tools and shortcuts"
                icon={<CheckCircle className="w-4 h-4 text-blue-600" />}
                className="h-fit"
                primaryAction={{
                  id: 'add-user',
                  label: 'Add User',
                  icon: <PlusCircle className="h-4 w-4" />,
                  onClick: () => console.log('Add User clicked'),
                  className: "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white w-full"
                }}
                secondaryActions={[
                  {
                    id: 'dashboard-actions',
                    label: 'Actions',
                    icon: <Settings className="h-4 w-4" />,
                    variant: 'outline' as const,
                    items: [
                      {
                        id: 'export-data',
                        label: 'Export Data',
                        icon: <Download className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                        onClick: () => console.log('Export Data clicked')
                      },
                      {
                        id: 'send-notification',
                        label: 'Send Notification',
                        icon: <Bell className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                        onClick: () => console.log('Send Notification clicked')
                      },
                      {
                        id: 'generate-report',
                        label: 'Generate Report',
                        icon: <FileText className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                        onClick: () => console.log('Generate Report clicked')
                      },
                      {
                        id: 'system-settings',
                        label: 'System Settings',
                        icon: <Settings className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                        onClick: () => console.log('System Settings clicked')
                      }
                    ]
                  }
                ]}
              />
            </div>
          </div>

          {/* Recent Activity/Logs */}
          <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden p-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Megaphone className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-900">Recent Activity</h3>
              </div>
              <ul className="divide-y divide-blue-100">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="py-3 flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                    <span className="flex-1 text-gray-700">{activity.message}</span>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
