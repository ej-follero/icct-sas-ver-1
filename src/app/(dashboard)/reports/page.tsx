"use client";

import { useState } from "react";
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
  Bell
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import ReportGenerator from "@/components/ReportGenerator";

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

const mockAttendanceData = [
  {
    id: '1',
    studentName: 'John Doe',
    studentId: '2024-001',
    department: 'Computer Science',
    course: 'BSIT',
    yearLevel: '2nd Year',
    attendanceRate: 95.5,
    presentDays: 19,
    lateDays: 1,
    absentDays: 0,
    totalDays: 20,
    lastAttendance: '2024-01-15'
  },
  {
    id: '2',
    studentName: 'Jane Smith',
    studentId: '2024-002',
    department: 'Computer Science',
    course: 'BSIT',
    yearLevel: '2nd Year',
    attendanceRate: 88.0,
    presentDays: 17,
    lateDays: 2,
    absentDays: 1,
    totalDays: 20,
    lastAttendance: '2024-01-15'
  }
];

const mockInstructorData = [
  {
    id: '1',
    instructorName: 'Dr. Maria Santos',
    department: 'Computer Science',
    subject: 'Programming Fundamentals',
    totalClasses: 45,
    onTimeClasses: 42,
    lateClasses: 2,
    absentClasses: 1,
    attendanceRate: 93.3,
    lastClass: '2024-01-15'
  }
];

const mockRFIDData = [
  {
    id: '1',
    tagId: 'RFID-001',
    studentName: 'John Doe',
    location: 'Room 101',
    timeIn: '08:00 AM',
    timeOut: '05:00 PM',
    date: '2024-01-15',
    status: 'Present'
  }
];

const mockCommunicationData = [
  {
    id: '1',
    type: 'Announcement',
    title: 'Class Suspension',
    sender: 'Admin',
    recipients: 'All Students',
    date: '2024-01-15',
    status: 'Sent',
    readCount: 150
  }
];

const reportTemplates: ReportTemplate[] = [
  {
    id: 'student-attendance',
    title: 'Student Attendance Report',
    description: 'Comprehensive attendance records for all students',
    icon: <Users className="h-5 w-5" />,
    category: 'attendance',
    data: mockAttendanceData,
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
    data: mockInstructorData,
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
    data: mockRFIDData,
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
    data: mockCommunicationData,
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

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('attendance');

  const categories = [
    { id: 'attendance', label: 'Attendance', icon: <Users className="h-4 w-4" /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'system', label: 'System', icon: <Activity className="h-4 w-4" /> },
    { id: 'communication', label: 'Communication', icon: <Bell className="h-4 w-4" /> }
  ];

  const filteredReports = reportTemplates.filter(report => report.category === selectedCategory);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Hub</h1>
          <p className="text-gray-600 mt-1">Generate and manage comprehensive reports for your institution</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Last Updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-blue-800">{reportTemplates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Generated Today</p>
                <p className="text-2xl font-bold text-green-800">12</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-purple-800">1,234</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-orange-800">Online</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.icon}
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map(report => (
                <ReportGenerator
                  key={report.id}
                  title={report.title}
                  description={report.description}
                  data={report.data}
                  columns={report.columns}
                  exportFormats={report.exportFormats}
                  className="h-full"
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Generated Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Student Attendance Report', date: '2024-01-15', format: 'PDF', status: 'Completed' },
              { name: 'RFID Access Logs', date: '2024-01-14', format: 'CSV', status: 'Completed' },
              { name: 'Instructor Performance', date: '2024-01-13', format: 'Excel', status: 'Completed' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-600">{report.date} • {report.format}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    {report.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 