"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the new reusable components
import { AttendanceStatusCard, PresentStudentsCard, AbsentStudentsCard, LateStudentsCard, TotalStudentsCard } from "@/components/reusable";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  School,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Download,
  Plus,
  Eye,
  RefreshCw,
  Bell,
  Wifi,
  WifiOff,
  Shield,
  Database,
  ArrowUpRight,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import DataChart from "@/components/DataChart";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for dashboard metrics
const dashboardMetrics = {
  totalStudents: 1247,
  totalInstructors: 68,
  presentToday: 1156,
  absentToday: 91,
  lateToday: 34,
  attendanceRate: 92.7,
  avgAttendanceWeek: 89.4,
  activeRFIDTags: 1198,
  systemUptime: 99.8,
  pendingAlerts: 3,
};

// Trending data for charts
const weeklyTrendData = [
  { day: "Mon", present: 1134, late: 28, absent: 85 },
  { day: "Tue", present: 1156, late: 34, absent: 57 },
  { day: "Wed", present: 1189, late: 22, absent: 36 },
  { day: "Thu", present: 1167, late: 29, absent: 51 },
  { day: "Fri", present: 1201, late: 18, absent: 28 },
  { day: "Sat", present: 0, late: 0, absent: 0 },
  { day: "Sun", present: 0, late: 0, absent: 0 },
];

const hourlyTrendData = [
  { hour: "7AM", count: 245 },
  { hour: "8AM", count: 678 },
  { hour: "9AM", count: 892 },
  { hour: "10AM", count: 1023 },
  { hour: "11AM", count: 1156 },
  { hour: "12PM", count: 967 },
  { hour: "1PM", count: 834 },
  { hour: "2PM", count: 723 },
];

const departmentData = [
  { name: "Computer Science", value: 94.2, fill: "#3B82F6" },
  { name: "Information Technology", value: 91.8, fill: "#10B981" },
  { name: "Engineering", value: 89.5, fill: "#F59E0B" },
  { name: "Business Administration", value: 87.3, fill: "#EF4444" },
  { name: "Arts & Sciences", value: 92.1, fill: "#8B5CF6" },
];

const recentActivities = [
  { id: 1, type: "alert", message: "RFID Reader #3 offline", time: "2 min ago", severity: "high" },
  { id: 2, type: "attendance", message: "Morning attendance completed", time: "15 min ago", severity: "info" },
  { id: 3, type: "system", message: "Backup completed successfully", time: "1 hour ago", severity: "success" },
  { id: 4, type: "user", message: "New instructor added: Dr. Smith", time: "2 hours ago", severity: "info" },
  { id: 5, type: "alert", message: "Low battery: Reader #7", time: "3 hours ago", severity: "medium" },
];

const quickStats = [
  { label: "Active Classes", value: "28", icon: School, trend: "+2", color: "text-blue-600" },
  { label: "Today's Sessions", value: "45", icon: Calendar, trend: "+5", color: "text-green-600" },
  { label: "RFID Scans", value: "2,347", icon: Activity, trend: "+12%", color: "text-purple-600" },
  { label: "System Alerts", value: "3", icon: AlertTriangle, trend: "-2", color: "text-red-600" },
];

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Set initial time after component mounts to avoid hydration mismatch
    setCurrentTime(new Date());
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 95) return { label: "Excellent", color: "bg-green-100 text-green-800" };
    if (rate >= 90) return { label: "Good", color: "bg-blue-100 text-blue-800" };
    if (rate >= 85) return { label: "Average", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Needs Attention", color: "bg-red-100 text-red-800" };
  };

  const attendanceStatus = getAttendanceStatus(dashboardMetrics.attendanceRate);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening at your institution today.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">
              Last updated: {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/analytics/dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Attendance Rate */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {dashboardMetrics.attendanceRate}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={attendanceStatus.color}>
                    {attendanceStatus.label}
                  </Badge>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">+2.3%</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Students - Using new AttendanceStatusCard */}
        <TotalStudentsCard
          title="Total Students"
          count={dashboardMetrics.totalStudents}
          subtitle="Enrolled this semester"
          trend={{
            value: 3.2,
            direction: 'up',
            period: 'last month'
          }}
          interactive
          onClick={() => console.log('Navigate to students page')}
        />

        {/* Present Students - Using new AttendanceStatusCard */}
        <PresentStudentsCard
          title="Present Today"
          count={dashboardMetrics.presentToday}
          total={dashboardMetrics.totalStudents}
          subtitle="Students in attendance"
          trend={{
            value: 2.3,
            direction: 'up',
            period: 'yesterday'
          }}
          interactive
          onClick={() => console.log('Navigate to present students')}
        />

        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {dashboardMetrics.systemUptime}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-500">All systems operational</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Attendance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AbsentStudentsCard
          title="Absent Today"
          count={dashboardMetrics.absentToday}
          total={dashboardMetrics.totalStudents}
          subtitle="Students not present"
          trend={{
            value: 1.5,
            direction: 'down',
            period: 'yesterday'
          }}
          interactive
          onClick={() => console.log('Navigate to absent students')}
        />
        
        <LateStudentsCard
          title="Late Arrivals"
          count={dashboardMetrics.lateToday}
          total={dashboardMetrics.totalStudents}
          subtitle="Students arrived late"
          trend={{
            value: 0.8,
            direction: 'neutral',
            period: 'yesterday'
          }}
          interactive
          onClick={() => console.log('Navigate to late students')}
        />

        <AttendanceStatusCard
          status="present"
          title="Attendance Rate"
          count={Math.round(dashboardMetrics.attendanceRate)}
          subtitle="Overall performance today"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{
            value: 2.3,
            direction: 'up',
            period: 'last week'
          }}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <span className={`text-xs font-medium ${stat.color}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="weekly" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="hourly">Today's Hourly</TabsTrigger>
                </TabsList>
                <TabsContent value="weekly" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="late"
                        stackId="1"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="absent"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="hourly" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataChart
                type="bar"
                data={departmentData}
                title="Department Attendance Rates"
                dataKeys={["value"]}
                height="300px"
                showLegend={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/list/attendance/students">
                  <Users className="w-4 h-4 mr-2" />
                  View Student Attendance
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/list/students">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Student
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/list/rfid/dashboard">
                  <Activity className="w-4 h-4 mr-2" />
                  RFID Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/reports">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Alerts
                {dashboardMetrics.pendingAlerts > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {dashboardMetrics.pendingAlerts}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.severity === "high"
                        ? "bg-red-500"
                        : activity.severity === "medium"
                        ? "bg-yellow-500"
                        : activity.severity === "success"
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full">
                View All Alerts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {dashboardMetrics.activeRFIDTags}
              </p>
              <p className="text-sm text-gray-600">Active RFID Tags</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {dashboardMetrics.totalInstructors}
              </p>
              <p className="text-sm text-gray-600">Total Instructors</p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Database Size</span>
              <span className="font-medium">2.3 GB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Backup</span>
              <span className="font-medium">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Server Load</span>
              <span className="font-medium text-green-600">Normal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
