'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Activity, AlertTriangle } from 'lucide-react';

interface QuickStatsProps {
  type: 'instructor' | 'student';
  analytics: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    attendedClasses: number;
    absentClasses: number;
    lateClasses: number;
    riskLevels: Record<string, number>;
  };
}

export function QuickStats({ type, analytics }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border border-blue-200 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total {type === 'instructor' ? 'Instructors' : 'Students'}</p>
              <p className="text-xs text-gray-500">Active and inactive</p>
            </div>
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Active:</span>
              <span className="font-medium text-green-600">{analytics.activeCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Inactive:</span>
              <span className="font-medium text-gray-600">{analytics.inactiveCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Total:</span>
              <span className="font-medium text-blue-600">{analytics.totalCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-blue-200 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Class Statistics</p>
              <p className="text-xs text-gray-500">Attendance breakdown</p>
            </div>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Attended:</span>
              <span className="font-medium text-green-600">{analytics.attendedClasses}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Absent:</span>
              <span className="font-medium text-red-600">{analytics.absentClasses}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Late:</span>
              <span className="font-medium text-yellow-600">{analytics.lateClasses}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-blue-200 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Distribution</p>
              <p className="text-xs text-gray-500">By risk level</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>High Risk:</span>
              <span className="font-medium text-red-600">{analytics.riskLevels.high}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Medium Risk:</span>
              <span className="font-medium text-yellow-600">{analytics.riskLevels.medium}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Low Risk:</span>
              <span className="font-medium text-blue-600">{analytics.riskLevels.low}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 