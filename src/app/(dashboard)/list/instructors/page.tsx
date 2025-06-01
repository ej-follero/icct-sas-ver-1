"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import { UserGender, InstructorType, Status } from "@/types/enums";
import { Teacher } from "@/types/teacher";
import { instructorsData } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Eye, Filter, SortAsc, Plus, Trash2, Pencil, Mail, Phone, MapPin, School, User, ChevronUp, ChevronDown, Search, FileDown, Printer, MoreVertical } from "lucide-react";

type SortField = 'firstName' | 'lastName' | 'email' | 'departmentName' | 'instructorType' | 'status';
type SortOrder = 'asc' | 'desc';

export default function InstructorsListPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState(instructorsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Teacher | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInstructor, setModalInstructor] = useState<Teacher | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Teacher | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    instructorType: "all",
    department: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, instructor: Teacher) => {
    setAnchorEl(event.currentTarget);
    setSelectedInstructor(instructor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInstructor(null);
  };

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

const handleExportToCSV = () => {
  const headers = ["Instructor ID", "Name", "Email", "Department", "Type", "Phone", "Status"];
  const csvContent = [
    headers.join(","),
      ...instructors.map(instructor => [
      instructor.instructorId,
      `${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}`,
      instructor.email,
      instructor.departmentName,
      instructor.instructorType,
      instructor.phoneNumber,
      instructor.status
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "instructors.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleExportToExcel = () => {
  const headers = ["Instructor ID", "Name", "Email", "Department", "Type", "Phone", "Status"];
    const rows = instructors.map(instructor => [
    instructor.instructorId,
    `${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}`,
    instructor.email,
    instructor.departmentName,
    instructor.instructorType,
    instructor.phoneNumber,
    instructor.status
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Instructors");
  
  XLSX.writeFile(workbook, "instructors.xlsx");
};

const handleExportToPDF = () => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text("Instructors List", 14, 15);
  
  const headers = ["Instructor ID", "Name", "Email", "Department", "Type", "Phone", "Status"];
    const rows = instructors.map(instructor => [
    instructor.instructorId,
    `${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}`,
    instructor.email,
    instructor.departmentName,
    instructor.instructorType,
    instructor.phoneNumber,
    instructor.status
  ]);

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 25,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save("instructors.pdf");
};

const handlePrint = () => {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Instructors List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
            .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
            .instructor-info { display: flex; align-items: center; gap: 12px; }
            .instructor-avatar { width: 40px; height: 40px; border-radius: 8px; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
            .instructor-name { font-weight: 500; }
            .instructor-id { font-size: 12px; color: #6b7280; }
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
            <h1>Instructors List</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Instructor Info</th>
                <th>Email</th>
                <th>Department</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
                ${instructors.map(instructor => `
                <tr>
                  <td>
                    <div class="instructor-info">
                      <div class="instructor-avatar">${instructor.firstName.charAt(0)}${instructor.lastName.charAt(0)}</div>
                      <div>
                        <div class="instructor-name">${instructor.lastName}, ${instructor.firstName} ${instructor.middleName || ''} ${instructor.suffix || ''}</div>
                        <div class="instructor-id">${instructor.instructorId}</div>
                      </div>
                    </div>
                  </td>
                  <td>${instructor.email}</td>
                  <td>${instructor.departmentName}</td>
                  <td>${instructor.instructorType}</td>
                  <td>${instructor.phoneNumber}</td>
                  <td>${instructor.status}</td>
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

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      const matchesSearch = 
        instructor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === "all" || instructor.status === filters.status;
      const matchesType = filters.instructorType === "all" || instructor.instructorType === filters.instructorType;
      const matchesDepartment = filters.department === "all" || instructor.departmentName === filters.department;
      
      return matchesSearch && matchesStatus && matchesType && matchesDepartment;
    });
  }, [instructors, searchTerm, filters]);

  const sortedInstructors = useMemo(() => {
    return [...filteredInstructors].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredInstructors, sortField, sortOrder]);

  const paginatedInstructors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInstructors.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInstructors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedInstructors.length / itemsPerPage);

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  function handleDeleteInstructor(id: number) {
    // TODO: Implement delete logic
    setDeleteDialogOpen(false);
    setInstructorToDelete(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100/50 backdrop-blur-sm">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">All Instructors</h1>
                <p className="text-sm text-gray-500 mt-2">Manage and view all instructor information</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    className="pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    placeholder="Search instructors..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant={showFilters ? "default" : "outline"} onClick={() => setFilterDialogOpen(!showFilters)} className={showFilters ? "ring-1 ring-blue-100 shadow-sm" : ""} size="icon">
                  <Filter className="h-5 w-5" />
                </Button>
                <Button variant={showSort ? "default" : "outline"} onClick={() => setSortDialogOpen(!showSort)} className={showSort ? "ring-1 ring-blue-100 shadow-sm" : ""} size="icon">
                  <SortAsc className="h-5 w-5" />
                  {sortOrder === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={() => { setModalInstructor(undefined); setModalOpen(true); }} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Instructor</span>
                </Button>
              </div>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor Info</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInstructors.map((instructor) => (
                  <TableRow key={instructor.instructorId} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 group">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-100 transition-all duration-200">
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="text-gray-300 w-7 h-7" />
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                            {instructor.lastName}, {instructor.firstName} {instructor.middleName || ''} {instructor.suffix || ''}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="truncate">ID: {instructor.instructorId}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{instructor.email}</TableCell>
                    <TableCell>{instructor.departmentName}</TableCell>
                    <TableCell>{instructor.instructorType}</TableCell>
                    <TableCell>{instructor.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge variant={instructor.status === Status.ACTIVE ? "success" : "error"} className="capitalize">
                        {instructor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/list/instructors/${instructor.instructorId}`)}>
                          <Eye className="w-5 h-5 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setModalInstructor(instructor); setModalOpen(true); }}>
                          <Pencil className="w-5 h-5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setInstructorToDelete(instructor); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-700">{Math.min(currentPage * itemsPerPage, sortedInstructors.length)}</span> of <span className="font-medium text-gray-700">{sortedInstructors.length}</span> entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "shadow-sm" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Instructor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the instructor "{instructorToDelete?.firstName} {instructorToDelete?.lastName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => instructorToDelete && handleDeleteInstructor(instructorToDelete.instructorId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Instructor Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalInstructor ? "Edit Instructor" : "Add New Instructor"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={modalInstructor?.firstName} />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" defaultValue={modalInstructor?.middleName} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={modalInstructor?.lastName} />
              </div>
              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input id="suffix" defaultValue={modalInstructor?.suffix} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={modalInstructor?.email} />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" defaultValue={modalInstructor?.phoneNumber} />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select defaultValue={modalInstructor?.gender || UserGender.MALE}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserGender.MALE}>Male</SelectItem>
                    <SelectItem value={UserGender.FEMALE}>Female</SelectItem>
                    <SelectItem value={UserGender.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="instructorType">Instructor Type</Label>
                <Select defaultValue={modalInstructor?.instructorType || InstructorType.FULL_TIME}>
                  <SelectTrigger id="instructorType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={InstructorType.FULL_TIME}>Full Time</SelectItem>
                    <SelectItem value={InstructorType.PART_TIME}>Part Time</SelectItem>
                    <SelectItem value={InstructorType.VISITING}>Visiting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={modalInstructor?.status || Status.ACTIVE}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                    <SelectItem value={Status.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={Status.PENDING}>Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
              <Button type="submit" variant="default">{modalInstructor ? "Update" : "Add"} Instructor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <User className="text-blue-600 w-6 h-6" />
                Instructor Details
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedInstructor && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                  {selectedInstructor.firstName.charAt(0)}{selectedInstructor.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedInstructor.lastName}, {selectedInstructor.firstName} {selectedInstructor.middleName || ''} {selectedInstructor.suffix || ''}
                  </h2>
                  <div className="text-gray-500 text-sm">ID: {selectedInstructor.instructorId}</div>
                  <Badge variant={selectedInstructor.status === Status.ACTIVE ? "success" : "error"} className="capitalize mt-1">
                    {selectedInstructor.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                <div className="text-gray-600 text-sm mb-1">Email: {selectedInstructor.email}</div>
                <div className="text-gray-600 text-sm">Phone: {selectedInstructor.phoneNumber}</div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Department Information</h3>
                <div className="text-gray-600 text-sm mb-1">Department: {selectedInstructor.departmentName}</div>
                <div className="text-gray-600 text-sm">Type: {selectedInstructor.instructorType}</div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">RFID Information</h3>
                <div className="text-gray-600 text-sm mb-1">RFID Tag: {selectedInstructor.rfidTag}</div>
                <div className="text-gray-600 text-sm">Tag Number: {selectedInstructor.rfidtagNumber}</div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Additional Information</h3>
                <div className="text-gray-600 text-sm mb-1">Gender: {selectedInstructor.gender}</div>
                <div className="text-gray-600 text-sm">Created: {selectedInstructor.createdAt.toLocaleDateString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewDialogOpen(false); setSelectedInstructor(null); }}>Close</Button>
            <Button variant="default" onClick={() => { if (selectedInstructor) { setModalInstructor(selectedInstructor); setModalOpen(true); setViewDialogOpen(false); } }}>Edit Instructor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

