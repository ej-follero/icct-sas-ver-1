import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface InsightsSectionProps {
  totalStudents: number;
  averageAttendanceRate: number;
  totalLate: number;
  totalAbsent: number;
  getAttendanceRateColor: (rate: number) => { text: string; bg: string; border: string; hex: string };
}

export default function InsightsSection({
  totalStudents,
  averageAttendanceRate,
  totalLate,
  totalAbsent,
  getAttendanceRateColor
}: InsightsSectionProps) {
  const attendanceColor = getAttendanceRateColor(averageAttendanceRate);
  const totalPresent = totalStudents - totalLate - totalAbsent;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Students */}
      <Card className="border border-blue-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Total Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
          <p className="text-xs text-gray-500 mt-1">Enrolled students</p>
        </CardContent>
      </Card>

      {/* Average Attendance Rate */}
      <Card className="border border-blue-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Average Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${attendanceColor.text}`}>
            {averageAttendanceRate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Overall rate</p>
        </CardContent>
      </Card>

      {/* Present Students */}
      <Card className="border border-blue-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Present Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{totalPresent}</div>
          <p className="text-xs text-gray-500 mt-1">Currently present</p>
        </CardContent>
      </Card>

      {/* Late Students */}
      <Card className="border border-blue-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            Late Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-700">{totalLate}</div>
          <p className="text-xs text-gray-500 mt-1">Arrived late</p>
        </CardContent>
      </Card>
    </div>
  );
} 