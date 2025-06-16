"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Filter, SortAsc, Eye, Pencil, Trash2, Download, Printer, CheckSquare, Square } from "lucide-react";
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

const Checkbox = ({ checked, indeterminate, onCheckedChange, ...props }: { checked?: boolean, indeterminate?: boolean, onCheckedChange?: (checked: boolean) => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    aria-checked={checked}
    onClick={e => { e.stopPropagation(); onCheckedChange?.(!checked); }}
    className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'} ${indeterminate ? 'bg-gray-200' : ''}`}
    {...props}
  >
    {indeterminate ? (
      <span className="w-3 h-0.5 bg-gray-500 rounded" />
    ) : checked ? (
      <CheckSquare className="w-4 h-4 text-white" />
    ) : (
      <Square className="w-4 h-4 text-gray-400" />
    )}
  </button>
);

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
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const exportableColumns = [
    { key: 'name', label: 'Course Name' },
    { key: 'code', label: 'Code' },
    { key: 'department', label: 'Department' },
    { key: 'units', label: 'Units' },
    { key: 'totalInstructors', label: 'Instructors' },
    { key: 'totalStudents', label: 'Students' },
    { key: 'status', label: 'Status' },
  ];
  const [exportColumns, setExportColumns] = useState(exportableColumns.map(col => col.key));
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

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

  const isAllSelected = paginatedCourses.length > 0 && paginatedCourses.every(c => selectedIds.includes(c.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCourses.map(c => c.id));
    }
  };
  const handleSelectRow = (id: string | number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Table columns
  const columns = [
    { header: <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} />, accessor: "select", className: "w-12 text-center" },
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
      <TableCell className="text-center align-middle">
        <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => handleSelectRow(item.id)} aria-label={`Select course ${item.name}`} />
      </TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.code}</TableCell>
      <TableCell>{item.department}</TableCell>
      <TableCell>{item.units}</TableCell>
      <TableCell className="text-center">{item.totalInstructors}</TableCell>
      <TableCell className="text-center">{item.totalStudents}</TableCell>
      <TableCell>
        <Badge variant={item.status === "active" ? "success" : "destructive"}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge>
      </TableCell>
      <TableCell>
        <div className="hidden 2xl:flex gap-2 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`View Course ${item.name}`} className="hover:bg-blue-50">
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View course details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Edit Course ${item.name}`} onClick={() => { setModalCourse(item); setModalOpen(true); }} className="hover:bg-green-50">
                  <Pencil className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit course</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Delete Course ${item.name}`} onClick={() => { setCourseToDelete(item); setDeleteDialogOpen(true); }} className="hover:bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete course</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="2xl:hidden flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <span className="sr-only">More</span>
                <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Eye className="h-4 w-4 text-blue-600 mr-2" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setModalCourse(item); setModalOpen(true); }}>
                <Pencil className="h-4 w-4 text-green-600 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCourseToDelete(item); setDeleteDialogOpen(true); }}>
                <Trash2 className="h-4 w-4 text-red-600 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      <div className="print:hidden">
        {/* Responsive header row for small screens */}
        <div className="flex flex-col gap-4 mb-6 lg:hidden">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-blue-900">All Courses</h1>
              <p className="text-sm text-blue-700/80">Manage and view all course information</p>
            </div>
            {/* Controls: filter, sort, export, print, add */}
            <div className="flex flex-row gap-1 items-center">
              <TooltipProvider delayDuration={0}>
                {/* Filter Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Filter" onClick={() => setFilterDialogOpen(true)}>
                      <Filter className="h-4 w-4 text-blue-700/70" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">Filter</TooltipContent>
                </Tooltip>
                {/* Sort Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Sort" onClick={() => setSortDialogOpen(true)}>
                      <SortAsc className="h-4 w-4 text-blue-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">Sort</TooltipContent>
                </Tooltip>
                {/* Export Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Export" onClick={() => setExportDialogOpen(true)}>
                      <Download className="h-4 w-4 text-blue-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">Export</TooltipContent>
                </Tooltip>
                {/* Print Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Print" onClick={handlePrint}>
                      <Printer className="h-4 w-4 text-blue-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">Print</TooltipContent>
                </Tooltip>
                {/* Add Course Button (icon only) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" className="bg-blue-700 hover:bg-blue-800 text-white shadow ml-1" aria-label="Add Course" onClick={() => { setModalCourse(undefined); setModalOpen(true); }}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">Add new course</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Search bar for small screens */}
          <TableSearch value={search} onChange={setSearch} placeholder="Search courses..." className="h-10 w-full px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-2" />
        </div>
        {/* Existing layout for large screens and up */}
        <div className="hidden lg:block relative flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-blue-900">All Courses</h1>
            <p className="text-sm text-blue-700/80">Manage and view all course information</p>
          </div>
          {/* Controls: stacked below label on mobile, absolutely right-aligned on lg+ */}
          <div className="flex flex-col gap-2 mt-2 w-full lg:absolute lg:right-0 lg:top-0 lg:flex-row lg:items-center lg:justify-end lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <TableSearch value={search} onChange={setSearch} placeholder="Search courses..." className="h-10 w-full sm:w-64 px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400" />
              <div className="flex flex-row gap-0 rounded-lg shadow-sm overflow-hidden">
                <TooltipProvider delayDuration={0}>
                  {/* Filter Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50 relative" aria-label="Filter" onClick={() => setFilterDialogOpen(true)}>
                        <Filter className="h-4 w-4 text-blue-700/70" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">Filter</TooltipContent>
                  </Tooltip>
                  {/* Sort Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Sort" onClick={() => setSortDialogOpen(true)}>
                        <SortAsc className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">Sort</TooltipContent>
                  </Tooltip>
                  {/* Export Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Export" onClick={() => setExportDialogOpen(true)}>
                        <Download className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">Export</TooltipContent>
                  </Tooltip>
                  {/* Print Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Print" onClick={handlePrint}>
                        <Printer className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">Print</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" className="bg-blue-700 hover:bg-blue-800 text-white shadow flex items-center gap-2 px-3 py-1 text-sm font-semibold w-full lg:w-auto" aria-label="Add Course" onClick={() => { setModalCourse(undefined); setModalOpen(true); }}>
                    <Plus className="h-2 w-2" />
                    Add Course
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">Add new course</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      {/* LIST */}
      {/* Table layout for xl+ only */}
      <div className="hidden xl:block overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md">
        <Table>
          <TableHeader className="bg-blue-50">
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={`text-blue-900 font-semibold text-sm border-b border-blue-100${col.accessor === "actions" ? " !p-2 text-center" : ""}`}
                >
                  {col.header}
                </TableHead>
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
      {/* Card layout for small screens */}
      <div className="block xl:hidden w-full space-y-4">
        {paginatedCourses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No courses found.</div>
        ) : (
          paginatedCourses.map((item) => (
            <div
              key={item.id}
              className="relative bg-white border border-blue-200 rounded-2xl shadow-lg p-4 flex flex-col gap-3 transition-shadow duration-150 active:shadow-xl focus-within:ring-2 focus-within:ring-blue-400"
              tabIndex={0}
              role="button"
              aria-label={`View details for course ${item.name}`}
            >
              {/* Status */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-blue-500 bg-blue-50 rounded px-2 py-0.5">{item.code}</span>
                <Badge variant={item.status === "active" ? "success" : "destructive"} className="text-xs px-2 py-1 rounded-full">
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>
              {/* Course Name */}
              <div className="text-lg font-bold text-blue-900">{item.name}</div>
              {/* Info Section */}
              <div className="flex flex-wrap gap-3 text-sm text-blue-800">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Department:</span>
                  <span>{item.department}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Units:</span>
                  <span>{item.units}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Instructors:</span>
                  <span>{item.totalInstructors}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Students:</span>
                  <span>{item.totalStudents}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex justify-end gap-2 mt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" aria-label={`View Course ${item.name}`} className="hover:bg-blue-50">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View course details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" aria-label={`Edit Course ${item.name}`} onClick={() => { setModalCourse(item); setModalOpen(true); }} className="hover:bg-green-50">
                        <Pencil className="h-4 w-4 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit course</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" aria-label={`Delete Course ${item.name}`} onClick={() => { setCourseToDelete(item); setDeleteDialogOpen(true); }} className="hover:bg-red-50">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete course</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))
        )}
      </div>
      {/* PAGINATION */}
      <div className="mt-6 flex justify-center">
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
      {/* FILTER DIALOG */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
              Filter Courses
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            {/* Status Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Status</h3>
                </div>
                <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                  {columnStatusFilter === 'all' ? 'All' : columnStatusFilter.charAt(0).toUpperCase() + columnStatusFilter.slice(1)}
                </Badge>
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="grid grid-cols-3 gap-2 mt-6">
                <Button
                  variant={columnStatusFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${columnStatusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setColumnStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={columnStatusFilter === 'active' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${columnStatusFilter === 'active' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setColumnStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={columnStatusFilter === 'inactive' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${columnStatusFilter === 'inactive' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setColumnStatusFilter('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4 mt-10">
            <Button
              variant="outline"
              onClick={() => setColumnStatusFilter('all')}
              className="w-32 border border-blue-300 text-blue-500"
            >
              Reset
            </Button>
            <Button 
              onClick={() => setFilterDialogOpen(false)}
              className="w-32 bg-blue-600 hover:bg-blue-700 text-white">
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* SORT DIALOG */}
      <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
              Sort Courses
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            {/* Sort By Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Sort By</h3>
                </div>
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {['name','code','department','units','totalInstructors','totalStudents','status'].map(field => (
                  <Button
                    key={field}
                    variant={sortField === field ? "default" : "outline"}
                    size="sm"
                    className={`w-full ${sortField === field ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                    onClick={() => setSortField(field as SortField)}
                  >
                    {exportableColumns.find(c => c.key === field)?.label || field}
                  </Button>
                ))}
              </div>
            </div>
            {/* Sort Order Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Sort Order</h3>
                </div>
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button
                  variant={sortOrder === 'asc' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${sortOrder === 'asc' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setSortOrder('asc')}
                >
                  Ascending
                </Button>
                <Button
                  variant={sortOrder === 'desc' ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${sortOrder === 'desc' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setSortOrder('desc')}
                >
                  Descending
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4 mt-10">
            <Button
              variant="outline"
              onClick={() => { setSortField('name'); setSortOrder('asc'); }}
              className="w-32 border border-blue-300 text-blue-500"
            >
              Reset
            </Button>
            <Button 
              onClick={() => setSortDialogOpen(false)}
              className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply Sort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* EXPORT DIALOG */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
              Export Courses
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            {/* Export Format Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Export Format</h3>
                </div>
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <Button
                  variant={exportFormat === 'pdf' ? "default" : "outline"}
                  size="sm"
                  className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setExportFormat('pdf')}
                >
                  PDF
                </Button>
                <Button
                  variant={exportFormat === 'excel' ? "default" : "outline"}
                  size="sm"
                  className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'excel' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setExportFormat('excel')}
                >
                  Excel
                </Button>
                <Button
                  variant={exportFormat === 'csv' ? "default" : "outline"}
                  size="sm"
                  className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'csv' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setExportFormat('csv')}
                >
                  CSV
                </Button>
              </div>
            </div>
            {/* Export Options Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-semibold text-blue-900">Export Options</h3>
                </div>
              </div>
              <div className="h-px bg-blue-100 w-full mb-8"></div>
              <div className="space-y-6">
                {exportableColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportColumns.includes(column.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportColumns([...exportColumns, column.key]);
                        } else {
                          setExportColumns(exportColumns.filter((c) => c !== column.key));
                        }
                      }}
                      className="border-blue-200"
                    />
                    <label className="text-sm text-blue-900 cursor-pointer">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4 mt-10">
            <Button
              variant="outline"
              onClick={() => {
                setExportFormat(null);
                setExportColumns(exportableColumns.map(col => col.key));
              }}
              className="w-32 border border-blue-300 text-blue-500"
            >
              Reset
            </Button>
            <Button 
              onClick={() => {
                // Implement export logic here, similar to handleExport/handleExportExcel/handleExportPDF
                setExportDialogOpen(false);
              }}
              className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!exportFormat}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
