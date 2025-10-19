import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Bell,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Target,
  Calendar,
  MapPin,
  Wifi,
  Signal,
  Battery,
  Settings,
  Filter,
  Search,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { StudentAttendance } from '@/types/student-attendance';

export interface RealTimeMetrics {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  excusedStudents: number;
  attendanceRate: number;
  lastUpdate: Date;
  activeRFIDReaders: number;
  totalRFIDReaders: number;
  alerts: RealTimeAlert[];
  trends: TrendData[];
}

export interface RealTimeAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  actionRequired: boolean;
  category: 'attendance' | 'system' | 'security' | 'performance';
}

export interface TrendData {
  timestamp: Date;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

export interface LocationData {
  id: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  lastActivity: Date;
  status: 'active' | 'inactive' | 'error';
}

export interface RealTimeDashboardProps {
  students: StudentAttendance[];
  onRefresh: () => void;
  onAlertAction: (alertId: string, action: string) => void;
  onLocationClick: (locationId: string) => void;
}

export function RealTimeDashboard({
  students,
  onRefresh,
  onAlertAction,
  onLocationClick
}: RealTimeDashboardProps) {
  // Validate props
  if (!onRefresh || !onAlertAction || !onLocationClick) {
    console.error('RealTimeDashboard: Missing required props');
    return null;
  }

  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [showDetails, setShowDetails] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time metrics state
  const [metrics, setMetrics] = useState<RealTimeMetrics>(() => ({
    totalStudents: students.length,
    presentStudents: students.filter(s => (s.status as string) === 'PRESENT' || (s.status as string) === 'present').length,
    absentStudents: students.filter(s => (s.status as string) === 'ABSENT' || (s.status as string) === 'absent').length,
    lateStudents: students.filter(s => (s.status as string) === 'LATE' || (s.status as string) === 'late').length,
    excusedStudents: students.filter(s => (s.status as string) === 'EXCUSED' || (s.status as string) === 'excused').length,
    attendanceRate: 0,
    lastUpdate: new Date(),
    activeRFIDReaders: 8,
    totalRFIDReaders: 12,
    alerts: [],
    trends: []
  }));

  // Alerts state
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Low Attendance Alert',
      message: '5 students have attendance rate below 75%',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      severity: 'medium',
      acknowledged: false,
      actionRequired: true,
      category: 'attendance'
    },
    {
      id: '2',
      type: 'info',
      title: 'RFID Reader Status',
      message: 'RFID reader in Room 101 is back online',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      severity: 'low',
      acknowledged: true,
      actionRequired: false,
      category: 'system'
    },
    {
      id: '3',
      type: 'error',
      title: 'System Performance',
      message: 'High CPU usage detected on attendance server',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      severity: 'high',
      acknowledged: false,
      actionRequired: true,
      category: 'performance'
    }
  ]);

  // Location data state
  const [locations, setLocations] = useState<LocationData[]>([
    {
      id: 'room-101',
      name: 'Room 101 - Computer Lab',
      present: 25,
      absent: 3,
      late: 2,
      total: 30,
      lastActivity: new Date(),
      status: 'active'
    },
    {
      id: 'room-102',
      name: 'Room 102 - Lecture Hall',
      present: 45,
      absent: 5,
      late: 1,
      total: 51,
      lastActivity: new Date(Date.now() - 2 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'room-103',
      name: 'Room 103 - Science Lab',
      present: 18,
      absent: 2,
      late: 0,
      total: 20,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'room-104',
      name: 'Room 104 - Library',
      present: 12,
      absent: 1,
      late: 1,
      total: 14,
      lastActivity: new Date(Date.now() - 10 * 60 * 1000),
      status: 'inactive'
    }
  ]);

  // Trend data state
  const [trends, setTrends] = useState<TrendData[]>([]);

  // Memoize attendance calculations
  const attendanceStats = useMemo(() => {
    const present = students.filter(s => (s.status as string) === 'PRESENT' || (s.status as string) === 'present').length;
    const absent = students.filter(s => (s.status as string) === 'ABSENT' || (s.status as string) === 'absent').length;
    const late = students.filter(s => (s.status as string) === 'LATE' || (s.status as string) === 'late').length;
    const excused = students.filter(s => (s.status as string) === 'EXCUSED' || (s.status as string) === 'excused').length;
    const total = students.length;
    
    return {
      present,
      absent,
      late,
      excused,
      total,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }, [students]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update metrics using memoized calculations
      setMetrics(prev => ({
        ...prev,
        totalStudents: attendanceStats.total,
        presentStudents: attendanceStats.present,
        absentStudents: attendanceStats.absent,
        lateStudents: attendanceStats.late,
        excusedStudents: attendanceStats.excused,
        attendanceRate: attendanceStats.attendanceRate,
        lastUpdate: new Date()
      }));

      setLastRefresh(new Date());
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [attendanceStats, onRefresh]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval * 1000);

    return () => {
      clearInterval(interval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Initialize trend data
  useEffect(() => {
    const generateTrendData = useCallback(() => {
      try {
        const now = new Date();
        const data: TrendData[] = [];
        
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          const present = Math.floor(Math.random() * 20) + 80;
          const absent = Math.floor(Math.random() * 10) + 5;
          const late = Math.floor(Math.random() * 5) + 2;
          const total = present + absent + late;
          
          data.push({
            timestamp: time,
            present,
            absent,
            late,
            total,
            rate: Math.round((present / total) * 100)
          });
        }
        
        setTrends(data);
      } catch (error) {
        console.error('Error generating trend data:', error);
        setError('Failed to generate trend data');
      }
    }, []);

    generateTrendData();
  }, []);

  const handleAlertAction = useCallback((alertId: string, action: string) => {
    try {
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
      
      onAlertAction(alertId, action);
      toast.success(`Alert ${action} successfully`);
    } catch (error) {
      console.error('Error handling alert action:', error);
      toast.error(`Failed to ${action} alert`);
    }
  }, [onAlertAction]);

  // Memoized calculations for better performance
  const unacknowledgedAlerts = useMemo(() => 
    alerts.filter(alert => !alert.acknowledged), 
    [alerts]
  );

  const criticalAlerts = useMemo(() => 
    alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high'), 
    [alerts]
  );

  // Memoize trend calculations
  const trendStats = useMemo(() => {
    if (trends.length === 0) return { peak: 0, lowest: 0, average: 0, current: 0 };
    
    const rates = trends.map(t => t.rate);
    return {
      peak: Math.max(...rates),
      lowest: Math.min(...rates),
      average: Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length),
      current: rates[rates.length - 1] || 0
    };
  }, [trends]);

  const getAlertIcon = useCallback((type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'info': return <Bell className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  }, []);

  const getAlertColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getLocationStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Dashboard</h2>
          <p className="text-gray-600">Live attendance tracking and system monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                setShowDetails(!showDetails);
              } catch (error) {
                console.error('Error toggling details:', error);
                toast.error('Failed to toggle details');
              }
            }}
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-red-700">
                    Immediate attention required
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('alerts')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                View Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-4">
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.presentStudents}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-4">
                  <Progress 
                    value={metrics.totalStudents > 0 ? (metrics.presentStudents / metrics.totalStudents) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.attendanceRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-4">
                  <Progress value={metrics.attendanceRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">RFID Readers</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.activeRFIDReaders}/{metrics.totalRFIDReaders}</p>
                  </div>
                  <Wifi className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-4">
                  <Progress 
                    value={metrics.totalRFIDReaders > 0 ? (metrics.activeRFIDReaders / metrics.totalRFIDReaders) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Present</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metrics.presentStudents}</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {metrics.totalStudents > 0 ? Math.round((metrics.presentStudents / metrics.totalStudents) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Absent</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metrics.absentStudents}</span>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        {metrics.totalStudents > 0 ? Math.round((metrics.absentStudents / metrics.totalStudents) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Late</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metrics.lateStudents}</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {metrics.totalStudents > 0 ? Math.round((metrics.lateStudents / metrics.totalStudents) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Excused</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metrics.excusedStudents}</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {metrics.totalStudents > 0 ? Math.round((metrics.excusedStudents / metrics.totalStudents) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Server</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RFID System</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Student check-in: Room 101</span>
                    <span className="text-gray-500">2 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Late arrival: Room 102</span>
                    <span className="text-gray-500">5 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>RFID reader reconnected</span>
                    <span className="text-gray-500">8 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Attendance report generated</span>
                    <span className="text-gray-500">15 min ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map(location => (
              <Card 
                key={location.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  try {
                    onLocationClick(location.id);
                  } catch (error) {
                    console.error('Error handling location click:', error);
                    toast.error('Failed to load location details');
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <Badge className={getLocationStatusColor(location.status)}>
                      {location.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{location.present}</p>
                      <p className="text-sm text-gray-600">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{location.absent}</p>
                      <p className="text-sm text-gray-600">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{location.late}</p>
                      <p className="text-sm text-gray-600">Late</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Attendance Rate</span>
                      <span className="font-medium">
                        {location.total > 0 ? Math.round(((location.present + location.late) / location.total) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={location.total > 0 ? ((location.present + location.late) / location.total) * 100 : 0} 
                      className="h-2" 
                    />
                    <p className="text-xs text-gray-500">
                      Last activity: {location.lastActivity.toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>24-Hour Attendance Trends</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {trends.map((trend, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${(trend.rate / 100) * 200}px`,
                        minHeight: '4px'
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">
                      {trend.timestamp.getHours()}:00
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium">Peak Attendance</p>
                  <p className="text-lg font-bold text-green-600">
                    {trendStats.peak}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Lowest Attendance</p>
                  <p className="text-lg font-bold text-red-600">
                    {trendStats.lowest}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Average</p>
                  <p className="text-lg font-bold text-blue-600">
                    {trendStats.average}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current</p>
                  <p className="text-lg font-bold text-purple-600">
                    {trendStats.current}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Alerts</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
                    toast.success('All alerts acknowledged');
                  } catch (error) {
                    console.error('Error acknowledging all alerts:', error);
                    toast.error('Failed to acknowledge all alerts');
                  }
                }}
              >
                Acknowledge All
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${alert.acknowledged ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getAlertColor(alert.severity)}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge className={getAlertColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="destructive">Action Required</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.actionRequired && (
                        <Button
                          size="sm"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
                <p className="text-gray-600">All systems are running smoothly.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 