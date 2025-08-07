"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import CourseFormDialog from '@/components/forms/CourseFormDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap } from "lucide-react";
import { ImportDialog } from "@/components/reusable/Dialogs/ImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/reusable/Dialogs/SortDialog';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { PrintLayout } from '@/components/PrintLayout';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import { TableRowActions } from '@/components/reusable/Table/TableRowActions';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableExpandedRow } from '@/components/reusable/Table/TableExpandedRow';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import PageHeader from '@/components/PageHeader/PageHeader';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardHeader } from "@/components/ui/card";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { SummaryCardSkeleton, PageSkeleton } from '@/components/reusable/Skeleton';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeInfo, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { Pagination } from "@/components/Pagination";
import { TableHeaderSection } from '@/components/reusable/Table/TableHeaderSection';

type CourseStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | "PENDING_REVIEW";

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  units: number;
  description?: string;
  status: CourseStatus;
  totalStudents: number;
  totalInstructors: number;
  createdAt: string;
  updatedAt: string;
  courseType: "MANDATORY" | "ELECTIVE";
  [key: string]: string | number | undefined;
}

type SortField = 'name' | 'code' | 'department' | 'units' | 'totalStudents' | 'totalInstructors' | 'status';
type SortOrder = 'asc' | 'desc';
const ITEMS_PER_PAGE = 10;

interface ColumnFilter {
  field: string;
  value: string;
}

type MultiSortField = { field: SortField; order: SortOrder };

type FuseResultMatch = {
  key: string;
  indices: readonly [number, number][];
};

interface FuseResult<T> {
  item: T;
  refIndex: number;
  matches?: Array<{
    key: string;
    indices: readonly [number, number][];
  }>;
}

const courseSortFieldOptions: SortFieldOption<string>[] = [
  { value: 'name', label: 'Course Name' },
  { value: 'code', label: 'Code' },
  { value: 'department', label: 'Department' },
  { value: 'units', label: 'Units' },
  { value: 'totalInstructors', label: 'Instructors' },
  { value: 'totalStudents', label: 'Students' },
  { value: 'status', label: 'Status' },
];

type CourseSortField = 'name' | 'code' | 'department' | 'units' | 'totalInstructors' | 'totalStudents' | 'status';
type CourseSortOrder = 'asc' | 'desc';

const ColumnFilterDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ColumnFilter[];
  onFiltersChange: (filters: ColumnFilter[]) => void;
}> = ({ open, onOpenChange, filters, onFiltersChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
            Column Filters
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  Filter courses by specific column values.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={filter.field}
                onValueChange={(value) => {
                  const newFilters = [...filters];
                  newFilters[index] = { ...filter, field: value };
                  onFiltersChange(newFilters);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Course Name</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={filter.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newFilters = [...filters];
                  newFilters[index] = { ...filter, value: e.target.value };
                  onFiltersChange(newFilters);
                }}
                placeholder="Filter value..."
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newFilters = filters.filter((_, i) => i !== index);
                  onFiltersChange(newFilters);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              onFiltersChange([...filters, { field: 'name', value: '' }]);
            }}
            className="w-full"
          >
            Add Filter
          </Button>
        </div>
        <DialogFooter className="gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              onFiltersChange([]);
            }}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Reset
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Centralized course columns definition
const courseColumns = [
  { key: 'name', label: 'Course Name', accessor: 'name', className: 'text-blue-900' },
  { key: 'code', label: 'Code', accessor: 'code', className: 'text-blue-900' },
  { key: 'department', label: 'Department', accessor: 'department', className: 'text-blue-900' },
  { key: 'units', label: 'Units', accessor: 'units', className: 'text-center text-blue-900' },
  { key: 'totalInstructors', label: 'Instructors', accessor: 'totalInstructors', className: 'text-center text-blue-900' },
  { key: 'totalStudents', label: 'Students', accessor: 'totalStudents', className: 'text-center text-blue-900' },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center' },
];

// Use accessor/label for TableHeaderSection compatibility
const exportableColumns: { accessor: string; label: string }[] = courseColumns.map((col) => ({ accessor: col.key, label: col.label }));
// For export dialogs, use the old { key, label } version
const exportableColumnsForExport: { key: string; label: string }[] = courseColumns.map((col) => ({ key: col.key, label: col.label }));

export default function CourseListPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<CourseSortField>('name');
  const [sortOrder, setSortOrder] = useState<CourseSortOrder>('asc');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortFields, setSortFields] = useState<MultiSortField[]>([
    { field: 'name', order: 'asc' }
  ]);
  const [advancedFilters, setAdvancedFilters] = useState({
    department: '',
    minUnits: '',
    maxUnits: '',
    minStudents: '',
    maxStudents: '',
    minInstructors: '',
    maxInstructors: ''
  });

  // Add loading states for different actions
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);

  // Add status mapping function
  const mapStatusToLowerCase = (status: CourseStatus): "active" | "inactive" => {
    return status === "ACTIVE" ? "active" : "inactive";
  };

  // Helper Functions
  const highlightMatch = (text: string, matches: readonly [number, number][] | undefined) => {
    if (!matches || matches.length === 0) return text;
    let result = '';
    let lastIndex = 0;
    matches.forEach(([start, end], i) => {
      result += text.slice(lastIndex, start);
      result += `<mark class='bg-yellow-200 text-yellow-900 rounded px-1'>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });
    result += text.slice(lastIndex);
    return result;
  };

  // Add Fuse.js setup with proper types
  const fuse = useMemo(() => new Fuse<Course>(courses, {
    keys: ["name", "code", "department"],
    threshold: 0.4,
    includeMatches: true,
  }), [courses]);

  const fuzzyResults = useMemo(() => {
    if (!searchInput) return courses.map((c: Course, i: number) => ({ item: c, refIndex: i }));
    return fuse.search(searchInput) as FuseResult<Course>[];
  }, [searchInput, fuse, courses]);

  // Update filtered courses to include column filters and status filter
  const filteredCourses = useMemo(() => {
    let filtered = fuzzyResults.map((r: FuseResult<Course>) => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    // Apply column filters
    if (columnFilters.length > 0) {
      filtered = filtered.filter(course => {
        return columnFilters.every(filter => {
          const value = course[filter.field as keyof Course]?.toString().toLowerCase() || '';
          return value.includes(filter.value.toLowerCase());
        });
      });
    }

    // Apply multi-sort
    if (sortFields.length > 0) {
      filtered.sort((a, b) => {
        for (const { field, order } of sortFields) {
          const aValue = a[field];
          const bValue = b[field];
          
          if (aValue === bValue) continue;
          
          const comparison = aValue < bValue ? -1 : 1;
          return order === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [fuzzyResults, columnFilters, statusFilter, sortFields]);

  // Add pagination
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredCourses.slice(start, end);
  }, [filteredCourses, currentPage]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  const isAllSelected = paginatedCourses.length > 0 && paginatedCourses.every(c => selectedIds.includes(c.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCourses.map(c => c.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Table columns
  const columns: TableListColumn<Course>[] = [
    {
      header: (
        <SharedCheckbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all courses"
        />
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...courseColumns.map(col => {
      if (col.key === 'name') {
        return {
          header: col.label,
          accessor: col.accessor,
          className: col.className,
          render: (item: Course) => {
            const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<Course> | undefined;
            const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "name")?.indices;
            return (
              <div 
                className="text-sm font-medium text-blue-900"
                dangerouslySetInnerHTML={{ __html: highlightMatch(item.name, nameMatches) }}
              />
            );
          }
        };
      }
      if (col.key === 'code') {
        return {
          header: col.label,
          accessor: col.accessor,
          className: col.className,
          render: (item: Course) => {
            const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<Course> | undefined;
            const codeMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "code")?.indices;
            return (
              <div 
                className="text-sm text-blue-900"
                dangerouslySetInnerHTML={{ __html: highlightMatch(item.code, codeMatches) }}
              />
            );
          }
        };
      }
      if (col.key === 'department') {
        return {
          header: col.label,
          accessor: col.accessor,
          className: col.className,
          render: (item: Course) => {
            const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<Course> | undefined;
            const departmentMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "department")?.indices;
            return (
              <div 
                className="text-sm text-blue-900"
                dangerouslySetInnerHTML={{ __html: highlightMatch(item.department, departmentMatches) }}
              />
            );
          }
        };
      }
      if (col.key === 'status') {
        return {
          header: col.label,
          accessor: col.accessor,
          className: col.className,
          render: (item: Course) => (
            <Badge variant={item.status === "ACTIVE" ? "success" : item.status === "INACTIVE" ? "destructive" : item.status === "ARCHIVED" ? "secondary" : "warning"}>
              {item.status.toUpperCase()}
            </Badge>
          )
        };
      }
      return {
        header: col.label,
        accessor: col.accessor,
        className: col.className
      };
    }),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item: Course) => (
        <TableRowActions
          onView={() => {
            setSelectedCourse(item);
            setViewModalOpen(true);
          }}
          onEdit={() => {
            setSelectedCourse(item);
            setEditModalOpen(true);
          }}
          onDelete={() => {
            setSelectedCourse(item);
            setDeleteModalOpen(true);
          }}
          itemName={item.name}
          disabled={item.status === "ACTIVE" || item.totalStudents > 0 || item.totalInstructors > 0}
          deleteTooltip={
            item.status === "ACTIVE" 
              ? "Cannot delete an active course" 
              : item.totalStudents > 0 
                ? "Cannot delete course with enrolled students"
                : item.totalInstructors > 0 
                  ? "Cannot delete course with assigned instructors"
                  : undefined
          }
        />
      )
    }
  ];

  // Export to CSV handler
  const handleExport = async () => {
    if (!exportFormat) return;

    try {
      const selectedCourses = selectedIds.length > 0 
        ? courses.filter(course => selectedIds.includes(course.id))
        : filteredCourses;

      const visibleColumns = courseColumns.filter(col => exportColumns.includes(col.key));

      switch (exportFormat) {
        case 'pdf':
          await handleExportPDF(selectedCourses, visibleColumns);
          break;
        case 'excel':
          await handleExportExcel(selectedCourses, visibleColumns);
          break;
        case 'csv':
          handleExportCSV(selectedCourses, visibleColumns);
          break;
      }

      toast.success(`Courses exported to ${exportFormat.toUpperCase()} successfully.`);
      setExportDialogOpen(false);
    } catch (error) {
      toast.error("Failed to export courses. Please try again.");
    }
  };

  const handleExportPDF = async (courses: Course[], columns: typeof courseColumns) => {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Courses List', 14, 15);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
    
    // Prepare table data with proper type handling
    const tableData = courses.map(course => 
      columns.map(col => {
        const value = course[col.key];
        if (col.key === 'status' && typeof value === 'string') {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return value !== undefined ? String(value) : ''; // Handle undefined values
      })
    ) as string[][]; // Type assertion to match autoTable's expected type
    
    // Add table
    autoTable(doc, {
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Save the PDF
    doc.save('courses-list.pdf');
  };

  const handleExportExcel = async (courses: Course[], columns: typeof courseColumns) => {
    const XLSX = await import('xlsx');
    
    // Prepare data
    const data = courses.map(course => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const value = course[col.key];
        if (col.key === 'status' && typeof value === 'string') {
          row[col.label] = value.charAt(0).toUpperCase() + value.slice(1);
        } else {
          row[col.label] = value;
        }
      });
      return row;
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    
    // Save file
    XLSX.writeFile(wb, 'courses-list.xlsx');
  };

  const handleExportCSV = (courses: Course[], columns: typeof courseColumns) => {
    // Prepare headers
    const headers = columns.map(col => col.label);
    
    // Prepare data rows
    const rows = courses.map(course => 
      columns.map(col => {
        const value = course[col.key];
        if (col.key === 'status' && typeof value === 'string') {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return String(value); // Convert all values to string for CSV
      })
    );
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'courses-list.csv';
    link.click();
  };

  // Print handler
  const handlePrint = () => {
    const printColumns = courseColumns.map(col => ({ header: col.label, accessor: col.accessor }));

    const printFunction = PrintLayout({
      title: 'Courses List',
      data: filteredCourses,
      columns: printColumns,
      totalItems: filteredCourses.length,
    });

    printFunction();
  };

  // Fetch courses data (used for both initial load and refresh)
  const fetchCourses = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCourses(data);
        setError(null);
        if (refresh) toast.success('Courses refreshed successfully');
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      if (refresh) toast.error('Failed to refresh courses. Please try again later.');
      else toast.error('Failed to load courses. Please try again later.');
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Delete course
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to delete course");
      }

      toast.success("Course deleted successfully");
      await fetchCourses(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Bulk delete courses
  const handleBulkDelete = async () => {
    try {
      const response = await fetch("/api/courses/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to delete courses");
      }

      toast.success("Selected courses deleted successfully");
      setSelectedIds([]);
      await fetchCourses(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenBulkActionsDialog = () => {
    // Implementation for bulk actions dialog
    console.log('Opening bulk actions dialog');
  };

  const handleExportSelectedCourses = (selectedCourses: Course[]) => {
    if (selectedCourses.length === 0) {
      toast.error('No courses selected for export');
      return;
    }
    handleExportCSV(selectedCourses, courseColumns);
  };

  const selectedCourses = courses.filter(course => selectedIds.includes(course.id));

  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(col => col.accessor));
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
      <PageHeader
        title="Courses"
        subtitle="Manage academic courses and their information"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Academic Management", href: "/academic-management" },
          { label: "Courses" }
        ]}
      />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<BookOpen className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Courses"
            value={courses.length}
            valueClassName="text-green-600"
          />
          <SummaryCard
            icon={<UserCheck className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
            label="Active Courses"
            value={courses.filter(c => c.status === 'ACTIVE').length}
            valueClassName="text-blue-600"
          />
          <SummaryCard
            icon={<UserX className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
            label="Inactive Courses"
            value={courses.filter(c => c.status === 'INACTIVE').length}
            valueClassName="text-yellow-600"
          />
          <SummaryCard
            icon={<GraduationCap className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Students"
            value={courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0)}
            valueClassName="text-purple-600"
        />
      </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential tools and shortcuts"
          icon={
            <div className="w-6 h-6 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          }
          actionCards={[
            {
              id: 'add-course',
              label: 'Add Course',
              description: 'Create new course',
              icon: <Plus className="w-5 h-5 text-white" />,
              onClick: () => { 
                setSelectedCourse(null); 
                setAddModalOpen(true); 
              }
            },
            {
              id: 'import-data',
              label: 'Import Data',
              description: 'Import courses from file',
              icon: <Upload className="w-5 h-5 text-white" />,
              onClick: () => setImportDialogOpen(true)
            },
            {
              id: 'print-page',
              label: 'Print Page',
              description: 'Print course list',
              icon: <Printer className="w-5 h-5 text-white" />,
              onClick: handlePrint
            },
            {
              id: 'visible-columns',
              label: 'Visible Columns',
              description: 'Manage table columns',
              icon: <Columns3 className="w-5 h-5 text-white" />,
              onClick: () => setVisibleColumnsDialogOpen(true)
            },
            {
              id: 'refresh-data',
              label: 'Refresh Data',
              description: 'Reload course data',
              icon: isRefreshing ? (
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              onClick: () => fetchCourses(true),
              disabled: isRefreshing,
              loading: isRefreshing
            },
            {
              id: 'sort-options',
              label: 'Sort Options',
              description: 'Configure sorting',
              icon: <List className="w-5 h-5 text-white" />,
              onClick: () => setSortDialogOpen(true)
            }
          ]}
          lastActionTime="2 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={true}
          onCollapseChange={(collapsed) => {
            console.log('Quick Actions Panel collapsed:', collapsed);
          }}
      />
    </div>

        {/* Main Content Area */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
          <CardHeader className="p-0">
            {/* Blue Gradient Header - flush to card edge, no rounded corners */}
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
              <div className="py-4 sm:py-6">
                <div className="flex items-center gap-3 px-4 sm:px-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Course List</h3>
                    <p className="text-blue-100 text-sm">Search and filter course information</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          {/* Search and Filter Section */}
          <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-end">
              {/* Search Bar */}
              <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                />
              </div>
              
              {/* Quick Filter Dropdowns */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem> 
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                    <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
          </div>
          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="mt-2 sm:mt-3 px-2 sm:px-3 lg:px-6 max-w-full">
              <BulkActionsBar
                selectedCount={selectedIds.length}
                entityLabel="course"
                actions={[
                  {
                    key: "bulk-actions",
                    label: "Enhanced Bulk Actions",
                    icon: <Settings className="w-4 h-4 mr-2" />,
                    onClick: handleOpenBulkActionsDialog,
                    tooltip: "Open enhanced bulk actions dialog with status updates, notifications, and exports",
                    variant: "default"
                  },
                  {
                    key: "export",
                    label: "Quick Export",
                    icon: <Download className="w-4 h-4 mr-2" />,
                    onClick: () => handleExportSelectedCourses(selectedCourses),
                    tooltip: "Quick export selected courses to CSV"
                  },
                  {
                    key: "delete",
                    label: "Delete Selected",
                    icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                    onClick: handleBulkDelete,
                    loading: loading,
                    disabled: loading,
                    tooltip: "Delete selected courses (cannot be undone)",
                    variant: "destructive"
                  }
                ]}
                onClear={() => setSelectedIds([])}
              />
              </div>
            )}
          {/* Table Content */}
          <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
            {/* Table layout for xl+ only */}
            <div className="hidden xl:block overflow-x-auto max-w-full">
            <TableList
              columns={columns}
              data={paginatedCourses}
              loading={loading}
              selectedIds={selectedIds}
                emptyMessage={null}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              getItemId={(item) => item.id}
                className="border-0 shadow-none max-w-full"
            />
        </div>
        {/* Card layout for small screens */}
            <div className="block xl:hidden p-2 sm:p-3 lg:p-4 max-w-full">
              {!loading && filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <EmptyState
                    icon={<BookOpen className="w-6 h-6 text-blue-400" />}
                    title="No courses found"
                    description="Try adjusting your search criteria or filters to find the courses you're looking for."
                    action={
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                          onClick={() => fetchCourses(true)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Data
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : (
          <TableCardView
            items={paginatedCourses}
            selectedIds={selectedIds}
            onSelect={handleSelectRow}
            onView={(item) => {
              setSelectedCourse(item);
                    setViewModalOpen(true);
            }}
            onEdit={(item) => {
              setSelectedCourse(item);
              setEditModalOpen(true);
            }}
            onDelete={(item) => {
              setSelectedCourse(item);
              setDeleteModalOpen(true);
            }}
            getItemId={(item) => item.id}
            getItemName={(item) => item.name}
            getItemCode={(item) => item.code}
            getItemStatus={(item) => mapStatusToLowerCase(item.status)}
            getItemDescription={(item) => item.description}
            getItemDetails={(item) => [
              { label: 'Department', value: item.department },
              { label: 'Units', value: item.units },
              { label: 'Instructors', value: item.totalInstructors },
              { label: 'Students', value: item.totalStudents },
            ]}
            disabled={(item) => item.status === "ACTIVE" || item.totalStudents > 0 || item.totalInstructors > 0}
            deleteTooltip={(item) => 
              item.status === "ACTIVE" 
                ? "Cannot delete an active course" 
                : item.totalStudents > 0 
                  ? "Cannot delete course with enrolled students"
                  : item.totalInstructors > 0 
                    ? "Cannot delete course with assigned instructors"
                    : undefined
            }
            isLoading={loading}
          />
              )}
        </div>
      </div>
          {/* Pagination */}
          <TablePagination
            page={currentPage}
            pageSize={ITEMS_PER_PAGE}
          totalItems={filteredCourses.length}
          onPageChange={setCurrentPage}
            onPageSizeChange={setItemsPerPage}
            pageSizeOptions={[10, 25, 50, 100]}
            loading={loading}
        />
        </Card>
        </div>
      </div>

      {/* Add Course Dialog */}
      <CourseFormDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type="create"
        onSuccess={() => {
          setAddModalOpen(false);
          fetchCourses();
        }}
      />

      {/* Keep existing dialogs */}
      <ConfirmDeleteDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedCourse(null);
        }}
        itemName={selectedCourse?.name}
        onDelete={() => { if (selectedCourse) handleDelete(selectedCourse.id); }}
        onCancel={() => { setDeleteModalOpen(false); setSelectedCourse(null); }}
        canDelete={true}
        deleteError={undefined}
        description={selectedCourse ? `Are you sure you want to delete the course "${selectedCourse.name}"? This action cannot be undone.` : undefined}
      />

      <CourseFormDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        type="update"
        data={selectedCourse || undefined}
        id={selectedCourse?.id}
        onSuccess={() => {
          setEditModalOpen(false);
          fetchCourses();
        }}
      />

      {/* FilterDialog removed - interface mismatch */}

      <SortDialog
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        sortField={sortField}
        setSortField={field => setSortField(field as CourseSortField)}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortFieldOptions={courseSortFieldOptions}
        onApply={() => {
          setSortFields([{ field: sortField as SortField, order: sortOrder }]);
        }}
        onReset={() => {
          setSortField('name');
          setSortOrder('asc');
          setSortFields([{ field: 'name' as SortField, order: 'asc' }]);
        }}
        title="Sort Courses"
        tooltip="Sort courses by different fields. Choose the field and order to organize your list."
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportableColumns={exportableColumnsForExport}
        exportColumns={exportColumns}
        setExportColumns={setExportColumns}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onExport={handleExport}
        title="Export Courses"
        tooltip="Export course data in various formats. Choose your preferred export options."
      />

      <ColumnFilterDialog
        open={showColumnFilters}
        onOpenChange={setShowColumnFilters}
        filters={columnFilters}
        onFiltersChange={setColumnFilters}
      />

      {/* View Course Dialog */}
      <ViewDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        title={selectedCourse?.name || ''}
        subtitle={selectedCourse?.code}
        status={selectedCourse ? {
          value: selectedCourse.status,
          variant: selectedCourse.status === "ACTIVE" ? "success" : 
                  selectedCourse.status === "INACTIVE" ? "destructive" : 
                  selectedCourse.status === "ARCHIVED" ? "secondary" : "warning"
        } : undefined}
        sections={[
          {
            fields: [
              { label: 'Department', value: selectedCourse?.department || '' },
              { label: 'Units', value: selectedCourse?.units || 0, type: 'number' },
              { label: 'Course Type', value: selectedCourse?.courseType || '' }
            ]
          },
          {
            fields: [
              { label: 'Total Students', value: selectedCourse?.totalStudents || 0, type: 'number' },
              { label: 'Total Instructors', value: selectedCourse?.totalInstructors || 0, type: 'number' },
              { label: 'Last Updated', value: selectedCourse?.updatedAt || '', type: 'date' }
            ]
          }
        ]}
        description={selectedCourse?.description}
        tooltipText="View detailed course information"
      />
    </div>
  );
} 
