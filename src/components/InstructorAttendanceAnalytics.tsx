'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  BarChart3, 
  Users, 
  Activity, 
  AlertTriangle, 
  Download, 
  Eye, 
  EyeOff,
  Maximize2, 
  Minimize2, 
  Info, 
  Settings, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Calendar,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Building,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  MoreVertical,
  Share2,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  ReferenceLine
} from 'recharts';
import { AnalyticsHeader, AnalyticsFilters, QuickStats, ChartCard, DrillDownBreadcrumbs, TimeRangeSelector } from './analytics';
import { 
  processRealTimeData, 
  calculateAttendanceRate, 
  getRiskLevelColor, 
  getTrendIcon, 
  calculateWeeklyAttendanceData, 
  validateAttendanceData, 
  type AttendanceData, 
  type WeeklyData,
  type DataValidationResult,
  type RiskLevelData
} from '@/lib/analytics-utils';
import { ExportService } from '@/lib/services/export.service';
import { Toast } from '@/components/ui/toast';

// Enhanced TypeScript interfaces for advanced interactivity
interface DrillDownState {
  isActive: boolean;
  level: 'department' | 'instructor' | 'class' | 'session';
  data: any;
  breadcrumbs: string[];
  filters: Record<string, any>;
}



interface TimeRange {
  start: Date;
  end: Date;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface AdvancedInteractivityProps {
  drillDown: DrillDownState;
  timeRange: TimeRange;
  onDrillDown: (level: string, data: any) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onResetFilters: () => void;
}

// Enhanced data interfaces - imported from analytics-utils

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  stage: 'fetching' | 'processing' | 'validating' | 'rendering';
}

interface InstructorAnalyticsData {
  totalCount: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  trends: {
    totalCount: { change: number; direction: 'up' | 'down' | 'neutral' };
    attendanceRate: { change: number; direction: 'up' | 'down' | 'neutral' };
    departments: { change: number; direction: 'up' | 'down' | 'neutral' };
    highRisk: { change: number; direction: 'up' | 'down' | 'neutral' };
  };
  summary: {
    totalInstructors: number;
    averageAttendanceRate: number;
    highRiskCount: number;
    activeCount: number;
  };
}

interface InstructorAttendanceAnalyticsProps {
  data: any[]; // Instructor attendance data
  loading?: boolean;
  type: 'instructor' | 'student';
  onDrillDown?: (filter: { type: string; value: string }) => void;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  onRefresh?: () => void;
  enableAdvancedFeatures?: boolean;
  enableRealTime?: boolean;

  enableDrillDown?: boolean;
  enableTimeRange?: boolean;
  showHeader?: boolean;
  showSecondaryFilters?: boolean;
  selectedSubject?: string;
  onSubjectChange?: (value: string) => void;
  subjects?: Array<{ id: string; name: string }>;
}

// Utility functions imported from analytics-utils





// Utility functions imported from analytics-utils

// Calculate trend indicators based on data
const calculateTrends = (data: AttendanceData[], type: 'instructor' | 'student') => {
  if (!data || data.length === 0) {
    return {
      totalCount: { change: 0, direction: 'neutral' },
      attendanceRate: { change: 0, direction: 'neutral' },
      departments: { change: 0, direction: 'neutral' },
      highRisk: { change: 0, direction: 'neutral' }
    };
  }

  // Calculate current period metrics from the data
  const currentTotal = data.length;
  const currentPresent = data.reduce((sum, item) => sum + item.attendedClasses, 0);
  const currentLate = data.reduce((sum, item) => sum + item.lateClasses, 0);
  const currentAbsent = data.reduce((sum, item) => sum + item.absentClasses, 0);
  const currentTotalClasses = data.reduce((sum, item) => sum + item.totalClasses, 0);
  const currentAttendanceRate = currentTotalClasses > 0 ? (currentPresent / currentTotalClasses) * 100 : 0;

  // Calculate department changes (count unique departments)
  const currentDepartments = new Set(data.map(item => item.department)).size;

  // Calculate high risk changes (count high risk individuals)
  const currentHighRisk = data.filter(item => item.riskLevel === 'high').length;

  // For demo purposes, simulate previous period data
  // In a real implementation, you would compare with historical data
  const previousTotal = Math.max(1, Math.floor(currentTotal * 0.95)); // Simulate 5% change
  const previousAttendanceRate = currentAttendanceRate * 0.98; // Simulate 2% change
  const previousDepartments = Math.max(1, currentDepartments - 1); // Simulate department change
  const previousHighRisk = Math.max(0, currentHighRisk - 1); // Simulate risk change

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const totalCountChange = calculateChange(currentTotal, previousTotal);
  const attendanceRateChange = currentAttendanceRate - previousAttendanceRate;
  const departmentsChange = calculateChange(currentDepartments, previousDepartments);
  const highRiskChange = calculateChange(currentHighRisk, previousHighRisk);

  return {
    totalCount: {
      change: Math.abs(totalCountChange),
      direction: totalCountChange > 0 ? 'up' : totalCountChange < 0 ? 'down' : 'neutral'
    },
    attendanceRate: {
      change: Math.abs(attendanceRateChange),
      direction: attendanceRateChange > 0 ? 'up' : attendanceRateChange < 0 ? 'down' : 'neutral'
    },
    departments: {
      change: Math.abs(departmentsChange),
      direction: departmentsChange > 0 ? 'up' : departmentsChange < 0 ? 'down' : 'neutral'
    },
    highRisk: {
      change: Math.abs(highRiskChange),
      direction: highRiskChange > 0 ? 'up' : highRiskChange < 0 ? 'down' : 'neutral'
    }
  };
};

// Attendance Distribution Component (for Modal)
export const AttendanceDistribution = ({
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700 mb-1">{totalPresent}</div>
          <div className="text-sm text-blue-600 font-medium">Present</div>
          <div className="text-xs text-blue-500 mt-1">{presentPercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-700 mb-1">{totalLate}</div>
          <div className="text-sm text-cyan-600 font-medium">Late</div>
          <div className="text-xs text-cyan-500 mt-1">{latePercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-700 mb-1">{totalAbsent}</div>
          <div className="text-sm text-gray-600 font-medium">Absent</div>
          <div className="text-xs text-gray-500 mt-1">{absentPercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Enhanced Progress Bars */}
      <div className="space-y-5">
        <div className="group">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1e40af' }}></div>
              <span className="text-sm font-semibold text-gray-900">Present</span>
            </div>
            <span className="text-sm font-medium text-gray-600">{presentPercentage.toFixed(1)}% ({totalPresent})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 flex items-center overflow-hidden group-hover:bg-gray-200 transition-colors" aria-label={`Present: ${presentPercentage.toFixed(1)}% (${totalPresent})`}>
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${presentPercentage}%`, backgroundColor: '#1e40af' }}
            />
          </div>
        </div>
        
        <div className="group">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0ea5e9' }}></div>
              <span className="text-sm font-semibold text-gray-900">Late</span>
            </div>
            <span className="text-sm font-medium text-gray-600">{latePercentage.toFixed(1)}% ({totalLate})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 flex items-center overflow-hidden group-hover:bg-gray-200 transition-colors" aria-label={`Late: ${latePercentage.toFixed(1)}% (${totalLate})`}>
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${latePercentage}%`, backgroundColor: '#0ea5e9' }}
            />
          </div>
        </div>
        
        <div className="group">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9ca3af' }}></div>
              <span className="text-sm font-semibold text-gray-900">Absent</span>
            </div>
            <span className="text-sm font-medium text-gray-600">{absentPercentage.toFixed(1)}% ({totalAbsent})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 flex items-center overflow-hidden group-hover:bg-gray-200 transition-colors" aria-label={`Absent: ${absentPercentage.toFixed(1)}% (${totalAbsent})`}>
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${absentPercentage}%`, backgroundColor: '#9ca3af' }}
            />
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-blue-900">Total Records</span>
          </div>
          <span className="text-lg font-bold text-blue-700">{total}</span>
        </div>
      </div>
    </div>
  );
};

// Attendance Distribution Modal Component
export const AttendanceDistributionModal = ({
  totalPresent,
  totalLate,
  totalAbsent,
  type
}: {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  type: 'instructor' | 'student';
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
          <Eye className="w-4 h-4" />
          View Detailed Breakdown
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">Detailed Attendance Breakdown</div>
              <div className="text-sm text-gray-600">Comprehensive analysis for {type === 'instructor' ? 'instructors' : 'students'}</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <AttendanceDistribution
            totalPresent={totalPresent}
            totalLate={totalLate}
            totalAbsent={totalAbsent}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Attendance Distribution Modal
export const FullscreenAttendanceDistributionModal = ({
  totalPresent,
  totalLate,
  totalAbsent,
  type,
  trigger,
  onExport,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  selectedDepartment = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  loading = false,
  fetchModalData
}: {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  selectedDepartment?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  loading?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 -m-6 p-6 rounded-t-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">Attendance Distribution</div>
                <div className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                  Complete analysis with chart and detailed breakdown for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="lg"
              className="h-10 w-10 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <div className="mb-6">
              <SecondaryFilters
                selectedSubject={selectedSubject}
                onSubjectChange={onSubjectChange || (() => {})}
                subjects={subjects}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Section */}
            <div className="space-y-4 h-full">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Visual Overview</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 pb-8 h-full min-h-[400px] flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <AttendanceDistributionChart
                  totalPresent={totalPresent}
                  totalLate={totalLate}
                  totalAbsent={totalAbsent}
                  selectedDepartment={selectedDepartment}
                />
              </div>
            </div>
            
            {/* Detailed Breakdown Section */}
            <div className="space-y-4 h-full">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Detailed Breakdown</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 pb-8 h-full min-h-[400px] flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <AttendanceDistribution
                  totalPresent={totalPresent}
                  totalLate={totalLate}
                  totalAbsent={totalAbsent}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Weekly Trend Modal
export const FullscreenWeeklyTrendModal = ({
  weeklyData,
  type,
  trigger,
  onExport,
  getXAxisConfig,
  showComparison = false,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  fetchModalData
}: {
  weeklyData: any[];
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  getXAxisConfig?: () => any;
  showComparison?: boolean;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 -m-6 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  Attendance Trend Analysis
                  {showComparison && (
                    <span className="ml-3 inline-flex items-center gap-1 text-sm bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                      <TrendingUp className="w-3 h-3" />
                      Comparison enabled
                    </span>
                  )}
                </div>
                <div className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                  Complete trend analysis for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="lg"
              className="h-10 w-10 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <div className="mb-6">
              <SecondaryFilters
                selectedSubject={selectedSubject}
                onSubjectChange={onSubjectChange || (() => {})}
                subjects={subjects}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            {/* Chart Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Trend Visualization</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="h-96">
                  {weeklyData.length === 0 ? (
                    <NoDataState selectedSubject={selectedSubject} type={type} subjects={subjects} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey={weeklyData.length > 0 ? Object.keys(weeklyData[0]).find(key => key !== 'attendanceRate' && key !== 'label') || 'week' : 'week'}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => {
                          // Use the same tick formatter logic as main widget
                          if (getXAxisConfig) {
                            const xAxisConfig = getXAxisConfig();
                            if (xAxisConfig.tickFormatter) {
                              return xAxisConfig.tickFormatter(value);
                            }
                          }
                          return value;
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(label) => {
                          // Use the same label formatter logic as main widget
                          if (getXAxisConfig) {
                            const xAxisConfig = getXAxisConfig();
                            if (xAxisConfig.tickFormatter) {
                              return xAxisConfig.tickFormatter(label);
                            }
                          }
                          return label;
                        }}
                        formatter={(value: any, name: any, props: any) => {
                          if (showComparison && props.payload.previousAttendanceRate !== undefined) {
                            const current = props.payload.attendanceRate;
                            const previous = props.payload.previousAttendanceRate;
                            const change = current - previous;
                            const changePercent = ((change / previous) * 100).toFixed(1);
                            const changeText = change >= 0 ? `+${changePercent}%` : `${changePercent}%`;
                            const changeColor = change >= 0 ? '#10b981' : '#ef4444';
                            
                            return [
                              [
                                `${value}% (Current)`,
                                `${previous}% (Previous)`,
                                `${changeText} change`
                              ],
                              [name, 'Previous Period', 'Change']
                            ];
                          }
                          return [`${value}%`, name];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendanceRate" 
                        stroke="#1e40af" 
                        strokeWidth={3}
                        dot={{ fill: '#1e40af', strokeWidth: 2, r: 5, stroke: 'white' }}
                        activeDot={{ r: 7, stroke: '#1e40af', strokeWidth: 3, fill: '#1e40af' }}
                      />
                      {showComparison && (
                        <Line 
                          type="monotone" 
                          dataKey="previousAttendanceRate" 
                          stroke="#0ea5e9" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#0ea5e9' }}
                        />
                      )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Late Arrival Modal


export const FullscreenLateArrivalModal = ({
  lateData,
  type,
  trigger,
  onExport,
  getXAxisConfig,
  showComparison = false,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  fetchModalData
}: {
  lateData: any[];
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  getXAxisConfig?: () => any;
  showComparison?: boolean;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 -m-6 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  Late Arrival Trends
                  {showComparison && (
                    <span className="ml-3 inline-flex items-center gap-1 text-sm bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                      <TrendingUp className="w-3 h-3" />
                      Comparison enabled
                    </span>
                  )}
                </div>
                <div className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                  Late arrival trend analysis for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="lg"
              className="h-10 w-10 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <div className="mb-6">
              <SecondaryFilters
                selectedSubject={selectedSubject}
                onSubjectChange={onSubjectChange || (() => {})}
                subjects={subjects}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            {/* Chart Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Late Arrival Visualization</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="h-96">
                  {lateData.length === 0 ? (
                    <NoDataState selectedSubject={selectedSubject} type={type} subjects={subjects} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey={lateData.length > 0 ? Object.keys(lateData[0]).find(key => key !== 'lateRate' && key !== 'label' && key !== 'previousLateRate') || 'week' : 'week'}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => {
                          if (getXAxisConfig) {
                            const xAxisConfig = getXAxisConfig();
                            if (xAxisConfig.tickFormatter) {
                              return xAxisConfig.tickFormatter(value);
                            }
                          }
                          return value;
                        }}
                      />
                      <YAxis 
                        domain={[0, 25]}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(label) => {
                          if (getXAxisConfig) {
                            const xAxisConfig = getXAxisConfig();
                            if (xAxisConfig.tickFormatter) {
                              return xAxisConfig.tickFormatter(label);
                            }
                          }
                          return label;
                        }}
                        formatter={(value: any, name: any, props: any) => {
                          if (showComparison && props.payload.previousLateRate !== undefined) {
                            const current = props.payload.lateRate;
                            const previous = props.payload.previousLateRate;
                            const change = current - previous;
                            const changePercent = ((change / previous) * 100).toFixed(1);
                            const changeText = change >= 0 ? `+${changePercent}%` : `${changePercent}%`;
                            
                            return [
                              [
                                `${value}% (Current)`,
                                `${previous}% (Previous)`,
                                `${changeText} change`
                              ],
                              [name, 'Previous Period', 'Change']
                            ];
                          }
                          return [`${value}%`, name];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lateRate" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 5, stroke: 'white' }}
                        activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 3, fill: '#ef4444' }}
                      />
                      {showComparison && (
                        <Line 
                          type="monotone" 
                          dataKey="previousLateRate" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#f59e0b' }}
                        />
                      )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Risk Distribution Modal
export const FullscreenRiskDistributionModal = ({
  riskLevelData,
  type,
  trigger,
  onExport,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  fetchModalData
}: {
  riskLevelData: any[];
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Risk Level Distribution - Full View</div>
                <div className="text-sm text-gray-600">Complete risk analysis for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="py-6">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <SecondaryFilters
              selectedSubject={selectedSubject}
              onSubjectChange={onSubjectChange || (() => {})}
              subjects={subjects}
            />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Risk Visualization</h3>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskLevelData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                      >
                        {riskLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Detailed Analysis Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded p-4">
                      <div className="text-2xl font-bold text-red-700">
                        {riskLevelData.find(r => r.level === 'high')?.count || 0}
                      </div>
                      <div className="text-sm text-red-600">High Risk</div>
                    </div>
                    <div className="bg-yellow-50 rounded p-4">
                      <div className="text-2xl font-bold text-yellow-700">
                        {riskLevelData.find(r => r.level === 'medium')?.count || 0}
                      </div>
                      <div className="text-sm text-yellow-600">Medium Risk</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Risk Level Breakdown</h4>
                    {riskLevelData.map((risk, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: risk.color }}
                          ></div>
                          <span className="font-medium text-gray-700 capitalize">{risk.level} Risk</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{risk.count}</div>
                          <div className="text-sm text-gray-600">
                            {((risk.count / riskLevelData.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Department Performance Modal
export const FullscreenDepartmentPerformanceModal = ({
  departmentStats,
  type,
  trigger,
  onExport,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  fetchModalData
}: {
  departmentStats: any[];
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 -m-6 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  Department Performance
                </div>
                <div className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                  Complete department analysis for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="lg"
              className="h-10 w-10 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <div className="mb-6">
              <SecondaryFilters
                selectedSubject={selectedSubject}
                onSubjectChange={onSubjectChange || (() => {})}
                subjects={subjects}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Performance Visualization</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="code" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: any) => [
                          `${value.toFixed(1)}%`, 
                          name === 'attendanceRate' ? 'Attendance Rate' : name
                        ]}
                      />
                      <Bar 
                        dataKey="attendanceRate" 
                        fill="#1e40af"
                        radius={[4, 4, 0, 0]}
                        name="Attendance Rate"
                      />
                      <ReferenceLine 
                        y={85} 
                        stroke="#0ea5e9" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ 
                          value: "Target 85%", 
                          position: "insideTopRight",
                          fill: "#0ea5e9",
                          fontSize: 12,
                          fontWeight: "bold"
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Detailed Breakdown Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Department Details</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="space-y-4">
                  {departmentStats.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <div>
                          <div className="font-semibold text-gray-900">{dept.name}</div>
                          <div className="text-sm text-gray-500">{dept.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900">{dept.attendanceRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">attendance rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Attendance Distribution Graph (Pie Chart)
export const AttendanceDistributionChart = ({
  totalPresent,
  totalLate,
  totalAbsent,
  selectedDepartment = 'all'
}: {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  selectedDepartment?: string;
}) => {
  const chartData = [
    { name: 'Present', value: totalPresent, color: '#1e40af', icon: '✓' },
    { name: 'Late', value: totalLate, color: '#0ea5e9', icon: '⏰' },
    { name: 'Absent', value: totalAbsent, color: '#9ca3af', icon: '✗' }
  ];

  const total = totalPresent + totalLate + totalAbsent;
  const attendanceRate = total === 0 ? 0 : (totalPresent / total) * 100;

  return (
    <div className="w-full">
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={70}
              dataKey="value"
              label={({ name, percent, value }) => 
                percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={{ stroke: '#6b7280', strokeWidth: 1.5 }}
              paddingAngle={2}
              aria-label="Attendance distribution pie chart showing present, late, and absent percentages"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`attendance-cell-${index}`} 
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '12px 16px'
              }}
              formatter={(value: any, name: any) => [
                <div key={`tooltip-${name}`} className="flex items-center gap-2">
                  <span className="text-lg">{chartData.find(d => d.name === name)?.icon}</span>
                  <span className="font-semibold">{value}</span>
                </div>, 
                name
              ]}
              labelFormatter={(name) => name}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center metric */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{attendanceRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 font-medium">
              {selectedDepartment !== 'all' ? 'Department Rate' : 'Overall Rate'}
            </div>
            {selectedDepartment !== 'all' && (
              <div className="text-xs text-gray-500 mt-1">
                Filtered for {selectedDepartment}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6">
        <div className="flex items-center justify-center gap-8">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {item.name} ({item.value.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// Department Trends Chart Component
export const DepartmentTrendsChart = ({ data }: { data: { name: string; avgAttendance: number; count: number }[] }) => (
  <div className="my-6">
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
        <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Avg Attendance']} />
        <Bar dataKey="avgAttendance" fill="#3b82f6" name="Avg Attendance" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Enhanced Loading and Error Components
const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-80" />
      ))}
    </div>
  </div>
);

// Individual Chart No Data Component
const ChartNoData = ({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = "text-gray-400",
  bgColor = "bg-gray-50"
}: {
  title: string;
  description: string;
  icon: any;
  iconColor?: string;
  bgColor?: string;
}) => (
  <div className={`${bgColor} rounded border-2 border-dashed border-gray-200 p-8 text-center`}>
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

// Secondary Filter Component for Drill-Down
const SecondaryFilters = ({
  selectedSubject,
  onSubjectChange,
  subjects = []
}: {
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  subjects?: Array<{ id: string; name: string }>;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-wrap gap-3 mb-4 mt-4 justify-end items-center">
      <Select value={selectedSubject} onValueChange={onSubjectChange}>
        <SelectTrigger className="w-48 h-8 text-sm text-gray-500 rounded">
          <SelectValue placeholder="All Subjects">
            {selectedSubject === 'all' ? (
              <div className="truncate">All Subjects</div>
            ) : (
              <div className="truncate" title={subjects.find(s => s.id === selectedSubject)?.name || selectedSubject}>
                {subjects.find(s => s.id === selectedSubject)?.name || selectedSubject}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-48 max-h-60 rounded-lg" position="popper" side="bottom" align="end" sideOffset={4}>
          <div className="p-2 border-b border-gray-200">
                          <input
                type="text"
                placeholder="Search subject codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
          </div>
          <div className="max-h-40 overflow-y-auto">
            <SelectItem value="all" className="text-sm">All Subjects</SelectItem>
            {filteredSubjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id} className="text-sm">
                <div className="truncate" title={subject.name}>
                  {subject.name}
                </div>
              </SelectItem>
            ))}
            {filteredSubjects.length === 0 && searchQuery && (
              <div className="px-2 py-1 text-sm text-gray-500">
                No subjects found
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

// Reusable Download Dropdown Component
const DownloadDropdown = ({ onExport }: { onExport?: (format: 'pdf' | 'csv' | 'excel') => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="lg" className="h-8 px-3 text-sm rounded bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white hover:border-blue-700">
        <Download className="w-3 h-3 mr-1" />
        Export
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40 text-sm">
      <DropdownMenuItem onClick={() => onExport?.('pdf')}>
        <FileText className="w-3 h-3 mr-2" />
        PDF
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onExport?.('csv')}>
        <FileSpreadsheet className="w-3 h-3 mr-2" />
        CSV
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onExport?.('excel')}>
        <FileSpreadsheet className="w-3 h-3 mr-2" />
        Excel
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const ErrorBoundary = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="text-center py-8">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-blue-900 mb-2">Something went wrong</h3>
    <p className="text-gray-600 mb-4">{error}</p>
    <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 rounded">
      <RefreshCw className="w-4 h-4 mr-2" />
      Try Again
    </Button>
  </div>
);

const NoDataState = ({ 
  selectedSubject, 
  type,
  subjects = []
}: { 
  selectedSubject: string; 
  type: 'instructor' | 'student';
  subjects?: Array<{ id: string; name: string }>;
}) => {
  const selectedSubjectName = selectedSubject === 'all' ? 'All Subjects' : 
    subjects.find(s => s.id === selectedSubject)?.name || selectedSubject;
  
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <BarChart3 className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
      <p className="text-gray-600 mb-4 max-w-md">
        No attendance data found for <span className="font-medium text-blue-600">{selectedSubjectName}</span> 
        in the selected time period.
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Info className="w-4 h-4" />
        <span>Try selecting a different subject or time range</span>
      </div>
    </div>
  );
};

export const FullscreenPatternAnalysisModal = ({
  patternData,
  type,
  trigger,
  onExport,
  getXAxisConfig,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  fetchModalData
}: {
  patternData: any[];
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  getXAxisConfig?: () => any;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 -m-6 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">Attendance Pattern Analysis</div>
                <div className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                  Pattern analysis for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="lg"
              className="h-10 w-10 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <div className="mb-6">
              <SecondaryFilters
                selectedSubject={selectedSubject}
                onSubjectChange={onSubjectChange || (() => {})}
                subjects={subjects}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            {/* Chart Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Pattern Visualization</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="h-96">
                  {patternData.length === 0 ? (
                    <NoDataState selectedSubject={selectedSubject} type={type} subjects={subjects} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={patternData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey={getXAxisConfig ? getXAxisConfig().dataKey : 'date'}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickFormatter={getXAxisConfig ? getXAxisConfig().tickFormatter : undefined}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickFormatter={(value) => `${value}%`}
                          domain={[0, 100]}
                        />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(label) => {
                            if (getXAxisConfig) {
                              const xAxisConfig = getXAxisConfig();
                              if (xAxisConfig.tickFormatter) {
                                return xAxisConfig.tickFormatter(label);
                              }
                            }
                            return label;
                          }}
                          formatter={(value: any, name: any, props: any) => {
                            const isPeak = props?.payload?.isPeak;
                            const isValley = props?.payload?.isValley;
                            const markers = isPeak ? ' (peak)' : isValley ? ' (low)' : '';
                            if (name === 'movingAverage') return [`${value.toFixed?.(1) ?? value}%`, 'Moving Avg'];
                            return [`${value}%${markers}`, 'Attendance Rate'];
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="attendanceRate" 
                          stroke="#1e40af" 
                          strokeWidth={2}
                          dot={false}
                          name="Attendance Rate"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="movingAverage" 
                          stroke="#22c55e" 
                          strokeWidth={3}
                          dot={false}
                          name="Moving Avg"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const FullscreenStreakAnalysisModal = ({
  streakData,
  type,
  trigger,
  onExport,
  getXAxisConfig,
  selectedCourse = 'all',
  selectedSection = 'all',
  selectedSubject = 'all',
  selectedYearLevel = 'all',
  onCourseChange,
  onSectionChange,
  onSubjectChange,
  onYearLevelChange,
  courses = [],
  sections = [],
  subjects = [],
  yearLevels = [],
  showSecondaryFilters = true,
  fetchModalData
}: {
  streakData: any;
  type: 'instructor' | 'student';
  trigger: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  getXAxisConfig?: () => any;
  selectedCourse?: string;
  selectedSection?: string;
  selectedSubject?: string;
  selectedYearLevel?: string;
  onCourseChange?: (value: string) => void;
  onSectionChange?: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  onYearLevelChange?: (value: string) => void;
  courses?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
  subjects?: Array<{ id: string; name: string }>;
  yearLevels?: Array<{ id: string; name: string }>;
  showSecondaryFilters?: boolean;
  fetchModalData?: (subjectId?: string) => Promise<any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 -m-6 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">Attendance Streak Analysis</div>
                <div className="text-blue-100 mt-1 flex items-center gap-2 text-sm">
                  Streak analysis for {type === 'instructor' ? 'instructors' : 'students'}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="lg"
              className="h-10 w-10 p-0 hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Secondary Filters */}
          {showSecondaryFilters && (
            <div className="mb-6">
              <SecondaryFilters
                selectedSubject={selectedSubject}
                onSubjectChange={onSubjectChange || (() => {})}
                subjects={subjects}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            {/* Chart Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
                <h3 className="text-lg font-bold text-blue-900">Streak Visualization</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="h-96">
                  {streakData.data.length === 0 ? (
                    <NoDataState selectedSubject={selectedSubject} type={type} subjects={subjects} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={streakData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey={getXAxisConfig ? getXAxisConfig().dataKey : 'date'}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickFormatter={getXAxisConfig ? getXAxisConfig().tickFormatter : undefined}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickFormatter={(value) => `${Math.abs(value)}`}
                        />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(label) => {
                            if (getXAxisConfig) {
                              const xAxisConfig = getXAxisConfig();
                              if (xAxisConfig.tickFormatter) {
                                return xAxisConfig.tickFormatter(label);
                              }
                            }
                            return label;
                          }}
                          formatter={(value: any, name: any, props: any) => {
                            const streakType = props?.payload?.streakType;
                            const isBreak = props?.payload?.isStreakBreak;
                            const attendanceRate = props?.payload?.attendanceRate;
                            const streakLabel = streakType === 'good' ? 'Good Streak' : 'Poor Streak';
                            const breakLabel = isBreak ? ' (Streak Break)' : '';
                            return [
                              `${Math.abs(value)} days${breakLabel}`,
                              streakLabel,
                              `Attendance: ${attendanceRate}%`
                            ];
                          }}
                        />
                        <Bar 
                          dataKey="currentStreak" 
                          fill="#6b7280"
                          radius={[2, 2, 0, 0]}
                        >
                          {streakData.data.map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={entry.currentStreak > 0 ? '#22c55e' : entry.currentStreak < 0 ? '#ef4444' : '#6b7280'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with Export Button */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <DownloadDropdown onExport={onExport} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function InstructorAttendanceAnalytics({
  data,
  loading = false,
  type,
  onDrillDown,
  onExport,
  onRefresh,
  enableAdvancedFeatures = true,
  enableRealTime = false,

  enableDrillDown = true,
  enableTimeRange = true,
  showHeader = true,
  showSecondaryFilters = true,
  selectedSubject = 'all',
  onSubjectChange,
  subjects = []
}: InstructorAttendanceAnalyticsProps) {
  // Enhanced state management for advanced interactivity
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '',
    stage: 'fetching'
  });

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Advanced interactivity states
  const [drillDownState, setDrillDownState] = useState<DrillDownState>({
    isActive: false,
    level: 'department',
    data: null,
    breadcrumbs: [],
    filters: {}
  });

  // Track if custom date range has been applied
  const [customRangeApplied, setCustomRangeApplied] = useState(false);



  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    preset: 'month'
  });

  // Comparison state
  const [showComparison, setShowComparison] = useState(false);
  const [showLateComparison, setShowLateComparison] = useState(false);

  // Secondary filter state for drill-down
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedYearLevel, setSelectedYearLevel] = useState('all');

  // Performance optimizations
  const analyticsDataRef = useRef<InstructorAnalyticsData | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real database data for charts
  const [chartData, setChartData] = useState<any>({
    timeBasedData: [],
    departmentStats: [],
    riskLevelData: [],
    lateArrivalData: [],
    patternData: [],
    streakData: { data: [], stats: {} }
  });

  // Enhanced data processing with real-time capabilities
  const analyticsData: InstructorAnalyticsData | null = useMemo(() => {
    try {
      // Use chartData from API instead of data prop
      console.log('InstructorAttendanceAnalytics chartData:', chartData);
      console.log('ChartData timeBasedData:', chartData.timeBasedData);
      console.log('ChartData departmentStats:', chartData.departmentStats);
      console.log('Selected department:', selectedDepartment);

      // Filter data based on selected department
      let filteredTimeBasedData = chartData.timeBasedData || [];
      let filteredLateArrivalData = chartData.lateArrivalData || [];
      let filteredDepartmentStats = chartData.departmentStats || [];
      let filteredRiskLevelData = chartData.riskLevelData || [];

      // If a specific department is selected, filter the data
      if (selectedDepartment !== 'all') {
        console.log('Department filter applied:', selectedDepartment);
        // The API should already be filtering the data based on departmentId
        // But we can add additional client-side filtering here if needed
        // For now, we trust the API filtering since departmentId is passed in the request
      }

      // Calculate totals from filtered chartData
      const totalPresent = Math.round(filteredTimeBasedData?.reduce((sum: number, day: any) => sum + (day.presentCount || 0), 0) || 0);
      const totalAbsent = Math.round(filteredTimeBasedData?.reduce((sum: number, day: any) => sum + ((day.totalAttendance || 0) - (day.presentCount || 0)), 0) || 0);
      const totalLate = Math.round(filteredLateArrivalData?.reduce((sum: number, day: any) => sum + (day.lateCount || 0), 0) || 0);
      const totalClasses = totalPresent + totalAbsent + totalLate;
      
      // Calculate attendance rate
      const attendanceRate = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
      
      // Get department count from filtered departmentStats
      const departmentCount = filteredDepartmentStats?.length || 0;
      
      // Get risk level data from filtered data
      const highRiskCount = filteredRiskLevelData?.find((r: any) => r.level === 'high')?.count || 0;
      
      // Calculate trends only when previous-period data is present; otherwise neutral
      const previousAttendanceRates = (filteredTimeBasedData || [])
        .map((d: any) => d.previousAttendanceRate)
        .filter((v: any) => typeof v === 'number');

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const currentAttendanceAvg = avg((filteredTimeBasedData || []).map((d: any) => d.attendanceRate || 0));
      const previousAttendanceAvg = avg(previousAttendanceRates as number[]);

      const attendanceDelta = previousAttendanceRates.length > 0
        ? currentAttendanceAvg - previousAttendanceAvg
        : 0;

      const trends = {
        totalCount: { change: 0, direction: 'neutral' as const },
        attendanceRate: {
          change: Math.abs(attendanceDelta),
          direction: attendanceDelta > 0 ? 'up' as const : attendanceDelta < 0 ? 'down' as const : 'neutral' as const
        },
        departments: { change: 0, direction: 'neutral' as const },
        highRisk: { change: 0, direction: 'neutral' as const }
      };
      
      // Create analytics data from chartData and real data prop (student/instructor list)
      const inputCount = Array.isArray(data) ? data.length : 0;
      const activeCountFromInput = Array.isArray(data)
        ? data.filter((item: any) => (item.status === 'active' || item.status === 'ACTIVE')).length
        : 0;

      const dataWithTrends = {
        // Use real count from provided data instead of estimates
        totalCount: inputCount,
        trends,
        summary: {
          // Keep key name for backwards compatibility; value reflects actual count
          totalInstructors: inputCount,
          averageAttendanceRate: attendanceRate,
          highRiskCount: highRiskCount,
          activeCount: activeCountFromInput
        },
        activeCount: activeCountFromInput,
        inactiveCount: Math.max(0, inputCount - activeCountFromInput),
        attendedClasses: totalPresent,
        absentClasses: totalAbsent,
        lateClasses: totalLate,
        onLeaveClasses: 0,
        totalClasses: totalClasses,
        averageAttendanceRate: attendanceRate,
        averagePunctualityScore: 85, // Default value
        averageConsistencyRating: 75, // Default value
        averageCurrentStreak: 5, // Default value
        departmentCount: departmentCount,
        riskLevelDistribution: {
          low: filteredRiskLevelData?.find((r: any) => r.level === 'low')?.count || 0,
          medium: filteredRiskLevelData?.find((r: any) => r.level === 'medium')?.count || 0,
          high: highRiskCount,
          none: filteredRiskLevelData?.find((r: any) => r.level === 'none')?.count || 0
        },
        weeklyPattern: {
          monday: filteredTimeBasedData?.[1]?.attendanceRate || 0,
          tuesday: filteredTimeBasedData?.[2]?.attendanceRate || 0,
          wednesday: filteredTimeBasedData?.[3]?.attendanceRate || 0,
          thursday: filteredTimeBasedData?.[4]?.attendanceRate || 0,
          friday: filteredTimeBasedData?.[5]?.attendanceRate || 0,
          saturday: filteredTimeBasedData?.[6]?.attendanceRate || 0,
          sunday: filteredTimeBasedData?.[0]?.attendanceRate || 0
        }
      };
      
      // Don't set loading to false here - let the fetchAnalyticsData function handle it
      // The loading state should be controlled by the API fetch process

      console.log('Processed analytics data:', dataWithTrends);
      console.log('Chart data for attendance distribution:', {
        timeBasedData: chartData.timeBasedData,
        lateArrivalData: chartData.lateArrivalData,
        attendedClasses: dataWithTrends.attendedClasses,
        absentClasses: dataWithTrends.absentClasses,
        lateClasses: dataWithTrends.lateClasses,
        calculatedAttendanceRate: attendanceRate,
        selectedDepartment,
        isFiltered: selectedDepartment !== 'all'
      });
      console.log('Analytics data recalculated due to filter changes');
      console.log('Department Performance Data:', {
        departmentStats: chartData.departmentStats,
        selectedDepartment,
        departmentRates: chartData.departmentStats?.map((dept: any) => ({
          name: dept.name,
          rate: dept.attendanceRate
        }))
      });
      analyticsDataRef.current = dataWithTrends;
      return dataWithTrends;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process data');
      // Don't set loading to false here - let the fetchAnalyticsData function handle it
      return null;
    }
  }, [data, type, selectedDepartment, selectedRiskLevel, timeRange, chartData]);

  // Add a comment explaining the filtering logic
  // When selectedDepartment is not 'all', the charts will show data filtered for that specific department
  // The API should already be filtering the data based on the selectedDepartment parameter
  // The generateFilteredDepartmentStats() function provides additional client-side filtering if needed

  // Dynamic X-axis configuration based on time filter
  const getXAxisConfig = () => {
    if (!timeRange) return { dataKey: 'week', label: 'Week' };

    switch (timeRange.preset) {
      case 'today':
        return { 
          dataKey: 'hour', 
          label: 'Hour',
          tickFormatter: (value: any) => {
            const hour = parseInt(value);
            if (hour < 12) return `${hour}AM`;
            if (hour === 12) return '12PM';
            return `${hour - 12}PM`;
          }
        };
      case 'week':
        return { 
          dataKey: 'day', 
          label: 'Day',
          tickFormatter: (value: any) => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[value] || value;
          }
        };
      case 'month':
        return { 
          dataKey: 'date', 
          label: 'Date',
          tickFormatter: (value: any) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
        };
      case 'quarter':
        return { 
          dataKey: 'week', 
          label: 'Week',
          tickFormatter: (value: any) => `Week ${value}`
        };
      case 'year':
        return { 
          dataKey: 'month', 
          label: 'Month',
          tickFormatter: (value: any) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[value - 1] || value;
          }
        };
      case 'custom':
        return { 
          dataKey: 'date', 
          label: 'Date',
          tickFormatter: (value: any) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
        };
      default:
        return { dataKey: 'week', label: 'Week' };
    }
  };

  // Fetch real analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    console.log('fetchAnalyticsData called with filters:', {
      type,
      timeRange: timeRange?.preset,
      selectedDepartment,
      selectedRiskLevel,
      customRangeApplied
    });
    
    try {
      setLoadingState({
        isLoading: true,
        progress: 0,
        message: 'Fetching analytics data...',
        stage: 'fetching'
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLoadingState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 85)
        }));
      }, 300);

      const params = new URLSearchParams({
        type,
        timeRange: timeRange?.preset || 'week',
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment }),
        ...(selectedRiskLevel !== 'all' && { riskLevel: selectedRiskLevel }),
        // Subject filtering is only for modals, not main dashboard
        ...(timeRange?.start && { startDate: timeRange.start.toISOString() }),
        ...(timeRange?.end && { endDate: timeRange.end.toISOString() })
      });

      console.log('API request params:', Object.fromEntries(params.entries()));

      setLoadingState(prev => ({
        ...prev,
        progress: 25,
        message: 'Connecting to database...',
        stage: 'fetching'
      }));

      const response = await fetch(`/api/attendance/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLoadingState(prev => ({
        ...prev,
        progress: 50,
        message: 'Processing data...',
        stage: 'processing'
      }));

      const result = await response.json();
      
      if (result.success) {
        setLoadingState(prev => ({
          ...prev,
          progress: 75,
          message: 'Rendering charts...',
          stage: 'rendering'
        }));

        console.log('Frontend received data:', result.data);
        console.log('Previous chart data:', chartData);
        setChartData(result.data);

        // Auto-recover filters that cause permanent empty views
        try {
          const deptStats = Array.isArray(result.data?.departmentStats) ? result.data.departmentStats : [];
          const deptMatch = deptStats.some((d: any) => 
            d?.departmentId?.toString() === selectedDepartment || d?.code === selectedDepartment || d?.name === selectedDepartment
          );
          if (selectedDepartment !== 'all' && !deptMatch) {
            setSelectedDepartment('all');
          }

          const riskList = Array.isArray(result.data?.riskLevelData) ? result.data.riskLevelData : [];
          const riskMatch = riskList.some((r: any) => (r?.level || '').toLowerCase() === (selectedRiskLevel || '').toLowerCase());
          if (selectedRiskLevel !== 'all' && !riskMatch) {
            setSelectedRiskLevel('all');
          }
        } catch (_) {
          // no-op safeguard
        }
        console.log('Chart data updated, new data:', result.data);
        
        clearInterval(progressInterval);
        
        // Add a small delay to show the completion state
        setTimeout(() => {
          setLoadingState({
            isLoading: false,
            progress: 100,
            message: 'Data loaded successfully',
            stage: 'rendering'
          });
        }, 500);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
      setLoadingState({
        isLoading: false,
        progress: 0,
        message: 'Error loading data',
        stage: 'fetching'
      });
    }
  }, [type, timeRange, selectedDepartment, selectedRiskLevel, customRangeApplied]);

  // Fetch data when dependencies change
  useEffect(() => {
    console.log('useEffect triggered - checking if should fetch data:', {
      timeRangePreset: timeRange?.preset,
      customRangeApplied,
      selectedDepartment,
      selectedRiskLevel,
      shouldFetch: timeRange?.preset !== 'custom' || customRangeApplied
    });
    
    // Only fetch data if:
    // 1. It's not a custom range, OR
    // 2. It's a custom range that has been applied
    if (timeRange?.preset !== 'custom' || customRangeApplied) {
      console.log('Triggering data fetch due to filter changes');
      // Reset chart data to force re-render
      setChartData({
        timeBasedData: [],
        departmentStats: [],
        riskLevelData: [],
        lateArrivalData: [],
        patternData: [],
        streakData: { data: [], stats: {} }
      });
      
      // Set initial loading state
      setLoadingState({
        isLoading: true,
        progress: 0,
        message: 'Initializing analytics...',
        stage: 'fetching'
      });
      
      fetchAnalyticsData();
      // Ensure we always bounce back from a stuck empty state
      const safety = setTimeout(() => {
        setLoadingState(prev => prev.isLoading ? { ...prev, isLoading: false, message: 'No data for current filters', stage: 'rendering', progress: 100 } : prev);
      }, 8000);
      return () => clearTimeout(safety);
    } else {
      console.log('Skipping data fetch - custom range not applied yet');
    }
  }, [fetchAnalyticsData, timeRange?.preset, customRangeApplied, selectedDepartment, selectedRiskLevel]);

  // Generate filtered chart data based on selected department
  const generateDynamicChartData = () => {
    console.log('generateDynamicChartData called with chartData:', chartData);
    console.log('Selected department for chart data:', selectedDepartment);
    
    // If a specific department is selected, the API should already be filtering the data
    // But we can add additional client-side filtering here if needed
    let filteredData = chartData.timeBasedData || [];
    
    if (selectedDepartment !== 'all') {
      console.log('Applying department filter to chart data:', selectedDepartment);
      // The API should already be filtering, but we can add additional logic here
    }
    
    return filteredData;
  };

  // Generate filtered late arrival trend data based on selected department
  const generateLateArrivalData = () => {
    console.log('generateLateArrivalData called with chartData:', chartData);
    console.log('Selected department for late arrival data:', selectedDepartment);
    
    let filteredData = chartData.lateArrivalData || [];
    
    if (selectedDepartment !== 'all') {
      console.log('Applying department filter to late arrival data:', selectedDepartment);
      // The API should already be filtering, but we can add additional logic here
    }
    
    return filteredData;
  };

  // Generate filtered department stats based on selected department
  const generateFilteredDepartmentStats = () => {
    console.log('generateFilteredDepartmentStats called with chartData:', chartData);
    console.log('Selected department for department stats:', selectedDepartment);
    
    let filteredData = chartData.departmentStats || [];
    
    if (selectedDepartment !== 'all') {
      console.log('Applying department filter to department stats:', selectedDepartment);
      // If a specific department is selected, we should only show that department
      // or show a single bar for the selected department
      filteredData = filteredData.filter((dept: any) => 
        dept.departmentId?.toString() === selectedDepartment || 
        dept.code === selectedDepartment ||
        dept.name === selectedDepartment
      );
    }
    
    return filteredData;
  };

  // Generate pattern analysis data using real database data
  const generatePatternAnalysisData = useMemo(() => {
    // Handle the new object structure from the API
    if (chartData.patternData && typeof chartData.patternData === 'object' && 'dailyPatterns' in chartData.patternData) {
      return chartData.patternData.dailyPatterns || [];
    }
    // Fallback for old array structure
    return chartData.patternData || [];
  }, [chartData.patternData]);

  // Generate streak analysis data using real database data
  const generateStreakAnalysisData = useMemo(() => {
    return chartData.streakData || { data: [], stats: { maxGoodStreak: 0, maxPoorStreak: 0, currentStreak: 0, currentStreakType: 'none', totalGoodDays: 0, totalPoorDays: 0 } };
  }, [chartData.streakData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced callback functions with performance optimizations
  const handleDepartmentChange = useCallback((value: string) => {
    console.log('Department filter changed to:', value);
    console.log('Current filter combination:', {
      department: value,
      riskLevel: selectedRiskLevel,
      timeRange: timeRange?.preset
    });
    console.log('Setting selectedDepartment state to:', value);
    
    // Reset chart data immediately when filter changes
    setChartData({
      timeBasedData: [],
      departmentStats: [],
      riskLevelData: [],
      lateArrivalData: [],
      patternData: [],
      streakData: { data: [], stats: {} }
    });
    
    setSelectedDepartment(value);
  }, [selectedRiskLevel, timeRange?.preset]);

  const handleRiskLevelChange = useCallback((value: string) => {
    console.log('Risk level filter changed to:', value);
    console.log('Current filter combination:', {
      department: selectedDepartment,
      riskLevel: value,
      timeRange: timeRange?.preset
    });
    console.log('Setting selectedRiskLevel state to:', value);
    
    // Reset chart data immediately when filter changes
    setChartData({
      timeBasedData: [],
      departmentStats: [],
      riskLevelData: [],
      lateArrivalData: [],
      patternData: [],
      streakData: { data: [], stats: {} }
    });
    
    setSelectedRiskLevel(value);
  }, [selectedDepartment, timeRange?.preset]);





  const toggleChartExpansion = useCallback((chartId: string) => {
    setExpandedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chartId)) {
        newSet.delete(chartId);
      } else {
        newSet.add(chartId);
      }
      return newSet;
    });
  }, []);

  const handleChartClick = useCallback((data: any, chartType: string) => {
    if (enableDrillDown && onDrillDown) {
      onDrillDown({ type: chartType, value: data.name || data.id });
      
      // Update drill-down state
      setDrillDownState(prev => ({
        isActive: true,
        level: chartType as any,
        data: data,
        breadcrumbs: [...prev.breadcrumbs, data.name || data.id],
        filters: { ...prev.filters, [chartType]: data.name || data.id }
      }));
    }
  }, [enableDrillDown, onDrillDown]);

  const handleExport = useCallback(async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      if (!analyticsData) {
        throw new Error('No data available for export');
      }

      const exportData = {
        type,
        data: data || [],
        filters: {
          department: selectedDepartment,
          riskLevel: selectedRiskLevel,
          subject: selectedSubject,
          course: selectedCourse,
          section: selectedSection,
          yearLevel: selectedYearLevel
        },
        timeRange
      };

      const options = {
        format,
        filename: `${type}-attendance-analytics-${new Date().toISOString().split('T')[0]}`,
        includeCharts: true,
        includeFilters: true
      };

      await ExportService.exportAnalytics(exportData, options);
      
      // Also call the parent export handler if provided
      if (onExport) {
        onExport(format);
      }
      
      // Show success toast
      setToast({ message: `${format.toUpperCase()} export completed successfully!`, type: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      // Show error toast
      setToast({ 
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }
  }, [analyticsData, type, data, selectedDepartment, selectedRiskLevel, selectedSubject, selectedCourse, selectedSection, selectedYearLevel, timeRange, onExport]);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoadingState({
      isLoading: true,
      progress: 0,
      message: 'Retrying...',
      stage: 'fetching'
    });
    // Trigger a new fetch
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Advanced interactivity handlers
  const handleDrillDownNavigation = useCallback((index: number) => {
    if (index === -1) {
      // Go back
      setDrillDownState(prev => ({
        ...prev,
        breadcrumbs: prev.breadcrumbs.slice(0, -1),
        level: prev.breadcrumbs.length > 1 ? 'department' : 'department'
      }));
    } else {
      // Navigate to specific level
      setDrillDownState(prev => ({
        ...prev,
        breadcrumbs: prev.breadcrumbs.slice(0, index + 1),
        level: index === 0 ? 'department' : 'instructor'
      }));
    }
  }, []);

  const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
    // If custom is selected, don't immediately fetch data - wait for Apply button
    if (newRange.preset === 'custom') {
      setTimeRange(newRange);
      setCustomRangeApplied(false); // Reset the applied state
      // Don't trigger fetchAnalyticsData here - it will be triggered when Apply is clicked
    } else {
      setTimeRange(newRange);
      setCustomRangeApplied(true); // Mark as applied for non-custom ranges
      
      // Reset chart data immediately when time range changes
      setChartData({
        timeBasedData: [],
        departmentStats: [],
        riskLevelData: [],
        lateArrivalData: [],
        patternData: [],
        streakData: { data: [], stats: {} }
      });
      
      // For non-custom ranges, the useEffect will handle the fetch
    }
  }, []);

  const handleCustomRangeApply = useCallback(() => {
    setCustomRangeApplied(true);
    
    // Reset chart data immediately when custom range is applied
    setChartData({
      timeBasedData: [],
      departmentStats: [],
      riskLevelData: [],
      lateArrivalData: [],
      patternData: [],
      streakData: { data: [], stats: {} }
    });
    
    // This will trigger the useEffect to fetch data with the custom range
  }, []);

  const handleSubjectChange = useCallback((value: string) => {
    // Subject changes only affect modal data, not main dashboard
    // Call the parent's onSubjectChange if provided
    if (onSubjectChange) {
      onSubjectChange(value);
    }
    // Note: This doesn't trigger fetchAnalyticsData since selectedSubject is removed from dependencies
  }, [onSubjectChange]);

  // Helper function for modals to fetch subject-filtered data
  const fetchModalData = useCallback(async (subjectId?: string) => {
    try {
      const params = new URLSearchParams({
        type,
        timeRange: timeRange?.preset || 'week',
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment }),
        ...(subjectId && subjectId !== 'all' && { subjectId }),
        ...(timeRange?.start && { startDate: timeRange.start.toISOString() }),
        ...(timeRange?.end && { endDate: timeRange.end.toISOString() })
      });

      const response = await fetch(`/api/attendance/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch modal data');
      }
    } catch (error) {
      console.error('Error fetching modal data:', error);
      return null;
    }
  }, [type, timeRange, selectedDepartment]);

  const handleResetFilters = useCallback(() => {
    setDrillDownState({
      isActive: false,
      level: 'department',
      data: null,
      breadcrumbs: [],
      filters: {}
    });
  }, []);

  // Only return early for critical errors, not for loading states
  // Loading states will be handled by individual charts

  if (error) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <AnalyticsHeader
            type={type}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onExport={handleExport}
            onRefresh={onRefresh}
            loading={loading}
          />
        )}
        <ErrorBoundary error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Don't return early - let individual charts handle their own no-data states
  // Only return early if there's a critical error
  if (error) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <AnalyticsHeader
            type={type}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onExport={handleExport}
            onRefresh={onRefresh}
            loading={loading}
          />
        )}
        <ErrorBoundary error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {showHeader && (
        <AnalyticsHeader
          type={type}
          showDetails={showDetails}
          onToggleDetails={toggleDetails}
          onExport={handleExport}
          onRefresh={onRefresh}
          loading={loading}
        />
      )}

      <div className="px-6 py-6 relative">
        {/* General Loading Overlay */}
        {loadingState.isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mb-6"></div>
            <p className="text-xl font-semibold text-gray-900 mb-4">{loadingState.message}</p>
            <div className="w-80 bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${loadingState.progress}%` }}
              ></div>
            </div>
            <p className="text-lg text-gray-600 capitalize">{loadingState.stage}...</p>
          </div>
        )}

        {/* Advanced Interactivity Features */}
        {enableAdvancedFeatures && (
          <div className="space-y-4">
            {/* Drill-down Breadcrumbs */}
            {drillDownState.isActive && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <DrillDownBreadcrumbs
                  breadcrumbs={drillDownState.breadcrumbs}
                  onNavigate={handleDrillDownNavigation}
                />
              </div>
            )}


          </div>
        )}

      {/* Tabbed Analytics Interface */}
      <div className="space-y-6 pt-4">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Combined Header with Tabs and Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6">
            {/* Left: Tab Navigation */}
            <TabsList className="inline-flex h-auto w-auto items-center justify-start bg-transparent border-b border-gray-200 p-0 gap-0">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 px-4 py-3 bg-transparent border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none font-medium transition-all duration-200"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="charts" 
                className="flex items-center gap-2 px-4 py-3 bg-transparent border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none font-medium transition-all duration-200"
              >
                <BarChartIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Trends</span>
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="flex items-center gap-2 px-4 py-3 bg-transparent border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none font-medium transition-all duration-200"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Patterns</span>
              </TabsTrigger>

            </TabsList>
            
            {/* Right: Analytics Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <AnalyticsFilters
                selectedDepartment={selectedDepartment}
                selectedRiskLevel={selectedRiskLevel}
                departmentStats={chartData.departmentStats.reduce((acc: Record<string, any>, dept: any) => {
                  acc[dept.name] = dept.attendanceRate || 0;
                  return acc;
                }, {} as Record<string, any>)}
                onDepartmentChange={handleDepartmentChange}
                onRiskLevelChange={handleRiskLevelChange}
                enableTimeRange={enableTimeRange}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
                onCustomRangeApply={handleCustomRangeApply}
              />
            </div>
          </div>

        {/* Dashboard Tab */}
        <TabsContent value="overview" className="space-y-8 mt-6">
          {/* Compact Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Count Card */}
            {analyticsData && analyticsData.totalCount > 0 ? (
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-600">Total {type === 'instructor' ? 'Instructors' : 'Students'}</h3>
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <Users className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div className="mb-1">
                <div className="text-xl font-bold text-gray-900">{analyticsData.totalCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{type === 'instructor' ? 'instructors' : 'students'}</div>
              </div>
              {/* Hide total trend: we don't compute previous-period headcount */}
            </div>
            ) : (
              <ChartNoData
                title="No Data Available"
                description="No attendance records found"
                icon={Users}
                iconColor="text-gray-400"
                bgColor="bg-white"
              />
            )}

            {/* Attendance Rate Card */}
            {analyticsData && (analyticsData.attendedClasses + analyticsData.absentClasses + analyticsData.lateClasses) > 0 ? (
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-600">Attendance Rate</h3>
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div className="mb-1">
                <div className="text-xl font-bold text-gray-900">
                  {((analyticsData.attendedClasses / (analyticsData.attendedClasses + analyticsData.absentClasses + analyticsData.lateClasses)) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">overall rate</div>
              </div>
              <div className="flex items-center text-xs text-green-600">
                {analyticsData.trends?.attendanceRate.direction === 'up' ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+{analyticsData.trends.attendanceRate.change.toFixed(1)}%</span>
                  </>
                ) : analyticsData.trends?.attendanceRate.direction === 'down' ? (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                    <span>-{analyticsData.trends.attendanceRate.change.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 mr-1" />
                    <span>No change</span>
                  </>
                )}
              </div>
            </div>
            ) : (
              <ChartNoData
                title="No Attendance Data"
                description="No attendance records available"
                icon={CheckCircle}
                iconColor="text-gray-400"
                bgColor="bg-white"
              />
            )}

            {/* Departments Card */}
            {generateFilteredDepartmentStats().length > 0 ? (
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-600">Departments</h3>
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <Building className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div className="mb-1">
                <div className="text-xl font-bold text-gray-900">{generateFilteredDepartmentStats().length}</div>
                <div className="text-xs text-gray-500">active departments</div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                {analyticsData?.trends?.departments.direction === 'up' ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+{analyticsData.trends.departments.change.toFixed(1)}%</span>
                  </>
                ) : analyticsData?.trends?.departments.direction === 'down' ? (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                    <span>-{analyticsData.trends.departments.change.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 mr-1" />
                    <span>No change</span>
                  </>
                )}
              </div>
            </div>
            ) : (
              <ChartNoData
                title="No Departments"
                description="No department data available"
                icon={Building}
                iconColor="text-gray-400"
                bgColor="bg-white"
              />
            )}

            {/* High Risk Card */}
            {(chartData.riskLevelData?.find((r: any) => r.level === 'high')?.count || 0) > 0 ? (
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-600">High Risk</h3>
                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div className="mb-1">
                  <div className="text-xl font-bold text-gray-900">{chartData.riskLevelData?.find((r: any) => r.level === 'high')?.count || 0}</div>
                <div className="text-xs text-gray-500">high risk cases</div>
              </div>
              <div className="flex items-center text-xs text-red-600">
                  {analyticsData?.trends?.highRisk?.direction === 'up' ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                      <span>+{analyticsData.trends?.highRisk?.change?.toFixed(1) || '0'}%</span>
                  </>
                  ) : analyticsData?.trends?.highRisk?.direction === 'down' ? (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                      <span>-{analyticsData.trends?.highRisk?.change?.toFixed(1) || '0'}%</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 mr-1" />
                    <span>No change</span>
                  </>
                )}
              </div>
            </div>
            ) : (
              <ChartNoData
                title="No High Risk Cases"
                description="No high risk individuals found"
                icon={AlertTriangle}
                iconColor="text-green-500"
                bgColor="bg-white"
              />
            )}
          </div>

          {/* Combined Row: Attendance Distribution and Department Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compact Attendance Distribution Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-blue-900 mb-1">
                    Attendance Distribution
                    {selectedDepartment !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {selectedDepartment}
                      </span>
                    )}
                  </h4>

                  <p className="text-sm text-gray-600">
                    {selectedDepartment !== 'all' 
                      ? `Quick overview of attendance status for ${selectedDepartment} department`
                      : 'Quick overview of attendance status'
                    }
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FullscreenAttendanceDistributionModal
                        totalPresent={analyticsData?.attendedClasses || 0}
                        totalLate={analyticsData?.lateClasses || 0}
                        totalAbsent={analyticsData?.absentClasses || 0}
                        type={type}
                        onExport={handleExport}
                        selectedSubject={selectedSubject}
                        selectedDepartment={selectedDepartment}
                        onSubjectChange={handleSubjectChange}
                        subjects={subjects}
                        loading={loading}
                        fetchModalData={fetchModalData}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-xl">
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View fullscreen with detailed breakdown</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Donut Chart */}
              {(() => {
                console.log('Attendance Distribution Chart - Current Values:', {
                  selectedDepartment,
                  attendedClasses: analyticsData?.attendedClasses || 0,
                  absentClasses: analyticsData?.absentClasses || 0,
                  lateClasses: analyticsData?.lateClasses || 0,
                  total: (analyticsData?.attendedClasses || 0) + (analyticsData?.absentClasses || 0) + (analyticsData?.lateClasses || 0)
                });
                return analyticsData && (
                  ((analyticsData.attendedClasses || 0) + (analyticsData.absentClasses || 0) + (analyticsData.lateClasses || 0)) > 0
                );
              })() ? (
                                <div key={`attendance-chart-${selectedDepartment}-${selectedRiskLevel}-${timeRange?.preset}`} className="flex items-center justify-center mb-6">
                  <div className="relative w-56 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { 
                            name: 'Present', 
                            value: analyticsData?.attendedClasses || 0, 
                            color: '#1e40af' // Dark blue
                          },
                          { 
                            name: 'Late', 
                            value: analyticsData?.lateClasses || 0, 
                            color: '#0ea5e9' // Light blue/cyan
                          },
                          { 
                            name: 'Absent', 
                            value: analyticsData?.absentClasses || 0, 
                            color: '#9ca3af' // Light gray
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {[
                          { 
                            name: 'Present', 
                            value: analyticsData?.attendedClasses || 0, 
                            color: '#1e40af' 
                          },
                          { 
                            name: 'Late', 
                            value: analyticsData?.lateClasses || 0, 
                            color: '#0ea5e9' 
                          },
                          { 
                            name: 'Absent', 
                            value: analyticsData?.absentClasses || 0, 
                            color: '#9ca3af' 
                          }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                        formatter={(value: any, name: any) => {
                          const totalPresent = analyticsData?.attendedClasses || 0;
                          const totalLate = analyticsData?.lateClasses || 0;
                          const totalAbsent = analyticsData?.absentClasses || 0;
                          const total = totalPresent + totalLate + totalAbsent;
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                          return [
                            `${value.toLocaleString()} (${percentage}%)`, 
                            name
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Data</h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    No attendance records found for the selected filters and time period.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Try adjusting your filters or time range</span>
                  </div>
                </div>
              )}
              
              {/* Horizontal Legend */}
              <div className="flex items-center justify-center mb-4 mt-8">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-700 rounded-sm"></div>
                    <span className="text-sm text-gray-700">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-sm"></div>
                    <span className="text-sm text-gray-700">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                    <span className="text-sm text-gray-700">Absent</span>
                  </div>
                </div>
              </div>
              

            </div>

            {/* Simplified Department Performance Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-blue-900 mb-1">Department Performance</h4>
                  <p className="text-sm text-gray-600">Attendance rates by department</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FullscreenDepartmentPerformanceModal
                        departmentStats={generateFilteredDepartmentStats()}
                        type={type}
                        onExport={handleExport}
                        selectedSubject={selectedSubject}
                        onSubjectChange={handleSubjectChange}
                        subjects={subjects}
                        fetchModalData={fetchModalData}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-xl">
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View fullscreen with detailed breakdown</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Simple Bar Chart */}
              <div key={`department-chart-${selectedDepartment}-${selectedRiskLevel}-${timeRange?.preset}`} className={`transition-all duration-300 ${expandedCharts.has("department-performance-overview") ? 'h-96' : 'h-80'}`}>
                {generateFilteredDepartmentStats().length === 0 || generateFilteredDepartmentStats().every((dept: any) => dept.attendanceRate === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Department Data</h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      No department performance data found for the selected filters and time period.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Info className="w-4 h-4" />
                      <span>Try adjusting your filters or time range</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {console.log('Department Performance Chart Data:', generateFilteredDepartmentStats())}
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={generateFilteredDepartmentStats().map((dept: any) => ({
                      ...dept,
                      attendanceRate: dept.attendanceRate === 0 ? 0.1 : dept.attendanceRate, // Show tiny bar for 0% values
                      originalRate: dept.attendanceRate // Keep original value for tooltip
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="code" 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: any, props: any) => {
                          const originalRate = props.payload.originalRate || value;
                          return [`${originalRate.toFixed(1)}%`, 'Attendance Rate'];
                        }}
                      />
                      <Bar 
                        dataKey="attendanceRate" 
                        fill="#1e40af"
                        radius={[4, 4, 0, 0]}
                        minPointSize={2}
                      />
                      <ReferenceLine 
                        y={85} 
                        stroke="#0ea5e9" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ 
                          value: "Target 85%", 
                          position: "insideTopRight",
                          fill: "#0ea5e9",
                          fontSize: 11,
                          fontWeight: "bold"
                        }}
                      />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                )}
              </div>

              {/* Simple Legend */}
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-700 rounded"></div>
                    <span className="text-gray-600">Attendance Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                    <span className="text-gray-600">Target (85%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="charts" className="space-y-8 mt-6">
          

          {/* Primary Charts Grid - Essential for Classroom Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Attendance Performance */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-blue-900">Attendance Trend Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Complete trend analysis for {type === 'instructor' ? 'instructors' : 'students'}
                      {showComparison && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          Comparison enabled
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Comparison Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showComparison ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowComparison(!showComparison)}
                          className="h-8 px-3 text-xs rounded"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {showComparison ? "Hide" : "Compare"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showComparison ? "Hide previous period comparison" : "Show comparison with previous period"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FullscreenWeeklyTrendModal
                          weeklyData={generateDynamicChartData()}
                          type={type}
                          onExport={handleExport}
                          getXAxisConfig={getXAxisConfig}
                          showComparison={showComparison}
                          selectedSubject={selectedSubject}
                          onSubjectChange={handleSubjectChange}
                          subjects={subjects}
                          fetchModalData={fetchModalData}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-xl">
                              <Maximize2 className="w-4 h-4 text-gray-400" />
                            </Button>
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View fullscreen with detailed breakdown</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div key={`trend-chart-${selectedDepartment}-${selectedRiskLevel}-${timeRange?.preset}`} className={`transition-all duration-300 ${expandedCharts.has("weekly-trend") ? 'h-96' : 'h-80'}`}>
                {generateDynamicChartData().length === 0 || generateDynamicChartData().every((item: any) => item.attendanceRate === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Data</h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      No attendance trend data found for the selected filters and time period.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Info className="w-4 h-4" />
                      <span>Try adjusting your filters or time range</span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateDynamicChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey={getXAxisConfig().dataKey}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={getXAxisConfig().tickFormatter}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(label) => {
                          const xAxisConfig = getXAxisConfig();
                          if (xAxisConfig.tickFormatter) {
                            return xAxisConfig.tickFormatter(label);
                          }
                          return label;
                        }}
                        formatter={(value: any, name: any, props: any) => {
                          if (showComparison && props.payload.previousAttendanceRate !== undefined) {
                            const current = props.payload.attendanceRate;
                            const previous = props.payload.previousAttendanceRate;
                            const change = current - previous;
                            const changePercent = ((change / previous) * 100).toFixed(1);
                            const changeText = change >= 0 ? `+${changePercent}%` : `${changePercent}%`;
                            const changeColor = change >= 0 ? '#10b981' : '#ef4444';
                            
                            return [
                              [
                                `${value}% (Current)`,
                                `${previous}% (Previous)`,
                                `${changeText} change`
                              ],
                              [name, 'Previous Period', 'Change']
                            ];
                          }
                          return [`${value}%`, name];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendanceRate" 
                        stroke="#1e40af" 
                        strokeWidth={3}
                        dot={{ fill: '#1e40af', strokeWidth: 2, r: 5, stroke: 'white' }}
                        activeDot={{ r: 7, stroke: '#1e40af', strokeWidth: 3, fill: '#1e40af' }}
                        name="Current Period"
                      />
                      {showComparison && (
                        <Line 
                          type="monotone" 
                          dataKey="previousAttendanceRate" 
                          stroke="#6b7280" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#6b7280', strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: '#6b7280', strokeWidth: 2, fill: '#6b7280' }}
                          name="Previous Period"
                        />
                      )}
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconType="line"
                        wrapperStyle={{ paddingBottom: '10px' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Late Arrival Trends */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-blue-900">Late Arrival Trends</h4>
                    <p className="text-sm text-gray-600">
                      Late arrival trend analysis for {type === 'instructor' ? 'instructors' : 'students'}
                      {showLateComparison && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          Comparison enabled
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Comparison Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={showLateComparison ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowLateComparison(!showLateComparison)}
                          className="h-8 px-3 text-xs rounded"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {showLateComparison ? "Hide" : "Compare"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showLateComparison ? "Hide previous period comparison" : "Show comparison with previous period"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FullscreenLateArrivalModal
                          lateData={generateLateArrivalData()}
                          type={type}
                          onExport={handleExport}
                          getXAxisConfig={getXAxisConfig}
                          showComparison={showLateComparison}
                          selectedSubject={selectedSubject}
                          onSubjectChange={handleSubjectChange}
                          subjects={subjects}
                          fetchModalData={fetchModalData}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-xl">
                              <Maximize2 className="w-4 h-4 text-gray-400" />
                            </Button>
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View fullscreen with detailed breakdown</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div key={`late-trend-chart-${selectedDepartment}-${selectedRiskLevel}-${timeRange?.preset}`} className={`transition-all duration-300 ${expandedCharts.has("late-arrival-trends") ? 'h-96' : 'h-80'}`}>
                {generateLateArrivalData().length === 0 || generateLateArrivalData().every((item: any) => item.lateCount === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Late Arrival Data</h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      No late arrival trend data found for the selected filters and time period.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Info className="w-4 h-4" />
                      <span>Try adjusting your filters or time range</span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateLateArrivalData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey={getXAxisConfig().dataKey}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={getXAxisConfig().tickFormatter}
                      />
                      <YAxis 
                        domain={[0, 25]} 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(label) => {
                          const xAxisConfig = getXAxisConfig();
                          if (xAxisConfig.tickFormatter) {
                            return xAxisConfig.tickFormatter(label);
                          }
                          return label;
                        }}
                        formatter={(value: any, name: any, props: any) => {
                          if (showLateComparison && props.payload.previousLateRate !== undefined) {
                            const current = props.payload.lateRate;
                            const previous = props.payload.previousLateRate;
                            const change = current - previous;
                            const changePercent = ((change / previous) * 100).toFixed(1);
                            const changeText = change >= 0 ? `+${changePercent}%` : `${changePercent}%`;
                            
                            return [
                              [
                                `${value}% (Current)`,
                                `${previous}% (Previous)`,
                                `${changeText} change`
                              ],
                              [name, 'Previous Period', 'Change']
                            ];
                          }
                          return [`${value}%`, name];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lateRate" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 5, stroke: 'white' }}
                        activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 3, fill: '#ef4444' }}
                        name="Current Period"
                      />
                      {showLateComparison && (
                        <Line 
                          type="monotone" 
                          dataKey="previousLateRate" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#f59e0b' }}
                        name="Previous Period"
                        />
                      )}
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconType="line"
                        wrapperStyle={{ paddingBottom: '10px' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>


           </div>
         </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="advanced" className="space-y-8 mt-6">
          {/* Additional Charts for Advanced Features */}
          {enableAdvancedFeatures && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Pattern Analysis */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="text-lg font-bold text-blue-900">Attendance Pattern Analysis</h4>
                  <p className="text-sm text-gray-600">Moving average and peak/low pattern detection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FullscreenPatternAnalysisModal
                        patternData={generatePatternAnalysisData}
                        type={type}
                        onExport={handleExport}
                        getXAxisConfig={getXAxisConfig}
                        selectedCourse={selectedCourse}
                        selectedSubject={selectedSubject}
                        onSubjectChange={handleSubjectChange}
                        subjects={subjects}
                        fetchModalData={fetchModalData}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-xl">
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View fullscreen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div key={`pattern-chart-${selectedDepartment}-${selectedRiskLevel}-${timeRange?.preset}`} className={`transition-all duration-300 ${expandedCharts.has("pattern-analysis") ? 'h-96' : 'h-80'}`}>
              {generatePatternAnalysisData.length === 0 || generatePatternAnalysisData.every((item: any) => item.attendanceRate === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pattern Data</h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    No attendance pattern data found for the selected filters and time period.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Try adjusting your filters or time range</span>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generatePatternAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey={getXAxisConfig().dataKey}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={getXAxisConfig().tickFormatter}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(label) => {
                        const xAxisConfig = getXAxisConfig();
                        if (xAxisConfig.tickFormatter) {
                          return xAxisConfig.tickFormatter(label);
                        }
                        return label;
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        const isPeak = props?.payload?.isPeak;
                        const isValley = props?.payload?.isValley;
                        const markers = isPeak ? ' (peak)' : isValley ? ' (low)' : '';
                        if (name === 'movingAverage') return [`${value.toFixed?.(1) ?? value}%`, 'Moving Avg'];
                        return [`${value}%${markers}`, 'Attendance Rate'];
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attendanceRate" 
                      stroke="#1e40af" 
                      strokeWidth={2}
                      dot={false}
                      name="Attendance Rate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="movingAverage" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={false}
                      name="Moving Avg"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Streak Analysis */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="text-lg font-bold text-blue-900">Streak Analysis</h4>
                  <p className="text-sm text-gray-600">Consecutive days of good/poor attendance patterns</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FullscreenStreakAnalysisModal
                        streakData={generateStreakAnalysisData}
                        type={type}
                        onExport={handleExport}
                        getXAxisConfig={getXAxisConfig}
                        selectedSubject={selectedSubject}
                        onSubjectChange={handleSubjectChange}
                        subjects={subjects}
                        fetchModalData={fetchModalData}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-xl">
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View fullscreen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            


            <div key={`streak-chart-${selectedDepartment}-${selectedRiskLevel}-${timeRange?.preset}`} className={`transition-all duration-300 ${expandedCharts.has("streak-analysis") ? 'h-96' : 'h-80'}`}>
              {generateStreakAnalysisData.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Streak Data</h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    No attendance streak data found for the selected filters and time period.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Try adjusting your filters or time range</span>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateStreakAnalysisData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey={getXAxisConfig().dataKey}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={getXAxisConfig().tickFormatter}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `${Math.abs(value)}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(label) => {
                        const xAxisConfig = getXAxisConfig();
                        if (xAxisConfig.tickFormatter) {
                          return xAxisConfig.tickFormatter(label);
                        }
                        return label;
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        const streakType = props?.payload?.streakType;
                        const isBreak = props?.payload?.isStreakBreak;
                        const attendanceRate = props?.payload?.attendanceRate;
                        const streakLabel = streakType === 'good' ? 'Good Streak' : 'Poor Streak';
                        const breakLabel = isBreak ? ' (Streak Break)' : '';
                        return [
                          `${Math.abs(value)} days${breakLabel}`,
                          streakLabel,
                          `Attendance: ${attendanceRate}%`
                        ];
                      }}
                    />
                    <Bar 
                      dataKey="currentStreak" 
                      fill="#6b7280"
                      radius={[2, 2, 0, 0]}
                    >
                      {generateStreakAnalysisData.data.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.currentStreak > 0 ? '#22c55e' : entry.currentStreak < 0 ? '#ef4444' : '#6b7280'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
          )}
        </TabsContent>


        </Tabs>
      </div>
      </div>
    </div>
  );
}