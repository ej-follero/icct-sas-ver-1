"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Users, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Building,
  BookOpen,
  Wifi,
  Activity,
  Mail,
  Bell,
  Home,
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import ReportGenerator from "@/components/ReportGenerator";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { useSocketIO } from '@/hooks/useSocketIO';
import { config, apiEndpoints } from '@/lib/config';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'attendance' | 'academic' | 'system' | 'communication';
  data: any[];
  columns: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'percentage' | 'status';
    format?: (value: any) => string;
  }[];
  exportFormats: ('csv' | 'pdf' | 'excel')[];
}


interface SummaryData {
  totalReports: number;
  generatedToday: number;
  activeUsers: number;
  systemStatus: string;
}

// Socket.IO configuration
const SOCKET_CONFIG = {
  url: config.socketUrl,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
};

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('attendance');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Report data states
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [instructorData, setInstructorData] = useState<any[]>([]);
  const [rfidData, setRfidData] = useState<any[]>([]);
  const [communicationData, setCommunicationData] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  
  // Recent reports states
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  
  // Real-time updates
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [websocketError, setWebsocketError] = useState(false);
  
  // Socket.IO connection for real-time updates
  const { isConnected, on, off, emit, error: socketError } = useSocketIO(SOCKET_CONFIG);

  const categories = [
    { id: 'attendance', label: 'Attendance', icon: <Users className="h-4 w-4" /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'system', label: 'System', icon: <Activity className="h-4 w-4" /> },
    { id: 'communication', label: 'Communication', icon: <Bell className="h-4 w-4" /> }
  ];

  // Create report templates with real data
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'student-attendance',
      title: 'Student Attendance Report',
      description: 'Comprehensive attendance records for all students',
      icon: <Users className="h-5 w-5" />,
      category: 'attendance',
      data: attendanceData,
      columns: [
        { key: 'studentName', label: 'Student Name' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'department', label: 'Department' },
        { key: 'course', label: 'Course' },
        { key: 'yearLevel', label: 'Year Level' },
        { key: 'attendanceRate', label: 'Attendance Rate', type: 'percentage', format: (value) => `${value}%` },
        { key: 'presentDays', label: 'Present Days', type: 'number' },
        { key: 'lateDays', label: 'Late Days', type: 'number' },
        { key: 'absentDays', label: 'Absent Days', type: 'number' },
        { key: 'totalDays', label: 'Total Days', type: 'number' },
        { key: 'lastAttendance', label: 'Last Attendance', type: 'date' }
      ],
      exportFormats: ['csv', 'pdf', 'excel']
    },
    {
      id: 'instructor-attendance',
      title: 'Instructor Attendance Report',
      description: 'Attendance and performance records for instructors',
      icon: <UserCheck className="h-5 w-5" />,
      category: 'attendance',
      data: instructorData,
      columns: [
        { key: 'instructorName', label: 'Instructor Name' },
        { key: 'department', label: 'Department' },
        { key: 'subject', label: 'Subject' },
        { key: 'totalClasses', label: 'Total Classes', type: 'number' },
        { key: 'onTimeClasses', label: 'On Time', type: 'number' },
        { key: 'lateClasses', label: 'Late', type: 'number' },
        { key: 'absentClasses', label: 'Absent', type: 'number' },
        { key: 'attendanceRate', label: 'Attendance Rate', type: 'percentage', format: (value) => `${value}%` },
        { key: 'lastClass', label: 'Last Class', type: 'date' }
      ],
      exportFormats: ['csv', 'pdf', 'excel']
    },
    {
      id: 'rfid-logs',
      title: 'RFID Access Logs',
      description: 'Detailed RFID tag access and movement logs',
      icon: <Wifi className="h-5 w-5" />,
      category: 'system',
      data: rfidData,
      columns: [
        { key: 'tagId', label: 'Tag ID' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'location', label: 'Location' },
        { key: 'timeIn', label: 'Time In' },
        { key: 'timeOut', label: 'Time Out' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'status', label: 'Status', type: 'status' }
      ],
      exportFormats: ['csv', 'pdf']
    },
    {
      id: 'communication-logs',
      title: 'Communication Logs',
      description: 'Records of all communications and notifications',
      icon: <Mail className="h-5 w-5" />,
      category: 'communication',
      data: communicationData,
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'sender', label: 'Sender' },
        { key: 'recipients', label: 'Recipients' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'readCount', label: 'Read Count', type: 'number' }
      ],
      exportFormats: ['csv', 'pdf']
    }
  ];

  // Fetch report data based on category
  const fetchReportData = async (category: string) => {
    try {
      setReportsLoading(true);
      setReportsError(null);
      
      switch (category) {
        case 'attendance':
          // Fetch both student and instructor data
          const [studentResponse, instructorResponse] = await Promise.all([
            fetch(apiEndpoints.reports.attendance('students')),
            fetch(apiEndpoints.reports.attendance('instructors'))
          ]);
          
          const studentResult = await studentResponse.json();
          const instructorResult = await instructorResponse.json();
          
          if (studentResult.success) setAttendanceData(studentResult.data);
          if (instructorResult.success) setInstructorData(instructorResult.data);
          break;
          
        case 'system':
          const rfidResponse = await fetch(apiEndpoints.reports.rfidLogs);
          const rfidResult = await rfidResponse.json();
          if (rfidResult.success) setRfidData(rfidResult.data);
          break;
          
        case 'communication':
          const commResponse = await fetch(apiEndpoints.reports.communication);
          const commResult = await commResponse.json();
          if (commResult.success) setCommunicationData(commResult.data);
          break;
      }
    } catch (err) {
      setReportsError('Failed to fetch report data');
      console.error('Error fetching report data:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const filteredReports = reportTemplates.filter(report => report.category === selectedCategory);

  // Handle report generation from child ReportGenerator and refresh recents
  const handleGenerateForTemplate = async (report: ReportTemplate, cfg: any) => {
    try {
      const mapTitleToReportType = (title: string): string => {
        const t = title.toLowerCase();
        if (t.includes('student') && t.includes('attendance')) return 'STUDENT_ATTENDANCE';
        if (t.includes('instructor') && t.includes('attendance')) return 'INSTRUCTOR_ATTENDANCE';
        if (t.includes('attendance') && t.includes('summary')) return 'ATTENDANCE_SUMMARY';
        if (t.includes('rfid')) return 'RFID_ACTIVITY';
        if (t.includes('system')) return 'SYSTEM_ACTIVITY';
        if (t.includes('department')) return 'DEPARTMENT_ATTENDANCE';
        if (t.includes('course')) return 'COURSE_ATTENDANCE';
        return 'CUSTOM';
      };

      // Filter data and columns based on dialog config
      const filteredColumns = report.columns.filter(col => cfg.columns.includes(col.key));
      const filteredData = (report.data || []).map((item) => {
        const obj: Record<string, any> = {};
        cfg.columns.forEach((key: string) => { obj[key] = item[key]; });
        return obj;
      });

      const res = await fetch(apiEndpoints.reports.generate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: mapTitleToReportType(report.title),
          reportName: `${report.title} Report`,
          data: filteredData,
          columns: filteredColumns,
          format: cfg.format,
          userId: 1
        })
      });

      const result = await res.json();
      if (result?.success && result?.data?.downloadUrl) {
        // Open download, then refresh recent and summary
        window.open(result.data.downloadUrl, '_blank');
        await Promise.all([
          fetchRecentReports(),
          (async () => {
            try {
              const sRes = await fetch(apiEndpoints.reports.summary);
              const sJson = await sRes.json();
              if (sJson.success) setSummaryData(sJson.data);
            } catch {}
          })()
        ]);
        setLastUpdate(new Date());
      } else {
        console.error('Report generate failed:', result?.error || 'Unknown error');
      }
    } catch (e) {
      console.error('Error generating report:', e);
    }
  };

  // Fetch summary data on component mount
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
      const response = await fetch(apiEndpoints.reports.summary);
        const result = await response.json();
        
        if (result.success) {
          setSummaryData(result.data);
        } else {
          setError(result.error || 'Failed to fetch summary data');
        }
      } catch (err) {
        setError('Network error while fetching summary data');
        console.error('Error fetching summary data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  // Fetch recent reports
  const fetchRecentReports = async () => {
    try {
      setRecentLoading(true);
      setRecentError(null);
      
      const response = await fetch(apiEndpoints.reports.recent(5, 7));
      const result = await response.json();
      
      if (result.success) {
        setRecentReports(result.data);
      } else {
        setRecentError(result.error || 'Failed to fetch recent reports');
      }
    } catch (err) {
      setRecentError('Network error while fetching recent reports');
      console.error('Error fetching recent reports:', err);
    } finally {
      setRecentLoading(false);
    }
  };

  // Fetch report data when category changes
  useEffect(() => {
    fetchReportData(selectedCategory);
  }, [selectedCategory]);

  // Fetch recent reports on component mount
  useEffect(() => {
    fetchRecentReports();
  }, []);

  // Set client flag and initialize lastUpdate
  useEffect(() => {
    setIsClient(true);
    setLastUpdate(new Date());
  }, []);

  // Handle Socket.IO errors
  useEffect(() => {
    if (socketError) {
      setWebsocketError(true);
      console.warn('Socket.IO connection failed, falling back to polling:', socketError);
    }
  }, [socketError]);

  // Real-time updates setup
  useEffect(() => {
    if (!isConnected) return;

    // Join reports room
    emit('join-reports');

    // Subscribe to report updates
    on('report_generated', (data) => {
      console.log('New report generated:', data);
      setLastUpdate(new Date());
      
      // Refresh recent reports if auto-refresh is enabled
      if (autoRefresh) {
        fetchRecentReports();
      }
    });

    // Subscribe to summary updates
    on('summary_update', (data) => {
      console.log('Summary data updated:', data);
      setLastUpdate(new Date());
      
      // Refresh summary data if auto-refresh is enabled
      if (autoRefresh) {
        const fetchSummaryData = async () => {
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(apiEndpoints.reports.summary);
            const result = await response.json();
            
            if (result.success) {
              setSummaryData(result.data);
            } else {
              setError(result.error || 'Failed to fetch summary data');
            }
          } catch (err) {
            setError('Network error while fetching summary data');
            console.error('Error fetching summary data:', err);
          } finally {
            setLoading(false);
          }
        };
        fetchSummaryData();
      }
    });

    // Subscribe to attendance updates
    on('attendance_update', (data) => {
      console.log('Attendance data updated:', data);
      setLastUpdate(new Date());
      
      // Refresh attendance data if auto-refresh is enabled and we're on attendance tab
      if (autoRefresh && selectedCategory === 'attendance') {
        fetchReportData('attendance');
      }
    });

    return () => {
      emit('leave-reports');
      off('report_generated');
      off('summary_update');
      off('attendance_update');
    };
  }, [isConnected, autoRefresh, selectedCategory, on, off, emit]);

  // Auto-refresh interval (fallback if WebSocket is not available)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isConnected || websocketError) {
        // Fallback to polling if WebSocket is not connected
        handleRefresh();
      }
    }, websocketError ? 30000 : 60000); // More frequent polling when WebSocket fails

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, websocketError]);

  // Manual refresh function
  const handleRefresh = async () => {
    setLastUpdate(new Date());
    
    // Refresh summary data
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(apiEndpoints.reports.summary);
      const result = await response.json();
      
      if (result.success) {
        setSummaryData(result.data);
      } else {
        setError(result.error || 'Failed to fetch summary data');
      }
    } catch (err) {
      setError('Network error while fetching summary data');
      console.error('Error fetching summary data:', err);
    } finally {
      setLoading(false);
    }
    
    // Refresh recent reports and current category data
    await Promise.all([
      fetchRecentReports(),
      fetchReportData(selectedCategory)
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] overflow-x-hidden">
      {/* Main container with responsive padding and spacing */}
      <div className="w-full max-w-none px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        
        {/* Page Header - Responsive */}
        <div className="w-full">
          <PageHeader
            title="Report Hub"
            subtitle="Generate and manage comprehensive reports for your institution"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Reports" }
            ]}
          />
          
          {/* Real-time Status Bar */}
          <div className="flex items-center justify-between mt-4 p-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 
                  websocketError ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Socket.IO Connected' : 
                   websocketError ? 'Fallback Mode (Polling)' : 'Socket.IO Disconnected'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {isClient && lastUpdate ? (
                  <>Last updated: {lastUpdate.toLocaleTimeString()}</>
                ) : (
                  <>Last updated: --:--:--</>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs ${autoRefresh ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Now
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards - Enhanced responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mt-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-white rounded-xl shadow-md border-0 p-0">
                <CardContent className="p-5 flex flex-col gap-2 min-h-[120px]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-px bg-gray-200 w-full mb-1" />
                  <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1 mt-1"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Error loading summary data</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Real data
            <>
              <SummaryCard
                label="Total Reports"
                value={summaryData?.totalReports || 0}
                icon={<FileText className="h-5 w-5" />}
                sublabel="Available report templates"
              />
              <SummaryCard
                label="Generated Today"
                value={summaryData?.generatedToday || 0}
                icon={<TrendingUp className="h-5 w-5" />}
                sublabel="Reports created today"
              />
              <SummaryCard
                label="Active Users"
                value={summaryData?.activeUsers || 0}
                icon={<Users className="h-5 w-5" />}
                sublabel="Currently online"
              />
              <SummaryCard
                label="System Status"
                value={summaryData?.systemStatus || 'Unknown'}
                icon={summaryData?.systemStatus === 'Online' ? 
                  <CheckCircle className="h-5 w-5" /> : 
                  <AlertTriangle className="h-5 w-5" />
                }
                sublabel={summaryData?.systemStatus === 'Online' ? '99.9% uptime' : 'Issues detected'}
              />
            </>
          )}
        </div>

        {/* Category Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <div className="p-4 border-b border-blue-200/50">
                <TabsList className="grid w-full grid-cols-4 bg-blue-50/80 rounded-xl p-1">
                  {categories.map(category => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id} 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-blue-700 data-[state=inactive]:hover:bg-blue-100 rounded transition-all duration-200"
                    >
                      {category.icon}
                      <span className="hidden sm:inline">{category.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                {reportsLoading ? (
                  // Loading state for reports
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-blue-600 font-medium">Loading report data...</span>
                    </div>
                  </div>
                ) : reportsError ? (
                  // Error state for reports
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
                      <p className="text-gray-600 mb-4">{reportsError}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => fetchReportData(selectedCategory)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Report templates
                  categories.map(category => (
                    <TabsContent key={category.id} value={category.id} className="space-y-4 sm:space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredReports.map(report => (
                          <ReportGenerator
                            key={report.id}
                            title={report.title}
                            description={report.description}
                            data={report.data}
                            columns={report.columns}
                            exportFormats={report.exportFormats}
                            onGenerate={(cfg) => handleGenerateForTemplate(report, cfg)}
                            className="h-full"
                          />
                        ))}
                      </div>
                    </TabsContent>
                  ))
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5 text-blue-600" />
              Recently Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              // Loading state for recent reports
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center"></div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentError ? (
              // Error state for recent reports
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Recent Reports</h3>
                <p className="text-gray-600 mb-4">{recentError}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchRecentReports}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Try Again
                </Button>
              </div>
            ) : recentReports.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Reports</h3>
                <p className="text-gray-600">No reports have been generated in the last 7 days.</p>
              </div>
            ) : (
              // Recent reports list
              <div className="space-y-3">
                {recentReports.map((report, index) => (
                  <div key={report.id || index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{report.name}</p>
                        <p className="text-sm text-blue-600">
                          {report.date} • {report.format}
                          {report.generatedBy && ` • by ${report.generatedBy}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${
                          report.status === 'Completed' 
                            ? 'text-green-700 border-green-200 bg-green-50' 
                            : 'text-yellow-700 border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        {report.status}
                      </Badge>
                      {report.downloadUrl ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-blue-50"
                          onClick={() => window.open(report.downloadUrl, '_blank')}
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 