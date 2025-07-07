"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Filter, Plus, Eye, Pencil, Trash2, Shield, Key, Mail, Phone, 
  Users, UserCheck, UserX, AlertTriangle, CheckCircle, Clock, Settings,
  Download, Upload, RefreshCw, Lock, Unlock, Send, FileText, History,
  Home, ChevronRight, Building, User, School, GraduationCap, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Types and interfaces
interface StudentUser {
  // User Account Data
  userId: number;
  userName: string;
  email: string;
  role: 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'BLOCKED';
  lastLogin?: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Student Profile Data
  studentId: number;
  studentIdNum: string;
  rfidTag: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  phoneNumber: string;
  address: string;
  img?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate?: Date;
  nationality?: string;
  studentType: 'REGULAR' | 'IRREGULAR';
  yearLevel: 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR';
  courseId?: number;
  departmentId?: number;
  guardianId: number;
  
  // Related Data
  courseName?: string;
  departmentName?: string;
  guardianName?: string;
  guardianContact?: string;
  
  // Analytics
  totalSubjects: number;
  totalAttendance: number;
  attendanceRate?: number;
}

interface UserFilters {
  status: string[];
  yearLevel: string[];
  department: string[];
  course: string[];
  studentType: string[];
  verificationStatus: string[];
  loginActivity: string[];
}

// Mock data
const mockStudentUsers: StudentUser[] = [
  {
    userId: 1,
    userName: 'alice.johnson',
    email: 'alice.johnson@student.icct.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    failedLoginAttempts: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    studentId: 1,
    studentIdNum: '2024-00001',
    rfidTag: 'RFID001',
    firstName: 'Alice',
    lastName: 'Johnson',
    phoneNumber: '+63917123456',
    address: '123 Main St, Manila',
    gender: 'FEMALE',
    birthDate: new Date('2005-03-15'),
    nationality: 'Filipino',
    studentType: 'REGULAR',
    yearLevel: 'SECOND_YEAR',
    courseId: 1,
    departmentId: 1,
    guardianId: 1,
    courseName: 'BS Computer Science',
    departmentName: 'Computer Science',
    guardianName: 'Maria Johnson',
    guardianContact: '+63917123457',
    totalSubjects: 8,
    totalAttendance: 85,
    attendanceRate: 92.5
  },
  {
    userId: 2,
    userName: 'bob.smith',
    email: 'bob.smith@student.icct.edu',
    role: 'STUDENT',
    status: 'SUSPENDED',
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastPasswordChange: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    failedLoginAttempts: 3,
    isEmailVerified: true,
    isPhoneVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    studentId: 2,
    studentIdNum: '2024-00002',
    rfidTag: 'RFID002',
    firstName: 'Bob',
    middleName: 'A',
    lastName: 'Smith',
    phoneNumber: '+63917123458',
    address: '456 Oak Ave, Quezon City',
    gender: 'MALE',
    birthDate: new Date('2004-07-22'),
    nationality: 'Filipino',
    studentType: 'IRREGULAR',
    yearLevel: 'THIRD_YEAR',
    courseId: 2,
    departmentId: 1,
    guardianId: 2,
    courseName: 'BS Information Technology',
    departmentName: 'Computer Science',
    guardianName: 'John Smith',
    guardianContact: '+63917123459',
    totalSubjects: 6,
    totalAttendance: 45,
    attendanceRate: 75.0
  },
  {
    userId: 3,
    userName: 'carol.davis',
    email: 'carol.davis@student.icct.edu',
    role: 'STUDENT',
    status: 'PENDING',
    lastLogin: undefined,
    lastPasswordChange: undefined,
    failedLoginAttempts: 0,
    isEmailVerified: false,
    isPhoneVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    studentId: 3,
    studentIdNum: '2024-00003',
    rfidTag: 'RFID003',
    firstName: 'Carol',
    lastName: 'Davis',
    phoneNumber: '+63917123460',
    address: '789 Pine St, Makati',
    gender: 'FEMALE',
    birthDate: new Date('2005-11-08'),
    nationality: 'Filipino',
    studentType: 'REGULAR',
    yearLevel: 'FIRST_YEAR',
    courseId: 1,
    departmentId: 1,
    guardianId: 3,
    courseName: 'BS Computer Science',
    departmentName: 'Computer Science',
    guardianName: 'Linda Davis',
    guardianContact: '+63917123461',
    totalSubjects: 0,
    totalAttendance: 0,
    attendanceRate: 0
  }
];

export default function UserManagementStudentsPage() {
  const [students, setStudents] = useState<StudentUser[]>(mockStudentUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    status: [],
    yearLevel: [],
    department: [],
    course: [],
    studentType: [],
    verificationStatus: [],
    loginActivity: []
  });
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Filter and search logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchQuery || 
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentIdNum.includes(searchQuery);

      const matchesStatus = filters.status.length === 0 || filters.status.includes(student.status);
      const matchesYearLevel = filters.yearLevel.length === 0 || filters.yearLevel.includes(student.yearLevel);
      const matchesDepartment = filters.department.length === 0 || filters.department.includes(student.departmentName || '');
      const matchesCourse = filters.course.length === 0 || filters.course.includes(student.courseName || '');
      const matchesStudentType = filters.studentType.length === 0 || filters.studentType.includes(student.studentType);
      
      let matchesVerification = filters.verificationStatus.length === 0;
      if (filters.verificationStatus.includes('verified') && student.isEmailVerified && student.isPhoneVerified) matchesVerification = true;
      if (filters.verificationStatus.includes('partial') && (student.isEmailVerified || student.isPhoneVerified) && !(student.isEmailVerified && student.isPhoneVerified)) matchesVerification = true;
      if (filters.verificationStatus.includes('unverified') && !student.isEmailVerified && !student.isPhoneVerified) matchesVerification = true;
      
      let matchesLogin = filters.loginActivity.length === 0;
      if (filters.loginActivity.includes('recent') && student.lastLogin && (Date.now() - student.lastLogin.getTime()) < 7 * 24 * 60 * 60 * 1000) matchesLogin = true;
      if (filters.loginActivity.includes('inactive') && (!student.lastLogin || (Date.now() - student.lastLogin.getTime()) > 30 * 24 * 60 * 60 * 1000)) matchesLogin = true;
      if (filters.loginActivity.includes('never') && !student.lastLogin) matchesLogin = true;

      return matchesSearch && matchesStatus && matchesYearLevel && matchesDepartment && 
             matchesCourse && matchesStudentType && matchesVerification && matchesLogin;
    });
  }, [students, searchQuery, filters]);

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  const executeBulkAction = () => {
    const selectedStudentData = students.filter(s => selectedStudents.includes(s.userId));
    
    switch (bulkAction) {
      case 'activate':
        toast.success(`Activated ${selectedStudents.length} student accounts`);
        break;
      case 'deactivate':
        toast.success(`Deactivated ${selectedStudents.length} student accounts`);
        break;
      case 'reset_password':
        toast.success(`Password reset emails sent to ${selectedStudents.length} students`);
        break;
      case 'enable_2fa':
        toast.success(`2FA enabled for ${selectedStudents.length} student accounts`);
        break;
      case 'send_credentials':
        toast.success(`Login credentials sent to ${selectedStudents.length} students`);
        break;
    }
    
    setSelectedStudents([]);
    setShowBulkActionModal(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': 'default',
      'INACTIVE': 'secondary',
      'SUSPENDED': 'destructive',
      'PENDING': 'outline',
      'BLOCKED': 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const getVerificationStatus = (student: StudentUser) => {
    if (student.isEmailVerified && student.isPhoneVerified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    } else if (student.isEmailVerified || student.isPhoneVerified) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Unverified</Badge>;
    }
  };

  const formatLastLogin = (lastLogin?: Date) => {
    if (!lastLogin) return 'Never';
    const days = Math.floor((Date.now() - lastLogin.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-[#1e40af] via-[#1e40af] to-[#3b82f6] rounded-3xl border-0 shadow-xl mb-8 relative overflow-hidden">
          <CardContent className="p-8 border-0">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
            </div>
            
            <nav className="flex items-center text-sm text-blue-200 mb-6 relative z-10">
              <div className="flex items-center gap-2 bg-blue-800/30 rounded-lg px-3 py-2 backdrop-blur-sm border border-blue-700/30">
                <Home className="h-4 w-4 text-blue-300" />
                <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
                <span className="text-blue-200">Dashboard</span>
                <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
                <span className="text-blue-200">User Management</span>
                <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
                <span className="text-white font-medium bg-blue-600 px-2 py-1 rounded-md">Students</span>
              </div>
            </nav>

            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                      Student User Management
                    </h1>
                    <p className="text-blue-200 text-lg leading-relaxed">
                      Manage student user accounts, credentials, and access controls with comprehensive security features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-blue-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-1 items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-blue-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student User
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedStudents.length} student(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                      <UserX className="w-4 h-4 mr-1" />
                      Deactivate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('reset_password')}>
                      <Key className="w-4 h-4 mr-1" />
                      Reset Password
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('send_credentials')}>
                      <Send className="w-4 h-4 mr-1" />
                      Send Credentials
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === filteredStudents.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents(filteredStudents.map(s => s.userId));
                          } else {
                            setSelectedStudents([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>User Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Academic Info</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.userId} className="hover:bg-blue-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.userId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.userId]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.userId));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={student.img} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-gray-500">{student.studentIdNum}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.userName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(student.status)}
                          {student.failedLoginAttempts > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              {student.failedLoginAttempts} failed attempts
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVerificationStatus(student)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatLastLogin(student.lastLogin)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{student.yearLevel.replace('_', ' ')}</div>
                          <div className="text-gray-500">{student.courseName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowPasswordModal(true);
                            }}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <div className="text-2xl font-bold text-blue-900 mb-3">No students found</div>
                <div className="text-blue-600 mb-6 max-w-md mx-auto">
                  Try adjusting your search criteria or filters to find the students you're looking for.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student User Details</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      User Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Username</Label>
                        <div className="font-medium">{selectedStudent.userName}</div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="font-medium">{selectedStudent.email}</div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div>{getStatusBadge(selectedStudent.status)}</div>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <div className="font-medium">{selectedStudent.role}</div>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <div className="font-medium">{selectedStudent.createdAt.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <Label>Last Updated</Label>
                        <div className="font-medium">{selectedStudent.updatedAt.toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Student Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Student ID</Label>
                        <div className="font-medium">{selectedStudent.studentIdNum}</div>
                      </div>
                      <div>
                        <Label>RFID Tag</Label>
                        <div className="font-medium">{selectedStudent.rfidTag}</div>
                      </div>
                      <div>
                        <Label>Full Name</Label>
                        <div className="font-medium">
                          {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.lastName} {selectedStudent.suffix}
                        </div>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <div className="font-medium">{selectedStudent.phoneNumber}</div>
                      </div>
                      <div>
                        <Label>Course</Label>
                        <div className="font-medium">{selectedStudent.courseName}</div>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <div className="font-medium">{selectedStudent.departmentName}</div>
                      </div>
                      <div>
                        <Label>Year Level</Label>
                        <div className="font-medium">{selectedStudent.yearLevel.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <Label>Student Type</Label>
                        <div className="font-medium">{selectedStudent.studentType}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email Verification</Label>
                        <div className="flex items-center gap-2">
                          {selectedStudent.isEmailVerified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800">Unverified</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Phone Verification</Label>
                        <div className="flex items-center gap-2">
                          {selectedStudent.isPhoneVerified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800">Unverified</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <div className="flex items-center gap-2">
                          {selectedStudent.twoFactorEnabled ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Failed Login Attempts</Label>
                        <div className="font-medium">{selectedStudent.failedLoginAttempts}</div>
                      </div>
                      <div>
                        <Label>Last Password Change</Label>
                        <div className="font-medium">
                          {selectedStudent.lastPasswordChange ? 
                            selectedStudent.lastPasswordChange.toLocaleDateString() : 
                            'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Login Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label>Last Login</Label>
                      <div className="font-medium">{formatLastLogin(selectedStudent.lastLogin)}</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Password Management Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button className="w-full" variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Send Temporary Password
              </Button>
              <Button className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Force Password Change on Next Login
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Modal */}
      <Dialog open={showBulkActionModal} onOpenChange={setShowBulkActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to perform this action on {selectedStudents.length} selected student(s)?</p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium">Action: {bulkAction.replace('_', ' ')}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActionModal(false)}>
              Cancel
            </Button>
            <Button onClick={executeBulkAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 