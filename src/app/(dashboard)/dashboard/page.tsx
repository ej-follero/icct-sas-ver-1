"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, User, BarChart2, CalendarCheck, AlertCircle, Megaphone, FileText, Settings, RefreshCw, 
  Download, Bell, CheckCircle, ChevronRight, Search, BookOpen, Building2, GraduationCap, 
  UserCheck, UserX, Clock, Info, Hash, Tag, Layers, BadgeInfo, Plus, Upload, Printer, 
  Columns3, List, X, Loader2, Eye, Database, Shield, Wifi, WifiOff, TrendingUp, 
  Activity, Zap, Target, Award, Users2, BookOpenCheck, Building, UserPlus, 
  Calendar, Mail, MessageSquare, AlertTriangle, CheckCircle2, XCircle, 
  ArrowUp, ArrowDown, Minus, Filter, MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Mock data
const mockStats = {
  totalStudents: 1250,
  totalInstructors: 45,
  totalClasses: 120,
  attendanceRate: 87.5,
  activeClasses: 15,
  completedClasses: 8,
  upcomingClasses: 7,
  lateArrivals: 23,
  absences: 45
};

const mockRecentActivity = [
  { id: 1, type: 'attendance', message: 'John Doe marked present in Math 101', time: '2 minutes ago', icon: CheckCircle, color: 'text-green-500' },
  { id: 2, type: 'late', message: 'Sarah Wilson arrived late to Science 201', time: '5 minutes ago', icon: Clock, color: 'text-yellow-500' },
  { id: 3, type: 'absence', message: 'Mike Johnson marked absent in English 301', time: '10 minutes ago', icon: XCircle, color: 'text-red-500' },
  { id: 4, type: 'class', message: 'New class scheduled: Physics 401 at 2:00 PM', time: '15 minutes ago', icon: BookOpen, color: 'text-blue-500' },
  { id: 5, type: 'system', message: 'System backup completed successfully', time: '1 hour ago', icon: Database, color: 'text-purple-500' }
];

const mockQuickActions = [
  { id: 1, title: 'Mark Attendance', description: 'Record student attendance', icon: UserCheck, color: 'bg-blue-500', href: '/attendance/current-class' },
  { id: 2, title: 'View Reports', description: 'Generate attendance reports', icon: FileText, color: 'bg-green-500', href: '/reports' },
  { id: 3, title: 'Manage Students', description: 'Add or edit student information', icon: Users, color: 'bg-purple-500', href: '/list/users' },
  { id: 4, title: 'Schedule Classes', description: 'Create or modify class schedules', icon: Calendar, color: 'bg-orange-500', href: '/list/schedules' },
  { id: 5, title: 'System Settings', description: 'Configure system preferences', icon: Settings, color: 'bg-gray-500', href: '/settings' },
  { id: 6, title: 'Analytics', description: 'View detailed analytics', icon: BarChart2, color: 'bg-indigo-500', href: '/analytics/dashboard' }
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Data refreshed successfully");
    }, 1000);
  };

  const handleQuickAction = (action: any) => {
    router.push(action.href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome to the ICCT Smart Attendance System
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalInstructors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockQuickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg bg-gray-50`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Today's Summary</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-800">Active Classes</span>
                  </div>
                  <span className="text-lg font-bold text-green-900">{mockStats.activeClasses}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-800">Completed</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">{mockStats.completedClasses}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-800">Late Arrivals</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-900">{mockStats.lateArrivals}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-800">Absences</span>
                  </div>
                  <span className="text-lg font-bold text-red-900">{mockStats.absences}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}