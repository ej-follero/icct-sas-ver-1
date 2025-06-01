"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Filter, SortAsc, Eye, Pencil, Trash2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Course = {
  id: string | number;
  name: string;
  code: string;
  department: string;
  units: number;
  totalInstructors: number;
  totalStudents: number;
  status: "active" | "inactive";
};
type SortField = 'name' | 'code' | 'department' | 'units' | 'totalStudents' | 'totalInstructors';
type SortOrder = 'asc' | 'desc';
const ITEMS_PER_PAGE = 10;

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCourse, setModalCourse] = useState<Course | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [columnStatusFilter, setColumnStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/courses');
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Filtering, sorting, and pagination
  const filteredCourses = useMemo(() => {
    let result = [...courses];
    if (search) {
      result = result.filter(
        (course) =>
          course.name.toLowerCase().includes(search.toLowerCase()) ||
          course.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (columnStatusFilter !== 'all') {
      result = result.filter((course) => course.status === columnStatusFilter);
    }
    result.sort((a, b) => {
      const aValue = a[sortField as keyof Course];
      const bValue = b[sortField as keyof Course];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return (aValue as string).localeCompare(bValue as string) * modifier;
      }
      return ((aValue as number) - (bValue as number)) * modifier;
    });
    return result;
  }, [courses, search, columnStatusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Table columns
  const columns = [
    { header: "Course Name", accessor: "name" },
    { header: "Code", accessor: "code" },
    { header: "Department", accessor: "department" },
    { header: "Units", accessor: "units" },
    { header: "Instructors", accessor: "totalInstructors" },
    { header: "Students", accessor: "totalStudents" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  // Table row renderer
  const renderRow = (item: Course) => (
    <TableRow key={item.id}>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.code}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell>{item.units}</TableCell>
                    <TableCell>{item.totalInstructors}</TableCell>
                    <TableCell>{item.totalStudents}</TableCell>
                    <TableCell>
        <Badge variant={item.status === "active" ? "success" : "error"}>{item.status}</Badge>
                    </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          <Button variant="ghost" size="icon" aria-label="View Course">
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Edit Course" onClick={() => { setModalCourse(item); setModalOpen(true); }}>
            <Pencil className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete Course" onClick={() => { setCourseToDelete(item); setDeleteDialogOpen(true); }}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
                    </TableCell>
                  </TableRow>
  );

  // Export to CSV handler
  const handleExport = () => {
    const csvRows = [
      [
        'Course Name',
        'Code',
        'Department',
        'Units',
        'Instructors',
        'Students',
        'Status',
      ],
      ...filteredCourses.map((course) => [
        course.name,
        course.code,
        course.department,
        course.units,
        course.totalInstructors,
        course.totalStudents,
        course.status,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.map(String).map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Excel handler
  const handleExportExcel = () => {
    const wsData = [
      [
        'Course Name',
        'Code',
        'Department',
        'Units',
        'Instructors',
        'Students',
        'Status',
      ],
      ...filteredCourses.map((course) => [
        course.name,
        course.code,
        course.department,
        course.units,
        course.totalInstructors,
        course.totalStudents,
        course.status,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Courses");
    XLSX.writeFile(wb, "courses.xlsx");
  };

  // Export as PDF handler
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    // Only export the table data
    const headers = [
      "Course Name",
      "Code",
      "Department",
      "Units",
      "Instructors",
      "Students",
      "Status",
    ];
    const rows = filteredCourses.map((course) => [
      course.name,
      course.code,
      course.department,
      course.units,
      course.totalInstructors,
      course.totalStudents,
      course.status,
    ]);
    doc.autoTable({
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [12, 37, 86] },
      margin: { top: 16 },
    });
    doc.save("courses.pdf");
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">All Courses</h1>
          <p className="text-sm text-blue-700/80">Manage and view all course information</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search courses..." className="h-10 w-10 min-w-0 px-3 rounded-full" />
          <div className="flex items-center gap-2 self-end">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Filter">
                  <Filter className="h-4 w-4 text-blue-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 bg-white/90 border border-blue-100 shadow-lg rounded-xl mt-2">
                <DropdownMenuItem onClick={() => setColumnStatusFilter('all')} className={columnStatusFilter === 'all' ? 'font-bold text-blue-700' : ''}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColumnStatusFilter('active')} className={columnStatusFilter === 'active' ? 'font-bold text-blue-700' : ''}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColumnStatusFilter('inactive')} className={columnStatusFilter === 'inactive' ? 'font-bold text-blue-700' : ''}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Sort">
                  <SortAsc className="h-4 w-4 text-blue-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 bg-white/90 border border-blue-100 shadow-lg rounded-xl mt-2">
                <DropdownMenuItem onClick={() => { setSortField('name'); setSortOrder(sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'name' ? 'font-bold text-blue-700' : ''}>
                  Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField('code'); setSortOrder(sortField === 'code' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'code' ? 'font-bold text-blue-700' : ''}>
                  Code {sortField === 'code' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField('department'); setSortOrder(sortField === 'department' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'department' ? 'font-bold text-blue-700' : ''}>
                  Department {sortField === 'department' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField('units'); setSortOrder(sortField === 'units' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'units' ? 'font-bold text-blue-700' : ''}>
                  Units {sortField === 'units' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField('totalInstructors'); setSortOrder(sortField === 'totalInstructors' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'totalInstructors' ? 'font-bold text-blue-700' : ''}>
                  Instructors {sortField === 'totalInstructors' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField('totalStudents'); setSortOrder(sortField === 'totalStudents' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'totalStudents' ? 'font-bold text-blue-700' : ''}>
                  Students {sortField === 'totalStudents' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Export Dropdown */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Export">
                        <Download className="h-4 w-4 text-blue-700" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-white/90 border border-blue-100 shadow-lg rounded-xl mt-2">
                      <DropdownMenuItem onClick={handleExportPDF}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportExcel}>
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExport}>
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Print Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Print" onClick={handlePrint}>
                    <Printer className="h-4 w-4 text-blue-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="default" size="icon" className="bg-blue-700 hover:bg-blue-800 text-white shadow" aria-label="Add Course" onClick={() => { setModalCourse(undefined); setModalOpen(true); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md">
        <Table>
          <TableHeader className="bg-blue-50">
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className="text-blue-900 font-semibold text-sm py-3 px-2 border-b border-blue-100">{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCourses.length > 0 ? paginatedCourses.map(renderRow) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-blue-400">
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* PAGINATION */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-md bg-white/90 border border-blue-100 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Delete Course</DialogTitle>
          </DialogHeader>
          <div className="text-blue-900">Are you sure you want to delete the course "{courseToDelete?.name}"? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setCourseToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (courseToDelete) { setCourses(courses.filter(c => c.id !== courseToDelete.id)); setDeleteDialogOpen(false); setCourseToDelete(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL FOR CREATE/EDIT (structure only) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="backdrop-blur-md bg-white/90 border border-blue-100 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900">{modalCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          </DialogHeader>
          {/* Add form fields here */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button>{modalCourse ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
