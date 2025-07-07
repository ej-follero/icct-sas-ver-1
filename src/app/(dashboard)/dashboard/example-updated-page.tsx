"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";

// Import your new reusable components
import { 
  AttendanceStatusCard,
  PresentStudentsCard,
  AbsentStudentsCard,
  LateStudentsCard,
  TotalStudentsCard 
} from "@/components/reusable";

// Mock data for dashboard metrics
const dashboardMetrics = {
  totalStudents: 1247,
  presentToday: 1156,
  absentToday: 91,
  lateToday: 34,
  excusedToday: 12,
  attendanceRate: 92.7,
};

export default function UpdatedAdminDashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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

      {/* NEW: Attendance Status Cards with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Students Card */}
        <TotalStudentsCard
          title="Total Students"
          count={dashboardMetrics.totalStudents}
          subtitle="Enrolled this semester"
          trend={{
            value: 5.2,
            direction: 'up',
            period: 'last month'
          }}
          interactive
          onClick={() => console.log('Navigate to students page')}
        />

        {/* Present Students Card */}
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

        {/* Absent Students Card */}
        <AbsentStudentsCard
          title="Absent Today"
          count={dashboardMetrics.absentToday}
          total={dashboardMetrics.totalStudents}
          subtitle="Students not present"
          trend={{
            value: 1.2,
            direction: 'down',
            period: 'yesterday'
          }}
          interactive
          onClick={() => console.log('Navigate to absent students')}
        />

        {/* Late Students Card */}
        <LateStudentsCard
          title="Late Arrivals"
          count={dashboardMetrics.lateToday}
          total={dashboardMetrics.totalStudents}
          subtitle="Students arrived late"
          trend={{
            value: 0.5,
            direction: 'neutral',
            period: 'yesterday'
          }}
          interactive
          onClick={() => console.log('Navigate to late students')}
        />
      </div>

      {/* Additional Custom Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Excused Absences */}
        <AttendanceStatusCard
          status="excused"
          title="Excused Absences"
          count={dashboardMetrics.excusedToday}
          total={dashboardMetrics.totalStudents}
          subtitle="With valid documentation"
          icon={<Users className="w-5 h-5" />}
          interactive
          onClick={() => console.log('Navigate to excused absences')}
        />

        {/* Overall Attendance Rate */}
        <AttendanceStatusCard
          status="present"
          title="Attendance Rate"
          count={Math.round(dashboardMetrics.attendanceRate)}
          subtitle="Overall performance today"
          icon={<UserCheck className="w-5 h-5" />}
          trend={{
            value: 2.3,
            direction: 'up',
            period: 'last week'
          }}
          size="lg"
        />

        {/* System Status */}
        <AttendanceStatusCard
          status="total"
          title="RFID Scanners"
          count={12}
          subtitle="Active scanners online"
          icon={<Clock className="w-5 h-5" />}
          trend={{
            value: 0,
            direction: 'neutral',
            period: 'last check'
          }}
        />
      </div>

      {/* Example: Different Sizes and Styles */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Component Variations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Large Card */}
          <AttendanceStatusCard
            status="present"
            size="lg"
            title="Weekly Attendance Summary"
            count={dashboardMetrics.presentToday}
            total={dashboardMetrics.totalStudents}
            subtitle="Students present across all departments"
            trend={{
              value: 4.2,
              direction: 'up',
              period: 'last week'
            }}
            icon={<TrendingUp className="w-6 h-6" />}
          />

          {/* Small Cards */}
          <div className="grid grid-cols-2 gap-4">
            <AttendanceStatusCard
              status="late"
              size="sm"
              title="Late"
              count={dashboardMetrics.lateToday}
              icon={<Clock className="w-4 h-4" />}
            />
            
            <AttendanceStatusCard
              status="absent"
              size="sm" 
              title="Absent"
              count={dashboardMetrics.absentToday}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
            
            <AttendanceStatusCard
              status="excused"
              size="sm"
              title="Excused"
              count={dashboardMetrics.excusedToday}
              icon={<Users className="w-4 h-4" />}
            />
            
            <AttendanceStatusCard
              status="present"
              size="sm"
              title="Present"
              count={dashboardMetrics.presentToday}
              icon={<UserCheck className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">✨ New AttendanceStatusCard Features:</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>Automatic percentage calculation</strong> from count/total</li>
          <li>• <strong>Progress rings</strong> for visual percentage display</li>
          <li>• <strong>Trend indicators</strong> with directional arrows and colors</li>
          <li>• <strong>Interactive hover states</strong> with scale and shadow effects</li>
          <li>• <strong>Consistent color theming</strong> per attendance status</li>
          <li>• <strong>Dark mode support</strong> built-in</li>
          <li>• <strong>Convenience components</strong> (PresentStudentsCard, etc.)</li>
          <li>• <strong>Responsive design</strong> with multiple sizes</li>
        </ul>
      </div>

      {/* Next Steps */}
      <div className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">🚀 To implement in your actual dashboard:</h3>
        <ol className="space-y-1 text-sm text-green-800 list-decimal list-inside">
          <li>Replace the existing metric cards in <code>src/app/(dashboard)/dashboard/page.tsx</code></li>
          <li>Import the components: <code>import {'{ AttendanceStatusCard }'} from '@/components/reusable'</code></li>
          <li>Connect your real attendance data to the <code>count</code> and <code>total</code> props</li>
          <li>Add click handlers to navigate to detailed views</li>
          <li>Customize colors and icons for your brand</li>
        </ol>
      </div>
    </div>
  );
} 