'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, TrendingUp, Users, Clock, AlertCircle, Filter, ChevronDown, BookOpen, Info, ArrowUpRight, ArrowDownRight, Printer, FileDown, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@radix-ui/react-dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types
interface InstructorAttendance {
  id: string;
  instructorName: string;
  instructorId: string;
  department: string;
  specialization: string;
  subjects: string[];
  classes: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  totalClasses: number;
  attendanceRate: number;
  lastAttendance: string;
  avatarUrl?: string;
  trend?: number;
  subjectAttendance?: Record<string, number>;
}

interface Filters {
  department: string;
  subject: string;
  attendanceRate: string;
}

interface DateRange {
  start: string;
  end: string;
}

// Mock Data
const mockInstructors: InstructorAttendance[] = [
  {
    id: '1',
    instructorName: 'Dr. Sarah Johnson',
    instructorId: 'INS-2024-001',
    department: 'Computer Science',
    specialization: 'Software Engineering',
    subjects: ['Web Development', 'Database Systems'],
    classes: 45,
    presentClasses: 42,
    absentClasses: 1,
    lateClasses: 2,
    totalClasses: 45,
    attendanceRate: 93.3,
    lastAttendance: new Date().toISOString(),
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    trend: 2.1,
    subjectAttendance: {
      'Web Development': 95,
      'Database Systems': 91
    }
  },
  {
    id: '2',
    instructorName: 'Prof. Michael Chen',
    instructorId: 'INS-2024-002',
    department: 'Information Technology',
    specialization: 'Network Security',
    subjects: ['Network Security', 'Cybersecurity'],
    classes: 40,
    presentClasses: 38,
    absentClasses: 0,
    lateClasses: 2,
    totalClasses: 40,
    attendanceRate: 95.0,
    lastAttendance: new Date().toISOString(),
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    trend: -1.2,
    subjectAttendance: {
      'Network Security': 97,
      'Cybersecurity': 93
    }
  }
];

// Components
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  departments,
  subjects,
  filters,
  setFilters,
  dateRange,
  setDateRange,
  handleClearFilters
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  departments: string[];
  subjects: string[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  handleClearFilters: () => void;
}) => {
  return (
    <div className="flex flex-col gap-4">
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
          <DropdownMenuContent className="w-56 p-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
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
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

const InsightsSection = ({
  totalInstructors,
  averageAttendanceRate,
  totalLate,
  totalAbsent,
  getAttendanceRateColor,
  iconTooltips = {}
}: {
  totalInstructors: number;
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
            <CardTitle className="text-sm font-medium text-gray-500">Total Instructors</CardTitle>
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
          <div className="text-2xl font-bold">{totalInstructors}</div>
          <p className="text-xs text-gray-500 mt-1">Active instructors in selected period</p>
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
          <p className="text-xs text-gray-500 mt-1">Classes with late arrivals</p>
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
          <p className="text-xs text-gray-500 mt-1">Classes missed</p>
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
        <CardTitle>Class Attendance Distribution</CardTitle>
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

const ReportList = ({
  filteredInstructors,
  getAttendanceRateColor
}: {
  filteredInstructors: InstructorAttendance[];
  getAttendanceRateColor: (rate: number) => string;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Report</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={instructor.avatarUrl} />
                    <AvatarFallback>{instructor.instructorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{instructor.instructorName}</h3>
                    <p className="text-sm text-gray-500">ID: {instructor.instructorId}</p>
                    <div className="flex space-x-2 mt-1">
                      <Badge variant="outline">{instructor.department}</Badge>
                      <Badge variant="outline">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {instructor.subjects.length} Subjects
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Attendance Rate:</span>
                    <span className={`font-bold ${getAttendanceRateColor(instructor.attendanceRate)}`}>
                      {instructor.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                    <span>Present: {instructor.presentClasses}</span>
                    <span>Late: {instructor.lateClasses}</span>
                    <span>Absent: {instructor.absentClasses}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default function InstructorAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState<Filters>({
    department: '',
    subject: '',
    attendanceRate: ''
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'attendance-desc' | 'attendance-asc' | 'name'>('attendance-desc');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, dateRange]);

  // Extract unique values for filters
  const departments = Array.from(new Set(mockInstructors.map(instructor => instructor.department)));
  const subjects = Array.from(new Set(mockInstructors.flatMap(instructor => instructor.subjects)));

  // Filter instructors based on search query, filters, and date range
  const filteredInstructors = mockInstructors.filter(instructor => {
    // Date filter
    const attendanceDate = instructor.lastAttendance.split('T')[0];
    const inDateRange = attendanceDate >= dateRange.start && attendanceDate <= dateRange.end;

    const matchesSearch = instructor.instructorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.instructorId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !filters.department || instructor.department === filters.department;
    const matchesSubject = !filters.subject || instructor.subjects.includes(filters.subject);
    let matchesAttendanceRate = true;
    if (filters.attendanceRate) {
      switch (filters.attendanceRate) {
        case 'high':
          matchesAttendanceRate = instructor.attendanceRate >= 90;
          break;
        case 'medium':
          matchesAttendanceRate = instructor.attendanceRate >= 75 && instructor.attendanceRate < 90;
          break;
        case 'low':
          matchesAttendanceRate = instructor.attendanceRate < 75;
          break;
      }
    }
    return inDateRange && matchesSearch && matchesDepartment && matchesSubject && matchesAttendanceRate;
  });

  // Calculate statistics
  const totalInstructors = filteredInstructors.length;
  const averageAttendanceRate = filteredInstructors.reduce((acc, instructor) => acc + instructor.attendanceRate, 0) / totalInstructors || 0;
  const totalLate = filteredInstructors.reduce((acc, instructor) => acc + instructor.lateClasses, 0);
  const totalAbsent = filteredInstructors.reduce((acc, instructor) => acc + instructor.absentClasses, 0);
  const totalPresent = filteredInstructors.reduce((acc, instructor) => acc + instructor.presentClasses, 0);

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({ department: '', subject: '', attendanceRate: '' });
    setDateRange({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  // Click handler for instructor row
  const handleInstructorClick = (instructor: InstructorAttendance) => {
    alert(`Clicked on ${instructor.instructorName} (ID: ${instructor.instructorId})`);
  };

  // Sorting logic
  const sortedInstructors = [...filteredInstructors].sort((a, b) => {
    if (sortBy === 'attendance-desc') return b.attendanceRate - a.attendanceRate;
    if (sortBy === 'attendance-asc') return a.attendanceRate - b.attendanceRate;
    return a.instructorName.localeCompare(b.instructorName);
  });

  // Highlight top/lowest performer
  const topPerformerId = sortedInstructors.length > 1 ? sortedInstructors[0]?.id : null;
  const lowestPerformerId = sortedInstructors.length > 1 ? sortedInstructors[sortedInstructors.length - 1]?.id : null;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Name', 'ID', 'Department', 'Specialization', 'Subjects', 'Attendance Rate', 'Present', 'Late', 'Absent', 'Total Classes', 'Last Attendance'
    ];
    const rows = sortedInstructors.map(inst => [
      inst.instructorName,
      inst.instructorId,
      inst.department,
      inst.specialization,
      inst.subjects.join('; '),
      inst.attendanceRate + '%',
      inst.presentClasses,
      inst.lateClasses,
      inst.absentClasses,
      inst.totalClasses,
      new Date(inst.lastAttendance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'instructor-attendance-report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to PDF handler (fully implemented)
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
      pdf.save('instructor-attendance-report.pdf');
    } catch (err) {
      alert('Failed to export PDF.');
    }
    setPdfLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between print:block mb-6">
        <h1 className="text-3xl font-bold">Instructor Attendance Reports</h1>
        <div className="flex gap-3 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 text-sm"
            aria-label="Export to CSV"
            disabled={pdfLoading}
          >
            <FileDown className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 text-sm ${pdfLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Export to PDF"
            disabled={pdfLoading}
          >
            <FileText className="w-5 h-5" />
            {pdfLoading ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            aria-label="Print Report"
            disabled={pdfLoading}
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>
      </div>
      <div id="report-section" className="space-y-8">
        {/* Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-4 mb-4 print:hidden">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="border rounded px-3 py-2"
            aria-label="Sort instructors"
          >
            <option value="attendance-desc">Attendance Rate (High to Low)</option>
            <option value="attendance-asc">Attendance Rate (Low to High)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
        {/* Search and Filters */}
        <div className="print:hidden mb-6">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            departments={departments}
            subjects={subjects}
            filters={filters}
            setFilters={setFilters}
            dateRange={dateRange}
            setDateRange={setDateRange}
            handleClearFilters={handleClearFilters}
          />
        </div>
        {/* Loading and Error States */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-lg text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <InsightsSection
                totalInstructors={totalInstructors}
                averageAttendanceRate={averageAttendanceRate}
                totalLate={totalLate}
                totalAbsent={totalAbsent}
                getAttendanceRateColor={getAttendanceRateColor}
                iconTooltips={{
                  users: 'Total instructors in the selected period',
                  trending: 'Average attendance rate',
                  clock: 'Total late arrivals',
                  alert: 'Total absences'
                }}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="mb-8">
                  <CardHeader className="pb-4">
                    <CardTitle>Detailed Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-6">
                        {sortedInstructors.map((instructor, idx) => (
                          <div
                            key={instructor.id}
                            className={`flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all bg-white shadow-sm ${instructor.id === topPerformerId ? 'ring-2 ring-green-400' : ''} ${instructor.id === lowestPerformerId ? 'ring-2 ring-red-400' : ''}`}
                            onClick={() => handleInstructorClick(instructor)}
                            aria-label={`Instructor ${instructor.instructorName}`}
                          >
                            <div className="flex items-center space-x-6 flex-1 mb-4 md:mb-0">
                              <Avatar>
                                <AvatarImage src={instructor.avatarUrl} />
                                <AvatarFallback>{instructor.instructorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium flex items-center gap-2 text-lg">
                                  {instructor.instructorName}
                                  {instructor.id === topPerformerId && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">Top Performer</span>
                                  )}
                                  {instructor.id === lowestPerformerId && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-2">Lowest</span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">ID: {instructor.instructorId}</p>
                                <div className="flex space-x-2 mt-2">
                                  <Badge variant="outline">{instructor.department}</Badge>
                                  <Badge variant="outline">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {instructor.subjects.length} Subjects
                                  </Badge>
                                </div>
                                {/* Subject Attendance Breakdown */}
                                {instructor.subjectAttendance && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {Object.entries(instructor.subjectAttendance).map(([subject, rate]) => (
                                      <span key={subject} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                                        {subject}: <span className="font-semibold">{rate}%</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right mt-4 md:mt-0 min-w-[220px]">
                              <div className="flex items-center space-x-2 justify-end mb-2">
                                <span className="text-sm font-medium">Attendance Rate:</span>
                                <span className={`font-bold ${getAttendanceRateColor(instructor.attendanceRate)} flex items-center`}>
                                  {instructor.attendanceRate.toFixed(1)}%
                                  {typeof instructor.trend === 'number' && (
                                    <span className={`ml-1 flex items-center ${instructor.trend > 0 ? 'text-green-600' : instructor.trend < 0 ? 'text-red-600' : 'text-gray-500'}`} aria-label={instructor.trend > 0 ? 'Improved' : instructor.trend < 0 ? 'Declined' : 'No change'}>
                                      {instructor.trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                      <span className="text-xs">{Math.abs(instructor.trend)}%</span>
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 items-center justify-end">
                                <span>Present: {instructor.presentClasses}</span>
                                <span className="flex items-center gap-1">
                                  Late: {instructor.lateClasses}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span><Info className="w-3 h-3 text-yellow-500" aria-label="What counts as late?" /></span>
                                      </TooltipTrigger>
                                      <TooltipContent>Late means the instructor arrived after the scheduled start time.</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </span>
                                <span className="flex items-center gap-1">
                                  Absent: {instructor.absentClasses}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span><Info className="w-3 h-3 text-red-500" aria-label="What counts as absent?" /></span>
                                      </TooltipTrigger>
                                      <TooltipContent>Absent means the instructor did not attend the class.</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-3">Total Classes Conducted: <span className="font-semibold text-gray-700">{instructor.totalClasses}</span></div>
                              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                Last Attendance: <span className="font-semibold text-gray-700">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>{new Date(instructor.lastAttendance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      </TooltipTrigger>
                                      <TooltipContent>Date format: DD MMM YYYY (e.g., 05 Jun 2025)</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              <div>
                <AttendanceDistribution
                  totalPresent={totalPresent}
                  totalLate={totalLate}
                  totalAbsent={totalAbsent}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          .print\:block { display: block !important; }
          .container { max-width: 100vw !important; padding: 0 !important; }
          .ring-2, .hover\:bg-gray-50, .cursor-pointer, .transition-all { box-shadow: none !important; border-width: 1px !important; }
          .h-2, .h-3, .h-4, .h-5, .h-6, .h-7, .h-8, .h-9, .h-10 { height: auto !important; }
          .w-2, .w-3, .w-4, .w-5, .w-6, .w-7, .w-8, .w-9, .w-10 { width: auto !important; }
          .overflow-hidden, .overflow-auto, .overflow-scroll { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
} 