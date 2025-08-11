"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Users, User, BarChart2, CalendarCheck, AlertCircle, PlusCircle, Megaphone, FileText, Settings, RefreshCw, Download, Bell, CheckCircle, ChevronRight, Maximize2, Minimize2, Search, LogOut, User as UserIcon, BookOpen, Building2, GraduationCap, UserCheck, UserX, RotateCcw, Eye, Pencil, Trash2, Archive, Clock, Info, Hash, Tag, Layers, BadgeInfo, Plus, Upload, Printer, Columns3, List, X, Loader2, Moon, Sun, Palette, Zap, Database, Shield, Wifi, WifiOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { EmptyState } from '@/components/reusable';
import { SummaryCardSkeleton, PageSkeleton } from '@/components/reusable/Skeleton';
import { useDebounce } from '@/hooks/use-debounce';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// Performance optimization utilities
const useDataCache = <T,>(key: string, fetcher: () => Promise<T>, ttl: number = 5 * 60 * 1000) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const fetchData = useCallback(async () => {
    const cached = cacheRef.current.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, timestamp: now });
      setData(result);
      return result;
    } catch (error) {
      console.error('Data fetch error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  return { data, loading, fetchData };
};

// Virtual scrolling hook for large lists
const useVirtualScroll = <T,>(
  items: T[],
  itemHeight: number = 60,
  containerHeight: number = 400
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    containerRef,
  };
};

// Chart optimization hook
const useChartOptimization = (data: any[], dependencies: any[] = []) => {
  const memoizedData = useMemo(() => data, dependencies);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsChartVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return { memoizedData, isChartVisible, chartRef };
};

// Enhanced Welcome Banner Component with Accessibility
function WelcomeBanner() {
  const adminUser = {
    name: "Admin",
    role: "System Administrator",
    pendingAttendance: 8,
    absentStudents: 14,
    lastLogin: "2 hours ago",
    systemStatus: "All systems operational"
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6" role="banner" aria-label="Welcome banner">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl shadow-lg" aria-hidden="true">
          👨‍💼
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back, {adminUser.name}</h2>
          <p className="text-gray-600 mb-2">
            <span className="font-medium text-blue-700">{adminUser.role}</span> • Last login: {adminUser.lastLogin}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true"></div>
              <span className="text-gray-600">
                <button 
                  className="text-blue-600 underline font-semibold hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={`${adminUser.pendingAttendance} pending attendance records. Click to view details.`}
                >
                  {adminUser.pendingAttendance}
                </button>{" "}
                Pending Records
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full" aria-hidden="true"></div>
              <span className="text-gray-600">
                <button 
                  className="text-gray-700 underline font-semibold hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                  aria-label={`${adminUser.absentStudents} students absent today. Click to view details.`}
                >
                  {adminUser.absentStudents}
                </button>{" "}
                Absent Today
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Attendance Trends Chart with Better Interactions
function AttendanceTrendsChart() {
  const data = [
    { date: 'Mon', present: 120, absent: 8, late: 5, total: 133 },
    { date: 'Tue', present: 132, absent: 6, late: 3, total: 141 },
    { date: 'Wed', present: 128, absent: 12, late: 7, total: 147 },
    { date: 'Thu', present: 140, absent: 4, late: 2, total: 146 },
    { date: 'Fri', present: 138, absent: 9, late: 4, total: 151 },
    { date: 'Sat', present: 110, absent: 15, late: 8, total: 133 },
    { date: 'Sun', present: 100, absent: 20, late: 10, total: 130 },
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">Attendance Trends</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Late</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="present" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
            name="Present"
          />
          <Line 
            type="monotone" 
            dataKey="absent" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#ffffff' }}
            name="Absent"
          />
          <Line 
            type="monotone" 
            dataKey="late" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
            name="Late"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Weekly overview</span>
        <span className="font-medium">Avg: 92.3% attendance</span>
      </div>
    </div>
  );
}

// Department Attendance Breakdown (BarChart)
function DepartmentBreakdownChart() {
  const data = [
    { department: 'Computer Science', attendance: 98, students: 145, courses: 12 },
    { department: 'Engineering', attendance: 95, students: 180, courses: 15 },
    { department: 'Business', attendance: 97, students: 220, courses: 18 },
    { department: 'Arts & Sciences', attendance: 93, students: 165, courses: 14 },
    { department: 'Education', attendance: 96, students: 120, courses: 10 },
    { department: 'Health Sciences', attendance: 94, students: 95, courses: 8 },
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Attendance %</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="department" 
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Bar 
            dataKey="attendance" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
            name="Attendance Rate"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">95.5%</div>
          <div className="text-gray-500">Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">925</div>
          <div className="text-gray-500">Total Students</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">77</div>
          <div className="text-gray-500">Active Courses</div>
        </div>
      </div>
    </div>
  );
}

// Real-Time Attendance Status (PieChart)
function RealTimeAttendanceStatusChart() {
  const data = [
    { name: 'Present', value: 120, color: '#22c55e' },
    { name: 'Absent', value: 14, color: '#ef4444' },
    { name: 'Late', value: 8, color: '#f59e42' },
    { name: 'Excused', value: 12, color: '#3b82f6' },
  ];
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Attendance Status</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// RFID System Health (BarChart)
function RFIDSystemHealthChart() {
  const data = [
    { name: 'Active', value: 12, color: '#22c55e' },
    { name: 'Inactive', value: 3, color: '#ef4444' },
  ];
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">RFID System Health</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 8, 8]}
            label={{ position: 'right' }}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Calendar/Events Widget
function CalendarEventsWidget() {
  const upcomingEvents = [
    { id: 1, title: "Class Schedule: CS101", date: "Feb 15, 2025", time: "2:00 PM", type: "class", room: "Room A101", instructor: "Dr. Smith" },
    { id: 2, title: "Attendance Deadline", date: "Feb 18, 2025", time: "11:59 PM", type: "deadline", description: "Submit attendance records" },
    { id: 3, title: "RFID Maintenance", date: "Feb 20, 2025", time: "10:00 PM", type: "maintenance", description: "Building A RFID readers" },
    { id: 4, title: "Exam Period", date: "Feb 25, 2025", time: "9:00 AM", type: "exam", room: "All Rooms", description: "Midterm examinations" },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'deadline': return 'bg-red-100 text-red-700 border-red-200';
      case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'exam': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return '🏢';
      case 'deadline': return '⏰';
      case 'maintenance': return '🔧';
      case 'exam': return '📝';
      default: return '📅';
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-green-500';
      case 'deadline': return 'bg-pink-500';
      case 'maintenance': return 'bg-gray-500';
      case 'exam': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Attendance Schedule</h3>
            <p className="text-blue-100 text-sm">Upcoming events and deadlines</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 ${getIconBgColor(event.type)} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-sm">{getTypeIcon(event.type)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{event.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(event.type)}`}>
                      {event.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{event.date} • {event.time}</p>
                  {event.room && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-red-500">📍</span> {event.room}
                    </p>
                  )}
                  {event.instructor && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-green-500">👨‍🏫</span> {event.instructor}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-blue-900 text-white">
                    View event details
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notifications Center
function NotificationsCenter() {
  const notifications = [
    { 
      id: 1, 
      title: "Attendance Alert", 
      message: "Section A1 has 15% absentee rate today", 
      time: "10 min ago", 
      type: "ABSENCE",
      recipient: "PARENT",
      read: false 
    },
    { 
      id: 2, 
      title: "RFID System Issue", 
      message: "Reader in Room B201 is offline", 
      time: "15 min ago", 
      type: "SYSTEM",
      recipient: "ADMIN",
      read: false 
    },
    { 
      id: 3, 
      title: "Tardiness Notification", 
      message: "Student John Doe was late for 3 consecutive classes", 
      time: "30 min ago", 
      type: "TARDINESS",
      recipient: "BOTH",
      read: true 
    },
    { 
      id: 4, 
      title: "Attendance Improvement", 
      message: "Section C2 attendance improved by 20% this week", 
      time: "1 hr ago", 
      type: "IMPROVEMENT",
      recipient: "INSTRUCTOR",
      read: true 
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ABSENCE': return 'bg-red-100 text-red-700 border-red-200';
      case 'TARDINESS': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'IMPROVEMENT': return 'bg-green-100 text-green-700 border-green-200';
      case 'SYSTEM': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CONCERN': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRecipientIcon = (recipient: string) => {
    switch (recipient) {
      case 'PARENT': return '👨‍👩‍👧‍👦';
      case 'STUDENT': return '👨‍🎓';
      case 'BOTH': return '👥';
      case 'ADMIN': return '👨‍💼';
      case 'INSTRUCTOR': return '👨‍🏫';
      default: return '📢';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V4H4v1zM14 5h6V4h-6v1zM4 11h6v-1H4v1zM14 11h6v-1h-6v1z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Attendance Notifications</h3>
            <p className="text-blue-100 text-sm">System alerts and updates</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-sm">{getRecipientIcon(notification.recipient)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{notification.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{notification.time}</span>
                    <span className="text-xs text-gray-500">→ {notification.recipient}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Birthdays/Announcements Widget
function AnnouncementsWidget() {
  const announcements = [
    { id: 1, title: "New Attendance Policy", content: "Updated attendance policy effective March 1st", date: "2 hours ago", priority: "HIGH" },
    { id: 2, title: "System Maintenance", content: "Scheduled maintenance on Feb 20, 2025", date: "1 day ago", priority: "NORMAL" },
    { id: 3, title: "RFID System Update", content: "New RFID readers installed in Building A", date: "3 days ago", priority: "HIGH" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'URGENT': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">System Announcements</h3>
            <p className="text-blue-100 text-sm">Important updates and notices</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{announcement.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{announcement.content}</p>
                  <p className="text-xs text-gray-400">{announcement.date}</p>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200">
                      Read More
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-blue-900 text-white">
                    Read full announcement
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Combined System Insights and Announcements Widget
function SystemInsightsAndAnnouncementsWidget() {
  const insights = [
    {
      id: 1,
      type: 'critical',
      title: 'Low Attendance Alert',
      message: 'Section B1 has 15% absentee rate today',
      action: 'Review Section',
      icon: '🚨',
      category: 'insight' as const
    },
    {
      id: 2,
      type: 'warning',
      title: 'RFID Reader Offline',
      message: 'Reader in Room A201 is not responding',
      action: 'Check Status',
      icon: '📡',
      category: 'insight' as const
    },
    {
      id: 3,
      type: 'info',
      title: 'Attendance Verification',
      message: '5 attendance records need verification',
      action: 'Review Records',
      icon: '✅',
      category: 'insight' as const
    },
    {
      id: 4,
      type: 'success',
      title: 'RFID System Healthy',
      message: 'All 15 RFID readers are operational',
      action: 'View Details',
      icon: '🟢',
      category: 'insight' as const
    }
  ];

  const announcements = [
    { 
      id: 5, 
      title: "New Attendance Policy", 
      content: "Updated attendance policy effective March 1st", 
      date: "2 hours ago", 
      priority: "HIGH",
      category: 'announcement' as const
    },
    { 
      id: 6, 
      title: "System Maintenance", 
      content: "Scheduled maintenance on Feb 20, 2025", 
      date: "1 day ago", 
      priority: "NORMAL",
      category: 'announcement' as const
    },
    { 
      id: 7, 
      title: "RFID System Update", 
      content: "New RFID readers installed in Building A", 
      date: "3 days ago", 
      priority: "HIGH",
      category: 'announcement' as const
    },
  ];

  const allItems = [...insights, ...announcements];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getActionStyles = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'success': return 'bg-green-100 text-green-700 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'URGENT': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">System Status & Updates</h3>
            <p className="text-blue-100 text-sm">Insights, alerts and announcements</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {allItems.map((item) => {
          const isInsight = item.category === 'insight';
          const insight = isInsight ? item as typeof insights[0] : null;
          const announcement = !isInsight ? item as typeof announcements[0] : null;
          
          return (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                    {isInsight ? (
                      <span className="text-lg">{insight!.icon}</span>
                    ) : (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {isInsight ? (
                        <span className={`text-xs px-2 py-1 rounded-full border ${getTypeStyles(insight!.type)}`}>
                          {insight!.type.toUpperCase()}
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(announcement!.priority)}`}>
                          {announcement!.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {isInsight ? insight!.message : announcement!.content}
                    </p>
                    {!isInsight && (
                      <p className="text-xs text-gray-400">{announcement!.date}</p>
                    )}
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {isInsight ? (
                        <button className={`text-xs px-3 py-1 rounded-full transition-colors ${getActionStyles(insight!.type)}`}>
                          {insight!.action}
                        </button>
                      ) : (
                        <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200">
                          Read More
                        </button>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-blue-900 text-white">
                      {isInsight ? insight!.action : 'Read full announcement'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced Quick Actions Panel with Better Interactions
function DashboardQuickActionsPanel() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastActionTime, setLastActionTime] = useState("2 minutes ago");
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'add-student',
      title: 'Add Student',
      subtitle: 'Register new student',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      type: 'action',
      color: 'blue',
      onClick: () => {
        toast.success('Opening student registration form');
        setLastActionTime("Just now");
      }
    },
    {
      id: 'mark-attendance',
      title: 'Mark Attendance',
      subtitle: 'Manual attendance entry',
      icon: <CalendarCheck className="w-5 h-5 text-green-600" />,
      type: 'action',
      color: 'green',
      onClick: () => {
        toast.success('Opening attendance marking form');
        setLastActionTime("Just now");
      }
    },
    {
      id: 'add-course',
      title: 'Add Course',
      subtitle: 'Create new course',
      icon: <BookOpen className="w-5 h-5 text-purple-600" />,
      type: 'action',
      color: 'purple',
      onClick: () => {
        toast.success('Opening course creation form');
        setLastActionTime("Just now");
      }
    },
    {
      id: 'generate-reports',
      title: 'Generate Reports',
      subtitle: 'Export analytics data',
      icon: <FileText className="w-5 h-5 text-orange-600" />,
      type: 'action',
      color: 'orange',
      onClick: () => {
        toast.success('Opening report generator');
        setLastActionTime("Just now");
      }
    },
    {
      id: 'send-notifications',
      title: 'Send Notifications',
      subtitle: 'Alert instructors & students',
      icon: <Bell className="w-5 h-5 text-red-600" />,
      type: 'action',
      color: 'red',
      hasNotification: true,
      onClick: () => {
        toast.success('Opening notification center');
        setLastActionTime("Just now");
      }
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      subtitle: 'Configure system preferences',
      icon: <Settings className="w-5 h-5 text-gray-600" />,
      type: 'action',
      color: 'gray',
      onClick: () => {
        toast.success('Opening system settings');
        setLastActionTime("Just now");
      }
    }
  ];

  const getColorClasses = (color: string, isHovered: boolean) => {
    const baseClasses = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      purple: 'bg-purple-50 border-purple-200',
      orange: 'bg-orange-50 border-orange-200',
      red: 'bg-red-50 border-red-200',
      gray: 'bg-gray-50 border-gray-200'
    };

    const hoverClasses = {
      blue: 'hover:bg-blue-100 hover:border-blue-300',
      green: 'hover:bg-green-100 hover:border-green-300',
      purple: 'hover:bg-purple-100 hover:border-purple-300',
      orange: 'hover:bg-orange-100 hover:border-orange-300',
      red: 'hover:bg-red-100 hover:border-red-300',
      gray: 'hover:bg-gray-100 hover:border-gray-300'
    };

    return `${baseClasses[color as keyof typeof baseClasses]} ${hoverClasses[color as keyof typeof hoverClasses]}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Quick Actions</h3>
            <p className="text-blue-100 text-sm">Essential tools and shortcuts</p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="p-4 space-y-3">
        {quickActions.map((action) => (
          <div 
            key={action.id} 
            className={`bg-white rounded-lg border shadow-sm transition-all duration-200 transform hover:scale-[1.02] ${getColorClasses(action.color, hoveredAction === action.id)}`}
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center transition-all duration-200 ${hoveredAction === action.id ? 'scale-110' : ''}`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    {action.hasNotification && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{action.subtitle}</p>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={action.onClick}
                      className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`${action.subtitle}. Click to open.`}
                    >
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${hoveredAction === action.id ? 'translate-x-1' : ''}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-blue-900 text-white">
                    {action.subtitle}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-500">Last action: {lastActionTime}</p>
      </div>
    </div>
  );
}

// Enhanced Loading States with Progressive Loading
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-pulse">
      <div className="md:hidden">
        <div className="h-16 bg-white border-b border-gray-200"></div>
      </div>
      <main className="flex-1 pt-1 md:pt-4 p-2 md:p-6">
        <div className="container mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Welcome Banner Skeleton */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Skeleton */}
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex flex-col xl:flex-row gap-3">
              <div className="h-10 bg-gray-200 rounded-xl w-full xl:w-80"></div>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-xl w-32"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
            <div className="xl:col-span-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="xl:col-span-4 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Drag and Drop functionality for dashboard widgets
const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'attendance-trends',
    'department-breakdown',
    'real-time-status',
    'rfid-health',
    'calendar-events',
    'system-insights',
    'notifications',
    'quick-actions'
  ]);

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    setDraggedItem(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', widgetId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetWidgetId) return;

    setWidgetOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(targetWidgetId);
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      
      return newOrder;
    });
    
    setDraggedItem(null);
  }, [draggedItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return {
    draggedItem,
    widgetOrder,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
};

// Dashboard layout customization
const useDashboardLayout = () => {
  const [layout, setLayout] = useState<'default' | 'compact' | 'detailed'>('default');
  const [showWidgets, setShowWidgets] = useState({
    attendanceTrends: true,
    departmentBreakdown: true,
    realTimeStatus: true,
    rfidHealth: true,
    calendarEvents: true,
    systemInsights: true,
    notifications: true,
    quickActions: true
  });

  const toggleWidget = useCallback((widgetKey: keyof typeof showWidgets) => {
    setShowWidgets(prev => ({
      ...prev,
      [widgetKey]: !prev[widgetKey]
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout('default');
    setShowWidgets({
      attendanceTrends: true,
      departmentBreakdown: true,
      realTimeStatus: true,
      rfidHealth: true,
      calendarEvents: true,
      systemInsights: true,
      notifications: true,
      quickActions: true
    });
  }, []);

  return {
    layout,
    setLayout,
    showWidgets,
    toggleWidget,
    resetLayout
  };
};

// Theme and appearance management
const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState<'blue' | 'green' | 'purple' | 'orange'>('blue');

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    const savedMode = localStorage.getItem('dashboard-dark-mode');
    
    if (savedTheme) setTheme(savedTheme as any);
    if (savedMode) setIsDarkMode(savedMode === 'true');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('dashboard-dark-mode', String(newMode));
      return newMode;
    });
  }, []);

  const changeTheme = useCallback((newTheme: typeof theme) => {
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  }, []);

  return {
    isDarkMode,
    theme,
    toggleDarkMode,
    changeTheme
  };
};

// Theme-aware component wrapper
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode, theme } = useTheme();
  
  const themeClasses = {
    blue: 'from-blue-600 to-indigo-700',
    green: 'from-green-600 to-emerald-700',
    purple: 'from-purple-600 to-violet-700',
    orange: 'from-orange-600 to-red-700'
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} ${themeClasses[theme]}`}>
      {children}
    </div>
  );
};

// Keyboard shortcuts and power user features
const useKeyboardShortcuts = () => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Escape to close command palette
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
        setCommandPaletteQuery('');
      }
      
      // Number shortcuts for quick navigation
      if (e.key >= '1' && e.key <= '9' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        // Navigate to specific section
        const sections = ['dashboard', 'students', 'attendance', 'reports', 'settings'];
        if (sections[index]) {
          // Handle navigation
          console.log(`Navigate to ${sections[index]}`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  const commands = [
    { id: 'search', label: 'Search Dashboard', icon: Search, action: () => console.log('Search') },
    { id: 'refresh', label: 'Refresh Data', icon: RefreshCw, action: () => console.log('Refresh') },
    { id: 'export', label: 'Export Report', icon: Download, action: () => console.log('Export') },
    { id: 'settings', label: 'Open Settings', icon: Settings, action: () => console.log('Settings') },
    { id: 'dark-mode', label: 'Toggle Dark Mode', icon: Moon, action: () => console.log('Dark Mode') },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(commandPaletteQuery.toLowerCase())
  );

  return {
    showCommandPalette,
    setShowCommandPalette,
    commandPaletteQuery,
    setCommandPaletteQuery,
    filteredCommands
  };
};

// Command Palette Component
const CommandPalette = () => {
  const { showCommandPalette, setShowCommandPalette, commandPaletteQuery, setCommandPaletteQuery, filteredCommands } = useKeyboardShortcuts();

  if (!showCommandPalette) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search commands..."
              value={commandPaletteQuery}
              onChange={(e) => setCommandPaletteQuery(e.target.value)}
              className="flex-1 border-none outline-none text-lg"
              autoFocus
            />
            <button
              onClick={() => setShowCommandPalette(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredCommands.map((command) => (
            <button
              key={command.id}
              onClick={() => {
                command.action();
                setShowCommandPalette(false);
              }}
              className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <command.icon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{command.label}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>⌘K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Real-time features and WebSocket integration
interface LiveData {
  attendanceCount: number;
  activeUsers: number;
  systemAlerts: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
  }>;
}

const useRealTimeUpdates = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [liveData, setLiveData] = useState<LiveData>({
    attendanceCount: 0,
    activeUsers: 0,
    systemAlerts: [],
    recentActivity: []
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Simulate WebSocket connection
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const connectWebSocket = () => {
      setIsConnected(true);
      
      // Simulate real-time data updates
      intervalId = setInterval(() => {
        if (autoRefresh) {
          setLiveData(prev => ({
            attendanceCount: prev.attendanceCount + Math.floor(Math.random() * 5),
            activeUsers: Math.floor(Math.random() * 50) + 100,
            systemAlerts: [
              ...prev.systemAlerts.slice(-4),
              {
                id: Date.now(),
                type: 'info',
                message: 'New attendance record added',
                timestamp: new Date().toISOString()
              }
            ],
            recentActivity: [
              ...prev.recentActivity.slice(-9),
              {
                id: Date.now(),
                type: 'attendance',
                message: 'Attendance marked for Section A1',
                time: 'Just now'
              }
            ]
          }));
        }
      }, refreshInterval);
    };

    connectWebSocket();
    
    return () => {
      setIsConnected(false);
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval]);

  return {
    isConnected,
    liveData,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };
};

// Real-time status indicator
const RealTimeStatusIndicator = () => {
  const { isConnected } = useRealTimeUpdates();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
      <span className="text-xs text-gray-500">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};

// Auto-refresh controls
const AutoRefreshControls = () => {
  const { autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval } = useRealTimeUpdates();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="auto-refresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="auto-refresh" className="text-sm text-gray-600">
          Auto-refresh
        </label>
      </div>
      {autoRefresh && (
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value={10000}>10s</option>
          <option value={30000}>30s</option>
          <option value={60000}>1m</option>
          <option value={300000}>5m</option>
        </select>
      )}
    </div>
  );
};

// Enhanced dashboard controls and settings
const DashboardControls = () => {
  const { isDarkMode, toggleDarkMode, theme, changeTheme } = useTheme();
  const { layout, setLayout, showWidgets, toggleWidget, resetLayout } = useDashboardLayout();
  const { autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval } = useRealTimeUpdates();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Quick Controls Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <RealTimeStatusIndicator />
            <AutoRefreshControls />
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleDarkMode}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>Toggle dark mode</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Dashboard settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Dashboard settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => window.location.reload()}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Refresh dashboard"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh dashboard</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Dashboard Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Theme Color</label>
                    <div className="flex gap-2 mt-2">
                      {(['blue', 'green', 'purple', 'orange'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => changeTheme(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            theme === color ? 'border-gray-900' : 'border-gray-300'
                          } bg-gradient-to-r ${
                            color === 'blue' ? 'from-blue-500 to-blue-600' :
                            color === 'green' ? 'from-green-500 to-green-600' :
                            color === 'purple' ? 'from-purple-500 to-purple-600' :
                            'from-orange-500 to-orange-600'
                          }`}
                          aria-label={`Select ${color} theme`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dark Mode</label>
                      <p className="text-xs text-gray-500">Switch between light and dark themes</p>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Layout Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Layout</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Layout Mode</label>
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="default">Default</option>
                      <option value="compact">Compact</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Widget Visibility</label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(showWidgets).map(([key, visible]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <button
                            onClick={() => toggleWidget(key as keyof typeof showWidgets)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              visible ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                visible ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto-refresh</label>
                      <p className="text-xs text-gray-500">Automatically update dashboard data</p>
                    </div>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoRefresh ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {autoRefresh && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Refresh Interval</label>
                      <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value={10000}>10 seconds</option>
                        <option value={30000}>30 seconds</option>
                        <option value={60000}>1 minute</option>
                        <option value={300000}>5 minutes</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    resetLayout();
                    setAutoRefresh(true);
                    setRefreshInterval(30000);
                    toast.success('Settings reset to default');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function AdminDashboardPage() {
  // Sidebar state for Navbar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter states
  const [timeFilter, setTimeFilter] = useState("today");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [rfidFilter, setRfidFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  
  const handleSidebarToggle = () => setSidebarCollapsed((prev) => !prev);

  // Enhanced mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced analytics data with real-time updates
  const stats = [
    {
      label: "Total Students",
      value: 1240,
      icon: Users,
      color: "from-blue-500 to-blue-700",
      change: "+2.1%",
      changeType: "positive",
      sublabel: "Enrolled students"
    },
    {
      label: "Total Instructors",
      value: 87,
      icon: User,
      color: "from-indigo-500 to-indigo-700",
      change: "-1.2%",
      changeType: "negative",
      sublabel: "Active instructors"
    },
    {
      label: "Attendance Rate",
      value: "96.2%",
      icon: CalendarCheck,
      color: "from-green-500 to-green-700",
      change: "+1.2%",
      changeType: "positive",
      sublabel: "Today's attendance"
    },
    {
      label: "Absentees Today",
      value: 14,
      icon: AlertCircle,
      color: "from-red-500 to-red-700",
      change: "+0.2%",
      changeType: "positive",
      sublabel: "Students absent today"
    },
    {
      label: "Active Courses",
      value: 45,
      icon: BookOpen,
      color: "from-purple-500 to-purple-700",
      change: "+2.1%",
      changeType: "positive",
      sublabel: "Currently running"
    },
    {
      label: "Departments",
      value: 8,
      icon: Building2,
      color: "from-teal-500 to-teal-700",
      change: "+0.0%",
      changeType: "neutral",
      sublabel: "Academic departments"
    },
    {
      label: "RFID Readers",
      value: "12/15",
      icon: () => <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>,
      color: "from-gray-500 to-gray-700",
      change: "-1.2%",
      changeType: "negative",
      sublabel: "Active readers"
    },
    {
      label: "Total Sections",
      value: 156,
      icon: GraduationCap,
      color: "from-pink-500 to-pink-700",
      change: "+3.1%",
      changeType: "positive",
      sublabel: "Active sections"
    }
  ];

  // Enhanced recent activity with better categorization
  const recentActivity = [
    { id: 1, type: "attendance", message: "Marked attendance for Section A1", time: "2 min ago", priority: "high" },
    { id: 2, type: "user", message: "Added new instructor: Jane D.", time: "10 min ago", priority: "medium" },
    { id: 3, type: "system", message: "System backup completed", time: "30 min ago", priority: "low" },
    { id: 4, type: "notification", message: "Sent alert to all students", time: "1 hr ago", priority: "medium" },
    { id: 5, type: "course", message: "Created new course: Advanced Programming", time: "2 hrs ago", priority: "high" },
    { id: 6, type: "student", message: "Registered new student: John Smith", time: "3 hrs ago", priority: "medium" }
  ];

  // Loading state for initial data fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API calls for dashboard data
        await Promise.all([
          new Promise(resolve => setTimeout(resolve, 1000)), // Stats
          new Promise(resolve => setTimeout(resolve, 1200)), // Charts
          new Promise(resolve => setTimeout(resolve, 800)),  // Activity
        ]);
        toast.success('Dashboard loaded successfully');
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Top Navbar (for mobile/standalone view) */}
          <div className="md:hidden">
            <Navbar onSidebarToggle={handleSidebarToggle} sidebarCollapsed={sidebarCollapsed} />
          </div>
          <main className="flex-1 pt-1 md:pt-4 p-2 md:p-6">
            <div className="container mx-auto space-y-6">
              {/* Gradient Header */}
              <PageHeader
                title="Admin Dashboard"
                subtitle="Overview and management of the attendance system"
                breadcrumbs={[{ label: "Dashboard" }]}
              />

              {/* Dashboard Controls */}
              <DashboardControls />

              {/* Welcome Banner */}
              <WelcomeBanner />

              {/* Enhanced Search and Filter Section */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
                  {/* Enhanced Search Bar */}
                  <div className="relative w-full xl:w-auto xl:min-w-[300px] group">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search dashboard data..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200 group-hover:border-gray-400"
                      aria-label="Search dashboard data"
                    />
                    {searchInput && (
                      <button
                        onClick={() => setSearchInput("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Enhanced Quick Filter Dropdowns */}
                  <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                    {/* Time Filter */}
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-full sm:w-32 text-gray-700 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Attendance Status Filter */}
                    <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                      <SelectTrigger className="w-full sm:w-40 text-gray-700 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Attendance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                        <SelectItem value="tardy">Tardy</SelectItem>
                        <SelectItem value="left-early">Left Early</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Department Filter */}
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full sm:w-40 text-gray-700 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="it">Information Technology</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="arts">Arts & Sciences</SelectItem>
                        <SelectItem value="health">Health Sciences</SelectItem>
                        <SelectItem value="law">Law</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* User Role Filter */}
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-32 text-gray-700 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="instructors">Instructors</SelectItem>
                        <SelectItem value="admins">Admins</SelectItem>
                        <SelectItem value="guardians">Parents/Guardians</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* RFID Status Filter */}
                    <Select value={rfidFilter} onValueChange={setRfidFilter}>
                      <SelectTrigger className="w-full sm:w-32 text-gray-700 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="RFID" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All RFID</SelectItem>
                        <SelectItem value="active">Active Tags</SelectItem>
                        <SelectItem value="inactive">Inactive Tags</SelectItem>
                        <SelectItem value="expired">Expired Tags</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        <SelectItem value="readers">Reader Status</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Verification Status Filter */}
                    <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                      <SelectTrigger className="w-full sm:w-36 text-gray-700 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Verification</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="review">Needs Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filter Chips */}
                {(timeFilter !== 'today' || attendanceFilter !== 'all' || departmentFilter !== 'all' || roleFilter !== 'all' || rfidFilter !== 'all' || verificationFilter !== 'all') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500">Active filters:</span>
                      {timeFilter !== 'today' && (
                        <Badge variant="secondary" className="text-xs">
                          Time: {timeFilter}
                          <button
                            onClick={() => setTimeFilter('today')}
                            className="ml-1 hover:text-red-500 transition-colors"
                            aria-label="Remove time filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {attendanceFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Attendance: {attendanceFilter}
                          <button
                            onClick={() => setAttendanceFilter('all')}
                            className="ml-1 hover:text-red-500 transition-colors"
                            aria-label="Remove attendance filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {departmentFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Department: {departmentFilter}
                          <button
                            onClick={() => setDepartmentFilter('all')}
                            className="ml-1 hover:text-red-500 transition-colors"
                            aria-label="Remove department filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {roleFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Role: {roleFilter}
                          <button
                            onClick={() => setRoleFilter('all')}
                            className="ml-1 hover:text-red-500 transition-colors"
                            aria-label="Remove role filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {rfidFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          RFID: {rfidFilter}
                          <button
                            onClick={() => setRfidFilter('all')}
                            className="ml-1 hover:text-red-500 transition-colors"
                            aria-label="Remove RFID filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {verificationFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Verification: {verificationFilter}
                          <button
                            onClick={() => setVerificationFilter('all')}
                            className="ml-1 hover:text-red-500 transition-colors"
                            aria-label="Remove verification filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      <button
                        onClick={() => {
                          setTimeFilter('today');
                          setAttendanceFilter('all');
                          setDepartmentFilter('all');
                          setRoleFilter('all');
                          setRfidFilter('all');
                          setVerificationFilter('all');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Summary Cards - Improved Grid with Better Interactions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  const getChangeColor = (type: string) => {
                    switch (type) {
                      case 'positive': return 'text-green-600';
                      case 'negative': return 'text-red-600';
                      case 'neutral': return 'text-gray-600';
                      default: return 'text-gray-600';
                    }
                  };
                  
                  const getChangeIcon = (type: string) => {
                    switch (type) {
                      case 'positive': return (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      );
                      case 'negative': return (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      );
                      default: return (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      );
                    }
                  };

                  return (
                    <div 
                      key={index} 
                      className="group bg-white rounded-xl shadow-md border border-gray-200 p-4 lg:p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                      role="button"
                      tabIndex={0}
                      aria-label={`${stat.label}: ${stat.value}. ${stat.sublabel}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // Handle card click
                        }
                      }}
                    >
                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                          <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className={`flex items-center gap-1 ${getChangeColor(stat.changeType)} group-hover:scale-105 transition-transform duration-200`}>
                              {getChangeIcon(stat.changeType)}
                              <span className="text-xs lg:text-sm font-medium">{stat.change}</span>
                            </div>
                          </div>
                        </div>
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2 group-hover:text-gray-800 transition-colors">{stat.label}</h3>
                        <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">{stat.value}</p>
                        <p className="text-xs lg:text-sm text-gray-500 mb-2 lg:mb-3">{stat.sublabel}</p>
                        
                        {/* Enhanced Action Button */}
                        <div className="flex items-center justify-between">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-blue-600 text-xs lg:text-sm font-medium hover:text-blue-700 transition-colors group-hover:underline">
                                View Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-blue-900 text-white">
                              View detailed {stat.label.toLowerCase()} information
                            </TooltipContent>
                          </Tooltip>
                          
                          {/* Quick Action Icons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
                                  <Eye className="w-3 h-3 text-blue-600" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-blue-900 text-white">
                                Quick view
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                                  <BarChart2 className="w-3 h-3 text-green-600" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-green-900 text-white">
                                View analytics
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Border Animation */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  );
                })}
              </div>

              {/* Main Content: Analytics + Quick Actions and Widgets - Improved Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
                {/* Left Column: Main Analytics */}
                <div className="xl:col-span-8 space-y-6">
                  {/* Primary Analytics Charts - Better Responsive Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <AttendanceTrendsChart />
                    <DepartmentBreakdownChart />
                  </div>
                  
                  {/* Secondary Analytics - Better Responsive Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <RealTimeAttendanceStatusChart />
                    <RFIDSystemHealthChart />
                  </div>

                  {/* Attendance Schedule Widget - Moved above Recent Activity */}
                  <div className="mt-6 lg:mt-8">
                    <CalendarEventsWidget />
                  </div>

                  {/* Enhanced Recent Activity/Logs */}
                  <div className="mt-6 lg:mt-8">
                    <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden p-0">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Megaphone className="w-6 h-6 text-white" />
                            <div>
                              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                              <p className="text-blue-100 text-sm">System activities and user actions</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 lg:p-6">
                        <div className="space-y-3">
                          {recentActivity.map((activity) => {
                            const getTypeColor = (type: string) => {
                              switch (type) {
                                case 'attendance': return 'bg-green-100 text-green-700 border-green-200';
                                case 'user': return 'bg-blue-100 text-blue-700 border-blue-200';
                                case 'system': return 'bg-gray-100 text-gray-700 border-gray-200';
                                case 'notification': return 'bg-orange-100 text-orange-700 border-orange-200';
                                case 'course': return 'bg-purple-100 text-purple-700 border-purple-200';
                                case 'student': return 'bg-teal-100 text-teal-700 border-teal-200';
                                default: return 'bg-gray-100 text-gray-700 border-gray-200';
                              }
                            };

                            const getPriorityColor = (priority: string) => {
                              switch (priority) {
                                case 'high': return 'bg-red-100 text-red-600';
                                case 'medium': return 'bg-yellow-100 text-yellow-600';
                                case 'low': return 'bg-green-100 text-green-600';
                                default: return 'bg-gray-100 text-gray-600';
                              }
                            };

                            return (
                              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-shrink-0">
                                  <Badge className={`text-xs px-2 py-1 border ${getTypeColor(activity.type)}`}>
                                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                  </Badge>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{activity.message}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">{activity.time}</span>
                                    <Badge className={`text-xs px-1 py-0.5 ${getPriorityColor(activity.priority)}`}>
                                      {activity.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                                      <Eye className="w-3 h-3 text-gray-400" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-blue-900 text-white">
                                    View details
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                            View All Activity Logs →
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Column: Quick Actions & Essential Widgets - Improved Sticky Behavior */}
                <aside className="xl:col-span-4 space-y-4 lg:space-y-6 xl:sticky xl:top-6 xl:h-fit">
                  {/* Quick Actions - Always visible */}
                  <DashboardQuickActionsPanel />
                  
                  {/* Combined System Insights and Announcements */}
                  <SystemInsightsAndAnnouncementsWidget />
                  
                  {/* Notifications - Important for immediate attention */}
                  <NotificationsCenter />
                </aside>
              </div>
            </div>
          </main>
        </div>
        <CommandPalette />
      </TooltipProvider>
    </ThemeProvider>
  );
}
