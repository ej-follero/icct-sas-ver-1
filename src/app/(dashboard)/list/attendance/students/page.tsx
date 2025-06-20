'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, TrendingUp, Users, Clock, AlertCircle, Filter, ChevronDown, BookOpen, Info, Printer, FileDown, FileText, ChevronUp, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@radix-ui/react-dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-ignore
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
// @ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';

// Types
interface StudentAttendance {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  course: string;
  yearLevel: string;
  subjects: string[];
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  attendanceRate: number;
  lastAttendance: string;
  avatarUrl?: string;
  trend?: number;
  subjectAttendance?: Record<string, number>;
  email?: string;
  phoneNumber?: string;
}

interface Filters {
  department: string;
  course: string;
  yearLevel: string;
  attendanceRate: string;
}

interface DateRange {
  start: string;
  end: string;
}

// Mock Data
const mockStudents: StudentAttendance[] = [
  {
    id: '1',
    studentName: 'John Doe',
    studentId: 'STU-2024-001',
    department: 'Computer Science',
    course: 'BSCS',
    yearLevel: 'First Year',
    subjects: ['Web Development', 'Database Systems'],
    presentDays: 42,
    absentDays: 1,
    lateDays: 2,
    totalDays: 45,
    attendanceRate: 93.3,
    lastAttendance: new Date().toISOString(),
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    trend: 1.5,
    subjectAttendance: {
      'Web Development': 95,
      'Database Systems': 91
    }
  },
  {
    id: '2',
    studentName: 'Jane Smith',
    studentId: 'STU-2024-002',
    department: 'Information Technology',
    course: 'BSIT',
    yearLevel: 'Second Year',
    subjects: ['Network Security', 'Cybersecurity'],
    presentDays: 38,
    absentDays: 0,
    lateDays: 2,
    totalDays: 40,
    attendanceRate: 95.0,
    lastAttendance: new Date().toISOString(),
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    trend: -0.8,
    subjectAttendance: {
      'Network Security': 97,
      'Cybersecurity': 93
    }
  }
];

const attendanceTrendsData = Array.from({ length: 14 }).map((_, i) => ({
  date: `${i + 1 < 10 ? '0' : ''}${i + 1} Jun`,
  rate: 85 + Math.round(Math.sin(i / 2) * 10 + Math.random() * 5),
}));

const topPerformers = [
  { name: 'John Doe', rate: 99 },
  { name: 'Jane Smith', rate: 98 },
  { name: 'Alice Lee', rate: 97 },
  { name: 'Bob Cruz', rate: 97 },
  { name: 'Maria Tan', rate: 96 },
];
const bottomPerformers = [
  { name: 'Carl Lim', rate: 70 },
  { name: 'Daisy Yu', rate: 72 },
  { name: 'Evan Ong', rate: 73 },
  { name: 'Faye Sy', rate: 74 },
  { name: 'Gina Chua', rate: 75 },
];

function AttendanceTrendsChart() {
  return (
    <Card className="mb-8 border border-blue-100 shadow bg-white">
      <CardHeader>
        <CardTitle className="text-blue-800">Attendance Trends (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={attendanceTrendsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[60, 100]} />
            <RechartsTooltip />
            <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Attendance by Year Level (mock data)
const yearLevelAttendance = [
  { year: 'First Year', rate: 92 },
  { year: 'Second Year', rate: 88 },
  { year: 'Third Year', rate: 85 },
  { year: 'Fourth Year', rate: 90 },
];

function AttendanceByYearLevelChart() {
  return (
    <Card className="mb-8 border border-blue-100 shadow bg-white">
      <CardHeader>
        <CardTitle className="text-blue-800">Attendance by Year Level</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={yearLevelAttendance} margin={{ left: 20, right: 20 }}>
            <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[80, 100]} />
            <RechartsTooltip />
            <Bar dataKey="rate" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Absence Heatmap (mock data, simple grid)
const absenceHeatmapData = [
  // 7 days x 4 weeks
  [2, 1, 0, 3, 2, 1, 0],
  [1, 0, 2, 1, 0, 2, 1],
  [0, 1, 1, 0, 2, 1, 0],
  [2, 2, 0, 1, 1, 0, 1],
];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AbsenceHeatmap() {
  return (
    <Card className="mb-8 border border-blue-100 shadow bg-white">
      <CardHeader>
        <CardTitle className="text-blue-800">Absence Heatmap (Last 4 Weeks)</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 text-xs text-gray-500 mb-1">
            {days.map(day => (
              <div key={day} className="w-8 text-center">{day}</div>
            ))}
          </div>
          {absenceHeatmapData.map((week, i) => (
            <div key={i} className="flex gap-2">
              {week.map((val, j) => (
                <div
                  key={j}
                  className={`w-8 h-8 rounded ${val === 0 ? 'bg-blue-50' : val === 1 ? 'bg-blue-200' : val === 2 ? 'bg-blue-400' : 'bg-blue-700'} flex items-center justify-center text-xs font-bold text-white`}
                  title={`Week ${i + 1}, ${days[j]}: ${val} absences`}
                >
                  {val > 0 ? val : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-xs text-gray-500">
          <span className="w-8 h-4 bg-blue-50 rounded inline-block"></span> 0
          <span className="w-8 h-4 bg-blue-200 rounded inline-block ml-2"></span> 1
          <span className="w-8 h-4 bg-blue-400 rounded inline-block ml-2"></span> 2
          <span className="w-8 h-4 bg-blue-700 rounded inline-block ml-2"></span> 3+
        </div>
      </CardContent>
    </Card>
  );
}

// Attendance by Day of Week (mock data)
const dayOfWeekAttendance = [
  { day: 'Mon', rate: 91 },
  { day: 'Tue', rate: 93 },
  { day: 'Wed', rate: 89 },
  { day: 'Thu', rate: 92 },
  { day: 'Fri', rate: 87 },
  { day: 'Sat', rate: 80 },
  { day: 'Sun', rate: 75 },
];

function AttendanceByDayOfWeekChart() {
  return (
    <Card className="mb-8 border border-blue-100 shadow bg-white">
      <CardHeader>
        <CardTitle className="text-blue-800">Attendance by Day of Week</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayOfWeekAttendance} margin={{ left: 20, right: 20 }}>
            <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[70, 100]} />
            <RechartsTooltip />
            <Bar dataKey="rate" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Monthly Attendance Comparison (mock data)
const monthlyAttendance = [
  { month: 'Jan', rate: 88 },
  { month: 'Feb', rate: 90 },
  { month: 'Mar', rate: 92 },
  { month: 'Apr', rate: 91 },
  { month: 'May', rate: 89 },
  { month: 'Jun', rate: 93 },
];

function MonthlyAttendanceComparisonChart() {
  return (
    <Card className="mb-8 border border-blue-100 shadow bg-white">
      <CardHeader>
        <CardTitle className="text-blue-800">Monthly Attendance Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthlyAttendance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[80, 100]} />
            <RechartsTooltip />
            <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Components
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  departments,
  courses,
  yearLevels,
  filters,
  setFilters,
  dateRange,
  setDateRange,
  handleClearFilters
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  departments: string[];
  courses: string[];
  yearLevels: string[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  handleClearFilters: () => void;
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-blue-100 shadow-sm mb-4 py-4 px-2 rounded-b-xl">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-2 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-gray-50">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={filters.course}
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                <select
                  value={filters.yearLevel}
                  onChange={(e) => setFilters({ ...filters, yearLevel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Year Levels</option>
                  {yearLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Rate</label>
                <select
                  value={filters.attendanceRate}
                  onChange={(e) => setFilters({ ...filters, attendanceRate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Rates</option>
                  <option value="high">High (≥90%)</option>
                  <option value="medium">Medium (75-89%)</option>
                  <option value="low">Low (&lt;75%)</option>
                </select>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            max={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange.end}
            min={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm ml-2"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const InsightsSection = ({
  totalStudents,
  averageAttendanceRate,
  totalLate,
  totalAbsent,
  getAttendanceRateColor,
  iconTooltips = {}
}: {
  totalStudents: number;
  averageAttendanceRate: number;
  totalLate: number;
  totalAbsent: number;
  getAttendanceRateColor: (rate: number) => string;
  iconTooltips?: { users?: string; trending?: string; clock?: string; alert?: string; };
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Users className="h-4 w-4 text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>{iconTooltips.users}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-gray-500 mt-1">Active students in selected period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Average Attendance Rate</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><TrendingUp className="h-4 w-4 text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>{iconTooltips.trending}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageAttendanceRate.toFixed(1)}%</div>
          <p className="text-xs text-gray-500 mt-1">Overall attendance performance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Late Arrivals</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Clock className="h-4 w-4 text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>{iconTooltips.clock}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLate}</div>
          <p className="text-xs text-gray-500 mt-1">Days with late arrivals</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Total Absences</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><AlertCircle className="h-4 w-4 text-gray-400" /></span>
                </TooltipTrigger>
                <TooltipContent>{iconTooltips.alert}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAbsent}</div>
          <p className="text-xs text-gray-500 mt-1">Days missed</p>
        </CardContent>
      </Card>
    </div>
  );
};

const AttendanceDistribution = ({
  totalPresent,
  totalLate,
  totalAbsent
}: {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
}) => {
  const total = totalPresent + totalLate + totalAbsent;
  const presentPercentage = (totalPresent / total) * 100;
  const latePercentage = (totalLate / total) * 100;
  const absentPercentage = (totalAbsent / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Present</span>
              <span className="text-sm font-medium">{presentPercentage.toFixed(1)}% ({totalPresent})</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 flex items-center" aria-label={`Present: ${presentPercentage.toFixed(1)}% (${totalPresent})`}>
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${presentPercentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Late</span>
              <span className="text-sm font-medium">{latePercentage.toFixed(1)}% ({totalLate})</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 flex items-center" aria-label={`Late: ${latePercentage.toFixed(1)}% (${totalLate})`}>
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${latePercentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Absent</span>
              <span className="text-sm font-medium">{absentPercentage.toFixed(1)}% ({totalAbsent})</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 flex items-center" aria-label={`Absent: ${absentPercentage.toFixed(1)}% (${totalAbsent})`}>
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${absentPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const STATUS_COLORS: Record<string, string> = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-700',
  Late: 'bg-yellow-100 text-yellow-700',
};

const PAGE_SIZE = 50;

const TableHeader = ({ sortBy, setSortBy, allSelected, onSelectAll }: { sortBy: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status'; setSortBy: (v: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status') => void; allSelected: boolean; onSelectAll: () => void }) => (
  <div className="hidden md:grid grid-cols-8 items-center px-4 py-2 bg-blue-50 border-b border-blue-100 rounded-t-xl font-semibold text-blue-800 text-sm sticky top-[64px] z-10">
    <div className="col-span-1 flex items-center">
      <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
    </div>
    <div className="col-span-2 cursor-pointer select-none" onClick={() => setSortBy(sortBy === 'name' ? 'attendance-desc' : 'name')}>Name/Avatar</div>
    <div className="col-span-1 cursor-pointer select-none" onClick={() => setSortBy(sortBy === 'id' ? 'attendance-desc' : 'id')}>ID</div>
    <div className="col-span-1">Department</div>
    <div className="col-span-1">Course</div>
    <div className="col-span-1 cursor-pointer select-none" onClick={() => setSortBy(sortBy === 'attendance-desc' ? 'attendance-asc' : 'attendance-desc')}>Attendance Rate</div>
    <div className="col-span-1 cursor-pointer select-none" onClick={() => setSortBy('status')}>Status</div>
  </div>
);

const BulkActionsBar = ({ count, onExport, onExcuse, onNotify, onClear }: { count: number; onExport: () => void; onExcuse: () => void; onNotify: () => void; onClear: () => void }) => (
  <div className="sticky top-[64px] z-20 bg-blue-100 border-b border-blue-300 shadow flex items-center justify-between px-6 py-3 rounded-t-xl mb-2 animate-fade-in">
    <div className="font-semibold text-blue-900">{count} selected</div>
    <div className="flex gap-2">
      <button onClick={onExport} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">Export Selected</button>
      <button onClick={onExcuse} className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm font-medium">Mark as Excused</button>
      <button onClick={onNotify} className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm font-medium">Send Notification</button>
      <button onClick={onClear} className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs">Clear</button>
    </div>
  </div>
);

const MobileStudentCard = ({ student, expanded, onExpand, getAttendanceRateColor }: { student: StudentAttendance; expanded: boolean; onExpand: () => void; getAttendanceRateColor: (rate: number) => string }) => {
  const status = student.attendanceRate >= 90 ? 'Present' : student.attendanceRate >= 75 ? 'Late' : 'Absent';
  return (
    <div className="md:hidden bg-white border border-blue-100 rounded-xl shadow-sm mb-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={student.avatarUrl} />
          <AvatarFallback>{student.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-semibold text-blue-900 text-base">{student.studentName}</div>
          <div className="text-xs text-gray-500">ID: {student.studentId}</div>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{student.department}</span>
            <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{student.course}</span>
          </div>
        </div>
        <button
          className="p-1 rounded hover:bg-blue-100"
          aria-label={expanded ? 'Hide details' : 'Show details'}
          onClick={onExpand}
        >
          {expanded ? <ChevronUp className="w-5 h-5 text-blue-700" /> : <ChevronDown className="w-5 h-5 text-blue-700" />}
        </button>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className={`font-bold ${getAttendanceRateColor(student.attendanceRate)}`}>{student.attendanceRate.toFixed(1)}%</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
      </div>
      {expanded && (
        <div className="mt-4 border-t border-blue-100 pt-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4" /> {student.email || 'student@email.com'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4" /> {student.phoneNumber || '+63 900 000 0000'}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {student.subjects.map(subj => (
                <span key={subj} className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{subj}</span>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">Last Attendance: <span className="text-blue-800 font-semibold">{new Date(student.lastAttendance).toLocaleDateString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportList = ({
  filteredStudents,
  getAttendanceRateColor,
  loading,
  sortBy,
  setSortBy,
  selected,
  setSelected,
  allSelected,
  onSelectAll,
  expandedStudentId,
  setExpandedStudentId
}: {
  filteredStudents: StudentAttendance[];
  getAttendanceRateColor: (rate: number) => string;
  loading: boolean;
  sortBy: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status';
  setSortBy: (v: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status') => void;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  allSelected: boolean;
  onSelectAll: () => void;
  expandedStudentId: string | null;
  setExpandedStudentId: (id: string | null) => void;
}) => {
  // Skeletons for loading state
  if (loading) {
    return (
      <>
        {/* Desktop skeletons */}
        <div className="hidden md:block">
          <div className="grid grid-cols-8 gap-2 mb-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-2 mb-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full rounded" />
              ))}
            </div>
          ))}
        </div>
        {/* Mobile skeletons */}
        <div className="md:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-blue-100 rounded-xl shadow-sm mb-3 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // No results found
  if (!loading && filteredStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-blue-800">
        <Info className="w-12 h-12 mb-4 text-blue-400" />
        <div className="text-xl font-bold mb-2">No results found</div>
        <div className="text-gray-500 mb-4">Try adjusting your filters or search terms.</div>
      </div>
    );
  }

  // Virtualized row renderer
  const Row = ({ index, style }: ListChildComponentProps) => {
    const student = filteredStudents[index];
    if (!student) return null;
    // Mock status for demo
    const status = student.attendanceRate >= 90 ? 'Present' : student.attendanceRate >= 75 ? 'Late' : 'Absent';
    const checked = selected.has(student.id);
    const expanded = expandedStudentId === student.id;
    return (
      <div style={style} key={student.id}>
        <div
          className={`grid grid-cols-8 items-center px-4 py-3 border-b border-blue-50 text-sm md:text-base ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hidden md:grid`}
        >
          <div className="col-span-1 flex items-center">
            <Checkbox checked={checked} onCheckedChange={() => {
              const newSet = new Set(selected);
              if (checked) newSet.delete(student.id);
              else newSet.add(student.id);
              setSelected(newSet);
            }} />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.avatarUrl} />
              <AvatarFallback>{student.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-blue-900">{student.studentName}</span>
          </div>
          <div className="col-span-1 text-gray-700">{student.studentId}</div>
          <div className="col-span-1 text-gray-700">{student.department}</div>
          <div className="col-span-1 text-gray-700">{student.course}</div>
          <div className={`col-span-1 font-bold ${getAttendanceRateColor(student.attendanceRate)}`}>{student.attendanceRate.toFixed(1)}%</div>
          <div className="col-span-1">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
          </div>
          <div className="col-span-1 flex justify-end">
            <button
              className="p-1 rounded hover:bg-blue-100"
              aria-label={expanded ? 'Hide details' : 'Show details'}
              onClick={() => setExpandedStudentId(expanded ? null : student.id)}
            >
              {expanded ? <ChevronUp className="w-5 h-5 text-blue-700" /> : <ChevronDown className="w-5 h-5 text-blue-700" />}
            </button>
          </div>
        </div>
        {/* Mobile card view */}
        <div className="md:hidden">
          <MobileStudentCard
            student={student}
            expanded={expanded}
            onExpand={() => setExpandedStudentId(expanded ? null : student.id)}
            getAttendanceRateColor={getAttendanceRateColor}
          />
        </div>
        {/* Expanded details for desktop */}
        {expanded && (
          <div className="hidden md:block bg-white border border-blue-100 rounded-b-xl shadow p-6 mb-2 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start gap-2">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={student.avatarUrl} />
                  <AvatarFallback>{student.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="font-bold text-blue-900 text-lg">{student.studentName}</div>
                <div className="text-xs text-gray-500">ID: {student.studentId}</div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                  <Mail className="w-4 h-4" /> {student.email || 'student@email.com'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4" /> {student.phoneNumber || '+63 900 000 0000'}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Department</div>
                  <div className="text-blue-800 font-semibold">{student.department}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Course</div>
                  <div className="text-blue-800 font-semibold">{student.course}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Year Level</div>
                  <div className="text-blue-800 font-semibold">{student.yearLevel}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Attendance Rate</div>
                  <div className={`font-bold ${getAttendanceRateColor(student.attendanceRate)}`}>{student.attendanceRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Status</div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Last Attendance</div>
                  <div className="text-blue-800 font-semibold">{new Date(student.lastAttendance).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500 font-medium mb-1">Subjects</div>
              <div className="flex flex-wrap gap-2">
                {student.subjects.map(subj => (
                  <span key={subj} className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{subj}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Report</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 600, padding: 0 }}>
        <TableHeader sortBy={sortBy} setSortBy={setSortBy} allSelected={allSelected} onSelectAll={onSelectAll} />
        <AutoSizer disableHeight>
          {({ width }: { width: number }) => (
            <List
              height={560}
              itemCount={filteredStudents.length}
              itemSize={64}
              width={width || '100%'}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </CardContent>
    </Card>
  );
};

export default function StudentAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState<Filters>({
    department: '',
    course: '',
    yearLevel: '',
    attendanceRate: ''
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status'>('attendance-desc');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, dateRange]);

  // Extract unique values for filters
  const departments = Array.from(new Set(mockStudents.map(student => student.department)));
  const courses = Array.from(new Set(mockStudents.map(student => student.course)));
  const yearLevels = Array.from(new Set(mockStudents.map(student => student.yearLevel)));

  // Memoize filtered/sorted data
  const filteredStudents = useMemo(() => {
    return mockStudents.filter(student => {
      const attendanceDate = student.lastAttendance.split('T')[0];
      const inDateRange = attendanceDate >= dateRange.start && attendanceDate <= dateRange.end;
      const matchesSearch = student.studentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.studentId.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesDepartment = !filters.department || student.department === filters.department;
      const matchesCourse = !filters.course || student.course === filters.course;
      const matchesYearLevel = !filters.yearLevel || student.yearLevel === filters.yearLevel;
      let matchesAttendanceRate = true;
      if (filters.attendanceRate) {
        switch (filters.attendanceRate) {
          case 'high':
            matchesAttendanceRate = student.attendanceRate >= 90;
            break;
          case 'medium':
            matchesAttendanceRate = student.attendanceRate >= 75 && student.attendanceRate < 90;
            break;
          case 'low':
            matchesAttendanceRate = student.attendanceRate < 75;
            break;
        }
      }
      return inDateRange && matchesSearch && matchesDepartment && matchesCourse && matchesYearLevel && matchesAttendanceRate;
    });
  }, [mockStudents, debouncedSearch, filters, dateRange]);

  // Update sortedStudents to handle new sort options
  const sortedStudents = useMemo(() => {
    const arr = [...filteredStudents];
    if (sortBy === 'attendance-desc') return arr.sort((a, b) => b.attendanceRate - a.attendanceRate);
    if (sortBy === 'attendance-asc') return arr.sort((a, b) => a.attendanceRate - b.attendanceRate);
    if (sortBy === 'name') return arr.sort((a, b) => a.studentName.localeCompare(b.studentName));
    if (sortBy === 'id') return arr.sort((a, b) => a.studentId.localeCompare(b.studentId));
    if (sortBy === 'status') return arr.sort((a, b) => {
      const getStatus = (s: StudentAttendance) => s.attendanceRate >= 90 ? 0 : s.attendanceRate >= 75 ? 1 : 2;
      return getStatus(a) - getStatus(b);
    });
    return arr;
  }, [filteredStudents, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / pageSize);
  const paginatedStudents = sortedStudents.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = sortedStudents.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, sortedStudents.length);

  // Calculate statistics
  const totalStudents = filteredStudents.length;
  const averageAttendanceRate = filteredStudents.reduce((acc, student) => acc + student.attendanceRate, 0) / totalStudents || 0;
  const totalLate = filteredStudents.reduce((acc, student) => acc + student.lateDays, 0);
  const totalAbsent = filteredStudents.reduce((acc, student) => acc + student.absentDays, 0);
  const totalPresent = filteredStudents.reduce((acc, student) => acc + student.presentDays, 0);

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({ department: '', course: '', yearLevel: '', attendanceRate: '' });
    setDateRange({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Name', 'ID', 'Department', 'Course', 'Year Level', 'Attendance Rate', 'Present', 'Late', 'Absent', 'Total Days', 'Last Attendance'
    ];
    const rows = sortedStudents.map(stu => [
      stu.studentName,
      stu.studentId,
      stu.department,
      stu.course,
      stu.yearLevel,
      stu.attendanceRate + '%',
      stu.presentDays,
      stu.lateDays,
      stu.absentDays,
      stu.totalDays,
      new Date(stu.lastAttendance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-attendance-report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to PDF handler
  const handleExportPDF = async () => {
    setPdfLoading(true);
    const input = document.getElementById('report-section');
    if (!input) {
      setPdfLoading(false);
      alert('Report section not found.');
      return;
    }
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Calculate image dimensions to fit page
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let remainingHeight = imgHeight - pageHeight;
      let pageY = 0;
      while (remainingHeight > 0) {
        pageY = pageY - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, pageY, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
      pdf.save('student-attendance-report.pdf');
    } catch (err) {
      alert('Failed to export PDF.');
    }
    setPdfLoading(false);
  };

  const allSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selected.has(s.id));
  const onSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedStudents.map(s => s.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 p-0">
      <div className="container mx-auto p-6 space-y-10">
        {/* --- Analytics & Insights Section --- */}
        <section>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Analytics & Insights</h2>
          <div className="bg-blue-50/60 rounded-2xl p-6 space-y-8 border border-blue-100 shadow-sm">
            <AttendanceTrendsChart />
            <AttendanceByYearLevelChart />
            <AbsenceHeatmap />
            <AttendanceByDayOfWeekChart />
            <MonthlyAttendanceComparisonChart />
          </div>
        </section>

        {/* --- Filters Section --- */}
        <section>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Filters</h2>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            departments={departments}
            courses={courses}
            yearLevels={yearLevels}
            filters={filters}
            setFilters={setFilters}
            dateRange={dateRange}
            setDateRange={setDateRange}
            handleClearFilters={handleClearFilters}
          />
          <div className="border-b border-blue-200 mb-6" />
        </section>

        {/* --- Insights Cards Section --- */}
        <section>
          <InsightsSection
            totalStudents={totalStudents}
            averageAttendanceRate={averageAttendanceRate}
            totalLate={totalLate}
            totalAbsent={totalAbsent}
            getAttendanceRateColor={getAttendanceRateColor}
          />
          <div className="mt-6" />
          <AttendanceDistribution
            totalPresent={totalPresent}
            totalLate={totalLate}
            totalAbsent={totalAbsent}
          />
        </section>

        {/* --- Attendance Report Section --- */}
        <section>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Attendance Report</h2>
          {selected.size > 0 && (
            <BulkActionsBar
              count={selected.size}
              onExport={() => alert('Export selected students (stub)')}
              onExcuse={() => alert('Mark selected as excused (stub)')}
              onNotify={() => alert('Send notification to selected (stub)')}
              onClear={() => setSelected(new Set())}
            />
          )}
          <ReportList
            filteredStudents={paginatedStudents}
            getAttendanceRateColor={getAttendanceRateColor}
            loading={loading}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selected={selected}
            setSelected={setSelected}
            allSelected={allSelected}
            onSelectAll={onSelectAll}
            expandedStudentId={expandedStudentId}
            setExpandedStudentId={setExpandedStudentId}
          />
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="ml-4">Showing {rangeStart}–{rangeEnd} of {sortedStudents.length} students</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
