"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  School, 
  Activity, 
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Filter
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

interface TrendData {
  date: string;
  present: number;
  late: number;
  absent: number;
  total: number;
}

const mockTrendData: TrendData[] = [
  { date: 'Mon', present: 245, late: 12, absent: 8, total: 265 },
  { date: 'Tue', present: 238, late: 15, absent: 12, total: 265 },
  { date: 'Wed', present: 252, late: 8, absent: 5, total: 265 },
  { date: 'Thu', present: 240, late: 18, absent: 7, total: 265 },
  { date: 'Fri', present: 248, late: 10, absent: 7, total: 265 },
  { date: 'Sat', present: 0, late: 0, absent: 0, total: 0 },
  { date: 'Sun', present: 0, late: 0, absent: 0, total: 0 },
];

const mockDepartmentData = [
  { name: 'Computer Science', attendance: 94.2, students: 85 },
  { name: 'Information Technology', attendance: 91.8, students: 72 },
  { name: 'Engineering', attendance: 89.5, students: 68 },
  { name: 'Business', attendance: 87.3, students: 45 },
  { name: 'Arts & Sciences', attendance: 92.1, students: 38 },
];

const mockRFIDData = [
  { name: 'Active Tags', value: 245, color: '#10b981' },
  { name: 'Inactive Tags', value: 20, color: '#f59e0b' },
  { name: 'Lost Tags', value: 5, color: '#ef4444' },
];

const analyticsCards: AnalyticsData[] = [
  {
    id: '1',
    title: 'Overall Attendance Rate',
    value: 92.4,
    change: 2.1,
    changeType: 'increase',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-green-600'
  },
  {
    id: '2',
    title: 'Total Students',
    value: 308,
    change: 5,
    changeType: 'increase',
    icon: <Users className="h-5 w-5" />,
    color: 'text-blue-600'
  },
  {
    id: '3',
    title: 'Late Arrivals Today',
    value: 15,
    change: -3,
    changeType: 'decrease',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-yellow-600'
  },
  {
    id: '4',
    title: 'Absent Students',
    value: 8,
    change: -2,
    changeType: 'decrease',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-600'
  }
];

export default function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const getChangeColor = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? '↗' : '↘';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and real-time analytics for your institution</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card) => (
          <Card key={card.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-sm font-medium ${getChangeColor(card.changeType)}`}>
                      {getChangeIcon(card.changeType)} {Math.abs(card.change)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-gray-100 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="rfid" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            RFID
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Attendance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockDepartmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">94.2%</div>
                  <div className="text-sm text-gray-600">Average Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">+5.3%</div>
                  <div className="text-sm text-gray-600">Improvement This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">87%</div>
                  <div className="text-sm text-gray-600">Target Achievement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Department Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDepartmentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{dept.name}</h3>
                      <p className="text-sm text-gray-600">{dept.students} students</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{dept.attendance}%</div>
                      <div className="text-sm text-gray-600">attendance rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rfid" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RFID Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  RFID Tag Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockRFIDData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockRFIDData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* RFID Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  RFID Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Scans Today</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="font-semibold">0.3s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">System Uptime</span>
                    <span className="font-semibold text-green-600">99.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Failed Scans</span>
                    <span className="font-semibold text-red-600">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
              <Eye className="h-6 w-6" />
              <span>View Details</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
              <Filter className="h-6 w-6" />
              <span>Apply Filters</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
              <Download className="h-6 w-6" />
              <span>Export Data</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
              <Calendar className="h-6 w-6" />
              <span>Schedule Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 