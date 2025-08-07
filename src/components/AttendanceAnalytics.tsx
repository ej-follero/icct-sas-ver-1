'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon
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
  Legend
} from 'recharts';
import { AnalyticsHeader, AnalyticsFilters, QuickStats, ChartCard, DrillDownBreadcrumbs, CrossFilterPanel, TimeRangeSelector } from './analytics';
import { 
  processRealTimeData, 
  calculateAttendanceRate, 
  getRiskLevelColor, 
  getTrendIcon, 
  calculateWeeklyAttendanceData, 
  validateAttendanceData, 
  type AttendanceData, 
  type AnalyticsData,
  type WeeklyData,
  type DataValidationResult,
  type RiskLevelData
} from '@/lib/analytics-utils';

// Enhanced TypeScript interfaces for advanced interactivity
interface DrillDownState {
  isActive: boolean;
  level: 'department' | 'instructor' | 'class' | 'session';
  data: any;
  breadcrumbs: string[];
  filters: Record<string, any>;
}

interface CrossFilterState {
  activeFilters: Record<string, any>;
  appliedFilters: Record<string, any>;
  filterHistory: Array<{
    timestamp: Date;
    filter: Record<string, any>;
    source: string;
  }>;
}

interface TimeRange {
  start: Date;
  end: Date;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface AdvancedInteractivityProps {
  drillDown: DrillDownState;
  crossFilter: CrossFilterState;
  timeRange: TimeRange;
  onDrillDown: (level: string, data: any) => void;
  onCrossFilter: (filters: Record<string, any>) => void;
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

interface AttendanceAnalyticsProps {
  data: AttendanceData[];
  loading?: boolean;
  type: 'instructor' | 'student';
  onDrillDown?: (filter: { type: string; value: string }) => void;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  enableAdvancedFeatures?: boolean;
  enableRealTime?: boolean;
  enableCrossFiltering?: boolean;
  enableDrillDown?: boolean;
  enableTimeRange?: boolean;
  showHeader?: boolean;
}

// Utility functions imported from analytics-utils





// Components moved to instructor page

const TrendsBarChart = ({ data, title }: { data: { name: string; avgAttendance: number; count: number }[], title: string }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">{title}</h3>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
        <RechartsTooltip />
        <Bar dataKey="avgAttendance" fill="#3b82f6" name="Avg Attendance (%)" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Instructor-specific analytics components
const InstructorComplianceChart = ({ data }: { data: { name: string; complianceScore: number; classesTaught: number }[] }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">Instructor Compliance Scores</h3>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
        <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Compliance Score']} />
        <Bar dataKey="complianceScore" fill="#10b981" name="Compliance Score" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const TeachingLoadChart = ({ data }: { data: { department: string; teachingLoad: number; instructorCount: number }[] }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">Teaching Load Distribution</h3>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="department" fontSize={12} />
        <YAxis fontSize={12} />
        <RechartsTooltip formatter={(value: any) => [`${value}`, 'Teaching Load']} />
        <Bar dataKey="teachingLoad" fill="#8b5cf6" name="Teaching Load" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const SubstituteRequiredChart = ({ data }: { data: { week: string; substituteRequired: number; totalClasses: number }[] }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">Substitute Requirements</h3>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <RechartsTooltip formatter={(value: any) => [`${value}`, 'Substitutes Required']} />
        <Line 
          type="monotone" 
          dataKey="substituteRequired" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Student-specific analytics components


const AttendanceStreakChart = ({ data }: { data: { streak: string; count: number; percentage: number }[] }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">Attendance Streak Distribution</h3>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="count"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getRiskLevelColor(entry.streak)} />
          ))}
        </Pie>
        <RechartsTooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

// Attendance Distribution Component
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

// Department Trends Chart Component
export const DepartmentTrendsChart = ({ data }: { data: { name: string; avgAttendance: number; count: number }[] }) => (
  <div className="my-6">
    <h3 className="text-md font-bold text-blue-900 mb-2">Department Attendance Trends</h3>
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

const ErrorBoundary = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="text-center py-8">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
    <p className="text-gray-600 mb-4">{error}</p>
    <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
      <RefreshCw className="w-4 h-4 mr-2" />
      Try Again
    </Button>
  </div>
);

export function AttendanceAnalytics({
  data,
  loading = false,
  type,
  onDrillDown,
  onExport,
  enableAdvancedFeatures = true,
  enableRealTime = false,
  enableCrossFiltering = true,
  enableDrillDown = true,
  enableTimeRange = true,
  showHeader = true
}: AttendanceAnalyticsProps) {
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

  // Advanced interactivity states
  const [drillDownState, setDrillDownState] = useState<DrillDownState>({
    isActive: false,
    level: 'department',
    data: null,
    breadcrumbs: [],
    filters: {}
  });

  const [crossFilterState, setCrossFilterState] = useState<CrossFilterState>({
    activeFilters: {},
    appliedFilters: {},
    filterHistory: []
  });

  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    preset: 'month'
  });

  // Performance optimizations
  const analyticsDataRef = useRef<AnalyticsData | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced data processing with real-time capabilities
  const analyticsData = useMemo(() => {
    try {
      setLoadingState({
        isLoading: true,
        progress: 0,
        message: 'Processing data...',
        stage: 'processing'
      });

      const processedData = processRealTimeData(data, type);
      
      // Simulate processing delay for large datasets
      if (data.length > 100) {
        processingTimeoutRef.current = setTimeout(() => {
          setLoadingState(prev => ({
            ...prev,
            progress: 100,
            message: 'Data processed successfully',
            stage: 'rendering'
          }));
        }, 1000);
      } else {
        setLoadingState({
          isLoading: false,
          progress: 100,
          message: 'Data processed successfully',
          stage: 'rendering'
        });
      }

      analyticsDataRef.current = processedData;
      return processedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process data');
      setLoadingState({
        isLoading: false,
        progress: 0,
        message: 'Error processing data',
        stage: 'fetching'
      });
      return null;
    }
  }, [data, type]);

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
    setSelectedDepartment(value);
    if (enableCrossFiltering) {
      setCrossFilterState(prev => ({
        ...prev,
        activeFilters: { ...prev.activeFilters, department: value },
        filterHistory: [...prev.filterHistory, {
          timestamp: new Date(),
          filter: { department: value },
          source: 'department-selector'
        }]
      }));
    }
  }, [enableCrossFiltering]);

  const handleRiskLevelChange = useCallback((value: string) => {
    setSelectedRiskLevel(value);
    if (enableCrossFiltering) {
      setCrossFilterState(prev => ({
        ...prev,
        activeFilters: { ...prev.activeFilters, riskLevel: value },
        filterHistory: [...prev.filterHistory, {
          timestamp: new Date(),
          filter: { riskLevel: value },
          source: 'risk-level-selector'
        }]
      }));
    }
  }, [enableCrossFiltering]);

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

  const handleExport = useCallback((format: 'pdf' | 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
    }
  }, [onExport]);

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
  }, []);

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

  const handleCrossFilter = useCallback((filters: Record<string, any>) => {
    setCrossFilterState(prev => ({
      ...prev,
      activeFilters: { ...prev.activeFilters, ...filters },
      appliedFilters: { ...prev.appliedFilters, ...filters }
    }));
  }, []);

  const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
    setTimeRange(newRange);
  }, []);

  const handleResetFilters = useCallback(() => {
    setCrossFilterState({
      activeFilters: {},
      appliedFilters: {},
      filterHistory: []
    });
    setDrillDownState({
      isActive: false,
      level: 'department',
      data: null,
      breadcrumbs: [],
      filters: {}
    });
  }, []);

  // Early returns for different states
  if (loading || loadingState.isLoading) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <AnalyticsHeader
            type={type}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onExport={handleExport}
          />
        )}
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <AnalyticsHeader
            type={type}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onExport={handleExport}
          />
        )}
        <ErrorBoundary error={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <AnalyticsHeader
            type={type}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onExport={handleExport}
          />
        )}
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">No attendance data found for the selected criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <AnalyticsHeader
          type={type}
          showDetails={showDetails}
          onToggleDetails={toggleDetails}
          onExport={handleExport}
        />
      )}

      {/* Advanced Interactivity Features */}
      {enableAdvancedFeatures && (
        <>
          {/* Drill-down Breadcrumbs */}
          {drillDownState.isActive && (
            <DrillDownBreadcrumbs
              breadcrumbs={drillDownState.breadcrumbs}
              onNavigate={handleDrillDownNavigation}
            />
          )}

          {/* Cross-filter Panel */}
          {enableCrossFiltering && Object.keys(crossFilterState.activeFilters).length > 0 && (
            <CrossFilterPanel
              activeFilters={crossFilterState.activeFilters}
              onApplyFilter={(key, value) => handleCrossFilter({ [key]: value })}
              onClearFilter={(key) => {
                const newFilters = { ...crossFilterState.activeFilters };
                delete newFilters[key];
                setCrossFilterState(prev => ({
                  ...prev,
                  activeFilters: newFilters
                }));
              }}
              onResetAll={handleResetFilters}
            />
          )}

        </>
      )}

      {/* Filters and Time Range in One Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Filters */}
        <div className="flex-1">
          <AnalyticsFilters
            selectedDepartment={selectedDepartment}
            selectedRiskLevel={selectedRiskLevel}
            departmentStats={analyticsData.departmentStats.reduce((acc, dept) => {
              acc[dept.name] = dept;
              return acc;
            }, {} as Record<string, any>)}
            onDepartmentChange={handleDepartmentChange}
            onRiskLevelChange={handleRiskLevelChange}
          />
        </div>
        
        {/* Time Range Selector */}
        {enableTimeRange && (
          <div className="lg:w-64">
            <TimeRangeSelector
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </div>
        )}
      </div>

      {/* Tabbed Analytics Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChartIcon className="w-4 h-4" />
            Visualizations
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends & Patterns
          </TabsTrigger>
          <TabsTrigger value="specific" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {type === 'instructor' ? 'Teaching' : 'Learning'} Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Attendance Distribution Chart */}
          <AttendanceDistribution
            totalPresent={analyticsData.attendedClasses}
            totalLate={analyticsData.lateClasses}
            totalAbsent={analyticsData.absentClasses}
          />

          {/* Department Trends Chart */}
          <DepartmentTrendsChart data={analyticsData.departmentStats.map(dept => ({
            name: dept.name,
            avgAttendance: dept.attendanceRate,
            count: dept.count
          }))} />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
        <ChartCard
          title="Weekly Attendance Trend"
          icon={Activity}
          chartId="weekly-trend"
          expandedCharts={expandedCharts}
          onToggleExpansion={toggleChartExpansion}
          onChartClick={handleChartClick}
          chartType="weekly-trend"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <RechartsTooltip />
              <Line 
                type="monotone" 
                dataKey="attendanceRate" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Risk Level Distribution */}
        <ChartCard
          title="Risk Level Distribution"
          icon={AlertTriangle}
          chartId="risk-distribution"
          expandedCharts={expandedCharts}
          onToggleExpansion={toggleChartExpansion}
          onChartClick={handleChartClick}
          chartType="risk-distribution"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.riskLevelData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.riskLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department Performance */}
        <ChartCard
          title="Department Performance"
          icon={Users}
          chartId="department-performance"
          expandedCharts={expandedCharts}
          onToggleExpansion={toggleChartExpansion}
          onChartClick={handleChartClick}
          chartType="department-performance"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.departmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="attendanceRate" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attendance by Day of Week */}
        <ChartCard
          title="Attendance by Day of Week"
          icon={Calendar}
          chartId="day-of-week"
          expandedCharts={expandedCharts}
          onToggleExpansion={toggleChartExpansion}
          onChartClick={handleChartClick}
          chartType="day-of-week"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { day: 'Monday', attendance: 85 },
              { day: 'Tuesday', attendance: 88 },
              { day: 'Wednesday', attendance: 82 },
              { day: 'Thursday', attendance: 90 },
              { day: 'Friday', attendance: 87 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="attendance" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Type-Specific Charts */}
      {type === 'instructor' && enableAdvancedFeatures && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Instructor Compliance Chart */}
          <ChartCard
            title="Instructor Compliance Scores"
            icon={CheckCircle}
            chartId="instructor-compliance"
            expandedCharts={expandedCharts}
            onToggleExpansion={toggleChartExpansion}
            onChartClick={handleChartClick}
            chartType="instructor-compliance"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.departmentStats.map(dept => ({
                name: dept.name,
                complianceScore: dept.attendanceRate,
                classesTaught: dept.totalClasses
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Compliance Score']} />
                <Bar dataKey="complianceScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Teaching Load Distribution */}
          <ChartCard
            title="Teaching Load Distribution"
            icon={Users}
            chartId="teaching-load"
            expandedCharts={expandedCharts}
            onToggleExpansion={toggleChartExpansion}
            onChartClick={handleChartClick}
            chartType="teaching-load"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(analyticsData.teachingLoadDistribution || {}).map(([dept, load]) => ({
                department: dept,
                teachingLoad: load,
                instructorCount: analyticsData.departmentStats.find(d => d.name === dept)?.count || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => [`${value}`, 'Teaching Load']} />
                <Bar dataKey="teachingLoad" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Substitute Requirements Trend */}
          <ChartCard
            title="Substitute Requirements Trend"
            icon={AlertTriangle}
            chartId="substitute-trend"
            expandedCharts={expandedCharts}
            onToggleExpansion={toggleChartExpansion}
            onChartClick={handleChartClick}
            chartType="substitute-trend"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.complianceTrends?.map((week, index) => ({
                week: week.week,
                substituteRequired: Math.floor(week.absentClasses * 0.3), // Mock calculation
                totalClasses: week.totalClasses
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => [`${value}`, 'Substitutes Required']} />
                <Line 
                  type="monotone" 
                  dataKey="substituteRequired" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Compliance Trends */}
          <ChartCard
            title="Compliance Trends"
            icon={TrendingUp}
            chartId="compliance-trends"
            expandedCharts={expandedCharts}
            onToggleExpansion={toggleChartExpansion}
            onChartClick={handleChartClick}
            chartType="compliance-trends"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.complianceTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Compliance Score']} />
                <Line 
                  type="monotone" 
                  dataKey="complianceScore" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {type === 'student' && enableAdvancedFeatures && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          {/* Attendance Streak Distribution */}
          <ChartCard
            title="Attendance Streak Distribution"
            icon={Activity}
            chartId="attendance-streak"
            expandedCharts={expandedCharts}
            onToggleExpansion={toggleChartExpansion}
            onChartClick={handleChartClick}
            chartType="attendance-streak"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analyticsData.attendanceStreakData || {}).map(([streak, count]) => ({
                    name: streak,
                    count,
                    percentage: (count / analyticsData.totalCount) * 100
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.entries(analyticsData.attendanceStreakData || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskLevelColor(entry[0])} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Additional Charts for Advanced Features */}
          {enableAdvancedFeatures && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time of Day Analysis */}
          <ChartCard
            title="Attendance by Time of Day"
            icon={Clock}
            chartId="time-of-day"
            expandedCharts={expandedCharts}
            onToggleExpansion={toggleChartExpansion}
            onChartClick={handleChartClick}
            chartType="time-of-day"
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { time: '8AM', attendance: 75 },
                { time: '9AM', attendance: 85 },
                { time: '10AM', attendance: 90 },
                { time: '11AM', attendance: 88 },
                { time: '12PM', attendance: 70 },
                { time: '1PM', attendance: 82 },
                { time: '2PM', attendance: 87 },
                { time: '3PM', attendance: 85 },
                { time: '4PM', attendance: 80 }
              ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <RechartsTooltip />
              <Area type="monotone" dataKey="attendance" stroke="#f59e0b" fill="#fef3c7" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>





        {/* Late Arrival Trends */}
        <ChartCard
          title="Late Arrival Trends"
          icon={Clock}
          chartId="late-arrival-trends"
          expandedCharts={expandedCharts}
          onToggleExpansion={toggleChartExpansion}
          onChartClick={handleChartClick}
          chartType="late-arrival-trends"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { week: 'Week 1', currentLateRate: 5, previousLateRate: 7 },
              { week: 'Week 2', currentLateRate: 4, previousLateRate: 6 },
              { week: 'Week 3', currentLateRate: 3, previousLateRate: 5 },
              { week: 'Week 4', currentLateRate: 2, previousLateRate: 4 },
              { week: 'Week 5', currentLateRate: 1, previousLateRate: 3 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 25]} />
              <RechartsTooltip 
                formatter={(value: any, name: any) => [`${value}%`, name === 'currentLateRate' ? 'Current Week' : 'Previous Week']}
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
        </ChartCard>
            </div>
          )}
        </TabsContent>

        {/* Type-Specific Tab */}
        <TabsContent value="specific" className="space-y-6">
          {type === 'instructor' && enableAdvancedFeatures && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Instructor Compliance Chart */}
              <ChartCard
                title="Instructor Compliance Scores"
                icon={CheckCircle}
                chartId="instructor-compliance"
                expandedCharts={expandedCharts}
                onToggleExpansion={toggleChartExpansion}
                onChartClick={handleChartClick}
                chartType="instructor-compliance"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.departmentStats.map(dept => ({
                    name: dept.name,
                    complianceScore: dept.attendanceRate,
                    classesTaught: dept.totalClasses
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Compliance Score']} />
                    <Bar dataKey="complianceScore" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Teaching Load Distribution */}
              <ChartCard
                title="Teaching Load Distribution"
                icon={Users}
                chartId="teaching-load"
                expandedCharts={expandedCharts}
                onToggleExpansion={toggleChartExpansion}
                onChartClick={handleChartClick}
                chartType="teaching-load"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analyticsData.teachingLoadDistribution || {}).map(([dept, load]) => ({
                    department: dept,
                    teachingLoad: load,
                    instructorCount: analyticsData.departmentStats.find(d => d.name === dept)?.count || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: any) => [`${value}`, 'Teaching Load']} />
                    <Bar dataKey="teachingLoad" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Substitute Requirements Trend */}
              <ChartCard
                title="Substitute Requirements Trend"
                icon={AlertTriangle}
                chartId="substitute-trend"
                expandedCharts={expandedCharts}
                onToggleExpansion={toggleChartExpansion}
                onChartClick={handleChartClick}
                chartType="substitute-trend"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.complianceTrends?.map((week, index) => ({
                    week: week.week,
                    substituteRequired: Math.floor(week.absentClasses * 0.3), // Mock calculation
                    totalClasses: week.totalClasses
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: any) => [`${value}`, 'Substitutes Required']} />
                    <Line 
                      type="monotone" 
                      dataKey="substituteRequired" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Compliance Trends */}
              <ChartCard
                title="Compliance Trends"
                icon={TrendingUp}
                chartId="compliance-trends"
                expandedCharts={expandedCharts}
                onToggleExpansion={toggleChartExpansion}
                onChartClick={handleChartClick}
                chartType="compliance-trends"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.complianceTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Compliance Score']} />
                    <Line 
                      type="monotone" 
                      dataKey="complianceScore" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {type === 'student' && enableAdvancedFeatures && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


              {/* Attendance Streak Distribution */}
              <ChartCard
                title="Attendance Streak Distribution"
                icon={Activity}
                chartId="attendance-streak"
                expandedCharts={expandedCharts}
                onToggleExpansion={toggleChartExpansion}
                onChartClick={handleChartClick}
                chartType="attendance-streak"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analyticsData.attendanceStreakData || {}).map(([streak, count]) => ({
                        name: streak,
                        count,
                        percentage: (count / analyticsData.totalCount) * 100
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(analyticsData.attendanceStreakData || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRiskLevelColor(entry[0])} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}