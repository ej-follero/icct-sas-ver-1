"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Filter, SortAsc, Eye, Pencil, Trash2, CheckSquare, Square, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { DepartmentForm } from "@/components/forms/DepartmentForm";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Minimal shadcn/ui-style Checkbox
function Checkbox({ checked, indeterminate, onChange, ...props }: any) {
  return (
    <button
      type="button"
      aria-checked={checked}
      onClick={onChange}
      className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${checked ? 'bg-primary border-primary' : 'bg-white border-gray-300'} ${indeterminate ? 'bg-gray-200' : ''}`}
      {...props}
    >
      {indeterminate ? (
        <span className="w-3 h-0.5 bg-gray-500 rounded" />
      ) : checked ? (
        <CheckSquare className="w-4 h-4 text-primary" />
      ) : (
        <Square className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
}

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
}
interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description?: string;
  courseOfferings: Course[];
  status: "active" | "inactive";
  totalInstructors: number;
}
type SortField = 'name' | 'code' | 'totalInstructors' | 'totalCourses';
type SortOrder = 'asc' | 'desc';
const ITEMS_PER_PAGE = 10;

export default function DepartmentListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDepartment, setModalDepartment] = useState<Department | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [columnStatusFilter, setColumnStatusFilter] = useState("all");
  const [instructors, setInstructors] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDepartments() {
        setLoading(true);
      const res = await fetch("/api/departments");
      const data = await res.json();
        setDepartments(data);
        setLoading(false);
      }
    fetchDepartments();
    async function fetchInstructors() {
      const res = await fetch("/api/instructors");
      const data = await res.json();
      const instructorsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.instructors)
          ? data.instructors
          : [];
      setInstructors(instructorsArray.map((i: any) => ({ id: i.instructorId, name: `${i.firstName} ${i.lastName}` })));
    }
    fetchInstructors();
  }, []);

  // Filtering, sorting, and pagination
  const filteredDepartments = useMemo(() => {
    let result = [...departments];
    if (search) {
      result = result.filter(
        (dept) =>
          dept.name.toLowerCase().includes(search.toLowerCase()) ||
          dept.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (columnStatusFilter !== 'all') {
      result = result.filter((dept) => dept.status === columnStatusFilter);
    }
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      if (sortField === 'totalCourses') {
        aValue = a.courseOfferings?.length || 0;
        bValue = b.courseOfferings?.length || 0;
      } else {
        aValue = a[sortField as keyof Department] as string | number;
        bValue = b[sortField as keyof Department] as string | number;
      }
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return ((aValue as number) - (bValue as number)) * modifier;
    });
    return result;
  }, [departments, search, columnStatusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Checkbox logic
  const isAllSelected = paginatedDepartments.length > 0 && paginatedDepartments.every(d => selectedIds.includes(d.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedDepartments.map(d => d.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Table columns
  const columns = [
    { header: <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} />, accessor: "select" },
    { header: "Department Name", accessor: "name" },
    { header: "Code", accessor: "code" },
    { header: "Head of Department", accessor: "headOfDepartment" },
    { header: "Description", accessor: "description" },
    { header: "Total Courses", accessor: "totalCourses" },
    { header: "Total Instructors", accessor: "totalInstructors" },
    { header: (
      <div className="flex items-center gap-2">
                      Status
        <select
          className="ml-2 border rounded px-2 py-1 text-xs"
          value={columnStatusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setColumnStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    ), accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  // Table row renderer
  const renderRow = (item: Department) => (
    <TableRow key={item.id} className={selectedIds.includes(item.id) ? "bg-blue-50" : ""}>
      <TableCell>
        <Checkbox checked={selectedIds.includes(item.id)} onChange={() => handleSelectRow(item.id)} aria-label={`Select department ${item.name}`} />
      </TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.code}</TableCell>
      <TableCell>{item.headOfDepartment || <span className="italic text-gray-400">Not Assigned</span>}</TableCell>
      <TableCell>
        <span className="truncate block max-w-xs" title={item.description || ''}>{item.description || <span className="italic text-gray-400">No description</span>}</span>
      </TableCell>
      <TableCell>{item.courseOfferings?.length || 0}</TableCell>
      <TableCell>{item.totalInstructors || 0}</TableCell>
      <TableCell>
        <Badge variant={item.status === "active" ? "success" : "error"}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          <Button variant="ghost" size="icon" aria-label="View Department">
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Edit Department" onClick={() => { setModalDepartment(item); setModalOpen(true); }}>
            <Pencil className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete Department" onClick={() => { setDepartmentToDelete(item); setDeleteDialogOpen(true); }} disabled={item.courseOfferings?.length > 0 || item.totalInstructors > 0}>
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
        'Department Name',
        'Code',
        'Head of Department',
        'Description',
        'Total Courses',
        'Total Instructors',
        'Status',
      ],
      ...filteredDepartments.map((dept) => [
        dept.name,
        dept.code,
        dept.headOfDepartment,
        dept.description || '',
        dept.courseOfferings?.length || 0,
        dept.totalInstructors || 0,
        dept.status,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.map(String).map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'departments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Excel handler
  const handleExportExcel = () => {
    const wsData = [
      [
        'Department Name',
        'Code',
        'Head of Department',
        'Description',
        'Total Courses',
        'Total Instructors',
        'Status',
      ],
      ...filteredDepartments.map((dept) => [
        dept.name,
        dept.code,
        dept.headOfDepartment,
        dept.description || '',
        dept.courseOfferings?.length || 0,
        dept.totalInstructors || 0,
        dept.status,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments");
    XLSX.writeFile(wb, "departments.xlsx");
  };

  // Export as PDF handler
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    // Only export the table data
    const headers = [
      "Department Name",
      "Code",
      "Head of Department",
      "Description",
      "Total Courses",
      "Total Instructors",
      "Status",
    ];
    const rows = filteredDepartments.map((dept) => [
      dept.name,
      dept.code,
      dept.headOfDepartment,
      dept.description || '',
      dept.courseOfferings?.length || 0,
      dept.totalInstructors || 0,
      dept.status,
    ]);
    doc.autoTable({
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [12, 37, 86] },
      margin: { top: 16 },
    });
    doc.save("departments.pdf");
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">All Departments</h1>
          <p className="text-sm text-blue-700/80">Manage and view all department information</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search departments..." className="h-10 w-10 min-w-0 px-3 rounded-full" />
          <div className="flex items-center gap-2 self-end">
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
                <DropdownMenuItem onClick={() => { setSortField('totalInstructors'); setSortOrder(sortField === 'totalInstructors' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'totalInstructors' ? 'font-bold text-blue-700' : ''}>
                  Total Instructors {sortField === 'totalInstructors' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortField('totalCourses'); setSortOrder(sortField === 'totalCourses' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'totalCourses' ? 'font-bold text-blue-700' : ''}>
                  Total Courses {sortField === 'totalCourses' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <Button
  variant="default"
  className="bg-blue-700 hover:bg-blue-800 text-white shadow flex items-center gap-2 px-4 py-2"
  aria-label="Add Department"
  onClick={() => {
    setModalDepartment(undefined);
    setModalOpen(true);
  }}
>
  <Plus className="h-4 w-4" />
  Add Department
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
            {paginatedDepartments.length > 0 ? paginatedDepartments.map(renderRow) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-blue-400">
                  No departments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg mt-2 mb-2 border border-blue-100">
          <span className="font-medium text-blue-900">{selectedIds.length} selected</span>
          <Button variant="destructive" size="sm" disabled>Delete Selected</Button>
          <Button variant="outline" size="sm" disabled>Export Selected</Button>
        </div>
      )}
      {/* PAGINATION */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
      {/* FILTER DIALOG (structure only) */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="backdrop-blur-md bg-white/90 border border-blue-100 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Filter Departments</DialogTitle>
          </DialogHeader>
          {/* Add filter fields here */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button className="bg-blue-700 hover:bg-blue-800 text-white">Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-md bg-white/90 border border-blue-100 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Delete Department</DialogTitle>
          </DialogHeader>
          <div className="text-blue-900">Are you sure you want to delete the department "{departmentToDelete?.name}"? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDepartmentToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => { /* TODO: implement delete logic */ setDeleteDialogOpen(false); setDepartmentToDelete(null); }}>Delete</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
      {/* MODAL FOR CREATE/EDIT */}
    <DepartmentForm
      open={modalOpen}
      onOpenChange={setModalOpen}
      initialData={modalDepartment}
      instructors={instructors}
      onSuccess={() => {
        setModalOpen(false);
        // Optionally refresh department list here
      }}
    />
    </div>
  );
}
