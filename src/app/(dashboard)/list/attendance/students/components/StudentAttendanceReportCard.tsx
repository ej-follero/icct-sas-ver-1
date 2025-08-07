import React from 'react';
import { 
  Users, 
  Clock, 
  X, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

interface StudentAttendanceReportCardProps {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalStudents: number;
  averageAttendanceRate: number;
  getAttendanceRateColor: (rate: number) => { text: string; bg: string; border: string; hex: string; };
}

export default function StudentAttendanceReportCard({
  totalPresent,
  totalLate,
  totalAbsent,
  totalStudents,
  averageAttendanceRate,
  getAttendanceRateColor
}: StudentAttendanceReportCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Present Students Card */}
      <div className="bg-white border-2 border-green-200 rounded-xl shadow-sm p-4 flex flex-col justify-between min-w-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium">Present</span>
              <span className="text-lg font-bold text-green-700 flex items-center gap-1">
                {totalPresent}
                <span className="text-xs text-green-400 font-normal align-top ml-1">+0</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{((totalPresent / totalStudents) * 100).toFixed(1)}% today</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Present Today</span>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +1.2%
          </span>
        </div>
      </div>

      {/* Late Students Card */}
      <div className="bg-white border-2 border-yellow-200 rounded-xl shadow-sm p-4 flex flex-col justify-between min-w-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium">Late</span>
              <span className="text-lg font-bold text-yellow-700 flex items-center gap-1">
                {totalLate}
                <span className="text-xs text-yellow-400 font-normal align-top ml-1">~0</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{((totalLate / totalStudents) * 100).toFixed(1)}% today</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Late Today</span>
          <span className="text-xs text-yellow-600 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -0.5%
          </span>
        </div>
      </div>

      {/* Absent Students Card */}
      <div className="bg-white border-2 border-red-200 rounded-xl shadow-sm p-4 flex flex-col justify-between min-w-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
              <X className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium">Absent</span>
              <span className="text-lg font-bold text-red-700 flex items-center gap-1">
                {totalAbsent}
                <span className="text-xs text-red-400 font-normal align-top ml-1">+0</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">{((totalAbsent / totalStudents) * 100).toFixed(1)}% today</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Absent Today</span>
          <span className="text-xs text-red-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +0.8%
          </span>
        </div>
      </div>

      {/* Overall Attendance Rate Card */}
      <div className="bg-white border-2 border-blue-200 rounded-xl shadow-sm p-4 flex flex-col justify-between min-w-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium">Attendance Rate</span>
              <span className="text-lg font-bold text-blue-700 flex items-center gap-1">
                {averageAttendanceRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs ${getAttendanceRateColor(averageAttendanceRate).text}`}>
              {averageAttendanceRate >= 90 ? 'Excellent' : averageAttendanceRate >= 75 ? 'Good' : 'Needs Attention'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">0% today</span>
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +0.0%
          </span>
        </div>
      </div>
    </div>
  );
} 