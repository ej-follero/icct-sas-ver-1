"use client";

import { useState } from "react";
import {
  School,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  User,
  AlertTriangle,
  Download,
  Printer,
  Calendar as CalendarIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

// Mock data for demonstration
const mockSummaryData = {
  totalClasses: 12,
  totalStudentsExpected: 450,
  totalStudentsPresent: 420,
  totalLate: 25,
  totalAbsent: 30,
};

const mockAttendanceData = [
  { time: "8:00 AM", present: 45, late: 5, absent: 10 },
  { time: "9:00 AM", present: 42, late: 8, absent: 8 },
  { time: "10:00 AM", present: 48, late: 2, absent: 5 },
  { time: "11:00 AM", present: 40, late: 10, absent: 15 },
  { time: "12:00 PM", present: 35, late: 15, absent: 20 },
  { time: "1:00 PM", present: 50, late: 0, absent: 0 },
  { time: "2:00 PM", present: 38, late: 12, absent: 22 },
  { time: "3:00 PM", present: 45, late: 5, absent: 10 },
];

const mockClassData = [
  {
    id: 1,
    subject: "Mathematics",
    instructor: "Dr. Smith",
    time: "8:00 AM - 9:00 AM",
    room: "Room 101",
    present: 25,
    late: 3,
    absent: 2,
    status: "completed",
  },
  {
    id: 2,
    subject: "Science",
    instructor: "Prof. Johnson",
    time: "9:00 AM - 10:00 AM",
    room: "Room 102",
    present: 28,
    late: 2,
    absent: 0,
    status: "in-progress",
  },
  {
    id: 3,
    subject: "English",
    instructor: "Ms. Davis",
    time: "10:00 AM - 11:00 AM",
    room: "Room 103",
    present: 22,
    late: 5,
    absent: 3,
    status: "upcoming",
  },
];

export default function DailyAnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterLate, setFilterLate] = useState(false);
  const [filterAbsent, setFilterAbsent] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Analytics</h1>
              <p className="text-gray-600 mt-1">
                Monitor attendance patterns and class performance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {selectedDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Download clicked")}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => alert("Print clicked")}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <School className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockSummaryData.totalClasses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Students Present</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockSummaryData.totalStudentsPresent}
              </p>
              <p className="text-sm text-gray-500">
                of {mockSummaryData.totalStudentsExpected} expected
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="text-yellow-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Late Arrivals</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockSummaryData.totalLate}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="text-red-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockSummaryData.totalAbsent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="px-8 pb-4 flex flex-wrap gap-4 items-center">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterLate}
            onChange={(e) => setFilterLate(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>Show only classes with late arrivals</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterAbsent}
            onChange={(e) => setFilterAbsent(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>Show only classes with absences</span>
        </label>
      </div>

      {/* Charts Section */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Attendance Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Performance */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Class Performance
            </h3>
            <div className="space-y-4">
              {mockClassData.map((classItem) => (
                <div
                  key={classItem.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {classItem.subject}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        classItem.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : classItem.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {classItem.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {classItem.instructor} • {classItem.time} • {classItem.room}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700">{classItem.present}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-700">{classItem.late}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-700">{classItem.absent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}