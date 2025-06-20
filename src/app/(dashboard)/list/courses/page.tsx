"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  BadgeInfo,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Fuse, { FuseResult as FuseResultType } from "fuse.js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { courseSchema } from "@/lib/validations/course";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { FilterDialog } from '@/components/FilterDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/SortDialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { PrintLayout } from '@/components/PrintLayout';
import { TableHeaderSection } from '@/components/TableHeaderSection';
import { TableRowActions } from '@/components/TableRowActions';
import { TableCardView } from '@/components/TableCardView';
import { TableList, TableListColumn } from '@/components/TableList';
import CourseFormDialog from '@/components/forms/CourseFormDialog';
import { ViewDialog } from '@/components/ViewDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

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
                onChange={(e) => {
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

const exportableColumns: { key: string; label: string }[] = courseColumns.map((col) => ({ key: col.key, label: col.label }));

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
  const [statusFilter, setStatusFilter] = useState<"all" | CourseStatus>("all");
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    let filtered = fuzzyResults.map((r: FuseResultType<Course>) => r.item);

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

  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map((col) => col.key));

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
      {/* TOP */}
      <TableHeaderSection
        title="All Courses"
        description="Manage and view all course information"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onRefresh={() => fetchCourses(true)}
        isRefreshing={isRefreshing}
        onFilterClick={() => setFilterDialogOpen(true)}
        onSortClick={() => setSortDialogOpen(true)}
        onExportClick={() => setExportDialogOpen(true)}
        onPrintClick={handlePrint}
        onAddClick={() => setAddModalOpen(true)}
        activeFilterCount={
          columnFilters.filter(f => f.value).length +
          Object.values(advancedFilters).filter(Boolean).length
        }
        searchPlaceholder="Search courses..."
        addButtonLabel="Add Course"
      />

      {/* Print Header and Table - Only visible when printing */}
      <div className="print-content">
        {/* Table layout for xl+ only */}
        <div className="hidden xl:block">
          <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md relative">
            {/* Loader overlay when refreshing */}
            {isRefreshing && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
            )}
            <TableList
              columns={columns}
              data={paginatedCourses}
              loading={loading}
              selectedIds={selectedIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              getItemId={(item) => item.id}
            />
          </div>
        </div>
        {/* Card layout for small screens */}
        <div className="block xl:hidden">
          <TableCardView
            items={paginatedCourses}
            selectedIds={selectedIds}
            onSelect={handleSelectRow}
            onView={(item) => {
              setSelectedCourse(item);
              setEditModalOpen(true);
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
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          entityLabel="course"
          actions={[
            {
              key: 'delete',
              label: 'Delete Selected',
              icon: isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
              onClick: handleBulkDelete,
              loading: isDeleting,
              disabled: isDeleting,
              tooltip: 'Delete selected courses',
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
          onPageChange={setCurrentPage}
        />
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

      <FilterDialog<"all" | CourseStatus>
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusOptions={[
          { value: 'all', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'ARCHIVED', label: 'Archived' },
          { value: 'PENDING_REVIEW', label: 'Pending Review' },
        ]}
        advancedFilters={advancedFilters}
        setAdvancedFilters={filters => setAdvancedFilters({
          department: filters.department || '',
          minUnits: filters.minUnits || '',
          maxUnits: filters.maxUnits || '',
          minStudents: filters.minStudents || '',
          maxStudents: filters.maxStudents || '',
          minInstructors: filters.minInstructors || '',
          maxInstructors: filters.maxInstructors || '',
        })}
        fields={[
          { key: 'department', label: 'Department', type: 'text', badgeType: 'active' },
          { key: 'minUnits', label: 'Units', type: 'number', badgeType: 'range', minKey: 'minUnits', maxKey: 'maxUnits' },
          { key: 'minStudents', label: 'Students', type: 'number', badgeType: 'range', minKey: 'minStudents', maxKey: 'maxStudents' },
          { key: 'minInstructors', label: 'Instructors', type: 'number', badgeType: 'range', minKey: 'minInstructors', maxKey: 'maxInstructors' },
        ]}
        onReset={() => {
          setStatusFilter('all');
          setAdvancedFilters({
            department: '',
            minUnits: '',
            maxUnits: '',
            minStudents: '',
            maxStudents: '',
            minInstructors: '',
            maxInstructors: ''
          });
        }}
        onApply={() => setFilterDialogOpen(false)}
        activeAdvancedCount={Object.values(advancedFilters).filter(Boolean).length}
        title="Filter Courses"
        tooltip="Filter courses by multiple criteria. Use advanced filters for more specific conditions."
      />

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
        exportableColumns={exportableColumns}
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
