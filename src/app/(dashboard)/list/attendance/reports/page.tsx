'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, TrendingUp, Users, Clock, AlertCircle, Filter, ChevronDown, BookOpen, Download, Printer, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@radix-ui/react-dropdown-menu";
import { format } from 'date-fns';

// Types
interface StudentAttendance {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  yearLevel: string;
  section: string;
  avatarUrl?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  subject: string;
  section: string;
  instructor: string;
  timeIn: string | null;
  timeOut: string | null;
  scheduledTime: {
    start: string;
    end: string;
  };
  status: 'Present' | 'Late' | 'Absent';
  remarks: string;
}

interface Filters {
  student: string;
  course: string;
  yearLevel: string;
  section: string;
  subject: string;
  instructor: string;
  dateRange: {
    from: string;
    to: string;
  };
  status: string;
}

const defaultFilters: Filters = {
  student: '',
  course: '',
  yearLevel: '',
  section: '',
  subject: '',
  instructor: '',
  dateRange: {
    from: format(new Date(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  },
  status: ''
};

// Mock Data
const mockStudents: StudentAttendance[] = [
  {
    id: '1',
    studentName: 'Juan Dela Cruz',
    studentId: '2024-0001',
    course: 'BSIT',
    yearLevel: '2nd Year',
    section: 'BSIT 2A',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan'
  },
  {
    id: '2',
    studentName: 'Maria Santos',
    studentId: '2024-0002',
    course: 'BSIT',
    yearLevel: '2nd Year',
    section: 'BSIT 2A',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
  }
];

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    date: '2025-05-20',
    studentId: '2024-0001',
    studentName: 'Juan Dela Cruz',
    subject: 'ICT 101',
    section: 'BSIT 2A',
    instructor: 'John Smith',
    timeIn: '07:59',
    timeOut: '09:00',
    scheduledTime: {
      start: '08:00',
      end: '09:00'
    },
    status: 'Present',
    remarks: '—'
  },
  {
    id: '2',
    date: '2025-05-18',
    studentId: '2024-0001',
    studentName: 'Juan Dela Cruz',
    subject: 'ICT 101',
    section: 'BSIT 2A',
    instructor: 'John Smith',
    timeIn: '08:09',
    timeOut: '09:00',
    scheduledTime: {
      start: '08:00',
      end: '09:00'
    },
    status: 'Late',
    remarks: 'RFID scanned late'
  },
  {
    id: '3',
    date: '2025-05-17',
    studentId: '2024-0001',
    studentName: 'Juan Dela Cruz',
    subject: 'ICT 101',
    section: 'BSIT 2A',
    instructor: 'John Smith',
    timeIn: null,
    timeOut: null,
    scheduledTime: {
      start: '08:00',
      end: '09:00'
    },
    status: 'Absent',
    remarks: 'No scan found'
  }
];

// Components
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  students,
  courses,
  yearLevels,
  sections,
  subjects,
  instructors,
  filters,
  setFilters
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  students: StudentAttendance[];
  courses: string[];
  yearLevels: string[];
  sections: string[];
  subjects: string[];
  instructors: string[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
}) => {
  const handleDateChange = (type: 'from' | 'to', value: string) => {
    const newDateRange = { ...filters.dateRange, [type]: value };
    
    // Validate date range
    if (type === 'from' && new Date(value) > new Date(filters.dateRange.to)) {
      newDateRange.to = value;
    } else if (type === 'to' && new Date(value) < new Date(filters.dateRange.from)) {
      newDateRange.from = value;
    }
    
    setFilters({ ...filters, dateRange: newDateRange });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={filters.dateRange.from}
            onChange={(e) => handleDateChange('from', e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={filters.dateRange.to}
            onChange={(e) => handleDateChange('to', e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
                  value={filters.student}
                  onChange={(e) => setFilters({ ...filters, student: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Students</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.studentName}</option>
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
                  {yearLevels.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                <select
                  value={filters.instructor}
                  onChange={(e) => setFilters({ ...filters, instructor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Instructors</option>
                  {instructors.map(instructor => (
                    <option key={instructor} value={instructor}>{instructor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const InsightsSection = ({
  totalSessions,
  totalPresent,
  totalLate,
  totalAbsent,
  attendanceRate,
  classAverage
}: {
  totalSessions: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  attendanceRate: number;
  classAverage: number;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSessions}</div>
          <p className="text-xs text-gray-500 mt-1">Scheduled classes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Present</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
          <p className="text-xs text-gray-500 mt-1">On-time attendance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{totalLate}</div>
          <p className="text-xs text-gray-500 mt-1">Late arrivals</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Absent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{totalAbsent}</div>
          <p className="text-xs text-gray-500 mt-1">Missed classes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{attendanceRate.toFixed(1)}%</div>
          <p className="text-xs text-gray-500 mt-1">Overall attendance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Class Average</CardTitle>
            <User className="h-4 w-4 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{classAverage.toFixed(1)}%</div>
          <p className="text-xs text-gray-500 mt-1">Class attendance rate</p>
        </CardContent>
      </Card>
    </div>
  );
};

const AttendanceTable = ({ records }: { records: AttendanceRecord[] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '—';
    return time;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Subject</th>
                <th className="text-left py-3 px-4">Section</th>
                <th className="text-left py-3 px-4">Instructor</th>
                <th className="text-left py-3 px-4">Scheduled Time</th>
                <th className="text-left py-3 px-4">Time In</th>
                <th className="text-left py-3 px-4">Time Out</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{formatDate(record.date)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.studentName}`} />
                        <AvatarFallback>{record.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{record.studentName}</div>
                        <div className="text-sm text-gray-500">{record.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{record.subject}</td>
                  <td className="py-3 px-4">{record.section}</td>
                  <td className="py-3 px-4">{record.instructor}</td>
                  <td className="py-3 px-4">
                    {record.scheduledTime.start} - {record.scheduledTime.end}
                  </td>
                  <td className="py-3 px-4">{formatTime(record.timeIn)}</td>
                  <td className="py-3 px-4">{formatTime(record.timeOut)}</td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{record.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default function StudentAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  
  // Extract unique values for filters
  const courses = Array.from(new Set(mockStudents.map(student => student.course)));
  const yearLevels = Array.from(new Set(mockStudents.map(student => student.yearLevel)));
  const sections = Array.from(new Set(mockStudents.map(student => student.section)));
  const subjects = Array.from(new Set(mockAttendanceRecords.map(record => record.subject)));
  const instructors = Array.from(new Set(mockAttendanceRecords.map(record => record.instructor)));

  // Filter attendance records based on search query and filters
  const filteredRecords = mockAttendanceRecords.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = 
      (filters.student === '' || record.studentId === filters.student) &&
      (filters.course === '' || mockStudents.find(s => s.studentId === record.studentId)?.course === filters.course) &&
      (filters.yearLevel === '' || mockStudents.find(s => s.studentId === record.studentId)?.yearLevel === filters.yearLevel) &&
      (filters.section === '' || record.section === filters.section) &&
      (filters.subject === '' || record.subject === filters.subject) &&
      (filters.instructor === '' || record.instructor === filters.instructor) &&
      (filters.status === '' || record.status === filters.status) &&
      (new Date(record.date) >= new Date(filters.dateRange.from)) &&
      (new Date(record.date) <= new Date(filters.dateRange.to));

    return matchesSearch && matchesFilters;
  });

  // Calculate attendance statistics
  const totalSessions = filteredRecords.length;
  const totalPresent = filteredRecords.filter(record => record.status === 'Present').length;
  const totalLate = filteredRecords.filter(record => record.status === 'Late').length;
  const totalAbsent = filteredRecords.filter(record => record.status === 'Absent').length;
  const attendanceRate = totalSessions > 0 ? ((totalPresent + totalLate) / totalSessions) * 100 : 0;
  const classAverage = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Student Attendance Reports</h1>
      
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        students={mockStudents}
        courses={courses}
        yearLevels={yearLevels}
        sections={sections}
        subjects={subjects}
        instructors={instructors}
        filters={filters}
        setFilters={setFilters}
      />

      <InsightsSection
        totalSessions={totalSessions}
        totalPresent={totalPresent}
        totalLate={totalLate}
        totalAbsent={totalAbsent}
        attendanceRate={attendanceRate}
        classAverage={classAverage}
      />

      <AttendanceTable records={filteredRecords} />
    </div>
  );
}
