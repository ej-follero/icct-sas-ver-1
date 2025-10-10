"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Users, 
  UserCheck,
  Calendar, 
  BarChart3, 
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
  School,
  Activity,
  Filter,
  RefreshCw,
  Eye,
  Printer
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import ReportGenerator from "@/components/ReportGenerator";
import PageHeader from "@/components/PageHeader/PageHeader";

interface AttendanceReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'student' | 'summary' | 'compliance';
  data: any[];
  columns: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'percentage' | 'status';
    format?: (value: any) => string;
  }[];
  exportFormats: ('csv' | 'pdf' | 'excel')[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'on-demand';
}

const mockStudentAttendanceData = [
  {
    studentId: 'STU001',
    studentName: 'John Doe',
    department: 'Computer Science',
    yearLevel: '3rd Year',
    totalClasses: 120,
    attendedClasses: 108,
    absentClasses: 12,
    lateClasses: 8,
    attendanceRate: 90,
    riskLevel: 'Low',
    lastAttendance: '2024-01-15',
    parentNotified: 'Yes'
  },
  {
    studentId: 'STU002',
    studentName: 'Jane Smith',
    department: 'Information Technology',
    yearLevel: '2nd Year',
    totalClasses: 115,
    attendedClasses: 98,
    absentClasses: 17,
    lateClasses: 5,
    attendanceRate: 85.2,
    riskLevel: 'Medium',
    lastAttendance: '2024-01-14',
    parentNotified: 'Yes'
  },
  {
    studentId: 'STU003',
    studentName: 'Mike Johnson',
    department: 'Computer Science',
    yearLevel: '1st Year',
    totalClasses: 100,
    attendedClasses: 75,
    absentClasses: 25,
    lateClasses: 10,
    attendanceRate: 75,
    riskLevel: 'High',
    lastAttendance: '2024-01-10',
    parentNotified: 'Yes'
  }
];

// Instructor attendance mock removed

const attendanceReportTemplates: AttendanceReportTemplate[] = [
  {
    id: 'student-attendance-detailed',
    title: 'Student Attendance Report',
    description: 'Comprehensive student attendance analysis with risk assessment',
    icon: <Users className="h-5 w-5" />,
    category: 'student',
    data: mockStudentAttendanceData,
    frequency: 'weekly',
    columns: [
      { key: 'studentId', label: 'Student ID' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'department', label: 'Department' },
      { key: 'yearLevel', label: 'Year Level' },
      { key: 'totalClasses', label: 'Total Classes', type: 'number' },
      { key: 'attendedClasses', label: 'Attended', type: 'number' },
      { key: 'absentClasses', label: 'Absent', type: 'number' },
      { key: 'lateClasses', label: 'Late', type: 'number' },
      { key: 'attendanceRate', label: 'Attendance Rate', type: 'percentage' },
      { key: 'riskLevel', label: 'Risk Level', type: 'status' },
      { key: 'lastAttendance', label: 'Last Attendance', type: 'date' },
      { key: 'parentNotified', label: 'Parent Notified', type: 'status' }
    ],
    exportFormats: ['csv', 'pdf', 'excel']
  },
  // Instructor attendance report removed
  {
    id: 'attendance-summary',
    title: 'Attendance Summary Report',
    description: 'High-level attendance statistics and trends',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'summary',
    data: [
      {
        metric: 'Overall Student Attendance Rate',
        value: '87.2%',
        trend: '+2.1%',
        status: 'Good'
      },
      {
        metric: 'Overall Instructor Attendance Rate',
        value: '94.1%',
        trend: '+0.5%',
        status: 'Excellent'
      },
      {
        metric: 'Students at Risk (Below 75%)',
        value: '23',
        trend: '-5',
        status: 'Improving'
      },
      {
        metric: 'Total Absent Students Today',
        value: '45',
        trend: '+8',
        status: 'Warning'
      }
    ],
    frequency: 'daily',
    columns: [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
      { key: 'trend', label: 'Trend' },
      { key: 'status', label: 'Status', type: 'status' }
    ],
    exportFormats: ['csv', 'pdf']
  },
  {
    id: 'compliance-report',
    title: 'Attendance Compliance Report',
    description: 'Regulatory compliance and policy adherence tracking',
    icon: <CheckCircle className="h-5 w-5" />,
    category: 'compliance',
    data: [
      {
        policy: 'Minimum 75% Attendance',
        compliantStudents: 287,
        nonCompliantStudents: 23,
        complianceRate: 92.6,
        status: 'Good'
      },
      {
        policy: 'Instructor Attendance (90%+)',
        compliantInstructors: 18,
        nonCompliantInstructors: 2,
        complianceRate: 90,
        status: 'Good'
      },
      {
        policy: 'Parent Notification (3+ Absences)',
        notificationsSent: 45,
        pendingNotifications: 3,
        complianceRate: 93.8,
        status: 'Excellent'
      }
    ],
    frequency: 'monthly',
    columns: [
      { key: 'policy', label: 'Policy' },
      { key: 'compliantStudents', label: 'Compliant', type: 'number' },
      { key: 'nonCompliantStudents', label: 'Non-Compliant', type: 'number' },
      { key: 'complianceRate', label: 'Compliance Rate', type: 'percentage' },
      { key: 'status', label: 'Status', type: 'status' }
    ],
    exportFormats: ['csv', 'pdf', 'excel']
  }
];

export default function AttendanceReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('student');
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    { id: 'student', label: 'Student Reports', icon: <Users className="h-4 w-4" /> },
    { id: 'summary', label: 'Summary Reports', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'compliance', label: 'Compliance Reports', icon: <CheckCircle className="h-4 w-4" /> }
  ];

  const filteredReports = attendanceReportTemplates.filter(report => report.category === selectedCategory);

  const handleGenerateReport = async (template: AttendanceReportTemplate, config: any) => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Generating ${template.title} with config:`, config);
      alert(`${template.title} generated successfully!`);
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Report generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFrequencyBadge = (frequency?: string) => {
    if (!frequency) return null;
    
    const colors = {
      'daily': 'bg-green-100 text-green-800',
      'weekly': 'bg-blue-100 text-blue-800',
      'monthly': 'bg-purple-100 text-purple-800',
      'on-demand': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[frequency as keyof typeof colors] || colors['on-demand']}>
        <Clock className="w-3 h-3 mr-1" />
        {frequency}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Attendance Reports"
        subtitle="Generate comprehensive attendance reports for students, instructors, and compliance tracking"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Reports', href: '/reports' },
          { label: 'Attendance Reports' }
        ]}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Reports</p>
                <p className="text-2xl font-bold text-blue-800">{attendanceReportTemplates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reports Generated Today</p>
                <p className="text-2xl font-bold text-green-800">8</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled Reports</p>
                <p className="text-2xl font-bold text-yellow-800">3</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Issues</p>
                <p className="text-2xl font-bold text-red-800">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attendance Report Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  {category.icon}
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredReports.map((report) => (
                    <Card key={report.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {report.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{report.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                            </div>
                          </div>
                          {getFrequencyBadge(report.frequency)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Activity className="w-4 h-4" />
                            <span>{report.data.length} records available</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {report.exportFormats.map((format) => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <ReportGenerator
                              title={report.title}
                              description={report.description}
                              data={report.data}
                              columns={report.columns}
                              exportFormats={report.exportFormats}
                              onGenerate={(config) => handleGenerateReport(report, config)}
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh All Data
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
