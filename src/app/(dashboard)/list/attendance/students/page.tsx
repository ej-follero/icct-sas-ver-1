'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
 
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Search, TrendingUp, TrendingDown, Users, Clock, AlertCircle, Filter, ChevronDown, BookOpen, Info, Printer, FileDown, FileText, ChevronUp, Mail, Phone, Send, Home, ChevronRight, Download, RefreshCw, Settings, Maximize2, Minimize2, CheckCircle, X, ChevronsLeft, ChevronLeft, ChevronsRight, Activity, BarChart3, Shield, Zap, AlertTriangle, Target, Building, GraduationCap, Check, User, Hash, Bell, Eye, Plus, Upload, Columns3, List, Edit, Trash2, Calendar, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useDebounce } from '@/hooks/use-debounce';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentDetailModal from '@/components/StudentDetailModal';
import { 
  AttendanceRecordsDialog, 
  EditInstructorDialog, 
  DeactivateInstructorDialog 
} from '@/components/reusable/Dialogs';
import { ICCT_CLASSES, getStatusColor, getAttendanceRateColor } from '@/lib/colors';
import { 
  StudentAttendance, 
  RiskLevel,
  StudentStatus,
  AttendanceStatus
} from '@/types/student-attendance';
import { FilterChips } from '@/components/FilterChips';
import { FilterDialog } from '@/components/FilterDialog';
import StudentAttendanceAnalytics from '@/components/StudentAttendanceAnalytics';

 
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { EmptyState } from '@/components/reusable';
import PageHeader from '@/components/PageHeader/PageHeader';
 
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { ManualAttendanceDialog } from '@/components/reusable/Dialogs';


interface Filters extends Record<string, string[]> {
  departments: string[];
  courses: string[];
  yearLevels: string[];
  attendanceRates: string[];
  riskLevels: string[];
  subjects: string[];
  statuses: string[];
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: Partial<Filters>;
}

interface DateRange {
  start: string;
  end: string;
}

interface AdvancedFilters {
  attendanceRangeMin: number;
  attendanceRangeMax: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  lastAttendanceDays: string;
  presentDaysMin: string;
  presentDaysMax: string;
  absentDaysMin: string;
  absentDaysMax: string;
  lateDaysMin: string;
  lateDaysMax: string;
  totalDaysMin: string;
  totalDaysMax: string;
  logicalOperator: 'AND' | 'OR';
  customTextFilter: string;
  excludeInactive: boolean;
  onlyRecentAppointments: boolean;
}

// New interfaces for attendance records
interface AttendanceRecord {
  id: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject: string;
  room: string;
  notes?: string;
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TodaySchedule {
  id: string;
  time: string;
  subject: string;
  room: string;
  status?: 'completed' | 'in-progress' | 'upcoming';
}

// Filter presets specific to students
const filterPresets: FilterPreset[] = [
  {
    id: 'high-performers',
    name: 'High Performers',
    description: 'Students with excellent attendance (>90%)',
    icon: TrendingUp,
    filters: { attendanceRates: ['90-100%'] }
  },
  {
    id: 'needs-attention',
    name: 'Needs Attention',
    description: 'Students with attendance concerns',
    icon: AlertTriangle,
    filters: { riskLevels: ['MEDIUM', 'HIGH'], attendanceRates: ['Below 75%'] }
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    description: 'CS Department students',
    icon: Building,
    filters: { departments: ['Computer Science'] }
  },
  {
    id: 'first-year',
    name: 'First Year Students',
    description: 'First year students only',
    icon: GraduationCap,
    filters: { yearLevels: ['FIRST_YEAR'] }
  },
  {
    id: 'recent-absences',
    name: 'Recent Absences',
    description: 'Students with recent attendance issues',
    icon: Clock,
    filters: { riskLevels: ['MEDIUM', 'HIGH'] }
  }
];

export default function StudentAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    departments: [],
    courses: [],
    yearLevels: [],
    attendanceRates: [],
    riskLevels: [],
    subjects: [],
    statuses: []
  });
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendance | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // New modal states
  const [selectedStudentForRecords, setSelectedStudentForRecords] = useState<StudentAttendance | null>(null);
  const [showAttendanceRecordsModal, setShowAttendanceRecordsModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentAttendance | null>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<StudentAttendance | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  
  // Table state
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'studentName', order: 'asc' });
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [manualStudentId, setManualStudentId] = useState<number | undefined>(undefined);
  
  // Subject filter state for analytics
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Fetch subjects data
  const fetchSubjects = useCallback(async () => {
    try {
      setSubjectsLoading(true);
      const response = await fetch('/api/subjects?page=1&pageSize=1000&status=ACTIVE');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('Fetched subjects:', data.subjects);
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  // Fetch student attendance data
  const fetchStudentAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const response = await fetch(`/api/attendance/students?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle case where API returns an error object
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      console.log('Fetched student data:', data);
      console.log('Number of students:', Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample student data:', data[0]);
      }
      
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching student attendance:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStudents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Fetch data on component mount and when search changes
  useEffect(() => {
    console.log('useEffect triggered - fetching data');
    fetchStudentAttendance();
    fetchSubjects();
  }, [fetchStudentAttendance, fetchSubjects]);

  // Removed frequent timer re-render to prevent dropdown from closing unexpectedly

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get unique filter options from data
  const departments = useMemo(() => [...new Set(students.map(s => s.department))], [students]);
  const courses = useMemo(() => [...new Set(students.map(s => s.courseCode))], [students]);
  const yearLevels = useMemo(() => [...new Set(students.map(s => s.yearLevel))], [students]);
  const riskLevels = useMemo(() => [...new Set(students.map(s => s.riskLevel).filter(Boolean))], [students]);
  const statuses = useMemo(() => [...new Set(students.map(s => s.status).filter(Boolean))], [students]);
  
  // Subject data state
  const [subjects, setSubjects] = useState<Array<{ subjectId: number; subjectName: string; subjectCode: string }>>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  

  
  // Function to get count for each filter option
  const getFilterCount = useCallback((filterType: string, option: string): number => {
    return students.filter(student => {
      switch (filterType) {
        case 'departments':
          return student.department === option;
        case 'courses':
          return student.courseCode === option;
        case 'yearLevels':
          return student.yearLevel === option;
        case 'attendanceRates':
          if (option === 'High (≥90%)') return student.attendanceRate >= 90;
          if (option === 'Medium (75-89%)') return student.attendanceRate >= 75 && student.attendanceRate < 90;
          if (option === 'Low (<75%)') return student.attendanceRate < 75;
          return false;
        case 'riskLevels':
          return student.riskLevel === option;
        case 'subjects':
          return student.schedules?.some(s => s.subjectCode === option) || false;
        case 'statuses':
          return student.status === option;
        default:
          return false;
      }
    }).length;
  }, [students]);

  // Prepare filter sections for the FilterDialog
  const filterSections = useMemo(() => [
    {
      key: 'departments',
      title: 'Departments',
      options: departments.map(dept => ({
        value: dept,
        label: dept,
        count: getFilterCount('departments', dept)
      }))
    },
    {
      key: 'courses',
      title: 'Courses',
      options: courses.map(code => ({
        value: code,
        label: code,
        count: getFilterCount('courses', code)
      }))
    },
    {
      key: 'yearLevels',
      title: 'Year Levels',
      options: yearLevels.map(level => ({
        value: level,
        label: level.replace('_', ' '),
        count: getFilterCount('yearLevels', level)
      }))
    },
    {
      key: 'attendanceRates',
      title: 'Attendance Rates',
      options: [
        { value: 'High (≥90%)', label: 'High (≥90%)', count: getFilterCount('attendanceRates', 'High (≥90%)') },
        { value: 'Medium (75-89%)', label: 'Medium (75-89%)', count: getFilterCount('attendanceRates', 'Medium (75-89%)') },
        { value: 'Low (<75%)', label: 'Low (<75%)', count: getFilterCount('attendanceRates', 'Low (<75%)') }
      ]
    },
    {
      key: 'riskLevels',
      title: 'Risk Levels',
      options: riskLevels.map(level => ({
        value: level,
        label: level,
        count: getFilterCount('riskLevels', level)
      }))
    },
    {
      key: 'subjects',
      title: 'Subjects',
      options: subjects.map(subject => ({
        value: subject.subjectCode,
        label: `${subject.subjectCode} - ${subject.subjectName}`,
        count: getFilterCount('subjects', subject.subjectCode)
      }))
    },
    {
      key: 'statuses',
      title: 'Status',
      options: statuses.map(status => ({
        value: status,
        label: status,
        count: getFilterCount('statuses', status)
      }))
    }
  ], [departments, courses, yearLevels, riskLevels, subjects, statuses, getFilterCount]);

  // Compute department rank for a student based on attendance rate (desc)
  const getDepartmentRank = useCallback((currentStudent: StudentAttendance) => {
    const peersInDepartment = students.filter(
      (peer) => peer.department === currentStudent.department
    );

    const peersSortedByAttendance = [...peersInDepartment].sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate;
      }
      // Tie-breaker: alphabetical by name for stable ordering
      return a.studentName.localeCompare(b.studentName);
    });

    const currentRankIndex = peersSortedByAttendance.findIndex(
      (peer) => peer.studentId === currentStudent.studentId
    );

    return {
      rank: currentRankIndex >= 0 ? currentRankIndex + 1 : peersSortedByAttendance.length,
      total: peersInDepartment.length
    };
  }, [students]);

  // Table column definitions
  const studentColumns: TableListColumn<StudentAttendance>[] = [
    { 
      header: "Select", 
      accessor: "select", 
      className: "w-8 text-center" 
    },
    { 
      header: "", 
      accessor: "expander", 
      className: "w-8 text-center",
      expandedContent: (student: StudentAttendance) => (
        <TableCell colSpan={studentColumns.length} className="p-0">
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-l-4 border-blue-400 mx-2 mb-2 rounded-r-xl shadow-sm transition-all duration-300">
            
            {/* Header Section with Student Summary */}
            <div className="p-4 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-white shadow-md">
                      <User className="h-7 w-7 text-blue-600" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      student.status === 'ACTIVE' ? 'bg-green-500' : 
                      'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{student.studentName}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {student.studentIdNum}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {student.department}
                      </span>
                      <Badge variant="outline" className="text-xs bg-white/80">
                        {student.yearLevel.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Overall Performance Indicator */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800 mt-4">{student.attendanceRate}%</div>
                  <div className="text-xs text-slate-600 mb-2">Overall Attendance</div>
                  <Progress 
                    value={student.attendanceRate} 
                    className="w-24 h-2 bg-slate-200 mx-auto"
                  />
                  <div className="flex justify-center mt-1">
                    <Badge className={`text-xs px-2 py-1 ${
                      student.attendanceRate >= 90 ? 'bg-emerald-100 text-emerald-800' :
                      student.attendanceRate >= 75 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.riskLevel || 'NONE'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <div className="p-2 sm:p-4">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-blue-50/70 rounded p-1 gap-1 border border-blue-200">
                  <TabsTrigger value="activity" className="flex items-center justify-center gap-1 text-xs px-2 py-2 rounded text-slate-700 hover:bg-blue-100 transition data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center justify-center gap-1 text-xs px-2 py-2 rounded text-slate-700 hover:bg-blue-100 transition data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center justify-center gap-1 text-xs px-2 py-2 rounded text-slate-700 hover:bg-blue-100 transition data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <BarChart3 className="w-3 h-3 flex-shrink-0" />
                    <span>Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="flex items-center justify-center gap-1 text-xs px-2 py-2 rounded text-slate-700 hover:bg-blue-100 transition data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <Settings className="w-3 h-3 flex-shrink-0" />
                    <span>Actions</span>
                  </TabsTrigger>
                </TabsList>

                {/* Recent Activity Tab */}
                <TabsContent value="activity" className="mt-2 sm:mt-4 space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Recent Days */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          Last 7 Days
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {student.recentActivity && student.recentActivity.length > 0 ? (
                          student.recentActivity.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-50/50 border border-slate-200/30">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  entry.status === 'present' ? 'bg-emerald-500' :
                                  entry.status === 'late' ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className="text-sm font-medium text-slate-700">{entry.day}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{entry.time}</span>
                                <Badge className={`text-xs px-2 py-0.5 ${
                                  entry.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                  entry.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {entry.status}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-slate-500 text-sm">
                            No recent activity data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Weekly Summary */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-600" />
                          Weekly Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Present Days</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={student.weeklyPerformance ? (student.weeklyPerformance.presentDays / student.weeklyPerformance.totalDays) * 100 : 0} 
                                className="w-16 h-2" 
                              />
                              <span className="text-sm font-semibold text-emerald-700">
                                {student.weeklyPerformance ? `${student.weeklyPerformance.presentDays}/${student.weeklyPerformance.totalDays}` : '0/0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">On-Time Rate</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={student.weeklyPerformance?.onTimeRate || 0} 
                                className="w-16 h-2" 
                              />
                              <span className="text-sm font-semibold text-blue-700">
                                {student.weeklyPerformance ? `${Math.round(student.weeklyPerformance.onTimeRate)}%` : '0%'}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Current Streak</span>
                            <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                              {student.weeklyPerformance?.currentStreak || 0} days
                            </span>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="text-center">
                          {(() => {
                            const { rank, total } = getDepartmentRank(student);
                            return (
                              <>
                                <div className="text-lg font-bold text-slate-800">{`Rank #${rank}`}</div>
                                <div className="text-xs text-slate-500">{`out of ${total} in department`}</div>
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-2 sm:mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Today's Schedule */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Today&apos;s Classes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {student.todaySchedule && student.todaySchedule.length > 0 ? (
                          student.todaySchedule.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded bg-slate-50/50 border border-slate-200/30 hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  entry.status === 'completed' ? 'bg-emerald-500' :
                                  entry.status === 'in-progress' ? 'bg-blue-500 animate-pulse' :
                                  'bg-slate-300'
                                }`}></div>
                                <div>
                                  <div className="font-medium text-slate-800">{entry.time}</div>
                                  <div className="text-sm text-slate-600">{entry.subject}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-slate-700">{entry.room}</div>
                                <Badge className={`text-xs mt-1 ${
                                  entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  entry.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {entry.status?.replace('-', ' ') || 'upcoming'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-slate-500 text-sm">
                            No classes scheduled for today
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Subjects Overview */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          Enrolled Subjects
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {student.schedules?.map(schedule => (
                            <Badge key={schedule.scheduleId} variant="outline" className="text-xs bg-white/80 border-slate-300">
                              {schedule.subjectName}
                            </Badge>
                          ))}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total Classes This Week</span>
                            <span className="font-semibold text-slate-800">{student.totalScheduledClasses}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Classes Attended</span>
                            <span className="font-semibold text-emerald-700">{student.attendedClasses}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Upcoming Today</span>
                            <span className="font-semibold text-blue-700">{student.todaySchedule?.length || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="mt-2 sm:mt-4">
                  {/* Performance Breakdown */}
                  <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        Performance Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Present</span>
                            <span>{student.attendedClasses}/{student.totalScheduledClasses}</span>
                          </div>
                          <Progress value={(student.attendedClasses / student.totalScheduledClasses) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Late Arrivals</span>
                            <span>{student.lateClasses}/{student.totalScheduledClasses}</span>
                          </div>
                          <Progress value={(student.lateClasses / student.totalScheduledClasses) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Absences</span>
                            <span>{student.absentClasses}/{student.totalScheduledClasses}</span>
                          </div>
                          <Progress value={(student.absentClasses / student.totalScheduledClasses) * 100} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="mt-2 sm:mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Quick Actions */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-blue-50 border-slate-300 rounded"
                          onClick={() => {
                            setSelectedStudentForRecords(student);
                            setShowAttendanceRecordsModal(true);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                          View Full Records
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-emerald-50 border-slate-300 rounded"
                          onClick={() => {
                            setSelectedStudentForEdit(student);
                            setShowEditStudentModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2 text-emerald-600" />
                          Edit Profile
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-purple-50 border-slate-300 rounded"
                        >
                          <Mail className="w-4 h-4 mr-2 text-purple-600" />
                          Send Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-orange-50 border-slate-300 rounded
                          "
                        >
                          <Bell className="w-4 h-4 mr-2 text-orange-600" />
                          Send Alert
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Contact & Info */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-600" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{student.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Building className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{student.department}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <GraduationCap className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{student.course}</span>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="text-xs text-slate-500">
                          <div>Last Login: 2 hours ago</div>
                          <div>Member since: Jan 2023</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TableCell>
      )
    },
    { 
      header: "Photo", 
      accessor: "photo", 
      className: "w-16 text-center",
      render: (student: StudentAttendance) => (
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-1 ring-gray-200">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            {student.status === 'ACTIVE' && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
        </div>
      )
    },
    { 
      header: "Student", 
      accessor: "studentName", 
      className: "text-blue-900 align-middle", 
      sortable: true,
      render: (student: StudentAttendance) => (
        <div className="flex flex-col min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate flex items-center gap-1">
            <span>{student.studentName}</span>
            {student.status === 'ACTIVE' && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </div>
          <div className="text-sm text-gray-600 truncate">{student.studentIdNum}</div>
        </div>
      )
    },
    { 
      header: "Department", 
      accessor: "department", 
      className: "text-blue-900 text-center align-middle", 
      sortable: true 
    },
    { 
      header: "Course Code", 
      accessor: "courseCode", 
      className: "text-blue-900 text-center align-middle", 
      sortable: true,
      render: (student: StudentAttendance) => (
        <Badge variant="outline" className="text-xs">
          {student.courseCode}
        </Badge>
      )
    },
    { 
      header: "Year Level", 
      accessor: "yearLevel", 
      className: "text-blue-900 text-center align-middle", 
      sortable: true,
      render: (student: StudentAttendance) => (
        <Badge variant="outline" className="text-xs">
          {student.yearLevel.replace('_', ' ')}
        </Badge>
      )
    },
    { 
      header: "Attendance Rate", 
      accessor: "attendanceRate", 
      className: "text-center align-middle", 
      sortable: true,
      render: (student: StudentAttendance) => {
        const getAttendanceRateColor = (rate: number) => {
          if (rate >= 90) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
          if (rate >= 75) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
          return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
        };
        const { text, bg, border } = getAttendanceRateColor(student.attendanceRate);
        return (
          <div className="flex items-center justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${text} ${bg} ${border} border`}>
              {student.attendanceRate}%
            </span>
          </div>
        );
      }
    },
    { 
      header: "Risk Level", 
      accessor: "riskLevel", 
      className: "text-center align-middle", 
      sortable: true,
      render: (student: StudentAttendance) => {
        const getRiskBadgeColor = (risk: string) => {
          switch (risk) {
            case 'NONE': return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
            case 'LOW': return { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' };
            case 'MEDIUM': return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
            case 'HIGH': return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
            default: return { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' };
          }
        };
        const { text, bg, border } = getRiskBadgeColor(student.riskLevel);
        return (
          <div className="flex items-center justify-center">
            <Badge className={`${text} ${bg} ${border} text-xs px-3 py-1 rounded-full`}>
              {student.riskLevel}
            </Badge>
          </div>
        );
      }
    },
    { 
      header: "Status", 
      accessor: "status", 
      className: "text-center align-middle", 
      sortable: true,
      render: (student: StudentAttendance) => {
        const statusConfig = {
          'ACTIVE': { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
          'INACTIVE': { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Inactive' },
  
        };
        const config = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.INACTIVE;
        
        return (
          <div className="flex items-center justify-center">
            <Badge className={`${config.color} ${config.bg} text-xs px-3 py-1 rounded-full`}>
              {config.label}
            </Badge>
          </div>
        );
      }
    },
    { 
      header: "Actions", 
      accessor: "actions", 
      className: "text-center align-middle w-16",
      render: (student: StudentAttendance) => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded overflow-hidden shadow-md">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleStudentClick(student);
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 focus:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
                <span>View Details</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudentForEdit(student);
                  setShowEditStudentModal(true);
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 focus:bg-blue-100"
              >
                <Edit className="h-4 w-4 text-orange-600" />
                <span>Edit Student</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudentForRecords(student);
                  setShowAttendanceRecordsModal(true);
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 focus:bg-blue-100"
              >
                <Calendar className="h-4 w-4 text-purple-600" />
                <span>View Attendance Records</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudentForDelete(student);
                  setShowDeleteConfirmModal(true);
                }}
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
                <span>Delete Student</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];
  
  // Memoize filtered/sorted data
  const filteredStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = student.studentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.studentId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.studentIdNum.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.department.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Apply filters
      const matchesDepartment = filters.departments.length === 0 || filters.departments.includes(student.department);
      const matchesCourse = filters.courses.length === 0 || filters.courses.includes(student.course);
      const matchesYearLevel = filters.yearLevels.length === 0 || filters.yearLevels.includes(student.yearLevel);
      
      let matchesAttendanceRate = filters.attendanceRates.length === 0;
      if (filters.attendanceRates.length > 0) {
        matchesAttendanceRate = filters.attendanceRates.some(rate => {
          if (rate === 'High (≥90%)') return student.attendanceRate >= 90;
          if (rate === 'Medium (75-89%)') return student.attendanceRate >= 75 && student.attendanceRate < 90;
          if (rate === 'Low (<75%)') return student.attendanceRate < 75;
          return false;
        });
      }
      
      const matchesRiskLevel = filters.riskLevels.length === 0 || (student.riskLevel && filters.riskLevels.includes(student.riskLevel));
      const matchesSubject = filters.subjects.length === 0 || filters.subjects.some(subject => student.schedules?.some(s => s.subjectCode === subject));
      const matchesStatus = filters.statuses.length === 0 || (student.status && filters.statuses.includes(student.status));
      
      return matchesSearch && matchesDepartment && matchesCourse && matchesYearLevel && 
             matchesAttendanceRate && matchesRiskLevel && matchesSubject && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy.field as keyof StudentAttendance];
      const bValue = b[sortBy.field as keyof StudentAttendance];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortBy.order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortBy.order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [students, debouncedSearch, filters, sortBy]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, page, pageSize]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize);

  // Memoize analytics data based on subject and current page filters
  const analyticsData = useMemo(() => {
    // Start with base list
    let base = [...students];

    // Apply page filter chips (departments, courses (courseCode), yearLevels, statuses, riskLevels, attendanceRates, subjects)
    base = base.filter(student => {
      const matchesDepartment = filters.departments.length === 0 || filters.departments.includes(student.department);
      const matchesCourse = filters.courses.length === 0 || filters.courses.includes(student.courseCode);
      const matchesYearLevel = filters.yearLevels.length === 0 || filters.yearLevels.includes(student.yearLevel);

      let matchesAttendanceRate = filters.attendanceRates.length === 0;
      if (filters.attendanceRates.length > 0) {
        matchesAttendanceRate = filters.attendanceRates.some(rate => {
          if (rate === 'High (≥90%)') return student.attendanceRate >= 90;
          if (rate === 'Medium (75-89%)') return student.attendanceRate >= 75 && student.attendanceRate < 90;
          if (rate === 'Low (<75%)') return student.attendanceRate < 75;
          return false;
        });
      }

      const matchesRiskLevel = filters.riskLevels.length === 0 || (student.riskLevel && filters.riskLevels.includes(student.riskLevel));
      const matchesStatus = filters.statuses.length === 0 || (student.status && filters.statuses.includes(student.status));
      const matchesSubjects = filters.subjects.length === 0 || filters.subjects.some(code => student.schedules?.some(s => s.subjectCode === code));

      return matchesDepartment && matchesCourse && matchesYearLevel && matchesAttendanceRate && matchesRiskLevel && matchesStatus && matchesSubjects;
    });

    // Apply analytics subject selector (drop-down above charts)
    const subjectFiltered = selectedSubject === 'all' 
      ? base 
      : base.filter(student => student.schedules?.some(s => {
          const subjectData = subjects.find(x => x.subjectName === s.subjectName);
          return subjectData?.subjectId.toString() === selectedSubject || s.subjectCode === selectedSubject;
        }));

    return subjectFiltered.map(student => ({
      id: student.studentId,
      name: student.studentName,
      department: student.department,
      status: student.status.toLowerCase() as 'active' | 'inactive',
      riskLevel: (student.riskLevel || 'NONE').toLowerCase() as 'none' | 'low' | 'medium' | 'high',
      attendanceRate: student.attendanceRate,
      totalClasses: student.totalScheduledClasses,
      attendedClasses: student.attendedClasses,
      absentClasses: student.absentClasses,
      lateClasses: student.lateClasses,
      lastAttendance: student.lastAttendance,
      subjects: student.schedules?.map(s => s.subjectName) || [],
      // Student-specific fields
      classesAttended: student.attendedClasses + student.lateClasses,
      classesMissed: student.absentClasses,
      complianceScore: student.attendanceRate,
      notificationCount: Math.floor(student.absentClasses * 0.8), // Mock calculation
      lastNotification: student.lastAttendance,
      courseLoad: student.totalScheduledClasses,
      needsAttention: student.absentClasses > 0,
      // Mock data for charts - could be calculated from actual attendance records
      weeklyData: [
        { week: 'Week 1', attendanceRate: student.attendanceRate * 0.95, totalClasses: Math.floor(student.totalScheduledClasses * 0.25), attendedClasses: Math.floor((student.attendedClasses + student.lateClasses) * 0.25), absentClasses: Math.floor(student.absentClasses * 0.25), lateClasses: Math.floor(student.lateClasses * 0.25), trend: 'up' as const, change: 2 },
        { week: 'Week 2', attendanceRate: student.attendanceRate * 0.98, totalClasses: Math.floor(student.totalScheduledClasses * 0.25), attendedClasses: Math.floor((student.attendedClasses + student.lateClasses) * 0.25), absentClasses: Math.floor(student.absentClasses * 0.25), lateClasses: Math.floor(student.lateClasses * 0.25), trend: 'up' as const, change: 1 },
        { week: 'Week 3', attendanceRate: student.attendanceRate * 1.02, totalClasses: Math.floor(student.totalScheduledClasses * 0.25), attendedClasses: Math.floor((student.attendedClasses + student.lateClasses) * 0.25), absentClasses: Math.floor(student.absentClasses * 0.25), lateClasses: Math.floor(student.lateClasses * 0.25), trend: 'stable' as const, change: 0 },
        { week: 'Week 4', attendanceRate: student.attendanceRate * 0.99, totalClasses: Math.floor(student.totalScheduledClasses * 0.25), attendedClasses: Math.floor((student.attendedClasses + student.lateClasses) * 0.25), absentClasses: Math.floor(student.absentClasses * 0.25), lateClasses: Math.floor(student.lateClasses * 0.25), trend: 'down' as const, change: -1 }
      ],
      historicalData: [], // Mock data - could be calculated from actual attendance records
      timeOfDayData: [], // Mock data - could be calculated from actual attendance records
      comparativeData: [], // Mock data - could be calculated from actual attendance records
      subjectPerformance: [], // Mock data - could be calculated from actual attendance records
      goalTracking: [], // Mock data - could be calculated from actual attendance records
      performanceRanking: [] // Mock data - could be calculated from actual attendance records
    }));
  }, [students, filters, selectedSubject, subjects]);

  const handleStudentClick = (student: StudentAttendance) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleClearFilters = () => {
    setFilters({
      departments: [],
      courses: [],
      yearLevels: [],
      attendanceRates: [],
      riskLevels: [],
      subjects: [],
      statuses: []
    });
  };

  const handleApplyFilters = (newFilters: Record<string, string[]>) => {
    setFilters(newFilters as Filters);
  };

  // Table handlers
  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleToggleExpand = (studentId: string) => {
    setExpandedRowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectRow = (studentId: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === paginatedStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedStudents.map(s => s.studentId)));
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleRefresh = async () => {
    try {
      console.log('Refreshing student attendance data...');
      // Clear any existing error state
      setError(null);
      // Set loading state to show refresh is happening
      setLoading(true);
      // Clear current data to show fresh loading state
      setStudents([]);
      
      // Fetch fresh data without search parameters
      const response = await fetch('/api/attendance/students');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle case where API returns an error object
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      console.log('Refresh successful, received data:', data);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error during refresh:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during refresh');
    } finally {
      setLoading(false);
    }
  };



  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 mt-10">
        <div className="container mx-auto p-6 space-y-6">
          <PageHeader
            title="Student Attendance Management"
            subtitle="Monitor and manage student attendance records with real-time insights and comprehensive analytics"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Attendance Management', href: '/attendance' },
              { label: 'Students' }
            ]}
          />
          
          <Card className="border border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full overflow-x-hidden">
        <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-4 space-y-4 sm:space-y-6">

        {/* Main Navigation Header Card */}
        <PageHeader
          title="Student Attendance Management"
          subtitle="Monitor and manage student attendance records with real-time insights and comprehensive analytics"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Attendance Management', href: '/attendance' },
            { label: 'Students' }
          ]}
        />

        {/* Student Attendance Management - Main Content */}
          
          {/* Quick Actions Panel */}
        <div className="w-full pt-2 sm:pt-3 overflow-x-hidden">
            <QuickActionsPanel
              variant="premium"
              title="Quick Actions"
              subtitle="Essential tools and shortcuts"
              icon={
                <div className="w-6 h-6 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
              }
              actionCards={[
                {
                  id: 'mark-attendance',
                  label: 'Manual Attendance',
                  description: 'Manually record attendance',
                  icon: <CheckCircle className="w-5 h-5 text-white" />,
                  onClick: () => setShowManualAttendance(true)
                },
                {
                  id: 'export-attendance',
                  label: 'Export Report',
                  description: 'Download attendance report',
                  icon: <Download className="w-5 h-5 text-white" />,
                  onClick: () => console.log('Export attendance report clicked')
                },
                {
                  id: 'send-notifications',
                  label: 'Send Alerts',
                  description: 'Notify absent students',
                  icon: <Bell className="w-5 h-5 text-white" />,
                  onClick: () => console.log('Send notifications clicked')
                },
                {
                  id: 'refresh-data',
                  label: 'Refresh Data',
                  description: 'Reload attendance data',
                  icon: loading ? (
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-white" />
                  ),
                  onClick: handleRefresh,
                  disabled: loading,
                  loading: loading
                },
                {
                  id: 'schedule-management',
                  label: 'Manage Schedules',
                  description: 'View student schedules',
                  icon: <Clock className="w-5 h-5 text-white" />,
                  onClick: () => console.log('Manage schedules clicked')
                }
              ]}
              lastActionTime="2 minutes ago"
              onLastActionTimeChange={() => {}}
              collapsible={true}
              defaultCollapsed={true}
              onCollapseChange={(collapsed) => {
                console.log('Quick Actions Panel collapsed:', collapsed);
              }}
            />
          </div>

                    {/* Analytics Dashboard */}

          
          <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden p-0 w-full">
              <StudentAttendanceAnalytics 
                data={analyticsData}
                loading={loading} 
                enableAdvancedFeatures={true}
                enableRealTime={false}

                enableDrillDown={true}
                enableTimeRange={true}
                showHeader={true}
                showSecondaryFilters={true}
                selectedSubject={selectedSubject}
                onSubjectChange={setSelectedSubject}
                subjects={subjects.map(subject => {
                  return { id: subject.subjectId.toString(), name: subject.subjectCode };
                })}

                onDrillDown={(filter: { type: string; value: string }) => {
                  // Handle drill down logic
                }}
                onExport={(format: 'pdf' | 'csv' | 'excel') => {
                  console.log('Export:', format);
                  // Handle export logic
                }}
                onRefresh={handleRefresh}
              />
          </Card>
          
          <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden p-0 w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - flush to card edge, no rounded corners */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">Student Attendance Report</h3>
                        <p className="text-blue-100 text-xs sm:text-sm truncate">Search, filter and manage student attendance records</p>
                      </div>
                    </div>
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                            onClick={handleRefresh}
                            disabled={loading}
                            aria-label="Refresh data"
                          >
                            {loading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Refresh data</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Enhanced Search and Filter Section */}
              <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row gap-3 items-end justify-end">
                  {/* Search Bar */}
                  <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>

                  {/* Quick Filter Dropdowns */}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <Select value={filters.departments[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, departments: [] });
                      } else {
                        setFilters({ ...filters, departments: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full lg:w-40 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Course Filter (by Course Code) */}
                    <Select value={filters.courses[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, courses: [] });
                      } else {
                        setFilters({ ...filters, courses: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full lg:w-40 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                        <SelectValue placeholder="Course Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map(code => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Year Level Filter */}
                    <Select value={filters.yearLevels[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, yearLevels: [] });
                      } else {
                        setFilters({ ...filters, yearLevels: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full lg:w-40 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                        <SelectValue placeholder="Year Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {yearLevels.map(level => (
                          <SelectItem key={level} value={level}>{level.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filters.statuses[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, statuses: [] });
                      } else {
                        setFilters({ ...filters, statuses: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full lg:w-32 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>

                      </SelectContent>
                    </Select>
                    
                    <Select value={filters.attendanceRates[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, attendanceRates: [] });
                      } else {
                        setFilters({ ...filters, attendanceRates: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full lg:w-36 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                        <SelectValue placeholder="Attendance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rates</SelectItem>
                        <SelectItem value="High (≥90%)">High (≥90%)</SelectItem>
                        <SelectItem value="Medium (75-89%)">Medium (75-89%)</SelectItem>
                        <SelectItem value="Low (<75%)">Low (&lt;75%)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filters.riskLevels[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, riskLevels: [] });
                      } else {
                        setFilters({ ...filters, riskLevels: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full lg:w-32 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                        <SelectValue placeholder="Risk Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips */}
              {Object.values(filters).some(arr => arr.length > 0) && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200 mx-3 sm:mx-4 lg:mx-6 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-blue-900">Active Filters:</span>
                    </div>
                    <span className="text-blue-700">
                      {filteredStudents.length} of {students.length} students
                    </span>
                  </div>
                  <FilterChips
                    filters={filters}
                    fields={[
                      { key: 'departments', label: 'Department', allowIndividualRemoval: true },
                      { key: 'courses', label: 'Course', allowIndividualRemoval: true },
                      { key: 'yearLevels', label: 'Year Level', allowIndividualRemoval: true },
                      { key: 'attendanceRates', label: 'Attendance Rate', allowIndividualRemoval: true },
                      { key: 'riskLevels', label: 'Risk Level', combineValues: true, allowIndividualRemoval: true },
                      { key: 'subjects', label: 'Subject', allowIndividualRemoval: true },
                      { key: 'statuses', label: 'Status', allowIndividualRemoval: true }
                    ]}
                    onRemove={(key, value) => {
                      if (value) {
                        // Remove individual value
                        const currentValues = filters[key] as string[];
                        const newValues = currentValues.filter(v => v !== value);
                        setFilters({ ...filters, [key]: newValues });
                      } else {
                        // Remove entire filter
                        setFilters({ ...filters, [key]: [] });
                      }
                    }}
                    onClearAll={handleClearFilters}
                    searchQuery={searchQuery}
                    onRemoveSearch={() => setSearchQuery('')}
                    showSearchChip={true}
                  />
                </div>
              )}

              {/* Bulk Actions Bar */}
              {selected.size > 0 && (
                <BulkActionsBar
                  selectedCount={selected.size}
                  onClear={() => setSelected(new Set())}
                  entityLabel="student"
                  actions={[
                    {
                      key: 'export',
                      label: 'Export Selected',
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: () => console.log('Export selected:', Array.from(selected))
                    },
                    {
                      key: 'notify',
                      label: 'Send Notification',
                      icon: <Bell className="w-4 h-4 mr-2" />,
                      onClick: () => console.log('Send notification to:', Array.from(selected))
                    },
                    {
                      key: 'update',
                      label: 'Update Status',
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: () => console.log('Update status for:', Array.from(selected))
                    }
                  ]}
                />
              )}



              {/* Content Section */}
              {/* Desktop table layout */}
              <div className="hidden lg:block">
                <div className="px-3 sm:px-4 lg:px-6 pt-4 pb-3">
                  <div className="overflow-x-auto bg-white/70 shadow-none relative w-full">
                    <TableList
                      columns={studentColumns}
                      data={paginatedStudents}
                      loading={loading}
                      emptyMessage={
                        <EmptyState
                          icon={<Users className="w-8 h-8" />}
                          title="No students found"
                          description="Try adjusting your search criteria or filters to find the students you're looking for."
                          action={
                            <Button onClick={handleClearFilters} className="bg-blue-600 hover:bg-blue-700 rounded">
                              Clear Filters
                            </Button>
                          }
                        />
                      }
                      selectedIds={Array.from(selected)}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      isAllSelected={selected.size === paginatedStudents.length && paginatedStudents.length > 0}
                      isIndeterminate={selected.size > 0 && selected.size < paginatedStudents.length}
                      getItemId={(student) => student.studentId}
                      expandedRowIds={Array.from(expandedRowIds)}
                      onToggleExpand={handleToggleExpand}
                      sortState={sortBy}
                      onSort={handleSort}
                      className="border-0 shadow-none w-full min-w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile card layout */}
              <div className="block lg:hidden w-full">
                <div className="px-3 sm:px-4 pt-3 pb-3">
                  {!loading && filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Users className="w-6 h-6 text-blue-400" />}
                        title="No students found"
                        description="Try adjusting your search criteria or filters to find the students you're looking for."
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={handleRefresh}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Data
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <TableCardView
                      items={paginatedStudents}
                      selectedIds={Array.from(selected)}
                      onSelect={handleSelectRow}
                      onView={(item) => handleStudentClick(item)}
                      onEdit={(item) => console.log('Edit student:', item)}
                      onDelete={(item) => console.log('Delete student:', item)}
                      getItemId={(item) => item.studentId}
                      getItemName={(item) => item.studentName}
                      getItemCode={(item) => item.studentIdNum}
                      getItemStatus={(item) => item.status === 'ACTIVE' ? 'active' : 'inactive'}
                      getItemDescription={(item) => item.department}
                      getItemDetails={(item) => [
                        { label: 'Department', value: item.department },
                        { label: 'Course Code', value: item.courseCode },
                        { label: 'Year Level', value: item.yearLevel.replace('_', ' ') },
                        { label: 'Attendance', value: `${item.attendanceRate}%` },
                        { label: 'Risk Level', value: item.riskLevel || 'None' },
                      ]}
                      disabled={(item) => false}
                      deleteTooltip={(item) => item.status === "INACTIVE" ? "Student is already inactive" : undefined}
                      isLoading={loading}
                    />
                  )}
                </div>
              </div>
              
              {/* Pagination */}
              <TablePagination
                page={page}
                totalItems={filteredStudents.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          isOpen={showStudentDetail}
          onClose={() => {
            setShowStudentDetail(false);
            setSelectedStudent(null);
          }}
          onEdit={() => {
            setShowStudentDetail(false);
            setSelectedStudentForEdit(selectedStudent);
            setShowEditStudentModal(true);
          }}
          onDelete={() => {
            setShowStudentDetail(false);
            setSelectedStudentForDelete(selectedStudent);
            setShowDeleteConfirmModal(true);
          }}
        />
      )}

      {/* Attendance Records Modal */}
      <AttendanceRecordsDialog
        open={showAttendanceRecordsModal}
        onOpenChange={setShowAttendanceRecordsModal}
        instructor={selectedStudentForRecords as any}
        showCopyButton={true}
        showPrintButton={true}
        showExportButton={true}
      />

      {/* Edit Student Modal */}
      <EditInstructorDialog
        open={showEditStudentModal}
        onOpenChange={setShowEditStudentModal}
        instructor={selectedStudentForEdit as any}
        onSave={async (payload) => {
          if (!selectedStudentForEdit?.studentId) {
            throw new Error('Missing studentId');
          }
          const res = await fetch(`/api/students/${selectedStudentForEdit.studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error || `Failed to update instructor (HTTP ${res.status})`);
          }
          await handleRefresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeactivateInstructorDialog
        open={showDeleteConfirmModal}
        onOpenChange={setShowDeleteConfirmModal}
        instructor={selectedStudentForDelete as any}
        onDeactivate={(studentId, reason) => {
          console.log('Deactivate student:', studentId, reason);
          // TODO: Implement deactivate functionality
        }}
        onArchive={(studentId, reason) => {
          console.log('Archive student:', studentId, reason);
          // TODO: Implement archive functionality
        }}
        showCopyButton={true}
        showPrintButton={true}
      />

      {/* Manual Attendance Dialog */}
      <ManualAttendanceDialog
        open={showManualAttendance}
        onOpenChange={setShowManualAttendance}
        defaultEntityType="student"
        defaultEntityId={manualStudentId}
        onSuccess={() => {
          // Optional: trigger refresh
        }}
      />
    </TooltipProvider>
  );
}
