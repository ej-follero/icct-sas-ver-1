'use client';

import { Users, TrendingUp, Clock, AlertTriangle, Calendar, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AnalyticsData } from '@/lib/analytics-utils';

interface AttendanceSummaryCardsProps {
  analyticsData: AnalyticsData;
  type: 'instructor' | 'student';
}

export function AttendanceSummaryCards({ analyticsData, type }: AttendanceSummaryCardsProps) {
  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', hex: '#10b981' };
    if (rate >= 75) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200', hex: '#f59e0b' };
    return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', hex: '#ef4444' };
  };

  const averageAttendanceRate = analyticsData.attendedClasses > 0 
    ? (analyticsData.attendedClasses / (analyticsData.attendedClasses + analyticsData.absentClasses + analyticsData.lateClasses)) * 100 
    : 0;

  const totalSessions = analyticsData.attendedClasses + analyticsData.absentClasses + analyticsData.lateClasses;
  const notificationsSent = type === 'instructor' 
    ? analyticsData.totalNotificationsSent || Math.floor(analyticsData.absentClasses * 0.8)
    : Math.floor(analyticsData.absentClasses * 0.8);

  const iconTooltips = {
    users: `Total ${type === 'instructor' ? 'instructors' : 'students'} in the system`,
    trending: 'Average attendance rate across all sessions',
    clock: 'Total late arrivals recorded',
    alert: 'Total absences recorded',
    calendar: 'Total sessions for selected period',
    bell: 'Absence/tardiness alerts sent'
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Instructors/Students */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total {type === 'instructor' ? 'Instructors' : 'Students'}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="text-blue-500 w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltips.users}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{analyticsData.totalCount}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Active {type === 'instructor' ? 'instructors' : 'students'} in selected period
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{iconTooltips.users}</p>
          </TooltipContent>
        </Tooltip>

        {/* Average Attendance Rate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Average Attendance Rate
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="text-green-500 w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltips.trending}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {averageAttendanceRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Overall attendance performance
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{iconTooltips.trending}</p>
          </TooltipContent>
        </Tooltip>

        {/* Late Arrivals */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Late Arrivals
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock className="text-yellow-500 w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltips.clock}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">{analyticsData.lateClasses}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Days with late arrivals
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{iconTooltips.clock}</p>
          </TooltipContent>
        </Tooltip>

        {/* Total Absences */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Absences
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="text-red-500 w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltips.alert}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{analyticsData.absentClasses}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Days missed
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{iconTooltips.alert}</p>
          </TooltipContent>
        </Tooltip>

        {/* Total Sessions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Sessions
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="text-purple-500 w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltips.calendar}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{totalSessions}</div>
                <p className="text-xs text-gray-500 mt-1">
                  For selected period
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{iconTooltips.calendar}</p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications Sent */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Notifications Sent
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Bell className="text-orange-500 w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltips.bell}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{notificationsSent}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Absence/tardiness alerts
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{iconTooltips.bell}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
} 