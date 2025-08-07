'use client';

// ============================================================================
// STUDENT ATTENDANCE MANAGEMENT PAGE
// ============================================================================
// This is the main page for managing student attendance records, analytics,
// and administrative functions. It provides a comprehensive interface for
// viewing, filtering, analyzing, and managing student attendance data.

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// ============================================================================
// ICON IMPORTS - Lucide React Icons for UI elements
// ============================================================================
import { 
  Users, Mail, Phone, Filter, Search, Download, FileDown, 
  ChevronDown, ChevronUp, MoreHorizontal, Eye, Edit, 
  Trash2, Plus, X, Clock, TrendingUp, TrendingDown, 
  BarChart3, Building, GraduationCap, BookOpen, Target, Home, 
  ChevronRight, AlertTriangle, Info, Zap, 
  RefreshCw, Shield, Calendar as CalendarIcon, Settings,
  FileText, Printer, AlertCircle, User, Hash, Activity,
  Bell, Minimize2, Maximize2, CheckCircle, Send,
  ChevronsLeft, ChevronLeft, ChevronsRight, Users2,
  Building2, Percent, UserCheck, RotateCcw, Minus,
  Grid, FileSpreadsheet, Table, Navigation,
  MousePointer, ZoomIn, Lightbulb, Donut, PieChart as PieChartIcon,
  MapPin,ArrowDown
} from 'lucide-react';

// ============================================================================
// UI COMPONENT IMPORTS - Shadcn/UI components
// ============================================================================
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table as UITable, TableHeader as UITableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

// ============================================================================
// THIRD-PARTY LIBRARY IMPORTS
// ============================================================================
import jsPDF from 'jspdf'; // PDF generation
import html2canvas from 'html2canvas'; // HTML to canvas conversion for PDF
import * as XLSX from 'xlsx'; // Excel file handling
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'; // Virtual scrolling
import AutoSizer from 'react-virtualized-auto-sizer'; // Auto-sizing for virtual lists
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as ReBarChart, Bar, CartesianGrid, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts'; // Charts and graphs
import { aggregateDataByTime, addComparisonData, applyTrendSmoothing } from '@/lib/chartUtils';
// ============================================================================
// CUSTOM HOOKS AND UTILITIES
// ============================================================================
import { useDebounce } from '@/hooks/use-debounce'; // Debounced search functionality
import { toast } from 'sonner'; // Toast notifications

// ============================================================================
// NEW BACKEND ANALYTICS HOOKS
// ============================================================================
import { 
  useTrends, 
  useComparisons, 
  useBreakdown, 
  useRankings, 
  useSubjectAnalytics,
  useRealTimeStats,
  useAnalyticsCache
} from '@/hooks/useAnalytics';

// ============================================================================
// CUSTOM COMPONENT IMPORTS
// ============================================================================
import StudentDetailModal from '@/components/StudentDetailModal';
import ParentNotificationSystem from '@/components/ParentNotificationSystem';
import ReportGenerator from '@/components/ReportGenerator';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { EnhancedNotificationSystem } from '@/components/EnhancedNotificationSystem';
import { RealTimeDashboard } from '@/components/RealTimeDashboard';
import { FilterChips } from '@/components/FilterChips';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { FilterDialog } from '@/components/FilterDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/reusable/Dialogs/SortDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import AttendanceHeader from './components/AttendanceHeader';
import SelectDropdown from '@/components/SelectDropdown';
import { EmptyState } from '@/components/reusable';
import { TablePagination } from '@/components/reusable/Table/TablePagination';


// ============================================================================
// TYPE AND UTILITY IMPORTS
// ============================================================================
import { ICCT_CLASSES, getStatusColor, getAttendanceRateColor } from '@/lib/colors';
import { 
  StudentAttendance, 
  AttendanceStatus, 
  AttendanceType, 
  AttendanceVerification, 
  RiskLevel,
  EnrollmentStatus
} from '@/types/student-attendance';
import { UserGender, StudentType, YearLevel, UserStatus } from '@/types/enums';
import { RecentAttendanceRecord } from '@/types/student-attendance';

// ============================================================================
// TABLE COLUMN CONFIGURATION
// ============================================================================
// Defines the structure and rendering of columns in the student attendance table
// Each column has specific rendering logic, sorting capabilities, and styling
const STUDENT_ATTENDANCE_COLUMNS: TableListColumn<StudentAttendance>[] = [
  // Checkbox column for row selection
  { header: "Select", accessor: "select", className: "w-12 text-center" },
  
  // Student information column with avatar and status indicator
  { 
    header: "Student", 
    accessor: "studentName", 
    className: "text-blue-900 align-middle", 
    sortable: true,
    render: (student: StudentAttendance) => (
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* Student avatar with fallback initials */}
          <Avatar className="h-10 w-10 ring-1 ring-gray-200">
            <AvatarImage src={student.avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
              {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}` || student.studentName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {/* Active status indicator dot */}
          {student.status === 'ACTIVE' && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate flex items-center gap-1">
            <span>{student.studentName}</span>
          </div>
          <div className="text-sm text-gray-600 truncate">{student.studentId}</div>
        </div>
      </div>
    )
  },
  
  // Department column
  { 
    header: "Department", 
    accessor: "department", 
    className: "text-blue-900 text-center align-middle", 
    sortable: true 
  },
  
  // Course column
  { 
    header: "Course", 
    accessor: "course", 
    className: "text-blue-900 text-center align-middle", 
    sortable: true 
  },
  
  // Year level column
  { 
    header: "Year Level", 
    accessor: "yearLevel", 
    className: "text-blue-900 text-center align-middle", 
    sortable: true 
  },
  
  // Attendance rate column with color-coded badges
  { 
    header: "Attendance Rate", 
    accessor: "attendanceRate", 
    className: "text-center align-middle", 
    sortable: true,
    render: (student: StudentAttendance) => {
      // Color coding based on attendance rate thresholds
      const getAttendanceRateColor = (rate: number) => {
        if (rate >= 90) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', hex: '#10b981' };
        if (rate >= 75) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200', hex: '#f59e0b' };
        return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', hex: '#ef4444' };
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
  
  // Student status column with interactive badges
  { 
    header: "Status", 
    accessor: "status", 
    className: "text-center align-middle", 
    render: (student: StudentAttendance) => {
      // Status configuration with colors and labels
      const statusConfig = {
        'ACTIVE': { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
        'INACTIVE': { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Inactive' },
        'TRANSFERRED': { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Transferred' },
        'GRADUATED': { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Graduated' }
      };
      const config = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.INACTIVE;
      
      // TODO: Implement permission-based status editing
      const canEditStatus = true; // Replace with actual permission check
      
      return (
        <div className="flex items-center justify-center">
          <Badge 
            className={`${config.color} ${config.bg} text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from triggering
              // TODO: Implement status editing functionality
              toast.info('Status editing feature coming soon!');
            }}
          >
            {config.label}
          </Badge>
        </div>
      );
    },
    sortable: true
  },
  
  // Actions column (rendered separately for better control)
  { 
    header: "Actions", 
    accessor: "actions", 
    className: "text-center align-middle w-32",
    render: (student: StudentAttendance) => {
      // This will be replaced with the renderActionsColumn function
      return null;
    }
  }
];

// ============================================================================
// TABLE EXPANDER COLUMN CONFIGURATION
// ============================================================================
// Defines the expandable row functionality for the student table
// Shows detailed student information when expanded
const EXPANDER_COLUMN: TableListColumn<StudentAttendance> = {
  header: '',
  accessor: 'expander',
  className: 'w-12 text-center',
  expandedContent: (item: StudentAttendance) => (
    <td colSpan={STUDENT_ATTENDANCE_COLUMNS.length + 1} className="bg-transparent px-0 py-0">
      <div className="flex flex-col md:flex-row gap-8 p-8 bg-white shadow-lg border border-blue-100">
        {/* Profile Section */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center gap-6 mb-4">
            <Avatar className="h-20 w-20 ring-4 ring-blue-200 shadow-md">
              <AvatarImage src={item.avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-2xl">
                {`${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}` || item.studentName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-2xl font-extrabold text-blue-900 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-400" />
                {item.studentName}
              </div>
              <div className="text-base text-blue-700 flex items-center gap-2 mt-1">
                <Hash className="w-5 h-5 text-blue-300" />
                {item.studentId}
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />Contact Information
            </div>
            <div className="text-sm text-blue-900 mb-1"><span className="font-medium">Email:</span> {item.email || 'N/A'}</div>
            <div className="text-sm text-blue-900 mb-1"><span className="font-medium">Phone:</span> {item.phoneNumber || 'N/A'}</div>
            <div className="text-sm text-blue-900"><span className="font-medium">Student Type:</span> {item.studentType || 'N/A'}</div>
          </div>
        </div>
        {/* Divider for desktop */}
        <div className="hidden md:block w-px bg-blue-100 mx-2" />
        {/* Attendance Breakdown Section */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="bg-blue-50 rounded-lg p-4 h-full flex flex-col justify-between">
            <div className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />Attendance Breakdown
            </div>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium text-blue-900">Present Days:</span>
                <span className="text-lg font-bold text-green-700">{item.presentDays ?? 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="font-medium text-blue-900">Absent Days:</span>
                <span className="text-lg font-bold text-red-700">{item.absentDays ?? 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-blue-900">Late Days:</span>
                <span className="text-lg font-bold text-yellow-700">{item.lateDays ?? 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-blue-900">Last Attendance:</span>
                <span className="text-lg font-bold text-blue-900">{item.lastAttendance ? new Date(item.lastAttendance).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </td>
  ),
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Type for sorting student data by different fields
type StudentSortFieldKey = 'studentName' | 'department' | 'course' | 'yearLevel' | 'attendanceRate' | 'status';
type SortOrder = 'asc' | 'desc';

// Comprehensive filter interface for all filterable student attributes
type Filters = {
  // Core Student Demographics
  departments: string[];
  courses: string[];
  yearLevels: string[];
  sections: string[];
  
  // Core Attendance Criteria
  attendanceRates: string[];
  riskLevels: string[];
  
  // Core Student Information
  studentStatuses: string[];
  studentTypes: string[];
  
  // Core Subject Information
  subjects: string[];
  subjectInstructors: string[];
  subjectRooms: string[];
  
  // Core Time Range
  dateRangeStart: string;
  dateRangeEnd: string;
  
  [key: string]: string[] | string;
};

// Interface for predefined filter presets (now imported from GlobalFilter)
interface StudentFilterPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: Partial<Filters>;
}

// Interface for date range filtering
interface DateRange {
  start: string;
  end: string;
}

// Interface for advanced filtering options (moved from main filters)
interface AdvancedFilters {
  // Administrative filters
  verificationStatus: string[];
  attendanceTypes: string[];
  eventTypes: string[];
  semester: string[];
  academicYear: string[];
  
  // Schedule-based filters
  subjectScheduleDays: string[];
  subjectScheduleTimes: string[];
  
  // Time-based filters
  timeOfDay: string[];
  attendanceTrends: string[];
  
  // Enrollment filters
  subjectEnrollments: string[];
  enrollmentStatuses: string[];
  
  // Date range filters
  dateRangeStart: string;
  dateRangeEnd: string;
  
  // Advanced range filters
  attendanceRangeMin: number;
  attendanceRangeMax: number;
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
  onlyRecentEnrollments: boolean;
}

// ============================================================================
// CHART-SPECIFIC FILTER INTERFACES
// ============================================================================
// These interfaces define the structure for chart-specific filtering options
// that allow users to customize individual chart displays and data aggregation

interface ChartSpecificFilters {
  // Time-based filters
  timeGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  comparisonPeriod: 'previous_week' | 'previous_month' | 'same_period_last_year' | 'none';
  trendSmoothing: 'none' | 'moving_average' | 'exponential';
  
  // Chart display filters
  chartType: 'line' | 'bar' | 'area' | 'heatmap' | 'pie' | 'doughnut' | 'horizontal-bar';
  showProjections: boolean;
  showConfidenceIntervals: boolean;
  highlightOutliers: boolean;
  
  // Data filters
  dataAggregation: 'sum' | 'average' | 'median' | 'count';
  colorScheme: 'sequential' | 'diverging' | 'categorical';
  
  // Chart-specific overrides
  departmentOverride?: string[];
  yearLevelOverride?: string[];
  courseOverride?: string[];
}

interface ChartFilterState {
  [chartId: string]: ChartSpecificFilters;
}

// ============================================================================
// INTERACTIVE DRILL-DOWN INTERFACES
// ============================================================================
// Interfaces for managing drill-down state and data exploration

interface DrillDownState {
  isActive: boolean;
  currentLevel: 'overview' | 'department' | 'course' | 'year' | 'student' | 'subject' | 'time';
  breadcrumbs: DrillDownBreadcrumb[];
  selectedData: any;
  drillPath: string[];
  contextData: any;
}

interface DrillDownBreadcrumb {
  level: string;
  label: string;
  data: any;
  timestamp: number;
}

interface DrillDownContext {
  summary: {
    totalRecords: number;
    averageRate: number;
    trend: number;
    comparison: number;
  };
  details: {
    breakdown: any[];
    patterns: any[];
    anomalies: any[];
    recommendations: string[];
  };
  actions: {
    available: string[];
    suggested: string[];
  };
}

// ============================================================================
// CHART FILTER PRESETS
// ============================================================================
// Predefined filter configurations for common chart use cases

const CHART_FILTER_PRESETS: Record<string, ChartSpecificFilters> = {
  default: {
    timeGranularity: 'weekly',
    comparisonPeriod: 'none',
    trendSmoothing: 'none',
    chartType: 'line',
    showProjections: false,
    showConfidenceIntervals: false,
    highlightOutliers: false,
    dataAggregation: 'average',
    colorScheme: 'sequential'
  },
  detailed: {
    timeGranularity: 'daily',
    comparisonPeriod: 'previous_week',
    trendSmoothing: 'moving_average',
    chartType: 'line',
    showProjections: true,
    showConfidenceIntervals: true,
    highlightOutliers: true,
    dataAggregation: 'average',
    colorScheme: 'diverging'
  },
  comparison: {
    timeGranularity: 'monthly',
    comparisonPeriod: 'previous_month',
    trendSmoothing: 'none',
    chartType: 'bar',
    showProjections: false,
    showConfidenceIntervals: false,
    highlightOutliers: false,
    dataAggregation: 'average',
    colorScheme: 'categorical'
  },
  trend: {
    timeGranularity: 'weekly',
    comparisonPeriod: 'same_period_last_year',
    trendSmoothing: 'exponential',
    chartType: 'line',
    showProjections: true,
    showConfidenceIntervals: true,
    highlightOutliers: true,
    dataAggregation: 'average',
    colorScheme: 'sequential'
  }
};

// ============================================================================
// CHART FILTER COMPONENTS
// ============================================================================
// Reusable components for chart-specific filtering controls

const TimeGranularitySelector = ({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-24 h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="hourly">Hourly</SelectItem>
      <SelectItem value="daily">Daily</SelectItem>
      <SelectItem value="weekly">Weekly</SelectItem>
      <SelectItem value="monthly">Monthly</SelectItem>
    </SelectContent>
  </Select>
);

const ChartTypeSelector = ({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex gap-1 bg-white rounded border p-1">
    <Button
      variant={value === 'line' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onChange('line')}
      className="h-6 w-6 p-0"
    >
      <TrendingUp className="w-3 h-3" />
    </Button>
    <Button
      variant={value === 'bar' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onChange('bar')}
      className="h-6 w-6 p-0"
    >
      <BarChart3 className="w-3 h-3" />
    </Button>
    <Button
      variant={value === 'area' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onChange('area')}
      className="h-6 w-6 p-0"
    >
      <Activity className="w-3 h-3" />
    </Button>
    <Button
      variant={value === 'pie' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onChange('pie')}
      className="h-6 w-6 p-0"
    >
      <PieChartIcon className="w-3 h-3" />
    </Button>
    <Button
      variant={value === 'doughnut' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onChange('doughnut')}
      className="h-6 w-6 p-0"
    >
      <Donut className="w-3 h-3" />
    </Button>
    <Button
      variant={value === 'horizontal-bar' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onChange('horizontal-bar')}
      className="h-6 w-6 p-0"
    >
      <BarChart3 className="w-3 h-3" />
    </Button>
  </div>
);

const ComparisonPeriodSelector = ({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-32 h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No Comparison</SelectItem>
      <SelectItem value="previous_week">Previous Week</SelectItem>
      <SelectItem value="previous_month">Previous Month</SelectItem>
      <SelectItem value="same_period_last_year">Last Year</SelectItem>
    </SelectContent>
  </Select>
);

const TrendSmoothingSelector = ({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-28 h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No Smoothing</SelectItem>
      <SelectItem value="moving_average">Moving Avg</SelectItem>
      <SelectItem value="exponential">Exponential</SelectItem>
    </SelectContent>
  </Select>
);

const ChartFilterBar = ({ 
  chartId, 
  filters, 
  onFilterChange, 
  chartType = 'line' 
}: {
  chartId: string;
  filters: ChartSpecificFilters;
  onFilterChange: (chartId: string, filters: ChartSpecificFilters) => void;
  chartType?: string;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <TimeGranularitySelector 
        value={filters.timeGranularity}
        onChange={(value) => onFilterChange(chartId, { ...filters, timeGranularity: value as any })}
      />
      <ChartTypeSelector 
        value={filters.chartType}
        onChange={(value) => onFilterChange(chartId, { ...filters, chartType: value as any })}
      />
      <ComparisonPeriodSelector 
        value={filters.comparisonPeriod}
        onChange={(value) => onFilterChange(chartId, { ...filters, comparisonPeriod: value as any })}
      />
      <TrendSmoothingSelector 
        value={filters.trendSmoothing}
        onChange={(value) => onFilterChange(chartId, { ...filters, trendSmoothing: value as any })}
      />
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(chartId, { ...filters, showProjections: !filters.showProjections })}
          className={`h-6 px-2 text-xs ${filters.showProjections ? 'bg-blue-100 text-blue-700' : ''}`}
        >
          <Target className="w-3 h-3 mr-1" />
          Projections
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(chartId, { ...filters, highlightOutliers: !filters.highlightOutliers })}
          className={`h-6 px-2 text-xs ${filters.highlightOutliers ? 'bg-red-100 text-red-700' : ''}`}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Outliers
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// CHART LOADING AND ERROR COMPONENTS
// ============================================================================
// Components to handle loading states and errors in charts

const ChartLoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-32 bg-gray-200 rounded mb-2"></div>
    <div className="flex justify-between">
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

const ChartErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-32 text-center">
    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
    <p className="text-sm text-gray-600 mb-2">{error}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="w-3 h-3 mr-1" />
      Retry
    </Button>
  </div>
);

const ChartEmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-32 text-center">
    <BarChart3 className="w-8 h-8 text-gray-400 mb-2" />
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

// ============================================================================
// ENHANCED CHART CARD COMPONENT
// ============================================================================
// A wrapper component that adds chart-specific filtering capabilities to chart cards

const EnhancedChartCard = ({ 
  title, 
  icon: Icon, 
  chartId, 
  children, 
  chartFilters, 
  onChartFilterChange,
  showFilters = true,
  loading = false,
  error = null,
  onRetry
}: {
  title: string;
  icon: any;
  chartId: string;
  children: React.ReactNode;
  chartFilters: ChartSpecificFilters;
  onChartFilterChange: (chartId: string, filters: ChartSpecificFilters) => void;
  showFilters?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) => {
  const [showChartFilters, setShowChartFilters] = useState(false);

  return (
    <Card className="border border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChartFilters(!showChartFilters)}
                className="h-8 px-2 text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                Filters
              </Button>
            )}
            {/* Chart Actions - will be defined later */}
          </div>
        </div>
        {showChartFilters && showFilters && (
          <div className="mt-3">
            <ChartFilterBar
              chartId={chartId}
              filters={chartFilters}
              onFilterChange={onChartFilterChange}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartLoadingSkeleton />
        ) : error ? (
          <ChartErrorState error={error} onRetry={onRetry || (() => {})} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Dashboard Data - Using real subject-based attendance data
const generateSubjectBasedTrends = (students: StudentAttendance[], timeRange: 'today' | 'week' | 'month' = 'today') => {
  if (!students || students.length === 0) {
    // Fallback to deterministic pattern if no data
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      present: 30 + (i % 3) * 5,
      late: 3 + (i % 2) * 2,
      absent: 5 + (i % 4) * 3
    }));
  }

  // Extract all subjects from students
  const allSubjects = students.flatMap(student => student.subjects || []);
  const uniqueSubjects = allSubjects.filter((subject, index, self) => 
    index === self.findIndex(s => s.subjectCode === subject.subjectCode)
  );

  // Calculate subject-based attendance patterns
  const totalSubjectSessions = uniqueSubjects.length * (timeRange === 'today' ? 1 : timeRange === 'week' ? 5 : 20);
  const avgPresentRate = students.reduce((sum, s) => sum + (s.presentDays || 0), 0) / 
                        students.reduce((sum, s) => sum + (s.totalDays || 1), 0);

  // Generate realistic hourly patterns based on school schedule
  return Array.from({ length: 24 }).map((_, i) => {
    // School hours are typically 8 AM to 5 PM (hours 8-17)
    const isSchoolHour = i >= 8 && i <= 17;
    const isPeakHour = i >= 9 && i <= 15; // Peak attendance hours
    
    // Base values with realistic patterns
    let presentBase = isSchoolHour ? avgPresentRate * totalSubjectSessions : 0;
    let lateBase = isSchoolHour ? (1 - avgPresentRate) * totalSubjectSessions * 0.6 : 0;
    let absentBase = isSchoolHour ? (1 - avgPresentRate) * totalSubjectSessions * 0.4 : 0;

    // Add realistic variations
    if (isPeakHour) {
      presentBase *= 1.2; // Higher attendance during peak hours
      lateBase *= 0.8;    // Fewer late arrivals during peak
    } else if (isSchoolHour) {
      presentBase *= 0.9; // Slightly lower during non-peak school hours
      lateBase *= 1.1;    // More late arrivals during non-peak
    }

    // Add some natural variation based on hour
    const hourVariation = Math.sin(i / 24 * Math.PI) * 0.1 + 1;
    presentBase *= hourVariation;
    lateBase *= hourVariation;
    absentBase *= hourVariation;

    return {
      hour: i,
      present: Math.round(Math.max(0, presentBase + (Math.random() - 0.5) * 5)),
      late: Math.round(Math.max(0, lateBase + (Math.random() - 0.5) * 2)),
      absent: Math.round(Math.max(0, absentBase + (Math.random() - 0.5) * 2))
    };
  });
};

const generateSubjectDailyTrends = (students: StudentAttendance[], timeRange: 'today' | 'week' | 'month' = 'today') => {
  if (!students || students.length === 0) {
    return Array.from({ length: 7 }).map((_, i) => ({
      day: i,
      present: 80 + (i % 3) * 5,
      late: 10 + (i % 2) * 3,
      absent: 10 + (i % 4) * 2
    }));
  }

  // Get all subjects and their schedules
  const allSubjects = students.flatMap(student => student.subjects || []);
  const subjectSchedules = allSubjects.reduce((acc, subject) => {
    const dayKey = subject.schedule?.dayOfWeek?.toLowerCase() || 'monday';
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(subject);
    return acc;
  }, {} as Record<string, any[]>);

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const avgPresentRate = students.reduce((sum, s) => sum + (s.presentDays || 0), 0) / 
                        students.reduce((sum, s) => sum + (s.totalDays || 1), 0);

  return dayNames.map((day, i) => {
    const isWeekend = i === 5 || i === 6; // Saturday, Sunday
    const isFriday = i === 4;
    const subjectsOnDay = subjectSchedules[day] || [];
    
    let presentBase = avgPresentRate * subjectsOnDay.length;
    let lateBase = (1 - avgPresentRate) * subjectsOnDay.length * 0.6;
    let absentBase = (1 - avgPresentRate) * subjectsOnDay.length * 0.4;

    // Apply day-specific patterns
    if (isWeekend) {
      presentBase *= 0.1; // Very low attendance on weekends
      lateBase *= 0.1;
      absentBase *= 0.1;
    } else if (isFriday) {
      presentBase *= 0.9; // Slightly lower on Fridays
      lateBase *= 1.1;
      absentBase *= 1.1;
    }

    return {
      day: i,
      present: Math.round(Math.max(0, presentBase + (Math.random() - 0.5) * 10)),
      late: Math.round(Math.max(0, lateBase + (Math.random() - 0.5) * 5)),
      absent: Math.round(Math.max(0, absentBase + (Math.random() - 0.5) * 5))
    };
  });
};

const generateSubjectWeeklyTrends = (students: StudentAttendance[], timeRange: 'today' | 'week' | 'month' = 'today') => {
  if (!students || students.length === 0) {
    return Array.from({ length: 4 }).map((_, i) => ({
      week: i,
      present: 85 + (i % 2) * 3,
      late: 10 + (i % 3) * 2,
      absent: 5 + (i % 2) * 3
    }));
  }

  const totalSubjects = students.reduce((sum, s) => sum + (s.subjects?.length || 0), 0);
  const avgPresentRate = students.reduce((sum, s) => sum + (s.presentDays || 0), 0) / 
                        students.reduce((sum, s) => sum + (s.totalDays || 1), 0);

  // Generate weekly patterns with slight improvement trend
  return Array.from({ length: 4 }).map((_, i) => {
    const weekFactor = 1 + (i * 0.02); // Slight improvement over weeks
    const presentBase = avgPresentRate * totalSubjects * weekFactor;
    const lateBase = (1 - avgPresentRate) * totalSubjects * 0.6 * weekFactor;
    const absentBase = (1 - avgPresentRate) * totalSubjects * 0.4 * weekFactor;

    return {
      week: i,
      present: Math.round(Math.max(0, presentBase + (Math.random() - 0.5) * 15)),
      late: Math.round(Math.max(0, lateBase + (Math.random() - 0.5) * 8)),
      absent: Math.round(Math.max(0, absentBase + (Math.random() - 0.5) * 8))
    };
  });
};

// Function to get appropriate trend data based on time range
const getTrendData = (students: StudentAttendance[], timeRange: 'today' | 'week' | 'month', dataType: 'hourly' | 'daily' | 'weekly') => {
  switch (dataType) {
    case 'hourly':
      return generateSubjectBasedTrends(students, timeRange);
    case 'daily':
      return generateSubjectDailyTrends(students, timeRange);
    case 'weekly':
      return generateSubjectWeeklyTrends(students, timeRange);
    default:
      return generateSubjectBasedTrends(students, timeRange);
  }
};

// Enhanced function to get subject-based attendance data using real API data
const getSubjectBasedAttendanceData = (students: StudentAttendance[], attendanceType: 'present' | 'late' | 'absent', timeRange: 'today' | 'week' | 'month') => {
  if (!students || students.length === 0) {
    console.log(`No students data for ${attendanceType} calculation`);
    return { count: 0, percentage: 0 };
  }

  // Count students who have the selected attendance type in the time range
  let studentCount = 0;
  const now = new Date();

  if (timeRange === 'today') {
    // For today, check if student has any attendance records for today
    const today = now.toISOString().split('T')[0];
    studentCount = students.filter(student => {
      const hasTodayRecord = student.recentAttendanceRecords?.some(record => 
        record.timestamp.startsWith(today)
      );
      
      if (hasTodayRecord) {
        const todaysRecord = student.recentAttendanceRecords?.find(record => record.timestamp.startsWith(today));
        return todaysRecord?.status === attendanceType.toUpperCase();
      }
      return false;
    }).length;
  } else if (timeRange === 'week') {
    // For week, check if student has any attendance records in the current week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    studentCount = students.filter(student => {
      const weekRecords = student.recentAttendanceRecords?.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      }) || [];
      
      return weekRecords.some(record => record.status === attendanceType.toUpperCase());
    }).length;
  } else if (timeRange === 'month') {
    // For month, check if student has any attendance records in the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    studentCount = students.filter(student => {
      const monthRecords = student.recentAttendanceRecords?.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= startOfMonth && recordDate <= endOfMonth;
      }) || [];
      
      return monthRecords.some(record => record.status === attendanceType.toUpperCase());
    }).length;
  }

  // Calculate percentage based on total students
  const totalStudents = students.length;
  const percentage = totalStudents > 0 ? Math.round((studentCount / totalStudents) * 100) : 0;

  return { 
    count: studentCount, 
    percentage: percentage 
  };
};

// Legacy hourlyTrends for backward compatibility (will be replaced in usage)
const hourlyTrends = Array.from({ length: 24 }).map((_, i) => ({
  hour: i,
  present: 30 + (i % 3) * 5,
  late: 3 + (i % 2) * 2,
  absent: 5 + (i % 4) * 3
}));

// recentActivity array removed - it was not used in the rendered JSX

// Department breakdown now uses backend analytics via useComparisons hook

const attendanceTrendsData = Array.from({ length: 14 }).map((_, i) => ({
  date: `${i + 1 < 10 ? '0' : ''}${i + 1} Jun`,
  rate: 85 + Math.round(Math.sin(i / 2) * 10 + (i % 3) * 2), // Deterministic pattern
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

// FilterDropdown Component with checkboxes and count badges
const FilterDropdown = ({
  title,
  icon: Icon,
  options,
  selectedValues,
  onSelectionChange,
  getCount,
  isOpen,
  onToggle
}: {
  title: string;
  icon: any;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  getCount: (option: string) => number;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, option]);
    } else {
      onSelectionChange(selectedValues.filter(v => v !== option));
    }
  };

  const selectedCount = selectedValues.length;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all border rounded ${
          selectedCount > 0 || isOpen
            ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        } min-w-0 whitespace-nowrap`}
      >
        <Icon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate max-w-[50px]">{title}</span>
        {selectedCount > 0 && (
          <span className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded-full min-w-[14px] h-3.5 flex items-center justify-center">
            {selectedCount}
          </span>
        )}
        <ChevronDown className={`w-2.5 h-2.5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
              {selectedCount > 0 && (
                <button
                  onClick={() => onSelectionChange([])}
                  className="text-xs text-blue-600 rounded-xl hover:text-blue-800 font-medium hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {options.map(option => {
                const count = getCount(option);
                const isSelected = selectedValues.includes(option);
                
                return (
                  <div
                    key={option}
                    className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => handleCheckboxChange(option, !isSelected)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="text-sm text-gray-900">{option}</span>
                    </div>
                    <Badge 
                      variant={isSelected ? "default" : "secondary"} 
                      className={`text-xs px-1.5 py-0.5 ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

// Components

// Ultra Compact Filter Bar Component
const CompactFilterBar = ({
  filters,
  setFilters,
  departments,
  yearLevels,
  attendanceRates,
  getFilterCount,
  filterPresets,
  applyFilterPreset,
  isPresetActive,
  onAdvancedFilter,
  totalActiveFilters
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  departments: string[];
  yearLevels: string[];
  attendanceRates: string[];
  getFilterCount: (filterType: string, option: string) => number;
  filterPresets: StudentFilterPreset[];
  applyFilterPreset: (preset: StudentFilterPreset) => void;
  isPresetActive: (preset: StudentFilterPreset) => boolean;
  onAdvancedFilter: () => void;
  totalActiveFilters: number;
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Compact filter dropdown with just icon and count
  const CompactFilter = ({ title, icon: Icon, options, selectedValues, onSelectionChange, getCount, isOpen, onToggle }: any) => (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium transition-all border rounded-md ${
          selectedValues.length > 0 || isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
        }`}
        title={title}
      >
        <Icon className="w-3.5 h-3.5" />
        {selectedValues.length > 0 && (
          <span className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
              {selectedValues.length > 0 && (
                <button
                  onClick={() => onSelectionChange([])}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          <ScrollArea className="max-h-60">
            <div className="p-1">
              {options.map((option: string) => {
                const count = getCount(option);
                const isSelected = selectedValues.includes(option);
                
                return (
                  <div
                    key={option}
                    className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => {
                      const newValues = isSelected 
                        ? selectedValues.filter((v: string) => v !== option)
                        : [...selectedValues, option];
                      onSelectionChange(newValues);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={isSelected}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="text-sm text-gray-900">{option}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap bg-gray-50 p-3 rounded-xl border border-gray-200">
      {/* Quick Preset Pills - More Compact */}
      <div className="flex items-center gap-1">
        {filterPresets.slice(0, 3).map(preset => {
          const Icon = preset.icon;
          const isActive = isPresetActive(preset);
          return (
            <button
              key={preset.id}
              onClick={() => applyFilterPreset(preset)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={preset.description}
            >
              <Icon className="w-3.5 h-3.5" />
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
            </button>
          );
        })}
      </div>

      <div className="w-px h-4 bg-gray-300"></div>

      {/* Compact Filter Dropdowns */}
      <CompactFilter
        title="Department"
        icon={Building}
        options={departments.slice(0, 5)}
        selectedValues={filters.departments}
        onSelectionChange={(values: string[]) => setFilters({ ...filters, departments: values })}
        getCount={(option: string) => getFilterCount('departments', option)}
        isOpen={openDropdown === 'departments'}
        onToggle={() => setOpenDropdown(openDropdown === 'departments' ? null : 'departments')}
      />

      <CompactFilter
        title="Year Level"
        icon={GraduationCap}
        options={yearLevels}
        selectedValues={filters.yearLevels}
        onSelectionChange={(values: string[]) => setFilters({ ...filters, yearLevels: values })}
        getCount={(option: string) => getFilterCount('yearLevels', option)}
        isOpen={openDropdown === 'yearLevels'}
        onToggle={() => setOpenDropdown(openDropdown === 'yearLevels' ? null : 'yearLevels')}
      />

      <CompactFilter
        title="Attendance"
        icon={BarChart3}
        options={attendanceRates}
        selectedValues={filters.attendanceRates}
        onSelectionChange={(values: string[]) => setFilters({ ...filters, attendanceRates: values })}
        getCount={(option: string) => getFilterCount('attendanceRates', option)}
        isOpen={openDropdown === 'attendanceRates'}
        onToggle={() => setOpenDropdown(openDropdown === 'attendanceRates' ? null : 'attendanceRates')}
      />

      {/* Date Range Filter */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'dateRange' ? null : 'dateRange')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl transition-all ${
            filters.dateRangeStart || filters.dateRangeEnd || openDropdown === 'dateRange'
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Date Range"
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Date Range</span>
          {(filters.dateRangeStart || filters.dateRangeEnd) && (
            <Badge variant="secondary" className="ml-1">
              {filters.dateRangeStart && filters.dateRangeEnd
                ? `${new Date(filters.dateRangeStart).toLocaleDateString()} - ${new Date(filters.dateRangeEnd).toLocaleDateString()}`
                : filters.dateRangeStart
                ? `From ${new Date(filters.dateRangeStart).toLocaleDateString()}`
                : `Until ${new Date(filters.dateRangeEnd).toLocaleDateString()}`}
            </Badge>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'dateRange' ? 'rotate-180' : ''}`} />
        </button>

        {openDropdown === 'dateRange' && (
          <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 text-sm">Date Range</h3>
                {(filters.dateRangeStart || filters.dateRangeEnd) && (
                  <button
                    onClick={() => {
                      setFilters({ ...filters, dateRangeStart: '', dateRangeEnd: '' });
                      setOpenDropdown(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Start Date</label>
                  <div className="rounded-md border">
                    <Calendar
                      mode="single"
                      selected={filters.dateRangeStart ? new Date(filters.dateRangeStart) : undefined}
                      onSelect={(date: Date | undefined) => {
                        const newStart = date ? date.toISOString().split('T')[0] : '';
                        const currentEnd = filters.dateRangeEnd;
                        
                        // If end date exists and is before new start date, clear it
                        if (currentEnd && new Date(currentEnd) < new Date(newStart)) {
                          setFilters({ ...filters, dateRangeStart: newStart, dateRangeEnd: '' });
                        } else {
                          setFilters({ ...filters, dateRangeStart: newStart });
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">End Date</label>
                  <div className="rounded-md border">
                    <Calendar
                      mode="single"
                      selected={filters.dateRangeEnd ? new Date(filters.dateRangeEnd) : undefined}
                      onSelect={(date: Date | undefined) => {
                        setFilters({ ...filters, dateRangeEnd: date ? date.toISOString().split('T')[0] : '' });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1"></div>

      {/* More Filters - Compact */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
      <button
        onClick={onAdvancedFilter}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
          totalActiveFilters > 3
            ? 'bg-orange-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
              <MoreHorizontal className="w-3.5 h-3.5" />
        {totalActiveFilters > 3 && (
          <span className="bg-white/20 text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
            +{totalActiveFilters - 3}
          </span>
        )}
      </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View More</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// ============================================================================
// SIMPLIFIED FILTER BAR COMPONENT
// ============================================================================
// A clean, organized filter interface showing only core filters

const SimplifiedFilterBar = ({
  filters,
  setFilters,
  filterOptions,
  getFilterCount,
  filterPresets,
  applyFilterPreset,
  isPresetActive,
  onAdvancedFilter,
  totalActiveFilters
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filterOptions: {
    departments: string[];
    courses: string[];
    yearLevels: string[];
    sections: string[];
    attendanceRates: string[];
    riskLevels: string[];
    studentStatuses: string[];
    studentTypes: string[];
    subjects: string[];
    subjectInstructors: string[];
    subjectRooms: string[];
  };
  getFilterCount: (filterType: string, option: string) => number;
  filterPresets: StudentFilterPreset[];
  applyFilterPreset: (preset: StudentFilterPreset) => void;
  isPresetActive: (preset: StudentFilterPreset) => boolean;
  onAdvancedFilter: () => void;
  totalActiveFilters: number;
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = useCallback((dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  }, [openDropdown]);

  const handleFilterChange = useCallback((filterType: keyof Filters, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      departments: [],
      courses: [],
      yearLevels: [],
      sections: [],
      attendanceRates: [],
      riskLevels: [],
      studentStatuses: [],
      studentTypes: [],
      subjects: [],
      subjectInstructors: [],
      subjectRooms: [],
      dateRangeStart: '',
      dateRangeEnd: '',
    });
  }, [setFilters]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {totalActiveFilters} active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAdvancedFilter}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </TooltipTrigger>
              <TooltipContent>Advanced filtering options</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {totalActiveFilters > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all active filters</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Filter Presets */}
      {filterPresets.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Quick Filters:</div>
          <div className="flex flex-wrap gap-2">
            {filterPresets.map((preset) => (
              <Button
                key={preset.id}
                variant={isPresetActive(preset) ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilterPreset(preset)}
                className={`text-xs ${
                  isPresetActive(preset) 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <preset.icon className="w-3 h-3 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Core Filter Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Student Demographics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Demographics
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Department"
              icon={Building}
              options={filterOptions.departments}
              selectedValues={filters.departments}
              onSelectionChange={(values) => handleFilterChange('departments', values)}
              getCount={(option) => getFilterCount('departments', option)}
              isOpen={openDropdown === 'departments'}
              onToggle={() => handleDropdownToggle('departments')}
            />
            <FilterDropdown
              title="Course"
              icon={GraduationCap}
              options={filterOptions.courses}
              selectedValues={filters.courses}
              onSelectionChange={(values) => handleFilterChange('courses', values)}
              getCount={(option) => getFilterCount('courses', option)}
              isOpen={openDropdown === 'courses'}
              onToggle={() => handleDropdownToggle('courses')}
            />
            <FilterDropdown
              title="Year Level"
              icon={Calendar}
              options={filterOptions.yearLevels}
              selectedValues={filters.yearLevels}
              onSelectionChange={(values) => handleFilterChange('yearLevels', values)}
              getCount={(option) => getFilterCount('yearLevels', option)}
              isOpen={openDropdown === 'yearLevels'}
              onToggle={() => handleDropdownToggle('yearLevels')}
            />
            <FilterDropdown
              title="Section"
              icon={Users}
              options={filterOptions.sections}
              selectedValues={filters.sections}
              onSelectionChange={(values) => handleFilterChange('sections', values)}
              getCount={(option) => getFilterCount('sections', option)}
              isOpen={openDropdown === 'sections'}
              onToggle={() => handleDropdownToggle('sections')}
            />
          </div>
        </div>

        {/* Attendance Criteria */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Attendance Criteria
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Attendance Rate"
              icon={Target}
              options={filterOptions.attendanceRates}
              selectedValues={filters.attendanceRates}
              onSelectionChange={(values) => handleFilterChange('attendanceRates', values)}
              getCount={(option) => getFilterCount('attendanceRates', option)}
              isOpen={openDropdown === 'attendanceRates'}
              onToggle={() => handleDropdownToggle('attendanceRates')}
            />
            <FilterDropdown
              title="Risk Level"
              icon={AlertTriangle}
              options={filterOptions.riskLevels}
              selectedValues={filters.riskLevels}
              onSelectionChange={(values) => handleFilterChange('riskLevels', values)}
              getCount={(option) => getFilterCount('riskLevels', option)}
              isOpen={openDropdown === 'riskLevels'}
              onToggle={() => handleDropdownToggle('riskLevels')}
            />
          </div>
        </div>

        {/* Student Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4" />
            Student Information
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Student Status"
              icon={UserCheck}
              options={filterOptions.studentStatuses}
              selectedValues={filters.studentStatuses}
              onSelectionChange={(values) => handleFilterChange('studentStatuses', values)}
              getCount={(option) => getFilterCount('studentStatuses', option)}
              isOpen={openDropdown === 'studentStatuses'}
              onToggle={() => handleDropdownToggle('studentStatuses')}
            />
            <FilterDropdown
              title="Student Type"
              icon={UserCheck}
              options={filterOptions.studentTypes}
              selectedValues={filters.studentTypes}
              onSelectionChange={(values) => handleFilterChange('studentTypes', values)}
              getCount={(option) => getFilterCount('studentTypes', option)}
              isOpen={openDropdown === 'studentTypes'}
              onToggle={() => handleDropdownToggle('studentTypes')}
            />
          </div>
        </div>

        {/* Subject Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Subject Information
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Subject"
              icon={BookOpen}
              options={filterOptions.subjects}
              selectedValues={filters.subjects}
              onSelectionChange={(values) => handleFilterChange('subjects', values)}
              getCount={(option) => getFilterCount('subjects', option)}
              isOpen={openDropdown === 'subjects'}
              onToggle={() => handleDropdownToggle('subjects')}
            />
            <FilterDropdown
              title="Instructor"
              icon={User}
              options={filterOptions.subjectInstructors}
              selectedValues={filters.subjectInstructors}
              onSelectionChange={(values) => handleFilterChange('subjectInstructors', values)}
              getCount={(option) => getFilterCount('subjectInstructors', option)}
              isOpen={openDropdown === 'subjectInstructors'}
              onToggle={() => handleDropdownToggle('subjectInstructors')}
            />
            <FilterDropdown
              title="Room"
              icon={MapPin}
              options={filterOptions.subjectRooms}
              selectedValues={filters.subjectRooms}
              onSelectionChange={(values) => handleFilterChange('subjectRooms', values)}
              getCount={(option) => getFilterCount('subjectRooms', option)}
              isOpen={openDropdown === 'subjectRooms'}
              onToggle={() => handleDropdownToggle('subjectRooms')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced Filter Dropdown Component
const AdvancedFilterDropdown = ({
  filters,
  setFilters,
  advancedFilters,
  setAdvancedFilters,
  departments,
  courses,
  yearLevels,
  riskLevels,
  studentStatuses,
  studentTypes,
  sections,
  getFilterCount,
  filterPresets,
  applyFilterPreset,
  isPresetActive,
  handleClearFilters
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  departments: string[];
  courses: string[];
  yearLevels: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  sections: string[];
  getFilterCount: (filterType: string, option: string) => number;
  filterPresets: StudentFilterPreset[];
  applyFilterPreset: (preset: StudentFilterPreset) => void;
  isPresetActive: (preset: StudentFilterPreset) => boolean;
  handleClearFilters: () => void;
}) => {
  const totalActiveFilters = Object.values(filters).reduce((sum, filterArray) => sum + filterArray.length, 0);
  const [showQuickFilters, setShowQuickFilters] = useState(true);
  const [showAttendanceFilters, setShowAttendanceFilters] = useState(true);
  const [showRangeFilters, setShowRangeFilters] = useState(true);
  return (
    <div className="space-y-8">
      {/* Quick Filters Section (collapsible) */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4">
        <button
          type="button"
          className="flex items-center gap-2 mb-3 w-full"
          onClick={() => setShowQuickFilters((prev) => !prev)}
        >
          <h4 className="text-xs font-semibold text-blue-900 flex-1 text-left">Quick Filters</h4>
          <span>{showQuickFilters ? '▲' : '▼'}</span>
        </button>
        {showQuickFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Department Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Department</label>
              <SelectDropdown
                value={filters.departments[0] || "all"}
                onValueChange={(value) => setFilters({ ...filters, departments: value === "all" ? [] : [value] })}
                options={[
                  { value: "all", label: "All Departments" },
                  ...departments.map((dept) => ({ value: dept, label: dept })),
                ]}
                placeholder="All Departments"
              />
            </div>
            {/* Attendance Rate Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Attendance Rate</label>
              <SelectDropdown
                value={filters.attendanceRates[0] || "all"}
                onValueChange={(value) => setFilters({ ...filters, attendanceRates: value === "all" ? [] : [value] })}
                options={[
                  { value: "all", label: "All Rates" },
                  { value: "High (≥90%)", label: "High (≥90%)" },
                  { value: "Medium (75-89%)", label: "Medium (75-89%)" },
                  { value: "Low (<75%)", label: "Low (<75%)" },
                ]}
                placeholder="All Rates"
              />
            </div>
            {/* Year Level Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Year Level</label>
              <SelectDropdown
                value={filters.yearLevels[0] || "all-levels"}
                onValueChange={(value) => setFilters({ ...filters, yearLevels: value === "all-levels" ? [] : [value] })}
                options={[
                  { value: "all-levels", label: "All Levels" },
                  ...yearLevels.map((level) => ({ value: level, label: level })),
                ]}
                placeholder="All Levels"
              />
            </div>
            {/* Risk Level Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Risk Level</label>
              <SelectDropdown
                value={filters.riskLevels[0] || "all-risk"}
                onValueChange={(value) => setFilters({ ...filters, riskLevels: value === "all-risk" ? [] : [value] })}
                options={[
                  { value: "all-risk", label: "All Risk Levels" },
                  ...riskLevels.map((risk) => ({ value: risk, label: risk })),
                ]}
                placeholder="All Risk Levels"
              />
            </div>
            {/* Course Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Course</label>
              <SelectDropdown
                value={filters.courses[0] || "all-courses"}
                onValueChange={(value) => setFilters({ ...filters, courses: value === "all-courses" ? [] : [value] })}
                options={[
                  { value: "all-courses", label: "All Courses" },
                  ...courses.map((course) => ({ value: course, label: course })),
                ]}
                placeholder="All Courses"
              />
            </div>
            {/* Section Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Section</label>
              <SelectDropdown
                value={filters.sections[0] || "all-sections"}
                onValueChange={(value) => setFilters({ ...filters, sections: value === "all-sections" ? [] : [value] })}
                options={[
                  { value: "all-sections", label: "All Sections" },
                  ...sections.map((section) => ({ value: section, label: section })),
                ]}
                placeholder="All Sections"
              />
            </div>
          </div>
        )}
      </div>
      <div className="border-b border-blue-200 my-2"></div>
  
      {/* Attendance & Verification Filters Section (collapsible) */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4">
        <button
          type="button"
          className="flex items-center gap-2 mb-3 w-full"
          onClick={() => setShowAttendanceFilters((prev) => !prev)}
        >
          <h4 className="text-xs font-semibold text-blue-900 flex-1 text-left">Attendance & Verification Filters</h4>
          <span>{showAttendanceFilters ? '▲' : '▼'}</span>
        </button>
        {showAttendanceFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Verification Status Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Verification Status</label>
              <SelectDropdown
                value={advancedFilters.verificationStatus[0] || "all-status"}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, verificationStatus: value === "all-status" ? [] : [value] })}
                options={[
                  { value: "all-status", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "VERIFIED", label: "Verified" },
                  { value: "DISPUTED", label: "Disputed" },
                  { value: "REJECTED", label: "Rejected" },
                ]}
                placeholder="All Statuses"
              />
            </div>
            {/* Attendance Type Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Attendance Type</label>
              <SelectDropdown
                value={advancedFilters.attendanceTypes[0] || "all-types"}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, attendanceTypes: value === "all-types" ? [] : [value] })}
                options={[
                  { value: "all-types", label: "All Types" },
                  { value: "RFID_SCAN", label: "RFID Scan" },
                  { value: "MANUAL_ENTRY", label: "Manual Entry" },
                  { value: "ONLINE", label: "Online" },
                ]}
                placeholder="All Types"
              />
            </div>
            {/* Event Type Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Event Type</label>
              <SelectDropdown
                value={advancedFilters.eventTypes[0] || "all-events"}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, eventTypes: value === "all-events" ? [] : [value] })}
                options={[
                  { value: "all-events", label: "All Events" },
                  { value: "REGULAR", label: "Regular" },
                  { value: "EVENT", label: "Event" },
                ]}
                placeholder="All Events"
              />
            </div>
            {/* Semester Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Semester</label>
              <SelectDropdown
                value={advancedFilters.semester[0] || "all-semesters"}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, semester: value === "all-semesters" ? [] : [value] })}
                options={[
                  { value: "all-semesters", label: "All Semesters" },
                  { value: "2024-1", label: "2024-1" },
                  { value: "2024-2", label: "2024-2" },
                  { value: "2023-1", label: "2023-1" },
                ]}
                placeholder="All Semesters"
              />
            </div>
            {/* Academic Year Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Academic Year</label>
              <SelectDropdown
                value={advancedFilters.academicYear[0] || "all-years"}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, academicYear: value === "all-years" ? [] : [value] })}
                options={[
                  { value: "all-years", label: "All Years" },
                  { value: "2023-2024", label: "2023-2024" },
                  { value: "2022-2023", label: "2022-2023" },
                  { value: "2021-2022", label: "2021-2022" },
                ]}
                placeholder="All Years"
              />
            </div>
            {/* Student Status Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">Student Status</label>
              <SelectDropdown
                value={filters.studentStatuses[0] || "all-status"}
                onValueChange={(value) => setFilters({ ...filters, studentStatuses: value === "all-status" ? [] : [value] })}
                options={[
                  { value: "all-status", label: "All Status" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
                placeholder="All Status"
              />
            </div>
          </div>
        )}
      </div>
      <div className="border-b border-blue-200 my-2"></div>
  
      {/* Range Filters Section (collapsible) */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4">
        <button
          type="button"
          className="flex items-center gap-2 mb-3 w-full"
          onClick={() => setShowRangeFilters((prev) => !prev)}
        >
          <h4 className="text-xs font-semibold text-blue-900 flex-1 text-left">Range Filters</h4>
          <span>{showRangeFilters ? '▲' : '▼'}</span>
        </button>
        {showRangeFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Attendance Range */}
            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm rounded-xl">
              <label className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">Attendance Range (%)</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancedFilters.attendanceRangeMin}
                    onChange={(e) => setAdvancedFilters(prev => ({...prev, attendanceRangeMin: parseInt(e.target.value) || 0}))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                    placeholder="Min"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">to</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancedFilters.attendanceRangeMax}
                    onChange={(e) => setAdvancedFilters(prev => ({...prev, attendanceRangeMax: parseInt(e.target.value) || 100}))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
            {/* Date Range */}
            <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
              <label className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">Date Range</label>
              <div className="flex flex-row items-end gap-2">
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={advancedFilters.dateRangeStart}
                    onChange={(e) => setAdvancedFilters(prev => ({...prev, dateRangeStart: e.target.value}))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                  />
                </div>
                <span className="text-xs text-gray-500 mb-3">to</span>
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={advancedFilters.dateRangeEnd}
                    onChange={(e) => setAdvancedFilters(prev => ({...prev, dateRangeEnd: e.target.value}))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  
      {/* Action Buttons remain at the bottom */}
      <div className="flex items-center justify-between pt-3 border-t border-blue-100">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAdvancedFilters({
              attendanceRangeMin: 0,
              attendanceRangeMax: 100,
              dateRangeStart: '',
              dateRangeEnd: '',
              lastAttendanceDays: '',
              presentDaysMin: '',
              presentDaysMax: '',
              absentDaysMin: '',
              absentDaysMax: '',
              lateDaysMin: '',
              lateDaysMax: '',
              totalDaysMin: '',
              totalDaysMax: '',
              logicalOperator: 'AND',
              customTextFilter: '',
              excludeInactive: false,
              onlyRecentEnrollments: false,
              verificationStatus: [],
              attendanceTypes: [],
              eventTypes: [],
              semester: [],
              academicYear: [],
              subjectScheduleDays: [],
              subjectScheduleTimes: [],
              timeOfDay: [],
              attendanceTrends: [],
              subjectEnrollments: [],
              enrollmentStatuses: []
            })}
            size="sm"
            className="h-7 px-3 text-xs rounded border-blue-200"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-600 font-medium">
            {Object.values(filters).reduce((sum, filterArray) => sum + filterArray.length, 0) > 0
              ? `${Object.values(filters).reduce((sum, filterArray) => sum + filterArray.length, 0)} filter${Object.values(filters).reduce((sum, filterArray) => sum + filterArray.length, 0) !== 1 ? 's' : ''} active`
              : 'No filters applied'}
          </span>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  departments,
  courses,
  yearLevels,
  riskLevels,
  studentStatuses,
  studentTypes,
  sections,
  getFilterCount,
  recentSearches,
  setRecentSearches,
  handleSearchChange,
  handleClearFilters,
  currentTime,
  mounted,
  advancedFilters,
  setAdvancedFilters,
  showRecentSearches,
  setShowRecentSearches,
  handleSelectRecentSearch,
  clearRecentSearches,
  handleExportCSV,
  handleExportExcel,
  isPresetActive,
  applyFilterPreset,
  filterPresets,
  filteredStudents,
  allStudents,
  showAdvancedFiltersRow,
  setShowAdvancedFiltersRow
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  departments: string[];
  courses: string[];
  yearLevels: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  sections: string[];
  getFilterCount: (filterType: string, option: string) => number;
  recentSearches: string[];
  setRecentSearches: (searches: string[]) => void;
  handleSearchChange: (query: string) => void;
  handleClearFilters: () => void;
  currentTime: string;
  mounted: boolean;
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  showRecentSearches: boolean;
  setShowRecentSearches: (show: boolean) => void;
  handleSelectRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  handleExportCSV: () => void;
  handleExportExcel: () => void;
  isPresetActive: (preset: StudentFilterPreset) => boolean;
  applyFilterPreset: (preset: StudentFilterPreset) => void;
  filterPresets: StudentFilterPreset[];
  filteredStudents: StudentAttendance[];
  allStudents: StudentAttendance[];
  showAdvancedFiltersRow: boolean;
  setShowAdvancedFiltersRow: React.Dispatch<React.SetStateAction<boolean>>;
}) => {


  // Close recent searches when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowRecentSearches]);

  // Calculate total active filters
  const totalActiveFilters = Object.values(filters).reduce((sum, filterArray) => sum + filterArray.length, 0);
  const hasActiveFilters = totalActiveFilters > 0 || searchQuery.trim().length > 0;

  return (
    <div className="relative">

      {/* Blue Gradient Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6]">
        <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Student Attendance Report</h3>
              <p className="text-blue-100 text-sm">Search, filter and manage attendance records</p>
            </div>
          </div>
          
          {/* Status & Clear Options */}
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <div className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-xl px-3 py-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">
                  {totalActiveFilters + (searchQuery.trim() ? 1 : 0)} active filter{(totalActiveFilters + (searchQuery.trim() ? 1 : 0)) !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-blue-100 hover:bg-white/20 hover:text-white border-white/20 rounded-xl transition-all"
              disabled={!hasActiveFilters}
            >
              <RefreshCw className="h-4 w-4" />
              Reset All
            </Button>
            
            {/* Page Actions Dropdown */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-blue-100 hover:bg-white/20 hover:text-white rounded-xl transition-all"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Page Actions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-blue-200 rounded-xl shadow-lg p-2">
                <div className="space-y-1">
                  {/* Import Section */}
                  <div className="px-3 py-2 text-xs font-semibold text-blue-900 uppercase tracking-wider border-b border-blue-100 mb-2">
                    Import
                  </div>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv,.xlsx';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          alert(`Importing students from ${file.name} (functionality to be implemented)`);
                        }
                      };
                      input.click();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors rotate-180" />
                    <span className="group-hover:text-blue-900 transition-colors">Import Students</span>
                  </button>

                  {/* Export Section */}
                  <div className="px-3 py-2 text-xs font-semibold text-blue-900 uppercase tracking-wider border-b border-blue-100 mb-2 mt-4">
                    Export
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-600 mb-1">Current View</div>
                  <button
                    onClick={() => handleExportCSV()}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Export as CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportExcel()}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-green-600 group-hover:text-green-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Export as Excel</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-purple-600 group-hover:text-purple-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Export as PDF</span>
                  </button>
                  
                  <div className="px-3 py-2 text-xs font-medium text-gray-600 mb-1 mt-2">All Data</div>
                  <button
                    onClick={() => {
                      const allData = filteredStudents;
                      const headers = [
                        'Name', 'ID', 'Department', 'Course', 'Year Level', 'Attendance Rate', 'Present', 'Late', 'Absent', 'Total Days', 'Last Attendance'
                      ];
                      const rows = allData.map((student: StudentAttendance) => [
                        student.studentName,
                        student.studentId,
                        student.department,
                        student.course,
                        student.yearLevel,
                        student.attendanceRate + '%',
                        student.presentDays,
                        student.lateDays,
                        student.absentDays,
                        student.totalDays,
                        new Date(student.lastAttendance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      ]);
                      const csvContent = [headers, ...rows].map(e => e.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'student-attendance-all.csv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Export All as CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const allData = filteredStudents;
                        const ws = XLSX.utils.json_to_sheet(allData.map((student: StudentAttendance) => ({
                          'Student ID': student.studentId,
                          'Name': student.studentName,
                          'Department': student.department,
                          'Course': student.course,
                          'Year Level': student.yearLevel,
                          'Attendance Rate': student.attendanceRate + '%',
                          'Present': student.presentDays,
                          'Late': student.lateDays,
                          'Absent': student.absentDays,
                          'Total': student.totalDays,
                          'Last Attendance': new Date(student.lastAttendance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        })));
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
                        XLSX.writeFile(wb, 'student-attendance-all.xlsx');
                      } catch (error) {
                        console.error('Error exporting Excel:', error);
                        toast.error('Failed to export as Excel');
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-green-600 group-hover:text-green-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Export All as Excel</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <FileDown className="w-4 h-4 text-purple-600 group-hover:text-purple-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Export All as PDF</span>
                  </button>

                  {/* Print Section */}
                  <div className="px-3 py-2 text-xs font-semibold text-blue-900 uppercase tracking-wider border-b border-blue-100 mb-2 mt-4">
                    Print
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                  >
                    <Printer className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                    <span className="group-hover:text-blue-900 transition-colors">Print Page</span>
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
 
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Search and Filter Interface */}
        <div className="space-y-4">
          {/* Top Bar: Search + Advanced Filters + Export */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative group flex-1 search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-blue-600 z-10" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => recentSearches.length > 0 && setShowRecentSearches(true)}
                onBlur={() => {
                  setTimeout(() => setShowRecentSearches(false), 200);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                  <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Recent searches dropdown */}
              {recentSearches.length > 0 && showRecentSearches && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[60]">
                  <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Recent searches</h3>
                    <button
                        onClick={clearRecentSearches}
                      className="text-xs text-blue-600 rounded-xl hover:text-blue-800 font-medium hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {recentSearches.map((search, index) => (
                    <div 
                      key={index}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors group"
                          onClick={() => handleSelectRecentSearch(search)}
                        >
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-blue-600" />
                        <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{search}</span>
                    </div>
                    ))}
                </div>
              </div>
            )}
          </div>

            {/* Smart Quick Filters with Counts */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => applyFilterPreset({ id: 'at-risk', name: 'At Risk', description: '', icon: AlertTriangle, filters: { riskLevels: ['HIGH', 'MEDIUM'] } })}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center ${
                  filters.riskLevels.some(r => ['HIGH', 'MEDIUM'].includes(r))
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                At Risk ({filteredStudents.filter(s => s.riskLevel && ['HIGH', 'MEDIUM'].includes(s.riskLevel)).length})
              </button>
              
              <button
                onClick={() => applyFilterPreset({ id: 'perfect', name: 'Perfect', description: '', icon: Target, filters: { attendanceRates: ['High (≥90%)'] } })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  filters.attendanceRates.includes('High (≥90%)')
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <Target className="w-3 h-3" />
                Perfect ({filteredStudents.filter(s => s.attendanceRate >= 90).length})
              </button>
              
            <button
                onClick={() => applyFilterPreset({ id: 'low', name: 'Low Attendance', description: '', icon: TrendingDown, filters: { attendanceRates: ['Low (<75%)'] } })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  filters.attendanceRates.includes('Low (<75%)')
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                }`}
            >
                <TrendingDown className="w-3 h-3" />
                Low ({filteredStudents.filter(s => s.attendanceRate < 75).length})
            </button>
            
            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowAdvancedFiltersRow((prev: boolean) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                showAdvancedFiltersRow
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              Advanced
            </button>
            </div>



              </div>
              

        </div>


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
  iconTooltips = {},
  totalSessions, // NEW
  notificationsSent // NEW
}: {
  totalStudents: number;
  averageAttendanceRate: number;
  totalLate: number;
  totalAbsent: number;
  getAttendanceRateColor: (rate: number) => { text: string; bg: string; border: string; hex: string; };
  iconTooltips?: { users?: string; trending?: string; clock?: string; alert?: string; };
  totalSessions?: number; // NEW
  notificationsSent?: number; // NEW
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Existing Cards */}
      <Card>
        <CardHeader>
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
        <CardHeader>
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
        <CardHeader>
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
        <CardHeader>
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
      {/* NEW: Total Sessions Card */}
      {typeof totalSessions === 'number' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-gray-500 mt-1">For selected period</p>
          </CardContent>
        </Card>
      )}
      {/* NEW: Notifications Sent Card */}
      {typeof notificationsSent === 'number' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Notifications Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationsSent}</div>
            <p className="text-xs text-gray-500 mt-1">Absence/tardiness alerts</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
const DepartmentTrendsChart = ({ data }: { data: { name: string; avgAttendance: number; count: number }[] }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">Department Attendance Trends</h3>
    <ResponsiveContainer width="100%" height={250}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
        <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Avg Attendance']} />
        <Bar dataKey="avgAttendance" fill="#3b82f6" name="Avg Attendance" />
      </ReBarChart>
    </ResponsiveContainer>
  </div>
);
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

const TableHeader = ({ sortBy, setSortBy, allSelected, onSelectAll }: { 
  sortBy: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level'; 
  setSortBy: (v: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level') => void; 
  allSelected: boolean; 
  onSelectAll: () => void 
}) => {
  // Helper function to render sort indicator with proper direction
  const SortIndicator = ({ active, direction }: { active: boolean, direction?: 'asc' | 'desc' | undefined }) => {
    if (!active) return null;
    return direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1 text-blue-100" /> : 
      <ChevronDown className="w-4 h-4 ml-1 text-blue-100" />;
  };

  // Helper function to handle sort clicks with proper toggling
  const handleSortClick = (field: 'name' | 'id' | 'department' | 'course' | 'year-level' | 'status' | 'attendance') => {
    if (field === 'attendance') {
      // Toggle between attendance-desc and attendance-asc
      setSortBy(sortBy === 'attendance-desc' ? 'attendance-asc' : 'attendance-desc');
    } else {
      // For other fields, toggle between the field and attendance-desc (default)
      const currentField = sortBy === 'name' || sortBy === 'id' || sortBy === 'department' || 
                          sortBy === 'course' || sortBy === 'year-level' || sortBy === 'status';
      
      if (currentField && sortBy === field) {
        // If clicking the same field, toggle to attendance-desc
        setSortBy('attendance-desc');
      } else {
        // Set to the clicked field
        setSortBy(field);
      }
    }
  };

  // Helper function to get sort direction for a field
  const getSortDirection = (field: string): 'asc' | 'desc' | undefined => {
    if (field === 'attendance') {
      return sortBy === 'attendance-asc' ? 'asc' : sortBy === 'attendance-desc' ? 'desc' : undefined;
    }
    return sortBy === field ? 'asc' : undefined;
  };

  // Helper function to check if a field is active
  const isFieldActive = (field: string): boolean => {
    if (field === 'attendance') {
      return sortBy === 'attendance-asc' || sortBy === 'attendance-desc';
    }
    return sortBy === field;
  };
  
  return (
    <div className="hidden md:grid grid-cols-14 items-center px-8 py-5 bg-blue-600 border-b border-blue-500 font-semibold text-white text-sm sticky top-0 z-20 shadow-md">
      {/* Selection Checkbox */}
      <div className="col-span-1 flex items-center justify-center">
        <Checkbox 
          checked={allSelected} 
          onCheckedChange={onSelectAll}
          className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-blue-700 transition-all"
        />
      </div>
      
      {/* Student Info - Enhanced with proper sorting */}
      <div 
        className="col-span-2 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('name')}
      >
        <span className="flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span>Student</span>
          <SortIndicator 
            active={isFieldActive('name')} 
            direction={getSortDirection('name')}
          />
        </span>
      </div>
      
      {/* Student ID - Enhanced with proper sorting */}
      <div 
        className="col-span-1 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('id')}
      >
        <span className="flex items-center gap-1.5">
          <Hash className="w-4 h-4" />
          <span>ID</span>
          <SortIndicator 
            active={isFieldActive('id')} 
            direction={getSortDirection('id')}
          />
        </span>
      </div>
      
      {/* Department - Enhanced with proper sorting */}
      <div 
        className="col-span-1 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('department')}
      >
        <span className="flex items-center gap-1.5">
          <Building className="w-4 h-4" />
          <span>Department</span>
          <SortIndicator 
            active={isFieldActive('department')} 
            direction={getSortDirection('department')}
          />
        </span>
      </div>
      
      {/* Course - Enhanced with proper sorting */}
      <div 
        className="col-span-1 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('course')}
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>Course</span>
          <SortIndicator 
            active={isFieldActive('course')} 
            direction={getSortDirection('course')}
          />
        </span>
      </div>
      
      {/* Year Level - Enhanced with proper sorting */}
      <div 
        className="col-span-1 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('year-level')}
      >
        <span className="flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4" />
          <span>Year Level</span>
          <SortIndicator 
            active={isFieldActive('year-level')} 
            direction={getSortDirection('year-level')}
          />
        </span>
      </div>
      
      {/* Section - NEW COLUMN */}
      <div className="col-span-1 flex items-center px-3">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>Section</span>
        </span>
      </div>
      
      {/* Risk Level - NEW COLUMN */}
      <div className="col-span-1 flex items-center px-3">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Risk Level</span>
        </span>
      </div>
      
      {/* Subjects - NEW COLUMN */}
      <div className="col-span-1 flex items-center px-3">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>Subjects</span>
        </span>
      </div>
      
      {/* Attendance Rate - Enhanced with proper sorting */}
      <div 
        className="col-span-1 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('attendance')}
      >
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4" />
          <span>Attendance</span>
          <SortIndicator 
            active={isFieldActive('attendance')} 
            direction={getSortDirection('attendance')}
          />
        </span>
      </div>
      
      {/* Last Attendance - NEW COLUMN */}
      <div className="col-span-1 flex items-center px-3">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4" />
          <span>Last Attendance</span>
        </span>
      </div>
      
      {/* Status - Enhanced with proper sorting */}
      <div 
        className="col-span-1 cursor-pointer select-none flex items-center hover:bg-blue-700 transition-colors px-3 rounded"
        onClick={() => handleSortClick('status')}
      >
        <span className="flex items-center gap-1.5">
          <Activity className="w-4 h-4" />
          <span>Status</span>
          <SortIndicator 
            active={isFieldActive('status')} 
            direction={getSortDirection('status')}
          />
        </span>
      </div>
      
      {/* Actions */}
      <div className="col-span-1 text-center">
        <span className="flex items-center justify-center gap-1.5">
          <Settings className="w-4 h-4" />
          <span>Actions</span>
        </span>
      </div>
    </div>
  );
};

const MobileStudentCard = ({ student, expanded, onExpand, getAttendanceRateColor }: { student: StudentAttendance; expanded: boolean; onExpand: () => void; getAttendanceRateColor: (rate: number) => { text: string; bg: string; border: string; hex: string; } }) => {
  const status = student.attendanceRate >= 90 ? 'Present' : student.attendanceRate >= 75 ? 'Late' : 'Absent';
  
  // Format student name properly
  const displayName = student.firstName && student.lastName 
    ? `${student.firstName} ${student.middleName ? `${student.middleName.charAt(0)}. ` : ''}${student.lastName}${student.suffix ? ` ${student.suffix}` : ''}`
    : student.studentName;
    
  // Format initials for avatar
  const initials = student.firstName && student.lastName
    ? `${student.firstName[0]}${student.lastName[0]}`
    : student.studentName.split(' ').map(n => n[0]).join('');
    
  return (
    <div className="md:hidden bg-white border border-blue-100 rounded-xl shadow-sm mb-3 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 ring-1 ring-blue-100">
            <AvatarImage src={student.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {student.status === 'ACTIVE' && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-blue-900 text-base">{displayName}</div>
          <div className="text-xs text-gray-500">ID: {student.studentIdNumber || student.studentId}</div>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{student.department}</span>
            <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{student.course}</span>
            {student.yearLevel && (
              <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                {typeof student.yearLevel === 'string' && student.yearLevel.includes('_') 
                  ? student.yearLevel.replace('_', ' ') 
                  : student.yearLevel}
              </span>
            )}
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
      
      <div className="flex items-center justify-between mt-3">
        <div>
          <span className={`font-bold ${getAttendanceRateColor(student.attendanceRate).text}`}>{student.attendanceRate.toFixed(1)}%</span>
          <span className="text-xs text-gray-600 ml-2">
            {student.presentDays}/{student.totalDays} days
          </span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
      </div>
      
      {expanded && (
        <div className="mt-4 border-t border-blue-100 pt-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-blue-600" /> {student.email || 'student@email.com'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-blue-600" /> {student.phoneNumber || '+63 900 000 0000'}
            </div>
            
            {student.guardianInfo && (
              <div className="mt-2 p-2 bg-blue-50 rounded-xl">
                <div className="text-xs font-medium text-blue-800 mb-1">Guardian Information</div>
                <div className="text-xs text-gray-700">{student.guardianInfo.name} ({student.guardianInfo.relationship})</div>
                <div className="text-xs text-gray-700">{student.guardianInfo.phone}</div>
              </div>
            )}
            
            {student.academicInfo && (
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                <BookOpen className="w-4 h-4 text-blue-600" /> 
                {student.academicInfo.totalSubjects} subjects
                {student.academicInfo.sectionName && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Section: {student.academicInfo.sectionName}
                  </span>
                )}
              </div>
            )}
            
            {student.subjects.length > 0 && (
              <>
                <div className="text-xs font-medium text-blue-800 mt-2">Enrolled Subjects</div>
                <div className="flex flex-wrap gap-2">
                  {student.subjects.map(subj => (
                    <Tooltip key={subj.subjectCode || subj.subjectName}>
                      <TooltipTrigger asChild>
                        <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium cursor-pointer">
                          {subj.subjectName || subj.subjectCode}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div><b>{subj.subjectName}</b> ({subj.subjectCode})</div>
                          <div>Instructor: {subj.instructor || 'TBD'}</div>
                          <div>Room: {subj.room || 'TBD'}</div>
                          <div>Schedule: {subj.schedule?.dayOfWeek || 'TBD'} {subj.schedule?.startTime || ''}{subj.schedule?.endTime ? `–${subj.schedule.endTime}` : ''}</div>
                          <div>Enrolled: {subj.enrollmentDate ? new Date(subj.enrollmentDate).toLocaleDateString() : 'N/A'}</div>
                          <div>Status: {subj.status || 'N/A'}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              Last Attendance: <span className="text-blue-800 font-semibold">{new Date(student.lastAttendance).toLocaleDateString()}</span>
              {student.lastAttendanceStatus && (
                <span className={`ml-2 ${
                  student.lastAttendanceStatus === AttendanceStatus.PRESENT ? 'text-green-600' :
                  student.lastAttendanceStatus === AttendanceStatus.LATE ? 'text-yellow-600' :
                  student.lastAttendanceStatus === AttendanceStatus.EXCUSED ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  ({student.lastAttendanceStatus.charAt(0) + student.lastAttendanceStatus.slice(1).toLowerCase()})
                </span>
              )}
            </div>
            
            {student.enrollmentStatus && (
              <div className="mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  student.enrollmentStatus === EnrollmentStatus.ENROLLED ? 'bg-green-100 text-green-700' :
                  student.enrollmentStatus === EnrollmentStatus.WITHDRAWN ? 'bg-yellow-100 text-yellow-700' :
                  student.enrollmentStatus === EnrollmentStatus.GRADUATED ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {typeof student.enrollmentStatus === 'string' 
                    ? student.enrollmentStatus.charAt(0) + student.enrollmentStatus.slice(1).toLowerCase() 
                    : student.enrollmentStatus}
                </span>
              </div>
            )}
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
  setExpandedStudentId,
  onStudentClick,
  viewMode = 'list',
  isMobileOptimized = false,
  realTimeMode = false
}: {
  filteredStudents: StudentAttendance[];
  getAttendanceRateColor: (rate: number) => { text: string; bg: string; border: string; hex: string; };
  loading: boolean;
  sortBy: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level';
  setSortBy: (v: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level') => void;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  allSelected: boolean;
  onSelectAll: () => void;
  expandedStudentId: string | null;
  setExpandedStudentId: (id: string | null) => void;
  onStudentClick: (student: StudentAttendance) => void;
  viewMode?: 'grid' | 'list' | 'kanban' | 'calendar';
  isMobileOptimized?: boolean;
  realTimeMode?: boolean;
}) => {
  // Risk level badge helper with enhanced colors
  const getRiskBadgeColor = (risk?: RiskLevel | string) => {
    switch (risk) {
      case RiskLevel.HIGH:
      case 'high': 
        return 'bg-red-100 text-red-800 border-red-200 ring-1 ring-red-300';
      case RiskLevel.MEDIUM:
      case 'medium': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 ring-1 ring-yellow-300';
      case RiskLevel.LOW:
      case 'low': 
        return 'bg-blue-100 text-blue-800 border-blue-200 ring-1 ring-blue-300';
      case RiskLevel.NONE:
      case 'none':
      default: 
        return 'bg-green-100 text-green-800 border-green-200 ring-1 ring-green-300';
    }
  };

  // Enhanced loading skeletons
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {/* Desktop loading skeleton */}
        <div className="hidden md:block space-y-3">
          <div className="grid grid-cols-8 gap-4 p-4 bg-blue-50 rounded-xl">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-xl bg-blue-200" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 p-4 bg-white border border-blue-100 rounded-xl hover:shadow-sm transition-shadow">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
        
        {/* Mobile loading skeleton */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-6 w-full rounded-xl" />
                <Skeleton className="h-6 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 1: Compute aggregate stats from filtered students
  const totalStudentsFiltered = filteredStudents.length;
  const totalLateFiltered = filteredStudents.reduce((sum, s) => sum + (s.lateDays || 0), 0);
  const totalAbsentFiltered = filteredStudents.reduce((sum, s) => sum + (s.absentDays || 0), 0);
  const averageAttendanceRateFiltered = totalStudentsFiltered > 0 ? filteredStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / totalStudentsFiltered : 0;

  // Enhanced virtualized row renderer
  const Row = ({ index, style }: ListChildComponentProps) => {
    const student = filteredStudents[index];
    if (!student) return null;
    
    const status = student.attendanceRate >= 90 ? 'Present' : student.attendanceRate >= 75 ? 'Late' : 'Absent';
    const checked = selected.has(student.id);
    const expanded = expandedStudentId === student.id;
    const isEvenRow = index % 2 === 0;
    
    return (
      <div style={style} key={student.id}>
        {/* Enhanced Desktop Row */}
        <div
          className={`grid grid-cols-14 items-center px-8 py-6 text-sm border-b border-gray-200 hidden md:grid cursor-pointer transition-colors group hover:bg-blue-100/50 relative ${
            isEvenRow 
              ? 'bg-white' 
              : 'bg-gray-50/50'
          } ${checked ? 'bg-blue-50 border-blue-200' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onStudentClick(student);
          }}
        >
          {/* Selection Checkbox */}
          <div className="col-span-1 flex items-center justify-center">
            <Checkbox 
              checked={checked} 
              onCheckedChange={() => {
                const newSet = new Set(selected);
                if (checked) newSet.delete(student.id);
                else newSet.add(student.id);
                setSelected(newSet);
              }}
              className="w-5 h-5 border-2 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all group-hover:border-blue-400"
            />
          </div>
          
          {/* Student Information */}
          <div className="col-span-3 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-1 ring-gray-200">
                <AvatarImage src={student.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                  {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}` || student.studentName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {student.status === 'ACTIVE' && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate flex items-center gap-1">
                <span>
                        {student.firstName && student.lastName 
        ? `${student.firstName} ${student.middleName ? `${student.middleName.charAt(0)}. ` : ''}${student.lastName}${student.suffix ? ` ${student.suffix}` : ''}`
        : student.studentName}
                </span>
                {student.gender && (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    student.gender === UserGender.MALE || student.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 
                    student.gender === UserGender.FEMALE || student.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {student.gender === UserGender.MALE || student.gender === 'MALE' ? '♂' : 
                     student.gender === UserGender.FEMALE || student.gender === 'FEMALE' ? '♀' : '⚧'}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {student.email}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {student.riskLevel && student.riskLevel !== RiskLevel.NONE && student.riskLevel !== 'none' && (
                  <Badge className={`${getRiskBadgeColor(student.riskLevel)} text-xs px-1.5 py-0.5 font-medium`}>
                    {typeof student.riskLevel === 'string' && student.riskLevel.includes('_') 
                      ? student.riskLevel.replace('_', ' ').toUpperCase() 
                      : student.riskLevel.toUpperCase()}
                  </Badge>
                )}

                {student.studentType && (
                  <Badge className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 font-medium">
                    {typeof student.studentType === 'string' && student.studentType.includes('_') 
                      ? student.studentType.replace('_', ' ') 
                      : student.studentType}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Student ID */}
          <div className="col-span-1 px-3">
            <div className="font-mono text-sm text-gray-700">
              {student.studentIdNumber || student.studentId}
            </div>
            {student.rfidTag && (
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="font-mono">{student.rfidTag}</span>
              </div>
            )}
          </div>
          
          {/* Department */}
          <div className="col-span-1 px-3">
            <div className="text-gray-900 font-medium">
              {student.department}
            </div>
            {student.academicInfo?.sectionName && (
              <div className="text-xs text-gray-500 mt-2">
                Section: {student.academicInfo.sectionName}
              </div>
            )}
          </div>
          
          {/* Course */}
          <div className="col-span-1 px-3">
            <div className="text-gray-900 font-medium">
              {student.course}
            </div>
          </div>
          
          {/* Year Level */}
          <div className="col-span-1 px-3">
            <div className="text-gray-900 font-medium">
              {typeof student.yearLevel === 'string' && student.yearLevel.includes('_') 
                ? student.yearLevel.replace('_', ' ') 
                : student.yearLevel}
            </div>
          </div>
          
          {/* Section - NEW COLUMN */}
          <div className="col-span-1 px-3">
            <div className="text-gray-900 font-medium">
              {student.sectionInfo?.sectionCode || student.academicInfo?.sectionName || 'N/A'}
            </div>
            {student.sectionInfo?.instructor?.name && (
              <div className="text-xs text-gray-500 mt-1">
                {student.sectionInfo.instructor.name}
              </div>
            )}
          </div>
          
          {/* Risk Level - NEW COLUMN */}
          <div className="col-span-1 px-3">
            <div className="flex items-center justify-center">
              <Badge className={`text-xs px-2 py-1 font-medium ${
                student.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                student.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                student.riskLevel === 'LOW' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-green-100 text-green-700 border-green-200'
              } border`}>
                {student.riskLevel || 'NONE'}
              </Badge>
            </div>
            {student.riskFactors && (
              <div className="text-xs text-gray-500 mt-1 text-center">
                {student.riskFactors.recentAbsences} recent absences
              </div>
            )}
          </div>
          
          {/* Subjects - NEW COLUMN */}
          <div className="col-span-1 px-3">
            <div className="text-center">
              <div className="text-gray-900 font-medium">
                {student.subjects?.length || student.academicInfo?.totalSubjects || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                enrolled
              </div>
            </div>
            {student.subjects && student.subjects.length > 0 && (
              <div className="text-xs text-gray-500 mt-1 text-center">
                {student.subjects.slice(0, 2).map(s => s.subjectCode).join(', ')}
                {student.subjects.length > 2 && '...'}
              </div>
            )}
          </div>
          
          {/* Attendance Rate */}
          <div className="col-span-1 px-3">
            <div className={`font-bold text-lg ${getAttendanceRateColor(student.attendanceRate).text}`}>
              {student.attendanceRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {student.presentDays} present, {student.lateDays} late, {student.absentDays} absent
            </div>
            {student.trend && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${
                student.trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-3 h-3 ${student.trend < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(student.trend).toFixed(1)}%
              </div>
            )}
            
            {student.attendanceStats && (
              <div className="flex h-2 rounded-sm overflow-hidden mt-3">
                <div className={`bg-green-500`} style={{width: `${student.attendanceStats.presentPercentage}%`}}></div>
                <div className={`bg-yellow-500`} style={{width: `${student.attendanceStats.latePercentage}%`}}></div>
                <div className={`bg-red-500`} style={{width: `${student.attendanceStats.absentPercentage}%`}}></div>
                {student.attendanceStats.excusedPercentage > 0 && (
                  <div className={`bg-blue-500`} style={{width: `${student.attendanceStats.excusedPercentage}%`}}></div>
                )}
              </div>
            )}
          </div>
          
          {/* Last Attendance - NEW COLUMN */}
          <div className="col-span-1 px-3">
            <div className="text-sm text-gray-900 font-medium">
              {student.lastAttendance ? new Date(student.lastAttendance).toLocaleDateString() : 'No record'}
            </div>
            {student.lastAttendanceStatus && (
              <div className="text-xs text-gray-600 mt-1">
                <span className={`font-medium ${
                  student.lastAttendanceStatus === AttendanceStatus.PRESENT ? 'text-green-600' :
                  student.lastAttendanceStatus === AttendanceStatus.LATE ? 'text-yellow-600' :
                  student.lastAttendanceStatus === AttendanceStatus.EXCUSED ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {student.lastAttendanceStatus.charAt(0) + student.lastAttendanceStatus.slice(1).toLowerCase()}
                </span>
                {student.lastCheckInTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(student.lastCheckInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            )}
              </div>
            )}
          </div>
          
          {/* Status */}
          <div className="col-span-1 px-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${STATUS_COLORS[student.status]}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              {student.status}
                </span>
            {student.guardianInfo && (
              <div className="text-xs text-gray-600 mt-2">
                Guardian: {student.guardianInfo.name}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="col-span-1 flex justify-center items-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1.5 rounded hover:bg-gray-100"
                aria-label={expanded ? 'Hide details' : 'Show details'}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedStudentId(expanded ? null : student.id);
                }}
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Phase 3: View Mode Conditional Rendering
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {filteredStudents.map((student) => {
        const status = student.attendanceRate >= 90 ? 'Present' : student.attendanceRate >= 75 ? 'Late' : 'Absent';
        const checked = selected.has(student.id);
        
        return (
          <div
            key={student.id}
            className={`bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer p-4 ${
              checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            } ${realTimeMode ? 'ring-2 ring-green-100' : ''}`}
            onClick={() => onStudentClick(student)}
          >
            <div className="flex items-center justify-between mb-3">
              <Checkbox
                checked={checked}
                onCheckedChange={() => {
                  const newSet = new Set(selected);
                  if (checked) newSet.delete(student.id);
                  else newSet.add(student.id);
                  setSelected(newSet);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4"
              />
              {realTimeMode && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            </div>
            
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar className="h-12 w-12 mb-2">
                <AvatarImage src={student.avatarUrl} />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {student.studentName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="font-bold text-gray-900 text-sm truncate w-full">{student.studentName}</div>
              <div className="text-xs text-gray-500 font-mono">{student.studentId}</div>
            </div>
            
                      <div className={`text-2xl font-bold text-center mb-2 ${getAttendanceRateColor(student.attendanceRate).text}`}>
            {student.attendanceRate.toFixed(1)}%
          </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium truncate ml-1">{student.department}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Year:</span>
                <span className="font-medium">{student.yearLevel}</span>
              </div>
            </div>
            
            <div className="mt-3 flex justify-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderKanbanView = () => {
    const columns = [
      { title: 'High Performers', students: filteredStudents.filter(s => s.attendanceRate >= 90), color: 'green' },
      { title: 'Good Attendance', students: filteredStudents.filter(s => s.attendanceRate >= 75 && s.attendanceRate < 90), color: 'blue' },
      { title: 'At Risk', students: filteredStudents.filter(s => s.attendanceRate < 75), color: 'red' }
    ];

    return (
      <div className="flex gap-6 p-4 overflow-x-auto">
        {columns.map((column) => (
          <div key={column.title} className="flex-shrink-0 w-80">
            <div className={`p-3 rounded-xl mb-4 ${
              column.color === 'green' ? 'bg-green-100 border border-green-300' :
              column.color === 'blue' ? 'bg-blue-100 border border-blue-300' :
              'bg-red-100 border border-red-300'
            }`}>
              <h3 className={`font-semibold ${
                column.color === 'green' ? 'text-green-800' :
                column.color === 'blue' ? 'text-blue-800' :
                'text-red-800'
              }`}>
                {column.title} ({column.students.length})
              </h3>
            </div>
            <div className="space-y-3">
              {column.students.map((student) => {
                const checked = selected.has(student.id);
                return (
                  <div
                    key={student.id}
                    className={`bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                      checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => onStudentClick(student)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          const newSet = new Set(selected);
                          if (checked) newSet.delete(student.id);
                          else newSet.add(student.id);
                          setSelected(newSet);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                          {student.studentName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{student.studentName}</div>
                        <div className="text-xs text-gray-500">{student.studentId}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${getAttendanceRateColor(student.attendanceRate).text}`}>
                        {student.attendanceRate.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-600">{student.department}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCalendarView = () => (
    <div className="p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Attendance Calendar View</h3>
          <p className="text-sm text-gray-600">Weekly attendance overview for selected students</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-700 p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="text-center text-gray-500 py-8">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-400"><CalendarIcon /></div>
            <p>Calendar view implementation coming soon...</p>
            <p className="text-xs mt-2">Will show daily attendance patterns and trends</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border-0 shadow-none">
      <CardContent style={{ height: 600, padding: 0 }}>
        {/* Phase 3: Conditional Rendering Based on View Mode */}
        {viewMode === 'list' ? (
          <>
        <TableHeader sortBy={sortBy} setSortBy={setSortBy} allSelected={allSelected} onSelectAll={onSelectAll} />
        <AutoSizer disableHeight>
          {({ width }: { width: number }) => (
            <List
              height={520}
              itemCount={filteredStudents.length}
                  itemSize={isMobileOptimized ? 100 : 120}
              width={width || '100%'}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
          </>
        ) : viewMode === 'grid' ? (
          <div style={{ height: 600, overflowY: 'auto' }}>
            {renderGridView()}
          </div>
        ) : viewMode === 'kanban' ? (
          <div style={{ height: 600, overflowY: 'auto' }}>
            {renderKanbanView()}
          </div>
        ) : viewMode === 'calendar' ? (
          <div style={{ height: 600, overflowY: 'auto' }}>
            {renderCalendarView()}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
const TrendsBarChart = ({ data, title }: { data: { name: string; avgAttendance: number; count: number }[], title: string }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">{title}</h3>
    <ResponsiveContainer width="100%" height={250}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
        <RechartsTooltip />
        <Bar dataKey="avgAttendance" fill="#3b82f6" name="Avg Attendance (%)" />
      </ReBarChart>
    </ResponsiveContainer>
  </div>
);
// ============================================================================
// MAIN COMPONENT: StudentAttendancePage
// ============================================================================
// This is the main page component that renders the complete student attendance
// management interface. It includes:
// - Real-time dashboard with analytics
// - Student list with filtering and sorting
// - Bulk operations and notifications
// - Export functionality
// - Mobile-responsive design
// ============================================================================
export default function StudentAttendancePage() {

  // Add global error handler for unhandled promise rejections
  useEffect(() => {
  // ============================================================================
  // ERROR HANDLING AND GLOBAL EVENT LISTENERS
  // ============================================================================
  // Handles unhandled promise rejections to prevent app crashes
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default browser behavior
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    departments: [],
    courses: [],
    yearLevels: [],
    sections: [],
    attendanceRates: [],
    riskLevels: [],
    studentStatuses: [],
    studentTypes: [],
    subjects: [],
    subjectInstructors: [],
    subjectRooms: [],
    semester: [],
    dateRangeStart: '',
    dateRangeEnd: '',
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    start: '',
    end: ''
  });

  // Initialize date range after mounting to avoid hydration issues
  useEffect(() => {
    if (!dateRange.start && !dateRange.end) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      setDateRange({
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      });
    }
  }, [dateRange.start, dateRange.end]);

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level'>('attendance-desc');
  const [pdfLoading, setPdfLoading] = useState(false);
  // Consolidated pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showRealTimeStatus, setShowRealTimeStatus] = useState(false);
  const [showRFIDLogs, setShowRFIDLogs] = useState(false);
  const [rfidLogs, setRFIDLogs] = useState<{ timestamp: string; reader: string; status: string }[]>([]);
  const [rfidLoading, setRFIDLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [searchFilterExpanded, setSearchFilterExpanded] = useState(true);
  const [reportExpanded, setReportExpanded] = useState(true);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  
  // Role-based access control (in a real app, this would come from auth context)
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'viewer'>('admin');
  const canDeleteStudents = userRole === 'admin';
  
  // Undo functionality for recently deleted students
  const [recentlyDeletedStudents, setRecentlyDeletedStudents] = useState<Array<{
    id: string;
    name: string;
    deletedAt: Date;
    originalStatus: string;
  }>>([]);
  
  // Loading states for delete operations
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Missing state variables for functionality
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [studentToDelete, setStudentToDelete] = useState<StudentAttendance | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [selectedStudentsForBulkAction, setSelectedStudentsForBulkAction] = useState<StudentAttendance[]>([]);
  const [viewStudent, setViewStudent] = useState<StudentAttendance | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnAccessor: string } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['select', 'studentName', 'department', 'course', 'yearLevel', 'attendanceRate', 'status', 'actions']);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>(['studentName', 'studentId', 'department', 'course', 'yearLevel', 'attendanceRate', 'status']);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [analyticsSortBy, setAnalyticsSortBy] = useState<'name' | 'rate' | 'total'>('rate');
  const [drillDownPath, setDrillDownPath] = useState<string[]>([]);
  const [drillDownHistory, setDrillDownHistory] = useState<Array<{ level: string; value: string; data: any }>>([]);
  const [drillDownData, setDrillDownData] = useState<StudentAttendance[]>([]);
  const [drillDownLevel, setDrillDownLevel] = useState<string | null>(null);
  const [showDrillDownBreadcrumb, setShowDrillDownBreadcrumb] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: new Date(), end: new Date() });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showCustomizationDialog, setShowCustomizationDialog] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    defaultTimeRange: '7d',
    chartLayout: 'grid',
    colorScheme: 'blue',
    dataDensity: 'normal',
    showConfidenceIntervals: false,
    showTrendLines: true,
    autoRefresh: false
  });
  const [savedCustomizations, setSavedCustomizations] = useState<Array<{
    id: string;
    name: string;
    preferences: any;
    createdAt: Date;
  }>>([]);
  const [customTrendRange, setCustomTrendRange] = useState('7d');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous_week');
  const [showComparisonCustomization, setShowComparisonCustomization] = useState(false);
  const [goalPeriod, setGoalPeriod] = useState('monthly');
  const [showGoalCustomization, setShowGoalCustomization] = useState(false);
  const [systemView, setSystemView] = useState('attendance');
  const [activeFilterPreset, setActiveFilterPreset] = useState<string>('');
  const [filterPreset, setFilterPreset] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [clientTime, setClientTime] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [thresholdAlert, setThresholdAlert] = useState<number>(75);
  const [showTrends, setShowTrends] = useState<boolean>(true);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<string>('trends');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState<boolean>(false);
  

  
  // Advanced Filter States
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    attendanceRangeMin: 0,
    attendanceRangeMax: 100,
    lastAttendanceDays: '',
    presentDaysMin: '',
    presentDaysMax: '',
    absentDaysMin: '',
    absentDaysMax: '',
    lateDaysMin: '',
    lateDaysMax: '',
    totalDaysMin: '',
    totalDaysMax: '',
    logicalOperator: 'AND',
    customTextFilter: '',
    excludeInactive: false,
    onlyRecentEnrollments: false,
    verificationStatus: [],
    attendanceTypes: [],
    eventTypes: [],
    semester: [],
    academicYear: [],
    subjectScheduleDays: [],
    subjectScheduleTimes: [],
    timeOfDay: [],
    attendanceTrends: [],
    subjectEnrollments: [],
    enrollmentStatuses: [],
    dateRangeStart: '',
    dateRangeEnd: '',
  });

  // Active range state for Today/Week/Month selector
  const [activeRange, setActiveRange] = useState<'today' | 'week' | 'month'>('today');
  const [departmentDrilldown, setDepartmentDrilldown] = useState<'present' | 'late' | 'absent' | null>('present');
  const [departmentBreakdownLoading, setDepartmentBreakdownLoading] = useState(true);

  const handleRangeChange = (range: 'today' | 'week' | 'month') => {
    setActiveRange(range);
    // Reset department drill-down to present when time range changes
    setDepartmentDrilldown('present');
    
    // Set both loading states to true for synchronized loading
    setStudentsLoading(true);
    setDepartmentBreakdownLoading(true);
    
    const now = new Date();
    let start: Date, end: Date;
    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (range === 'week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    setFilters((f: Filters) => ({
      ...f,
      dateRangeStart: start.toISOString().slice(0, 10),
      dateRangeEnd: end.toISOString().slice(0, 10),
    }));
  };

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter presets for quick filtering
  const filterPresets: StudentFilterPreset[] = [
    {
      id: 'at-risk',
      name: 'At Risk Students',
      description: 'Students with low attendance or high risk',
      icon: AlertTriangle,
      filters: {
        attendanceRates: ['Low (<75%)'],
        riskLevels: ['HIGH', 'MEDIUM']
      }
    },
    {
      id: 'high-performers',
      name: 'High Performers',
      description: 'Students with excellent attendance',
      icon: TrendingUp,
      filters: {
        attendanceRates: ['High (≥90%)'],
        riskLevels: ['NONE']
      }
    },
    {
      id: 'cs-department',
      name: 'CS Department',
      description: 'Computer Science students only',
      icon: Building,
      filters: {
        departments: ['CS'],
        courses: ['BSCS']
      }
    },
    {
      id: 'first-years',
      name: 'First Year Students',
      description: 'New students requiring attention',
      icon: GraduationCap,
      filters: {
        yearLevels: ['First Year']
      }
    }
  ];

  // Filter options will be calculated after state declarations

  // Function to get count for each filter option
  const getFilterCount = (filterType: string, option: string): number => {
    if (!studentsData || studentsData.length === 0) return 0;
    
    return studentsData.filter(student => {
      switch (filterType) {
        case 'departments':
          // Extract department code from student's department (e.g., "CS - Computer Science" -> "CS")
          const studentDeptCode = student.department?.split(' - ')[0];
          return studentDeptCode === option;
        case 'courses':
          return student.course === option;
        case 'yearLevels':
          const yearLevel = typeof student.yearLevel === 'string' && student.yearLevel.includes('_') 
            ? student.yearLevel.replace('_', ' ') 
            : student.yearLevel;
          return yearLevel === option;
        case 'attendanceRates':
          if (option === 'High (≥90%)') return student.attendanceRate >= 90;
          if (option === 'Medium (75-89%)') return student.attendanceRate >= 75 && student.attendanceRate < 90;
          if (option === 'Low (<75%)') return student.attendanceRate < 75;
          return false;
        case 'riskLevels':
          return student.riskLevel === option;
        case 'studentStatuses':
          return student.status === option;
        case 'studentTypes':
          return student.studentType === option;
        case 'sections':
          return student.academicInfo?.sectionName === option;
        // NEW: Subject-based filter counts
        case 'subjects':
          return student.subjects?.some(subject => 
            (subject.subjectName || subject.subjectCode) === option
          ) || false;
        case 'subjectInstructors':
          return student.subjects?.some(subject => 
            subject.instructor === option
          ) || false;
        case 'subjectRooms':
          return student.subjects?.some(subject => 
            subject.room === option
          ) || false;
        case 'subjectScheduleDays':
          return student.subjects?.some(subject => 
            subject.schedule?.dayOfWeek === option
          ) || false;
        case 'subjectScheduleTimes':
          return student.subjects?.some(subject => {
            if (!subject.schedule?.startTime) return false;
            if (option === 'Morning' && subject.schedule.startTime < '12:00') return true;
            if (option === 'Afternoon' && subject.schedule.startTime >= '12:00' && subject.schedule.startTime < '17:00') return true;
            if (option === 'Evening' && subject.schedule.startTime >= '17:00') return true;
            if (option.includes('-')) {
              const [start, end] = option.split('-');
              return subject.schedule.startTime >= start && subject.schedule.startTime <= end;
            }
            return false;
          }) || false;
        default:
          return false;
      }
    }).length;
  };

  // Handle adding search to recent searches
  const addToRecentSearches = (query: string) => {
    if (query.trim() && query.length >= 2) {
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
        const newSearches = [query.trim(), ...filtered].slice(0, 8); // Keep only 8 recent searches
        // Persist to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(newSearches));
        return newSearches;
      });
    }
  };

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Show recent searches when there's focus and some input or when empty
    setShowRecentSearches(true);
  };

  // Handle selecting a recent search
  const handleSelectRecentSearch = (search: string) => {
    setSearchQuery(search);
    setShowRecentSearches(false);
    // Move the selected search to the top
    addToRecentSearches(search);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Handle filter preset application
  const applyFilterPreset = (preset: StudentFilterPreset) => {
    setFilters(prevFilters => {
      const newFilters: Filters = {
        ...prevFilters,
        departments: Array.isArray(preset.filters.departments) ? preset.filters.departments : [],
        courses: Array.isArray(preset.filters.courses) ? preset.filters.courses : [],
        yearLevels: Array.isArray(preset.filters.yearLevels) ? preset.filters.yearLevels : [],
        attendanceRates: Array.isArray(preset.filters.attendanceRates) ? preset.filters.attendanceRates : [],
        riskLevels: Array.isArray(preset.filters.riskLevels) ? preset.filters.riskLevels : [],
        studentStatuses: Array.isArray(preset.filters.studentStatuses) ? preset.filters.studentStatuses : [],
        studentTypes: Array.isArray(preset.filters.studentTypes) ? preset.filters.studentTypes : [],
        sections: Array.isArray(preset.filters.sections) ? preset.filters.sections : [],
        subjects: Array.isArray(preset.filters.subjects) ? preset.filters.subjects : [],
        subjectInstructors: Array.isArray(preset.filters.subjectInstructors) ? preset.filters.subjectInstructors : [],
        subjectRooms: Array.isArray(preset.filters.subjectRooms) ? preset.filters.subjectRooms : [],
        dateRangeStart: Array.isArray(preset.filters.dateRangeStart) ? preset.filters.dateRangeStart[0] || '' : (preset.filters.dateRangeStart as string) || '',
        dateRangeEnd: Array.isArray(preset.filters.dateRangeEnd) ? preset.filters.dateRangeEnd[0] || '' : (preset.filters.dateRangeEnd as string) || '',
      };
      return newFilters;
    });
    setActiveFilterPreset(preset.id);
  };

  // Check if a preset is currently active
  const isPresetActive = (preset: StudentFilterPreset): boolean => {
    return Object.entries(preset.filters).every(([key, values]) => {
      const currentValues = filters[key as keyof Filters];
      if (Array.isArray(values)) {
        if (!Array.isArray(currentValues)) return false;
        return values.every((v: string) => currentValues.includes(v));
      } else {
        if (Array.isArray(currentValues)) return currentValues.includes(values as string);
        return currentValues === values;
      }
    });
  };

  // Add to recent searches when search query changes (debounced)
  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      addToRecentSearches(debouncedSearch);
    }
  }, [debouncedSearch]);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch]);

  // Initialize pagination from URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const urlPage = url.searchParams.get('page');
      const urlPageSize = url.searchParams.get('pageSize');
      
      if (urlPage && !isNaN(Number(urlPage))) {
        setPage(Number(urlPage));
      }
      
      if (urlPageSize && !isNaN(Number(urlPageSize))) {
        setPageSize(Number(urlPageSize));
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchQuery, dateRange]);

  // Set current time on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleString());
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
    
    // Update the time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Using imported getAttendanceRateColor from @/lib/colors

  // Clear filters handler
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({
      departments: [],
      courses: [],
      yearLevels: [],
      sections: [],
      attendanceRates: [],
      riskLevels: [],
      studentStatuses: [],
      studentTypes: [],
      subjects: [],
      subjectInstructors: [],
      subjectRooms: [],
      dateRangeStart: '',
      dateRangeEnd: '',
    });
    setDateRange({
      start: '',
      end: ''
    });
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV handler
  const getExportData = (type: 'current' | 'all') => {
    return type === 'current' ? filteredStudents : studentsData;
  };

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================
  // Exports student data to CSV format
  // Supports exporting current filtered data or all data
  const handleExportCSV = (type: 'current' | 'all' = 'current') => {
    const data = getExportData(type);
    const headers = [
      'Name', 'ID', 'Department', 'Course', 'Year Level', 'Attendance Rate', 'Present', 'Late', 'Absent', 'Total Days', 'Last Attendance'
    ];
    const rows = data.map(stu => [
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
    a.download = type === 'current' ? 'student-attendance-current.csv' : 'student-attendance-all.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to PDF handler
  const handleExportPDF = async (type: 'current' | 'all' = 'current') => {
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
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      if (imgHeight > pageHeight) {
        let remainingHeight = imgHeight - pageHeight;
        while (remainingHeight > 0) {
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          remainingHeight -= pageHeight;
        }
      }
      pdf.save(type === 'current' ? 'student-attendance-current.pdf' : 'student-attendance-all.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF.');
    }
    setPdfLoading(false);
  };

  // Export to Excel handler
  const handleExportExcel = (type: 'current' | 'all' = 'current') => {
    try {
      const data = getExportData(type);
      const ws = XLSX.utils.json_to_sheet(data.map(stu => ({
        'Student ID': stu.studentId,
        'Name': stu.studentName,
        'Department': stu.department,
        'Course': stu.course,
        'Year Level': stu.yearLevel,
        'Attendance Rate': stu.attendanceRate + '%',
        'Present': stu.presentDays,
        'Late': stu.lateDays,
        'Absent': stu.absentDays,
        'Total': stu.totalDays,
        'Last Attendance': new Date(stu.lastAttendance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, type === 'current' ? 'student-attendance-current.xlsx' : 'student-attendance-all.xlsx');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export as Excel');
    }
  };

  const fetchRFIDLogs = async (studentId: string) => {
    setRFIDLoading(true);
    try {
      // In a real app, you'd fetch from an API endpoint
      // For now, we'll simulate with mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const mockLogs = [
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), reader: 'Main Entrance', status: 'Entry' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), reader: 'Library', status: 'Entry' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), reader: 'Library', status: 'Exit' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), reader: 'Main Entrance', status: 'Exit' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), reader: 'Cafeteria', status: 'Entry' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), reader: 'Cafeteria', status: 'Exit' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), reader: 'Computer Lab', status: 'Entry' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(), reader: 'Computer Lab', status: 'Exit' },
      ];
      
      // If we have an RFID tag, we could fetch real data
      if (selectedStudent?.rfidTag) {
        console.log(`Would fetch RFID logs for tag: ${selectedStudent.rfidTag}`);
        // In a real implementation, we would fetch from the API:
        // const response = await fetch(`/api/rfid/logs?tag=${selectedStudent.rfidTag}`);
        // const data = await response.json();
        // setRFIDLogs(data.logs || []);
      }
      
      setRFIDLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching RFID logs:', error);
      toast.error('Failed to fetch RFID logs');
    } finally {
      setRFIDLoading(false);
    }
  };

  const handleStudentClick = (student: StudentAttendance) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
    fetchRFIDLogs(student.studentId); // Fetch RFID logs when student is clicked
  };

  const handleStudentUpdate = (studentId: string, updates: Partial<StudentAttendance>) => {
    // Implementation for updating student data
    console.log('Updating student:', studentId, updates);
  };

  const handleSendNotification = (studentId: string, type: string, message: string) => {
    // Implementation for sending notification
    console.log('Sending notification:', { studentId, type, message });
  };

  // Delete handler functions
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    if (!canDeleteStudents) {
      toast.error('You do not have permission to delete students');
      return;
    }
    
    setIsDeletingStudent(true);
    try {
      // Use the userId for the API call
      const userId = studentToDelete.userId;
      if (!userId) {
        // Fallback: try to find the student's userId by their studentId
        const response = await fetch(`/api/students/find-user-id?studentId=${studentToDelete.studentId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Student user ID not found and could not be retrieved');
        }
        const data = await response.json();
        if (!data.userId) {
          throw new Error('Student user ID not found');
        }
        // Use the found userId
        const foundUserId = data.userId;
        
        // Now proceed with the delete using the found userId
        const deleteResponse = await fetch(`/api/user-management/students?userId=${foundUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'INACTIVE' }),
        });

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete student');
        }
      } else {
        // Use the userId directly
        const response = await fetch(`/api/user-management/students?userId=${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'INACTIVE' }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete student');
        }
      }

      // Log the action (in a real app, this would go to an audit log)
      console.log('Student deleted:', studentToDelete.id, 'by admin');

      // Add to recently deleted list for undo functionality
      const student = studentsData.find(s => s.id === studentToDelete.id);
      if (student) {
        setRecentlyDeletedStudents(prev => [...prev, {
          id: studentToDelete.id,
          name: studentToDelete.studentName,
          deletedAt: new Date(),
          originalStatus: student.status
        }]);
      }

      // Close dialog and refresh data
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      refreshStudentsData();
      
      toast.success(`Student "${studentToDelete.studentName}" has been marked as inactive`);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete student. Please try again.');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedIds.length === 0) return;
    
    if (!canDeleteStudents) {
      toast.error('You do not have permission to delete students');
      return;
    }
    
    // Limit bulk delete to 50 students
    if (selectedIds.length > 50) {
      toast.error('Cannot delete more than 50 students at once');
      return;
    }

    setIsBulkDeleting(true);
    try {
      // Get the students to delete with their userIds
      const studentsToDelete = studentsData.filter(s => selectedIds.includes(s.id));
      const studentsWithUserId = studentsToDelete.filter(s => s.userId);
      
      if (studentsWithUserId.length !== selectedIds.length) {
        throw new Error('Some students do not have valid user IDs');
      }

      // Soft delete - mark all selected students as inactive
      const deletePromises = studentsWithUserId.map(async (student) => {
        const response = await fetch(`/api/user-management/students?userId=${student.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'INACTIVE' }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete student ${student.studentName}`);
        }

        return student.id;
      });

      await Promise.all(deletePromises);

      // Log the bulk action
      console.log('Bulk delete completed:', selectedIds.length, 'students deleted by admin');

      // Close dialog and refresh data
      setBulkDeleteDialogOpen(false);
      setSelectedIds([]);
      refreshStudentsData();
      
      toast.success(`${selectedIds.length} student${selectedIds.length !== 1 ? 's' : ''} have been marked as inactive`);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete some students. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Undo delete functionality
  const handleUndoDelete = async (studentId: string) => {
    try {
      const deletedStudent = recentlyDeletedStudents.find(s => s.id === studentId);
      if (!deletedStudent) return;

      // Find the student in the current data to get the userId
      const student = studentsData.find(s => s.id === studentId);
      if (!student?.userId) {
        throw new Error('Student user ID not found for restoration');
      }

      // Restore the student to their original status
      const response = await fetch(`/api/user-management/students?userId=${student.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: deletedStudent.originalStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to restore student');
      }

      // Remove from recently deleted list
      setRecentlyDeletedStudents(prev => prev.filter(s => s.id !== studentId));
      
      // Refresh data
      refreshStudentsData();
      
      toast.success(`Student "${deletedStudent.name}" has been restored`);
    } catch (error) {
      console.error('Error restoring student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore student. Please try again.');
    }
  };

  // Clean up old deleted students (older than 5 minutes) and update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setRecentlyDeletedStudents(prev => 
        prev.filter(student => student.deletedAt > fiveMinutesAgo)
      );
    }, 1000); // Update every second for real-time countdown

    return () => clearInterval(interval);
  }, []);

  // Bulk action handlers
  const handleExportSelectedStudents = (selectedStudents: StudentAttendance[]) => {
    try {
      // Create CSV content
      const headers = ['Student ID', 'Name', 'Department', 'Course', 'Year Level', 'Attendance Rate', 'Status', 'Present Days', 'Absent Days', 'Late Days'];
      const csvContent = [
        headers.join(','),
        ...selectedStudents.map(student => [
          student.studentId,
          student.studentName,
          student.department,
          student.course,
          student.yearLevel,
          `${student.attendanceRate}%`,
          student.status,
          student.presentDays,
          student.absentDays,
          student.lateDays
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `selected_students_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${selectedStudents.length} students successfully`);
    } catch (error) {
      console.error('Error exporting students:', error);
      toast.error('Failed to export students');
    }
  };

  const handleBulkNotifyStudents = (selectedStudents: StudentAttendance[]) => {
    // This would typically open a notification dialog
    toast.success(`Notification dialog will open for ${selectedStudents.length} students`);
    // TODO: Implement notification dialog
  };

  const handleBulkUpdateStatus = (selectedStudents: StudentAttendance[]) => {
    setSelectedStudentsForBulkAction(selectedStudents);
    setBulkActionsDialogOpen(true);
  };

  const handleBulkActionComplete = (actionType: string, results: any) => {
    console.log(`Bulk action completed: ${actionType}`, results);
    
    // Refresh data after bulk action
    refreshStudentsData();
    
    // Show success message based on action type
    switch (actionType) {
      case 'status-update':
        toast.success(`Successfully updated ${results.updated} attendance records`);
        break;
      case 'notification':
        toast.success(`Successfully sent ${results.sent} notifications`);
        break;
      case 'export':
        toast.success(`Successfully exported ${results.exported} students`);
        break;
      default:
        toast.success('Bulk action completed successfully');
    }
  };

  // Analytics state for API data
  type AnalyticsTab = 'department' | 'year' | 'course' | 'section' | 'subject';
  type ChartType = 'line' | 'bar' | 'heatmap';
  type TimeRange = 'today' | 'week' | 'month' | 'semester' | 'custom';
  
  // Enhanced Analytics State - REMOVED: Duplicate declaration
  
  // New UI/UX State Variables
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  
  // Collapsible sections state
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState<boolean>(true);
  
  // Status and Risks tab filter states
  const [riskLevelFilter, setRiskLevelFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [showRiskReportDialog, setShowRiskReportDialog] = useState(false);
  
  // Subjects Analytics tab filter states
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [subjectTimeRange, setSubjectTimeRange] = useState<'week' | 'month' | 'semester'>('month');
  const [subjectDepartmentFilter, setSubjectDepartmentFilter] = useState<string>('all');
  const [showSubjectReportDialog, setShowSubjectReportDialog] = useState(false);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState<boolean>(true);
  

  
  // Advanced Filter Dialog state
  const [isAdvancedFilterDialogOpen, setIsAdvancedFilterDialogOpen] = useState<boolean>(false);
  


  // Ensure all analytics tabs are initialized
  const getAnalyticsDataForTab = (tab: string): any[] => {
    const analyticsTab = tab as AnalyticsTab;
    return analyticsData[analyticsTab] || [];
  };

  const getAnalyticsLoadingForTab = (tab: string): boolean => {
    const analyticsTab = tab as AnalyticsTab;
    return analyticsLoading[analyticsTab] || false;
  };

  const getAnalyticsErrorForTab = (tab: string): string | null => {
    const analyticsTab = tab as AnalyticsTab;
    return analyticsError[analyticsTab] || null;
  };
  const [analyticsLoading, setAnalyticsLoading] = useState<Record<AnalyticsTab, boolean>>({
    department: false,
    year: false,
    course: false,
    section: false,
    subject: false,
  });
  const [analyticsError, setAnalyticsError] = useState<Record<AnalyticsTab, string | null>>({
    department: null,
    year: null,
    course: null,
    section: null,
    subject: null,
  });

  // Function to fetch analytics data for a specific tab
  const fetchAnalyticsData = async (tab: AnalyticsTab) => {
    try {
      console.log(`Fetching analytics data for tab: ${tab}`);
      setAnalyticsLoading(prev => ({ ...prev, [tab]: true }));
      setAnalyticsError(prev => ({ ...prev, [tab]: null }));
      
      const response = await fetch(`/api/attendance/dashboard?groupBy=${tab}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${tab} analytics data`);
      }
      
      const data = await response.json();
      console.log(`Received data for ${tab}:`, data);
      
      // Handle different response structures
      let stats: any[] = [];
      if (tab === 'department') {
        // Department returns the old structure with 'departments' array
        stats = data.departments || [];
      } else {
        // Other tabs return { stats: [...] }
        stats = data.stats || [];
      }
      
      // Add missing properties to match expected structure
      stats = stats.map((item: any) => ({
        ...item,
        children: item.children || [],
        trend: item.trend || 0
      }));
      
      console.log(`Setting analytics data for ${tab}:`, stats);
      setAnalyticsData((prev: any) => ({ ...prev, [tab]: stats }));
    } catch (error) {
      console.error(`Error fetching ${tab} analytics:`, error);
      setAnalyticsError((prev: any) => ({ 
        ...prev, 
        [tab]: error instanceof Error ? error.message : `Failed to load ${tab} data` 
      }));
    } finally {
      console.log(`Setting loading to false for ${tab}`);
      setAnalyticsLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  // Fetch analytics data when tab changes - REMOVED: Dashboard functionality removed
  useEffect(() => {
    if (isAnalyticsDialogOpen) {
      // fetchAnalyticsData(activeAnalyticsTab as AnalyticsTab); // Dashboard functionality removed
    }
  }, [isAnalyticsDialogOpen]); // activeAnalyticsTab removed

  // Function to get filtered and sorted analytics data
  const getFilteredAnalyticsData = (tab: AnalyticsTab) => {
    let data = analyticsData[tab] || [];
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = [];
    }
    
    // Add safety checks for each item
    data = data.map((item: any, index: number) => ({
      id: item?.id || `item-${index}`,
      name: item?.name || 'Unknown',
      rate: item?.rate || 0,
      present: item?.present || 0,
      total: item?.total || 0,
      children: item?.children || [],
      trend: item?.trend || 0
    }));
    
    // Filter by search query
    if (analyticsSearchQuery) {
      data = data.filter((item: any) => 
        item.name.toLowerCase().includes(analyticsSearchQuery.toLowerCase())
      );
    }
    
    // Sort data
    data.sort((a: any, b: any) => {
      switch (analyticsSortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rate':
          return b.rate - a.rate;
        case 'total':
          return b.total - a.total;
        default:
          return b.rate - a.rate;
      }
    });
    
    return data;
  };

  // Trend Indicator Component
  const TrendIndicator = ({ trend }: { trend: number }) => {
    const isPositive = trend > 0;
    const isNeutral = Math.abs(trend) < 0.5;
    return (
      <div className={`flex items-center gap-1 text-xs ${
        isNeutral ? 'text-gray-500' : 
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : isNeutral ? (
          <Minus className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="font-medium">
          {isPositive ? '+' : ''}{trend.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Enhanced UI/UX Components
  
  // Collapsible Section Component
  const CollapsibleSection = ({ 
    title, 
    children, 
    isCollapsed, 
    onToggle, 
    icon: Icon,
    badge,
    compact = false 
  }: { 
    title: string; 
    children: React.ReactNode; 
    isCollapsed: boolean; 
    onToggle: () => void; 
    icon?: any;
    badge?: string;
    compact?: boolean;
  }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${compact ? 'mb-3' : 'mb-4'}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 text-gray-600" />}
          <span className="font-semibold text-gray-700 text-sm">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isCollapsed ? 'rotate-180' : ''
          }`} 
        />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-96 opacity-100'
      }`}>
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
  
  // Compact Chart Type Selector
  const ChartTypeSelector = () => (
    <div className="flex gap-1">
      <Button 
        variant={chartType === 'line' ? 'default' : 'outline'} 
        size="sm"
        className="text-xs px-2 py-1 h-7"
        onClick={() => setChartType('line')}
      >
        <TrendingUp className="w-3 h-3 mr-1" />
        Line
      </Button>
      <Button 
        variant={chartType === 'bar' ? 'default' : 'outline'} 
        size="sm"
        className="text-xs px-2 py-1 h-7"
        onClick={() => setChartType('bar')}
      >
        <BarChart3 className="w-3 h-3 mr-1" />
        Bar
      </Button>
      <Button 
        variant={chartType === 'heatmap' ? 'default' : 'outline'} 
        size="sm"
        className="text-xs px-2 py-1 h-7"
        onClick={() => setChartType('heatmap')}
      >
        <Grid className="w-3 h-3 mr-1" />
        Heat
      </Button>
    </div>
  );

  // Compact Time Range Selector
  const TimeRangeSelector = () => (
    <div className="flex items-center gap-2">
      <CalendarIcon className="w-3 h-3 text-gray-500" />
      <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
        <SelectTrigger className="w-24 h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="semester">Semester</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {timeRange === 'custom' && (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-24 h-7 text-xs"
          />
          <span className="text-gray-500 text-xs">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-24 h-7 text-xs"
          />
        </div>
      )}
    </div>
  );

  // Drill-down Breadcrumb
  const DrillDownBreadcrumb = () => (
    <div className="flex items-center gap-2 mb-4 text-sm">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDrillDownPath([])}
        className="text-blue-600 hover:text-blue-800"
      >
        <Home className="w-4 h-4 mr-1" />
        Overview
      </Button>
      {drillDownPath.map((path, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDrillDownPath(drillDownPath.slice(0, index + 1))}
            className="text-gray-600 hover:text-gray-800"
          >
            {path}
          </Button>
        </div>
      ))}
    </div>
  );

  // Context Panel
  const ContextPanel = ({ selectedItem }: { selectedItem: any }) => {
    if (!selectedItem) return null;
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400 mb-4">
        <h4 className="font-semibold mb-2 text-gray-900">{selectedItem.name}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Attendance Rate:</span>
            <span className="ml-2 font-medium">{selectedItem.rate}%</span>
          </div>
          <div>
            <span className="text-gray-600">Total Students:</span>
            <span className="ml-2 font-medium">{selectedItem.total}</span>
          </div>
          <div>
            <span className="text-gray-600">Present:</span>
            <span className="ml-2 font-medium text-green-600">{selectedItem.present}</span>
          </div>
          <div>
            <span className="text-gray-600">Absent:</span>
            <span className="ml-2 font-medium text-red-600">{selectedItem.total - selectedItem.present}</span>
          </div>
        </div>
      </div>
    );
  };

  // Generate alerts function
  const generateAlerts = () => {
    const alerts: any[] = [];
    Object.values(analyticsData).flat().forEach((item: any) => {
      if (item.rate < 75) {
        alerts.push({
          id: item.id,
          title: `Low Attendance Alert: ${item.name}`,
          description: `Attendance rate is ${item.rate}%, below the 75% threshold`,
          severity: 'critical',
          item: item,
          rate: item.rate,
          category: activeAnalyticsTab
        });
      }
    });
    return alerts;
  };

  // Compact Alert Indicator
  const AlertIndicator = () => {
    const alerts = generateAlerts();
    const alertCount = alerts.length;

    if (alertCount === 0) return null;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 p-0 hover:bg-red-50"
        onClick={() => setIsAlertDialogOpen(true)}
      >
        <AlertTriangle className="w-4 h-4 text-red-500" />
        {alertCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs font-bold animate-pulse"
          >
            {alertCount > 9 ? '9+' : alertCount}
          </Badge>
        )}
      </Button>
    );
  };

  // Alert Details Dialog
  const AlertDialog = () => {
    const alerts = generateAlerts();

    return (
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Attendance Alerts</DialogTitle>
                <DialogDescription>
                  {alerts.length} critical attendance issues detected
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Alerts</h3>
                <p className="text-sm">All attendance rates are above the threshold</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <h4 className="font-semibold text-red-800">{alert.title}</h4>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {alert.rate}%
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700 mb-3">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Category: {alert.category}</span>
                        <span>•</span>
                        <span>Severity: Critical</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(alert.item);
                            setIsAlertDialogOpen(false);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement notification sending
                            console.log('Send notification for:', alert.item);
                          }}
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          Notify
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{alerts.length}</span> alerts requiring attention
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // TODO: Implement bulk notification
                    console.log('Send bulk notifications');
                  }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notify All
                </Button>
                <Button onClick={() => setIsAlertDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Compact Advanced Search
  const AdvancedSearch = () => {
    const handleSearchChange = (value: string) => {
      setAnalyticsSearchQuery(value);
      
      // Generate search suggestions
      if (value.length > 2) {
        const suggestions = Object.values(analyticsData)
          .flat()
          .filter((item: any) => 
            item.name.toLowerCase().includes(value.toLowerCase())
          )
          .slice(0, 5);
        setSearchSuggestions(suggestions);
      } else {
        setSearchSuggestions([]);
      }
    };

    const handleSuggestionClick = (suggestion: any) => {
      setSelectedItem(suggestion);
      setAnalyticsSearchQuery(suggestion.name);
      setSearchSuggestions([]);
    };

    return (
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
        <Input
          placeholder="Search..."
          value={analyticsSearchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-7 pr-2 h-7 text-xs"
        />
        {searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1">
            {searchSuggestions.map(suggestion => (
              <div 
                key={suggestion.id}
                className="p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium text-xs">{suggestion.name}</div>
                <div className="text-xs text-gray-500">Attendance: {suggestion.rate}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Compact Smart Filters
  const SmartFilters = () => {
    const setFilterPreset = (preset: string) => {
      // Apply different filter presets
      switch (preset) {
        case 'lowAttendance':
          // Filter for items with attendance rate < 75%
          break;
        case 'improving':
          // Filter for items with positive trend
          break;
        case 'declining':
          // Filter for items with negative trend
          break;
      }
    };

    const clearFilters = () => {
      setAnalyticsSearchQuery('');
      setSelectedItem(null);
      setFilterPreset('');
    };

    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setFilterPreset('lowAttendance')}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setFilterPreset('improving')}
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Up
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setFilterPreset('declining')}
        >
          <TrendingDown className="w-3 h-3 mr-1" />
          Down
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={clearFilters}
        >
          Clear
        </Button>
      </div>
    );
  };

  // Live Indicator
  const LiveIndicator = () => {
    const [clientTime, setClientTime] = useState<string>('');
    
    useEffect(() => {
      setClientTime(lastRefresh.toLocaleTimeString());
    }, [lastRefresh]);

    return (
      <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates every 30 seconds</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            // fetchAnalyticsData(activeAnalyticsTab as AnalyticsTab); // Dashboard functionality removed
            setLastRefresh(new Date());
          }}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <span className="text-gray-500 text-xs">
          Last updated: {clientTime || '--:--:--'}
        </span>
      </div>
    );
  };

  // Export Options - REMOVED: Dashboard functionality removed
  const ExportOptions = () => {
    const exportData = (format: string) => {
      // const data = getFilteredAnalyticsData(activeAnalyticsTab as AnalyticsTab); // Dashboard functionality removed
      // Implementation for different export formats
      console.log(`Exporting ${format} data:`, []);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exportData('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportData('excel')}>
            <Table className="w-4 h-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportData('csv')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Analytics Skeleton
  const AnalyticsSkeleton = () => (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  // Enhanced Dashboard Components
  const MiniTrendChart = ({ data, color, height = 40 }: { data: any[], color: string, height?: number }) => {
    // Ensure we have valid data
    const validData = data?.filter(d => d && typeof d.value === 'number' && !isNaN(d.value)) || [];
    
    if (validData.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
          <span className="text-xs text-gray-400">No data</span>
        </div>
      );
    }

    // Calculate trend direction for visual enhancement
    const firstValue = validData[0]?.value || 0;
    const lastValue = validData[validData.length - 1]?.value || 0;
    const trend = lastValue - firstValue;
    
    // Adjust opacity based on trend strength
    const opacity = Math.abs(trend) > 5 ? 1 : 0.6;

    return (
    <ResponsiveContainer width="100%" height={height}>
        <LineChart data={validData.slice(-12)}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          dot={false}
            strokeOpacity={opacity}
            strokeDasharray={trend < 0 ? "3 3" : undefined} // Dashed line for negative trends
          />
          {/* Add gradient fill for positive trends */}
          {trend > 0 && (
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
          )}
      </LineChart>
    </ResponsiveContainer>
    );
  };

  // Live Dashboard State
  const [dashboardData, setDashboardData] = useState<{
    summary: {
      totalStudents: number;
      totalPresent: number;
      totalLate: number;
      totalAbsent: number;
      totalExcused: number;
      overallAttendanceRate: number;
      presentPercentage: number;
      latePercentage: number;
      absentPercentage: number;
      excusedPercentage: number;
    };
    departments: Array<{
      name: string;
      present: number;
      total: number;
      rate: number;
    }>;
    lastUpdated: string;
    date: string;
  } | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Student data state
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  // Core data state - stores all student attendance records
  const [studentsData, setStudentsData] = useState<StudentAttendance[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // ============================================================================
  // NEW BACKEND ANALYTICS HOOKS
  // ============================================================================
  // Convert current filters to analytics filters format
  const analyticsFilters = useMemo(() => ({
    startDate: dateRange?.start || undefined,
    endDate: dateRange?.end || undefined,
    departmentId: filters?.departments?.[0] ? parseInt(filters.departments[0]) : undefined,
    courseId: filters?.courses?.[0] ? parseInt(filters.courses[0]) : undefined,
    yearLevel: filters?.yearLevels?.[0] || undefined,
    limit: 10
  }), [dateRange, filters]);

  // Analytics hooks for different chart types
  const weeklyTrends = useTrends('weekly', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Weekly trends error:', error)
  });

  const monthlyTrends = useTrends('monthly', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Monthly trends error:', error)
  });

  const timeOfDayTrends = useTrends('timeOfDay', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Time of day trends error:', error)
  });

  const dayOfWeekTrends = useTrends('dayOfWeek', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Day of week trends error:', error)
  });

  const departmentComparisons = useComparisons('department', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Department comparisons error:', error)
  });

  const yearLevelComparisons = useComparisons('yearLevel', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Year level comparisons error:', error)
  });

  const courseComparisons = useComparisons('course', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Course comparisons error:', error)
  });

  const sectionComparisons = useComparisons('section', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Section comparisons error:', error)
  });

  const attendanceBreakdown = useBreakdown('attendance', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Attendance breakdown error:', error)
  });

  const riskLevelBreakdown = useBreakdown('riskLevel', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Risk level breakdown error:', error)
  });

  const performanceRankings = useRankings('performance', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Performance rankings error:', error)
  });

  const goalAchievement = useRankings('goalAchievement', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Goal achievement error:', error)
  });

  const statisticalComparison = useRankings('statistical', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Statistical comparison error:', error)
  });

  const subjectPerformance = useSubjectAnalytics('performance', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject performance error:', error)
  });

  const subjectTrends = useSubjectAnalytics('trends', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject trends error:', error)
  });

  const subjectTimeAnalysis = useSubjectAnalytics('timeAnalysis', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject time analysis error:', error)
  });

  const subjectComparison = useSubjectAnalytics('comparison', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject comparison error:', error)
  });

  const subjectRiskAnalysis = useSubjectAnalytics('riskAnalysis', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject risk analysis error:', error)
  });

  const subjectPatterns = useSubjectAnalytics('patterns', analyticsFilters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject patterns error:', error)
  });

  const realTimeStats = useRealTimeStats(analyticsFilters, {
    refreshInterval: 30000, // 30 seconds
    onError: (error) => console.error('Real-time stats error:', error)
  });

  const { clearCache, getCacheStats } = useAnalyticsCache();

  // ============================================================================
  // UTILITY FUNCTIONS FOR SAFE MATH OPERATIONS
  // ============================================================================
  
  // Safe division to prevent NaN and Infinity
  const safeDivision = (numerator: number, denominator: number, fallback: number = 0): number => {
    if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
      return fallback;
    }
    const result = numerator / denominator;
    return isFinite(result) ? result : fallback;
  };
  
  // Safe percentage calculation
  const safePercentage = (part: number, total: number, fallback: number = 0): number => {
    return safeDivision(part, total, fallback) * 100;
  };
  
  // Safe average calculation
  const safeAverage = (values: number[], fallback: number = 0): number => {
    const validValues = values.filter(v => v !== undefined && v !== null && !isNaN(v) && isFinite(v));
    if (validValues.length === 0) return fallback;
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    return safeDivision(sum, validValues.length, fallback);
  };
  
  // Safe number conversion for chart data
  const safeNumber = (value: any, fallback: number = 0): number => {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? fallback : num;
  };
  
  // Safe chart data validation
  const validateChartData = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      if (!item || typeof item !== 'object') return item;
      
      const validated = { ...item };
      // Ensure all numeric fields are safe numbers
      Object.keys(validated).forEach(key => {
        if (typeof validated[key] === 'number' || !isNaN(Number(validated[key]))) {
          validated[key] = safeNumber(validated[key], 0);
        }
      });
      return validated;
    });
  };
  
  // Data validation helper
  const validateStudentData = (students: StudentAttendance[]): StudentAttendance[] => {
    return students.filter(student => 
      student && 
      typeof student === 'object' && 
      student.studentId !== undefined &&
      student.studentId !== null
    );
  };

  // Function to fetch dashboard data
  const fetchDashboardData = async (date?: string) => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      
      const queryParams = new URLSearchParams();
      if (date) {
        queryParams.set('date', date);
      }
      
      const response = await fetch(`/api/attendance/dashboard?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardError('Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Function to refresh dashboard data
  const refreshDashboard = () => {
    fetchDashboardData();
  };

  // Function to fetch students data
  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================
  // Fetches student attendance data from the API
  // Handles loading states and error management
  const fetchStudentsData = async () => {
    try {
      setStudentsLoading(true);
      setStudentsError(null);
      
      const queryParams = new URLSearchParams();
      
      // Add filter parameters for V2 API
      if (filters.dateRangeStart) queryParams.set('startDate', filters.dateRangeStart);
      if (filters.dateRangeEnd) queryParams.set('endDate', filters.dateRangeEnd);
      if (filters.departments && filters.departments.length > 0) queryParams.set('departmentCode', filters.departments[0]);
      if (filters.courses && filters.courses.length > 0) queryParams.set('courseId', filters.courses[0]);
      if (filters.yearLevels && filters.yearLevels.length > 0) queryParams.set('yearLevel', filters.yearLevels[0]);
      if (filters.studentStatuses && filters.studentStatuses.length > 0) queryParams.set('status', filters.studentStatuses[0]);
      if (filters.studentTypes && filters.studentTypes.length > 0) queryParams.set('studentType', filters.studentTypes[0]);
      if (filters.enrollmentStatuses && filters.enrollmentStatuses.length > 0) queryParams.set('enrollmentStatus', filters.enrollmentStatuses[0]);
      if (filters.attendanceRates && filters.attendanceRates.length > 0) queryParams.set('attendanceRate', filters.attendanceRates[0]);
      if (filters.riskLevels && filters.riskLevels.length > 0) queryParams.set('riskLevel', filters.riskLevels[0]);
      
      // Add pagination parameters
      queryParams.set('page', page.toString());
      queryParams.set('pageSize', pageSize.toString());
      
      // Add sorting parameters
      if (sortBy) {
        queryParams.set('sortBy', sortBy);
        queryParams.set('sortOrder', 'desc'); // Default to desc for attendance
      }
      
      // Use the new V2 API endpoint
      const response = await fetch(`/api/attendance/students/v2?${queryParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // V2 API returns a different structure
      setStudentsData(data.students || []);
      
      // Update pagination state from V2 API response
      if (data.pagination) {
        // Note: totalPages and totalCount are already handled by existing pagination logic
        console.log('Pagination info:', data.pagination);
      }
      
      console.log('V2 API - Students data loaded successfully:', {
        count: data.students?.length || 0,
        loading: false,
        apiVersion: response.headers.get('x-api-version'),
        cacheStatus: response.headers.get('x-cache-status'),
        sampleStudent: data.students?.[0] ? {
          id: data.students[0].id,
          name: data.students[0].studentName,
          attendanceRate: data.students[0].attendanceRate,
          hasRecentRecords: data.students[0].recentAttendanceRecords?.length > 0,
          recordCount: data.students[0].recentAttendanceRecords?.length || 0
        } : null
      });
    } catch (error) {
      console.error('Error fetching students data from V2 API:', error);
      setStudentsError(error instanceof Error ? error.message : 'Failed to load students data');
      setStudentsData([]); // Fallback to empty array
    } finally {
      setStudentsLoading(false);
      console.log('Loading state set to false');
    }
  };

  // Function to refresh students data
  const refreshStudentsData = async () => {
    setIsRefreshing(true);
    try {
      await fetchStudentsData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchStudentsData();
  }, []);

  // Fetch analytics data when dialog opens - REMOVED: Dashboard functionality removed
  useEffect(() => {
    console.log(`useEffect triggered - isAnalyticsDialogOpen: ${isAnalyticsDialogOpen}`);
    if (isAnalyticsDialogOpen) {
      // fetchAnalyticsData(activeAnalyticsTab as AnalyticsTab); // Dashboard functionality removed
    }
  }, [isAnalyticsDialogOpen]); // activeAnalyticsTab removed

  // Handle analytics tab change
  const handleAnalyticsTabChange = (tab: string) => {
    setActiveAnalyticsTab(tab);
  };

  // API Integration for Real Data
  const [filterOptions, setFilterOptions] = useState<{
    [key: string]: string[];
    departments: string[];
    departmentCodes: string[];
    courses: string[];
    courseCodes: string[];
    sections: string[];
    sectionCodes: string[];
    subjects: string[];
    subjectCodes: string[];
    instructors: string[];
    instructorNames: string[];
    rooms: string[];
    roomNumbers: string[];
    yearLevels: string[];
    riskLevels: string[];
    studentStatuses: string[];
    studentTypes: string[];
    enrollmentStatuses: string[];
    attendanceRates: string[];
    attendanceStatuses: string[];
    timeOfDay: string[];
    attendanceTrends: string[];
    verificationStatus: string[];
    attendanceTypes: string[];
    eventTypes: string[];
    semester: string[];
    academicYear: string[];
    subjectInstructors: string[];
    subjectRooms: string[];
    subjectScheduleDays: string[];
    subjectScheduleTimes: string[];
    instructorTypes: string[];
    roomTypes: string[];
  }>({
    departments: [],
    departmentCodes: [],
    courses: [],
    courseCodes: [],
    sections: [],
    sectionCodes: [],
    subjects: [],
    subjectCodes: [],
    instructors: [],
    instructorNames: [],
    rooms: [],
    roomNumbers: [],
    yearLevels: [],
    riskLevels: [],
    studentStatuses: [],
    studentTypes: [],
    enrollmentStatuses: [],
    attendanceRates: [],
    attendanceStatuses: [],
    timeOfDay: [],
    attendanceTrends: [],
    verificationStatus: [],
    attendanceTypes: [],
    eventTypes: [],
    semester: [],
    academicYear: [],
    subjectInstructors: [],
    subjectRooms: [],
    subjectScheduleDays: [],
    subjectScheduleTimes: [],
    instructorTypes: [],
    roomTypes: []
  });

  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      
      // Fetch filter options from the API
      const response = await fetch('/api/attendance/filters');
      if (!response.ok) {
        throw new Error('Failed to fetch filter options');
      }
      
      const data = await response.json();
      
      // Transform the API data to match our filter structure
      const transformedOptions: any = {
        // Department filters - use displayName for better UX
        departments: data.departments ? data.departments.map((d: any) => String(d.displayName)) : [],
        departmentCodes: data.departments ? data.departments.map((d: any) => String(d.code)) : [],
        
        // Course filters - use code for better UX
        courses: data.courses ? data.courses.map((c: any) => String(c.code)) : [],
        courseCodes: data.courses ? data.courses.map((c: any) => String(c.code)) : [],
        
        // Section filters - use code for better UX
        sections: data.sections ? data.sections.map((s: any) => String(s.name)) : [],
        sectionCodes: data.sections ? data.sections.map((s: any) => String(s.name)) : [],
        
        // Subject filters - use code for better UX
        subjects: data.subjects ? data.subjects.map((s: any) => String(s.code)) : [],
        subjectCodes: data.subjects ? data.subjects.map((s: any) => String(s.code)) : [],
        
        // Instructor filters - use displayName for better UX
        instructors: data.instructors ? data.instructors.map((i: any) => String(i.displayName)) : [],
        instructorNames: data.instructors ? data.instructors.map((i: any) => String(i.name)) : [],
        
        // Room filters - use displayName for better UX
        rooms: data.rooms ? data.rooms.map((r: any) => String(r.displayName)) : [],
        roomNumbers: data.rooms ? data.rooms.map((r: any) => String(r.name)) : [],
        
        // Schedule filters - from database
        subjectScheduleDays: data.scheduleDays ? data.scheduleDays.map(String) : [],
        subjectScheduleTimes: data.scheduleTimes ? data.scheduleTimes.map(String) : [],
        
        // Student-based filters - from database
        yearLevels: data.yearLevels ? data.yearLevels.map(String) : [],
        studentStatuses: data.studentStatuses ? data.studentStatuses.map(String) : [],
        studentTypes: data.studentTypes ? data.studentTypes.map(String) : [],
        
        // Instructor-based filters - from database
        instructorTypes: data.instructorTypes ? data.instructorTypes.map(String) : [],
        
        // Room-based filters - from database
        roomTypes: data.roomTypes ? data.roomTypes.map(String) : [],
        
        // Static filter options (not from database)
        riskLevels: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
        enrollmentStatuses: ['ENROLLED', 'DROPPED', 'GRADUATED', 'TRANSFERRED'],
        attendanceRates: ['High (90-100%)', 'Good (75-89%)', 'Fair (60-74%)', 'Low (<60%)'],
        attendanceStatuses: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
        timeOfDay: ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'],
        attendanceTrends: ['Improving', 'Declining', 'Stable', 'Fluctuating'],
        verificationStatus: ['PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED'],
        attendanceTypes: ['RFID_SCAN', 'MANUAL_ENTRY', 'ONLINE'],
        eventTypes: ['REGULAR_CLASS', 'MAKEUP_CLASS', 'EXAM', 'SPECIAL_EVENT'],
        semester: ['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER'],
        academicYear: ['2023-2024', '2024-2025', '2025-2026'],
        
        // Legacy properties for backward compatibility
        subjectInstructors: data.instructors ? data.instructors.map((i: any) => String(i.displayName)) : [],
        subjectRooms: data.rooms ? data.rooms.map((r: any) => String(r.displayName)) : [],
      };
      
      setFilterOptions(transformedOptions);
      console.log('Filter options loaded successfully:', {
        departments: transformedOptions.departments.length,
        courses: transformedOptions.courses.length,
        subjects: transformedOptions.subjects.length,
        instructors: transformedOptions.instructors.length,
        rooms: transformedOptions.rooms.length,
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Fallback to mock data if API fails
      setFilterOptions({
        departments: ['CS - Computer Science', 'IT - Information Technology', 'CE - Computer Engineering'],
        departmentCodes: ['CS', 'IT', 'CE'],
        courses: ['BSCS', 'BSIT', 'BSCE'],
        courseCodes: ['BSCS', 'BSIT', 'BSCE'],
        sections: ['A', 'B', 'C', 'D'],
        sectionCodes: ['A', 'B', 'C', 'D'],
        subjects: ['Programming', 'Database', 'Web Development', 'Networking'],
        subjectCodes: ['CS101', 'CS201', 'CS301', 'CS401'],
        instructors: ['John Doe', 'Jane Smith', 'Mike Johnson'],
        instructorNames: ['John Doe', 'Jane Smith', 'Mike Johnson'],
        rooms: ['Room 101', 'Room 102', 'Room 103'],
        roomNumbers: ['101', '102', '103'],
        yearLevels: ['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR'],
        riskLevels: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
        studentStatuses: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        studentTypes: ['REGULAR', 'IRREGULAR'],
        enrollmentStatuses: ['ENROLLED', 'DROPPED', 'GRADUATED', 'TRANSFERRED'],
        attendanceRates: ['High (90-100%)', 'Good (75-89%)', 'Fair (60-74%)', 'Low (<60%)'],
        attendanceStatuses: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
        timeOfDay: ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'],
        attendanceTrends: ['Improving', 'Declining', 'Stable', 'Fluctuating'],
        verificationStatus: ['PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED'],
        attendanceTypes: ['RFID_SCAN', 'MANUAL_ENTRY', 'ONLINE'],
        eventTypes: ['REGULAR_CLASS', 'MAKEUP_CLASS', 'EXAM', 'SPECIAL_EVENT'],
        semester: ['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER'],
        academicYear: ['2023-2024', '2024-2025', '2025-2026'],
        subjectScheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        subjectScheduleTimes: ['8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM'],
        instructorTypes: ['FULL_TIME', 'PART_TIME'],
        roomTypes: ['LECTURE', 'LABORATORY', 'CONFERENCE', 'OFFICE'],
        subjectInstructors: ['John Doe', 'Jane Smith', 'Mike Johnson'],
        subjectRooms: ['Room 101', 'Room 102', 'Room 103'],
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Enhanced fetchStudentsData with API integration
  const fetchStudentsDataWithAPI = useCallback(async () => {
    try {
      setStudentsLoading(true);
      
      // Build query parameters from filters
      const params = new URLSearchParams();
      
      if (filters.departments.length > 0) {
        // Extract department code from the display name (e.g., "CS - Computer Science" -> "CS")
        const selectedDepartment = filters.departments[0];
        const departmentCode = selectedDepartment.split(' - ')[0];
        params.append('departmentCode', departmentCode);
      }
      if (filters.courses.length > 0) {
        params.append('courseId', filters.courses[0]);
      }
      if (filters.yearLevels.length > 0) {
        params.append('yearLevel', filters.yearLevels[0]);
      }
      if (filters.studentStatuses.length > 0) {
        params.append('status', filters.studentStatuses[0]);
      }
      if (filters.dateRangeStart) {
        params.append('startDate', filters.dateRangeStart);
      }
      if (filters.dateRangeEnd) {
        params.append('endDate', filters.dateRangeEnd);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/attendance/students?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students data');
      }
      
      const data = await response.json();
      setStudentsData(data.students || []);
      
    } catch (error) {
      console.error('Error fetching students data:', error);
      // Fallback to existing fetchStudentsData if API fails
      fetchStudentsData();
    } finally {
      setStudentsLoading(false);
    }
  }, [filters, searchQuery, fetchStudentsData]);

  // Enhanced fetchDashboardData with API integration
  const fetchDashboardDataWithAPI = useCallback(async (date?: string) => {
    try {
      setDashboardLoading(true);
      
      const params = new URLSearchParams();
      if (date) {
        params.append('date', date);
      }
      params.append('groupBy', 'department');
      
      const response = await fetch(`/api/attendance/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      // Update dashboard state with real data
      if (data.departments) {
        setDepartmentBreakdownLoading(data.departments);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to existing fetchDashboardData if API fails
      fetchDashboardData(date);
    } finally {
      setDashboardLoading(false);
    }
  }, [fetchDashboardData]);

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshDashboard();
        refreshStudentsData();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);

  // Refetch students when filters change
  useEffect(() => {
    fetchStudentsDataWithAPI();
  }, [filters.dateRangeStart, filters.dateRangeEnd, fetchStudentsDataWithAPI]);

  const { departments, departmentCodes, courses, yearLevels, attendanceRates, riskLevels, studentStatuses, studentTypes, sections, subjectEnrollments, subjects, subjectInstructors, subjectRooms, subjectScheduleDays, subjectScheduleTimes } = useMemo(() => {
          // Use API filter options if available, otherwise fallback to derived from studentsData
      if (filterOptions.departments.length > 0) {
        return {
          departments: filterOptions.departments,
          departmentCodes: filterOptions.departmentCodes || [],
          courses: filterOptions.courses,
          yearLevels: filterOptions.yearLevels,
          attendanceRates: filterOptions.attendanceRates,
          riskLevels: filterOptions.riskLevels,
          studentStatuses: filterOptions.studentStatuses,
          studentTypes: filterOptions.studentTypes,
          sections: filterOptions.sections,
          subjectEnrollments: filterOptions.subjects,
          subjects: filterOptions.subjects,
          subjectInstructors: filterOptions.subjectInstructors,
          subjectRooms: filterOptions.subjectRooms,
          subjectScheduleDays: filterOptions.subjectScheduleDays,
          subjectScheduleTimes: filterOptions.subjectScheduleTimes
        };
      }
    
    // Fallback to deriving from studentsData if API options not loaded yet
    return {
      departments: [...new Set((studentsData || []).map(s => s.department))],
      departmentCodes: [...new Set((studentsData || []).map(s => s.department?.split(' - ')[0]).filter(Boolean))], // Extract department codes
      courses: [...new Set((studentsData || []).map(s => s.course))],
      yearLevels: [...new Set((studentsData || []).map(s => 
        typeof s.yearLevel === 'string' && s.yearLevel.includes('_') 
          ? s.yearLevel.replace('_', ' ') 
          : s.yearLevel
      ))],
      attendanceRates: ['High (≥90%)', 'Medium (75-89%)', 'Low (<75%)'],
      riskLevels: [...new Set((studentsData || []).map(s => s.riskLevel).filter(Boolean))].filter((x): x is string => typeof x === 'string') as string[],
      studentStatuses: [...new Set((studentsData || []).map(s => s.status))],
      studentTypes: [...new Set((studentsData || []).map(s => s.studentType))],
      sections: [...new Set((studentsData || []).map(s => s.academicInfo?.sectionName || s.sectionInfo?.sectionName).filter(Boolean))].filter((x): x is string => typeof x === 'string') as string[],
      subjectEnrollments: [...new Set((studentsData || []).flatMap(s => s.subjects?.map(subj => subj.subjectCode) || []))],
      // NEW: Subject-based filter options
      subjects: [...new Set((studentsData || []).flatMap(s => s.subjects?.map(subj => subj.subjectName || subj.subjectCode) || []))],
      subjectInstructors: [...new Set((studentsData || []).flatMap(s => s.subjects?.map(subj => subj.instructor).filter(Boolean) || []))],
      subjectRooms: [...new Set((studentsData || []).flatMap(s => s.subjects?.map(subj => subj.room).filter(Boolean) || []))],
      subjectScheduleDays: [...new Set((studentsData || []).flatMap(s => s.subjects?.map(subj => subj.schedule?.dayOfWeek).filter(Boolean) || []))],
      subjectScheduleTimes: ['Morning', 'Afternoon', 'Evening', '8:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00']
    };
  }, [studentsData, filterOptions]);



  // Memoize filtered/sorted data (after state declarations)
  const filteredStudents = useMemo(() => {
    if (!studentsData || studentsData.length === 0) return [];
    
    return studentsData.filter(student => {
      const attendanceDate = student.lastAttendance?.split('T')[0] || '';
      const inDateRange = (!filters.dateRangeStart || attendanceDate >= filters.dateRangeStart) &&
                         (!filters.dateRangeEnd || attendanceDate <= filters.dateRangeEnd);
      const matchesSearch = (student.studentName?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (student.studentId?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (student.email?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (student.department?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (student.course?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
      
      // Apply filters
      const matchesDepartment = filters.departments.length === 0 || filters.departments.some(deptCode => {
        // Extract department code from student's department (e.g., "CS - Computer Science" -> "CS")
        const studentDeptCode = student.department?.split(' - ')[0];
        return deptCode === studentDeptCode;
      });
      const matchesCourse = filters.courses.length === 0 || filters.courses.includes(student.course || '');
      
      const studentYearLevel = typeof student.yearLevel === 'string' && student.yearLevel.includes('_') 
        ? student.yearLevel.replace('_', ' ') 
        : student.yearLevel || '';
      const matchesYearLevel = filters.yearLevels.length === 0 || filters.yearLevels.includes(studentYearLevel);
      
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
      const matchesStudentStatus = filters.studentStatuses.length === 0 || filters.studentStatuses.includes(student.status || '');
      const matchesStudentType = filters.studentTypes.length === 0 || filters.studentTypes.includes(student.studentType || '');
      const matchesSection = filters.sections.length === 0 || filters.sections.includes(student.academicInfo?.sectionName || '');
      
      // --- NEW: Attendance Type Filter ---
      const today = new Date().toISOString().split('T')[0];
      let todaysStatus = undefined;
      if (student.recentAttendanceRecords && Array.isArray(student.recentAttendanceRecords)) {
        const todaysRecord = student.recentAttendanceRecords.find(r => r.timestamp.startsWith(today));
        todaysStatus = todaysRecord?.status; // 'PRESENT', 'LATE', 'ABSENT'
      }
      const matchesAttendanceType =
        !advancedFilters.attendanceTypes || advancedFilters.attendanceTypes.length === 0 ||
        (todaysStatus && advancedFilters.attendanceTypes.includes(todaysStatus));
      // --- END NEW ---
      
      // --- NEW: Subject-based Filters ---
      const matchesSubject = filters.subjects.length === 0 || 
        student.subjects?.some(subject => filters.subjects.includes(subject.subjectCode || subject.subjectName));
      
      const matchesSubjectInstructor = filters.subjectInstructors.length === 0 ||
        student.subjects?.some(subject => 
          subject.instructor && filters.subjectInstructors.includes(subject.instructor)
        );
      
      const matchesSubjectRoom = filters.subjectRooms.length === 0 ||
        student.subjects?.some(subject => 
          subject.room && filters.subjectRooms.includes(subject.room)
        );
      
      const matchesSubjectScheduleDay = advancedFilters.subjectScheduleDays.length === 0 ||
        student.subjects?.some(subject => 
          subject.schedule?.dayOfWeek && advancedFilters.subjectScheduleDays.includes(subject.schedule.dayOfWeek)
        );
      
      const subjectScheduleTimes = Array.isArray(advancedFilters.subjectScheduleTimes)
        ? advancedFilters.subjectScheduleTimes
        : advancedFilters.subjectScheduleTimes
          ? [advancedFilters.subjectScheduleTimes]
          : [];
      
      const matchesSubjectScheduleTime = advancedFilters.subjectScheduleTimes.length === 0 ||
        student.subjects?.some(subject => {
          if (!subject.schedule?.startTime) return false;
          return subjectScheduleTimes.some(timeRange => {
            // Parse time range (e.g., "8:00-10:00", "Morning", "Afternoon")
            if (timeRange === 'Morning' && subject.schedule.startTime < '12:00') return true;
            if (timeRange === 'Afternoon' && subject.schedule.startTime >= '12:00' && subject.schedule.startTime < '17:00') return true;
            if (timeRange === 'Evening' && subject.schedule.startTime >= '17:00') return true;
            // Handle specific time ranges
            if (timeRange.includes('-')) {
              const [start, end] = timeRange.split('-');
              return subject.schedule.startTime >= start && subject.schedule.startTime <= end;
            }
            return false;
          });
        });
      
      return inDateRange && matchesSearch && matchesDepartment && matchesCourse && 
             matchesYearLevel && matchesAttendanceRate && matchesRiskLevel && 
             matchesStudentStatus && matchesStudentType && matchesSection &&
             matchesAttendanceType && matchesSubject && matchesSubjectInstructor && 
             matchesSubjectRoom && matchesSubjectScheduleDay && matchesSubjectScheduleTime;
    });
  }, [studentsData, debouncedSearch, dateRange, filters, advancedFilters]);
  const departmentTrends = useMemo(() => {
    const map = new Map<string, { name: string; avgAttendance: number; count: number }>();
    filteredStudents.forEach(student => {
      const deptName = student.department || 'Unknown';
      if (!map.has(deptName)) {
        map.set(deptName, { name: deptName, avgAttendance: 0, count: 0 });
      }
      const dept = map.get(deptName)!;
      dept.avgAttendance += student.attendanceRate;
      dept.count += 1;
    });
    return Array.from(map.values()).map(dept => ({
      ...dept,
      avgAttendance: dept.avgAttendance / dept.count
    }));
  }, [filteredStudents]);
  
  const absenceHeatmapData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = days.map(day => ({ day, absences: 0 }));
    filteredStudents.forEach(student => {
      (student.recentAttendanceRecords || []).forEach((record: { status: string; timestamp: string }) => {
        if (record.status === 'ABSENT') {
          const date = new Date(record.timestamp);
          const dayIdx = date.getDay();
          result[dayIdx].absences += 1;
        }
      });
    });
    return result;
  }, [filteredStudents]);
  const courseTrends = useMemo(() => {
    const map = new Map<string, { name: string; avgAttendance: number; count: number }>();
    filteredStudents.forEach(student => {
      const courseName = student.course || 'Unknown';
      if (!map.has(courseName)) {
        map.set(courseName, { name: courseName, avgAttendance: 0, count: 0 });
      }
      const course = map.get(courseName)!;
      course.avgAttendance += student.attendanceRate;
      course.count += 1;
    });
    return Array.from(map.values()).map(course => ({
      ...course,
      avgAttendance: course.avgAttendance / course.count
    }));
  }, [filteredStudents]);
  
  const sectionTrends = useMemo(() => {
    const map = new Map<string, { name: string; avgAttendance: number; count: number }>();
    filteredStudents.forEach(student => {
      const section = student.academicInfo?.sectionName || student.sectionInfo?.sectionName || 'Unknown';
      if (!map.has(section)) {
        map.set(section, { name: section, avgAttendance: 0, count: 0 });
      }
      const sec = map.get(section)!;
      sec.avgAttendance += student.attendanceRate;
      sec.count += 1;
    });
    return Array.from(map.values()).map(sec => ({
      ...sec,
      avgAttendance: sec.avgAttendance / sec.count
    }));
  }, [filteredStudents]);
  // Update sortedStudents to handle sort options
  const sortedStudents = useMemo(() => {
    const arr = [...filteredStudents];
    if (sortBy === 'attendance-desc') return arr.sort((a, b) => b.attendanceRate - a.attendanceRate);
    if (sortBy === 'attendance-asc') return arr.sort((a, b) => a.attendanceRate - b.attendanceRate);
    if (sortBy === 'name') return arr.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    if (sortBy === 'id') return arr.sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''));
    if (sortBy === 'department') return arr.sort((a, b) => (a.department || '').localeCompare(b.department || ''));
    if (sortBy === 'course') return arr.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
    if (sortBy === 'year-level') return arr.sort((a, b) => (a.yearLevel || '').localeCompare(b.yearLevel || ''));
    if (sortBy === 'status') return arr.sort((a, b) => {
      const getStatus = (s: StudentAttendance) => s.attendanceRate >= 90 ? 0 : s.attendanceRate >= 75 ? 1 : 2;
      return getStatus(a) - getStatus(b);
    });
    return arr;
  }, [filteredStudents, sortBy]);

  // Ensure current page is valid when data changes
  useEffect(() => {
    const maxPage = Math.ceil(sortedStudents.length / pageSize);
    if (page > maxPage && maxPage > 0) {
      setPage(maxPage);
    }
  }, [sortedStudents.length, pageSize, page]);

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / pageSize);
  const paginatedStudents = sortedStudents.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = sortedStudents.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, sortedStudents.length);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    
    // Calculate new total pages and adjust current page if needed
    const newTotalPages = Math.ceil(sortedStudents.length / newPageSize);
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    // Update URL for better UX (optional)
    const url = new URL(window.location.href);
    url.searchParams.set('pageSize', newPageSize.toString());
    url.searchParams.set('page', newPage.toString());
    window.history.replaceState({}, '', url.toString());
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    
    // Update URL for better UX (optional)
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.replaceState({}, '', url.toString());
  };

  // Calculate time-range-specific attendance statistics
  const calculateTimeRangeStats = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    if (activeRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (activeRange === 'week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else { // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // For demo purposes, we'll simulate time-range-specific data
    // In a real app, you would filter actual attendance records by date
    let totalPresent = 0, totalLate = 0, totalAbsent = 0;
    
    filteredStudents.forEach(student => {
      // Simulate different attendance patterns based on time range
      const basePresent = student.presentDays || 0;
      const baseLate = student.lateDays || 0;
      const baseAbsent = student.absentDays || 0;
      
      if (activeRange === 'today') {
        // For today, use a smaller portion of the data
        totalPresent += Math.floor(basePresent * 0.1); // 10% of total present days
        totalLate += Math.floor(baseLate * 0.1);
        totalAbsent += Math.floor(baseAbsent * 0.1);
      } else if (activeRange === 'week') {
        // For week, use about 25% of the data
        totalPresent += Math.floor(basePresent * 0.25);
        totalLate += Math.floor(baseLate * 0.25);
        totalAbsent += Math.floor(baseAbsent * 0.25);
      } else {
        // For month, use about 50% of the data
        totalPresent += Math.floor(basePresent * 0.5);
        totalLate += Math.floor(baseLate * 0.5);
        totalAbsent += Math.floor(baseAbsent * 0.5);
      }
    });

    return { totalPresent, totalLate, totalAbsent };
  };

  // Function to get time-based attendance data for summary cards
  const getTimeBasedAttendanceData = (attendanceType: 'present' | 'late' | 'absent') => {
    const now = new Date();
    let start: Date, end: Date;
    
    if (activeRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (activeRange === 'week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    // Use the full dataset for summary cards, not the filtered data
    const timeRangeStudents = (studentsData || []).filter(student => {
      // In a real app, you'd filter by actual attendance dates
      return true;
    });
    
    let count = 0;
    let totalDays = 0;
    
    switch (attendanceType) {
      case 'present':
        count = timeRangeStudents.reduce((sum, s) => sum + (s.presentDays || 0), 0);
        totalDays = timeRangeStudents.reduce((sum, s) => sum + (s.totalDays || 0), 0);
        break;
      case 'late':
        count = timeRangeStudents.reduce((sum, s) => sum + (s.lateDays || 0), 0);
        totalDays = timeRangeStudents.reduce((sum, s) => sum + (s.totalDays || 0), 0);
        break;
      case 'absent':
        count = timeRangeStudents.reduce((sum, s) => sum + (s.absentDays || 0), 0);
        totalDays = timeRangeStudents.reduce((sum, s) => sum + (s.totalDays || 0), 0);
        break;
    }
    
    // Apply realistic time range scaling based on actual calendar days
    const totalDaysInRange = activeRange === 'today' ? 1 : 
                            activeRange === 'week' ? 7 : 
                            new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const scalingFactor = totalDaysInRange / daysInMonth;
    
    count = Math.round(count * scalingFactor);
    totalDays = Math.round(totalDays * scalingFactor);
    
    return {
      count,
      totalDays,
      percentage: totalDays > 0 ? Math.round((count / totalDays) * 100) : 0
    };
  };

  const { totalPresent, totalLate, totalAbsent } = calculateTimeRangeStats();

  // Calculate statistics
  const totalStudents = filteredStudents.length;
  const averageAttendanceRate = filteredStudents.reduce((acc, student) => acc + student.attendanceRate, 0) / totalStudents || 0;

  const allSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selected.has(s.id));
  const onSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedStudents.map(s => s.id)));
    }
  };

  // Actions column renderer with access to component state
  const renderActionsColumn = (student: StudentAttendance) => (
    <div className="flex items-center justify-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 transition-all duration-110 hover:scale-200 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setViewStudent(student);
                setViewDialogOpen(true);
              }}
            >
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                handleStudentClick(student);
              }}
            >
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Student</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {canDeleteStudents && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canDeleteStudents) {
                    toast.error('You do not have permission to delete students');
                    return;
                  }
                  setStudentToDelete(student);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Student</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  // Add state for advanced filter row visibility
  const [showAdvancedFiltersRow, setShowAdvancedFiltersRow] = useState<boolean>(false);
  
  // Chart-specific filter state
  // ============================================================================
  // DRILL-DOWN STATE MANAGEMENT
  // ============================================================================
  // State and functions for managing drill-down navigation and data exploration

  const [drillDownState, setDrillDownState] = useState<DrillDownState>({
    isActive: false,
    currentLevel: 'overview',
    breadcrumbs: [],
    selectedData: null,
    drillPath: [],
    contextData: null
  });

  const [drillDownContext, setDrillDownContext] = useState<DrillDownContext | null>(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  const [chartFilters, setChartFilters] = useState<ChartFilterState>({
    'weekly-trend': {
      timeGranularity: 'weekly',
      comparisonPeriod: 'previous_week',
      trendSmoothing: 'none',
      chartType: 'line',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'monthly-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'previous_month',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'time-of-day': {
      timeGranularity: 'hourly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'day-of-week': {
      timeGranularity: 'daily',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'department-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'previous_month',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'year-level-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'previous_month',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'course-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'previous_month',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'section-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'previous_month',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'rate-distribution-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'previous_month',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'sum',
      colorScheme: 'categorical'
    },

    'improvement-analysis': {
      timeGranularity: 'weekly',
      comparisonPeriod: 'previous_week',
      trendSmoothing: 'moving_average',
      chartType: 'line',
      showProjections: true,
      showConfidenceIntervals: true,
      highlightOutliers: true,
      dataAggregation: 'average',
      colorScheme: 'diverging'
    },
    'attendance-breakdown': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'pie',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'sum',
      colorScheme: 'categorical'
    },
    'risk-level-breakdown': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'doughnut',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'sum',
      colorScheme: 'categorical'
    },
    'attendance-forecast': {
      timeGranularity: 'daily',
      comparisonPeriod: 'none',
      trendSmoothing: 'moving_average',
      chartType: 'line',
      showProjections: true,
      showConfidenceIntervals: true,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'late-arrival-trends': {
      timeGranularity: 'weekly',
      comparisonPeriod: 'previous_week',
      trendSmoothing: 'none',
      chartType: 'line',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: true,
      dataAggregation: 'average',
      colorScheme: 'diverging'
    },
    'attendance-goal-tracking': {
      timeGranularity: 'weekly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'line',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'performance-ranking': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'horizontal-bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'diverging'
    },
    'goal-achievement': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'goal-gap-analysis': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: true,
      dataAggregation: 'average',
      colorScheme: 'diverging'
    },
    'goal-setting-dashboard': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'pie',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'sum',
      colorScheme: 'categorical'
    },
    'goal-trend-analysis': {
      timeGranularity: 'weekly',
      comparisonPeriod: 'none',
      trendSmoothing: 'moving_average',
      chartType: 'line',
      showProjections: true,
      showConfidenceIntervals: true,
      highlightOutliers: true,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'statistical-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: true,
      highlightOutliers: true,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'subject-performance': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    },
    'subject-trends': {
      timeGranularity: 'weekly',
      comparisonPeriod: 'none',
      trendSmoothing: 'moving_average',
      chartType: 'line',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'subject-time-analysis': {
      timeGranularity: 'daily',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'diverging'
    },
    'subject-comparison': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'horizontal-bar',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'subject-risk-analysis': {
      timeGranularity: 'monthly',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'doughnut',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'categorical'
    },
    'subject-patterns': {
      timeGranularity: 'daily',
      comparisonPeriod: 'none',
      trendSmoothing: 'none',
      chartType: 'heatmap',
      showProjections: false,
      showConfidenceIntervals: false,
      highlightOutliers: false,
      dataAggregation: 'average',
      colorScheme: 'sequential'
    }
  });

  // ============================================================================
  // DRILL-DOWN NAVIGATION FUNCTIONS
  // ============================================================================
  // Functions for handling drill-down navigation and data exploration

  const handleDrillDownAction = (action: string) => {
    console.log(`Drill-down action: ${action}`);
    
    switch (action) {
      case 'Export Data':
        handleExportCSV();
        break;
      case 'Send Notifications':
        toast.info('Notification system would be triggered');
        break;
      case 'Generate Report':
        handleExportPDF();
        break;
      case 'Schedule Meeting':
        toast.info('Meeting scheduler would be opened');
        break;
      case 'Review Low Attendance Students':
        // Filter to show only low attendance students
        setFilters(prev => ({
          ...prev,
          attendanceRates: ['<75%']
        }));
        break;
      case 'Analyze Course Patterns':
        toast.info('Course pattern analysis would be initiated');
        break;
      case 'Contact At-Risk Students':
        toast.info('At-risk student contact system would be opened');
        break;
      case 'Review Syllabus':
        toast.info('Syllabus review system would be opened');
        break;
      case 'Contact Parent':
        toast.info('Parent contact system would be opened');
        break;
      case 'Review Academic Performance':
        toast.info('Academic performance review would be opened');
        break;
      default:
        toast.info(`Action: ${action}`);
    }
  };

  const generateDrillDownContext = async (level: string, data: any, drillPath: string[]) => {
    try {
      setDrillDownLoading(true);
      
      // Simulate API call for context data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate context based on drill level
      const context: DrillDownContext = {
        summary: generateContextSummary(level, data, drillPath),
        details: generateContextDetails(level, data, drillPath),
        actions: generateContextActions(level, data, drillPath)
      };
      
      setDrillDownContext(context);
      setDrillDownState(prev => ({ ...prev, contextData: context }));
    } catch (error) {
      console.error('Error generating drill-down context:', error);
      toast.error('Failed to load detailed context');
    } finally {
      setDrillDownLoading(false);
    }
  };

  const generateContextSummary = (level: string, data: any, drillPath: string[]) => {
    const students = studentsData || [];
    
    switch (level) {
      case 'department':
        const deptStudents = students.filter(s => s.department === data.name);
        return {
          totalRecords: deptStudents.reduce((sum, s) => sum + (s.totalDays || 0), 0),
          averageRate: deptStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / deptStudents.length,
          trend: data.trend || 0,
          comparison: data.comparison || 0
        };
        
      case 'course':
        const courseStudents = students.filter(s => s.course === data.name);
        return {
          totalRecords: courseStudents.reduce((sum, s) => sum + (s.totalDays || 0), 0),
          averageRate: courseStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / courseStudents.length,
          trend: data.trend || 0,
          comparison: data.comparison || 0
        };
        
      case 'year':
        const yearStudents = students.filter(s => s.yearLevel === data.name);
        return {
          totalRecords: yearStudents.reduce((sum, s) => sum + (s.totalDays || 0), 0),
          averageRate: yearStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / yearStudents.length,
          trend: data.trend || 0,
          comparison: data.comparison || 0
        };
        
      case 'student':
        return {
          totalRecords: data.totalDays || 0,
          averageRate: data.attendanceRate || 0,
          trend: data.trend || 0,
          comparison: data.comparison || 0
        };
        
      default:
        return {
          totalRecords: 0,
          averageRate: 0,
          trend: 0,
          comparison: 0
        };
    }
  };

  const generateContextDetails = (level: string, data: any, drillPath: string[]) => {
    const students = studentsData || [];
    
    switch (level) {
      case 'department':
        const deptStudents = students.filter(s => s.department === data.name);
        return {
          breakdown: [
            { label: 'High Attendance (90%+)', count: deptStudents.filter(s => s.attendanceRate >= 90).length },
            { label: 'Good Attendance (75-89%)', count: deptStudents.filter(s => s.attendanceRate >= 75 && s.attendanceRate < 90).length },
            { label: 'At Risk (<75%)', count: deptStudents.filter(s => s.attendanceRate < 75).length }
          ],
          patterns: [
            { type: 'Peak Days', value: 'Tuesday-Thursday' },
            { type: 'Low Days', value: 'Monday, Friday' },
            { type: 'Peak Hours', value: '9AM-2PM' }
          ],
          anomalies: deptStudents.filter(s => s.attendanceRate < 70).map(s => ({
            type: 'Low Attendance',
            student: s.studentName,
            rate: s.attendanceRate
          })),
          recommendations: [
            'Schedule important classes during peak attendance hours',
            'Implement attendance incentives for Monday classes',
            'Provide additional support for students with <70% attendance'
          ]
        };
        
      case 'course':
        const courseStudents = students.filter(s => s.course === data.name);
        return {
          breakdown: [
            { label: 'High Attendance (90%+)', count: courseStudents.filter(s => s.attendanceRate >= 90).length },
            { label: 'Good Attendance (75-89%)', count: courseStudents.filter(s => s.attendanceRate >= 75 && s.attendanceRate < 90).length },
            { label: 'At Risk (<75%)', count: courseStudents.filter(s => s.attendanceRate < 75).length }
          ],
          patterns: [
            { type: 'Course Type', value: 'Core Course' },
            { type: 'Difficulty Level', value: 'Intermediate' },
            { type: 'Prerequisites', value: 'Year 1 subjects' }
          ],
          anomalies: courseStudents.filter(s => s.attendanceRate < 70).map(s => ({
            type: 'Low Attendance',
            student: s.studentName,
            rate: s.attendanceRate
          })),
          recommendations: [
            'Review course difficulty and prerequisites',
            'Consider additional tutoring sessions',
            'Implement peer study groups'
          ]
        };
        
      default:
        return {
          breakdown: [],
          patterns: [],
          anomalies: [],
          recommendations: []
        };
    }
  };

  const generateContextActions = (level: string, data: any, drillPath: string[]) => {
    switch (level) {
      case 'department':
        return {
          available: ['Export Data', 'Send Notifications', 'Generate Report', 'Schedule Meeting'],
          suggested: ['Review Low Attendance Students', 'Analyze Course Patterns']
        };
        
      case 'course':
        return {
          available: ['Export Data', 'Send Notifications', 'Generate Report', 'Review Syllabus'],
          suggested: ['Schedule Review Session', 'Contact At-Risk Students']
        };
        
      case 'student':
        return {
          available: ['Send Notification', 'Schedule Meeting', 'Generate Report', 'Update Status'],
          suggested: ['Contact Parent', 'Review Academic Performance']
        };
        
      default:
        return {
          available: ['Export Data', 'Generate Report'],
          suggested: []
        };
    }
  };

  const handleChartFilterChange = (chartId: string, filters: ChartSpecificFilters) => {
    setChartFilters(prev => ({
      ...prev,
      [chartId]: filters
    }));
  };

  // ============================================================================
  // CHART DATA FILTERING FUNCTIONS
  // ============================================================================
  // Functions to filter and transform chart data based on chart-specific filters

  // Helper function for safe division (prevents division by zero)


  const getFilteredChartData = (chartId: string, filters: ChartSpecificFilters) => {
    // Check if data is loading
    if (loading || !studentsData) {
      return [];
    }
    
    // Get base data from global filters
    const baseData = getBaseChartData(chartId);
    
    // Apply chart-specific filters
    let filteredData = baseData;
    
    // Apply time granularity
    if (filters.timeGranularity !== 'weekly') {
      filteredData = aggregateDataByTime(filteredData, filters.timeGranularity);
    }
    
    // Apply comparison period
    if (filters.comparisonPeriod !== 'none') {
      filteredData = addComparisonData(filteredData, filters.comparisonPeriod);
    }
    
    // Apply trend smoothing
    if (filters.trendSmoothing !== 'none') {
      filteredData = applyTrendSmoothing(filteredData, filters.trendSmoothing);
    }
    
    // Validate and sanitize the data to prevent NaN errors
    const validatedData = validateChartData(filteredData);
    
    console.log(`Chart data for ${chartId}:`, {
      dataLength: validatedData.length,
      sampleData: validatedData.slice(0, 2),
      hasData: validatedData.length > 0
    });
    
    return validatedData;
  };

  const getBaseChartData = (chartId: string) => {
    // Use new backend analytics hooks instead of old generation functions
    console.log(`Getting chart data for ${chartId} from backend analytics`);
    
    let chartData: any[] = [];
    
    switch (chartId) {
      case 'weekly-trend':
        chartData = weeklyTrends.data || [];
        break;
      case 'monthly-comparison':
        chartData = monthlyTrends.data || [];
        break;
      case 'time-of-day':
        chartData = timeOfDayTrends.data || [];
        break;
      case 'day-of-week':
        chartData = dayOfWeekTrends.data || [];
        break;
      case 'department-comparison':
        chartData = departmentComparisons.data || [];
        break;
      case 'year-level-comparison':
        chartData = yearLevelComparisons.data || [];
        break;
      case 'course-comparison':
        chartData = courseComparisons.data || [];
        break;
      case 'section-comparison':
        chartData = generateSectionComparisonData(studentsData || []);
        break;
      case 'rate-distribution-comparison':
        chartData = generateRateDistributionComparisonData(studentsData || []);
        break;

      case 'improvement-analysis':
        chartData = generateImprovementAnalysisData(studentsData || []);
        break;

      case 'attendance-breakdown':
        chartData = attendanceBreakdown.data || [];
        break;
      case 'risk-level-breakdown':
        chartData = riskLevelBreakdown.data || [];
        break;
      case 'attendance-forecast':
        // Fallback to old function for now (not implemented in backend yet)
        chartData = generateAttendanceForecastData(studentsData || []);
        break;
      case 'late-arrival-trends':
        // Fallback to old function for now (not implemented in backend yet)
        chartData = generateLateArrivalTrendsData(studentsData || []);
        break;
      case 'attendance-goal-tracking':
        // Fallback to old function for now (not implemented in backend yet)
        chartData = generateAttendanceGoalTrackingData(studentsData || []);
        break;
      case 'performance-ranking':
        chartData = performanceRankings.data || [];
        break;
      case 'goal-achievement':
        chartData = goalAchievement.data || [];
        break;
      case 'goal-gap-analysis':
        chartData = generateGoalGapAnalysisData(studentsData || []);
        break;
      case 'goal-setting-dashboard':
        chartData = generateGoalSettingDashboardData(studentsData || []);
        break;
      case 'goal-trend-analysis':
        chartData = generateGoalTrendAnalysisData(studentsData || []);
        break;
      case 'statistical-comparison':
        chartData = statisticalComparison.data || [];
        break;
      case 'subject-performance':
        chartData = subjectPerformance.data || [];
        break;
      case 'subject-trends':
        chartData = subjectTrends.data || [];
        break;
      case 'subject-time-analysis':
        chartData = subjectTimeAnalysis.data || [];
        break;
      case 'subject-comparison':
        chartData = subjectComparison.data || [];
        break;
      case 'subject-risk-analysis':
        chartData = subjectRiskAnalysis.data || [];
        break;
      case 'subject-patterns':
        chartData = subjectPatterns.data || [];
        break;
      default:
        chartData = [];
    }
    
    // Validate and sanitize chart data to prevent NaN errors
    return validateChartData(chartData);
  };

  // ============================================================================
  // REAL DATA GENERATION FUNCTIONS
  // ============================================================================
  
  // ============================================================================
  // Functions to generate chart data from actual student attendance records
  // ============================================================================

  const generateWeeklyTrendData = (students: StudentAttendance[]) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const currentWeek = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000));
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateWeeklyTrendData: no valid student data');
    return weeks.map(week => ({
      week,
      rate: 85,
      totalRecords: 0,
      presentRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on student attendance rates
      return weeks.map((week, index) => {
      const validAttendanceRates = validStudents
        .map(s => s.attendanceRate)
        .filter(rate => rate !== undefined && !isNaN(rate) && isFinite(rate));
      
      const baseRate = validAttendanceRates.length > 0 ? 
        safeAverage(validAttendanceRates, 85) : 85;
        const variation = (Math.random() - 0.5) * 10; // ±5% variation
        const rate = Math.max(0, Math.min(100, baseRate + variation));
        
        return {
          week,
          rate: Math.round(rate * 10) / 10,
        totalRecords: validStudents.length * 5, // Estimate 5 records per student per week
        presentRecords: Math.round(safePercentage(rate, 100) * validStudents.length * 5 / 100)
        };
      });
    }
    
    return weeks.map((week, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (currentWeek - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
    const weekStudents = validStudents.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
      });
      
      const totalRecords = weekStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }).length || 0);
      }, 0);
      
      const presentRecords = weekStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd && record.status === 'PRESENT';
        }).length || 0);
      }, 0);
      
    const rate = safePercentage(presentRecords, totalRecords, 0);
      
      return {
        week,
        rate: Math.round(rate * 10) / 10,
        totalRecords,
        presentRecords
      };
    });
  };

  const generateMonthlyComparisonData = (students: StudentAttendance[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    const currentMonth = new Date().getMonth();
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateMonthlyComparisonData: no valid student data');
    return months.map(month => ({
      month,
      current: 85,
      previous: 80,
      currentTotal: 0,
      previousTotal: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on student attendance rates
      return months.map((month, index) => {
      const validAttendanceRates = validStudents
        .map(s => s.attendanceRate)
        .filter(rate => rate !== undefined && !isNaN(rate) && isFinite(rate));
      
      const baseRate = validAttendanceRates.length > 0 ? 
        safeAverage(validAttendanceRates, 85) : 85;
        const currentRate = baseRate + (Math.random() - 0.5) * 8; // ±4% variation
        const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
        
        return {
          month,
          current: Math.round(currentRate * 10) / 10,
          previous: Math.round(previousRate * 10) / 10,
        currentTotal: validStudents.length * 20, // Estimate 20 records per student per month
        previousTotal: Math.round(validStudents.length * 20 * 0.9)
        };
      });
    }
    
    return months.map((month, index) => {
      const monthIndex = (currentMonth - 3 + index + 12) % 12;
      const currentYear = new Date().getFullYear();
      
      // Current month data
      const currentMonthStart = new Date(currentYear, monthIndex, 1);
      const currentMonthEnd = new Date(currentYear, monthIndex + 1, 0);
      
    const currentMonthStudents = validStudents.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= currentMonthStart && recordDate <= currentMonthEnd;
        });
      });
      
      const currentTotal = currentMonthStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= currentMonthStart && recordDate <= currentMonthEnd;
        }).length || 0);
      }, 0);
      
      const currentPresent = currentMonthStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= currentMonthStart && recordDate <= currentMonthEnd && record.status === 'PRESENT';
        }).length || 0);
      }, 0);
      
    const currentRate = safePercentage(currentPresent, currentTotal, 0);
      
      // Previous month data (simulated for demo)
      const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
      
      return {
        month,
        current: Math.round(currentRate * 10) / 10,
        previous: Math.round(previousRate * 10) / 10,
        currentTotal,
        previousTotal: Math.round(currentTotal * 0.9)
      };
    });
  };

  const generateTimeOfDayData = (students: StudentAttendance[]) => {
    const timeSlots = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateTimeOfDayData: no valid student data');
    return timeSlots.map(timeSlot => ({
      time: timeSlot,
      rate: 85,
      totalRecords: 0,
      presentRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on typical school schedule patterns
      return timeSlots.map((timeSlot, index) => {
        const hour = timeSlot.includes('PM') ? 
          parseInt(timeSlot.replace('PM', '')) + 12 : 
          parseInt(timeSlot.replace('AM', ''));
        
        // School hours have higher attendance (8AM-3PM)
        const isSchoolHour = hour >= 8 && hour <= 15;
        const isPeakHour = hour >= 9 && hour <= 14; // Peak attendance hours
        
        let baseRate = 85; // Base attendance rate
        if (isPeakHour) {
          baseRate = 92; // Higher during peak hours
        } else if (isSchoolHour) {
          baseRate = 88; // Good during school hours
        } else {
          baseRate = 75; // Lower outside school hours
        }
        
        // Add some variation
        const variation = (Math.random() - 0.5) * 8;
        const rate = Math.max(0, Math.min(100, baseRate + variation));
        
        return {
          time: timeSlot,
          rate: Math.round(rate * 10) / 10,
        totalRecords: validStudents.length * 2, // Estimate 2 records per student per hour
        presentRecords: Math.round(safePercentage(rate, 100) * validStudents.length * 2 / 100)
        };
      });
    }
    
    return timeSlots.map(timeSlot => {
      const hour = timeSlot.includes('PM') ? 
        parseInt(timeSlot.replace('PM', '')) + 12 : 
        parseInt(timeSlot.replace('AM', ''));
      
    const timeStudents = validStudents.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getHours() === hour;
        });
      });
      
      const totalRecords = timeStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getHours() === hour;
        }).length || 0);
      }, 0);
      
      const presentRecords = timeStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getHours() === hour && record.status === 'PRESENT';
        }).length || 0);
      }, 0);
      
    const rate = safePercentage(presentRecords, totalRecords, 0);
      
      return {
        time: timeSlot,
        rate: Math.round(rate * 10) / 10,
        totalRecords,
        presentRecords
      };
    });
  };

  const generateDayOfWeekData = (students: StudentAttendance[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateDayOfWeekData: no valid student data');
    return days.map(day => ({
      day,
      rate: 85,
      totalRecords: 0,
      presentRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on typical weekday patterns
      return days.map((day, index) => {
        const dayIndex = index + 1; // Monday = 1, Tuesday = 2, etc.
        
        // Typical patterns: Monday (lower), Tuesday-Thursday (higher), Friday (slightly lower)
        let baseRate = 85;
        if (dayIndex === 1) { // Monday
          baseRate = 82; // Slightly lower on Mondays
        } else if (dayIndex >= 2 && dayIndex <= 4) { // Tuesday-Thursday
          baseRate = 88; // Higher during mid-week
        } else if (dayIndex === 5) { // Friday
          baseRate = 84; // Slightly lower on Fridays
        }
        
        // Add some variation
        const variation = (Math.random() - 0.5) * 6;
        const rate = Math.max(0, Math.min(100, baseRate + variation));
        
        return {
          day,
          rate: Math.round(rate * 10) / 10,
        totalRecords: validStudents.length * 4, // Estimate 4 records per student per day
        presentRecords: Math.round(safePercentage(rate, 100) * validStudents.length * 4 / 100)
        };
      });
    }
    
    return days.map((day, index) => {
      const dayIndex = index + 1; // Monday = 1, Tuesday = 2, etc.
      
    const dayStudents = validStudents.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getDay() === dayIndex;
        });
      });
      
      const totalRecords = dayStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getDay() === dayIndex;
        }).length || 0);
      }, 0);
      
      const presentRecords = dayStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getDay() === dayIndex && record.status === 'PRESENT';
        }).length || 0);
      }, 0);
      
    const rate = safePercentage(presentRecords, totalRecords, 0);
      
      return {
        day,
        rate: Math.round(rate * 10) / 10,
        totalRecords,
        presentRecords
      };
    });
  };

  const generateDepartmentComparisonData = (students: StudentAttendance[]) => {
    const departments = ['Engineering', 'Business', 'Arts', 'Science'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateDepartmentComparisonData: no valid student data');
    return departments.map(dept => ({
      dept,
      current: 85,
      previous: 80,
      studentCount: 0,
      totalRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on department patterns
      return departments.map(dept => {
      const deptStudents = validStudents.filter(student => student.department && student.department.includes(dept));
        
        // Different departments might have different attendance patterns
        let baseRate = 85;
        if (dept === 'Engineering') {
          baseRate = 88; // Engineering students typically have high attendance
        } else if (dept === 'Business') {
          baseRate = 86; // Business students have good attendance
        } else if (dept === 'Arts') {
          baseRate = 83; // Arts students might have slightly lower attendance
        } else if (dept === 'Science') {
          baseRate = 87; // Science students have high attendance
        }
        
        // Add variation based on number of students
        const variation = (Math.random() - 0.5) * 8;
        const currentRate = Math.max(0, Math.min(100, baseRate + variation));
        const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
        
        return {
          dept,
          current: Math.round(currentRate * 10) / 10,
          previous: Math.round(previousRate * 10) / 10,
          studentCount: deptStudents.length,
          totalRecords: deptStudents.length * 15 // Estimate 15 records per student
        };
      });
    }
    
    return departments.map(dept => {
    const deptStudents = validStudents.filter(student => student.department === dept);
      
      const currentTotal = deptStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.length || 0);
      }, 0);
      
      const currentPresent = deptStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => record.status === 'PRESENT').length || 0);
      }, 0);
      
    const currentRate = safePercentage(currentPresent, currentTotal, 0);
      
      // Previous period data (simulated)
      const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
      
      return {
        dept,
        current: Math.round(currentRate * 10) / 10,
        previous: Math.round(previousRate * 10) / 10,
        studentCount: deptStudents.length,
        totalRecords: currentTotal
      };
    });
  };

  const generateYearLevelComparisonData = (students: StudentAttendance[]) => {
    const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateYearLevelComparisonData: no valid student data');
    return yearLevels.map(yearLevel => ({
      year: yearLevel,
      current: 85,
      previous: 80,
      studentCount: 0,
      totalRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on year level patterns
      return yearLevels.map(yearLevel => {
      const yearStudents = validStudents.filter(student => student.yearLevel === yearLevel);
        
        // Different year levels might have different attendance patterns
        let baseRate = 85;
        if (yearLevel === '1st Year') {
          baseRate = 87; // Freshmen often have high attendance
        } else if (yearLevel === '2nd Year') {
          baseRate = 85; // Sophomores maintain good attendance
        } else if (yearLevel === '3rd Year') {
          baseRate = 83; // Juniors might have slightly lower attendance
        } else if (yearLevel === '4th Year') {
          baseRate = 86; // Seniors often have good attendance for graduation
        }
        
        // Add variation based on number of students
        const variation = (Math.random() - 0.5) * 8;
        const currentRate = Math.max(0, Math.min(100, baseRate + variation));
        const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
        
        return {
          year: yearLevel,
          current: Math.round(currentRate * 10) / 10,
          previous: Math.round(previousRate * 10) / 10,
          studentCount: yearStudents.length,
          totalRecords: yearStudents.length * 15 // Estimate 15 records per student
        };
      });
    }
    
    return yearLevels.map(yearLevel => {
    const yearStudents = validStudents.filter(student => student.yearLevel === yearLevel);
      
      const currentTotal = yearStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.length || 0);
      }, 0);
      
      const currentPresent = yearStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => record.status === 'PRESENT').length || 0);
      }, 0);
      
    const currentRate = safePercentage(currentPresent, currentTotal, 0);
      
      // Previous period data (simulated)
      const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
      
      return {
        year: yearLevel,
        current: Math.round(currentRate * 10) / 10,
        previous: Math.round(previousRate * 10) / 10,
        studentCount: yearStudents.length,
        totalRecords: currentTotal
      };
    });
  };

  const generateCourseComparisonData = (students: StudentAttendance[]) => {
    const courses = ['Course A', 'Course B', 'Course C', 'Course D'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateCourseComparisonData: no valid student data');
    return courses.map(course => ({
      course,
      current: 85,
      previous: 80,
      studentCount: 0,
      totalRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on course patterns
      return courses.map(course => {
      const courseStudents = validStudents.filter(student => student.course === course);
        
        // Different courses might have different attendance patterns
        let baseRate = 85;
        if (course === 'Course A') {
          baseRate = 88; // Course A students typically have high attendance
        } else if (course === 'Course B') {
          baseRate = 86; // Course B students have good attendance
        } else if (course === 'Course C') {
          baseRate = 83; // Course C students might have slightly lower attendance
        } else if (course === 'Course D') {
          baseRate = 87; // Course D students have high attendance
        }
        
        // Add variation based on number of students
        const variation = (Math.random() - 0.5) * 8;
        const currentRate = Math.max(0, Math.min(100, baseRate + variation));
        const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
        
        return {
          course,
          current: Math.round(currentRate * 10) / 10,
          previous: Math.round(previousRate * 10) / 10,
          studentCount: courseStudents.length,
          totalRecords: courseStudents.length * 15 // Estimate 15 records per student
        };
      });
    }
    
    return courses.map(course => {
    const courseStudents = validStudents.filter(student => student.course === course);
      
      const currentTotal = courseStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.length || 0);
      }, 0);
      
      const currentPresent = courseStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => record.status === 'PRESENT').length || 0);
      }, 0);
      
    const currentRate = safePercentage(currentPresent, currentTotal, 0);
      
      // Previous period data (simulated)
      const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
      
      return {
        course,
        current: Math.round(currentRate * 10) / 10,
        previous: Math.round(previousRate * 10) / 10,
        studentCount: courseStudents.length,
        totalRecords: currentTotal
      };
    });
  };

  const generateSectionComparisonData = (students: StudentAttendance[]) => {
    const sections = ['Section A', 'Section B', 'Section C', 'Section D'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateSectionComparisonData: no valid student data');
    return sections.map(section => ({
      section,
      current: 85,
      previous: 80,
      studentCount: 0,
      totalRecords: 0
    }));
  }
    
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on section patterns
      return sections.map(section => {
      const sectionStudents = validStudents.filter(student => 
          student.academicInfo?.sectionName === section || student.sectionInfo?.sectionName === section
        );
        
        // Different sections might have different attendance patterns
        let baseRate = 85;
        if (section === 'Section A') {
          baseRate = 88; // Section A students typically have high attendance
        } else if (section === 'Section B') {
          baseRate = 86; // Section B students have good attendance
        } else if (section === 'Section C') {
          baseRate = 83; // Section C students might have slightly lower attendance
        } else if (section === 'Section D') {
          baseRate = 87; // Section D students have high attendance
        }
        
        // Add variation based on number of students
        const variation = (Math.random() - 0.5) * 8;
        const currentRate = Math.max(0, Math.min(100, baseRate + variation));
        const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
        
        return {
          section,
          current: Math.round(currentRate * 10) / 10,
          previous: Math.round(previousRate * 10) / 10,
          studentCount: sectionStudents.length,
          totalRecords: sectionStudents.length * 15 // Estimate 15 records per student
        };
      });
    }
    
    return sections.map(section => {
    const sectionStudents = validStudents.filter(student => 
        student.academicInfo?.sectionName === section || student.sectionInfo?.sectionName === section
      );
      
      const currentTotal = sectionStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.length || 0);
      }, 0);
      
      const currentPresent = sectionStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => record.status === 'PRESENT').length || 0);
      }, 0);
      
    const currentRate = safePercentage(currentPresent, currentTotal, 0);
      
      // Previous period data (simulated)
      const previousRate = Math.max(0, currentRate - (Math.random() * 5 + 1));
      
      return {
        section,
        current: Math.round(currentRate * 10) / 10,
        previous: Math.round(previousRate * 10) / 10,
        studentCount: sectionStudents.length,
        totalRecords: currentTotal
      };
    });
  };

  const generateAttendanceBreakdownData = (students: StudentAttendance[]) => {
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateAttendanceBreakdownData: no valid student data');
    return [
      {
        name: 'Present',
        value: 0,
        color: '#10b981',
        percentage: 0
      },
      {
        name: 'Late',
        value: 0,
        color: '#f59e0b',
        percentage: 0
      },
      {
        name: 'Absent',
        value: 0,
        color: '#ef4444',
        percentage: 0
      },
      {
        name: 'Excused',
        value: 0,
        color: '#8b5cf6',
        percentage: 0
      }
    ];
  }
  
    // Check if we have real attendance data
  const hasRealData = validStudents.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data based on typical attendance patterns
    const totalStudents = validStudents.length;
      const totalRecords = totalStudents * 20; // Estimate 20 records per student
      
      return [
        {
          name: 'Present',
          value: Math.round(totalRecords * 0.85), // 85% present
          color: '#10b981',
          percentage: 85
        },
        {
          name: 'Late',
          value: Math.round(totalRecords * 0.08), // 8% late
          color: '#f59e0b',
          percentage: 8
        },
        {
          name: 'Absent',
          value: Math.round(totalRecords * 0.05), // 5% absent
          color: '#ef4444',
          percentage: 5
        },
        {
          name: 'Excused',
          value: Math.round(totalRecords * 0.02), // 2% excused
          color: '#8b5cf6',
          percentage: 2
        }
      ];
    }
    
    // Calculate real attendance breakdown
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let totalRecords = 0;
    
  validStudents.forEach(student => {
      if (student.recentAttendanceRecords) {
        student.recentAttendanceRecords.forEach(record => {
          totalRecords++;
          switch (record.status) {
            case 'PRESENT':
              presentCount++;
              break;
            case 'LATE':
              lateCount++;
              break;
            case 'ABSENT':
              absentCount++;
              break;
            case 'EXCUSED':
              excusedCount++;
              break;
          }
        });
      }
    });
    
  const presentPercentage = Math.round(safePercentage(presentCount, totalRecords, 0));
  const latePercentage = Math.round(safePercentage(lateCount, totalRecords, 0));
  const absentPercentage = Math.round(safePercentage(absentCount, totalRecords, 0));
  const excusedPercentage = Math.round(safePercentage(excusedCount, totalRecords, 0));
    
    return [
      {
        name: 'Present',
        value: presentCount,
        color: '#10b981',
        percentage: presentPercentage
      },
      {
        name: 'Late',
        value: lateCount,
        color: '#f59e0b',
        percentage: latePercentage
      },
      {
        name: 'Absent',
        value: absentCount,
        color: '#ef4444',
        percentage: absentPercentage
      },
      {
        name: 'Excused',
        value: excusedCount,
        color: '#8b5cf6',
        percentage: excusedPercentage
      }
    ];
};

  const generateRiskLevelBreakdownData = (students: StudentAttendance[]) => {
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateRiskLevelBreakdownData: no valid student data');
    return [
      {
        name: 'Low Risk (≥90%)',
        value: 0,
        color: '#10b981',
        percentage: 0
      },
      {
        name: 'Medium Risk (75-89%)',
        value: 0,
        color: '#f59e0b',
        percentage: 0
      },
      {
        name: 'High Risk (60-74%)',
        value: 0,
        color: '#ef4444',
        percentage: 0
      },
      {
        name: 'Critical Risk (<60%)',
        value: 0,
        color: '#92400e',
        percentage: 0
      }
    ];
  }
  
  // Categorize students by attendance risk levels
  let lowRiskCount = 0;
  let mediumRiskCount = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  
  validStudents.forEach(student => {
    const attendanceRate = student.attendanceRate || 0;
    
    if (attendanceRate >= 90) {
      lowRiskCount++;
    } else if (attendanceRate >= 75) {
      mediumRiskCount++;
    } else if (attendanceRate >= 60) {
      highRiskCount++;
    } else {
      criticalRiskCount++;
    }
  });
  
  const totalStudents = validStudents.length;
  const lowRiskPercentage = Math.round(safePercentage(lowRiskCount, totalStudents, 0));
  const mediumRiskPercentage = Math.round(safePercentage(mediumRiskCount, totalStudents, 0));
  const highRiskPercentage = Math.round(safePercentage(highRiskCount, totalStudents, 0));
  const criticalRiskPercentage = Math.round(safePercentage(criticalRiskCount, totalStudents, 0));
  
  return [
    {
      name: 'Low Risk (≥90%)',
      value: lowRiskCount,
      color: '#10b981', // Green
      percentage: lowRiskPercentage
    },
    {
      name: 'Medium Risk (75-89%)',
      value: mediumRiskCount,
      color: '#f59e0b', // Orange
      percentage: mediumRiskPercentage
    },
    {
      name: 'High Risk (60-74%)',
      value: highRiskCount,
      color: '#ef4444', // Red
      percentage: highRiskPercentage
    },
    {
      name: 'Critical Risk (<60%)',
      value: criticalRiskCount,
      color: '#92400e', // Dark Brown
      percentage: criticalRiskPercentage
    }
  ];
};

  const generateAttendanceForecastData = (students: StudentAttendance[]) => {
    // Generate historical data for the past 30 days
    const historicalData = [];
    const today = new Date();
    const targetGoal = 95; // 95% attendance goal
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Check if we have real data for this date
      const dayStudents = students.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.toDateString() === date.toDateString();
        });
      });
      
      let attendanceRate = 85; // Default fallback rate
      
      if (dayStudents.length > 0) {
        const totalRecords = dayStudents.reduce((sum, student) => {
          return sum + (student.recentAttendanceRecords?.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate.toDateString() === date.toDateString();
          }).length || 0);
        }, 0);
        
        const presentRecords = dayStudents.reduce((sum, student) => {
          return sum + (student.recentAttendanceRecords?.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate.toDateString() === date.toDateString() && record.status === 'PRESENT';
          }).length || 0);
        }, 0);
        
        attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 85;
      }
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        rate: Math.round(attendanceRate * 10) / 10,
        isHistorical: true
      });
    }
    
    // Generate forecast data for the next 30 days
    const forecastData = [];
    const lastRate = historicalData[historicalData.length - 1]?.rate || 85;
    const trend = (historicalData[historicalData.length - 1]?.rate || 85) - (historicalData[0]?.rate || 85);
    const dailyTrend = trend / 29; // Average daily change
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Simple linear forecast with some variation
      const baseRate = lastRate + (dailyTrend * i);
      const variation = (Math.random() - 0.5) * 3; // ±1.5% variation
      const forecastRate = Math.max(0, Math.min(100, baseRate + variation));
      
      forecastData.push({
        date: date.toISOString().split('T')[0],
        rate: Math.round(forecastRate * 10) / 10,
        isHistorical: false,
        confidenceUpper: Math.min(100, forecastRate + 2),
        confidenceLower: Math.max(0, forecastRate - 2)
      });
    }
    
    return [...historicalData, ...forecastData];
  };

  const generateLateArrivalTrendsData = (students: StudentAttendance[]) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const currentWeek = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000));
    
    // Check if we have real attendance data
    const hasRealData = students.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data with realistic late arrival patterns
      return weeks.map((week, index) => {
        const baseLateRate = 8; // Base 8% late rate
        const variation = (Math.random() - 0.5) * 4; // ±2% variation
        const currentLateRate = Math.max(0, Math.min(20, baseLateRate + variation));
        const previousLateRate = Math.max(0, currentLateRate - (Math.random() * 3 + 1));
        
        return {
          week,
          currentLateRate: Math.round(currentLateRate * 10) / 10,
          previousLateRate: Math.round(previousLateRate * 10) / 10,
          totalRecords: students.length * 5,
          lateRecords: Math.round((currentLateRate / 100) * students.length * 5)
        };
      });
    }
    
    return weeks.map((week, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (currentWeek - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekStudents = students.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
      });
      
      const totalRecords = weekStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }).length || 0);
      }, 0);
      
      const lateRecords = weekStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd && record.status === 'LATE';
        }).length || 0);
      }, 0);
      
      const currentLateRate = totalRecords > 0 ? (lateRecords / totalRecords) * 100 : 0;
      const previousLateRate = Math.max(0, currentLateRate - (Math.random() * 3 + 1));
      
      return {
        week,
        currentLateRate: Math.round(currentLateRate * 10) / 10,
        previousLateRate: Math.round(previousLateRate * 10) / 10,
        totalRecords,
        lateRecords
      };
    });
  };

  const generateAttendanceGoalTrackingData = (students: StudentAttendance[]) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const targetGoal = 95; // 95% attendance goal
    const currentWeek = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000));
    
    // Check if we have real attendance data
    const hasRealData = students.some(student => student.recentAttendanceRecords && student.recentAttendanceRecords.length > 0);
    
    if (!hasRealData) {
      // Generate fallback data showing progress toward goal
      return weeks.map((week, index) => {
        const baseRate = 85; // Starting rate
        const progress = (index / 5) * 10; // Gradual improvement
        const variation = (Math.random() - 0.5) * 4;
        const currentRate = Math.max(0, Math.min(100, baseRate + progress + variation));
        
        return {
          week,
          currentRate: Math.round(currentRate * 10) / 10,
          targetGoal,
          gap: Math.round((targetGoal - currentRate) * 10) / 10,
          status: currentRate >= targetGoal ? 'achieved' : currentRate >= targetGoal - 5 ? 'close' : 'needs_improvement'
        };
      });
    }
    
    return weeks.map((week, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (currentWeek - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekStudents = students.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
      });
      
      const totalRecords = weekStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }).length || 0);
      }, 0);
      
      const presentRecords = weekStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart && recordDate <= weekEnd && record.status === 'PRESENT';
        }).length || 0);
      }, 0);
      
      const currentRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 85;
      
      return {
        week,
        currentRate: Math.round(currentRate * 10) / 10,
        targetGoal,
        gap: Math.round((targetGoal - currentRate) * 10) / 10,
        status: currentRate >= targetGoal ? 'achieved' : currentRate >= targetGoal - 5 ? 'close' : 'needs_improvement'
      };
    });
  };



  const generateRateDistributionComparisonData = (students: StudentAttendance[]) => {
    const rateRanges = [
      '90-100%',
      '80-89%',
      '70-79%',
      '60-69%',
      '50-59%',
      '0-49%'
    ];
    
    // Calculate current period distribution
    const currentPeriod = students.reduce((acc, student) => {
      const rate = student.attendanceRate || 0;
      if (rate >= 90) acc['90-100%']++;
      else if (rate >= 80) acc['80-89%']++;
      else if (rate >= 70) acc['70-79%']++;
      else if (rate >= 60) acc['60-69%']++;
      else if (rate >= 50) acc['50-59%']++;
      else acc['0-49%']++;
      return acc;
    }, {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      '60-69%': 0,
      '50-59%': 0,
      '0-49%': 0
    });
    
    // Generate previous period data with slight variation
    const previousPeriod = Object.keys(currentPeriod).reduce((acc, range) => {
      const current = currentPeriod[range as keyof typeof currentPeriod];
      const variation = Math.floor((Math.random() - 0.5) * 3); // ±1-2 students variation
      acc[range as keyof typeof currentPeriod] = Math.max(0, current + variation);
      return acc;
    }, { ...currentPeriod });
    
    return rateRanges.map(range => ({
      rateRange: range,
      current: currentPeriod[range as keyof typeof currentPeriod],
      previous: previousPeriod[range as keyof typeof currentPeriod],
      change: currentPeriod[range as keyof typeof currentPeriod] - previousPeriod[range as keyof typeof currentPeriod]
    }));
  };



  const generateImprovementAnalysisData = (students: StudentAttendance[]) => {
    const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const targetImprovement = 2; // 2% improvement target per week
    
    return periods.map((period, index) => {
      // Calculate improvement based on student data
      const baseRate = 85; // Starting rate
      const improvement = (index / 5) * 8; // Gradual improvement over weeks
      const variation = (Math.random() - 0.5) * 3; // ±1.5% variation
      const actualImprovement = Math.max(-5, Math.min(10, improvement + variation));
      
      return {
        period,
        improvement: Math.round(actualImprovement * 10) / 10,
        target: targetImprovement,
        status: actualImprovement >= targetImprovement ? 'exceeding' : actualImprovement >= 0 ? 'improving' : 'declining'
      };
    });
  };

  const generateGoalGapAnalysisData = (students: StudentAttendance[]) => {
    const categories = ['Overall', 'Freshmen', 'Sophomores', 'Juniors', 'Seniors', 'Graduates'];
    const targetGoal = 95; // 95% target goal
    
    return categories.map(category => {
      let currentRate = 85; // Default fallback rate
      
      if (category === 'Overall') {
        const validStudents = students.filter(s => s.attendanceRate !== undefined && !isNaN(s.attendanceRate));
        if (validStudents.length > 0) {
          currentRate = validStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / validStudents.length;
        }
      } else {
        // Filter students by year level (simplified mapping)
        const yearLevelMap: Record<string, string[]> = {
          'Freshmen': ['1st Year', 'First Year'],
          'Sophomores': ['2nd Year', 'Second Year'],
          'Juniors': ['3rd Year', 'Third Year'],
          'Seniors': ['4th Year', 'Fourth Year'],
          'Graduates': ['5th Year', 'Graduate']
        };
        
        const categoryStudents = students.filter(s => 
          yearLevelMap[category]?.includes(s.yearLevel || '')
        );
        
        if (categoryStudents.length > 0) {
          const validCategoryStudents = categoryStudents.filter(s => s.attendanceRate !== undefined && !isNaN(s.attendanceRate));
          if (validCategoryStudents.length > 0) {
            currentRate = validCategoryStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / validCategoryStudents.length;
          }
        }
      }
      
      const gap = currentRate - targetGoal;
      const surplus = gap > 0 ? gap : 0;
      const deficit = gap < 0 ? Math.abs(gap) : 0;
      
      return {
        category,
        currentRate: Math.round(currentRate * 10) / 10,
        targetGoal,
        gap: Math.round(gap * 10) / 10,
        surplus: Math.round(surplus * 10) / 10,
        deficit: Math.round(deficit * 10) / 10,
        status: gap >= 0 ? 'achieved' : gap >= -5 ? 'close' : 'needs_improvement'
      };
    });
  };

  const generateGoalSettingDashboardData = (students: StudentAttendance[]) => {
    const targetGoal = 95;
    const validStudents = students.filter(s => s.attendanceRate !== undefined && !isNaN(s.attendanceRate));
    
    if (validStudents.length === 0) {
      return [
        { name: 'Exceeding Goal', value: 20, color: '#10b981' },
        { name: 'Close to Goal', value: 30, color: '#f59e0b' },
        { name: 'Needs Improvement', value: 50, color: '#ef4444' }
      ];
    }
    
    const exceedingGoal = validStudents.filter(s => (s.attendanceRate || 0) >= targetGoal).length;
    const closeToGoal = validStudents.filter(s => (s.attendanceRate || 0) >= targetGoal - 5 && (s.attendanceRate || 0) < targetGoal).length;
    const needsImprovement = validStudents.filter(s => (s.attendanceRate || 0) < targetGoal - 5).length;
    
    return [
      { 
        name: 'Exceeding Goal', 
        value: exceedingGoal, 
        color: '#10b981',
        percentage: Math.round((exceedingGoal / validStudents.length) * 100)
      },
      { 
        name: 'Close to Goal', 
        value: closeToGoal, 
        color: '#f59e0b',
        percentage: Math.round((closeToGoal / validStudents.length) * 100)
      },
      { 
        name: 'Needs Improvement', 
        value: needsImprovement, 
        color: '#ef4444',
        percentage: Math.round((needsImprovement / validStudents.length) * 100)
      }
    ];
  };

  const generateGoalTrendAnalysisData = (students: StudentAttendance[]) => {
    const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const targetRate = 95;
    
    return periods.map((period, index) => {
      // Calculate actual rate based on student data
      const validStudents = students.filter(s => s.attendanceRate !== undefined && !isNaN(s.attendanceRate));
      const baseRate = validStudents.length > 0 ? 
        validStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / validStudents.length : 85;
      
      // Simulate weekly progression with some improvement trend
      const weeklyImprovement = (index / 5) * 8; // Gradual improvement over weeks
      const variation = (Math.random() - 0.5) * 3; // ±1.5% variation
      const actualRate = Math.max(0, Math.min(100, baseRate + weeklyImprovement + variation));
      
      // Projected rate based on current trend
      const trend = actualRate - (baseRate + (index > 0 ? (index - 1) / 5 * 8 : 0));
      const projectedRate = Math.max(0, Math.min(100, actualRate + trend));
      
      return {
        period,
        actualRate: Math.round(actualRate * 10) / 10,
        projectedRate: Math.round(projectedRate * 10) / 10,
        targetRate,
        trend: Math.round(trend * 10) / 10,
        status: actualRate >= targetRate ? 'achieved' : actualRate >= targetRate - 5 ? 'close' : 'needs_improvement'
      };
    });
  };

  const generatePerformanceRankingData = (students: StudentAttendance[]) => {
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generatePerformanceRankingData: no valid student data');
    return [];
  }
  
  // Group students by department and calculate average attendance
  const departmentStats = new Map<string, { total: number; count: number; avgRate: number }>();
  
  validStudents.forEach(student => {
    const dept = student.department || 'Unknown';
    const current = departmentStats.get(dept) || { total: 0, count: 0, avgRate: 0 };
    current.total += student.attendanceRate || 0;
    current.count += 1;
    departmentStats.set(dept, current);
  });
  
  // Calculate averages and create ranking data
  const rankingData = Array.from(departmentStats.entries()).map(([dept, stats]) => ({
    department: dept,
    avgAttendance: Math.round(safeDivision(stats.total, stats.count, 0) * 10) / 10,
    studentCount: stats.count,
    rank: 0, // Will be set below
    trend: Math.random() > 0.5 ? 'up' : 'down',
    improvement: Math.round((Math.random() * 5 - 2.5) * 10) / 10
  }));
  
  // Sort by attendance rate and assign ranks
  rankingData.sort((a, b) => b.avgAttendance - a.avgAttendance);
  rankingData.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  // Add ranking indicators and colors
  return rankingData.map(item => ({
    ...item,
    rankLabel: item.rank === 1 ? '🥇 1st' : item.rank === 2 ? '🥈 2nd' : item.rank === 3 ? '🥉 3rd' : `${item.rank}th`,
    color: item.rank === 1 ? '#10b981' : item.rank === 2 ? '#3b82f6' : item.rank === 3 ? '#f59e0b' : '#6b7280',
    status: item.rank <= 3 ? 'top' : item.avgAttendance >= 85 ? 'good' : 'needs_improvement'
  }));
};

  // NEW: Custom Trend Range Helper Functions
  const getCustomTrendData = (students: StudentAttendance[], range: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customDateRange.start;
        endDate = customDateRange.end;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Generate data points for the custom range
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStudents = students.filter(student => {
        return student.recentAttendanceRecords?.some(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.toDateString() === date.toDateString();
        });
      });
      
      const totalRecords = dayStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.toDateString() === date.toDateString();
        }).length || 0);
      }, 0);
      
      const presentRecords = dayStudents.reduce((sum, student) => {
        return sum + (student.recentAttendanceRecords?.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.toDateString() === date.toDateString() && record.status === 'PRESENT';
        }).length || 0);
      }, 0);
      
      const rate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
      
      data.push({
        date: date.toISOString().split('T')[0],
        rate: Math.round(rate * 10) / 10,
        totalRecords,
        presentRecords
      });
    }
    
    return data;
  };

  // NEW: Drill-down Helper Functions
  const handleDrillDown = (level: 'department' | 'course' | 'section' | 'instructor', value: string) => {
    const newHistory = [...drillDownHistory, { level, value, data: drillDownData }];
    setDrillDownHistory(newHistory);
    setDrillDownLevel(level);
    setShowDrillDownBreadcrumb(true);
    
    // Generate drill-down data based on level
    let drillData: StudentAttendance[] = [];
    
    switch (level) {
      case 'department':
        drillData = studentsData?.filter(s => s.department === value) || [];
        break;
      case 'course':
        drillData = studentsData?.filter(s => s.course === value) || [];
        break;
      case 'section':
        drillData = studentsData?.filter(s => s.sectionInfo?.sectionName === value) || [];
        break;
      case 'instructor':
        drillData = studentsData?.filter(s => s.subjects?.some(subject => subject.instructor === value)) || [];
        break;
    }
    
    setDrillDownData(drillData);
  };

  const handleDrillUp = () => {
    if (drillDownHistory.length > 0) {
      const newHistory = drillDownHistory.slice(0, -1);
      setDrillDownHistory(newHistory);
      
      if (newHistory.length === 0) {
        setDrillDownLevel(null);
        setShowDrillDownBreadcrumb(false);
        setDrillDownData([]);
      } else {
        const lastHistory = newHistory[newHistory.length - 1];
        setDrillDownLevel(lastHistory.level as any);
        setDrillDownData(lastHistory.data);
      }
    }
  };



  // NEW: User Customization Helper Functions
  const saveUserCustomization = (name: string) => {
    const newCustomization = {
      id: Date.now().toString(),
      name,
      preferences: userPreferences,
      createdAt: new Date()
    };
    
    setSavedCustomizations(prev => [...prev, newCustomization]);
    toast.success(`Customization "${name}" saved successfully!`);
  };

  const loadUserCustomization = (customization: typeof savedCustomizations[0]) => {
    setUserPreferences(customization.preferences);
    toast.success(`Customization "${customization.name}" loaded successfully!`);
  };

  const deleteUserCustomization = (id: string) => {
    setSavedCustomizations(prev => prev.filter(c => c.id !== id));
    toast.success('Customization deleted successfully!');
  };

  const generateGoalAchievementData = (students: StudentAttendance[]) => {
  const goals = [
    { name: 'Overall Attendance', target: 95, current: 0 },
    { name: 'On-Time Rate', target: 90, current: 0 },
    { name: 'Department Average', target: 88, current: 0 },
    { name: 'Course Completion', target: 85, current: 0 },
    { name: 'Student Engagement', target: 92, current: 0 }
  ];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  // Calculate current values based on student data
  if (validStudents.length > 0) {
    const validAttendanceRates = validStudents
      .map(s => s.attendanceRate)
      .filter(rate => rate !== undefined && !isNaN(rate) && isFinite(rate));
    
    const avgAttendance = validAttendanceRates.length > 0 ? 
      safeAverage(validAttendanceRates, 85) : 85;
    
    const onTimeRate = validStudents.reduce((sum, s) => {
      const lateRecords = s.recentAttendanceRecords?.filter(r => r.status === 'LATE').length || 0;
      const totalRecords = s.recentAttendanceRecords?.length || 1;
      return sum + safePercentage(totalRecords - lateRecords, totalRecords, 0);
    }, 0) / validStudents.length;
    
    goals[0].current = Math.round(avgAttendance * 10) / 10;
    goals[1].current = Math.round(onTimeRate * 10) / 10;
    goals[2].current = Math.round((avgAttendance + Math.random() * 4 - 2) * 10) / 10;
    goals[3].current = Math.round((avgAttendance - Math.random() * 3) * 10) / 10;
    goals[4].current = Math.round((avgAttendance + Math.random() * 2) * 10) / 10;
  } else {
    // Fallback data
    goals.forEach(goal => {
      goal.current = Math.round((goal.target - Math.random() * 10) * 10) / 10;
    });
  }
  
  return goals.map(goal => ({
    ...goal,
    achievement: Math.round(safePercentage(goal.current, goal.target, 0)),
    gap: Math.round((goal.target - goal.current) * 10) / 10,
    status: goal.current >= goal.target ? 'achieved' : goal.current >= goal.target * 0.9 ? 'close' : 'needs_work',
    color: goal.current >= goal.target ? '#10b981' : goal.current >= goal.target * 0.9 ? '#f59e0b' : '#ef4444'
  }));
};

  const generateStatisticalComparisonData = (students: StudentAttendance[]) => {
  const departments = ['Computer Science', 'Engineering', 'Business', 'Arts', 'Science'];
  const stats = ['Mean', 'Median', 'Std Dev', 'Min', 'Max'];
  
  // Validate input data
  const validStudents = validateStudentData(students);
  
  if (validStudents.length === 0) {
    console.warn('generateStatisticalComparisonData: no valid student data');
    return departments.map(dept => ({
      department: dept,
      mean: 85,
      median: 85,
      stdDev: 5,
      min: 80,
      max: 90,
      sampleSize: 0
    }));
  }
  
  return departments.map(dept => {
    // Filter students by department (simulate)
    const deptStudents = validStudents.filter(s => s.department === dept || Math.random() > 0.7);
    const rates = deptStudents.map(s => s.attendanceRate || 0).filter(r => r > 0 && !isNaN(r) && isFinite(r));
    
    if (rates.length === 0) {
      // Generate fallback data
      const baseRate = 80 + Math.random() * 15;
      const variation = Math.random() * 10;
      return {
        department: dept,
        mean: Math.round((baseRate + variation) * 10) / 10,
        median: Math.round(baseRate * 10) / 10,
        stdDev: Math.round((variation / 2) * 10) / 10,
        min: Math.round((baseRate - variation) * 10) / 10,
        max: Math.round((baseRate + variation) * 10) / 10,
        sampleSize: Math.floor(Math.random() * 50) + 20
      };
    }
    
    // Calculate real statistics
    const mean = safeAverage(rates, 85);
    const sortedRates = [...rates].sort((a, b) => a - b);
    const median = sortedRates[Math.floor(sortedRates.length / 2)];
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      department: dept,
      mean: Math.round(mean * 10) / 10,
      median: Math.round(median * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      min: Math.round(Math.min(...rates) * 10) / 10,
      max: Math.round(Math.max(...rates) * 10) / 10,
      sampleSize: rates.length
    };
  });
};

const generateSubjectPerformanceData = (students: StudentAttendance[]) => {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English Literature', 'History', 'Geography', 'Economics', 'Psychology'
  ];
  
  return subjects.map(subject => {
    // Simulate subject-specific attendance data
    const baseRate = 75 + Math.random() * 20; // 75-95% range
    const studentCount = Math.floor(Math.random() * 100) + 30;
    const attendanceRate = Math.round(baseRate * 10) / 10;
    
    return {
      subject,
      attendanceRate,
      studentCount,
      instructor: `Prof. ${subject.split(' ')[0]}`,
      department: ['Computer Science', 'Engineering', 'Business', 'Arts', 'Science'][Math.floor(Math.random() * 5)],
      status: attendanceRate >= 90 ? 'excellent' : attendanceRate >= 80 ? 'good' : attendanceRate >= 70 ? 'fair' : 'needs_attention',
      color: attendanceRate >= 90 ? '#10b981' : attendanceRate >= 80 ? '#3b82f6' : attendanceRate >= 70 ? '#f59e0b' : '#ef4444'
    };
  }).sort((a, b) => b.attendanceRate - a.attendanceRate);
};

const generateSubjectTrendsData = (students: StudentAttendance[]) => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const subjects = ['Mathematics', 'Physics', 'Computer Science', 'English', 'History'];
  
  return subjects.map(subject => {
    const baseRate = 80 + Math.random() * 15;
    const trend = weeks.map((week, index) => {
      const variation = (Math.random() - 0.5) * 8; // ±4% variation
      const trendFactor = (index / 5) * 5; // Gradual trend
      const rate = Math.max(0, Math.min(100, baseRate + variation + trendFactor));
      
      return {
        week,
        attendanceRate: Math.round(rate * 10) / 10,
        subject
      };
    });
    
    return {
      subject,
      data: trend,
      averageRate: Math.round(trend.reduce((sum, d) => sum + d.attendanceRate, 0) / trend.length * 10) / 10,
      trend: trend[trend.length - 1].attendanceRate > trend[0].attendanceRate ? 'up' : 'down'
    };
  });
};

const generateSubjectTimeAnalysisData = (students: StudentAttendance[]) => {
  const subjects = ['Mathematics', 'Physics', 'Computer Science', 'English', 'History'];
  const timeSlots = ['8:00 AM', '10:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'];
  
  return subjects.map(subject => {
    return timeSlots.map(timeSlot => {
      const baseRate = 75 + Math.random() * 20;
      const attendanceRate = Math.round(baseRate * 10) / 10;
      
      return {
        subject,
        timeSlot,
        attendanceRate,
        color: attendanceRate >= 90 ? '#10b981' : attendanceRate >= 80 ? '#3b82f6' : attendanceRate >= 70 ? '#f59e0b' : '#ef4444'
      };
    });
  }).flat();
};

const generateSubjectComparisonData = (students: StudentAttendance[]) => {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English Literature', 'History', 'Geography', 'Economics', 'Psychology'
  ];
  
  return subjects.map(subject => {
    const attendanceRate = Math.round((75 + Math.random() * 20) * 10) / 10;
    const studentCount = Math.floor(Math.random() * 100) + 30;
    
    return {
      subject,
      attendanceRate,
      studentCount,
      rank: 0, // Will be set below
      status: attendanceRate >= 90 ? 'excellent' : attendanceRate >= 80 ? 'good' : attendanceRate >= 70 ? 'fair' : 'needs_attention',
      color: attendanceRate >= 90 ? '#10b981' : attendanceRate >= 80 ? '#3b82f6' : attendanceRate >= 70 ? '#f59e0b' : '#ef4444'
    };
  }).sort((a, b) => b.attendanceRate - a.attendanceRate)
  .map((item, index) => ({ ...item, rank: index + 1 }));
};

const generateSubjectRiskAnalysisData = (students: StudentAttendance[]) => {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English Literature', 'History', 'Geography', 'Economics', 'Psychology'
  ];
  
  let lowRiskCount = 0;
  let mediumRiskCount = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  
  subjects.forEach(subject => {
    const attendanceRate = 75 + Math.random() * 20;
    
    if (attendanceRate >= 90) {
      lowRiskCount++;
    } else if (attendanceRate >= 80) {
      mediumRiskCount++;
    } else if (attendanceRate >= 70) {
      highRiskCount++;
    } else {
      criticalRiskCount++;
    }
  });
  
  const totalSubjects = subjects.length;
  
  return [
    {
      name: 'Low Risk (≥90%)',
      value: lowRiskCount,
      percentage: Math.round((lowRiskCount / totalSubjects) * 100),
      color: '#10b981'
    },
    {
      name: 'Medium Risk (80-89%)',
      value: mediumRiskCount,
      percentage: Math.round((mediumRiskCount / totalSubjects) * 100),
      color: '#f59e0b'
    },
    {
      name: 'High Risk (70-79%)',
      value: highRiskCount,
      percentage: Math.round((highRiskCount / totalSubjects) * 100),
      color: '#ef4444'
    },
    {
      name: 'Critical Risk (<70%)',
      value: criticalRiskCount,
      percentage: Math.round((criticalRiskCount / totalSubjects) * 100),
      color: '#7c2d12'
    }
  ];
};

const generateSubjectPatternsData = (students: StudentAttendance[]) => {
  const subjects = ['Mathematics', 'Physics', 'Computer Science', 'English', 'History'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  return subjects.map(subject => {
    return daysOfWeek.map(day => {
      const baseRate = 80 + Math.random() * 15;
      const attendanceRate = Math.round(baseRate * 10) / 10;
      
      return {
        subject,
        day,
        attendanceRate,
        intensity: attendanceRate / 100 // For heatmap intensity
      };
    });
  }).flat();
};



// ============================================================================
// ADVANCED CHART CONTROLS
// ============================================================================
// Additional controls for chart interaction, export, and advanced features

// ============================================================================
// ENHANCED CHART COMPONENTS WITH DRILL-DOWN
// ============================================================================
// Chart components that support click-to-drill functionality

const DrillDownChartCard = ({ 
  title, 
  icon: Icon, 
  chartId, 
  children, 
  drillLevel,
  drillData,
  onDrillDown,
  drillDownState,
  chartFilters,
  onChartFilterChange,
  showFilters = true,
  loading = false,
  error = null,
  onRetry,
  ...props 
}: {
  title: string;
  icon: any;
  chartId: string;
  children: React.ReactNode;
  drillLevel?: string;
  drillData?: any;
  onDrillDown?: (level: string, data: any, label: string) => void;
  drillDownState?: DrillDownState;
  chartFilters: ChartSpecificFilters;
  onChartFilterChange: (chartId: string, filters: ChartSpecificFilters) => void;
  showFilters?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  [key: string]: any;
}) => {
  const isDrillable = drillLevel && onDrillDown && drillData;
  const isInDrillPath = drillDownState?.drillPath.includes(drillLevel || '');
  
  return (
    <EnhancedChartCard 
      title={title} 
      icon={Icon} 
      chartId={chartId}
      chartFilters={chartFilters}
      onChartFilterChange={onChartFilterChange}
      showFilters={showFilters}
      loading={loading}
      error={error}
      onRetry={onRetry}
      {...props}
    >
      <div className="relative">
        {children}
        
        {/* Drill-down overlay */}
        {isDrillable && !isInDrillPath && (
          <div className="absolute inset-0 bg-black/5 hover:bg-black/10 transition-colors cursor-pointer rounded-lg flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MousePointer className="w-4 h-4" />
                <span>Click to drill down</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Drill-down button */}
        {isDrillable && (
          <button
            onClick={() => onDrillDown(drillLevel, drillData, title)}
            className="absolute top-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
            title={`Drill down into ${title}`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}
      </div>
    </EnhancedChartCard>
  );
};

const InteractiveBarChart = ({ 
  data, 
  title, 
  drillLevel,
  onDrillDown 
}: { 
  data: any[]; 
  title: string;
  drillLevel?: string;
  onDrillDown?: (level: string, data: any, label: string) => void;
}) => {
  const handleBarClick = (data: any, index: number) => {
    if (onDrillDown && drillLevel) {
      onDrillDown(drillLevel, data, data.name || data.label || `Item ${index + 1}`);
    }
  };
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Bar 
          dataKey="value" 
          fill="#3b82f6" 
          onClick={(_, index) => handleBarClick(data[index], index)}
          style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
        />
      </ReBarChart>
    </ResponsiveContainer>
  );
};

const InteractiveLineChart = ({ 
  data, 
  title, 
  drillLevel,
  onDrillDown 
}: { 
  data: any[]; 
  title: string;
  drillLevel?: string;
  onDrillDown?: (level: string, data: any, label: string) => void;
}) => {
  const handlePointClick = (data: any, index: number) => {
    if (onDrillDown && drillLevel) {
      onDrillDown(drillLevel, data, data.name || data.label || `Point ${index + 1}`);
    }
  };
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
                <Line 
        type="monotone" 
        dataKey="value" 
        stroke="#3b82f6" 
        strokeWidth={2}
        activeDot={{ onClick: (e: any) => {
          if (e && typeof e.index === 'number') handlePointClick(data[e.index], e.index);
        }}}
        style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
      />
      </LineChart>
    </ResponsiveContainer>
  );
};

const ChartActions = ({ chartId, data }: { chartId: string; data: any[] }) => (
  <div className="flex items-center gap-1">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => exportChartData(chartId, data)}
      className="h-6 w-6 p-0"
      title="Export chart data"
    >
      <Download className="w-3 h-3" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => fullscreenChart(chartId)}
      className="h-6 w-6 p-0"
      title="Fullscreen view"
    >
      <Maximize2 className="w-3 h-3" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => refreshChartData(chartId)}
      className="h-6 w-6 p-0"
      title="Refresh data"
    >
      <RefreshCw className="w-3 h-3" />
    </Button>
  </div>
);

const exportChartData = (chartId: string, data: any[]) => {
  // Export chart data as CSV
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chartId}-data.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  toast.success(`Chart data exported as ${chartId}-data.csv`);
};

const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

const fullscreenChart = (chartId: string) => {
  // Mock implementation - in real app, this would open chart in fullscreen modal
  toast.info(`Opening ${chartId} in fullscreen view`);
};

// ============================================================================
// CONTEXT-AWARE DETAIL PANELS
// ============================================================================
// Detailed context panels that show relevant information based on drill-down level

const DrillDownContextPanel = ({ 
  context, 
  loading, 
  onAction 
}: { 
  context: DrillDownContext | null; 
  loading: boolean;
  onAction: (action: string) => void;
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!context) return null;
  
  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Summary Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Records</div>
            <div className="text-2xl font-bold text-blue-900">{context.summary.totalRecords}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Average Rate</div>
            <div className="text-2xl font-bold text-green-900">{context.summary.averageRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      {/* Breakdown Section */}
      {context.details.breakdown.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Breakdown</h3>
          <div className="space-y-2">
            {context.details.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className="font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Patterns Section */}
      {context.details.patterns.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Patterns</h3>
          <div className="space-y-2">
            {context.details.patterns.map((pattern, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm text-blue-700">{pattern.type}</span>
                <span className="font-medium text-blue-900">{pattern.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations Section */}
      {context.details.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
          <div className="space-y-2">
            {context.details.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
        <div className="space-y-2">
          {context.actions.suggested.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action)}
              className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
            >
              <span className="text-sm font-medium text-blue-700">{action}</span>
            </button>
          ))}
          {context.actions.available.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction(action)}
              className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
            >
              <span className="text-sm text-gray-700">{action}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENHANCED BREADCRUMB NAVIGATION
// ============================================================================
// Interactive breadcrumb navigation for drill-down exploration

const DrillDownBreadcrumbs = ({ 
  breadcrumbs, 
  onNavigate 
}: { 
  breadcrumbs: DrillDownBreadcrumb[];
  onNavigate: (level: string) => void;
}) => {
  if (breadcrumbs.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
      <button
        onClick={() => onNavigate('overview')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <Home className="w-4 h-4" />
        <span>Overview</span>
      </button>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.timestamp} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => onNavigate(breadcrumb.level)}
            className={`text-sm font-medium transition-colors ${
              index === breadcrumbs.length - 1 
                ? 'text-gray-900 cursor-default' 
                : 'text-blue-600 hover:text-blue-800 cursor-pointer'
            }`}
          >
            {breadcrumb.label}
          </button>
        </div>
      ))}
    </div>
  );
};

const refreshChartData = (chartId: string) => {
  // Refresh chart data by refetching student data
  refreshStudentsData();
  toast.success(`Refreshing data for ${chartId}`);
};

// Department breakdown state
const [departmentBreakdown, setDepartmentBreakdown] = useState<any[]>([]);
const [departmentViewMode, setDepartmentViewMode] = useState<'all' | 'top' | 'bottom'>('all');
const [departmentSearch, setDepartmentSearch] = useState('');
const [departmentSort, setDepartmentSort] = useState<{ field: 'name' | 'rate' | 'studentCount', direction: 'asc' | 'desc' }>({ field: 'rate', direction: 'desc' });

// Calculate totalSessions and notificationsSent using studentsData
const totalSessions = (studentsData || []).reduce((sum, s) => sum + (s.totalDays || 0), 0);
// TODO: Calculate notificationsSent when notification data is available
const notificationsSent = 0;

// Calculate department breakdown from actual student data
useEffect(() => {
  if (studentsData && studentsData.length > 0) {
    setDepartmentBreakdownLoading(true);
    
    // Simulate API delay for better UX
    const timer = setTimeout(() => {
      try {
        // Filter students by attendance type and time range
        let filtered = studentsData || [];
        if (departmentDrilldown) {
          const now = new Date();
          if (activeRange === 'today') {
            const today = now.toISOString().split('T')[0];
            filtered = (studentsData || []).filter(student => {
              const todaysRecord = student.recentAttendanceRecords?.find(r => r.timestamp.startsWith(today));
              if (!todaysRecord) return false;
              if (departmentDrilldown === 'present') return todaysRecord.status === 'PRESENT';
              if (departmentDrilldown === 'late') return todaysRecord.status === 'LATE';
              if (departmentDrilldown === 'absent') return todaysRecord.status === 'ABSENT';
              return false;
            });
          } else if (activeRange === 'week') {
            // Get start and end of week (Monday to Sunday)
            const day = now.getDay();
            const diffToMonday = (day === 0 ? -6 : 1) - day;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() + diffToMonday);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            filtered = (studentsData || []).filter(student => {
              return student.recentAttendanceRecords?.some(r => {
                const d = new Date(r.timestamp);
                return d >= weekStart && d <= weekEnd &&
                  ((departmentDrilldown === 'present' && r.status === 'PRESENT') ||
                   (departmentDrilldown === 'late' && r.status === 'LATE') ||
                   (departmentDrilldown === 'absent' && r.status === 'ABSENT'));
              });
            });
          } else if (activeRange === 'month') {
            // Get start and end of month
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            filtered = (studentsData || []).filter(student => {
              return student.recentAttendanceRecords?.some(r => {
                const d = new Date(r.timestamp);
                return d >= monthStart && d <= monthEnd &&
                  ((departmentDrilldown === 'present' && r.status === 'PRESENT') ||
                   (departmentDrilldown === 'late' && r.status === 'LATE') ||
                   (departmentDrilldown === 'absent' && r.status === 'ABSENT'));
              });
            });
          }
        }

        // Use department comparisons from backend analytics instead of local calculation
        const breakdown = departmentComparisons.data || [];
        setDepartmentBreakdown(breakdown);
      } catch (error) {
        console.error('Error calculating department breakdown:', error);
        setDepartmentBreakdown([]);
      } finally {
        // Set both loading states to false for synchronized completion
        setDepartmentBreakdownLoading(false);
        setStudentsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }
}, [studentsData, departmentDrilldown, activeRange]);



// ============================================================================
// MAIN RENDER
// ============================================================================
// Renders the complete student attendance management interface
// Includes dashboard, filters, table, and all interactive components
return (
  <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc]">
    {/* ============================================================================
         MAIN NAVIGATION HEADER
         ============================================================================
         Displays the page title, subtitle, and current section indicator */}
    <div className="container mx-auto px-6 py-4">
      <AttendanceHeader
        title="Student Attendance Management"
        subtitle="Monitor and manage student attendance records with real-time insights and comprehensive analytics"
      />
    </div>

    <div className="container mx-auto px-6 pb-6 space-y-6">

      {/* ============================================================================
           REAL-TIME STATUS INDICATORS
           ============================================================================
           Shows live attendance statistics and system status indicators
           Only displayed when showRealTimeStatus is enabled */}
      {showRealTimeStatus && (
        <Card className="border border-blue-200 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">Real-time Status</CardTitle>
                <p className="text-emerald-100 text-sm">Live monitoring and system status</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <InsightsSection
              totalStudents={totalStudents}
              averageAttendanceRate={averageAttendanceRate}
              totalLate={totalLate}
              totalAbsent={totalAbsent}
              getAttendanceRateColor={getAttendanceRateColor}
            />
            {/* <AttendanceStatusIndicators /> */}
          </CardContent>
        </Card>
      )}

      {/* --- NEW: Instructor/Attendance Summary Cards Layout --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Instructors */}
        <Card className="shadow-sm border border-blue-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-gray-500">Total Instructors</CardTitle>
              <div className="text-3xl font-bold text-blue-900 mt-1">90</div>
              <div className="text-xs text-gray-500 mt-1">90 active, 0 inactive</div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
              <Users2 className="w-6 h-6 text-blue-500" />
            </div>
          </CardHeader>
        </Card>
        {/* Overall Attendance */}
        <Card className="shadow-sm border border-green-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-gray-500">Overall Attendance</CardTitle>
              <div className="text-3xl font-bold text-green-700 mt-1">80.8%</div>
              <div className="text-xs text-gray-500 mt-1">131800 of 163111 classes</div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </CardHeader>
        </Card>
        {/* Average Rate */}
        <Card className="shadow-sm border border-purple-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-gray-500">Average Rate</CardTitle>
              <div className="text-3xl font-bold text-purple-700 mt-1">24.2%</div>
              <div className="text-xs text-gray-500 mt-1">Per instructor average</div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
          </CardHeader>
        </Card>
        {/* High Risk */}
        <Card className="shadow-sm border border-red-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-gray-500">High Risk</CardTitle>
              <div className="text-3xl font-bold text-red-700 mt-1">63</div>
              <div className="text-xs text-gray-500 mt-1">Need attention</div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </CardHeader>
        </Card>
      </div>
      {/* --- END NEW LAYOUT --- */}

      {/* ============================================================================
           UNIFIED ATTENDANCE DASHBOARD
           ============================================================================
           Main dashboard with analytics, filters, and student management interface
           Contains real-time data visualization and interactive controls */}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden h-fit xl:h-full p-0">
        <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-t-xl">
              <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                    <h3 className="text-lg font-bold text-white mb-1">Unified Attendance Dashboard</h3>
                    <p className="text-blue-100 text-sm">Real-time monitoring with comprehensive analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white rounded-xl"
                    onClick={refreshStudentsData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white rounded-xl"
                    onClick={() => {}}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
            </div>
          </div>
        </CardHeader>
              <CardContent className="p-6">
                {/* ============================================================================
                     QUICK FILTERS SECTION
                     ============================================================================
                     Always visible filter controls for common filtering operations
                     Includes time range, department, subject, year level, and attendance rate filters */}
                <div className="p-1 mb-4">
                  <div className="flex flex-col gap-4">
                    {/* Quick Filter Row */}
                    <div className="flex flex-wrap gap-4">
                      {/* Time Range Filter */}
                      <div className="flex flex-col min-w-[140px]">
                        <select
                          value={activeRange}
                          onChange={e => handleRangeChange(e.target.value as 'today' | 'week' | 'month')}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                        >
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                        </select>
                    </div>
                      
                    {/* Department Filter */}
                      <div className="flex flex-col w-[150px]">
                      <select
                        value={filters.departments[0] || ''}
                        onChange={e => setFilters({ ...filters, departments: e.target.value ? [e.target.value] : [] })}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
                      >
                          <option value="">All Departments</option>
                        {departmentCodes.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                      
                      {/* Subject Filter - NEW: Most important for attendance */}
                      <div className="flex flex-col w-[140px]">
                        <select
                          value={filters.subjects[0] || ''}
                          onChange={e => setFilters({ ...filters, subjects: e.target.value ? [e.target.value] : [] })}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
                        >
                          <option value="">All Subjects</option>
                          {subjectEnrollments.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Course Filter - MOVED from Advanced Filters */}
                      <div className="flex flex-col w-[140px]">
                        <select
                          value={filters.courses[0] || ''}
                          onChange={e => setFilters({ ...filters, courses: e.target.value ? [e.target.value] : [] })}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
                        >
                          <option value="">All Courses</option>
                          {courses.map(course => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                      </div>
                      
                    {/* Year Level Filter */}
                      <div className="flex flex-col w-[140px]">
                      <select
                        value={filters.yearLevels[0] || ''}
                        onChange={e => setFilters({ ...filters, yearLevels: e.target.value ? [e.target.value] : [] })}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
                      >
                          <option value="">All Years</option>
                        {yearLevels.map(yl => (
                          <option key={yl} value={yl}>{yl}</option>
                        ))}
                      </select>
                    </div>

                      {/* Advanced Filters Button */}
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAdvancedFiltersRow((prev: boolean) => !prev)}
                          className="text-blue-800 bg-blue-100 rounded-xl hover:text-white hover:bg-blue-600 h-9 px-4"
                        >
                          <span className="ml-1 text-xs">
                            Advanced Filters
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFiltersRow ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ============================================================================
                     ADVANCED FILTERS EXPANDABLE ROW
                     ============================================================================
                     Expandable section with additional filtering options
                     Includes academic filters, student filters, and attendance-specific filters
                     Only shown when showAdvancedFiltersRow is true */}
                {showAdvancedFiltersRow && (
                  <div className="mb-4">
                    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 animate-fade-in shadow-sm">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-blue-900">Advanced Filters</h3>
                          </div>
                        </div> 
                      </div>
                      <div className="border-b border-blue-100 my-3"></div>
                      
                      {/* Academic Filters Group */}
                      <div className="mb-4 pb-3 border-b border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="w-3 h-3 text-blue-600" />
                          <h4 className="font-semibold text-blue-700 text-xs uppercase tracking-wider">Academic Filters</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {/* Semester Filter */}
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Semester</label>
                            <select
                              value={filters.semester[0] || ''}
                              onChange={e => setFilters({ ...filters, semester: e.target.value ? [e.target.value] : [] })}
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="">All Semesters</option>
                              <option value="1st">1st Semester</option>
                              <option value="2nd">2nd Semester</option>
                              <option value="3rd">3rd Semester</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Student Filters Group */}
                      <div className="mb-4 pb-3 border-b border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-3 h-3 text-blue-600" />
                          <h4 className="font-semibold text-blue-700 text-xs uppercase tracking-wider">Student Filters</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {/* Student Status Filter */}
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Student Status</label>
                            <select
                              value={filters.studentStatuses[0] || ''}
                              onChange={e => setFilters({ ...filters, studentStatuses: e.target.value ? [e.target.value] : [] })}
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="">All Statuses</option>
                              {studentStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Student Type Filter */}
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Student Type</label>
                            <select
                              value={filters.studentTypes[0] || ''}
                              onChange={e => setFilters({ ...filters, studentTypes: e.target.value ? [e.target.value] : [] })}
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="">All Types</option>
                              {studentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Filters Group */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3 h-3 text-blue-600" />
                          <h4 className="font-semibold text-blue-700 text-xs uppercase tracking-wider">Attendance Filters</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {/* Attendance Status Filter */}
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Attendance Status</label>
                            <select
                              value={advancedFilters.attendanceTypes[0] || ''}
                              onChange={e => setAdvancedFilters({ ...advancedFilters, attendanceTypes: e.target.value ? [e.target.value] : [] })}
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="">All Statuses</option>
                              <option value="PRESENT">Present</option>
                              <option value="LATE">Late</option>
                              <option value="ABSENT">Absent</option>
                              <option value="EXCUSED">Excused</option>
                            </select>
                          </div>
                          
                          {/* Time of Day Filter */}
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Time of Day</label>
                            <select
                              value={advancedFilters.timeOfDay[0] || ''}
                              onChange={e => setAdvancedFilters({ ...advancedFilters, timeOfDay: e.target.value ? [e.target.value] : [] })}
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                            >
                              <option value="">All Times</option>
                              <option value="Morning">Morning (6AM-12PM)</option>
                              <option value="Afternoon">Afternoon (12PM-6PM)</option>
                              <option value="Evening">Evening (6PM-12AM)</option>
                              <option value="Night">Night (12AM-6AM)</option>
                            </select>
                          </div>
                          
                          {/* Date Range Picker */}
                          <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1">Date Range</label>
                            <div className="flex gap-2">
                              <input
                                type="date"
                                value={filters.dateRangeStart || ''}
                                onChange={e => setFilters({ ...filters, dateRangeStart: e.target.value })}
                                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white flex-1"
                                placeholder="Start Date"
                              />
                              <input
                                type="date"
                                value={filters.dateRangeEnd || ''}
                                onChange={e => setFilters({ ...filters, dateRangeEnd: e.target.value })}
                                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white flex-1"
                                placeholder="End Date"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Advanced Filter Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-600">
                            {Object.values(filters).filter(arr => Array.isArray(arr) && arr.length > 0).length} active filters
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 h-7 px-3 text-xs"
                          >
                            Clear All
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowAdvancedFiltersRow(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-3 text-xs"
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Trends and Comparison Tabs */}
                <div className="mt-4">
                  <Tabs value={activeAnalyticsTab} onValueChange={handleAnalyticsTabChange} className="flex-1 flex flex-col">
                    <div className="px-2 py-4 border-b border-gray-200">
                      <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-xl">
                        <TabsTrigger value="trends" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-center min-w-0">
                          <TrendingUp className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                          Attendance Trends
                        </TabsTrigger>
                        <TabsTrigger value="comparison" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-center min-w-0">
                          <BarChart3 className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                          Comparative Analysis
                        </TabsTrigger>
                        <TabsTrigger value="breakdown" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-center min-w-0">
                          <PieChartIcon className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                          Status and Risks
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-center min-w-0">
                          <BookOpen className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                          Goals
                        </TabsTrigger>
                        <TabsTrigger value="subjects" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-center min-w-0">
                          <BookOpen className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                          Subjects Analytics
                        </TabsTrigger>
                      </TabsList>
                    </div>
            

                    {/* Trends Analysis Tab */}
                    <TabsContent value="trends" className="flex-1 space-y-6 data-[state=active]:animate-fade-in">
                      {/* NEW: Custom Trend Range Selector */}
                      <div className="px-6 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-blue-900">Trend Analysis</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-600">Time Range:</span>
                              <Select value={customTrendRange} onValueChange={(value: any) => setCustomTrendRange(value)}>
                                <SelectTrigger className="w-32 h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7d">Last 7 Days</SelectItem>
                                  <SelectItem value="30d">Last 30 Days</SelectItem>
                                  <SelectItem value="90d">Last 90 Days</SelectItem>
                                  <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                              </Select>
                              {customTrendRange === 'custom' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCustomDatePicker(true)}
                                  className="h-8 text-xs"
                                >
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  Pick Dates
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCustomizationDialog(true)}
                              className="h-8 text-xs"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Customize
                            </Button>

                          </div>
                        </div>
                        
                        {/* NEW: Drill-down Breadcrumb */}
                        {showDrillDownBreadcrumb && drillDownHistory.length > 0 && (
                          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleDrillUp}
                              className="h-6 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ChevronLeft className="w-3 h-3 mr-1" />
                              Back
                            </Button>
                            <span className="text-sm text-blue-600">|</span>
                            {drillDownHistory.map((history, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm text-blue-800 font-medium">
                                  {history.level}: {history.value}
                                </span>
                                {index < drillDownHistory.length - 1 && (
                                  <ChevronRight className="w-3 h-3 text-blue-400" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Weekly Trend Chart */}
                    <EnhancedChartCard
                      title="Weekly Attendance Trend"
                      icon={TrendingUp}
                      chartId="weekly-trend"
                      chartFilters={chartFilters['weekly-trend']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('weekly-trend', chartFilters['weekly-trend'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            dot={{ fill: '#3b82f6', r: 4 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Monthly Comparison */}
                    <EnhancedChartCard
                      title="Monthly Attendance Trend"
                      icon={BarChart3}
                      chartId="monthly-comparison"
                      chartFilters={chartFilters['monthly-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('monthly-comparison', chartFilters['monthly-comparison'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#3b82f6" name="Current" />
                          <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                        {/* Time of Day Analysis */}
                    <EnhancedChartCard
                      title="Attendance by Time of Day"
                      icon={Clock}
                      chartId="time-of-day"
                      chartFilters={chartFilters['time-of-day']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('time-of-day', chartFilters['time-of-day'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="rate" fill="#3b82f6" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                        {/* Day of Week Analysis */}
                    <EnhancedChartCard
                      title="Attendance by Day of Week"
                      icon={CalendarIcon}
                      chartId="day-of-week"
                      chartFilters={chartFilters['day-of-week']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('day-of-week', chartFilters['day-of-week'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="rate" fill="#3b82f6" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                        {/* Attendance Trend Forecast */}
                    <EnhancedChartCard
                      title="Attendance Trend Forecast"
                      icon={TrendingUp}
                      chartId="attendance-forecast"
                      chartFilters={chartFilters['attendance-forecast']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('attendance-forecast', chartFilters['attendance-forecast'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            fontSize={10}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => {
                              const date = new Date(label);
                              return date.toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              });
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            dot={{ fill: '#3b82f6', r: 3 }} 
                            strokeDasharray={undefined}
                          />
                          {/* Confidence interval for forecast */}
                          {chartFilters['attendance-forecast'].showConfidenceIntervals && (
                            <>
                              <Line 
                                type="monotone" 
                                dataKey="confidenceUpper" 
                                stroke="#3b82f6" 
                                strokeWidth={1} 
                                strokeOpacity={0.3}
                                dot={false}
                                strokeDasharray="5 5"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="confidenceLower" 
                                stroke="#3b82f6" 
                                strokeWidth={1} 
                                strokeOpacity={0.3}
                                dot={false}
                                strokeDasharray="5 5"
                              />
                            </>
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                        {/* Late Arrival Trends */}
                    <EnhancedChartCard
                      title="Late Arrival Trends"
                      icon={Clock}
                      chartId="late-arrival-trends"
                      chartFilters={chartFilters['late-arrival-trends']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('late-arrival-trends', chartFilters['late-arrival-trends'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" fontSize={10} />
                          <YAxis domain={[0, 25]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name === 'currentLateRate' ? 'Current Week' : 'Previous Week']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="currentLateRate" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            dot={{ fill: '#ef4444', r: 4 }} 
                            name="Current Week"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="previousLateRate" 
                            stroke="#94a3b8" 
                            strokeWidth={2} 
                            dot={{ fill: '#94a3b8', r: 4 }} 
                            strokeDasharray="5 5"
                            name="Previous Week"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>


                  </div>
                </TabsContent>

                {/* Comparative Analysis Tab */}
                <TabsContent value="comparison" className="flex-1 space-y-6 data-[state=active]:animate-fade-in">
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-blue-900">Comparative Analysis</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600">Comparison Period:</span>
                          <Select value={comparisonPeriod} onValueChange={(value: any) => setComparisonPeriod(value)}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">Week over Week</SelectItem>
                              <SelectItem value="month">Month over Month</SelectItem>
                              <SelectItem value="quarter">Quarter over Quarter</SelectItem>
                              <SelectItem value="year">Year over Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowComparisonCustomization(true)}
                          className="h-8 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Customize
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Department Comparison */}
                    <EnhancedChartCard
                      title="Department Performance Comparison"
                      icon={Building}
                      chartId="department-comparison"
                      chartFilters={chartFilters['department-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('department-comparison', chartFilters['department-comparison'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="department" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
                          <Bar dataKey="previous" fill="#94a3b8" name="Previous Period" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Year Level Comparison */}
                    <EnhancedChartCard
                      title="Year Level Performance Comparison"
                      icon={GraduationCap}
                      chartId="year-level-comparison"
                      chartFilters={chartFilters['year-level-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('year-level-comparison', chartFilters['year-level-comparison'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="yearLevel" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#10b981" name="Current Period" />
                          <Bar dataKey="previous" fill="#6b7280" name="Previous Period" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Course Comparison */}
                    <EnhancedChartCard
                      title="Course Performance Comparison"
                      icon={BookOpen}
                      chartId="course-comparison"
                      chartFilters={chartFilters['course-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('course-comparison', chartFilters['course-comparison'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="course" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#f59e0b" name="Current Period" />
                          <Bar dataKey="previous" fill="#d1d5db" name="Previous Period" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Section Performance Comparison */}
                    <EnhancedChartCard
                      title="Section Performance Comparison"
                      icon={Users}
                      chartId="section-comparison"
                      chartFilters={chartFilters['section-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('section-comparison', chartFilters['section-comparison'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="section" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#ec4899" name="Current Period" />
                          <Bar dataKey="previous" fill="#f9a8d4" name="Previous Period" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Attendance Rate Distribution Comparison */}
                    <EnhancedChartCard
                      title="Attendance Rate Distribution Comparison"
                      icon={BarChart3}
                      chartId="rate-distribution-comparison"
                      chartFilters={chartFilters['rate-distribution-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('rate-distribution-comparison', chartFilters['rate-distribution-comparison'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rateRange" fontSize={10} />
                          <YAxis domain={[0, 'dataMax + 5']} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [value, name]}
                          />
                          <Legend />
                          <Bar dataKey="current" fill="#8b5cf6" name="Current Period" />
                          <Bar dataKey="previous" fill="#c4b5fd" name="Previous Period" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Improvement Analysis */}
                    <EnhancedChartCard
                      title="Improvement Analysis"
                      icon={TrendingUp}
                      chartId="improvement-analysis"
                      chartFilters={chartFilters['improvement-analysis']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('improvement-analysis', chartFilters['improvement-analysis'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" fontSize={10} />
                          <YAxis domain={[-20, 20]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value > 0 ? '+' : ''}${value}%`, name]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="improvement" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            dot={{ fill: '#10b981', r: 4 }} 
                            name="Improvement Rate"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="target" 
                            stroke="#f59e0b" 
                            strokeWidth={2} 
                            dot={{ fill: '#f59e0b', r: 4 }} 
                            strokeDasharray="5 5"
                            name="Target Improvement"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>
                  </div>
                </TabsContent>

                {/* Breakdown Tab */}
                <TabsContent value="breakdown" className="flex-1 space-y-6 data-[state=active]:animate-fade-in">
                  {/* NEW: Status and Risks Header */}
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-blue-900">Status and Risk Analysis</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600">Risk Level:</span>
                          <Select value={riskLevelFilter} onValueChange={(value: any) => setRiskLevelFilter(value)}>
                            <SelectTrigger className="w-32 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="high">High Risk</SelectItem>
                              <SelectItem value="medium">Medium Risk</SelectItem>
                              <SelectItem value="low">Low Risk</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-blue-600">Status:</span>
                          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                            <SelectTrigger className="w-32 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCustomizationDialog(true)}
                          className="h-8 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Customize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRiskReportDialog(true)}
                          className="h-8 text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Risk Report
                        </Button>
                      </div>
                    </div>
                    </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Attendance Status Breakdown */}
                    <EnhancedChartCard
                      title="Attendance Status Breakdown"
                      icon={PieChartIcon}
                      chartId="attendance-breakdown"
                      chartFilters={chartFilters['attendance-breakdown']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        {(() => {
                          const data = getFilteredChartData('attendance-breakdown', chartFilters['attendance-breakdown']);
                          const chartType = chartFilters['attendance-breakdown'].chartType;
                          
                          if (chartType === 'pie') {
                            return (
                              <RePieChart>
                                <Pie
                                  data={data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                  labelFormatter={(label) => `${label}`}
                                />
                              </RePieChart>
                            );
                          }
                          
                          if (chartType === 'doughnut') {
                            return (
                              <RePieChart>
                                <Pie
                                  data={data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                                  outerRadius={60}
                                  innerRadius={30}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                  labelFormatter={(label) => `${label}`}
                                />
                              </RePieChart>
                            );
                          }
                          
                          if (chartType === 'bar') {
                            return (
                              <ReBarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={10} />
                                <YAxis domain={[0, 'dataMax + 10']} fontSize={10} />
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                />
                                <Bar dataKey="value" fill="#3b82f6">
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </ReBarChart>
                            );
                          }
                          
                          if (chartType === 'horizontal-bar') {
                            return (
                              <ReBarChart data={data} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 'dataMax + 10']} fontSize={10} />
                                <YAxis dataKey="name" type="category" fontSize={10} />
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                />
                                <Bar dataKey="value" fill="#3b82f6">
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </ReBarChart>
                            );
                          }
                          
                          // Default fallback
                          return (
                            <RePieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: any, name: any) => [value, name]}
                                labelFormatter={(label) => `${label}`}
                              />
                            </RePieChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Risk Level Breakdown */}
                    <EnhancedChartCard
                      title="Risk Level Breakdown"
                      icon={AlertTriangle}
                      chartId="risk-level-breakdown"
                      chartFilters={chartFilters['risk-level-breakdown']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        {(() => {
                          const data = getFilteredChartData('risk-level-breakdown', chartFilters['risk-level-breakdown']);
                          const chartType = chartFilters['risk-level-breakdown'].chartType;
                          
                          if (chartType === 'doughnut') {
                            return (
                              <RePieChart>
                                <Pie
                                  data={data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                                  outerRadius={60}
                                  innerRadius={30}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                  labelFormatter={(label) => `${label}`}
                                />
                              </RePieChart>
                            );
                          }
                          
                          if (chartType === 'pie') {
                            return (
                              <RePieChart>
                                <Pie
                                  data={data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                  labelFormatter={(label) => `${label}`}
                                />
                              </RePieChart>
                            );
                          }
                          
                          if (chartType === 'bar') {
                            return (
                              <ReBarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={10} />
                                <YAxis domain={[0, 'dataMax + 10']} fontSize={10} />
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                />
                                <Bar dataKey="value" fill="#3b82f6">
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </ReBarChart>
                            );
                          }
                          
                          if (chartType === 'horizontal-bar') {
                            return (
                              <ReBarChart data={data} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 'dataMax + 10']} fontSize={10} />
                                <YAxis dataKey="name" type="category" fontSize={10} />
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                />
                                <Bar dataKey="value" fill="#3b82f6">
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </ReBarChart>
                            );
                          }
                          
                          // Default fallback to doughnut
                          return (
                            <RePieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={60}
                                innerRadius={30}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: any, name: any) => [value, name]}
                                labelFormatter={(label) => `${label}`}
                              />
                            </RePieChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Attendance Status Summary */}
                                </div>
                </TabsContent>

                {/* Subjects Tab */}
                <TabsContent value="subjects" className="flex-1 space-y-6 data-[state=active]:animate-fade-in">
                  {/* NEW: Subjects Analytics Header */}
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-blue-900">Subject Performance Analytics</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600">Subject:</span>
                          <Select value={subjectFilter} onValueChange={(value: any) => setSubjectFilter(value)}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Subjects</SelectItem>
                              <SelectItem value="mathematics">Mathematics</SelectItem>
                              <SelectItem value="physics">Physics</SelectItem>
                              <SelectItem value="chemistry">Chemistry</SelectItem>
                              <SelectItem value="biology">Biology</SelectItem>
                              <SelectItem value="computer-science">Computer Science</SelectItem>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="history">History</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-blue-600">Time Range:</span>
                          <Select value={subjectTimeRange} onValueChange={(value: any) => setSubjectTimeRange(value)}>
                            <SelectTrigger className="w-32 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                              <SelectItem value="semester">This Semester</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-blue-600">Department:</span>
                          <Select value={subjectDepartmentFilter} onValueChange={(value: any) => setSubjectDepartmentFilter(value)}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Departments</SelectItem>
                              <SelectItem value="computer-science">Computer Science</SelectItem>
                              <SelectItem value="engineering">Engineering</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="arts">Arts</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCustomizationDialog(true)}
                          className="h-8 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Customize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSubjectReportDialog(true)}
                          className="h-8 text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Subject Report
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Subject Performance */}
                    <EnhancedChartCard
                      title="Subject Performance"
                      icon={BookOpen}
                      chartId="subject-performance"
                      chartFilters={chartFilters['subject-performance']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('subject-performance', chartFilters['subject-performance'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="attendanceRate" fill="#3b82f6">
                            {getFilteredChartData('subject-performance', chartFilters['subject-performance']).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Subject Trends */}
                    <EnhancedChartCard
                      title="Subject Attendance Trends"
                      icon={TrendingUp}
                      chartId="subject-trends"
                      chartFilters={chartFilters['subject-trends']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('subject-trends', chartFilters['subject-trends'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Line dataKey="attendanceRate" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Subject Time Analysis */}
                    <EnhancedChartCard
                      title="Subject Attendance by Time"
                      icon={Clock}
                      chartId="subject-time-analysis"
                      chartFilters={chartFilters['subject-time-analysis']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('subject-time-analysis', chartFilters['subject-time-analysis'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timeSlot" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="attendanceRate" fill="#10b981">
                            {getFilteredChartData('subject-time-analysis', chartFilters['subject-time-analysis']).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Subject Comparison */}
                    <EnhancedChartCard
                      title="Subject Comparison"
                      icon={BarChart3}
                      chartId="subject-comparison"
                      chartFilters={chartFilters['subject-comparison']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('subject-comparison', chartFilters['subject-comparison'])} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} fontSize={10} />
                          <YAxis dataKey="subject" type="category" fontSize={10} width={80} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="attendanceRate" fill="#f59e0b">
                            {getFilteredChartData('subject-comparison', chartFilters['subject-comparison']).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Subject Risk Analysis */}
                    <EnhancedChartCard
                      title="Subject Risk Analysis"
                      icon={AlertTriangle}
                      chartId="subject-risk-analysis"
                      chartFilters={chartFilters['subject-risk-analysis']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        {(() => {
                          const data = getFilteredChartData('subject-risk-analysis', chartFilters['subject-risk-analysis']);
                          const chartType = chartFilters['subject-risk-analysis'].chartType;
                          
                          if (chartType === 'doughnut') {
                            return (
                              <RePieChart>
                                <Pie
                                  data={data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                                  outerRadius={60}
                                  innerRadius={30}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => [value, name]}
                                  labelFormatter={(label) => `${label}`}
                                />
                              </RePieChart>
                            );
                          }
                          
                          return (
                            <RePieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: any, name: any) => [value, name]}
                                labelFormatter={(label) => `${label}`}
                              />
                            </RePieChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Subject Patterns */}
                    <EnhancedChartCard
                      title="Subject Attendance Patterns"
                      icon={CalendarIcon}
                      chartId="subject-patterns"
                      chartFilters={chartFilters['subject-patterns']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('subject-patterns', chartFilters['subject-patterns'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="attendanceRate" fill="#8b5cf6" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>
                  </div>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="flex-1 space-y-6 data-[state=active]:animate-fade-in">
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-blue-900">Attendance Goals & Targets</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600">Goal Period:</span>
                          <Select value={goalPeriod} onValueChange={(value: any) => setGoalPeriod(value)}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semester">Semester</SelectItem>
                              <SelectItem value="quarter">Quarter</SelectItem>
                              <SelectItem value="month">Month</SelectItem>
                              <SelectItem value="week">Week</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGoalCustomization(true)}
                          className="h-8 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Customize Goals
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Attendance Goal Tracking */}
                    <EnhancedChartCard
                      title="Attendance Goal Progress"
                      icon={Target}
                      chartId="attendance-goal-tracking"
                      chartFilters={chartFilters['attendance-goal-tracking']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('attendance-goal-tracking', chartFilters['attendance-goal-tracking'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => {
                              if (name === 'currentRate') return [`${value}%`, 'Current Rate'];
                              if (name === 'targetGoal') return [`${value}%`, 'Target Goal'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="currentRate" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            dot={{ fill: '#3b82f6', r: 4 }} 
                            name="Current Rate"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="targetGoal" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            dot={{ fill: '#10b981', r: 4 }} 
                            strokeDasharray="5 5"
                            name="Target Goal (95%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Goal Achievement by Department */}
                    <EnhancedChartCard
                      title="Goal Achievement by Department"
                      icon={Building}
                      chartId="goal-achievement"
                      chartFilters={chartFilters['goal-achievement']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('goal-achievement', chartFilters['goal-achievement'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="department" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="currentRate" fill="#3b82f6" name="Current Rate" />
                          <Bar dataKey="targetGoal" fill="#10b981" name="Target Goal" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Performance Ranking */}
                    <EnhancedChartCard
                      title="Department Performance Ranking"
                      icon={TrendingUp}
                      chartId="performance-ranking"
                      chartFilters={chartFilters['performance-ranking']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('performance-ranking', chartFilters['performance-ranking'])} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} fontSize={10} />
                          <YAxis dataKey="department" type="category" fontSize={10} width={80} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, 'Attendance Rate']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="avgAttendance" fill="#8b5cf6">
                            {getFilteredChartData('performance-ranking', chartFilters['performance-ranking']).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Goal Gap Analysis */}
                    <EnhancedChartCard
                      title="Goal Gap Analysis"
                      icon={AlertTriangle}
                      chartId="goal-gap-analysis"
                      chartFilters={chartFilters['goal-gap-analysis']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={getFilteredChartData('goal-gap-analysis', chartFilters['goal-gap-analysis'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" fontSize={10} />
                          <YAxis domain={[-20, 20]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value > 0 ? '+' : ''}${value}%`, name]}
                          />
                          <Legend />
                          <Bar dataKey="gap" fill="#ef4444" name="Gap to Goal" />
                          <Bar dataKey="surplus" fill="#10b981" name="Exceeding Goal" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Goal Setting Dashboard */}
                    <EnhancedChartCard
                      title="Goal Setting Dashboard"
                      icon={Target}
                      chartId="goal-setting-dashboard"
                      chartFilters={chartFilters['goal-setting-dashboard']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <RePieChart>
                          <Pie
                            data={getFilteredChartData('goal-setting-dashboard', chartFilters['goal-setting-dashboard'])}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getFilteredChartData('goal-setting-dashboard', chartFilters['goal-setting-dashboard']).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [value, name]}
                            labelFormatter={(label) => `${label}`}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>

                    {/* Goal Trend Analysis */}
                    <EnhancedChartCard
                      title="Goal Trend Analysis"
                      icon={TrendingUp}
                      chartId="goal-trend-analysis"
                      chartFilters={chartFilters['goal-trend-analysis']}
                      onChartFilterChange={handleChartFilterChange}
                      loading={loading}
                      error={null}
                      onRetry={refreshStudentsData}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={getFilteredChartData('goal-trend-analysis', chartFilters['goal-trend-analysis'])}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" fontSize={10} />
                          <YAxis domain={[0, 100]} fontSize={10} />
                          <RechartsTooltip 
                            formatter={(value: any, name: any) => [`${value}%`, name]}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="actualRate" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            dot={{ fill: '#3b82f6', r: 4 }} 
                            name="Actual Rate"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="projectedRate" 
                            stroke="#f59e0b" 
                            strokeWidth={2} 
                            dot={{ fill: '#f59e0b', r: 4 }} 
                            strokeDasharray="5 5"
                            name="Projected Rate"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="targetRate" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            dot={{ fill: '#10b981', r: 4 }} 
                            strokeDasharray="3 3"
                            name="Target Rate"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </EnhancedChartCard>
                  </div>
                </TabsContent>
              </Tabs>
          </div>
        </CardContent>
      </Card>
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
                        <p className="text-blue-100 text-sm">Essential tools and shortcuts</p>
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
                      <div className="text-xs text-orange-600">Alert parents/students</div>
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
                  
      {/* Enhanced Attendance Dashboard Card with Tab Interface */}
      {/* REMOVED: Live Attendance Dashboard section */}

      {/* Student Attendance Management - Unified Search & Report */}
      <div className="space-y-6">
          <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden p-0">
          <CardHeader className="p-0">
{/* Blue Gradient Header */}
<div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] rounded-t-2xl">
  <div className="container mx-auto px-6 py-6">
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Student Attendance Report</h2>
          <div className="text-blue-100 text-sm">Search, filter and manage attendance records</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="text-white hover:bg-blue-700" onClick={handleClearFilters}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset All
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-blue-700">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={refreshStudentsData}>Refresh Data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</div>
{/* Filter/Search Bar and Chips */}
<div className="bg-white px-6 pt-4 pb-2 border-b border-blue-100">
  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
    <div className="flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          placeholder="Search students..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="border-blue-200 text-blue-700" size="sm">
        <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" /> At Risk (1)
      </Button>
      <Button variant="outline" className="border-blue-200 text-blue-700" size="sm">
        <User className="w-4 h-4 mr-1 text-green-500" /> Perfect (19)
      </Button>
      <Button variant="outline" className="border-blue-200 text-blue-700" size="sm">
        <ArrowDown className="w-4 h-4 mr-1 text-blue-500" /> Low (1)
      </Button>
      <Button variant="outline" className="border-blue-200 text-blue-700" size="sm">
        <Filter className="w-4 h-4 mr-1 text-blue-500" /> Advanced
      </Button>
    </div>
  </div>
</div>
</CardHeader>
            {/* Action Buttons in Top-Right */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/90 text-blue-700 hover:bg-white border border-blue-100"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/90 text-blue-700 hover:bg-white border border-blue-100"
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    Page Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-blue-200 rounded-xl shadow-lg p-2">
                  <div className="space-y-1">
                    {/* Import Section */}
                    <div className="px-3 py-2 text-xs font-semibold text-blue-900 uppercase tracking-wider border-b border-blue-100 mb-2">
                      Import
                    </div>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            alert(`Importing students from ${file.name} (functionality to be implemented)`);
                          }
                        };
                        input.click();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                    >
                      <FileDown className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors rotate-180" />
                      <span className="group-hover:text-blue-900 transition-colors">Import Students</span>
                    </button>

                    {/* Export Section */}
                    <div className="px-3 py-2 text-xs font-semibold text-blue-900 uppercase tracking-wider border-b border-blue-100 mb-2 mt-4">
                      Export
                    </div>
                    <button
                      onClick={() => handleExportCSV('current')}
                      className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                    >
                      <FileDown className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                      <span className="group-hover:text-blue-900 transition-colors">Export as CSV</span>
                    </button>
                    <button
                      onClick={() => handleExportExcel('current')}
                      className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                    >
                      <FileDown className="w-4 h-4 text-green-600 group-hover:text-green-800 transition-colors" />
                      <span className="group-hover:text-blue-900 transition-colors">Export as Excel</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                    >
                      <FileDown className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                      <span className="group-hover:text-blue-900 transition-colors">Export as PDF</span>
                    </button>

                    {/* Print Section */}
                    <div className="px-3 py-2 text-xs font-semibold text-blue-900 uppercase tracking-wider border-b border-blue-100 mb-2 mt-4">
                      Print
                    </div>
                    <button
                      onClick={handlePrint}
                      className="w-full text-left px-4 py-2.5 text-sm border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-xl flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-all duration-300 cursor-pointer group hover:shadow-sm font-medium"
                    >
                      <Printer className="w-4 h-4 text-blue-600 group-hover:text-blue-800 transition-colors" />
                      <span className="group-hover:text-blue-900 transition-colors">Print Page</span>
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>



            {/* Content Section */}
            <div className="p-3">

        {/* Enhanced Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="sticky top-[64px] z-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl mb-6 p-6 animate-fade-in border-2 border-blue-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <div>
                  <span className="font-bold text-xl">{selected.size} student{selected.size !== 1 ? 's' : ''} selected</span>
                  <div className="text-blue-100 text-sm mt-1">
                    Choose an action to apply to selected students
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => alert('Export selected students (stub)')}
                  className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm font-medium"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button
                  onClick={() => alert('Mark selected as excused (stub)')}
                  className="bg-green-500 text-white hover:bg-green-600 shadow-sm font-medium"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Excused
                </Button>
                <Button
                  onClick={() => alert('Send notification to selected (stub)')}
                  className="bg-orange-500 text-white hover:bg-orange-600 shadow-sm font-medium"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Notice
                </Button>
                {canDeleteStudents && (
                  <Button
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="bg-red-600 text-white hover:bg-red-700 shadow-sm font-medium"
                    size="sm"
                    disabled={selectedIds.length > 50}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                    {selectedIds.length > 50 && (
                      <span className="ml-1 text-xs">(Max 50)</span>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => setSelected(new Set())}
                  variant="ghost"
                  className="text-blue-100 hover:bg-blue-600 hover:text-white"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Data Table Container */}
        <div className="bg-white overflow-hidden px-3">

          {/* Enhanced Empty State with Context-Aware Messages */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <EmptyState
                icon={<RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />}
                title="Loading students..."
                description="Please wait while we fetch the student attendance data."
                action={null}
              />
            </div>
          ) : filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {(() => {
                const hasActiveFilters = Object.values(filters).some(value => 
                  Array.isArray(value) ? value.length > 0 : value !== ''
                ) || searchQuery.trim() !== '';
                
                const hasStudents = studentsData.length > 0;
                
                if (!hasStudents) {
                  return (
                    <EmptyState
                      icon={<Users className="w-8 h-8 text-blue-400" />}
                      title="No students in the system"
                      description="It looks like there are no students registered yet. Add some students to get started with attendance tracking."
                      action={
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            onClick={() => {
                              // Navigate to add student page or open add student modal
                              console.log('Navigate to add student');
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Student
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={refreshStudentsData}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>
                      }
                    />
                  );
                } else if (hasActiveFilters) {
                  const hasFilters = Object.values(filters).some(value => 
                    Array.isArray(value) ? value.length > 0 : value !== ''
                  );
                  const hasSearch = searchQuery.trim() !== '';
                  
                  return (
                    <EmptyState
                      icon={<Filter className="w-8 h-8 text-blue-400" />}
                      title="No students match your criteria"
                      description="No students found matching your current search and filter criteria. Try adjusting your filters or search terms."
                      action={
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleClearFilters}
                            disabled={!hasFilters}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear All Filters
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setSearchQuery('')}
                            disabled={!hasSearch}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Clear Search
                          </Button>
                        </div>
                      }
                    />
                  );
                } else {
                  return (
                    <EmptyState
                      icon={<Users className="w-8 h-8 text-blue-400" />}
                      title="No students found"
                      description="Try adjusting your search criteria or filters to find the students you're looking for."
                      action={
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={refreshStudentsData}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>
                      }
                    />
                  );
                }
              })()}
            </div>
          )}

          {/* Enhanced Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="mb-4">
              <BulkActionsBar
                selectedCount={selectedIds.length}
                entityLabel="student"
                actions={[
                  {
                    key: "bulk-actions",
                    label: "Enhanced Bulk Actions",
                    icon: <Settings className="w-4 h-4 mr-2" />,
                    onClick: () => {
                      const selectedStudents = paginatedStudents.filter(s => selectedIds.includes(s.id));
                      setSelectedStudentsForBulkAction(selectedStudents);
                      setBulkActionsDialogOpen(true);
                    },
                    tooltip: "Open enhanced bulk actions dialog with status updates, notifications, and exports",
                    variant: "default"
                  },
                  {
                    key: "export",
                    label: "Quick Export",
                    icon: <Download className="w-4 h-4 mr-2" />,
                    onClick: () => {
                      const selectedStudents = paginatedStudents.filter(s => selectedIds.includes(s.id));
                      handleExportSelectedStudents(selectedStudents);
                    },
                    tooltip: "Quick export selected students to CSV"
                  },
                  {
                    key: "notify",
                    label: "Quick Notify",
                    icon: <Bell className="w-4 h-4 mr-2" />,
                    onClick: () => {
                      const selectedStudents = paginatedStudents.filter(s => selectedIds.includes(s.id));
                      handleBulkNotifyStudents(selectedStudents);
                    },
                    tooltip: "Quick notification to selected students"
                  },
                  {
                    key: "delete",
                    label: "Delete Selected",
                    icon: <Trash2 className="w-4 h-4 mr-2" />,
                    onClick: () => {
                      const selectedStudents = paginatedStudents.filter(s => selectedIds.includes(s.id));
                      if (selectedStudents.length > 0) {
                        // Use existing bulk delete function
                        handleBulkDeleteStudents();
                      }
                    },
                    variant: "destructive",
                    tooltip: "Delete selected students (cannot be undone)",
                    disabled: !canDeleteStudents
                  }
                ]}
                onClear={() => setSelectedIds([])}
              />
            </div>
          )}
          {/* Table Content */}
          <div className="relative">
            {/* Table layout for xl+ only */}
            <div className="hidden xl:block">
              <TableList
                columns={[
                  EXPANDER_COLUMN,
                  ...STUDENT_ATTENDANCE_COLUMNS.filter(col => 
                    col.accessor !== 'actions' && visibleColumns.includes(col.accessor as string)
                  ),
                  {
                    ...STUDENT_ATTENDANCE_COLUMNS.find(col => col.accessor === 'actions')!,
                    render: renderActionsColumn
                  }
                ].filter(col => visibleColumns.includes(col.accessor as string) || col.accessor === 'expander')}
                data={paginatedStudents}
                loading={loading}
                selectedIds={selectedIds}
                emptyMessage={null}
                onSelectRow={(id) => {
                  setSelectedIds(prev => 
                    prev.includes(id) 
                      ? prev.filter(selectedId => selectedId !== id)
                      : [...prev, id]
                  );
                }}
                onSelectAll={() => {
                  if (selectedIds.length === paginatedStudents.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(paginatedStudents.map(s => s.id));
                  }
                }}
                isAllSelected={selectedIds.length === paginatedStudents.length && paginatedStudents.length > 0}
                isIndeterminate={selectedIds.length > 0 && selectedIds.length < paginatedStudents.length}
                getItemId={(item) => item.id}
                expandedRowIds={expandedRowIds}
                onToggleExpand={(itemId) => {
                  setExpandedRowIds(current => 
                    current.includes(itemId) 
                      ? current.filter(id => id !== itemId)
                      : [...current, itemId]
                  );
                }}
                editingCell={editingCell}
                onCellClick={(item, columnAccessor) => {
                  if (["studentName"].includes(columnAccessor)) {
                    setEditingCell({ rowId: item.id, columnAccessor });
                  }
                }}
                onCellChange={async (rowId, columnAccessor, value) => {
                  setEditingCell(null);
                  // Handle cell change logic here
                }}
                sortState={{
                  field: sortBy === 'attendance-desc' || sortBy === 'attendance-asc' ? 'attendanceRate' : 
                         sortBy === 'name' ? 'studentName' : 
                         sortBy === 'id' ? 'studentId' : 
                         sortBy === 'department' ? 'department' : 
                         sortBy === 'course' ? 'course' : 
                         sortBy === 'year-level' ? 'yearLevel' : 
                         sortBy === 'status' ? 'status' : 'attendanceRate',
                  order: sortBy === 'attendance-asc' || sortBy === 'name' || sortBy === 'id' || sortBy === 'department' || sortBy === 'course' || sortBy === 'year-level' || sortBy === 'status' ? 'asc' : 'desc'
                }}
                onSort={(accessor) => {
                  // Map the accessor to our sortBy values
                  if (accessor === 'attendanceRate') {
                    setSortBy(sortBy === 'attendance-desc' ? 'attendance-asc' : 'attendance-desc');
                  } else if (accessor === 'studentName') {
                    setSortBy(sortBy === 'name' ? 'attendance-desc' : 'name');
                  } else if (accessor === 'studentId') {
                    setSortBy(sortBy === 'id' ? 'attendance-desc' : 'id');
                  } else if (accessor === 'department') {
                    setSortBy(sortBy === 'department' ? 'attendance-desc' : 'department');
                  } else if (accessor === 'course') {
                    setSortBy(sortBy === 'course' ? 'attendance-desc' : 'course');
                  } else if (accessor === 'yearLevel') {
                    setSortBy(sortBy === 'year-level' ? 'attendance-desc' : 'year-level');
                  } else if (accessor === 'status') {
                    setSortBy(sortBy === 'status' ? 'attendance-desc' : 'status');
                  }
                }}
                className="border-0 shadow-none"
              />
                    </div>
            
            {/* Card layout for small screens */}
            <div className="block xl:hidden p-4">
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
                          onClick={refreshStudentsData}
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
                selectedIds={selectedIds}
                onSelect={(id) => {
                  setSelectedIds(prev => 
                    prev.includes(id) 
                      ? prev.filter(selectedId => selectedId !== id)
                      : [...prev, id]
                  );
                }}
                onView={(item) => {
                  setViewStudent(item);
                  setViewDialogOpen(true);
                }}
                onEdit={(item) => {
                  handleStudentClick(item);
                }}
                onDelete={(item) => {
                  if (!canDeleteStudents) {
                    toast.error('You do not have permission to delete students');
                    return;
                  }
                  setStudentToDelete(item);
                  setDeleteDialogOpen(true);
                }}
                getItemId={(item) => item.id}
                getItemName={(item) => item.studentName}
                getItemCode={(item) => item.studentId}
                getItemStatus={(item) => item.status === 'ACTIVE' ? 'active' : 'inactive'}
                getItemDescription={(item) => `${item.department} • ${item.course}`}
                getItemDetails={(item) => [
                  { label: 'Year Level', value: item.yearLevel || 'N/A' },
                  { label: 'Attendance Rate', value: `${item.attendanceRate}%` },
                  { label: 'Present Days', value: item.presentDays || 0 },
                  { label: 'Absent Days', value: item.absentDays || 0 },
                ]}
                disabled={() => false}
                isLoading={loading}
              />
              )}
              </div>
            </div>
          </div>

          {/* Enhanced Pagination Controls */}
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={sortedStudents.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </div>
      </Card>
    </div>


        {/* ============================================================================
             DIALOGS AND MODALS
             ============================================================================
             All modal dialogs for student management, deletion confirmation,
             bulk operations, and export functionality */}
        
        {/* Student Detail Modal - Shows detailed student information */}
        <StudentDetailModal
          student={selectedStudent}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdate={handleStudentUpdate}
          onSendNotification={handleSendNotification}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
                  itemName={studentToDelete?.studentName}
        description={`Are you sure you want to delete "${studentToDelete?.studentName}"? This action will mark the student as inactive and cannot be undone.`}
          onDelete={handleDeleteStudent}
          canDelete={!!studentToDelete}
          deleteError={null}
          loading={isDeletingStudent}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          itemName={`${selectedIds.length} selected student${selectedIds.length !== 1 ? 's' : ''}`}
          description={`Are you sure you want to delete ${selectedIds.length} selected student${selectedIds.length !== 1 ? 's' : ''}? This action will mark them as inactive and cannot be undone.`}
          onDelete={handleBulkDeleteStudents}
          canDelete={selectedIds.length > 0}
          deleteError={null}
          loading={isBulkDeleting}
        />

        {/* Enhanced Bulk Actions Dialog */}
        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={selectedStudentsForBulkAction}
          entityType="student"
          entityLabel="student"
          availableActions={[
            {
              type: 'status-update',
              title: 'Update Status',
              description: 'Update attendance status of selected students',
              icon: <Settings className="w-4 h-4" />
            },
            {
              type: 'notification',
              title: 'Send Notification',
              description: 'Send notifications to selected students',
              icon: <Bell className="w-4 h-4" />
            },
            {
              type: 'export',
              title: 'Export Data',
              description: 'Export selected students data',
              icon: <Download className="w-4 h-4" />
            }
          ]}
          exportColumns={[
            { id: 'name', label: 'Student Name', default: true },
            { id: 'status', label: 'Status', default: true },
            { id: 'date', label: 'Date', default: true },
            { id: 'time', label: 'Time', default: false }
          ]}
          notificationTemplates={[
            {
              id: 'attendance-update',
              name: 'Attendance Update Notification',
              subject: 'Attendance Status Update',
              message: 'Your attendance status has been updated to {status}.',
              availableFor: ['student']
            }
          ]}
          stats={{
            total: selectedStudentsForBulkAction.length,
            active: selectedStudentsForBulkAction.filter(s => s.status === 'present').length,
            inactive: selectedStudentsForBulkAction.filter(s => s.status !== 'present').length
          }}
          onActionComplete={handleBulkActionComplete}
          onCancel={() => setBulkActionsDialogOpen(false)}
          onProcessAction={async (actionType: string, config: any) => {
            // Stub implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, processed: selectedStudentsForBulkAction.length };
          }}
          getItemDisplayName={(item: StudentAttendance) => item.studentName}
          getItemStatus={(item: StudentAttendance) => item.status}
        />

        {/* Enhanced Notification System */}
        {systemView === 'notifications' && (
          <EnhancedNotificationSystem
            students={filteredStudents}
            onSendNotification={async (notification) => {
              console.log('Sending notification:', notification);
              toast.success('Notification sent successfully');
            }}
            onSaveTemplate={async (template) => {
              console.log('Saving template:', template);
              toast.success('Template saved successfully');
            }}
            onDeleteTemplate={async (templateId) => {
              console.log('Deleting template:', templateId);
              toast.success('Template deleted successfully');
            }}
            onScheduleCampaign={async (campaign) => {
              console.log('Scheduling campaign:', campaign);
              toast.success('Campaign scheduled successfully');
            }}
          />
        )}

        {/* Undo Notifications */}
        {recentlyDeletedStudents.map((deletedStudent, index) => {
          const timeLeft = Math.max(0, 5 * 60 * 1000 - (Date.now() - deletedStudent.deletedAt.getTime()));
          const minutesLeft = Math.floor(timeLeft / 60000);
          const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
          
          return (
            <div
              key={deletedStudent.id}
              className="fixed bottom-4 right-4 z-50 bg-white border border-red-200 rounded-xl shadow-lg p-4 max-w-sm animate-fade-in"
              style={{ 
                bottom: `${4 + (index * 5)}rem`,
                right: '1rem'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-600">
                    STUDENT DELETED
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    &quot;{deletedStudent.name}&quot; has been marked as inactive
                  </p>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    Undo available for {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => handleUndoDelete(deletedStudent.id)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    Undo
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* NEW: Custom Date Range Picker Dialog */}
        <Dialog open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Custom Date Range</DialogTitle>
              <DialogDescription>
                Choose a custom date range for trend analysis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setCustomDateRange(prev => ({
                      ...prev,
                      start: new Date(e.target.value)
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setCustomDateRange(prev => ({
                      ...prev,
                      end: new Date(e.target.value)
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomDatePicker(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCustomDatePicker(false)}>
                Apply Range
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NEW: User Customization Dialog */}
        <Dialog open={showCustomizationDialog} onOpenChange={setShowCustomizationDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customize Dashboard</DialogTitle>
              <DialogDescription>
                Configure your dashboard preferences and save custom layouts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Default Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Default Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Default Time Range</label>
                    <Select value={userPreferences.defaultTimeRange} onValueChange={(value) => setUserPreferences(prev => ({ ...prev, defaultTimeRange: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Chart Layout</label>
                    <Select value={userPreferences.chartLayout} onValueChange={(value: any) => setUserPreferences(prev => ({ ...prev, chartLayout: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Color Scheme</label>
                    <Select value={userPreferences.colorScheme} onValueChange={(value: any) => setUserPreferences(prev => ({ ...prev, colorScheme: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data Density</label>
                    <Select value={userPreferences.dataDensity} onValueChange={(value: any) => setUserPreferences(prev => ({ ...prev, dataDensity: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Chart Options */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Chart Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showConfidenceIntervals"
                      checked={userPreferences.showConfidenceIntervals}
                      onCheckedChange={(checked) => setUserPreferences(prev => ({ ...prev, showConfidenceIntervals: !!checked }))}
                    />
                    <label htmlFor="showConfidenceIntervals" className="text-sm text-gray-700">
                      Show confidence intervals in forecasts
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showTrendLines"
                      checked={userPreferences.showTrendLines}
                      onCheckedChange={(checked) => setUserPreferences(prev => ({ ...prev, showTrendLines: !!checked }))}
                    />
                    <label htmlFor="showTrendLines" className="text-sm text-gray-700">
                      Show trend lines on charts
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoRefresh"
                      checked={userPreferences.autoRefresh}
                      onCheckedChange={(checked) => setUserPreferences(prev => ({ ...prev, autoRefresh: !!checked }))}
                    />
                    <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                      Auto-refresh data every 5 minutes
                    </label>
                  </div>
                </div>
              </div>

              {/* Saved Customizations */}
              {savedCustomizations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Saved Customizations</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {savedCustomizations.map((customization) => (
                      <div key={customization.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{customization.name}</p>
                          <p className="text-xs text-gray-500">
                            {customization.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadUserCustomization(customization)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUserCustomization(customization.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomizationDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const name = prompt('Enter a name for this customization:');
                  if (name) {
                    saveUserCustomization(name);
                  }
                }}
              >
                Save Customization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



      {/* Export Dialog - Handles data export in various formats (CSV, Excel, PDF) */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportableColumns={[
          { key: 'studentName', label: 'Student Name' },
          { key: 'studentId', label: 'Student ID' },
          { key: 'department', label: 'Department' },
          { key: 'course', label: 'Course' },
          { key: 'yearLevel', label: 'Year Level' },
          { key: 'attendanceRate', label: 'Attendance Rate' },
          { key: 'status', label: 'Status' },
          { key: 'presentDays', label: 'Present Days' },
          { key: 'absentDays', label: 'Absent Days' },
          { key: 'totalDays', label: 'Total Days' }
        ]}
        exportColumns={exportColumns}
        setExportColumns={setExportColumns}
        exportFormat={exportFormat}
        setExportFormat={(format) => {
          if (format && (format === 'csv' || format === 'excel' || format === 'pdf')) {
            setExportFormat(format);
          }
        }}
        onExport={() => {
          if (exportFormat === 'csv') {
            handleExportCSV();
          } else if (exportFormat === 'pdf') {
            handleExportPDF();
          } else if (exportFormat === 'excel') {
            handleExportCSV(); // For now, use CSV export for Excel format
          }
          setExportDialogOpen(false);
        }}
        title="Export Student Attendance Data"
        tooltip="Export the current student attendance data with selected columns and format."
      />
    </div>
  </div>
)
}

// ============================================================================
// END OF STUDENT ATTENDANCE MANAGEMENT PAGE
// ============================================================================
// This component provides a comprehensive interface for managing student
// attendance records with real-time analytics, filtering, and administrative
// functions. It includes mobile responsiveness and accessibility features.
// ============================================================================

// ============================================================================
// STUDENT ATTENDANCE DETAIL TABLE COMPONENT
// ============================================================================
// This component displays detailed attendance records for a specific student
// in a table format with sorting and filtering capabilities.

export const StudentAttendanceDetailTable = ({ records }: { records: RecentAttendanceRecord[] }) => {
const [sortField, setSortField] = useState<'timestamp' | 'status' | 'attendanceType'>('timestamp');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

const sortedRecords = useMemo(() => {
  return [...records].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue && bValue) {
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}, [records, sortField, sortDirection]);

const handleSort = (field: 'timestamp' | 'status' | 'attendanceType') => {
  if (sortField === field) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortDirection('asc');
  }
};

if (!records || records.length === 0) {
  return (
    <div className="text-center py-8 text-gray-500">
      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p>No attendance records found</p>
    </div>
  );
}

return (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Attendance History</h3>
      <Badge variant="outline">{records.length} records</Badge>
    </div>
    
    <div className="border rounded-lg overflow-hidden">
      <UITable>
        <UITableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Date & Time
                {sortField === 'timestamp' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('attendanceType')}
            >
              <div className="flex items-center gap-1">
                Type
                {sortField === 'attendanceType' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                Status
                {sortField === 'status' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </UITableHeader>
        <TableBody>
          {sortedRecords.map((record, index) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {new Date(record.timestamp).toLocaleString()}
              </TableCell>
              <TableCell>{record.attendanceType}</TableCell>
              <TableCell>
                <Badge 
                  className={`${
                    record.status === 'PRESENT' 
                      ? 'bg-green-100 text-green-800' 
                      : record.status === 'LATE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : record.status === 'ABSENT'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  className={`${
                    record.verification === 'VERIFIED' 
                      ? 'bg-green-100 text-green-800' 
                      : record.verification === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {record.verification}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {record.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </UITable>
    </div>
  </div>
);
};
// ============================================================================
// END OF STUDENT ATTENDANCE DETAIL TABLE COMPONENT
// ============================================================================