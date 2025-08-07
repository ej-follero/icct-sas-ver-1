"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import { studentsData } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, User, Mail, Phone, MapPin, School, GraduationCap, Calendar, Users, CreditCard, Activity, TrendingUp, AlertCircle, CheckCircle, Clock, UserCheck, UserX, Home, Building, BookOpen, Shield, QrCode, Database, FileText, BarChart3, PieChart, LineChart, Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { QuickActionsPanel, DataOperationsGroup, MoreOptionsGroup } from "@/components/reusable/QuickActionsPanel";

// Define the student schema
const studentSchema = z.object({
  studentId: z.number(),
  studentIdNum: z.string().min(1, "Student ID is required"),
  rfidTag: z.string().min(1, "RFID Tag is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  img: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  studentType: z.enum(["REGULAR", "IRREGULAR"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]),
  courseId: z.number().optional(),
  departmentId: z.number().optional(),
  guardianId: z.number(),
  userId: z.number(),
  section_name: z.string().optional(),
  guardian_name: z.string().optional(),
});

type Student = z.infer<typeof studentSchema>;

// Update the form schema to match the form fields
const studentFormSchema = z.object({
  studentIdNum: z.string().min(1, "Student ID is required"),
  rfidTag: z.string().min(1, "RFID Tag is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  studentType: z.enum(["REGULAR", "IRREGULAR"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]),
  courseId: z.number().optional(),
  departmentId: z.number().optional(),
  guardianId: z.number(),
  userId: z.number(),
  section_name: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

type SortField = 'studentIdNum' | 'rfidTag' | 'name' | 'studentType' | 'section' | 'email' | 'phone';
type SortOrder = 'asc' | 'desc';

export default function StudentsPage() {
  const [students, setStudents] = useState(studentsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudent, setModalStudent] = useState<Student | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    section: "all",
    status: "all",
    course: "all",
    department: "all",
    yearLevel: "all",
    rfidStatus: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRFIDManagement, setShowRFIDManagement] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showAttendanceSummary, setShowAttendanceSummary] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearLevelFilter, setYearLevelFilter] = useState('all');
  const [rfidStatusFilter, setRfidStatusFilter] = useState('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setSortDialogOpen(false);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  async function handleDeleteStudent(id: number) {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      setStudents(students.filter(student => student.studentId !== id));
      toast.success("Student deleted successfully");
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Student ID", "Name", "RFID Tag", "Type", "Email", "Phone", "Section", "Guardian"];
    const csvContent = [
      headers.join(","),
      ...students.map(student => [
        student.studentIdNum,
        `${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}`,
        student.rfidTag,
        student.studentType,
        student.email,
        student.phoneNumber,
        student.section_name || '',
        student.guardian_name || ''
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Student ID", "Name", "RFID Tag", "Type", "Email", "Phone", "Section", "Guardian"];
    const rows = students.map(student => [
      student.studentIdNum,
      `${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}`,
      student.rfidTag,
      student.studentType,
      student.email,
      student.phoneNumber,
      student.section_name || '',
      student.guardian_name || ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    XLSX.writeFile(workbook, "students.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Students List", 14, 15);
    
    const headers = ["Student ID", "Name", "RFID Tag", "Type", "Email", "Phone", "Section", "Guardian"];
    const rows = students.map(student => [
      student.studentIdNum,
      `${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}`,
      student.rfidTag,
      student.studentType,
      student.email,
      student.phoneNumber,
      student.section_name || '',
      student.guardian_name || ''
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("students.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Students List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .student-info { display: flex; align-items: center; gap: 12px; }
              .student-avatar { width: 40px; height: 40px; border-radius: 8px; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
              .student-name { font-weight: 500; }
              .student-id { font-size: 12px; color: #6b7280; }
              @media print {
                body { margin: 0; padding: 20px; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>Students List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Student ID</th>
                  <th>RFID Tag</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Section</th>
                  <th>Guardian</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(student => `
                  <tr>
                    <td>
                      <div class="student-info">
                        <div class="student-avatar">${student.firstName.charAt(0)}${student.lastName.charAt(0)}</div>
                        <div>
                          <div class="student-name">${student.lastName}, ${student.firstName} ${student.middleName || ''} ${student.suffix || ''}</div>
                          <div class="student-id">${student.studentIdNum}</div>
                        </div>
                      </div>
                    </td>
                    <td>${student.studentIdNum}</td>
                    <td>${student.rfidTag}</td>
                    <td>${student.studentType}</td>
                    <td>
                      <div>${student.email}</div>
                      <div>${student.phoneNumber}</div>
                    </td>
                    <td>${student.section_name || '-'}</td>
                    <td>${student.guardian_name || '-'}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({
      type: "all",
      section: "all",
      status: "all",
      course: "all",
      department: "all",
      yearLevel: "all",
      rfidStatus: "all",
    });
  };

  const handleBulkAction = (action: string) => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students first");
      return;
    }

    switch (action) {
      case 'activate':
        setStudents(students.map(student => 
          selectedStudents.includes(student.studentId) 
            ? { ...student, status: 'ACTIVE' as const }
            : student
        ));
        toast.success(`${selectedStudents.length} student(s) activated`);
        break;
      case 'deactivate':
        setStudents(students.map(student => 
          selectedStudents.includes(student.studentId) 
            ? { ...student, status: 'INACTIVE' as const }
            : student
        ));
        toast.success(`${selectedStudents.length} student(s) deactivated`);
        break;
      case 'assignRFID':
        setShowRFIDManagement(true);
        break;
      case 'exportSelected':
        handleExportSelectedStudents();
        break;
      default:
        break;
    }
    setSelectedStudents([]);
  };

  const handleExportSelectedStudents = () => {
    const selectedData = students.filter(student => selectedStudents.includes(student.studentId));
    // Implementation for exporting selected students
    toast.success(`${selectedData.length} students exported`);
  };

  const getStudentStats = () => {
    const total = students.length;
    const active = students.filter(s => s.status === 'ACTIVE').length;
    const inactive = students.filter(s => s.status === 'INACTIVE').length;
    const regular = students.filter(s => s.studentType === 'REGULAR').length;
    const irregular = students.filter(s => s.studentType === 'IRREGULAR').length;
    
    return { total, active, inactive, regular, irregular };
  };

  const getAttendanceSummary = () => {
    // Mock attendance data - replace with actual API call
    return {
      totalSessions: 150,
      averageAttendance: 85.5,
      presentCount: 128,
      absentCount: 15,
      lateCount: 7,
      excusedCount: 0
    };
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.studentIdNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          `${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || student.studentType === filters.type;
      const matchesSection = filters.section === "all" || student.section_name === filters.section;
      const matchesStatus = filters.status === "all" || student.status === filters.status;
      const matchesCourse = filters.course === "all" || student.courseId?.toString() === filters.course;
      const matchesDepartment = filters.department === "all" || student.departmentId?.toString() === filters.department;
      const matchesYearLevel = filters.yearLevel === "all" || student.yearLevel === filters.yearLevel;
      
      return matchesSearch && matchesType && matchesSection && matchesStatus && 
             matchesCourse && matchesDepartment && matchesYearLevel;
    });
  }, [students, searchTerm, filters]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'studentIdNum':
          comparison = a.studentIdNum.localeCompare(b.studentIdNum);
          break;
        case 'rfidTag':
          comparison = a.rfidTag.localeCompare(b.rfidTag);
          break;
        case 'name':
          comparison = `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
          break;
        case 'studentType':
          comparison = a.studentType.localeCompare(b.studentType);
          break;
        case 'section':
          comparison = (a.section_name || '').localeCompare(b.section_name || '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'phone':
          comparison = a.phoneNumber.localeCompare(b.phoneNumber);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortField, sortOrder]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

  const stats = getStudentStats();
  const attendanceSummary = getAttendanceSummary();

  return (
    <div className="min-h-screen bg-background p-3">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regular Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.regular}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-orange-600">{attendanceSummary.averageAttendance}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        title="Student Management"
        subtitle="Manage and view all student information with advanced analytics"
        icon={<Users className="w-4 h-4 text-blue-600" />}
        primaryAction={{
          id: 'add-student',
          label: 'Add Student',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => { setModalStudent(undefined); setModalOpen(true); },
          className: "bg-blue-600 hover:bg-blue-700 text-white"
        }}
        secondaryActions={[
          DataOperationsGroup({
            onExport: () => handleExportToExcel(),
            onPrint: handlePrint
          }),
          {
            id: 'student-actions',
            label: 'Actions',
            icon: <Settings className="h-4 w-4" />,
            variant: 'outline' as const,
            items: [
              {
                id: 'filter',
                label: 'Filter Students',
                icon: <Filter className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                onClick: () => setFilterDialogOpen(true)
              },
              {
                id: 'sort',
                label: 'Sort Options',
                icon: <SortAsc className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                onClick: () => setSortDialogOpen(true)
              },
              {
                id: 'analytics',
                label: 'View Analytics',
                icon: <BarChart3 className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                onClick: () => setShowAnalytics(true)
              },
              {
                id: 'rfid-management',
                label: 'RFID Management',
                icon: <QrCode className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                onClick: () => setShowRFIDManagement(true)
              },
              {
                id: 'attendance-summary',
                label: 'Attendance Summary',
                icon: <TrendingUp className="h-4 w-4 mr-2 text-gray-700" strokeWidth={3} />,
                onClick: () => setShowAttendanceSummary(true)
              }
            ]
          }
        ]}
      />

      <Card>
        <CardContent>
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                className="pl-9"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedStudents.length} student(s) selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                    <UserX className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('assignRFID')}>
                    <QrCode className="h-4 w-4 mr-1" />
                    Assign RFID
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('exportSelected')}>
                    <FileText className="h-4 w-4 mr-1" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Table */}
          <div className="overflow-x-auto rounded-md border bg-white shadow">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100/60">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(paginatedStudents.map(s => s.studentId));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Student Info</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>RFID Tag</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((item) => (
                  <TableRow key={item.studentId} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedStudents.includes(item.studentId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, item.studentId]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== item.studentId));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                          {`${item.firstName.charAt(0)}${item.lastName.charAt(0)}`}
                        </div>
                        <div>
                          <div className="font-medium">{`${item.lastName}, ${item.firstName} ${item.middleName || ''} ${item.suffix || ''}`}</div>
                          <div className="text-xs text-muted-foreground">{item.studentIdNum}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.studentIdNum}</TableCell>
                    <TableCell>
                      <Badge variant="info">{item.rfidTag}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.studentType === "REGULAR" ? "success" : "warning"}>{item.studentType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.yearLevel.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.email}</div>
                      <div className="text-xs text-muted-foreground">{item.phoneNumber}</div>
                    </TableCell>
                    <TableCell>{item.section_name || '-'}</TableCell>
                    <TableCell>{item.guardian_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "ACTIVE" ? "success" : "destructive"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedStudent(item); setViewDialogOpen(true); }}>
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setModalStudent(item); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setStudentToDelete(item); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Export/Print and Pagination */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedStudents.length)} of {sortedStudents.length} entries
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportToCSV}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToExcel}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToPDF}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="flex items-center gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                Prev
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setStudentToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the student "{studentToDelete?.firstName} {studentToDelete?.lastName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setStudentToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => studentToDelete && handleDeleteStudent(studentToDelete.studentId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: StudentFormData) => {
          try {
            const url = modalStudent ? `/api/students/${modalStudent.studentId}` : "/api/students";
            const method = modalStudent ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save student");

            if (modalStudent) {
              setStudents(students.map(student => 
                student.studentId === modalStudent.studentId ? { ...student, ...data } : student
              ));
              toast.success("Student updated successfully");
            } else {
              const newStudent = await response.json();
              setStudents([...students, newStudent]);
              toast.success("Student created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving student:", error);
            toast.error("Failed to save student");
          }
        }}
        title={modalStudent ? "Edit Student" : "Add New Student"}
        submitLabel={modalStudent ? "Update" : "Add"}
        defaultValues={modalStudent}
        schema={studentFormSchema}
        fields={[
          {
            name: "studentIdNum",
            label: "Student ID",
            type: "text",
          },
          {
            name: "rfidTag",
            label: "RFID Tag",
            type: "text",
          },
          {
            name: "firstName",
            label: "First Name",
            type: "text",
          },
          {
            name: "middleName",
            label: "Middle Name",
            type: "text",
          },
          {
            name: "lastName",
            label: "Last Name",
            type: "text",
          },
          {
            name: "suffix",
            label: "Suffix",
            type: "text",
          },
          {
            name: "email",
            label: "Email",
            type: "text",
          },
          {
            name: "phoneNumber",
            label: "Phone Number",
            type: "text",
          },
          {
            name: "address",
            label: "Address",
            type: "text",
          },
          {
            name: "gender",
            label: "Gender",
            type: "select",
            options: [
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ],
          },
          {
            name: "studentType",
            label: "Type",
            type: "select",
            options: [
              { value: "REGULAR", label: "Regular" },
              { value: "IRREGULAR", label: "Irregular" },
            ],
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ],
          },
          {
            name: "yearLevel",
            label: "Year Level",
            type: "select",
            options: [
              { value: "FIRST_YEAR", label: "First Year" },
              { value: "SECOND_YEAR", label: "Second Year" },
              { value: "THIRD_YEAR", label: "Third Year" },
              { value: "FOURTH_YEAR", label: "Fourth Year" },
            ],
          },
          {
            name: "section_name",
            label: "Section",
            type: "text",
          },
        ]}
      />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={open => setFilterDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Students</DialogTitle>
            <DialogDescription>Filter the students by type, section, and status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
                <SelectTrigger id="filter-type" className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="IRREGULAR">Irregular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-section">Section</Label>
              <Select value={filters.section} onValueChange={value => handleFilterChange('section', value)}>
                <SelectTrigger id="filter-section" className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Array.from(new Set(students.map(s => s.section_name))).map(section => (
                    <SelectItem key={section} value={section || ''}>{section || 'No Section'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                <SelectTrigger id="filter-status" className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
            <Button variant="ghost" onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog open={sortDialogOpen} onOpenChange={open => setSortDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sort Students</DialogTitle>
            <DialogDescription>Choose a field to sort the students by.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              { field: 'studentIdNum', label: 'Student ID' },
              { field: 'rfidTag', label: 'RFID Tag' },
              { field: 'name', label: 'Name' },
              { field: 'studentType', label: 'Type' },
              { field: 'section', label: 'Section' },
              { field: 'email', label: 'Email' },
              { field: 'phone', label: 'Phone' },
            ].map(option => (
              <Button
                key={option.field}
                variant={sortField === option.field ? 'default' : 'outline'}
                className="w-full flex items-center justify-between"
                onClick={() => handleSort(option.field as any)}
              >
                <span className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  {option.label}
                </span>
                {sortField === option.field && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSortDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedStudent(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              <DialogTitle>Student Details</DialogTitle>
            </div>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6 py-2">
              <div className="bg-muted rounded-md p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                  {`${selectedStudent.firstName.charAt(0)}${selectedStudent.lastName.charAt(0)}`}
                </div>
                <div>
                  <div className="text-xl font-bold mb-1">{`${selectedStudent.lastName}, ${selectedStudent.firstName} ${selectedStudent.middleName || ''} ${selectedStudent.suffix || ''}`}</div>
                  <div className="text-sm text-muted-foreground mb-2">{selectedStudent.studentIdNum}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={selectedStudent.studentType === "REGULAR" ? "success" : "warning"}>{selectedStudent.studentType}</Badge>
                    <Badge variant={selectedStudent.status === "ACTIVE" ? "success" : "destructive"}>{selectedStudent.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-md p-4">
                  <div className="font-semibold mb-1 flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" />Contact Information</div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedStudent.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedStudent.phoneNumber}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{selectedStudent.address}</div>
                  </div>
                </div>
                <div className="bg-muted rounded-md p-4">
                  <div className="font-semibold mb-1 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" />Academic Information</div>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2"><School className="h-4 w-4 text-muted-foreground" />{selectedStudent.yearLevel.replace('_', ' ')}</div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{selectedStudent.section_name || 'No Section'}</div>
                  </div>
                </div>
                <div className="md:col-span-2 bg-muted rounded-md p-4">
                  <div className="font-semibold mb-1 flex items-center gap-2"><Badge variant="info">RFID</Badge>RFID Information</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="info">{selectedStudent.rfidTag}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setViewDialogOpen(false); setSelectedStudent(null); }}>Close</Button>
            <Button onClick={() => {
              if (selectedStudent) {
                setModalStudent(selectedStudent);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}>
              Edit Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}