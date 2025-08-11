"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock,
  FileText, 
  Users, 
  BarChart3, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Mail,
  Download,
  Settings,
  Eye,
  RefreshCw,
  XCircle
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import PageHeader from "@/components/PageHeader/PageHeader";

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  reportType: 'attendance' | 'academic' | 'system' | 'communication';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  nextRun: string;
  runCount: number;
  createdBy: string;
  createdAt: string;
}

const mockScheduledReports: ScheduledReport[] = [
  {
    id: 'SCH001',
    name: 'Daily Student Attendance Summary',
    description: 'Daily summary of student attendance rates and absentees',
    reportType: 'attendance',
    frequency: 'daily',
    schedule: 'Every day at 8:00 AM',
    recipients: ['principal@icct.edu', 'registrar@icct.edu'],
    format: 'pdf',
    status: 'active',
    lastRun: '2024-01-15 08:00:00',
    nextRun: '2024-01-16 08:00:00',
    runCount: 95,
    createdBy: 'Admin User',
    createdAt: '2023-10-01'
  },
  {
    id: 'SCH002',
    name: 'Weekly Instructor Performance Report',
    description: 'Weekly analysis of instructor attendance and performance metrics',
    reportType: 'attendance',
    frequency: 'weekly',
    schedule: 'Every Monday at 9:00 AM',
    recipients: ['hr@icct.edu', 'dean@icct.edu'],
    format: 'excel',
    status: 'active',
    lastRun: '2024-01-15 09:00:00',
    nextRun: '2024-01-22 09:00:00',
    runCount: 14,
    createdBy: 'HR Manager',
    createdAt: '2023-11-01'
  },
  {
    id: 'SCH003',
    name: 'Monthly Compliance Report',
    description: 'Monthly attendance compliance and regulatory reporting',
    reportType: 'attendance',
    frequency: 'monthly',
    schedule: 'First day of month at 7:00 AM',
    recipients: ['compliance@icct.edu', 'administration@icct.edu'],
    format: 'pdf',
    status: 'active',
    lastRun: '2024-01-01 07:00:00',
    nextRun: '2024-02-01 07:00:00',
    runCount: 4,
    createdBy: 'Compliance Officer',
    createdAt: '2023-09-01'
  },
  {
    id: 'SCH004',
    name: 'System Health Weekly Report',
    description: 'Weekly system performance and health monitoring report',
    reportType: 'system',
    frequency: 'weekly',
    schedule: 'Every Sunday at 11:00 PM',
    recipients: ['it@icct.edu', 'admin@icct.edu'],
    format: 'csv',
    status: 'paused',
    lastRun: '2024-01-07 23:00:00',
    nextRun: '2024-01-21 23:00:00',
    runCount: 8,
    createdBy: 'IT Administrator',
    createdAt: '2023-12-01'
  },
  {
    id: 'SCH005',
    name: 'Student Risk Assessment Report',
    description: 'Weekly report on students at risk due to poor attendance',
    reportType: 'attendance',
    frequency: 'weekly',
    schedule: 'Every Friday at 3:00 PM',
    recipients: ['counselor@icct.edu', 'registrar@icct.edu'],
    format: 'excel',
    status: 'error',
    lastRun: '2024-01-12 15:00:00',
    nextRun: '2024-01-19 15:00:00',
    runCount: 12,
    createdBy: 'Student Counselor',
    createdAt: '2023-11-15'
  }
];

export default function ScheduledReportsPage() {
  const [selectedTab, setSelectedTab] = useState('active');
  const [reports, setReports] = useState(mockScheduledReports);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="w-3 h-3" /> },
      error: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={config.color}>
        {config.icon}
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-purple-100 text-purple-800',
      monthly: 'bg-indigo-100 text-indigo-800',
      quarterly: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[frequency as keyof typeof colors]}>
        <Clock className="w-3 h-3 mr-1" />
        {frequency}
      </Badge>
    );
  };

  const getReportTypeIcon = (type: string) => {
    const icons = {
      attendance: <Users className="w-4 h-4" />,
      academic: <BarChart3 className="w-4 h-4" />,
      system: <Activity className="w-4 h-4" />,
      communication: <Mail className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <FileText className="w-4 h-4" />;
  };

  const filteredReports = reports.filter(report => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'active') return report.status === 'active';
    if (selectedTab === 'paused') return report.status === 'paused';
    if (selectedTab === 'error') return report.status === 'error';
    return true;
  });

  const handleToggleStatus = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
        : report
    ));
  };

  const handleRunNow = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      alert(`Running report: ${report.name}`);
      // Update last run time
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, lastRun: new Date().toISOString(), runCount: r.runCount + 1 }
          : r
      ));
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      setReports(prev => prev.filter(report => report.id !== reportId));
    }
  };

  const getReportStats = () => {
    const active = reports.filter(r => r.status === 'active').length;
    const paused = reports.filter(r => r.status === 'paused').length;
    const error = reports.filter(r => r.status === 'error').length;
    const total = reports.length;

    return { active, paused, error, total };
  };

  const stats = getReportStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Scheduled Reports"
        subtitle="Manage automated report generation and delivery schedules"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Reports', href: '/reports' },
          { label: 'Scheduled Reports' }
        ]}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Scheduled</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Reports</p>
                <p className="text-2xl font-bold text-green-800">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paused Reports</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.paused}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Reports</p>
                <p className="text-2xl font-bold text-red-800">{stats.error}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Scheduled Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Reports ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({stats.paused})</TabsTrigger>
              <TabsTrigger value="error">Errors ({stats.error})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getReportTypeIcon(report.reportType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{report.name}</h3>
                              {getStatusBadge(report.status)}
                              {getFrequencyBadge(report.frequency)}
                            </div>
                            <p className="text-gray-600 mb-3">{report.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Schedule:</span>
                                <p className="text-gray-600">{report.schedule}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Next Run:</span>
                                <p className="text-gray-600">{new Date(report.nextRun).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Recipients:</span>
                                <p className="text-gray-600">{report.recipients.length} recipient(s)</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Run Count:</span>
                                <p className="text-gray-600">{report.runCount} times</p>
                              </div>
                            </div>

                            {report.lastRun && (
                              <div className="mt-3 text-sm">
                                <span className="font-medium text-gray-700">Last Run:</span>
                                <span className="text-gray-600 ml-2">{new Date(report.lastRun).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunNow(report.id)}
                            className="flex items-center gap-1"
                          >
                            <Play className="w-4 h-4" />
                            Run Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(report.id)}
                            className="flex items-center gap-1"
                          >
                            {report.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Resume
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredReports.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h3>
                    <p className="text-gray-600 mb-4">
                      {selectedTab === 'all' 
                        ? 'You haven\'t created any scheduled reports yet.'
                        : `No ${selectedTab} reports found.`
                      }
                    </p>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Your First Scheduled Report
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
