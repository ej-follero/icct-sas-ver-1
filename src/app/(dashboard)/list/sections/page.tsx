"use client";

import React from "react";
import { useState, useMemo, useEffect } from "react";
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
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, School, CheckSquare, Square, ChevronUp, ChevronDown, Loader2, Inbox } from "lucide-react";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import FilterBar from './FilterBar';

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

// Update the form schema to match the form fields
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

// Mock data - replace with actual API calls later
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

// Checkbox component for row selection
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

const ITEMS_PER_PAGE = 10;

export default function SectionsPage() {
  const [sections, setSections] = useState(initialSections);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('sectionName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [columnStatusFilter, setColumnStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<Section | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    yearLevel: "all",
    course: "all",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [columnsToExport, setColumnsToExport] = useState<string[]>(["sectionName", "sectionType", "sectionCapacity", "sectionStatus", "yearLevel", "course"]);
  const [pendingExportType, setPendingExportType] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Section[] | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setShowSort(false);
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

  const handleDeleteSection = (id: number) => {
    const deleted = sections.filter(section => section.sectionId === id);
    setSections(sections.filter(section => section.sectionId !== id));
    setRecentlyDeleted(deleted);
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => setRecentlyDeleted(null), 5000);
    setUndoTimeout(timeout);
    toast(
      <span>
        Section deleted. <button className="underline ml-2" onClick={() => {
          setSections(prev => [...deleted, ...prev]);
          setRecentlyDeleted(null);
          if (undoTimeout) clearTimeout(undoTimeout);
        }}>Undo</button>
      </span>,
      { duration: 5000 }
    );
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    setShowSort(false);
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
    let result = [...sections];
    if (search) {
      result = result.filter(
        (section) =>
          section.sectionName.toLowerCase().includes(search.toLowerCase()) ||
          section.Course?.courseName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (columnStatusFilter !== 'all') {
      result = result.filter((section) => section.sectionStatus === columnStatusFilter);
    }
    result.sort((a, b) => {
      let aValue: string | number = a[sortField as keyof Section] as string | number;
      let bValue: string | number = b[sortField as keyof Section] as string | number;
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return ((aValue as number) - (bValue as number)) * modifier;
    });
    return result;
  }, [sections, search, columnStatusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredSections.length / ITEMS_PER_PAGE);
  const paginatedSections = filteredSections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Checkbox logic
  const isAllSelected = paginatedSections.length > 0 && paginatedSections.every(s => selectedIds.includes(s.sectionId));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSections.map(s => s.sectionId));
    }
  };
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Table columns
  const columns = [
    { header: <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} />, accessor: "select" },
    { header: "Section Name", accessor: "sectionName" },
    { header: "Type", accessor: "sectionType" },
    { header: "Capacity", accessor: "sectionCapacity" },
    { header: "Status", accessor: "sectionStatus" },
    { header: "Year Level", accessor: "yearLevel" },
    { header: "Course", accessor: "course" },
    { header: "Actions", accessor: "actions" },
  ];

  // Table row renderer
  const renderRow = (item: Section) => (
    <TableRow
      key={item.sectionId}
      className={selectedIds.includes(item.sectionId) ? "bg-blue-50" : ""}
      tabIndex={0}
      aria-label={`Section ${item.sectionName}`}
      aria-expanded={expandedRow === item.sectionId}
      onClick={() => setExpandedRow(expandedRow === item.sectionId ? null : item.sectionId)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          setExpandedRow(expandedRow === item.sectionId ? null : item.sectionId);
          e.preventDefault();
        }
      }}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      <TableCell>
        <Checkbox checked={selectedIds.includes(item.sectionId)} onChange={() => handleSelectRow(item.sectionId)} aria-label={`Select section ${item.sectionName}`} />
      </TableCell>
      <TableCell>{item.sectionName}</TableCell>
      <TableCell><Badge variant={item.sectionType === "REGULAR" ? "success" : item.sectionType === "IRREGULAR" ? "warning" : "info"}>{item.sectionType}</Badge></TableCell>
      <TableCell>{item.sectionCapacity}</TableCell>
      <TableCell><Badge variant={item.sectionStatus === "ACTIVE" ? "success" : "destructive"}>{item.sectionStatus}</Badge></TableCell>
      <TableCell>{item.yearLevel}</TableCell>
      <TableCell>{item.Course?.courseName}</TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          <TooltipProvider><Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`View details for section ${item.sectionName}`}>
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
          </TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip></TooltipProvider>
          <TooltipProvider><Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Edit section ${item.sectionName}`} onClick={e => { e.stopPropagation(); setModalSection(item); setModalOpen(true); }}>
              <Pencil className="h-4 w-4 text-green-600" />
            </Button>
          </TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip></TooltipProvider>
          <TooltipProvider><Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Delete section ${item.sectionName}`} onClick={e => { e.stopPropagation(); setSectionToDelete(item); setDeleteDialogOpen(true); }}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip></TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );

  const allExportColumns = [
    { key: "sectionName", label: "Section Name" },
    { key: "sectionType", label: "Type" },
    { key: "sectionCapacity", label: "Capacity" },
    { key: "sectionStatus", label: "Status" },
    { key: "yearLevel", label: "Year Level" },
    { key: "course", label: "Course" },
  ];

  // Helper to get export data
  const getExportRows = () => {
    const rows = (selectedIds.length > 0 ? sections.filter(s => selectedIds.includes(s.sectionId)) : sections)
      .map(section => {
        const row: Record<string, any> = {};
        columnsToExport.forEach(col => {
          if (col === "course") {
            row[col] = section.Course?.courseName || "";
          } else {
            row[col] = section[col as keyof typeof section];
          }
        });
        return row;
      });
    return rows;
  };

  // Export handlers
  const handleExport = (type: "csv" | "excel" | "pdf") => {
    setPendingExportType(type);
    setExportModalOpen(true);
  };

  const doExport = () => {
    const rows = getExportRows();
    if (pendingExportType === "csv") {
      const csvRows = [columnsToExport.map(col => allExportColumns.find(c => c.key === col)?.label || col), ...rows.map(row => columnsToExport.map(col => row[col]))];
      const csvContent = csvRows.map(row => row.map(String).map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sections.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (pendingExportType === "excel") {
      const wsData = [columnsToExport.map(col => allExportColumns.find(c => c.key === col)?.label || col), ...rows.map(row => columnsToExport.map(col => row[col]))];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sections");
      XLSX.writeFile(wb, "sections.xlsx");
    } else if (pendingExportType === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(12);
      const headers = columnsToExport.map(col => allExportColumns.find(c => c.key === col)?.label || col);
      const pdfRows = rows.map(row => columnsToExport.map(col => row[col]));
      (doc as any).autoTable({ head: [headers], body: pdfRows, styles: { fontSize: 8 }, headStyles: { fillColor: [12, 37, 86] }, margin: { top: 16 } });
      doc.save("sections.pdf");
    }
    setExportModalOpen(false);
    setPendingExportType(null);
  };

  // Simulate loading for demonstration (replace with real API loading logic)
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [sections]);

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">All Sections</h1>
        <p className="text-sm text-blue-700/80 mb-4">Manage and view all section information</p>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <FilterBar
              search={search}
              setSearch={setSearch}
              filters={filters}
              setFilters={setFilters}
              sortField={sortField}
              setSortField={(v: string) => setSortField(v as SortField)}
              sortOrder={sortOrder}
              setSortOrder={(v: string) => setSortOrder(v as SortOrder)}
              columnStatusFilter={columnStatusFilter}
              setColumnStatusFilter={setColumnStatusFilter}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showSort={showSort}
              setShowSort={setShowSort}
            />
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Export">
                        <FileDown className="h-4 w-4 text-blue-700" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-white/90 border border-blue-100 shadow-lg rounded-xl mt-2">
                      <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("excel")}>Export as Excel</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Print" onClick={() => {
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
                  }}>
                    <Printer className="h-4 w-4 text-blue-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="default"
              className="bg-blue-700 hover:bg-blue-800 text-white shadow flex items-center gap-2 px-4 py-2"
              aria-label="Add Section"
              onClick={() => {
                setModalSection(undefined);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Section</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 mb-4 shadow">
          <span className="font-medium text-blue-900">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => {
              const deleted = sections.filter(s => selectedIds.includes(s.sectionId));
              setSections(sections.filter(s => !selectedIds.includes(s.sectionId)));
              setSelectedIds([]);
              setRecentlyDeleted(deleted);
              if (undoTimeout) clearTimeout(undoTimeout);
              const timeout = setTimeout(() => setRecentlyDeleted(null), 5000);
              setUndoTimeout(timeout);
              toast(
                <span>
                  {deleted.length} section(s) deleted. <button className="underline ml-2" onClick={() => {
                    setSections(prev => [...deleted, ...prev]);
                    setRecentlyDeleted(null);
                    if (undoTimeout) clearTimeout(undoTimeout);
                  }}>Undo</button>
                </span>,
                { duration: 5000 }
              );
            }}>
              Delete Selected
            </Button>
            <Select onValueChange={status => {
              setSections(sections.map(s => selectedIds.includes(s.sectionId) ? { ...s, sectionStatus: status as "ACTIVE" | "INACTIVE" } : s));
              setSelectedIds([]);
              // TODO: Add toast
            }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Change Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Set Active</SelectItem>
                <SelectItem value="INACTIVE">Set Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-100/60 sticky top-0 z-10">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={col.accessor !== 'select' && col.accessor !== 'actions' ? 'cursor-pointer select-none' : ''}
                  onClick={col.accessor !== 'select' && col.accessor !== 'actions' ? () => {
                    setSortField(col.accessor as SortField);
                    setSortOrder(sortField === col.accessor ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
                  } : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortField === col.accessor && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={"skeleton-" + idx}>
                  {columns.map((col, cidx) => (
                    <TableCell key={cidx}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedSections.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center" aria-live="polite">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="w-10 h-10 mb-2 text-gray-300" />
                    <span className="font-semibold">No sections found</span>
                    <span className="text-sm">Try adjusting your filters or search.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSections.map(item => (
                <React.Fragment key={item.sectionId}>
                  {renderRow(item)}
                  {expandedRow === item.sectionId && (
                    <TableRow key={item.sectionId + '-expanded'}>
                      <TableCell colSpan={columns.length} className="bg-blue-50">
                        <div className="py-4 px-6">
                          <div className="font-semibold mb-2">Section Details</div>
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <div className="text-xs text-muted-foreground">Total Students</div>
                              <div className="font-bold">{item.totalStudents ?? 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Total Subjects</div>
                              <div className="font-bold">{item.totalSubjects ?? 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Course</div>
                              <div>{item.Course?.courseName ?? 'N/A'}</div>
                            </div>
                            {/* Placeholder for students or more details */}
                            <div>
                              <div className="text-xs text-muted-foreground">Students</div>
                              <div className="italic text-gray-400">(Student list placeholder)</div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredSections.length)} of {filteredSections.length} entries
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={open => { if (!open) { setDeleteDialogOpen(false); setSectionToDelete(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete the section "{sectionToDelete?.sectionName}"? This action cannot be undone.</div>
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
      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Columns to Export</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mb-4">
            {allExportColumns.map(col => (
              <label key={col.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnsToExport.includes(col.key)}
                  onChange={e => {
                    if (e.target.checked) setColumnsToExport(cols => [...cols, col.key]);
                    else setColumnsToExport(cols => cols.filter(k => k !== col.key));
                  }}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>Cancel</Button>
            <Button onClick={doExport}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
