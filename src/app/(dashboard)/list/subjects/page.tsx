"use client";

import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, School, CheckSquare, Square } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define the subject schema
const subjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  type: z.enum(["lecture", "laboratory", "both"]),
  lecture_units: z.number().optional(),
  laboratory_units: z.number().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  semester: z.enum(["1st", "2nd", "3rd"]),
  year_level: z.enum(["1st", "2nd", "3rd", "4th"]),
  department: z.string().min(1, "Department is required"),
  instructors: z.array(z.string()),
  status: z.enum(["active", "inactive"]).optional(),
});

type Subject = z.infer<typeof subjectSchema>;

// Update the form schema to match the form fields
const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  type: z.enum(["lecture", "laboratory", "both"]),
  lecture_units: z.number().optional(),
  laboratory_units: z.number().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  semester: z.enum(["1st", "2nd", "3rd"]),
  year_level: z.enum(["1st", "2nd", "3rd", "4th"]),
  department: z.string().min(1, "Department is required"),
  instructors: z.array(z.string()),
});

type SubjectFormData = z.infer<typeof subjectFormSchema>;

// Mock data - replace with actual API calls later
const initialSubjects: Subject[] = [
  {
    id: "1",
    name: "Introduction to Programming",
    code: "ITP101",
    description: "Basic programming concepts and problem-solving",
    type: "both",
    lecture_units: 2,
    laboratory_units: 1,
    units: 3,
    semester: "1st",
    year_level: "1st",
    department: "College of Information Technology",
    instructors: ["John Doe", "Jane Smith"],
    status: "active",
  },
  {
    id: "2",
    name: "Data Structures and Algorithms",
    code: "DSA201",
    description: "Advanced data structures and algorithm analysis",
    type: "both",
    lecture_units: 3,
    laboratory_units: 1,
    units: 4,
    semester: "2nd",
    year_level: "2nd",
    department: "College of Information Technology",
    instructors: ["Alice Johnson", "Bob Wilson"],
    status: "active",
  },
];

type SortField = 'name' | 'code' | 'type' | 'units' | 'semester' | 'year_level' | 'department';
type SortOrder = 'asc' | 'desc';

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

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState<Subject | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    semester: "all",
    year_level: "all",
    department: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

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

  async function handleDeleteSubject(id: string) {
    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete subject");
      }

      setSubjects(subjects.filter(subject => subject.id !== id));
      toast.success("Subject deleted successfully");
      setDeleteDialogOpen(false);
      setSubjectToDelete(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department", "Instructors"];
    const csvContent = [
      headers.join(","),
      ...subjects.map(subject => [
        subject.name,
        subject.code,
        subject.type,
        subject.units,
        subject.semester,
        subject.year_level,
        subject.department,
        subject.instructors.join("; ")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department", "Instructors"];
    const rows = subjects.map(subject => [
      subject.name,
      subject.code,
      subject.type,
      subject.units,
      subject.semester,
      subject.year_level,
      subject.department,
      subject.instructors.join("; ")
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
    
    XLSX.writeFile(workbook, "subjects.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Subjects List", 14, 15);
    
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Year Level", "Department"];
    const rows = subjects.map(subject => [
      subject.name,
      subject.code,
      subject.type,
      subject.units.toString(),
      subject.semester,
      subject.year_level,
      subject.department
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("subjects.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Subjects List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .subject-info { display: flex; align-items: center; gap: 12px; }
              .subject-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
              .subject-name { font-weight: 500; }
              .subject-code-text { font-size: 12px; color: #6b7280; }
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
              <h1>Subjects List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Subject Info</th>
                  <th>Type</th>
                  <th>Units</th>
                  <th>Semester</th>
                  <th>Year Level</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                ${subjects.map(subject => `
                  <tr>
                    <td>
                      <div class="subject-info">
                        <div class="subject-code">${subject.code.slice(0, 2)}</div>
                        <div>
                          <div class="subject-name">${subject.name}</div>
                          <div class="subject-code-text">${subject.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>${subject.type}</td>
                    <td>${subject.units}</td>
                    <td>${subject.semester}</td>
                    <td>${subject.year_level}</td>
                    <td>${subject.department}</td>
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
      semester: "all",
      year_level: "all",
      department: "all",
    });
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subject.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || subject.type === filters.type;
      const matchesSemester = filters.semester === "all" || subject.semester === filters.semester;
      const matchesYearLevel = filters.year_level === "all" || subject.year_level === filters.year_level;
      const matchesDepartment = filters.department === "all" || subject.department === filters.department;
      const matchesStatus = statusFilter === "all" || (subject.status || "active") === statusFilter;
      
      return matchesSearch && matchesType && matchesSemester && matchesYearLevel && matchesDepartment && matchesStatus;
    });
  }, [subjects, searchTerm, filters, statusFilter]);

  const sortedSubjects = useMemo(() => {
    return [...filteredSubjects].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredSubjects, sortField, sortOrder]);

  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSubjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSubjects.length / itemsPerPage);

  const isAllSelected = paginatedSubjects.length > 0 && paginatedSubjects.every(s => selectedIds.includes(s.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSubjects.map(s => s.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-background p-3">
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">All Subjects</h1>
              <p className="text-muted-foreground text-sm">Manage and view all subject information</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  className="pl-9"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setFilterDialogOpen(true)} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button variant="outline" onClick={() => setSortDialogOpen(true)} className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
              </Button>
              <Button onClick={() => { setModalSubject(undefined); setModalOpen(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Subject</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border bg-white shadow">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100/60">
                  <TableHead>Subject Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubjects.map((item) => (
                  <TableRow key={item.code} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === "both" ? "info" : item.type === "lecture" ? "success" : "warning"}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.units}</TableCell>
                    <TableCell>{item.semester}</TableCell>
                    <TableCell>{item.year_level}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedSubject(item); setViewDialogOpen(true); }}>
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setModalSubject(item); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSubjectToDelete(item); setDeleteDialogOpen(true); }}>
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedSubjects.length)} of {sortedSubjects.length} entries
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
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setSubjectToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the subject "{subjectToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSubjectToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => subjectToDelete && handleDeleteSubject(subjectToDelete.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: SubjectFormData) => {
          try {
            const url = modalSubject ? `/api/subjects/${modalSubject.id}` : "/api/subjects";
            const method = modalSubject ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save subject");

            if (modalSubject) {
              setSubjects(subjects.map(subject => 
                subject.id === modalSubject.id ? { ...subject, ...data } : subject
              ));
              toast.success("Subject updated successfully");
            } else {
              const newSubject = await response.json();
              setSubjects([...subjects, newSubject]);
              toast.success("Subject created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving subject:", error);
            toast.error("Failed to save subject");
          }
        }}
        title={modalSubject ? "Edit Subject" : "Add New Subject"}
        submitLabel={modalSubject ? "Update" : "Add"}
        defaultValues={modalSubject}
        schema={subjectFormSchema}
        fields={[
          {
            name: "name",
            label: "Subject Name",
            type: "text",
          },
          {
            name: "code",
            label: "Subject Code",
            type: "text",
          },
          {
            name: "type",
            label: "Type",
            type: "select",
            options: [
              { value: "lecture", label: "Lecture" },
              { value: "laboratory", label: "Laboratory" },
              { value: "both", label: "Both" },
            ],
          },
          {
            name: "lecture_units",
            label: "Lecture Units",
            type: "number",
          },
          {
            name: "laboratory_units",
            label: "Laboratory Units",
            type: "number",
          },
          {
            name: "units",
            label: "Total Units",
            type: "number",
          },
          {
            name: "semester",
            label: "Semester",
            type: "select",
            options: [
              { value: "1st", label: "1st Semester" },
              { value: "2nd", label: "2nd Semester" },
              { value: "3rd", label: "3rd Semester" },
            ],
          },
          {
            name: "year_level",
            label: "Year Level",
            type: "select",
            options: [
              { value: "1st", label: "1st Year" },
              { value: "2nd", label: "2nd Year" },
              { value: "3rd", label: "3rd Year" },
              { value: "4th", label: "4th Year" },
            ],
          },
          {
            name: "department",
            label: "Department",
            type: "text",
          },
          {
            name: "description",
            label: "Description",
            type: "multiline",
          },
        ]}
      />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={open => setFilterDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Subjects</DialogTitle>
            <DialogDescription>Filter the subjects by type, semester, year level, and department.</DialogDescription>
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
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-semester">Semester</Label>
              <Select value={filters.semester} onValueChange={value => handleFilterChange('semester', value)}>
                <SelectTrigger id="filter-semester" className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1st">1st Semester</SelectItem>
                  <SelectItem value="2nd">2nd Semester</SelectItem>
                  <SelectItem value="3rd">3rd Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-year">Year Level</Label>
              <Select value={filters.year_level} onValueChange={value => handleFilterChange('year_level', value)}>
                <SelectTrigger id="filter-year" className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1st">1st Year</SelectItem>
                  <SelectItem value="2nd">2nd Year</SelectItem>
                  <SelectItem value="3rd">3rd Year</SelectItem>
                  <SelectItem value="4th">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-dept">Department</Label>
              <Select value={filters.department} onValueChange={value => handleFilterChange('department', value)}>
                <SelectTrigger id="filter-dept" className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="College of Information Technology">College of Information Technology</SelectItem>
                  <SelectItem value="College of Engineering">College of Engineering</SelectItem>
                  <SelectItem value="College of Education">College of Education</SelectItem>
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
            <DialogTitle>Sort Subjects</DialogTitle>
            <DialogDescription>Choose a field to sort the subjects by.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              { field: 'name', label: 'Subject Name' },
              { field: 'code', label: 'Subject Code' },
              { field: 'type', label: 'Type' },
              { field: 'units', label: 'Units' },
              { field: 'semester', label: 'Semester' },
              { field: 'year_level', label: 'Year Level' },
              { field: 'department', label: 'Department' },
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
      <Dialog open={viewDialogOpen} onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedSubject(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <School className="h-6 w-6 text-blue-600" />
              <DialogTitle>Subject Details</DialogTitle>
            </div>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-6 py-2">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-xl font-bold mb-1">{selectedSubject.name}</div>
                <div className="text-sm text-muted-foreground mb-2">{selectedSubject.code}</div>
                <Badge variant={selectedSubject.type === "both" ? "info" : selectedSubject.type === "lecture" ? "success" : "warning"}>
                  {selectedSubject.type.charAt(0).toUpperCase() + selectedSubject.type.slice(1)}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="font-semibold mb-1">Department</div>
                  <div>{selectedSubject.department}</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="font-semibold mb-1">Description</div>
                  <div>{selectedSubject.description || "No description available"}</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="font-semibold mb-1">Units</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-700">{selectedSubject.units}</span>
                    <span className="text-xs text-muted-foreground">total units</span>
                  </div>
                  {selectedSubject.type === "both" && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Lecture: {selectedSubject.lecture_units} units<br />
                      Laboratory: {selectedSubject.laboratory_units} units
                    </div>
                  )}
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="font-semibold mb-1">Schedule</div>
                  <div className="flex items-center gap-2">
                    <span>{selectedSubject.semester} Semester</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{selectedSubject.year_level} Year</span>
                  </div>
                </div>
                <div className="md:col-span-2 bg-muted rounded-lg p-4">
                  <div className="font-semibold mb-1">Instructors</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubject.instructors.map((instructor, index) => (
                      <Badge key={index} variant="secondary">{instructor}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setViewDialogOpen(false); setSelectedSubject(null); }}>Close</Button>
            <Button onClick={() => {
              if (selectedSubject) {
                setModalSubject(selectedSubject);
                setModalOpen(true);
                setViewDialogOpen(false);
              }
            }}>
              Edit Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
