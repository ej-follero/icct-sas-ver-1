"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, User, BarChart2, CalendarCheck, AlertCircle, PlusCircle, Megaphone, FileText, Settings, RefreshCw, Download, Bell, CheckCircle, ChevronRight, Maximize2, Minimize2, Search, LogOut, User as UserIcon, BookOpen, Building2, GraduationCap, UserCheck, UserX, RotateCcw, Eye, Pencil, Trash2, Archive, Clock, Info, Hash, Tag, Layers, BadgeInfo, Plus, Upload, Printer, Columns3, List, X, Loader2 } from "lucide-react";
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

// Enhanced Welcome Banner Component
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
          👨‍💼
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back, {adminUser.name}</h2>
          <p className="text-gray-600 mb-2">
            <span className="font-medium text-blue-700">{adminUser.role}</span> • Last login: {adminUser.lastLogin}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                <button className="text-blue-600 underline font-semibold hover:text-blue-700 transition-colors">
                  {adminUser.pendingAttendance}
                </button>{" "}
                Pending Records
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-600">
                <button className="text-gray-700 underline font-semibold hover:text-gray-800 transition-colors">
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

// Attendance Trends Chart (LineChart)
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Trends</h3>
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
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="present" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#2563eb' }}
            name="Present"
          />
          <Line 
            type="monotone" 
            dataKey="absent" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#ef4444' }}
            name="Absent"
          />
          <Line 
            type="monotone" 
            dataKey="late" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#f59e0b' }}
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

// Enhanced Quick Actions Panel Component
function DashboardQuickActionsPanel() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastActionTime, setLastActionTime] = useState("2 minutes ago");

  const quickActions = [
    {
      id: 'add-student',
      title: 'Add Student',
      subtitle: 'Register new student',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      type: 'action',
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
      onClick: () => {
        toast.success('Opening system settings');
        setLastActionTime("Just now");
      }
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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
          <div key={action.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    {action.hasNotification && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
                      className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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

export default function AdminDashboardPage() {
  // Sidebar state for Navbar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  
  // Filter states
  const [timeFilter, setTimeFilter] = useState("today");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [rfidFilter, setRfidFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  
  const handleSidebarToggle = () => setSidebarCollapsed((prev) => !prev);

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
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="md:hidden">
          <Navbar onSidebarToggle={handleSidebarToggle} sidebarCollapsed={sidebarCollapsed} />
        </div>
        <main className="flex-1 pt-1 md:pt-4 p-2 md:p-6">
          <div className="container mx-auto space-y-6">
            <PageHeader
              title="Admin Dashboard"
              subtitle="Overview and management of the attendance system"
              breadcrumbs={[{ label: "Dashboard" }]}
            />
            <PageSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
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

            {/* Welcome Banner */}
            <WelcomeBanner />

            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-full xl:w-auto xl:min-w-[300px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search dashboard data..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                  {/* Time Filter */}
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full sm:w-32 text-gray-700">
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
                    <SelectTrigger className="w-full sm:w-40 text-gray-700">
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
                    <SelectTrigger className="w-full sm:w-40 text-gray-700">
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
                    <SelectTrigger className="w-full sm:w-32 text-gray-700">
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
                    <SelectTrigger className="w-full sm:w-32 text-gray-700">
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
                    <SelectTrigger className="w-full sm:w-36 text-gray-700">
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
            </div>

            {/* Enhanced Summary Cards - Improved Grid */}
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
                  <div key={index} className="bg-white rounded-xl shadow-md border border-gray-200 p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${getChangeColor(stat.changeType)}`}>
                          {getChangeIcon(stat.changeType)}
                          <span className="text-xs lg:text-sm font-medium">{stat.change}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">{stat.label}</h3>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs lg:text-sm text-gray-500 mb-2 lg:mb-3">{stat.sublabel}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-blue-600 text-xs lg:text-sm font-medium hover:text-blue-700 transition-colors">
                          View Details
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-blue-900 text-white">
                        View detailed {stat.label.toLowerCase()} information
                      </TooltipContent>
                    </Tooltip>
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
    </TooltipProvider>
  );
}
