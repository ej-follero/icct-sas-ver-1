"use client";

import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, School, CheckSquare, Square, ChevronUp, ChevronDown, Loader2, Inbox, RefreshCw } from "lucide-react";
import TableSearch from "@/components/reusable/Search/TableSearch";
import { Pagination } from "@/components/Pagination";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FilterDialog } from '@/components/FilterDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { TableHeaderSection } from '@/components/reusable/Table/TableHeaderSection';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableRowActions } from '@/components/reusable/Table/TableRowActions';
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { PrintLayout } from '@/components/PrintLayout';
import SectionFormDialog from '@/components/forms/SectionFormDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import AttendanceHeader from '../../../../components/AttendanceHeader';
import PageHeader from '@/components/PageHeader/PageHeader';

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

// Define FilterField type locally to match FilterDialog
type FilterField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  badgeType?: 'active' | 'range';
  minKey?: string;
  maxKey?: string;
  options?: { value: string; label: string }[];
};

// DRY constants
const DEFAULT_FILTERS = { type: "all", status: "all", yearLevel: "all", course: "all" };
const SECTION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'IRREGULAR', label: 'Irregular' },
  { value: 'SUMMER', label: 'Summer' },
];
const YEAR_LEVEL_OPTIONS = [
  { value: 'all', label: 'All Years' },
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];
const COURSE_OPTIONS = [
  { value: 'all', label: 'All Courses' },
  { value: '1', label: 'BSIT' },
  { value: '2', label: 'BSCS' },
  { value: '3', label: 'BSIS' },
];
const SECTION_COLUMNS = [
  { key: "sectionName", label: "Section Name", className: "text-blue-900 align-middle" },
  { key: "sectionType", label: "Type", className: "text-blue-800 align-middle" },
  { key: "sectionCapacity", label: "Capacity", className: "text-blue-800 text-center align-middle" },
  { key: "yearLevel", label: "Year Level", className: "text-blue-800 text-center align-middle" },
  { key: "course", label: "Course", className: "text-blue-800 text-center align-middle" },
  { key: "totalStudents", label: "Students", className: "text-blue-800 text-center align-middle" },
  { key: "totalSubjects", label: "Subjects", className: "text-blue-800 text-center align-middle" },
  { key: "sectionStatus", label: "Status", className: "text-center align-middle" },
];

function getStatusBadgeVariant(status: string) {
  return status.toLowerCase() === "active" ? "success" : "destructive";
}

function mapSectionForExport(section: Section, columns: typeof SECTION_COLUMNS) {
  const row: Record<string, any> = {};
  columns.forEach(col => {
    if (col.key === "course") {
      row[col.key] = section.Course?.courseName || "";
    } else {
      row[col.key] = section[col.key as keyof Section];
    }
  });
  return row;
}

export default function SectionsPage() {
  const [sections, setSections] = useState(initialSections);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('sectionName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [columnsToExport, setColumnsToExport] = useState<string[]>(["sectionName", "sectionType", "sectionCapacity", "sectionStatus", "yearLevel", "course"]);
  const [pendingExportType, setPendingExportType] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | undefined>();
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewSection, setViewSection] = useState<Section | undefined>();

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

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    setShowSort(false);
  };

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const filteredSections = useMemo(() => {
    let result = [...sections];
    if (search) {
      result = result.filter(
        (section) =>
          section.sectionName.toLowerCase().includes(search.toLowerCase()) ||
          section.Course?.courseName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filters.status !== 'all') {
      result = result.filter((section) => section.sectionStatus.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.type !== 'all') {
      result = result.filter((section) => section.sectionType === filters.type);
    }
    if (filters.yearLevel !== 'all') {
      result = result.filter((section) => String(section.yearLevel) === filters.yearLevel);
    }
    if (filters.course !== 'all') {
      result = result.filter((section) => String(section.courseId) === filters.course);
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
  }, [sections, search, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredSections.length / ITEMS_PER_PAGE);
  const paginatedSections = filteredSections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Checkbox logic
  const isAllSelected = paginatedSections.length > 0 && paginatedSections.every(s => selectedIds.includes(s.sectionId.toString()));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSections.map(s => s.sectionId.toString()));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Table columns
  const columns: TableListColumn<Section>[] = [
    {
      header: (
        <div className="flex justify-center items-center">
          <SharedCheckbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} />
        </div>
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...SECTION_COLUMNS.map(col => {
      if (col.key === "sectionStatus") {
        return {
          header: col.label,
          accessor: col.key,
          className: col.className,
          render: (item: Section) => (
            <Badge variant={getStatusBadgeVariant(item.sectionStatus)} className="text-xs px-3 py-1 rounded-full">
              {item.sectionStatus.charAt(0).toUpperCase() + item.sectionStatus.slice(1)}
            </Badge>
          )
        };
      }
      if (col.key === "course") {
        return {
          header: col.label,
          accessor: col.key,
          className: col.className,
          render: (item: Section) => item.Course?.courseName
        };
      }
      return {
        header: col.label,
        accessor: col.key,
        className: col.className
      };
    }),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center align-middle",
      render: (item: Section) => {
        const hasRelationships = (item.totalStudents ?? 0) > 0 || (item.totalSubjects ?? 0) > 0;
        const deleteTooltip = hasRelationships
          ? "Cannot delete section with enrolled students or assigned subjects."
          : "Delete";
        return (
          <TableRowActions
            onView={() => { setViewSection(item); setViewDialogOpen(true); }}
            onEdit={() => { setEditSection(item); setEditDialogOpen(true); }}
            onDelete={() => { if (!hasRelationships) { setSectionToDelete(item); setDeleteDialogOpen(true); } }}
            itemName={item.sectionName}
            disabled={hasRelationships}
            deleteTooltip={deleteTooltip}
          />
        );
      }
    }
  ];

  const allExportColumns = SECTION_COLUMNS.filter(col => [
    "sectionName", "sectionType", "sectionCapacity", "sectionStatus", "yearLevel", "course"
  ].includes(col.key));

  // Helper to get export data
  const getExportRows = () => {
    const rows = (selectedIds.length > 0 ? sections.filter(s => selectedIds.includes(s.sectionId.toString())) : sections)
      .map(section => mapSectionForExport(section, allExportColumns));
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

      // Set column widths based on content
      const colWidths = columnsToExport.map((_, index) => {
        const maxLength = Math.max(
          ...wsData.map(row => (row[index] || '').toString().length),
          wsData[0][index].length
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }; // Min width 10, max width 50
      });
      ws['!cols'] = colWidths;

      // Style the header row
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellRef]) continue;
        // Make headers uppercase and bold
        ws[cellRef].v = ws[cellRef].v.toString().toUpperCase();
        ws[cellRef].s = {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Center align data cells (without bold)
      for (let R = 1; R <= headerRange.e.r; ++R) {
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;
          ws[cellRef].s = {
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sections");
      XLSX.writeFile(wb, "sections.xlsx");
    } else if (pendingExportType === "pdf") {
      const doc = new jsPDF();
      // Add centered title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(12, 37, 86); // Dark blue color
      doc.text('Section List', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      // Add subtitle with date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128); // Light gray color
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated on ${currentDate}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
      // Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const headers = columnsToExport.map(col => allExportColumns.find(c => c.key === col)?.label || col);
      const pdfRows = rows.map(row => columnsToExport.map(col => row[col]));
      autoTable(doc, {
        head: [headers],
        body: pdfRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [12, 37, 86], halign: 'center' },
        bodyStyles: { halign: 'center' },
        margin: { top: 16 },
        startY: 36
      });
      doc.save("sections.pdf");
    }
    setExportModalOpen(false);
    setPendingExportType(null);
  };

  // Add refresh function
  const refreshSections = async () => {
    try {
      setLoading(true);
      // Fetch latest sections from API
      const res = await fetch('/api/sections');
      if (!res.ok) {
        throw new Error(`Failed to refresh sections: ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data received from server');
      }
      setSections(data);
      toast.success('Sections refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing sections:', err);
      toast.error('Failed to refresh sections. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add handlePrint function
  const handlePrint = () => {
    const printColumns = columnsToExport.map(key => {
      const col = allExportColumns.find(c => c.key === key);
      return {
        header: col?.label || key,
        accessor: key,
      };
    });
    const printData = filteredSections.map(section => {
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
    const printFn = PrintLayout({
      title: 'Section List',
      data: printData,
      columns: printColumns,
      totalItems: filteredSections.length,
    });
    printFn();
  };

  // Add handleBulkDelete function
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      setSections(prev => prev.filter(s => !selectedIds.includes(s.sectionId.toString())));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} section(s) deleted successfully.`);
    } catch (err) {
      toast.error("Failed to delete sections.");
    }
    setBulkDeleteLoading(false);
    setBulkDeleteDialogOpen(false);
  };

  // Update status values to lowercase
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Update status badge variant
  const getStatusVariant = (status: string) => status.toLowerCase() === "active" ? "success" : "destructive";

  // Add getItemId function
  const getItemId = (item: Section) => item.sectionId.toString();

  // Update status type
  type Status = "active" | "inactive";

  // Update getItemStatus to return correct type
  const getItemStatus = (item: Section): Status => item.sectionStatus.toLowerCase() as Status;

  // Update filterFields to use the local type
  const filterFields: FilterField[] = [
    { key: 'type', label: 'Section Type', type: 'select' as const, options: SECTION_TYPE_OPTIONS },
    { key: 'yearLevel', label: 'Year Level', type: 'select' as const, options: YEAR_LEVEL_OPTIONS },
    { key: 'course', label: 'Course', type: 'select' as const, options: COURSE_OPTIONS },
  ];

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search]);

  // Update activeFilterCount to count all non-default filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value !== 'all').length;

  // For TableHeaderSection
  const exportableColumns = [
    { accessor: 'sectionName', label: 'Section Name' },
    { accessor: 'sectionType', label: 'Type' },
    { accessor: 'sectionCapacity', label: 'Capacity' },
    { accessor: 'yearLevel', label: 'Year Level' },
    { accessor: 'course', label: 'Course' },
    { accessor: 'totalStudents', label: 'Students' },
    { accessor: 'totalSubjects', label: 'Subjects' },
    { accessor: 'sectionStatus', label: 'Status' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(exportableColumns.map(col => col.accessor));

  return (
    <>
      <PageHeader
        title="Sections"
        subtitle="Manage class sections and assignments"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Academic Management', href: '/academic-management' },
          { label: 'Sections' }
        ]}
      />
      {/* Normal UI */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
        {/* TOP */}
        <TableHeaderSection
          title="All Sections"
          description="Manage and view all section information"
          searchValue={search}
          onSearchChange={setSearch}
          columnOptions={exportableColumns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          searchPlaceholder="Search sections..."
        />

        {/* Print Header and Table - Only visible when printing */}
        <div className="print-content">
          {/* Table layout for xl+ only */}
          <div className="hidden xl:block">
            <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md relative">
              <TableList
                columns={columns}
                data={paginatedSections}
                loading={loading}
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                getItemId={getItemId}
              />
            </div>
          </div>

          {/* Card layout for small screens */}
          <div className="block xl:hidden">
            <TableCardView
              items={paginatedSections}
              selectedIds={selectedIds}
              onSelect={handleSelectRow}
              onView={(item) => {
                setViewSection(item);
                setViewDialogOpen(true);
              }}
              onEdit={(item) => {
                setEditSection(item);
                setEditDialogOpen(true);
              }}
              onDelete={(item) => {
                setSectionToDelete(item);
                setDeleteDialogOpen(true);
              }}
              getItemId={getItemId}
              getItemName={(item) => item.sectionName}
              getItemCode={(item) => item.sectionType}
              getItemStatus={getItemStatus}
              getItemDescription={(item) => `Year Level ${item.yearLevel}`}
              getItemDetails={(item) => [
                { label: 'Capacity', value: item.sectionCapacity },
                { label: 'Students', value: item.totalStudents ?? 0 },
                { label: 'Subjects', value: item.totalSubjects ?? 0 },
              ]}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Bulk Actions Bar*/}
        {selectedIds.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.length}
            entityLabel="section"
            actions={[
              {
                key: 'delete',
                label: 'Delete Selected',
                icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                onClick: () => setBulkDeleteDialogOpen(true),
                loading: loading,
                disabled: loading,
                tooltip: 'Delete selected sections',
                variant: 'destructive',
              },
            ]}
            onClear={() => setSelectedIds([])}
            className="mt-4 mb-2"
          />
        )}

        {/* PAGINATION */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSections.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Filter Dialog */}
        <FilterDialog
          open={filterDialogOpen}
          onOpenChange={setFilterDialogOpen}
          statusFilter={filters.status}
          setStatusFilter={(v) => setFilters(prev => ({ ...prev, status: v }))}
          statusOptions={statusOptions}
          advancedFilters={filters}
          setAdvancedFilters={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          fields={filterFields}
          onReset={() => setFilters({
            type: "all",
            status: "all",
            yearLevel: "all",
            course: "all",
          })}
          onApply={() => setFilterDialogOpen(false)}
          activeAdvancedCount={activeFilterCount}
          title="Filter Sections"
          tooltip="Filter sections by multiple criteria. Use advanced filters for more specific conditions."
        />

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          exportableColumns={[
            { key: 'sectionName', label: 'Section Name' },
            { key: 'sectionType', label: 'Type' },
            { key: 'sectionCapacity', label: 'Capacity' },
            { key: 'yearLevel', label: 'Year Level' },
            { key: 'course', label: 'Course' },
            { key: 'totalStudents', label: 'Students' },
            { key: 'totalSubjects', label: 'Subjects' },
            { key: 'sectionStatus', label: 'Status' },
          ]}
          exportColumns={columnsToExport}
          setExportColumns={setColumnsToExport}
          exportFormat={pendingExportType}
          setExportFormat={setPendingExportType}
          onExport={doExport}
          title="Export Sections"
          tooltip="Export section data in various formats. Choose your preferred export options."
        />

        {/* Sort Dialog */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortFieldOptions={[
            { value: 'sectionName', label: 'Section Name' },
            { value: 'sectionType', label: 'Type' },
            { value: 'sectionCapacity', label: 'Capacity' },
            { value: 'yearLevel', label: 'Year Level' },
            { value: 'sectionStatus', label: 'Status' },
          ]}
          onApply={handleApplyFilters}
          onReset={() => {
            setSortField('sectionName');
            setSortOrder('asc');
          }}
          title="Sort Sections"
          tooltip="Sort sections by different fields. Choose the field and order to organize your list."
        />

        {/* Section Form Dialog */}
        <SectionFormDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          type="create"
          onSuccess={(newSection: Section) => {
            setSections((prev) => [newSection, ...prev]);
            setAddDialogOpen(false);
            toast.success("Section added successfully");
          }}
        />

        {/* Edit Section Dialog */}
        <SectionFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          type="update"
          data={editSection}
          onSuccess={(updatedSection: SectionFormData) => {
            if (!editSection) return;
            setSections((prev) => prev.map(s =>
              s.sectionId === editSection.sectionId
                ? { ...s, ...updatedSection, yearLevel: Number(updatedSection.yearLevel), courseId: Number(updatedSection.courseId) }
                : s
            ));
            setEditDialogOpen(false);
            toast.success("Section updated successfully");
          }}
        />

        {/* Section View Dialog */}
        <ViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          title={viewSection?.sectionName || 'Section Details'}
          status={viewSection ? {
            value: viewSection.sectionStatus,
            variant: viewSection.sectionStatus === 'ACTIVE' ? 'success' : 'destructive',
          } : undefined}
          sections={viewSection ? [
            {
              title: 'Basic Information',
              fields: [
                { label: 'Section Name', value: viewSection.sectionName },
                { label: 'Type', value: viewSection.sectionType },
                { label: 'Year Level', value: viewSection.yearLevel },
                { label: 'Course', value: viewSection.Course?.courseName || '' },
              ],
              columns: 2,
            },
            {
              title: 'Capacity & Stats',
              fields: [
                { label: 'Capacity', value: viewSection.sectionCapacity },
                { label: 'Students', value: viewSection.totalStudents ?? 0 },
                { label: 'Subjects', value: viewSection.totalSubjects ?? 0 },
              ],
              columns: 2,
            },
          ] : []}
        />

        {/* Delete Section Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemName={sectionToDelete?.sectionName}
          onDelete={() => {
            if (!sectionToDelete) return;
            setSections(prev => prev.filter(s => s.sectionId !== sectionToDelete.sectionId));
            setDeleteDialogOpen(false);
            setSectionToDelete(null);
            toast.success("Section deleted successfully");
          }}
          description="Are you sure you want to delete this section? This action cannot be undone."
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          itemName={`${selectedIds.length} selected section(s)`}
          onDelete={handleBulkDelete}
          loading={bulkDeleteLoading}
          description={`Are you sure you want to delete ${selectedIds.length} selected section(s)? This action cannot be undone.`}
        />
      </div>
    </>
  );
}
