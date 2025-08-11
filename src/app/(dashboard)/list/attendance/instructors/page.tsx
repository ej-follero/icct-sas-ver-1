'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Search, TrendingUp, TrendingDown, Users, Clock, AlertCircle, Filter, ChevronDown, BookOpen, Info, Printer, FileDown, FileText, ChevronUp, Mail, Phone, Send, Home, ChevronRight, Download, RefreshCw, Settings, Maximize2, Minimize2, CheckCircle, X, ChevronsLeft, ChevronLeft, ChevronsRight, Activity, BarChart3, Shield, Zap, AlertTriangle, Target, Building, GraduationCap, Check, User, Hash, Bell, Eye, Plus, Upload, Columns3, List, Edit, Trash2, Calendar } from 'lucide-react';
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
import InstructorDetailModal from '@/components/InstructorDetailModal';
import { 
  AttendanceRecordsDialog, 
  EditInstructorDialog, 
  DeactivateInstructorDialog 
} from '@/components/reusable/Dialogs';
import { ICCT_CLASSES, getStatusColor, getAttendanceRateColor } from '@/lib/colors';
import { 
  InstructorAttendance, 
  RiskLevel,
  InstructorStatus,
  AttendanceStatus
} from '@/types/instructor-attendance';
import { FilterChips } from '@/components/FilterChips';
import { FilterDialog } from '@/components/FilterDialog';
import { AttendanceAnalytics } from '@/components/AttendanceAnalytics';
import { AttendanceSummaryCards } from '@/components/AttendanceSummaryCards';

import { processRealTimeData, type AttendanceData } from '@/lib/analytics-utils';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { EmptyState } from '@/components/reusable';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';


interface Filters extends Record<string, string[]> {
  departments: string[];
  instructorTypes: string[];
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

// Filter presets specific to instructors
const filterPresets: FilterPreset[] = [
  {
    id: 'high-performers',
    name: 'High Performers',
    description: 'Instructors with excellent attendance (>90%)',
    icon: TrendingUp,
    filters: { attendanceRates: ['90-100%'] }
  },
  {
    id: 'needs-attention',
    name: 'Needs Attention',
    description: 'Instructors with attendance concerns',
    icon: AlertTriangle,
    filters: { riskLevels: ['MEDIUM', 'HIGH'], attendanceRates: ['Below 75%'] }
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    description: 'CS Department instructors',
    icon: Building,
    filters: { departments: ['Computer Science'] }
  },
  {
    id: 'full-time-staff',
    name: 'Full-time Staff',
    description: 'Full-time instructors only',
    icon: Users,
    filters: { instructorTypes: ['FULL_TIME'] }
  },
  {
    id: 'recent-absences',
    name: 'Recent Absences',
    description: 'Instructors with recent attendance issues',
    icon: Clock,
    filters: { riskLevels: ['MEDIUM', 'HIGH'] }
  }
];

export default function InstructorAttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    departments: [],
    instructorTypes: [],
    attendanceRates: [],
    riskLevels: [],
    subjects: [],
    statuses: []
  });
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorAttendance | null>(null);
  const [showInstructorDetail, setShowInstructorDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [instructors, setInstructors] = useState<InstructorAttendance[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // New modal states
  const [selectedInstructorForRecords, setSelectedInstructorForRecords] = useState<InstructorAttendance | null>(null);
  const [showAttendanceRecordsModal, setShowAttendanceRecordsModal] = useState(false);
  const [selectedInstructorForEdit, setSelectedInstructorForEdit] = useState<InstructorAttendance | null>(null);
  const [showEditInstructorModal, setShowEditInstructorModal] = useState(false);
  const [selectedInstructorForDelete, setSelectedInstructorForDelete] = useState<InstructorAttendance | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  
  // Table state
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'instructorName', order: 'asc' });
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Fetch instructor attendance data
  const fetchInstructorAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const response = await fetch(`/api/attendance/instructors?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle case where API returns an error object
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      setInstructors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching instructor attendance:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInstructors([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Fetch data on component mount and when search changes
  useEffect(() => {
    fetchInstructorAttendance();
  }, [fetchInstructorAttendance]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get unique filter options from data
  const departments = useMemo(() => [...new Set(instructors.map(s => s.department))], [instructors]);
  const instructorTypes = useMemo(() => [...new Set(instructors.map(s => s.instructorType))], [instructors]);
  const subjects = useMemo(() => [...new Set(instructors.flatMap(s => s.subjects))], [instructors]);
  const riskLevels = useMemo(() => [...new Set(instructors.map(s => s.riskLevel).filter(Boolean))], [instructors]);
  const statuses = useMemo(() => [...new Set(instructors.map(s => s.status).filter(Boolean))], [instructors]);
  
  // Function to get count for each filter option
  const getFilterCount = (filterType: string, option: string): number => {
    return instructors.filter(instructor => {
      switch (filterType) {
        case 'departments':
          return instructor.department === option;
        case 'instructorTypes':
          return instructor.instructorType === option;
        case 'attendanceRates':
          if (option === 'High (≥90%)') return instructor.attendanceRate >= 90;
          if (option === 'Medium (75-89%)') return instructor.attendanceRate >= 75 && instructor.attendanceRate < 90;
          if (option === 'Low (<75%)') return instructor.attendanceRate < 75;
          return false;
        case 'riskLevels':
          return instructor.riskLevel === option;
        case 'subjects':
          return instructor.subjects.includes(option);
        case 'statuses':
          return instructor.status === option;
        default:
          return false;
      }
    }).length;
  };

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
      key: 'instructorTypes',
      title: 'Instructor Types',
      options: instructorTypes.map(type => ({
        value: type,
        label: type.replace('_', ' '),
        count: getFilterCount('instructorTypes', type)
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
        value: subject,
        label: subject,
        count: getFilterCount('subjects', subject)
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
  ], [departments, instructorTypes, riskLevels, subjects, statuses, getFilterCount]);

  // Table column definitions
  const instructorColumns: TableListColumn<InstructorAttendance>[] = [
    { 
      header: "Select", 
      accessor: "select", 
      className: "w-12 text-center" 
    },
    { 
      header: "", 
      accessor: "expander", 
      className: "w-12 text-center",
      expandedContent: (instructor: InstructorAttendance) => (
        <TableCell colSpan={instructorColumns.length} className="p-0">
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-l-4 border-blue-400 mx-2 mb-2 rounded-r-xl shadow-sm transition-all duration-300">
            
            {/* Header Section with Instructor Summary */}
            <div className="p-4 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                      <AvatarImage src={instructor.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                        {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      instructor.status === 'ACTIVE' ? 'bg-green-500' : 
                      instructor.status === 'ON_LEAVE' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{instructor.instructorName}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {instructor.employeeId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {instructor.department}
                      </span>
                      <Badge variant="outline" className="text-xs bg-white/80">
                        {instructor.instructorType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Overall Performance Indicator */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">{instructor.attendanceRate}%</div>
                  <div className="text-xs text-slate-600 mb-2">Overall Attendance</div>
                  <Progress 
                    value={instructor.attendanceRate} 
                    className="w-24 h-2 bg-slate-200"
                  />
                  <div className="flex justify-center mt-1">
                    <Badge className={`text-xs px-2 py-1 ${
                      instructor.attendanceRate >= 90 ? 'bg-emerald-100 text-emerald-800' :
                      instructor.attendanceRate >= 75 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {instructor.riskLevel || 'NONE'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <div className="p-2 sm:p-4">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/60 rounded-lg p-1 gap-1">
                  <TabsTrigger value="activity" className="flex items-center justify-center gap-1 text-xs px-2 py-2">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center justify-center gap-1 text-xs px-2 py-2">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center justify-center gap-1 text-xs px-2 py-2">
                    <BarChart3 className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="flex items-center justify-center gap-1 text-xs px-2 py-2">
                    <Settings className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Actions</span>
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
                        {[
                          { day: 'Today', status: 'present', time: '8:00 AM' },
                          { day: 'Yesterday', status: 'present', time: '8:05 AM' },
                          { day: '2 days ago', status: 'late', time: '8:25 AM' },
                          { day: '3 days ago', status: 'present', time: '7:58 AM' },
                          { day: '4 days ago', status: 'absent', time: '--' },
                          { day: '5 days ago', status: 'present', time: '8:02 AM' },
                          { day: '6 days ago', status: 'present', time: '8:10 AM' }
                        ].map((entry, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-md bg-slate-50/50 border border-slate-200/30">
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
                        ))}
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
                              <Progress value={80} className="w-16 h-2" />
                              <span className="text-sm font-semibold text-emerald-700">4/5</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">On-Time Rate</span>
                            <div className="flex items-center gap-2">
                              <Progress value={75} className="w-16 h-2" />
                              <span className="text-sm font-semibold text-blue-700">75%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Current Streak</span>
                            <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">12 days</span>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-800">Rank #3</div>
                          <div className="text-xs text-slate-500">out of 12 in department</div>
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
                          Today's Classes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { time: '8:00 AM', subject: 'Math 101', room: 'A-201', status: 'completed' },
                          { time: '10:00 AM', subject: 'Math 102', room: 'A-201', status: 'in-progress' },
                          { time: '2:00 PM', subject: 'Statistics', room: 'B-105', status: 'upcoming' },
                          { time: '4:00 PM', subject: 'Algebra', room: 'A-203', status: 'upcoming' }
                        ].map((entry, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-200/30 hover:shadow-sm transition-shadow">
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
                                {entry.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Subjects Overview */}
                    <Card className="bg-white/70 border-slate-200/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          Teaching Subjects
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {instructor.subjects.map(subject => (
                            <Badge key={subject} variant="outline" className="text-xs bg-white/80 border-slate-300">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total Classes This Week</span>
                            <span className="font-semibold text-slate-800">15</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Classes Completed</span>
                            <span className="font-semibold text-emerald-700">12</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Upcoming Today</span>
                            <span className="font-semibold text-blue-700">2</span>
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
                            <span>{instructor.attendedClasses}/{instructor.totalScheduledClasses}</span>
                          </div>
                          <Progress value={(instructor.attendedClasses / instructor.totalScheduledClasses) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Late Arrivals</span>
                            <span>{instructor.lateClasses}/{instructor.totalScheduledClasses}</span>
                          </div>
                          <Progress value={(instructor.lateClasses / instructor.totalScheduledClasses) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Absences</span>
                            <span>{instructor.absentClasses}/{instructor.totalScheduledClasses}</span>
                          </div>
                          <Progress value={(instructor.absentClasses / instructor.totalScheduledClasses) * 100} className="h-2" />
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
                          className="w-full justify-start bg-white/80 hover:bg-blue-50 border-slate-300"
                          onClick={() => {
                            setSelectedInstructorForRecords(instructor);
                            setShowAttendanceRecordsModal(true);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                          View Full Records
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-emerald-50 border-slate-300"
                          onClick={() => {
                            setSelectedInstructorForEdit(instructor);
                            setShowEditInstructorModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2 text-emerald-600" />
                          Edit Profile
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-purple-50 border-slate-300"
                        >
                          <Mail className="w-4 h-4 mr-2 text-purple-600" />
                          Send Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start bg-white/80 hover:bg-orange-50 border-slate-300"
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
                          <span className="text-slate-700">{instructor.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">+1 (555) 123-4567</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Building className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">{instructor.department}</span>
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
      header: "Instructor", 
      accessor: "instructorName", 
      className: "text-blue-900 align-middle", 
      sortable: true,
      render: (instructor: InstructorAttendance) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-1 ring-gray-200">
              <AvatarImage src={instructor.avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {instructor.status === InstructorStatus.ACTIVE && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="font-semibold text-gray-900 truncate flex items-center gap-1">
              <span>{instructor.instructorName}</span>
            </div>
            <div className="text-sm text-gray-600 truncate">{instructor.employeeId}</div>
          </div>
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
      header: "Type", 
      accessor: "instructorType", 
      className: "text-blue-900 text-center align-middle", 
      sortable: true,
      render: (instructor: InstructorAttendance) => (
        <Badge variant="outline" className="text-xs">
          {instructor.instructorType.replace('_', ' ')}
        </Badge>
      )
    },
    { 
      header: "Attendance Rate", 
      accessor: "attendanceRate", 
      className: "text-center align-middle", 
      sortable: true,
      render: (instructor: InstructorAttendance) => {
        const getAttendanceRateColor = (rate: number) => {
          if (rate >= 90) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
          if (rate >= 75) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
          return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
        };
        const { text, bg, border } = getAttendanceRateColor(instructor.attendanceRate);
        return (
          <div className="flex items-center justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${text} ${bg} ${border} border`}>
              {instructor.attendanceRate}%
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
      render: (instructor: InstructorAttendance) => {
        const getRiskBadgeColor = (risk: string) => {
          switch (risk) {
            case 'NONE': return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
            case 'LOW': return { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' };
            case 'MEDIUM': return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
            case 'HIGH': return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
            default: return { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' };
          }
        };
        const { text, bg, border } = getRiskBadgeColor(instructor.riskLevel);
        return (
          <div className="flex items-center justify-center">
            <Badge className={`${text} ${bg} ${border} text-xs px-3 py-1 rounded-full`}>
              {instructor.riskLevel}
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
      render: (instructor: InstructorAttendance) => {
        const statusConfig = {
          'ACTIVE': { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
          'INACTIVE': { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Inactive' },
          'ON_LEAVE': { color: 'text-blue-700', bg: 'bg-blue-100', label: 'On Leave' }
        };
        const config = statusConfig[instructor.status as keyof typeof statusConfig] || statusConfig.INACTIVE;
        
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
      className: "text-center align-middle w-40",
      render: (instructor: InstructorAttendance) => (
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
                  className="h-8 w-8 p-0 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              handleInstructorClick(instructor);
            }}
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
                  className="h-8 w-8 p-0 hover:bg-orange-50"
            onClick={(e) => {
              e.stopPropagation();
                    setSelectedInstructorForEdit(instructor);
                    setShowEditInstructorModal(true);
            }}
          >
                  <Edit className="h-4 w-4 text-orange-600" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Instructor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
                    setSelectedInstructorForDelete(instructor);
                    setShowDeleteConfirmModal(true);
            }}
          >
                  <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Instructor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
                  className="h-8 w-8 p-0 hover:bg-purple-50"
            onClick={(e) => {
              e.stopPropagation();
                    setSelectedInstructorForRecords(instructor);
                    setShowAttendanceRecordsModal(true);
            }}
          >
                  <Calendar className="h-4 w-4 text-purple-600" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>View Attendance Records</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];
  
  // Memoize filtered/sorted data
  const filteredInstructors = useMemo(() => {
    let filtered = instructors.filter(instructor => {
      const matchesSearch = instructor.instructorName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        instructor.instructorId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        instructor.employeeId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        instructor.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        instructor.department.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Apply filters
      const matchesDepartment = filters.departments.length === 0 || filters.departments.includes(instructor.department);
      const matchesInstructorType = filters.instructorTypes.length === 0 || filters.instructorTypes.includes(instructor.instructorType);
      
      let matchesAttendanceRate = filters.attendanceRates.length === 0;
      if (filters.attendanceRates.length > 0) {
        matchesAttendanceRate = filters.attendanceRates.some(rate => {
          if (rate === 'High (≥90%)') return instructor.attendanceRate >= 90;
          if (rate === 'Medium (75-89%)') return instructor.attendanceRate >= 75 && instructor.attendanceRate < 90;
          if (rate === 'Low (<75%)') return instructor.attendanceRate < 75;
          return false;
        });
      }
      
      const matchesRiskLevel = filters.riskLevels.length === 0 || (instructor.riskLevel && filters.riskLevels.includes(instructor.riskLevel));
      const matchesSubject = filters.subjects.length === 0 || filters.subjects.some(subject => instructor.subjects.includes(subject));
      const matchesStatus = filters.statuses.length === 0 || (instructor.status && filters.statuses.includes(instructor.status));
      
      return matchesSearch && matchesDepartment && matchesInstructorType && 
             matchesAttendanceRate && matchesRiskLevel && matchesSubject && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy.field as keyof InstructorAttendance];
      const bValue = b[sortBy.field as keyof InstructorAttendance];
      
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
  }, [instructors, debouncedSearch, filters, sortBy]);

  // Pagination
  const paginatedInstructors = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredInstructors.slice(startIndex, endIndex);
  }, [filteredInstructors, page, pageSize]);

  const totalPages = Math.ceil(filteredInstructors.length / pageSize);

  // Memoize analytics data based on ALL instructors (not filtered)
  const analyticsData = useMemo(() => {
    return instructors.map(instructor => ({
      id: instructor.instructorId,
      name: instructor.instructorName,
      department: instructor.department,
      status: (instructor.status === 'ON_LEAVE' ? 'inactive' : instructor.status.toLowerCase()) as 'active' | 'inactive',
      riskLevel: (instructor.riskLevel || 'NONE').toLowerCase() as 'none' | 'low' | 'medium' | 'high',
      attendanceRate: instructor.attendanceRate,
      totalClasses: instructor.totalScheduledClasses,
      attendedClasses: instructor.attendedClasses,
      absentClasses: instructor.absentClasses,
      lateClasses: instructor.lateClasses,
      lastAttendance: instructor.lastAttendance,
      subjects: instructor.subjects,
      // Instructor-specific fields
      classesTaught: instructor.attendedClasses + instructor.lateClasses,
      classesMissed: instructor.absentClasses,
      complianceScore: instructor.attendanceRate,
      notificationCount: Math.floor(instructor.absentClasses * 0.8), // Mock calculation
      lastNotification: instructor.lastAttendance,
      teachingLoad: instructor.totalScheduledClasses,
      substituteRequired: instructor.absentClasses > 0,
      // Mock data for charts - could be calculated from actual attendance records
      weeklyData: [
        { week: 'Week 1', attendanceRate: instructor.attendanceRate * 0.95, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'up' as const, change: 2 },
        { week: 'Week 2', attendanceRate: instructor.attendanceRate * 0.98, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'up' as const, change: 1 },
        { week: 'Week 3', attendanceRate: instructor.attendanceRate * 1.02, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'stable' as const, change: 0 },
        { week: 'Week 4', attendanceRate: instructor.attendanceRate * 0.99, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'down' as const, change: -1 }
      ],
      historicalData: [], // Mock data - could be calculated from actual attendance records
      timeOfDayData: [], // Mock data - could be calculated from actual attendance records
      comparativeData: [], // Mock data - could be calculated from actual attendance records
      subjectPerformance: [], // Mock data - could be calculated from actual attendance records
      goalTracking: [], // Mock data - could be calculated from actual attendance records
      performanceRanking: [] // Mock data - could be calculated from actual attendance records
    }));
  }, [instructors]);

  const handleInstructorClick = (instructor: InstructorAttendance) => {
    setSelectedInstructor(instructor);
    setShowInstructorDetail(true);
  };

  const handleClearFilters = () => {
    setFilters({
      departments: [],
      instructorTypes: [],
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

  const handleToggleExpand = (instructorId: string) => {
    setExpandedRowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId);
      } else {
        newSet.add(instructorId);
      }
      return newSet;
    });
  };

  const handleSelectRow = (instructorId: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId);
      } else {
        newSet.add(instructorId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === paginatedInstructors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedInstructors.map(i => i.instructorId)));
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchInstructorAttendance();
  };



  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 mt-10">
        <div className="container mx-auto p-6 space-y-6">
          <PageHeader
            title="Instructor Attendance Management"
            subtitle="Monitor and manage instructor attendance records with real-time insights and comprehensive analytics"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Attendance Management', href: '/attendance' },
              { label: 'Instructors' }
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
          title="Instructor Attendance Management"
          subtitle="Monitor and manage instructor attendance records with real-time insights and comprehensive analytics"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Attendance Management', href: '/attendance' },
            { label: 'Instructors' }
          ]}
        />

        {/* Instructor Attendance Management - Main Content */}
        {/* Summary Cards */}
        {(() => {
          const instructorData: AttendanceData[] = instructors.map(instructor => ({
            id: instructor.instructorId,
            name: instructor.instructorName,
            department: instructor.department,
            status: (instructor.status === 'ON_LEAVE' ? 'inactive' : instructor.status.toLowerCase()) as 'active' | 'inactive',
            riskLevel: (instructor.riskLevel || 'NONE').toLowerCase() as 'none' | 'low' | 'medium' | 'high',
            attendanceRate: instructor.attendanceRate,
            totalClasses: instructor.totalScheduledClasses,
            attendedClasses: instructor.attendedClasses,
            absentClasses: instructor.absentClasses,
            lateClasses: instructor.lateClasses,
            lastAttendance: instructor.lastAttendance,
            subjects: instructor.subjects,
            // Instructor-specific fields
            classesTaught: instructor.attendedClasses + instructor.lateClasses,
            classesMissed: instructor.absentClasses,
            complianceScore: instructor.attendanceRate,
            notificationCount: Math.floor(instructor.absentClasses * 0.8), // Mock calculation
            lastNotification: instructor.lastAttendance,
            teachingLoad: instructor.totalScheduledClasses,
            substituteRequired: instructor.absentClasses > 0,
            // Mock data for charts - could be calculated from actual attendance records
            weeklyData: [
              { week: 'Week 1', attendanceRate: instructor.attendanceRate * 0.95, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'up' as const, change: 2 },
              { week: 'Week 2', attendanceRate: instructor.attendanceRate * 0.98, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'up' as const, change: 1 },
              { week: 'Week 3', attendanceRate: instructor.attendanceRate * 1.02, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'stable' as const, change: 0 },
              { week: 'Week 4', attendanceRate: instructor.attendanceRate * 0.99, totalClasses: Math.floor(instructor.totalScheduledClasses * 0.25), attendedClasses: Math.floor((instructor.attendedClasses + instructor.lateClasses) * 0.25), absentClasses: Math.floor(instructor.absentClasses * 0.25), lateClasses: Math.floor(instructor.lateClasses * 0.25), trend: 'down' as const, change: -1 }
            ],
            historicalData: [], // Mock data - could be calculated from actual attendance records
            timeOfDayData: [], // Mock data - could be calculated from actual attendance records
            comparativeData: [], // Mock data - could be calculated from actual attendance records
            subjectPerformance: [], // Mock data - could be calculated from actual attendance records
            goalTracking: [], // Mock data - could be calculated from actual attendance records
            performanceRanking: [] // Mock data - could be calculated from actual attendance records
          }));

          const analyticsData = processRealTimeData(instructorData, 'instructor');
          
          return (
            <>
              <AttendanceSummaryCards analyticsData={analyticsData} type="instructor" />
            </>
          );
        })()}
          
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
                  onClick: () => {
                    // TODO: Open manual attendance modal
                    console.log('Manual attendance modal opened');
                  }
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
                  description: 'Notify absent instructors',
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
                  description: 'View instructor schedules',
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
              <AttendanceAnalytics 
                data={analyticsData} 
                loading={loading} 
                type="instructor"
                enableAdvancedFeatures={true}
                enableRealTime={false}
                enableCrossFiltering={true}
                enableDrillDown={true}
                enableTimeRange={true}
                showHeader={true}
                onDrillDown={(filter: { type: string; value: string }) => {
                  console.log('Drill down:', filter);
                  // Handle drill down logic
                }}
                onExport={(format: 'pdf' | 'csv' | 'excel') => {
                  console.log('Export:', format);
                  // Handle export logic
                }}
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
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">Instructor Attendance Report</h3>
                      <p className="text-blue-100 text-xs sm:text-sm truncate">Search, filter and manage instructor attendance records</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
              {/* Enhanced Search and Filter Section */}
              <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Search Bar */}
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search instructors..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>
                  
                  {/* Quick Filter Dropdowns */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                    <Select value={filters.departments[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, departments: [] });
                      } else {
                        setFilters({ ...filters, departments: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full text-sm text-gray-700 min-w-0">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                      <SelectTrigger className="w-full text-sm text-gray-700 min-w-0">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filters.attendanceRates[0] || 'all'} onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters({ ...filters, attendanceRates: [] });
                      } else {
                        setFilters({ ...filters, attendanceRates: [value] });
                      }
                    }}>
                      <SelectTrigger className="w-full text-sm text-gray-700 min-w-0">
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
                      <SelectTrigger className="w-full text-sm text-gray-700 min-w-0">
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
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mx-3 sm:mx-4 lg:mx-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-blue-900">Active Filters:</span>
                    </div>
                    <span className="text-blue-700">
                      {filteredInstructors.length} of {instructors.length} instructors
                    </span>
                  </div>
                  <FilterChips
                    filters={filters}
                    fields={[
                      { key: 'departments', label: 'Department', allowIndividualRemoval: true },
                      { key: 'instructorTypes', label: 'Instructor Type', allowIndividualRemoval: true },
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
                  entityLabel="instructor"
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
                      columns={instructorColumns}
                      data={paginatedInstructors}
                      loading={loading}
                      emptyMessage={
                        <EmptyState
                          icon={<Users className="w-8 h-8" />}
                          title="No instructors found"
                          description="Try adjusting your search criteria or filters to find the instructors you're looking for."
                          action={
                            <Button onClick={handleClearFilters} className="bg-blue-600 hover:bg-blue-700">
                              Clear Filters
                            </Button>
                          }
                        />
                      }
                      selectedIds={Array.from(selected)}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      isAllSelected={selected.size === paginatedInstructors.length && paginatedInstructors.length > 0}
                      isIndeterminate={selected.size > 0 && selected.size < paginatedInstructors.length}
                      getItemId={(instructor) => instructor.instructorId}
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
                  {!loading && filteredInstructors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Users className="w-6 h-6 text-blue-400" />}
                        title="No instructors found"
                        description="Try adjusting your search criteria or filters to find the instructors you're looking for."
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
                      items={paginatedInstructors}
                      selectedIds={Array.from(selected)}
                      onSelect={handleSelectRow}
                      onView={(item) => handleInstructorClick(item)}
                      onEdit={(item) => console.log('Edit instructor:', item)}
                      onDelete={(item) => console.log('Delete instructor:', item)}
                      getItemId={(item) => item.instructorId}
                      getItemName={(item) => item.instructorName}
                      getItemCode={(item) => item.employeeId}
                      getItemStatus={(item) => item.status === 'ACTIVE' ? 'active' : 'inactive'}
                      getItemDescription={(item) => item.department}
                      getItemDetails={(item) => [
                        { label: 'Department', value: item.department },
                        { label: 'Type', value: item.instructorType.replace('_', ' ') },
                        { label: 'Attendance', value: `${item.attendanceRate}%` },
                        { label: 'Risk Level', value: item.riskLevel || 'None' },
                      ]}
                      disabled={(item) => false}
                      deleteTooltip={(item) => item.status === "INACTIVE" ? "Instructor is already inactive" : undefined}
                      isLoading={loading}
                    />
                  )}
                </div>
              </div>
              
              {/* Pagination */}
              <TablePagination
                page={page}
                totalItems={filteredInstructors.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </Card>
          </div>
        </div>

      {/* Instructor Detail Modal */}
      {selectedInstructor && (
        <InstructorDetailModal
          instructor={selectedInstructor}
          isOpen={showInstructorDetail}
          onClose={() => {
            setShowInstructorDetail(false);
            setSelectedInstructor(null);
          }}
        />
      )}

              {/* Attendance Records Modal */}
        <AttendanceRecordsDialog
          open={showAttendanceRecordsModal}
          onOpenChange={setShowAttendanceRecordsModal}
          instructor={selectedInstructorForRecords}
          showCopyButton={true}
          showPrintButton={true}
          showExportButton={true}
        />

        {/* Edit Instructor Modal */}
        <EditInstructorDialog
          open={showEditInstructorModal}
          onOpenChange={setShowEditInstructorModal}
          instructor={selectedInstructorForEdit}
          departments={departments}
          subjects={subjects}
          onSave={(data) => {
            console.log('Save instructor changes:', data);
            // TODO: Implement save functionality
          }}
          showCopyButton={true}
          showPrintButton={true}
        />

        {/* Delete Confirmation Modal */}
        <DeactivateInstructorDialog
          open={showDeleteConfirmModal}
          onOpenChange={setShowDeleteConfirmModal}
          instructor={selectedInstructorForDelete}
          onDeactivate={(instructorId, reason) => {
            console.log('Deactivate instructor:', instructorId, reason);
            // TODO: Implement deactivate functionality
          }}
          onArchive={(instructorId, reason) => {
            console.log('Archive instructor:', instructorId, reason);
            // TODO: Implement archive functionality
          }}
          showCopyButton={true}
          showPrintButton={true}
        />
      </TooltipProvider>
    );
}
