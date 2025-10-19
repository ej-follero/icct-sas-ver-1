"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, School } from "lucide-react";

// Define the section schema
const sectionSchema = z.object({
  sectionId: z.number(),
  sectionName: z.string().min(1, "Section name is required"),
  sectionType: z.enum(["REGULAR", "IRREGULAR", "SUMMER"]),
  sectionCapacity: z.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.number().min(1).max(4, "Year level must be between 1 and 4"),
  courseId: z.number().min(1, "Course is required"),
  Course: z.object({
    courseName: z.string(),
  }).optional(),
  totalStudents: z.number().optional(),
  totalSubjects: z.number().optional(),
});

type Section = z.infer<typeof sectionSchema>;

const sectionFormSchema = z.object({
  sectionName: z.string().min(1, "Section name is required"),
  sectionType: z.enum(["REGULAR", "IRREGULAR", "SUMMER"]),
  sectionCapacity: z.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.string().refine((val) => ["1", "2", "3", "4"].includes(val), {
    message: "Year level must be between 1 and 4",
  }),
  courseId: z.string().refine((val) => ["1", "2", "3"].includes(val), {
    message: "Course is required",
  }),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

const initialSections: Section[] = [
  {
    sectionId: 1,
    sectionName: "BSIT 1-A",
    sectionType: "REGULAR",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    courseId: 1,
    Course: {
      courseName: "Bachelor of Science in Information Technology"
    },
    totalStudents: 35,
    totalSubjects: 8,
  },
  {
    sectionId: 2,
    sectionName: "BSIT 1-B",
    sectionType: "REGULAR",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    courseId: 1,
    Course: {
      courseName: "Bachelor of Science in Information Technology"
    },
    totalStudents: 38,
    totalSubjects: 8,
  },
];

type SortField = 'sectionName' | 'sectionType' | 'sectionCapacity' | 'yearLevel' | 'sectionStatus';
type SortOrder = 'asc' | 'desc';

export default function SectionsPage() {
  const [sections, setSections] = useState(initialSections);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortField, setSortField] = useState<SortField>('sectionName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<Section | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    yearLevel: "all",
    course: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);

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

  async function handleDeleteSection(id: number) {
    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete section");
      }

      setSections(sections.filter(section => section.sectionId !== id));
      toast.success("Section deleted successfully");
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Section Name", "Type", "Capacity", "Status", "Year Level", "Course", "Total Students", "Total Subjects"];
    const csvContent = [
      headers.join(","),
      ...sections.map(section => [
        section.sectionName,
        section.sectionType,
        section.sectionCapacity,
        section.sectionStatus,
        section.yearLevel,
        section.Course?.courseName || "",
        section.totalStudents || 0,
        section.totalSubjects || 0
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sections.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Section Name", "Type", "Capacity", "Status", "Year Level", "Course", "Total Students", "Total Subjects"];
    const rows = sections.map(section => [
      section.sectionName,
      section.sectionType,
      section.sectionCapacity,
      section.sectionStatus,
      section.yearLevel,
      section.Course?.courseName || "",
      section.totalStudents || 0,
      section.totalSubjects || 0
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");
    
    XLSX.writeFile(workbook, "sections.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Sections List", 14, 15);
    
    const headers = ["Section Name", "Type", "Capacity", "Status", "Year Level", "Course"];
    const rows = sections.map(section => [
      section.sectionName,
      section.sectionType,
      section.sectionCapacity.toString(),
      section.sectionStatus,
      section.yearLevel.toString(),
      section.Course?.courseName || ""
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("sections.pdf");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sections List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
              .print-header p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; }
              td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
              .section-info { display: flex; align-items: center; gap: 12px; }
              .section-code { background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; }
              .section-name { font-weight: 500; }
              .section-code-text { font-size: 12px; color: #6b7280; }
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
              <h1>Sections List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Section Info</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Year Level</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                ${sections.map(section => `
                  <tr>
                    <td>
                      <div class="section-info">
                        <div class="section-code">${section.sectionName.slice(0, 2)}</div>
                        <div>
                          <div class="section-name">${section.sectionName}</div>
                          <div class="section-code-text">${section.Course?.courseName || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>${section.sectionType}</td>
                    <td>${section.sectionCapacity}</td>
                    <td>${section.sectionStatus}</td>
                    <td>${section.yearLevel}</td>
                    <td>${section.Course?.courseName || ""}</td>
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
      status: "all",
      yearLevel: "all",
      course: "all",
    });
  };

  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesSearch = section.sectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          section.Course?.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === "all" || section.sectionType === filters.type;
      const matchesStatus = filters.status === "all" || section.sectionStatus === filters.status;
      const matchesYearLevel = filters.yearLevel === "all" || section.yearLevel.toString() === filters.yearLevel;
      const matchesCourse = filters.course === "all" || section.Course?.courseName === filters.course;
      
      return matchesSearch && matchesType && matchesStatus && matchesYearLevel && matchesCourse;
    });
  }, [sections, searchTerm, filters]);

  const sortedSections = useMemo(() => {
    return [...filteredSections].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [filteredSections, sortField, sortOrder]);

  const paginatedSections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSections.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSections, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSections.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-background p-3">
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">All Sections</h1>
              <p className="text-muted-foreground text-sm">Manage and view all section information</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  className="pl-9"
                  placeholder="Search sections..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
              <Button onClick={() => { setModalSection(undefined); setModalOpen(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Section</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border bg-white shadow">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100/60">
                  <TableHead>Section Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSections.map((item) => (
                  <TableRow key={item.sectionId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">{item.sectionName}</div>
                      <div className="text-xs text-muted-foreground">{item.Course?.courseName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.sectionType === "REGULAR" ? "success" : item.sectionType === "IRREGULAR" ? "warning" : "info"}>{item.sectionType}</Badge>
                    </TableCell>
                    <TableCell>{item.sectionCapacity}</TableCell>
                    <TableCell>
                      <Badge variant={item.sectionStatus === "ACTIVE" ? "success" : "destructive"}>{item.sectionStatus}</Badge>
                    </TableCell>
                    <TableCell>{item.yearLevel}</TableCell>
                    <TableCell>{item.Course?.courseName}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedSection(item); setViewDialogOpen(true); }}>
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setModalSection(item); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSectionToDelete(item); setDeleteDialogOpen(true); }}>
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedSections.length)} of {sortedSections.length} entries
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
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setSectionToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the section "{sectionToDelete?.sectionName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSectionToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => sectionToDelete && handleDeleteSection(sectionToDelete.sectionId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data: SectionFormData) => {
          try {
            const formData = {
              ...data,
              yearLevel: parseInt(data.yearLevel, 10),
              courseId: parseInt(data.courseId, 10),
            };
            const url = modalSection ? `/api/sections/${modalSection.sectionId}` : "/api/sections";
            const method = modalSection ? "PUT" : "POST";
            const response = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to save section");

            if (modalSection) {
              setSections(sections.map(section => 
                section.sectionId === modalSection.sectionId ? { ...section, ...formData } : section
              ));
              toast.success("Section updated successfully");
            } else {
              const newSection = await response.json();
              setSections([...sections, newSection]);
              toast.success("Section created successfully");
            }

            setModalOpen(false);
          } catch (error) {
            console.error("Error saving section:", error);
            toast.error("Failed to save section");
          }
        }}
        title={modalSection ? "Edit Section" : "Add New Section"}
        submitLabel={modalSection ? "Update" : "Add"}
        defaultValues={modalSection ? {
          ...modalSection,
          yearLevel: modalSection.yearLevel.toString(),
          courseId: modalSection.courseId.toString(),
        } : undefined}
        schema={sectionFormSchema}
        fields={[
          {
            name: "sectionName",
            label: "Section Name",
            type: "text",
          },
          {
            name: "sectionType",
            label: "Type",
            type: "select",
            options: [
              { value: "REGULAR", label: "Regular" },
              { value: "IRREGULAR", label: "Irregular" },
              { value: "SUMMER", label: "Summer" },
            ],
          },
          {
            name: "sectionCapacity",
            label: "Capacity",
            type: "number",
          },
          {
            name: "sectionStatus",
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
              { value: "1", label: "1st Year" },
              { value: "2", label: "2nd Year" },
              { value: "3", label: "3rd Year" },
              { value: "4", label: "4th Year" },
            ],
          },
          {
            name: "courseId",
            label: "Course",
            type: "select",
            options: [
              { value: "1", label: "Bachelor of Science in Information Technology" },
              { value: "2", label: "Bachelor of Science in Computer Science" },
              { value: "3", label: "Bachelor of Science in Information Systems" },
            ],
          },
        ]}
      />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={open => setFilterDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Sections</DialogTitle>
            <DialogDescription>Filter the list of sections by the following criteria.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filter-type">Type</Label>
                <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="IRREGULAR">Irregular</SelectItem>
                    <SelectItem value="SUMMER">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-status">Status</Label>
                <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-year">Year Level</Label>
                <Select value={filters.yearLevel} onValueChange={value => handleFilterChange('yearLevel', value)}>
                  <SelectTrigger id="filter-year">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-course">Course</Label>
                <Select value={filters.course} onValueChange={value => handleFilterChange('course', value)}>
                  <SelectTrigger id="filter-course">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Bachelor of Science in Information Technology">BSIT</SelectItem>
                    <SelectItem value="Bachelor of Science in Computer Science">BSCS</SelectItem>
                    <SelectItem value="Bachelor of Science in Information Systems">BSIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <DialogTitle>Sort Sections</DialogTitle>
            <DialogDescription>Sort the list of sections by the following fields.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Button variant={sortField === 'sectionName' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('sectionName')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Section Name {sortField === 'sectionName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'sectionType' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('sectionType')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Type {sortField === 'sectionType' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'sectionCapacity' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('sectionCapacity')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Capacity {sortField === 'sectionCapacity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'sectionStatus' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('sectionStatus')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Status {sortField === 'sectionStatus' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button variant={sortField === 'yearLevel' ? 'default' : 'outline'} className="justify-start" onClick={() => handleSort('yearLevel')}>
              <SortAsc className="mr-2 h-4 w-4" />
              Year Level {sortField === 'yearLevel' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSortDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => { if (!open) { setViewDialogOpen(false); setSelectedSection(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <School className="h-6 w-6 text-blue-600" />
                Section Details
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedSection && (
            <div className="mt-4 space-y-6">
              <div className="rounded-lg border bg-muted p-4">
                <h2 className="text-xl font-bold mb-1">{selectedSection.sectionName}</h2>
                <div className="text-sm text-muted-foreground mb-2">{selectedSection.Course?.courseName}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selectedSection.sectionType === 'REGULAR' ? 'success' : selectedSection.sectionType === 'IRREGULAR' ? 'warning' : 'info'}>{selectedSection.sectionType}</Badge>
                  <Badge variant={selectedSection.sectionStatus === 'ACTIVE' ? 'success' : 'destructive'}>{selectedSection.sectionStatus}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Course</div>
                  <div className="text-base">{selectedSection.Course?.courseName}</div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Year Level</div>
                  <div className="text-base">{selectedSection.yearLevel}</div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Capacity</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">{selectedSection.sectionCapacity}</span>
                    <span className="text-muted-foreground">students</span>
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="font-semibold text-sm mb-1">Statistics</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Students</span>
                      <span>{selectedSection.totalStudents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Subjects</span>
                      <span>{selectedSection.totalSubjects || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setViewDialogOpen(false); setSelectedSection(null); }}>Close</Button>
            <Button onClick={() => { if (selectedSection) { setModalSection(selectedSection); setModalOpen(true); setViewDialogOpen(false); } }}>Edit Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
