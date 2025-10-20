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

import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Divider } from "@/components/ui/divider";
import Link from "next/link";

const mockSummaryData = {
  totalClasses: 48,
  totalStudentsExpected: 1200,
  totalPresent: 1050,
  totalLate: 120,
  totalAbsent: 150,
};

const mockTableData = [
  {
    id: 1,
    className: "Math 101",
    teacher: "John Doe",
    studentsPresent: 25,
    studentsLate: 2,
    studentsAbsent: 3,
  },
  {
    id: 2,
    className: "History 201",
    teacher: "Jane Smith",
    studentsPresent: 20,
    studentsLate: 1,
    studentsAbsent: 5,
  },
  // Add more rows as needed
];

const mockChartData = [
  { date: "2023-09-01", present: 1000, late: 100, absent: 100 },
  { date: "2023-09-02", present: 1020, late: 90, absent: 90 },
  { date: "2023-09-03", present: 1050, late: 120, absent: 30 },
  { date: "2023-09-04", present: 1030, late: 110, absent: 60 },
  { date: "2023-09-05", present: 1070, late: 100, absent: 30 },
];

function CustomDatePicker({ date, setDate }: { date: Date; setDate: (date: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-64 justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-5 w-5" />
          {date ? date.toLocaleDateString() : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate: Date | undefined) => selectedDate && setDate(selectedDate)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function DailySummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterLate, setFilterLate] = useState(false);
  const [filterAbsent, setFilterAbsent] = useState(false);

  // Filter table data based on selected filters
  const filteredTableData = mockTableData.filter((row) => {
    if (filterLate && row.studentsLate === 0) return false;
    if (filterAbsent && row.studentsAbsent === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100/50 backdrop-blur-sm">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Daily Attendance Summary
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                View and analyze attendance data for any date
              </p>
            </div>
            <div className="flex items-center gap-4">
              <CustomDatePicker date={selectedDate} setDate={setSelectedDate} />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => alert("Download clicked")}>
                  <Download className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => alert("Print clicked")}>
                  <Printer className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <School className="text-blue-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalClasses}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Present</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalPresent}</p>
                  <p className="text-sm text-gray-500">of {mockSummaryData.totalStudentsExpected} expected</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="text-yellow-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Late Arrivals</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalLate}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-red-50 rounded-lg">
                  <XCircle className="text-red-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Absent</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalAbsent}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Section */}
          <div className="px-8 pb-4 flex flex-wrap gap-4 items-center">
            <Label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="filterLate"
                checked={filterLate}
                onCheckedChange={(checked: boolean) => setFilterLate(Boolean(checked))}
              />
              <span>Show only classes with late arrivals</span>
            </Label>
            <Label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="filterAbsent"
                checked={filterAbsent}
                onCheckedChange={(checked: boolean) => setFilterAbsent(Boolean(checked))}
              />
              <span>Show only classes with absences</span>
            </Label>
          </div>

          {/* Table */}
          <div className="overflow-x-auto px-8 pb-8">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 p-3 text-left font-semibold">Class Name</th>
                  <th className="border border-gray-200 p-3 text-left font-semibold">Teacher</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold">Present</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold">Late</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold">Absent</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableData.map((row) => (
                  <tr key={row.id} className="even:bg-gray-50">
                    <td className="border border-gray-200 p-3">{row.className}</td>
                    <td className="border border-gray-200 p-3">{row.teacher}</td>
                    <td className="border border-gray-200 p-3 text-center">{row.studentsPresent}</td>
                    <td className="border border-gray-200 p-3 text-center">{row.studentsLate}</td>
                    <td className="border border-gray-200 p-3 text-center">{row.studentsAbsent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart Section */}
          <div className="px-8 pb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-gray-700" />
              Attendance Over Time
            </h2>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    name="Present"
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stroke="#FBBF24"
                    fillOpacity={1}
                    fill="url(#colorLate)"
                    name="Late"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorAbsent)"
                    name="Absent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div className="px-8 pb-8 space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
              <CheckCircle className="w-6 h-6" />
              <p>All systems operational.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4 text-yellow-700">
              <AlertTriangle className="w-6 h-6" />
              <p>Some students are late today.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700">
              <XCircle className="w-6 h-6" />
              <p>Several absences reported.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
