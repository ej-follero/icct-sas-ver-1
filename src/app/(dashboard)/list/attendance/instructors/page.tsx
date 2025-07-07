'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Users, Clock, AlertCircle, Filter, ChevronDown, BookOpen, Info, Printer, FileDown, FileText, ChevronUp, Mail, Phone, Send, Home, ChevronRight, Download, RefreshCw, Settings, Maximize2, Minimize2, CheckCircle, X, ChevronsLeft, ChevronLeft, ChevronsRight, Calendar, Activity, BarChart3, Shield, Zap, AlertTriangle, Target, Building, GraduationCap, Check, User, Hash, Bell, Eye, List, Grid3X3, Columns3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from "@/components/ui/command";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InstructorDetailModal from '@/components/InstructorDetailModal';
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
import { TableList, TableListColumn } from '@/components/TableList';
import { TableCardView } from '@/components/TableCardView';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { TablePagination } from '@/components/TablePagination';
import { EmptyState } from '@/components/reusable';
import AttendanceHeader from '../../../../../components/AttendanceHeader';

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
  
  // View mode and table state
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban' | 'calendar'>('list');
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'instructorName', order: 'asc' });
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  
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
      className: "w-12 text-center" 
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
      className: "text-center align-middle w-32",
      render: (instructor: InstructorAttendance) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleInstructorClick(instructor);
            }}
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      )
    }
  ];
  
  // Memoize filtered/sorted data
  const filteredInstructors = useMemo(() => {
    let filtered = instructors.filter(instructor => {
      const matchesSearch = instructor.instructorName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        instructor.instructorId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
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

  const handleTestDB = async () => {
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      if (data.success) {
        alert(`Database connection successful!\nInstructors: ${data.counts.instructors}\nDepartments: ${data.counts.departments}\nAttendance: ${data.counts.attendance}`);
      } else {
        alert(`Database test failed: ${data.details}`);
      }
    } catch (err) {
      alert(`Database test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Loading skeleton
  if (loading && instructors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0">
        <div className="container mx-auto p-6 space-y-6">
          <AttendanceHeader
            title="Instructor Attendance Management"
            subtitle="Monitor and manage instructor attendance records with real-time insights and comprehensive analytics"
            currentSection="Instructors"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0">
        <div className="container mx-auto p-6 space-y-6">
          <AttendanceHeader
            title="Instructor Attendance Management"
            subtitle="Monitor and manage instructor attendance records with real-time insights and comprehensive analytics"
            currentSection="Instructors"
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0">
      <div className="container mx-auto p-6 space-y-6">
        {/* Blue Gradient Header */}
        <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-6 py-6 rounded-t-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Instructor Attendance Report</h3>
                <p className="text-blue-100 text-sm">Search, filter and manage instructor attendance records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Header Card */}
        <AttendanceHeader
          title="Instructor Attendance Management"
          subtitle="Monitor and manage instructor attendance records with real-time insights and comprehensive analytics"
          currentSection="Instructors"
        />

        {/* Instructor Attendance Management - Main Content */}
        <div className="container mx-auto p-6 space-y-6">
          {/* Analytics and Quick Actions Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Analytics Dashboard */}
            <div className="xl:col-span-3">
              <AttendanceAnalytics instructors={instructors} loading={loading} />
            </div>
            
            {/* Quick Actions Panel */}
            <div className="xl:col-span-1">
            <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden h-fit p-0">
              {/* Quick Actions Header */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Quick Actions</h3>
                      <p className="text-green-100 text-sm">Essential tools and shortcuts</p>
                    </div>
                  </div>
                  
                  {/* Minimize Quick Actions Button */}
                  <button
                    onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all hover:scale-105"
                    title={quickActionsExpanded ? "Minimize quick actions" : "Expand quick actions"}
                  >
                    {quickActionsExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Actions Content */}
              {quickActionsExpanded && (
                <div className="p-6">
                  <div className="space-y-3">
                    {/* Auto Refresh */}
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all duration-300 hover:shadow-md group">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <RefreshCw className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-blue-900">Auto Refresh</div>
                        <div className="text-xs text-blue-600">Toggle live updates</div>
                      </div>
                      <div className="w-12 h-6 bg-blue-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform transform translate-x-6"></div>
                      </div>
                    </button>

                    {/* Export Data */}
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all duration-300 hover:shadow-md group">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-purple-900">Export Data</div>
                        <div className="text-xs text-purple-600">Download reports</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-600" />
                    </button>

                    {/* Send Notifications */}
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl border border-orange-200 transition-all duration-300 hover:shadow-md group">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-orange-900">Send Notifications</div>
                        <div className="text-xs text-orange-600">Alert instructors</div>
                      </div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </button>

                    {/* Generate Reports */}
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl border border-emerald-200 transition-all duration-300 hover:shadow-md group">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-emerald-900">Generate Reports</div>
                        <div className="text-xs text-emerald-600">Custom analytics</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </button>

                    {/* Mark Attendance */}
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 rounded-xl border border-teal-200 transition-all duration-300 hover:shadow-md group">
                      <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-teal-900">Mark Attendance</div>
                        <div className="text-xs text-teal-600">Manual entry</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-600" />
                    </button>

                    {/* System Settings */}
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md group">
                      <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">System Settings</div>
                        <div className="text-xs text-gray-600">Configure attendance</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Quick Stats Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                      Last action: <span className="font-semibold text-gray-700">2 minutes ago</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
          </div>
          
          <div>
            <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden">
              {/* Search and Actions Section */}
              <div className="border-b border-blue-100 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <input
                      type="text"
                      placeholder="Search instructors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    {/* View Mode Toggle */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                          {viewMode === 'list' && <List className="w-4 h-4 mr-2" />}
                          {viewMode === 'grid' && <Grid3X3 className="w-4 h-4 mr-2" />}
                          {viewMode === 'kanban' && <Columns3 className="w-4 h-4 mr-2" />}
                          {viewMode === 'calendar' && <Calendar className="w-4 h-4 mr-2" />}
                          {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setViewMode('list')}>
                          <List className="w-4 h-4 mr-2" />
                          List View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('grid')}>
                          <Grid3X3 className="w-4 h-4 mr-2" />
                          Grid View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('kanban')}>
                          <Columns3 className="w-4 h-4 mr-2" />
                          Kanban View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('calendar')}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Calendar View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <FilterDialog
                      filters={filters}
                      filterSections={filterSections}
                      onApplyFilters={handleApplyFilters}
                      onClearFilters={handleClearFilters}
                    />
                    <Button 
                      onClick={handleRefresh} 
                      variant="outline" 
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button 
                      onClick={handleTestDB}
                      variant="outline" 
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Test DB
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips */}
              {Object.values(filters).some(arr => arr.length > 0) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mx-4">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Active Filters:</span>
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
              <div className="p-6">
                {/* View Mode Content */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
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
                    />
                    
                    {/* Pagination */}
                    <TablePagination
                      page={page}
                      totalItems={filteredInstructors.length}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      pageSizeOptions={[5, 10, 20, 50]}
                    />
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedInstructors.map((instructor) => (
                      <Card 
                        key={instructor.instructorId} 
                        className="border border-blue-200 hover:border-blue-300 transition-all cursor-pointer hover:shadow-lg"
                        onClick={() => handleInstructorClick(instructor)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={instructor.avatarUrl} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{instructor.instructorName}</h3>
                              <p className="text-sm text-gray-500">{instructor.instructorType}</p>
                              <p className="text-sm text-gray-500">{instructor.department}</p>
                            </div>
                            <Badge 
                              variant={instructor.attendanceRate >= 90 ? 'default' : instructor.attendanceRate >= 75 ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {instructor.attendanceRate.toFixed(1)}%
                            </Badge>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Attended Classes:</span>
                              <span className="font-medium">{instructor.attendedClasses}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subjects:</span>
                              <span className="font-medium">{instructor.subjects.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Risk Level:</span>
                              <Badge 
                                variant={instructor.riskLevel === RiskLevel.NONE ? 'default' : 
                                        instructor.riskLevel === RiskLevel.LOW ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {instructor.riskLevel}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Status:</span>
                              <Badge 
                                variant={instructor.status === InstructorStatus.ACTIVE ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {instructor.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {viewMode === 'kanban' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Instructors */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900">Active</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {paginatedInstructors.filter(i => i.status === InstructorStatus.ACTIVE).length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {paginatedInstructors
                          .filter(instructor => instructor.status === InstructorStatus.ACTIVE)
                          .map(instructor => (
                            <Card key={instructor.instructorId} className="p-4 cursor-pointer hover:shadow-md">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={instructor.avatarUrl} />
                                  <AvatarFallback className="text-xs">
                                    {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{instructor.instructorName}</p>
                                  <p className="text-xs text-gray-500">{instructor.department}</p>
                                </div>
                                <Badge className="text-xs">
                                  {instructor.attendanceRate}%
                                </Badge>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>

                    {/* Inactive Instructors */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900">Inactive</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {paginatedInstructors.filter(i => i.status === InstructorStatus.INACTIVE).length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {paginatedInstructors
                          .filter(instructor => instructor.status === InstructorStatus.INACTIVE)
                          .map(instructor => (
                            <Card key={instructor.instructorId} className="p-4 cursor-pointer hover:shadow-md">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={instructor.avatarUrl} />
                                  <AvatarFallback className="text-xs">
                                    {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{instructor.instructorName}</p>
                                  <p className="text-xs text-gray-500">{instructor.department}</p>
                                </div>
                                <Badge className="text-xs">
                                  {instructor.attendanceRate}%
                                </Badge>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>

                    {/* On Leave Instructors */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900">On Leave</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {paginatedInstructors.filter(i => i.status === InstructorStatus.ON_LEAVE).length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {paginatedInstructors
                          .filter(instructor => instructor.status === InstructorStatus.ON_LEAVE)
                          .map(instructor => (
                            <Card key={instructor.instructorId} className="p-4 cursor-pointer hover:shadow-md">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={instructor.avatarUrl} />
                                  <AvatarFallback className="text-xs">
                                    {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{instructor.instructorName}</p>
                                  <p className="text-xs text-gray-500">{instructor.department}</p>
                                </div>
                                <Badge className="text-xs">
                                  {instructor.attendanceRate}%
                                </Badge>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'calendar' && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar View</h3>
                    <p className="text-gray-600">Calendar view for instructor attendance will be implemented here.</p>
                  </div>
                )}

                {/* No Results */}
                {filteredInstructors.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Info className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-blue-900 mb-3">No instructors found</div>
                    <div className="text-blue-600 mb-6 max-w-md mx-auto">
                      Try adjusting your search criteria or filters to find the instructors you're looking for.
                    </div>
                    <Button onClick={handleClearFilters} className="bg-blue-600 hover:bg-blue-700">
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
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
    </div>
  );
}
